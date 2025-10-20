import React, { createContext, useContext, useEffect, useState } from 'react'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'

export interface Business {
  id: string
  name: string
  email: string
  phone: string
  address: string
  businessType: string
  createdAt: Date
  ownerId: string
  businessAuthorizationCode: string
  systemAuthorizationCode: string
  settings: {
    mainStoreLocation: string
    approvalRoles: string[]
    currency: string
    timezone: string
  }
}

export interface BusinessMember {
  id: string
  userId: string
  role: 'admin' | 'sales_rep' | 'inventory_manager' | 'packer' | 'accountant' | 'customer'
  status: 'active' | 'pending' | 'suspended'
  joinedAt: Date
  approvedBy?: string
  approvedAt?: Date
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface BusinessContextType {
  currentBusiness: Business | null
  businesses: Business[]
  pendingMembers: BusinessMember[]
  setCurrentBusiness: (business: Business | null) => void
  createBusiness: (businessData: Omit<Business, 'id' | 'createdAt' | 'businessAuthorizationCode' | 'systemAuthorizationCode'>, codes: { businessCode: string; systemCode: string }) => Promise<void>
  joinBusiness: (authorizationCode: string, role: 'admin' | 'sales_rep' | 'inventory_manager' | 'packer' | 'accountant' | 'customer' | 'business_owner', systemAuthCode?: string) => Promise<void>
  approveMember: (memberId: string) => Promise<void>
  rejectMember: (memberId: string) => Promise<void>
  loading: boolean
}

const BusinessContext = createContext<BusinessContextType>({} as BusinessContextType)

export const useBusiness = () => {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [pendingMembers, setPendingMembers] = useState<BusinessMember[]>([])
  const [loading, setLoading] = useState(true)

  const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt' | 'businessAuthorizationCode' | 'systemAuthorizationCode'>, codes: { businessCode: string; systemCode: string }) => {
    if (!currentUser) throw new Error('User must be authenticated')
    
    // Get user details from localStorage
    const userProfile = localStorage.getItem('userProfile')
    const userData = userProfile ? JSON.parse(userProfile) : {}
    
    // Create business collection using business name (sanitized)
    const businessName = businessData.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
    const businessId = businessName
    
    const businessInfo = {
      ...businessData,
      createdAt: new Date(),
      ownerId: currentUser.uid,
      businessAuthorizationCode: codes.businessCode,
      systemAuthorizationCode: codes.systemCode
    }
    
    // Create business collection with main document
    const businessRef = doc(db, businessId, 'main')
    await setDoc(businessRef, businessInfo)
    
    // Index business in global registry for discovery and code lookups
    await setDoc(doc(db, 'business_registry', businessId), {
      id: businessId,
      name: businessData.name,
      businessAuthorizationCode: codes.businessCode,
      systemAuthorizationCode: codes.systemCode,
      createdAt: new Date(),
      ownerId: currentUser.uid
    })
    
    // Add the creator as admin member in users subcollection with user details
    const memberRef = doc(collection(db, businessId, 'main', 'users'))
    await setDoc(memberRef, {
      userId: currentUser.uid,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(),
      approvedBy: currentUser.uid,
      approvedAt: new Date(),
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: currentUser.email || '',
      phone: userData.phone || ''
    })
    
    // Clear localStorage after successful business creation
    localStorage.removeItem('userProfile')
    
    const newBusiness: Business = {
      id: businessId,
      ...businessInfo
    }
    
    setCurrentBusiness(newBusiness)
    localStorage.setItem('currentBusinessId', newBusiness.id)
  }

  const joinBusiness = async (authorizationCode: string, role: 'admin' | 'sales_rep' | 'inventory_manager' | 'packer' | 'accountant' | 'customer' | 'business_owner', systemAuthCode?: string) => {
    if (!currentUser) throw new Error('User must be authenticated')
    
    // Find business by authorization code in the registry
    const businessCollections = await getDocs(collection(db, 'business_registry'))
    let business: Business | null = null
    let businessCollectionName = ''
    
    for (const businessDoc of businessCollections.docs) {
      const businessData = businessDoc.data()
      if (businessData.businessAuthorizationCode === authorizationCode) {
        business = { id: businessDoc.id, ...businessData } as Business
        businessCollectionName = businessDoc.id
        break
      }
    }
    
    if (!business) {
      throw new Error('Invalid business authorization code')
    }
    
    // Check if user has system authorization code for admin role
    if (role === 'admin') {
      if (!systemAuthCode || systemAuthCode !== business.systemAuthorizationCode) {
        throw new Error('Invalid system authorization code for admin role')
      }
    }
    
    // Check if user is already a member
    const existingMemberQuery = query(
      collection(db, businessCollectionName, 'main', 'users'),
      where('userId', '==', currentUser.uid)
    )
    const existingMemberSnapshot = await getDocs(existingMemberQuery)
    
    if (!existingMemberSnapshot.empty) {
      throw new Error('You are already a member of this business')
    }
    
    // Get user details from localStorage
    const userProfile = localStorage.getItem('userProfile')
    const userData = userProfile ? JSON.parse(userProfile) : {}
    
    // Add user to business users with pending status (except admin with system code)
    const memberRef = doc(collection(db, businessCollectionName, 'main', 'users'))
    const memberData = {
      userId: currentUser.uid,
      role,
      status: (role === 'admin' && systemAuthCode === business.systemAuthorizationCode) ? 'active' : 'pending',
      joinedAt: new Date(),
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: currentUser.email || '',
      phone: userData.phone || '',
      ...(role === 'admin' && systemAuthCode === business.systemAuthorizationCode ? {
        approvedBy: currentUser.uid,
        approvedAt: new Date()
      } : {})
    }
    
    await setDoc(memberRef, memberData)
    
    // Clear localStorage after successful join
    localStorage.removeItem('userProfile')
    
    // If admin with system code, set as current business immediately
    if (role === 'admin' && systemAuthCode === business.systemAuthorizationCode) {
      setCurrentBusiness(business)
      localStorage.setItem('currentBusinessId', business.id)
    }
  }

  const approveMember = async (memberId: string) => {
    if (!currentBusiness || !currentUser) throw new Error('User must be authenticated')
    
    const memberRef = doc(db, currentBusiness.id, 'main', 'users', memberId)
    await setDoc(memberRef, {
      status: 'active',
      approvedBy: currentUser.uid,
      approvedAt: new Date()
    }, { merge: true })
    
    // Refresh pending members
    fetchPendingMembers()
  }

  const rejectMember = async (memberId: string) => {
    if (!currentBusiness || !currentUser) throw new Error('User must be authenticated')
    
    const memberRef = doc(db, currentBusiness.id, 'main', 'users', memberId)
    await setDoc(memberRef, {
      status: 'suspended',
      approvedBy: currentUser.uid,
      approvedAt: new Date()
    }, { merge: true })
    
    // Refresh pending members
    fetchPendingMembers()
  }

  const fetchPendingMembers = async () => {
    if (!currentBusiness || !currentUser) return
    
    try {
      const membersQuery = query(
        collection(db, currentBusiness.id, 'main', 'users'),
        where('status', '==', 'pending')
      )
      
      const querySnapshot = await getDocs(membersQuery)
      const pending = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate() || new Date()
      })) as BusinessMember[]
      
      setPendingMembers(pending)
    } catch (error) {
      console.error('Error fetching pending members:', error)
      setPendingMembers([])
    }
  }

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
    // Get all business collections where user is a member (via registry)
        const userBusinesses: Business[] = []
        
        // Check each registered business for user membership
        const businessesSnapshot = await getDocs(collection(db, 'business_registry'))
        
        for (const businessDoc of businessesSnapshot.docs) {
          const businessId = businessDoc.id
          const businessData = businessDoc.data()
          
          // Check if user is a member of this business
          const membersQuery = query(
            collection(db, businessId, 'main', 'users'),
            where('userId', '==', currentUser.uid)
          )
          const membersSnapshot = await getDocs(membersQuery)
          
          if (!membersSnapshot.empty) {
            userBusinesses.push({
              id: businessId,
              ...businessData
            } as Business)
          }
        }
        
        setBusinesses(userBusinesses)
        
        // Restore selected business from localStorage or pick first
        const savedId = localStorage.getItem('currentBusinessId')
        if (savedId) {
          const match = userBusinesses.find(b => b.id === savedId)
          if (match) setCurrentBusiness(match)
          else if (userBusinesses.length > 0 && !currentBusiness) setCurrentBusiness(userBusinesses[0])
        } else if (userBusinesses.length > 0 && !currentBusiness) {
          setCurrentBusiness(userBusinesses[0])
        }
      } catch (error: any) {
        console.error('Error fetching businesses:', error)
        
        // Handle quota exceeded error specifically
        if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
          console.log('Firebase quota exceeded, using mock business for testing')
          const mockBusiness: Business = {
            id: 'mock-business-id',
            name: 'Test Business',
            email: 'test@business.com',
            phone: '+1234567890',
            address: '123 Test Street',
            businessType: 'Retail',
            createdAt: new Date(),
            ownerId: currentUser?.uid || 'mock-owner',
            businessAuthorizationCode: 'TEST123',
            systemAuthorizationCode: 'SYSTEM123',
            settings: {
              mainStoreLocation: 'Main Store',
              approvalRoles: ['admin', 'sales_rep'],
              currency: 'TZS',
              timezone: 'Africa/Dar_es_Salaam'
            }
          }
          setBusinesses([mockBusiness])
          setCurrentBusiness(mockBusiness)
          localStorage.setItem('currentBusinessId', mockBusiness.id)
        } else if (error.message?.includes('BLOCKED_BY_CLIENT') || error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
          console.log('Firebase blocked, using mock business for testing')
          const mockBusiness: Business = {
            id: 'mock-business-id',
            name: 'Test Business',
            email: 'test@business.com',
            phone: '+1234567890',
            address: '123 Test Street',
            businessType: 'Retail',
            createdAt: new Date(),
            ownerId: currentUser?.uid || 'mock-owner',
            businessAuthorizationCode: 'TEST123',
            systemAuthorizationCode: 'SYSTEM123',
            settings: {
              mainStoreLocation: 'Main Store',
              approvalRoles: ['admin', 'sales_rep'],
              currency: 'TZS',
              timezone: 'Africa/Dar_es_Salaam'
            }
          }
          setBusinesses([mockBusiness])
          setCurrentBusiness(mockBusiness)
          localStorage.setItem('currentBusinessId', mockBusiness.id)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [currentUser, currentBusiness])

  useEffect(() => {
    if (currentBusiness) {
      fetchPendingMembers()
    }
  }, [currentBusiness])

  const value = {
    currentBusiness,
    businesses,
    pendingMembers,
    setCurrentBusiness,
    createBusiness,
    joinBusiness,
    approveMember,
    rejectMember,
    loading
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

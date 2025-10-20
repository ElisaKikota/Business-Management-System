import React, { createContext, useContext, useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import { useBusiness } from './BusinessContext'

interface UserApprovalStatus {
  isApproved: boolean
  businessId: string | null
  role: string | null
  status: 'active' | 'pending' | 'suspended' | null
  loading: boolean
}

interface UserApprovalContextType {
  approvalStatus: UserApprovalStatus
  checkUserApproval: () => Promise<void>
}

const UserApprovalContext = createContext<UserApprovalContextType>({} as UserApprovalContextType)

export const useUserApproval = () => {
  const context = useContext(UserApprovalContext)
  if (!context) {
    throw new Error('useUserApproval must be used within a UserApprovalProvider')
  }
  return context
}

export const UserApprovalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  const { currentBusiness } = useBusiness()
  const [approvalStatus, setApprovalStatus] = useState<UserApprovalStatus>({
    isApproved: false,
    businessId: null,
    role: null,
    status: null,
    loading: true
  })

  const checkUserApproval = async () => {
    if (!currentUser) {
      setApprovalStatus({
        isApproved: false,
        businessId: null,
        role: null,
        status: null,
        loading: false
      })
      return
    }

    try {
      // 1) Prefer current selected business (fast path)
      if (currentBusiness) {
        const membersQuery = query(
          collection(db, currentBusiness.id, 'main', 'users'),
          where('userId', '==', currentUser.uid)
        )
        const membersSnapshot = await getDocs(membersQuery)
        if (!membersSnapshot.empty) {
          const memberData = membersSnapshot.docs[0].data()
          const isApproved = memberData.status === 'active'
          setApprovalStatus({
            isApproved,
            businessId: currentBusiness.id,
            role: memberData.role,
            status: memberData.status,
            loading: false
          })
          return
        }
      }

      // 2) Fallback: discover via registry and check membership
      const businessesSnapshot = await getDocs(collection(db, 'business_registry'))
      for (const businessDoc of businessesSnapshot.docs) {
        const businessId = businessDoc.id
        const membersQuery = query(
          collection(db, businessId, 'main', 'users'),
          where('userId', '==', currentUser.uid)
        )
        const membersSnapshot = await getDocs(membersQuery)
        if (!membersSnapshot.empty) {
          const memberData = membersSnapshot.docs[0].data()
          const isApproved = memberData.status === 'active'
          setApprovalStatus({
            isApproved,
            businessId,
            role: memberData.role,
            status: memberData.status,
            loading: false
          })
          return
        }
      }
      
      // User not found in any business
      setApprovalStatus({
        isApproved: false,
        businessId: null,
        role: null,
        status: null,
        loading: false
      })
    } catch (error: any) {
      console.error('Error checking user approval:', error)
      
      // Handle quota exceeded error specifically - allow access for testing
      if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
        console.log('Firebase quota exceeded, allowing access for testing')
        setApprovalStatus({
          isApproved: true,
          businessId: currentBusiness?.id || null,
          role: 'sales_rep',
          status: 'active',
          loading: false
        })
      } else {
        setApprovalStatus({
          isApproved: false,
          businessId: null,
          role: null,
          status: null,
          loading: false
        })
      }
    }
  }

  useEffect(() => {
    checkUserApproval()
  }, [currentUser, currentBusiness])

  const value = {
    approvalStatus,
    checkUserApproval
  }

  return (
    <UserApprovalContext.Provider value={value}>
      {children}
    </UserApprovalContext.Provider>
  )
}

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useBusiness } from './BusinessContext'
import { useAuth } from './AuthContext'

export interface ApprovalRole {
  id?: string
  name: string
  description: string
  canApproveOrders: boolean
  canApproveCredit: boolean
  canApproveTransfers: boolean
  maxApprovalAmount: number
  requiresSecondaryApproval: boolean
  secondaryApprovalAmount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApprovalUser {
  id?: string
  userId: string
  userName: string
  userEmail: string
  roleId: string
  roleName: string
  isActive: boolean
  assignedBy: string
  assignedAt: string
}

export interface BusinessUser {
  id?: string
  userId: string
  userName: string
  userEmail: string
  role: string
  status: 'active' | 'pending' | 'suspended'
  joinedAt: string
  invitedBy: string
}

// Default approval roles that should be created automatically
const DEFAULT_APPROVAL_ROLES = [
  {
    name: 'admin',
    description: 'Full system access and administrative privileges',
    canApproveOrders: true,
    canApproveCredit: true,
    canApproveTransfers: true,
    maxApprovalAmount: 10000000, // 10M TZS
    requiresSecondaryApproval: false,
    secondaryApprovalAmount: 0,
    isActive: true
  },
  {
    name: 'Business Owner',
    description: 'Oversees all business operations and has final approval authority',
    canApproveOrders: true,
    canApproveCredit: true,
    canApproveTransfers: true,
    maxApprovalAmount: 10000000, // 10M TZS
    requiresSecondaryApproval: false,
    secondaryApprovalAmount: 0,
    isActive: true
  },
  {
    name: 'sales_rep',
    description: 'Handles customer sales and order processing',
    canApproveOrders: true,
    canApproveCredit: false,
    canApproveTransfers: false,
    maxApprovalAmount: 1000000, // 1M TZS
    requiresSecondaryApproval: true,
    secondaryApprovalAmount: 500000, // 500K TZS
    isActive: true
  }
]

interface UserManagementContextType {
  // Approval Roles
  approvalRoles: ApprovalRole[]
  rolesLoading: boolean
  
  // Approval Users
  approvalUsers: ApprovalUser[]
  usersLoading: boolean
  
  // Business Users
  businessUsers: BusinessUser[]
  businessUsersLoading: boolean
  
  // Error handling
  error: string | null
  
  // Role management
  fetchApprovalRoles: () => Promise<void>
  createApprovalRole: (roleData: Omit<ApprovalRole, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateApprovalRole: (roleId: string, updates: Partial<ApprovalRole>) => Promise<void>
  deleteApprovalRole: (roleId: string) => Promise<void>
  
  // User management
  fetchApprovalUsers: () => Promise<void>
  assignUserToRole: (userData: Omit<ApprovalUser, 'id' | 'assignedBy' | 'assignedAt'>) => Promise<string>
  updateApprovalUser: (userId: string, updates: Partial<ApprovalUser>) => Promise<void>
  removeApprovalUser: (userId: string) => Promise<void>
  
  // Business users
  fetchBusinessUsers: () => Promise<void>
  getBusinessUserById: (userId: string) => BusinessUser | undefined
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

export const useUserManagement = () => {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider')
  }
  return context
}

interface UserManagementProviderProps {
  children: ReactNode
}

export const UserManagementProvider = ({ children }: UserManagementProviderProps) => {
  const { currentBusiness } = useBusiness()
  const { currentUser } = useAuth()
  const [approvalRoles, setApprovalRoles] = useState<ApprovalRole[]>([])
  const [approvalUsers, setApprovalUsers] = useState<ApprovalUser[]>([])
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [businessUsersLoading, setBusinessUsersLoading] = useState(false)
  const [rolesFetched, setRolesFetched] = useState(false)
  const [usersFetched, setUsersFetched] = useState(false)
  const [businessUsersFetched, setBusinessUsersFetched] = useState(false)
  const [autoAssignmentAttempted, setAutoAssignmentAttempted] = useState(false)
  const [defaultRolesCreated, setDefaultRolesCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch approval roles
  const fetchApprovalRoles = useCallback(async () => {
    if (!currentBusiness) return

    setRolesLoading(true)
    try {
      setError(null)
      const rolesRef = collection(db, currentBusiness.id, 'main', 'approval_roles')
      const rolesQuery = query(rolesRef, orderBy('createdAt', 'desc'))
      const rolesSnapshot = await getDocs(rolesQuery)
      
      const rolesData: ApprovalRole[] = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as ApprovalRole[]
      
      setApprovalRoles(rolesData)
      setRolesFetched(true)
    } catch (err: any) {
      console.error('Error fetching approval roles:', err)
      setError(err.message || 'Failed to fetch approval roles')
    } finally {
      setRolesLoading(false)
    }
  }, [currentBusiness])

  // Fetch approval users
  const fetchApprovalUsers = useCallback(async () => {
    if (!currentBusiness) return

    setUsersLoading(true)
    try {
      setError(null)
      const usersRef = collection(db, currentBusiness.id, 'main', 'approval_users')
      const usersQuery = query(usersRef, orderBy('assignedAt', 'desc'))
      const usersSnapshot = await getDocs(usersQuery)
      
      const usersData: ApprovalUser[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate?.()?.toISOString() || doc.data().assignedAt
      })) as ApprovalUser[]
      
      setApprovalUsers(usersData)
      setUsersFetched(true)
    } catch (err: any) {
      console.error('Error fetching approval users:', err)
      setError(err.message || 'Failed to fetch approval users')
    } finally {
      setUsersLoading(false)
    }
  }, [currentBusiness])

  // Fetch business users
  const fetchBusinessUsers = useCallback(async () => {
    if (!currentBusiness) return

    setBusinessUsersLoading(true)
    try {
      setError(null)
      const usersRef = collection(db, currentBusiness.id, 'main', 'users')
      const usersQuery = query(usersRef, orderBy('joinedAt', 'desc'))
      const usersSnapshot = await getDocs(usersQuery)
      
      const usersData: BusinessUser[] = usersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId || data.uid || '',
          userName: data.userName || data.displayName || data.firstName + ' ' + data.lastName || data.email || 'Unknown User',
          userEmail: data.userEmail || data.email || '',
          role: data.role || '',
          status: data.status || 'active',
          joinedAt: data.joinedAt?.toDate?.()?.toISOString() || data.joinedAt || new Date().toISOString(),
          invitedBy: data.invitedBy || ''
        }
      })
      
      setBusinessUsers(usersData)
      setBusinessUsersFetched(true)
    } catch (err: any) {
      console.error('Error fetching business users:', err)
      setError(err.message || 'Failed to fetch business users')
    } finally {
      setBusinessUsersLoading(false)
    }
  }, [currentBusiness])

  // Reset flags when business changes
  useEffect(() => {
    setAutoAssignmentAttempted(false)
    setDefaultRolesCreated(false)
  }, [currentBusiness])

  // Auto-fetch data when business changes
  useEffect(() => {
    if (currentBusiness && !rolesFetched) {
      console.log('Fetching approval roles...')
      fetchApprovalRoles()
    }
  }, [currentBusiness, rolesFetched, fetchApprovalRoles])

  useEffect(() => {
    if (currentBusiness && !usersFetched) {
      console.log('Fetching approval users...')
      fetchApprovalUsers()
    }
  }, [currentBusiness, usersFetched, fetchApprovalUsers])

  useEffect(() => {
    if (currentBusiness && !businessUsersFetched) {
      console.log('Fetching business users...')
      fetchBusinessUsers()
    }
  }, [currentBusiness, businessUsersFetched, fetchBusinessUsers])

  // Create default approval roles if none exist
  const createDefaultApprovalRoles = useCallback(async () => {
    if (!currentBusiness || approvalRoles.length > 0 || defaultRolesCreated) return

    try {
      setDefaultRolesCreated(true)
      setRolesLoading(true)
      const batch = writeBatch(db)
      const rolesRef = collection(db, currentBusiness.id, 'main', 'approval_roles')

      for (const defaultRole of DEFAULT_APPROVAL_ROLES) {
        const newRoleRef = doc(rolesRef)
        batch.set(newRoleRef, {
          ...defaultRole,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      await batch.commit()
      console.log('Default approval roles created')
      // Re-fetch roles to update state
      await fetchApprovalRoles()
    } catch (err: any) {
      console.error('Error creating default approval roles:', err)
      setError(err.message || 'Failed to create default approval roles')
      // Reset the flag so it can be retried
      setDefaultRolesCreated(false)
    } finally {
      setRolesLoading(false)
    }
  }, [currentBusiness, approvalRoles.length, defaultRolesCreated, fetchApprovalRoles])

  // Auto-assign users with default roles to approval users
  const autoAssignDefaultUsers = useCallback(async () => {
    if (!currentBusiness || !approvalRoles.length || !businessUsers.length || autoAssignmentAttempted) return

    try {
      setAutoAssignmentAttempted(true)
      const existingApprovalUserIds = approvalUsers.map(au => au.userId)
      const defaultRoleNames = DEFAULT_APPROVAL_ROLES.map(role => role.name)
      
      // Find business users with default roles who aren't already approval users
      const usersToAssign = businessUsers.filter(bUser => 
        defaultRoleNames.includes(bUser.role) && 
        !existingApprovalUserIds.includes(bUser.userId) &&
        bUser.status === 'active' &&
        bUser.userId && // Ensure userId exists
        (bUser.userName || bUser.userEmail) // Ensure we have a name or email
      )

      if (usersToAssign.length === 0) {
        console.log('No users to auto-assign')
        return
      }

      console.log(`Attempting to auto-assign ${usersToAssign.length} users`)
      const batch = writeBatch(db)
      const approvalUsersRef = collection(db, currentBusiness.id, 'main', 'approval_users')

      for (const user of usersToAssign) {
        // Find the corresponding approval role
        const approvalRole = approvalRoles.find(role => role.name === user.role)
        if (approvalRole && approvalRole.id) {
          const newApprovalUserRef = doc(approvalUsersRef)
          
          // Create the approval user data with safe values
          const approvalUserData = {
            userId: user.userId,
            userName: user.userName || user.userEmail || 'Unknown User',
            userEmail: user.userEmail || '',
            roleId: approvalRole.id,
            roleName: approvalRole.name,
            isActive: true,
            assignedBy: currentUser?.uid || 'system',
            assignedAt: serverTimestamp()
          }
          
          batch.set(newApprovalUserRef, approvalUserData)
        }
      }

      await batch.commit()
      console.log(`Successfully auto-assigned ${usersToAssign.length} users to approval roles`)
      // Re-fetch approval users to update state
      await fetchApprovalUsers()
    } catch (err: any) {
      console.error('Error auto-assigning users:', err)
      setError(err.message || 'Failed to auto-assign users')
      // Reset the flag so it can be retried later
      setAutoAssignmentAttempted(false)
    }
  }, [currentBusiness, approvalRoles, businessUsers, approvalUsers, currentUser, fetchApprovalUsers, autoAssignmentAttempted])

  // Auto-create default roles when roles are fetched and empty
  useEffect(() => {
    if (currentBusiness && rolesFetched && approvalRoles.length === 0 && !defaultRolesCreated) {
      console.log('Creating default approval roles...')
      createDefaultApprovalRoles()
    }
  }, [currentBusiness, rolesFetched, approvalRoles.length, defaultRolesCreated, createDefaultApprovalRoles])

  // Auto-assign users when all data is available (only once)
  // Temporarily disabled to prevent flickering
  // useEffect(() => {
  //   if (currentBusiness && rolesFetched && usersFetched && businessUsersFetched && !autoAssignmentAttempted) {
  //     autoAssignDefaultUsers()
  //   }
  // }, [currentBusiness, rolesFetched, usersFetched, businessUsersFetched, autoAssignmentAttempted, autoAssignDefaultUsers])

  // Create approval role
  const createApprovalRole = async (roleData: Omit<ApprovalRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!currentBusiness || !currentUser) throw new Error('No business or user selected')

    try {
      setError(null)
      
      const rolePayload = {
        ...roleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(rolePayload).forEach(key => {
        if ((rolePayload as any)[key] === undefined) delete (rolePayload as any)[key]
      })

      const rolesRef = collection(db, currentBusiness.id, 'main', 'approval_roles')
      const docRef = await addDoc(rolesRef, rolePayload)
      
      const newRole: ApprovalRole = {
        id: docRef.id,
        ...roleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setApprovalRoles(prev => [newRole, ...prev])
      
      return docRef.id
    } catch (err: any) {
      console.error('Error creating approval role:', err)
      setError(err.message || 'Failed to create approval role')
      throw err
    }
  }

  // Update approval role
  const updateApprovalRole = async (roleId: string, updates: Partial<ApprovalRole>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const roleRef = doc(db, currentBusiness.id, 'main', 'approval_roles', roleId)
      const updatePayload = {
        ...updates,
        updatedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if ((updatePayload as any)[key] === undefined) delete (updatePayload as any)[key]
      })

      await updateDoc(roleRef, updatePayload)
      
      setApprovalRoles(prev => prev.map(role => 
        role.id === roleId 
          ? { ...role, ...updates, updatedAt: new Date().toISOString() }
          : role
      ))
    } catch (err: any) {
      console.error('Error updating approval role:', err)
      setError(err.message || 'Failed to update approval role')
      throw err
    }
  }

  // Delete approval role
  const deleteApprovalRole = async (roleId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const roleRef = doc(db, currentBusiness.id, 'main', 'approval_roles', roleId)
      await deleteDoc(roleRef)
      
      setApprovalRoles(prev => prev.filter(role => role.id !== roleId))
      // Also remove users assigned to this role
      setApprovalUsers(prev => prev.filter(user => user.roleId !== roleId))
    } catch (err: any) {
      console.error('Error deleting approval role:', err)
      setError(err.message || 'Failed to delete approval role')
      throw err
    }
  }

  // Assign user to role
  const assignUserToRole = async (userData: Omit<ApprovalUser, 'id' | 'assignedBy' | 'assignedAt'>): Promise<string> => {
    if (!currentBusiness || !currentUser) throw new Error('No business or user selected')

    try {
      setError(null)
      
      const userPayload = {
        ...userData,
        assignedBy: currentUser.uid,
        assignedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(userPayload).forEach(key => {
        if ((userPayload as any)[key] === undefined) delete (userPayload as any)[key]
      })

      const usersRef = collection(db, currentBusiness.id, 'main', 'approval_users')
      const docRef = await addDoc(usersRef, userPayload)
      
      const newUser: ApprovalUser = {
        id: docRef.id,
        ...userData,
        assignedBy: currentUser.uid,
        assignedAt: new Date().toISOString()
      }
      
      setApprovalUsers(prev => [newUser, ...prev])
      
      return docRef.id
    } catch (err: any) {
      console.error('Error assigning user to role:', err)
      setError(err.message || 'Failed to assign user to role')
      throw err
    }
  }

  // Update approval user
  const updateApprovalUser = async (userId: string, updates: Partial<ApprovalUser>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const userRef = doc(db, currentBusiness.id, 'main', 'approval_users', userId)
      const updatePayload = {
        ...updates
      }

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if ((updatePayload as any)[key] === undefined) delete (updatePayload as any)[key]
      })

      await updateDoc(userRef, updatePayload)
      
      setApprovalUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...updates }
          : user
      ))
    } catch (err: any) {
      console.error('Error updating approval user:', err)
      setError(err.message || 'Failed to update approval user')
      throw err
    }
  }

  // Remove approval user
  const removeApprovalUser = async (userId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const userRef = doc(db, currentBusiness.id, 'main', 'approval_users', userId)
      await deleteDoc(userRef)
      
      setApprovalUsers(prev => prev.filter(user => user.id !== userId))
    } catch (err: any) {
      console.error('Error removing approval user:', err)
      setError(err.message || 'Failed to remove approval user')
      throw err
    }
  }

  // Get business user by ID
  const getBusinessUserById = useCallback((userId: string): BusinessUser | undefined => {
    return businessUsers.find(user => user.userId === userId)
  }, [businessUsers])

  const value: UserManagementContextType = {
    approvalRoles,
    rolesLoading,
    approvalUsers,
    usersLoading,
    businessUsers,
    businessUsersLoading,
    error,
    fetchApprovalRoles,
    createApprovalRole,
    updateApprovalRole,
    deleteApprovalRole,
    fetchApprovalUsers,
    assignUserToRole,
    updateApprovalUser,
    removeApprovalUser,
    fetchBusinessUsers,
    getBusinessUserById,
    initializeDefaultRolePermissions: async () => {
      if (!currentBusiness) return
      
      try {
        console.log('Initializing default role permissions...')
        
        const rolePermissionsRef = collection(db, currentBusiness.id, 'main', 'role_permissions')
        
        // Check if role permissions already exist
        const existingSnapshot = await getDocs(rolePermissionsRef)
        if (!existingSnapshot.empty) {
          console.log('Role permissions already exist')
          return
        }
        
        const batch = writeBatch(db)
        
        // Define default role permissions
        const defaultRolePermissions = {
          admin: {
            role: 'admin',
            permissions: [
              'view_dashboard', 'view_orders', 'create_orders', 'edit_orders', 'approve_orders', 'delete_orders',
              'view_inventory', 'manage_inventory', 'view_stores', 'manage_stores', 'manage_transfers',
              'view_customers', 'manage_customers', 'view_customer_accounts', 'manage_credit',
              'view_sales', 'create_sales', 'view_reports', 'view_financial_reports',
              'view_settings', 'manage_users', 'manage_system', 'view_approvals'
            ],
            menuItems: ['dashboard', 'orders', 'inventory', 'customers', 'sales', 'delivery', 'invoicing', 'reports', 'settings', 'help'],
            canAccessSettings: true,
            canManageUsers: true,
            canViewReports: true,
            canManageInventory: true,
            canManageOrders: true,
            canManageCustomers: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          business_owner: {
            role: 'business_owner',
            permissions: [
              'view_dashboard', 'view_orders', 'create_orders', 'edit_orders', 'approve_orders', 'delete_orders',
              'view_inventory', 'manage_inventory', 'view_stores', 'manage_stores', 'manage_transfers',
              'view_customers', 'manage_customers', 'view_customer_accounts', 'manage_credit',
              'view_sales', 'create_sales', 'view_reports', 'view_financial_reports',
              'view_settings', 'manage_users', 'manage_system', 'view_approvals'
            ],
            menuItems: ['dashboard', 'orders', 'inventory', 'customers', 'sales', 'delivery', 'invoicing', 'reports', 'settings', 'help'],
            canAccessSettings: true,
            canManageUsers: true,
            canViewReports: true,
            canManageInventory: true,
            canManageOrders: true,
            canManageCustomers: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          sales_rep: {
            role: 'sales_rep',
            permissions: [
              'view_dashboard', 'view_orders', 'create_orders', 'edit_orders', 'view_customers', 
              'manage_customers', 'view_sales', 'create_sales', 'view_inventory'
            ],
            menuItems: ['dashboard', 'orders', 'customers', 'sales', 'help'],
            canAccessSettings: false,
            canManageUsers: false,
            canViewReports: false,
            canManageInventory: false,
            canManageOrders: true,
            canManageCustomers: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          inventory_manager: {
            role: 'inventory_manager',
            permissions: [
              'view_dashboard', 'view_inventory', 'manage_inventory', 'view_stores', 'manage_stores', 
              'manage_transfers', 'view_orders', 'view_customers'
            ],
            menuItems: ['dashboard', 'inventory', 'orders', 'customers', 'help'],
            canAccessSettings: false,
            canManageUsers: false,
            canViewReports: false,
            canManageInventory: true,
            canManageOrders: false,
            canManageCustomers: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          packer: {
            role: 'packer',
            permissions: [
              'view_dashboard', 'view_orders', 'edit_orders', 'prepare_orders', 
              'view_inventory', 'view_delivery', 'manage_delivery', 'view_settings'
            ],
            menuItems: ['dashboard', 'orders', 'preparation', 'delivery', 'settings', 'help'],
            canAccessSettings: true,
            canManageUsers: false,
            canViewReports: false,
            canManageInventory: false,
            canManageOrders: true,
            canManageCustomers: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          accountant: {
            role: 'accountant',
            permissions: [
              'view_dashboard', 'view_orders', 'view_customers', 'view_sales', 'view_reports', 
              'view_financial_reports', 'view_inventory'
            ],
            menuItems: ['dashboard', 'orders', 'customers', 'sales', 'reports', 'help'],
            canAccessSettings: false,
            canManageUsers: false,
            canViewReports: true,
            canManageInventory: false,
            canManageOrders: false,
            canManageCustomers: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          customer: {
            role: 'customer',
            permissions: ['view_dashboard', 'view_orders'],
            menuItems: ['dashboard', 'orders', 'help'],
            canAccessSettings: false,
            canManageUsers: false,
            canViewReports: false,
            canManageInventory: false,
            canManageOrders: false,
            canManageCustomers: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        }
        
        // Create documents for each role
        for (const [, roleData] of Object.entries(defaultRolePermissions)) {
          const docRef = doc(rolePermissionsRef)
          batch.set(docRef, roleData)
        }
        
        await batch.commit()
        console.log('Default role permissions initialized')
      } catch (error) {
        console.error('Error initializing role permissions:', error)
      }
    }
  }

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  )
}

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useBusiness } from './BusinessContext'
import { useUserApproval } from './UserApprovalContext'

export interface RolePermission {
  id: string
  name: string
  description: string
  category: string
}

export interface RolePermissions {
  role: string
  permissions: string[]
  menuItems: string[]
  canAccessSettings: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canManageInventory: boolean
  canManageOrders: boolean
  canManageCustomers: boolean
}

interface RoleContextType {
  currentUserRole: string | null
  userPermissions: RolePermissions | null
  availablePermissions: RolePermission[]
  updateUserPermissions: (userId: string, permissions: string[]) => Promise<void>
  loading: boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  canAccessMenu: (menuItem: string) => boolean
  canAccessPage: (page: string) => boolean
}

const RoleContext = createContext<RoleContextType>({} as RoleContextType)

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Define available permissions
const AVAILABLE_PERMISSIONS: RolePermission[] = [
  // Dashboard permissions
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to main dashboard', category: 'Dashboard' },
  
  // Order permissions
  { id: 'view_orders', name: 'View Orders', description: 'View order list and details', category: 'Orders' },
  { id: 'create_orders', name: 'Create Orders', description: 'Create new orders', category: 'Orders' },
  { id: 'edit_orders', name: 'Edit Orders', description: 'Modify existing orders', category: 'Orders' },
  { id: 'approve_orders', name: 'Approve Orders', description: 'Approve pending orders', category: 'Orders' },
  { id: 'delete_orders', name: 'Delete Orders', description: 'Delete orders', category: 'Orders' },
  
  // Inventory permissions
  { id: 'view_inventory', name: 'View Inventory', description: 'View inventory items', category: 'Inventory' },
  { id: 'manage_inventory', name: 'Manage Inventory', description: 'Add, edit, delete inventory items', category: 'Inventory' },
  { id: 'view_stores', name: 'View Stores', description: 'View store information', category: 'Inventory' },
  { id: 'manage_stores', name: 'Manage Stores', description: 'Add, edit, delete stores', category: 'Inventory' },
  { id: 'manage_transfers', name: 'Manage Transfers', description: 'Handle inventory transfers', category: 'Inventory' },
  
  // Customer permissions
  { id: 'view_customers', name: 'View Customers', description: 'View customer list and details', category: 'Customers' },
  { id: 'manage_customers', name: 'Manage Customers', description: 'Add, edit, delete customers', category: 'Customers' },
  { id: 'view_customer_accounts', name: 'View Customer Accounts', description: 'View customer account balances', category: 'Customers' },
  { id: 'manage_credit', name: 'Manage Credit', description: 'Manage customer credit limits', category: 'Customers' },
  
  // Sales permissions
  { id: 'view_sales', name: 'View Sales', description: 'View sales data and reports', category: 'Sales' },
  { id: 'create_sales', name: 'Create Sales', description: 'Create new sales', category: 'Sales' },
  
  // Reports permissions
  { id: 'view_reports', name: 'View Reports', description: 'Access to reports section', category: 'Reports' },
  { id: 'view_financial_reports', name: 'View Financial Reports', description: 'Access financial reports', category: 'Reports' },
  
  // Settings permissions
  { id: 'view_settings', name: 'View Settings', description: 'Access settings page', category: 'Settings' },
  { id: 'manage_users', name: 'Manage Users', description: 'Manage user accounts and permissions', category: 'Settings' },
  { id: 'manage_system', name: 'Manage System', description: 'System configuration and settings', category: 'Settings' },
  { id: 'view_approvals', name: 'View Approvals', description: 'View pending approvals', category: 'Settings' },
]

// Define role-based permissions
const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    role: 'admin',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    menuItems: ['dashboard', 'orders', 'inventory', 'customers', 'sales', 'delivery', 'invoicing', 'reports', 'settings', 'help'],
    canAccessSettings: true,
    canManageUsers: true,
    canViewReports: true,
    canManageInventory: true,
    canManageOrders: true,
    canManageCustomers: true
  },
  business_owner: {
    role: 'business_owner',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    menuItems: ['dashboard', 'orders', 'inventory', 'customers', 'sales', 'delivery', 'invoicing', 'reports', 'settings', 'help'],
    canAccessSettings: true,
    canManageUsers: true,
    canViewReports: true,
    canManageInventory: true,
    canManageOrders: true,
    canManageCustomers: true
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
    canManageCustomers: true
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
    canManageCustomers: false
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
    canManageCustomers: false
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
    canManageCustomers: false
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
    canManageCustomers: false
  }
}

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  const { approvalStatus } = useUserApproval()
  const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser && approvalStatus.role && !approvalStatus.loading) {
      const role = approvalStatus.role.toLowerCase()
      const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer
      setUserPermissions(permissions)
      setLoading(false)
    } else if (!currentUser) {
      setUserPermissions(null)
      setLoading(false)
    }
  }, [currentUser, approvalStatus.role, approvalStatus.loading])

  const updateUserPermissions = async (userId: string, permissions: string[]) => {
    // This would typically update permissions in the database
    console.log('Updating permissions for user:', userId, permissions)
  }

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false
    return userPermissions.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userPermissions) return false
    return permissions.some(permission => userPermissions.permissions.includes(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userPermissions) return false
    return permissions.every(permission => userPermissions.permissions.includes(permission))
  }

  const canAccessMenu = (menuItem: string): boolean => {
    if (!userPermissions) return false
    return userPermissions.menuItems.includes(menuItem)
  }

  const canAccessPage = (page: string): boolean => {
    if (!userPermissions) return false
    
    // Map pages to required permissions
    const pagePermissions: Record<string, string[]> = {
      'dashboard': ['view_dashboard'],
      'orders': ['view_orders'],
      'inventory': ['view_inventory'],
      'customers': ['view_customers'],
      'sales': ['view_sales'],
      'reports': ['view_reports'],
      'settings': ['view_settings'],
      'preparation': ['prepare_orders'],
      'delivery': ['view_delivery']
    }
    
    const requiredPermissions = pagePermissions[page] || []
    return hasAnyPermission(requiredPermissions)
  }

  const value = {
    currentUserRole: approvalStatus.role,
    userPermissions,
    availablePermissions: AVAILABLE_PERMISSIONS,
    updateUserPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessMenu,
    canAccessPage
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

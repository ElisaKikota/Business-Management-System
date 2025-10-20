import React, { useState, useEffect } from 'react'
import { Users, Settings, Shield, CheckCircle, AlertCircle, RotateCcw, Save, Edit, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import { useUserManagement } from '../../contexts/UserManagementContext'
import { useRole } from '../../contexts/RoleContext'

interface RolePermission {
  id: string
  name: string
  description: string
  category: string
}

interface RolePermissions {
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

const RolesManagement = () => {
  const { currentBusiness } = useBusiness()
  const { businessUsers, fetchBusinessUsers, initializeDefaultRolePermissions } = useUserManagement()
  const { userPermissions, availablePermissions } = useRole()
  const [loading, setLoading] = useState(false)
  const [resettingRoles, setResettingRoles] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<RolePermissions | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [showPageAccessControl, setShowPageAccessControl] = useState(false)

  // Define available roles
  const availableRoles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access', color: 'bg-red-100 text-red-800' },
    { id: 'business_owner', name: 'Business Owner', description: 'Full business access', color: 'bg-purple-100 text-purple-800' },
    { id: 'sales_rep', name: 'Sales Representative', description: 'Sales and customer management', color: 'bg-blue-100 text-blue-800' },
    { id: 'inventory_manager', name: 'Inventory Manager', description: 'Inventory and stock management', color: 'bg-green-100 text-green-800' },
    { id: 'packer', name: 'Packer', description: 'Order preparation and packing', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'accountant', name: 'Accountant', description: 'Financial reports and accounting', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'customer', name: 'Customer', description: 'Limited customer access', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    if (currentBusiness) {
      fetchBusinessUsers()
    }
  }, [currentBusiness, fetchBusinessUsers])

  const handleResetToDefaultRoles = async () => {
    if (!currentBusiness) return
    
    setResettingRoles(true)
    try {
      console.log('Resetting all users to default roles...')
      
      // Initialize default role permissions in database
      await initializeDefaultRolePermissions()
      
      // Refresh the business users list
      await fetchBusinessUsers()
      
      alert('All users have been reset to their default role permissions.')
    } catch (error) {
      console.error('Error resetting roles:', error)
      alert('Error resetting roles. Please try again.')
    } finally {
      setResettingRoles(false)
    }
  }

  const handleEditRole = (roleId: string) => {
    setSelectedRole(roleId)
    // Initialize editing permissions with current role permissions from RoleContext
    const role = availableRoles.find(r => r.id === roleId)
    if (role) {
      // Get current role permissions from the RoleContext
      const currentRolePermissions = getCurrentRolePermissions(roleId)
      setEditingPermissions(currentRolePermissions)
      
      // Initialize page access with default pages for this role
      const defaultPages = getDefaultPagesForRole(roleId)
      setSelectedPages(defaultPages)
    }
  }

  // Get current role permissions from RoleContext
  const getCurrentRolePermissions = (roleId: string): RolePermissions => {
    // This would typically fetch from the database, but for now we'll use the RoleContext defaults
    const defaultPermissions: Record<string, RolePermissions> = {
      admin: {
        role: 'admin',
        permissions: availablePermissions.map(p => p.id),
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
        permissions: availablePermissions.map(p => p.id),
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
        permissions: ['view_dashboard', 'view_orders', 'create_orders', 'edit_orders', 'view_customers', 'manage_customers', 'view_sales', 'create_sales', 'view_inventory'],
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
        permissions: ['view_dashboard', 'view_inventory', 'manage_inventory', 'view_stores', 'manage_stores', 'manage_transfers', 'view_orders', 'view_customers'],
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
        permissions: ['view_dashboard', 'view_orders', 'edit_orders', 'prepare_orders', 'view_inventory', 'view_delivery', 'manage_delivery', 'view_settings'],
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
        permissions: ['view_dashboard', 'view_orders', 'view_customers', 'view_sales', 'view_reports', 'view_financial_reports', 'view_inventory'],
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
    
    return defaultPermissions[roleId] || {
      role: roleId,
      permissions: [],
      menuItems: [],
      canAccessSettings: false,
      canManageUsers: false,
      canViewReports: false,
      canManageInventory: false,
      canManageOrders: false,
      canManageCustomers: false
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    if (!editingPermissions) return
    
    setEditingPermissions(prev => {
      if (!prev) return prev
      
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
      
      return {
        ...prev,
        permissions: newPermissions
      }
    })
  }

  const handleMenuToggle = (menuItem: string) => {
    if (!editingPermissions) return
    
    setEditingPermissions(prev => {
      if (!prev) return prev
      
      const newMenuItems = prev.menuItems.includes(menuItem)
        ? prev.menuItems.filter(m => m !== menuItem)
        : [...prev.menuItems, menuItem]
      
      return {
        ...prev,
        menuItems: newMenuItems
      }
    })
  }

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    )
  }

  const getPageCategories = () => {
    const categories = [...new Set(availablePages.map(p => p.category))]
    return categories
  }

  const getPagesByCategory = (category: string) => {
    return availablePages.filter(p => p.category === category)
  }

  const getDefaultPagesForRole = (roleId: string): string[] => {
    // This would typically fetch from the database, but for now we'll use defaults
    const defaultPages: Record<string, string[]> = {
      admin: availablePages.map(p => p.id),
      business_owner: availablePages.map(p => p.id),
      sales_rep: ['dashboard', 'orders-list', 'orders-create', 'orders-edit', 'customers-list', 'customers-accounts', 'sales-dashboard'],
      inventory_manager: ['dashboard', 'inventory-main', 'inventory-products', 'inventory-stores', 'orders-list', 'customers-list'],
      packer: ['dashboard', 'orders-list', 'preparation-queue', 'delivery-management'],
      accountant: ['dashboard', 'orders-list', 'customers-list', 'sales-dashboard', 'reports-sales', 'reports-financial'],
      customer: ['dashboard', 'orders-list']
    }
    
    return defaultPages[roleId] || []
  }

  const handleSaveRolePermissions = async () => {
    if (!editingPermissions) return
    
    setSaving(true)
    try {
      // Here you would save the role permissions to the database
      console.log('Saving role permissions:', editingPermissions)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Role permissions updated successfully!')
      setSelectedRole(null)
      setEditingPermissions(null)
    } catch (error) {
      console.error('Error saving role permissions:', error)
      alert('Error saving role permissions. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionCategories = () => {
    const categories = [...new Set(availablePermissions.map(p => p.category))]
    return categories
  }

  const getPermissionsByCategory = (category: string) => {
    return availablePermissions.filter(p => p.category === category)
  }

  const availableMenuItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'orders', name: 'Orders' },
    { id: 'inventory', name: 'Inventory' },
    { id: 'customers', name: 'Customers' },
    { id: 'sales', name: 'Sales' },
    { id: 'preparation', name: 'Preparation' },
    { id: 'delivery', name: 'Delivery' },
    { id: 'invoicing', name: 'Invoicing' },
    { id: 'reports', name: 'Reports' },
    { id: 'settings', name: 'Settings' },
    { id: 'help', name: 'Help' }
  ]

  // Define available pages with their descriptions and required permissions
  const availablePages = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Main dashboard with overview statistics',
      category: 'Main',
      requiredPermissions: ['view_dashboard']
    },
    {
      id: 'orders-list',
      name: 'Orders List',
      description: 'View all orders and order management',
      category: 'Orders',
      requiredPermissions: ['view_orders']
    },
    {
      id: 'orders-create',
      name: 'Create Order',
      description: 'Create new orders',
      category: 'Orders',
      requiredPermissions: ['create_orders']
    },
    {
      id: 'orders-edit',
      name: 'Edit Order',
      description: 'Edit existing orders',
      category: 'Orders',
      requiredPermissions: ['edit_orders']
    },
    {
      id: 'orders-approve',
      name: 'Approve Orders',
      description: 'Approve pending orders',
      category: 'Orders',
      requiredPermissions: ['approve_orders']
    },
    {
      id: 'inventory-main',
      name: 'Main Store',
      description: 'Main store inventory management',
      category: 'Inventory',
      requiredPermissions: ['view_inventory']
    },
    {
      id: 'inventory-products',
      name: 'Product Catalog',
      description: 'Manage product catalog',
      category: 'Inventory',
      requiredPermissions: ['manage_inventory']
    },
    {
      id: 'inventory-stores',
      name: 'Store Management',
      description: 'Manage stores and locations',
      category: 'Inventory',
      requiredPermissions: ['manage_stores']
    },
    {
      id: 'customers-list',
      name: 'Customer List',
      description: 'View and manage customers',
      category: 'Customers',
      requiredPermissions: ['view_customers']
    },
    {
      id: 'customers-accounts',
      name: 'Customer Accounts',
      description: 'Manage customer accounts and credit',
      category: 'Customers',
      requiredPermissions: ['view_customer_accounts']
    },
    {
      id: 'sales-dashboard',
      name: 'Sales Dashboard',
      description: 'Sales overview and analytics',
      category: 'Sales',
      requiredPermissions: ['view_sales']
    },
    {
      id: 'preparation-queue',
      name: 'Preparation Queue',
      description: 'Order preparation and packing',
      category: 'Preparation',
      requiredPermissions: ['prepare_orders']
    },
    {
      id: 'delivery-management',
      name: 'Delivery Management',
      description: 'Manage deliveries and transport',
      category: 'Delivery',
      requiredPermissions: ['manage_delivery']
    },
    {
      id: 'reports-sales',
      name: 'Sales Reports',
      description: 'Generate and view sales reports',
      category: 'Reports',
      requiredPermissions: ['view_reports']
    },
    {
      id: 'reports-financial',
      name: 'Financial Reports',
      description: 'Financial reports and analytics',
      category: 'Reports',
      requiredPermissions: ['view_financial_reports']
    },
    {
      id: 'settings-users',
      name: 'User Management',
      description: 'Manage users and roles',
      category: 'Settings',
      requiredPermissions: ['manage_users']
    },
    {
      id: 'settings-system',
      name: 'System Settings',
      description: 'System configuration and settings',
      category: 'Settings',
      requiredPermissions: ['manage_system']
    },
    {
      id: 'settings-approvals',
      name: 'Pending Approvals',
      description: 'Manage pending user approvals',
      category: 'Settings',
      requiredPermissions: ['view_approvals']
    }
  ]

  const getRoleColor = (role: string) => {
    const roleData = availableRoles.find(r => r.id === role)
    return roleData?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Check if user can manage roles
  if (!userPermissions?.canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage roles and permissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600">Manage role permissions and access control for your business.</p>
        </div>
        <button
          onClick={handleResetToDefaultRoles}
          disabled={resettingRoles}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resettingRoles ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default Roles
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Roles */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Roles</h3>
            <p className="text-sm text-gray-500">Click on a role to configure its permissions</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {availableRoles.map((role) => {
                const currentPermissions = getCurrentRolePermissions(role.id)
                const hasCustomizations = false // This would be determined by comparing with database
                
                return (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleEditRole(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                          {role.name}
                        </span>
                        <div>
                          <p className="text-sm text-gray-600">{role.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {currentPermissions.permissions.length} permissions
                            </span>
                            <span className="text-xs text-gray-500">
                              {currentPermissions.menuItems.length} menu items
                            </span>
                            <span className="text-xs text-gray-500">
                              {getDefaultPagesForRole(role.id).length} pages
                            </span>
                            {hasCustomizations && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <CheckCircle className="w-2 h-2 mr-1" />
                                Customized
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasCustomizations && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}
                        <Edit className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Role Permissions Editor */}
        {selectedRole && editingPermissions && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Configure {availableRoles.find(r => r.id === selectedRole)?.name} Permissions
              </h3>
              <p className="text-sm text-gray-500">Set what this role can access and do</p>
              
              {/* Current Role Summary */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Current Default Permissions</span>
                </div>
                <div className="text-xs text-blue-700">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <strong>Menu Access:</strong> {getCurrentRolePermissions(selectedRole).menuItems.length} items
                    </div>
                    <div>
                      <strong>Permissions:</strong> {getCurrentRolePermissions(selectedRole).permissions.length} permissions
                    </div>
                    <div>
                      <strong>Page Access:</strong> {getDefaultPagesForRole(selectedRole).length} pages
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Menu Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Menu Access</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableMenuItems.map((item) => {
                    const isChecked = editingPermissions.menuItems.includes(item.id)
                    const isDefault = getCurrentRolePermissions(selectedRole).menuItems.includes(item.id)
                    
                    return (
                      <label key={item.id} className={`flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer ${
                        isDefault && !isChecked ? 'bg-blue-50 border-blue-200' : ''
                      }`}>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleMenuToggle(item.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          {isDefault && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          {isDefault && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="w-2 h-2 mr-1" />
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Permissions by Category */}
              {getPermissionCategories().map((category) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{category} Permissions</h4>
                  <div className="space-y-2">
                    {getPermissionsByCategory(category).map((permission) => {
                      const isChecked = editingPermissions.permissions.includes(permission.id)
                      const isDefault = getCurrentRolePermissions(selectedRole).permissions.includes(permission.id)
                      
                      return (
                        <label key={permission.id} className={`flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer ${
                          isDefault && !isChecked ? 'bg-blue-50 border-blue-200' : ''
                        }`}>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                            />
                            {isDefault && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              {isDefault && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Page Access Control Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Page Access Control</h4>
                  <p className="text-xs text-gray-500">Control which specific pages this role can access</p>
                </div>
                <button
                  onClick={() => setShowPageAccessControl(!showPageAccessControl)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {showPageAccessControl ? 'Hide' : 'Show'} Page Control
                </button>
              </div>

              {/* Page Access Control */}
              {showPageAccessControl && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Page Access Control</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      This controls which specific pages users with this role can access. 
                      Users will only see pages they have permission to view.
                    </p>
                  </div>

                  {/* Pages by Category */}
                  {getPageCategories().map((category) => (
                    <div key={category}>
                      <h5 className="text-sm font-medium text-gray-900 mb-3">{category} Pages</h5>
                      <div className="space-y-2">
                        {getPagesByCategory(category).map((page) => {
                          const isChecked = selectedPages.includes(page.id)
                          const isDefault = getDefaultPagesForRole(selectedRole).includes(page.id)
                          
                          return (
                            <label key={page.id} className={`flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer ${
                              isDefault && !isChecked ? 'bg-blue-50 border-blue-200' : ''
                            }`}>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePageToggle(page.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                {isDefault && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-2 h-2 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">{page.name}</div>
                                  {isDefault && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{page.description}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Required: {page.requiredPermissions.join(', ')}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedRole(null)
                    setEditingPermissions(null)
                    setSelectedPages([])
                    setShowPageAccessControl(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRolePermissions}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Permissions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Business Users</h3>
          <p className="text-sm text-gray-500">Current users and their assigned roles</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.userName ? user.userName.charAt(0).toUpperCase() : user.userEmail.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.userName || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role?.replace('_', ' ').toUpperCase() || 'No Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : user.status === 'pending' ? (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditRole(user.role || 'customer')}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit Role
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RolesManagement
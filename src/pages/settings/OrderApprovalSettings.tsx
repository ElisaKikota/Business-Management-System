import { useState, useEffect } from 'react'
import { 
  Save, 
  Plus, 
  Trash2, 
  User, 
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { useUserManagement, ApprovalRole, ApprovalUser } from '../../contexts/UserManagementContext'

const OrderApprovalSettings = () => {
  const { 
    approvalRoles, 
    approvalUsers, 
    businessUsers,
    rolesLoading, 
    usersLoading, 
    error: contextError,
    createApprovalRole,
    updateApprovalRole,
    deleteApprovalRole,
    assignUserToRole,
    updateApprovalUser,
    removeApprovalUser
  } = useUserManagement()
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingRole, setEditingRole] = useState<ApprovalRole | null>(null)
  const [editingUser] = useState<ApprovalUser | null>(null)

  // New role form
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    canApproveOrders: false,
    canApproveCredit: false,
    canApproveTransfers: false,
    maxApprovalAmount: 0,
    requiresSecondaryApproval: false,
    secondaryApprovalAmount: 0
  })

  // New user form
  const [newUser, setNewUser] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    roleId: '',
    isActive: true
  })

  // Load data on component mount
  // Data is automatically fetched by UserManagementContext when business changes

  // Handle context errors
  useEffect(() => {
    if (contextError) {
      setError(contextError)
    }
  }, [contextError])

  const handleAddRole = async () => {
    if (!newRole.name.trim()) return

    setSaving(true)
    setError('')
    try {
      await createApprovalRole({...newRole, isActive: true})
      setNewRole({
        name: '',
        description: '',
        canApproveOrders: false,
        canApproveCredit: false,
        canApproveTransfers: false,
        maxApprovalAmount: 0,
        requiresSecondaryApproval: false,
        secondaryApprovalAmount: 0
      })
      setShowRoleForm(false)
      setSuccess('Approval role created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create approval role')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.userId.trim() || !newUser.roleId.trim()) return

    const selectedRole = approvalRoles.find(role => role.id === newUser.roleId)
    if (!selectedRole) return

    setSaving(true)
    setError('')
    try {
      await assignUserToRole({
        ...newUser,
        roleName: selectedRole.name
      })
      setNewUser({
        userId: '',
        userName: '',
        userEmail: '',
        roleId: '',
        isActive: true
      })
      setShowUserForm(false)
      setSuccess('User assigned to role successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to assign user to role')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setSaving(true)
      setError('')
      try {
        await deleteApprovalRole(roleId)
        setSuccess('Approval role deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } catch (err: any) {
        setError(err.message || 'Failed to delete approval role')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from approval roles?')) {
      setSaving(true)
      setError('')
      try {
        await removeApprovalUser(userId)
        setSuccess('User removed from approval roles successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } catch (err: any) {
        setError(err.message || 'Failed to remove user from approval roles')
      } finally {
        setSaving(false)
      }
    }
  }

  const toggleRoleActive = async (roleId: string) => {
    const role = approvalRoles.find(r => r.id === roleId)
    if (!role) return

    setSaving(true)
    setError('')
    try {
      await updateApprovalRole(roleId, { isActive: !role.isActive })
      setSuccess(`Role ${!role.isActive ? 'activated' : 'deactivated'} successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update role status')
    } finally {
      setSaving(false)
    }
  }

  const toggleUserActive = async (userId: string) => {
    const user = approvalUsers.find(u => u.id === userId)
    if (!user) return

    setSaving(true)
    setError('')
    try {
      await updateApprovalUser(userId, { isActive: !user.isActive })
      setSuccess(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update user status')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRoles = async () => {
    try {
      setSaving(true)
      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const getRoleDescription = (roleName: string): string => {
    const descriptions: { [key: string]: string } = {
      'admin': 'Full system access and administrative privileges',
      'sales_rep': 'Handles customer sales and order processing',
      'inventory_manager': 'Manages inventory, stock, and warehouse operations',
      'packer': 'Prepares and packages orders for shipment',
      'accountant': 'Handles financial records and accounting operations',
      'customer': 'Customer access to place orders and view account'
    }
    return descriptions[roleName] || ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Approval Settings</h1>
          <p className="text-gray-600 mt-1">Configure who can approve orders and transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSaveRoles}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Approval Roles Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approval Roles</h2>
              <p className="text-sm text-gray-600">Define roles and their approval permissions</p>
            </div>
            <button
              onClick={() => setShowRoleForm(!showRoleForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        {/* Add Role Form */}
        {showRoleForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <select
                  value={newRole.name}
                  onChange={(e) => {
                    const selectedRole = e.target.value
                    setNewRole(prev => ({ 
                      ...prev, 
                      name: selectedRole,
                      description: getRoleDescription(selectedRole)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role...</option>
                  <option value="admin">Admin</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="sales_rep">Sales Representative</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="packer">Packer</option>
                  <option value="accountant">Accountant</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Role description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Approval Amount</label>
                <input
                  type="number"
                  value={newRole.maxApprovalAmount}
                  onChange={(e) => setNewRole(prev => ({ ...prev, maxApprovalAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Approval Amount</label>
                <input
                  type="number"
                  value={newRole.secondaryApprovalAmount}
                  onChange={(e) => setNewRole(prev => ({ ...prev, secondaryApprovalAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRole.canApproveOrders}
                    onChange={(e) => setNewRole(prev => ({ ...prev, canApproveOrders: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Can Approve Orders</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRole.canApproveCredit}
                    onChange={(e) => setNewRole(prev => ({ ...prev, canApproveCredit: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Can Approve Credit</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRole.canApproveTransfers}
                    onChange={(e) => setNewRole(prev => ({ ...prev, canApproveTransfers: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Can Approve Transfers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRole.requiresSecondaryApproval}
                    onChange={(e) => setNewRole(prev => ({ ...prev, requiresSecondaryApproval: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Requires Secondary Approval</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Role
              </button>
              <button
                onClick={() => setShowRoleForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Roles Table */}
        {rolesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Limits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvalRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {role.canApproveOrders && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Orders
                        </span>
                      )}
                      {role.canApproveCredit && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Credit
                        </span>
                      )}
                      {role.canApproveTransfers && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Transfers
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Max: {role.maxApprovalAmount.toLocaleString()} TZS
                    </div>
                    {role.requiresSecondaryApproval && (
                      <div className="text-sm text-gray-500">
                        Secondary: {role.secondaryApprovalAmount.toLocaleString()} TZS
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRoleActive(role.id!)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        role.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {role.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Approval Users Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approval Users</h2>
              <p className="text-sm text-gray-600">Assign users to approval roles</p>
            </div>
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Assign User</span>
            </button>
          </div>
        </div>

        {/* Add User Form */}
        {showUserForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  value={newUser.userId}
                  onChange={(e) => {
                    const selectedUser = businessUsers.find(u => u.userId === e.target.value)
                    setNewUser(prev => ({ 
                      ...prev, 
                      userId: e.target.value,
                      userName: selectedUser?.userName || '',
                      userEmail: selectedUser?.userEmail || ''
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select User</option>
                  {businessUsers.filter(user => user.status === 'active').map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.userName} ({user.userEmail})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={newUser.userName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.userEmail}
                  onChange={(e) => setNewUser(prev => ({ ...prev, userEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  {approvalRoles.filter(role => role.isActive).map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Assign User
              </button>
              <button
                onClick={() => setShowUserForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvalUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(user.assignedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      by {user.assignedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserActive(user.id!)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  )
}

export default OrderApprovalSettings

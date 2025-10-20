import React, { useState, useEffect } from 'react'
import { User, Shield, Eye, EyeOff, Save, Edit3, Trash2, Plus } from 'lucide-react'
import { useRole } from '../../contexts/RoleContext'
import { useBusiness } from '../../contexts/BusinessContext'
import { useUserManagement, BusinessUser } from '../../contexts/UserManagementContext'

const UserManagement = () => {
  const { userPermissions, availablePermissions, updateUserPermissions } = useRole()
  const { currentBusiness } = useBusiness()
  const { businessUsers, loading: usersLoading, fetchBusinessUsers } = useUserManagement()
  const [selectedUser, setSelectedUser] = useState<BusinessUser | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Check if current user can access this page
  if (!userPermissions?.canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Fetch business users from the database
    if (currentBusiness) {
      fetchBusinessUsers()
    }
  }, [currentBusiness, fetchBusinessUsers])

  const handleEditPermissions = (user: BusinessUser) => {
    setSelectedUser(user)
    // For now, we'll start with an empty permissions array
    // In a real implementation, you'd fetch user permissions from the database
    setSelectedUserPermissions([])
    setShowPermissionsModal(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      await updateUserPermissions(selectedUser.userId, selectedUserPermissions)
      
      // Refresh the business users list
      await fetchBusinessUsers()
      
      setShowPermissionsModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating permissions:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedUserPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      business_owner: 'bg-purple-100 text-purple-800',
      sales_rep: 'bg-blue-100 text-blue-800',
      inventory_manager: 'bg-green-100 text-green-800',
      packer: 'bg-yellow-100 text-yellow-800',
      accountant: 'bg-indigo-100 text-indigo-800',
      customer: 'bg-gray-100 text-gray-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and permissions for {currentBusiness?.name}</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Business Users</h2>
          <p className="text-sm text-gray-600">Manage permissions for all business users</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
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
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.userName || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{user.userEmail || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Role-based permissions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditPermissions(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Permissions for {selectedUser.userName}
              </h3>
              <p className="text-sm text-gray-600">
                Role: {selectedUser.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {Object.entries(
                  availablePermissions.reduce((acc, permission) => {
                    if (!acc[permission.category]) {
                      acc[permission.category] = []
                    }
                    acc[permission.category].push(permission)
                    return acc
                  }, {} as Record<string, typeof availablePermissions>)
                ).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

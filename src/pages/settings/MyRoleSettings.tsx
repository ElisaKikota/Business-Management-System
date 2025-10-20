import { useState, useEffect } from 'react'
import { User, Store, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useRole } from '../../contexts/RoleContext'
import { useBusiness } from '../../contexts/BusinessContext'
import { useInventory } from '../../contexts/InventoryContext'
import { useUserManagement } from '../../contexts/UserManagementContext'
import { useAuth } from '../../contexts/AuthContext'

const MyRoleSettings = () => {
  const { userPermissions } = useRole()
  const { currentBusiness } = useBusiness()
  const { stores, fetchStores } = useInventory()
  const { businessUsers, fetchBusinessUsers } = useUserManagement()
  const { currentUser } = useAuth()
  
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [loading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Get current user's business user data
  const currentBusinessUser = businessUsers.find(user => user.userId === currentUser?.uid)

  useEffect(() => {
    if (currentBusiness) {
      fetchStores()
      fetchBusinessUsers()
    }
  }, [currentBusiness, fetchStores, fetchBusinessUsers])

  // Load user's assigned stores
  useEffect(() => {
    if ((currentBusinessUser as any)?.assignedStores) {
      setSelectedStores((currentBusinessUser as any).assignedStores)
    }
  }, [currentBusinessUser])

  const handleStoreToggle = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }

  const handleSaveSettings = async () => {
    if (!currentUser || !currentBusinessUser) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      // Update user's assigned stores
      // This would typically call an API to update the user's store assignments
      console.log('Saving store assignments:', selectedStores)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Store assignments updated successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleSpecificContent = () => {
    if (!userPermissions) return null

    switch (userPermissions.role) {
      case 'packer':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Store className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-blue-900">Store Assignments</h3>
              </div>
              <p className="text-blue-700 mt-2">
                Select the stores where you operate. You'll be assigned orders that contain items from these stores.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Available Stores</h4>
              <div className="space-y-3">
                {stores.map(store => (
                  <label
                    key={store.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStores.includes(store.id!)}
                      onChange={() => handleStoreToggle(store.id!)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-500">{store.address}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedStores.includes(store.id!) ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Assigned
                        </span>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'inventory_manager':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Store className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-900">Inventory Management</h3>
              </div>
              <p className="text-green-700 mt-2">
                Manage inventory across all stores and oversee stock levels.
              </p>
            </div>
            <div className="text-center py-8 text-gray-500">
              Inventory manager settings will be implemented here.
            </div>
          </div>
        )

      case 'sales_rep':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-medium text-purple-900">Sales Settings</h3>
              </div>
              <p className="text-purple-700 mt-2">
                Configure your sales preferences and customer management settings.
              </p>
            </div>
            <div className="text-center py-8 text-gray-500">
              Sales representative settings will be implemented here.
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Role-specific settings are not available for your current role.
          </div>
        )
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">My Role Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure settings specific to your role: {userPermissions?.role?.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        {userPermissions?.role === 'packer' && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Role-specific content */}
      {getRoleSpecificContent()}
    </div>
  )
}

export default MyRoleSettings


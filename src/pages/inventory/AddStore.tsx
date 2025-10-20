import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Store } from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'

interface StoreForm {
  name: string
  type: 'main' | 'sub'
  address: string
  city: string
  manager: string
  isActive: boolean
}

const AddStore = () => {
  const { storeId } = useParams<{ storeId?: string }>()
  const navigate = useNavigate()
  const { stores, addStore, updateStore, getStoreById } = useInventory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [form, setForm] = useState<StoreForm>({
    name: '',
    type: 'sub',
    address: '',
    city: '',
    manager: '',
    isActive: true
  })

  useEffect(() => {
    if (storeId) {
      setIsEditMode(true)
      const store = getStoreById(storeId)
      if (store) {
        setForm({
          name: store.name,
          type: store.type,
          address: store.address,
          city: store.city,
          manager: store.manager || '',
          isActive: store.isActive
        })
      }
    }
  }, [storeId, getStoreById])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Store name is required')
      return false
    }
    if (!form.address.trim()) {
      setError('Address is required')
      return false
    }
    if (!form.city.trim()) {
      setError('City is required')
      return false
    }
    
    // Check for duplicate store name (only when adding new store)
    if (!isEditMode && stores.some(s => s.name.toLowerCase() === form.name.toLowerCase())) {
      setError('Store name already exists')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const storeData = {
        ...form,
        manager: form.manager.trim() || undefined
      } as any
      // Remove empty manager field
      if (!storeData.manager) {
        delete storeData.manager
      }

      if (isEditMode && storeId) {
        await updateStore(storeId, storeData)
        navigate('/app/settings/stores', { 
          state: { message: 'Store updated successfully!' }
        })
      } else {
        await addStore(storeData)
        navigate('/app/settings/stores', { 
          state: { message: 'Store added successfully!' }
        })
      }
    } catch (error: any) {
      console.error('Error saving store:', error)
      setError(error.message || 'Failed to save store')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={isEditMode ? "/app/settings/stores" : "/app/settings/stores"}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Store' : 'Add New Store'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update store information' : 'Create a new store location'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Store className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store name"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Store Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={form.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sub">Sub-Store</option>
                <option value="main">Main Store</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Main stores are primary locations, sub-stores are satellite locations
              </p>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Store className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Location Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                value={form.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store address"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={form.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter city"
              />
            </div>
          </div>
        </div>

        {/* Management Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Store className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Management</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-2">
                Store Manager (Optional)
              </label>
              <input
                type="text"
                id="manager"
                name="manager"
                value={form.manager}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter manager name"
              />
            </div>

            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active Store
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/settings/stores')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading 
              ? (isEditMode ? 'Updating Store...' : 'Adding Store...') 
              : (isEditMode ? 'Update Store' : 'Add Store')
            }
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddStore




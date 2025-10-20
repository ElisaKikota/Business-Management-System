import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Package, DollarSign, AlertTriangle, X } from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'
import { Product } from '../../contexts/InventoryContext'

interface ProductForm {
  name: string
  description: string
  category: string
  sku: string
  barcode: string
  unitPrice: number
  costPrice: number
  unit: string
  minStockLevel: number
  maxStockLevel: number
  isActive: boolean
  tags: string
  initialStock: { storeId: string; quantity: number }[]
}

const AddProduct = () => {
  const { productId } = useParams<{ productId?: string }>()
  const navigate = useNavigate()
  const { products, stores, stockItems, addProduct, updateProduct, getProductById, updateStock } = useInventory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [productStock, setProductStock] = useState<{[storeId: string]: number}>({})
  const [stockLoading, setStockLoading] = useState(false)
  const [newStockEntry, setNewStockEntry] = useState({ storeId: '', quantity: 0 })
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    sku: '',
    barcode: '',
    unitPrice: 0,
    costPrice: 0,
    unit: 'pcs',
    minStockLevel: 0,
    maxStockLevel: 0,
    isActive: true,
    tags: '',
    initialStock: []
  })

  const categories = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Books',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Automotive',
    'Office Supplies',
    'Toys & Games',
    'Other'
  ]

  const units = [
    'pcs',
    'kg',
    'lbs',
    'g',
    'oz',
    'L',
    'ml',
    'm',
    'ft',
    'box',
    'pack',
    'dozen'
  ]

  useEffect(() => {
    if (productId) {
      setIsEditMode(true)
      const product = getProductById(productId)
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          category: product.category,
          sku: product.sku,
          barcode: product.barcode || '',
          unitPrice: product.unitPrice,
          costPrice: product.costPrice,
          unit: product.unit,
          minStockLevel: product.minStockLevel,
          maxStockLevel: product.maxStockLevel,
          isActive: product.isActive,
          tags: product.tags?.join(', ') || '',
          initialStock: 0,
          initialStoreId: ''
        })
        
        // Load existing stock data for this product
        loadProductStock(productId)
      }
    }
  }, [productId, getProductById])

  const loadProductStock = (productId: string) => {
    const productStockData: {[storeId: string]: number} = {}
    stockItems.forEach(stock => {
      if (stock.productId === productId) {
        productStockData[stock.storeId] = stock.currentStock
      }
    })
    setProductStock(productStockData)
  }

  const handleStockChange = async (storeId: string, newQuantity: number) => {
    if (!productId) return
    
    // Update local state immediately for better UX
    setProductStock(prev => ({
      ...prev,
      [storeId]: newQuantity
    }))
    
    setStockLoading(true)
    try {
      // Find the existing stock item
      const existingStock = stockItems.find(stock => 
        stock.productId === productId && stock.storeId === storeId
      )
      
      if (existingStock?.id) {
        await updateStock(existingStock.id, {
          currentStock: newQuantity,
          availableStock: newQuantity // Assuming no reserved stock for simplicity
        })
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      setError('Failed to update stock')
      // Revert local state on error
      setProductStock(prev => ({
        ...prev,
        [storeId]: stockItems.find(stock => 
          stock.productId === productId && stock.storeId === storeId
        )?.currentStock || 0
      }))
    } finally {
      setStockLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const generateSKU = () => {
    const categoryPrefix = form.category.substring(0, 3).toUpperCase()
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const newSKU = `${categoryPrefix}-${randomNumber}`
    setForm(prev => ({ ...prev, sku: newSKU }))
  }

  const generateBarcode = () => {
    // Generate a random 13-digit barcode (EAN-13 format)
    const randomBarcode = Math.floor(Math.random() * 9000000000000) + 1000000000000
    setForm(prev => ({ ...prev, barcode: randomBarcode.toString() }))
  }

  const addStockEntry = () => {
    if (newStockEntry.storeId && newStockEntry.quantity > 0) {
      setForm(prev => ({
        ...prev,
        initialStock: [...prev.initialStock, { ...newStockEntry }]
      }))
      setNewStockEntry({ storeId: '', quantity: 0 })
    }
  }

  const removeStockEntry = (index: number) => {
    setForm(prev => ({
      ...prev,
      initialStock: prev.initialStock.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Product name is required')
      return false
    }
    if (!form.category) {
      setError('Category is required')
      return false
    }
    if (!form.sku.trim()) {
      setError('SKU is required')
      return false
    }
    if (form.unitPrice <= 0) {
      setError('Unit price must be greater than 0')
      return false
    }
    if (form.costPrice < 0) {
      setError('Cost price cannot be negative')
      return false
    }
    if (form.minStockLevel < 0) {
      setError('Minimum stock level cannot be negative')
      return false
    }
    if (form.maxStockLevel < form.minStockLevel) {
      setError('Maximum stock level must be greater than minimum stock level')
      return false
    }
    
    // Check for duplicate SKU (only when adding new product)
    if (!isEditMode && products.some(p => p.sku === form.sku)) {
      setError('SKU already exists')
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
      const productData = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      } as any
      // Omit optional barcode field if empty
      if (!form.barcode) {
        delete productData.barcode
      }

      if (isEditMode && productId) {
        await updateProduct(productId, productData)
        navigate('/app/inventory/products', { 
          state: { message: 'Product updated successfully!' }
        })
      } else {
        // Create initial stock entries for each store
        const initialStockEntries = form.initialStock.filter(entry => entry.quantity > 0)
        await addProduct(productData, initialStockEntries.length > 0 ? initialStockEntries : undefined)
        navigate('/app/inventory/products', { 
          state: { message: 'Product added successfully!' }
        })
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      setError(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/app/inventory/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update product information' : 'Create a new product in your catalog'}
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
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  required
                  value={form.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Codes */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Product Codes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                required
                value={form.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-2"
                placeholder="Enter SKU"
              />
              <button
                type="button"
                onClick={generateSKU}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Generate SKU
              </button>
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Barcode (Optional)
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-2"
                placeholder="Enter barcode"
              />
              <button
                type="button"
                onClick={generateBarcode}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Generate Barcode
              </button>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (Selling Price) *
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                required
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (Purchase Price)
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Initial Stock (only for new products) */}
        {!isEditMode && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Initial Stock</h2>
            </div>

            {/* Add New Stock Entry */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Add Stock to Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="newStoreId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Store
                  </label>
                  <select
                    id="newStoreId"
                    value={newStockEntry.storeId}
                    onChange={(e) => setNewStockEntry(prev => ({ ...prev, storeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select store</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.type === 'main' ? 'Main Store' : 'Sub-Store'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="newQuantity"
                    min="0"
                    value={newStockEntry.quantity}
                    onChange={(e) => setNewStockEntry(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addStockEntry}
                    disabled={!newStockEntry.storeId || newStockEntry.quantity <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Current Stock Entries */}
            {form.initialStock.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Stock Entries</h3>
                <div className="space-y-2">
                  {form.initialStock.map((entry, index) => {
                    const store = stores.find(s => s.id === entry.storeId)
                    return (
                      <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {store?.name || 'Unknown Store'}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({store?.type === 'main' ? 'Main Store' : 'Sub-Store'})
                          </span>
                          <span className="text-sm text-gray-600 ml-4">
                            Quantity: {entry.quantity} {form.unit}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStockEntry(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {form.initialStock.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No initial stock added yet</p>
                <p className="text-gray-400 text-xs mt-1">Add stock to one or more stores above</p>
              </div>
            )}
          </div>
        )}

        {/* Stock Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Stock Management</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                min="0"
                value={form.minStockLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Alert when stock falls below this level
              </p>
            </div>

            <div>
              <label htmlFor="maxStockLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Stock Level
              </label>
              <input
                type="number"
                id="maxStockLevel"
                name="maxStockLevel"
                min="0"
                value={form.maxStockLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum recommended stock level
              </p>
            </div>
          </div>
        </div>

        {/* Current Stock Management (only for edit mode) */}
        {isEditMode && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Current Stock by Store</h2>
            </div>

            <div className="space-y-4">
              {stores.length === 0 ? (
                <p className="text-gray-500 text-sm">No stores available. Please add stores first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stores.map(store => (
                    <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{store.name}</h3>
                          <p className="text-sm text-gray-500">
                            {store.type === 'main' ? 'Main Store' : 'Sub-Store'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          store.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={productStock[store.id!] || 0}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0
                            handleStockChange(store.id!, newQuantity)
                          }}
                          disabled={stockLoading}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-500">{form.unit}</span>
                      </div>
                      
                      {productStock[store.id!] !== undefined && (
                        <div className="mt-2 text-xs text-gray-500">
                          Current: {productStock[store.id!]} {form.unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Stock quantities are updated immediately when you change the values above. 
                  Use inventory transfers to move stock between stores.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={form.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter tags separated by commas"
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
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
                  Active Product
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/inventory/products')}
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
              ? (isEditMode ? 'Updating Product...' : 'Adding Product...') 
              : (isEditMode ? 'Update Product' : 'Add Product')
            }
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProduct



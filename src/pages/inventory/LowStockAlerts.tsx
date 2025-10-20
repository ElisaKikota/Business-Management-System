import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Package,
  Store,
  TrendingDown
} from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

const LowStockAlerts = () => {
  const { products, stockItems, stores, getStoreById, getProductById } = useInventory()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStore, setFilterStore] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'product' | 'store' | 'stock'>('stock')
  const formatCurrency = useCurrencyFormatter()

  const lowStockItems = useMemo(() => {
    return stockItems.filter(stock => {
      const product = getProductById(stock.productId)
      if (!product) return false
      
      const isLowStock = stock.currentStock <= product.minStockLevel
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStore = filterStore === 'all' || stock.storeId === filterStore
      
      return isLowStock && matchesSearch && matchesStore
    })
  }, [stockItems, products, searchTerm, filterStore, getProductById])

  const sortedLowStockItems = useMemo(() => [...lowStockItems].sort((a, b) => {
    const productA = getProductById(a.productId)
    const productB = getProductById(b.productId)
    const storeA = getStoreById(a.storeId)
    const storeB = getStoreById(b.storeId)
    
    switch (sortBy) {
      case 'product':
        return productA?.name.localeCompare(productB?.name || '') || 0
      case 'store':
        return storeA?.name.localeCompare(storeB?.name || '') || 0
      case 'stock':
        return a.currentStock - b.currentStock
      default:
        return 0
    }
  }), [lowStockItems, sortBy, getProductById, getStoreById])

  const totalLowStockItems = lowStockItems.length
  const criticalItems = lowStockItems.filter(item => {
    const product = getProductById(item.productId)
    return product && item.currentStock === 0
  }).length

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' }
    if (currentStock <= minStock * 0.5) return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
    return { status: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-gray-600">Monitor products that need restocking</p>
        </div>
        <Link
          to="/app/inventory/products/add"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Package className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalLowStockItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{criticalItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Affected Stores</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(lowStockItems.map(item => item.storeId)).size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="stock">Sort by Stock Level</option>
              <option value="product">Sort by Product</option>
              <option value="store">Sort by Store</option>
            </select>
          </div>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Level
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
              {sortedLowStockItems.map((stockItem) => {
                const product = getProductById(stockItem.productId)
                const store = getStoreById(stockItem.storeId)
                
                if (!product || !store) return null
                
                const stockStatus = getStockStatus(stockItem.currentStock, product.minStockLevel)
                
                return (
                  <tr key={`${stockItem.productId}-${stockItem.storeId}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 text-gray-400 mr-2" />
                          {store.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {store.type === 'main' ? 'Main Store' : 'Sub-Store'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stockItem.currentStock} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.minStockLevel} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/app/inventory/transfers/create`}
                          state={{ 
                            productId: product.id, 
                            fromStoreId: store.id,
                            quantity: product.minStockLevel * 2 // Suggest 2x min level
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Restock
                        </Link>
                        <Link
                          to={`/app/inventory/products/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {sortedLowStockItems.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No low stock alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStore !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'All products are adequately stocked.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LowStockAlerts





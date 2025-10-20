import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  ArrowRightLeft
} from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

const MainStore = () => {
  const { 
    stockItems, 
    stockLoading, 
    products, 
    stores, 
    getStoreById, 
    getProductById, 
    fetchStock,
    getLowStockItems 
  } = useInventory()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out' | 'good'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name')
  const formatCurrency = useCurrencyFormatter()
  
  const mainStore = useMemo(() => stores.find(store => store.type === 'main'), [stores])
  const mainStoreStock = useMemo(() => stockItems.filter(item => item.storeId === mainStore?.id), [stockItems, mainStore?.id])

  // Stock is automatically fetched by InventoryContext when business changes

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).filter(Boolean), [products])
  const lowStockItems = useMemo(() => getLowStockItems(mainStore?.id), [getLowStockItems, mainStore?.id, stockItems, products])

  const stockWithProductInfo = useMemo(() => {
    return mainStoreStock.map(stockItem => {
      const product = getProductById(stockItem.productId)
      return {
        ...stockItem,
        product
      }
    }).filter(item => item.product)
  }, [mainStoreStock, products])

  const filteredStock = stockWithProductInfo.filter(item => {
    const product = item.product!
    
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    
    let matchesStock = true
    if (filterStock !== 'all') {
      switch (filterStock) {
        case 'low':
          matchesStock = item.currentStock <= product.minStockLevel
          break
        case 'out':
          matchesStock = item.currentStock === 0
          break
        case 'good':
          matchesStock = item.currentStock > product.minStockLevel
          break
      }
    }
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const sortedStock = [...filteredStock].sort((a, b) => {
    const productA = a.product!
    const productB = b.product!
    
    switch (sortBy) {
      case 'name':
        return productA.name.localeCompare(productB.name)
      case 'stock':
        return a.currentStock - b.currentStock
      case 'category':
        return productA.category.localeCompare(productB.category)
      default:
        return 0
    }
  })

  const getStockStatus = (currentStock: number, minStockLevel: number) => {
    if (currentStock === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' }
    }
    if (currentStock <= minStockLevel) {
      return { status: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    }
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const formatPrice = (price: number) => formatCurrency(price)

  if (stockLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!mainStore) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Main Store Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please configure your main store in the store settings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Main Store Inventory</h1>
          <p className="text-gray-600">{mainStore.name} - {mainStore.address}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/app/inventory/transfers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfers
          </Link>
          <Link
            to="/app/inventory/products/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{mainStoreStock.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mainStoreStock.filter(item => item.currentStock > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{lowStockItems.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mainStoreStock.filter(item => item.currentStock === 0).length}
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
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="good">Good Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
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
              {sortedStock.map((item) => {
                const product = item.product!
                const stockStatus = getStockStatus(item.currentStock, product.minStockLevel)
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {product.name.charAt(0)}
                            </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">
                          {item.currentStock}
                        </span>
                        <span className="text-sm text-gray-500">
                          {product.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.minStockLevel} | Max: {product.maxStockLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reservedStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.availableStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(product.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/app/inventory/products/edit/${product.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/app/inventory/products/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {sortedStock.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCategory !== 'all' || filterStock !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No products have been added to the main store inventory yet.'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && filterStock === 'all' && (
              <div className="mt-6">
                <Link
                  to="/app/inventory/products/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MainStore



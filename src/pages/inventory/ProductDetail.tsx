import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Store, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { getProductById, stockItems, stores, fetchStock } = useInventory()
  const formatCurrency = useCurrencyFormatter()
  const [product, setProduct] = useState<any>(null)
  const [productStock, setProductStock] = useState<{[storeId: string]: any}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!productId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const productData = getProductById(productId)
        
        if (productData) {
          setProduct(productData)
        } else {
          setProduct(null)
        }
      } catch (error) {
        console.error('Error loading product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [productId, getProductById])

  // Process stock data when stockItems are available
  useEffect(() => {
    if (productId && stockItems.length > 0) {
      const stockData: {[storeId: string]: any} = {}
      stockItems.forEach(stock => {
        if (stock.productId === productId) {
          stockData[stock.storeId] = stock
        }
      })
      setProductStock(stockData)
    }
  }, [productId, stockItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The product you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            to="/app/inventory/products"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const totalStock = Object.values(productStock).reduce((sum, stock) => sum + (stock?.currentStock || 0), 0)
  const lowStockStores = Object.values(productStock).filter(stock => 
    stock && stock.currentStock <= product.minStockLevel
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">Product Details</p>
          </div>
        </div>
        <Link
          to={`/app/inventory/products/edit/${product.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Product
        </Link>
      </div>

      {/* Product Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">SKU:</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Barcode:</span>
                  <span className="font-medium">{product.barcode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unit:</span>
                <span className="font-medium">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Unit Price:</span>
                <span className="font-medium text-lg">{formatCurrency(product.unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cost Price:</span>
                <span className="font-medium">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profit Margin:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(product.unitPrice - product.costPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stock Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Store className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Stock Information</h2>
        </div>

        {/* Stock Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Stock</p>
                <p className="text-2xl font-bold text-blue-900">{totalStock} {product.unit}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">In Stock Stores</p>
                <p className="text-2xl font-bold text-green-900">
                  {Object.values(productStock).filter(stock => stock && stock.currentStock > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Low Stock Stores</p>
                <p className="text-2xl font-bold text-yellow-900">{lowStockStores.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock by Store */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Store</h3>
          {stores.length === 0 ? (
            <p className="text-gray-500 text-sm">No stores available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map(store => {
                const stock = productStock[store.id!]
                const currentStock = stock?.currentStock || 0
                const isLowStock = currentStock <= product.minStockLevel
                
                return (
                  <div key={store.id} className={`border rounded-lg p-4 ${
                  isLowStock ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{store.name}</h4>
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
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Current Stock:</span>
                        <span className={`font-medium ${
                          isLowStock ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {currentStock} {product.unit}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Min Level:</span>
                        <span className="text-sm text-gray-900">{product.minStockLevel} {product.unit}</span>
                      </div>
                      
                      {isLowStock && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Low Stock Alert
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  ShoppingCart, 
  User, 
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useCurrencyFormatter } from '../../hooks/useCurrency'
import { useOrders, Order } from '../../contexts/OrderContext'
import { useRole } from '../../contexts/RoleContext'
import { useAuth } from '../../contexts/AuthContext'

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { getOrderById, approveOrder } = useOrders()
  const { userPermissions } = useRole()
  const { currentUser } = useAuth()
  const formatCurrency = useCurrencyFormatter()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    const loadOrder = () => {
      if (!orderId) return

      setLoading(true)
      try {
        const orderData = getOrderById(orderId)
        if (orderData) {
          setOrder(orderData)
        } else {
          setOrder(null)
        }
      } catch (error) {
        console.error('Error loading order:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, getOrderById])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <AlertTriangle className="h-5 w-5 text-blue-600" />
      case 'shipped':
        return <CheckCircle className="h-5 w-5 text-indigo-600" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Cash'
      case 'credit':
        return 'Credit'
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'mobile_money':
        return 'Mobile Money'
      default:
        return type
    }
  }

  const canApprove = !!userPermissions && userPermissions.permissions.includes('approve_orders')

  const handleApprove = async () => {
    if (!order || !order.id) return
    setApproving(true)
    try {
      await approveOrder(order.id, currentUser?.uid || '')
      // Optimistically update local state
      setOrder(prev => prev ? { ...prev, status: 'approved' as any } : prev)
    } catch (e) {
      console.error('Failed to approve order', e)
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Order not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The order you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/orders/list')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'pending' && canApprove && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {approving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </button>
          )}
          <button
            onClick={() => navigate(`/orders/edit/${order.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </button>
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(order.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Order Date</div>
            <div className="text-lg font-medium text-gray-900">
              {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Customer Name</label>
            <p className="text-sm text-gray-900">{order.customerName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm text-gray-900">{order.customerEmail}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm text-gray-900">{order.customerPhone}</p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Payment Type</label>
            <p className="text-sm text-gray-900">{getPaymentTypeLabel(order.paymentType)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Payment Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        </div>
        
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
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.storeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h3>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  )
}

export default OrderDetail

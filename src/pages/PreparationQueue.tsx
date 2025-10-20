import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, AlertCircle, User, Truck, MapPin } from 'lucide-react'
import { useRole } from '../contexts/RoleContext'
import { useBusiness } from '../contexts/BusinessContext'
import { useOrders } from '../contexts/OrderContext'
import { useInventory } from '../contexts/InventoryContext'
import { useUserManagement } from '../contexts/UserManagementContext'

const PreparationQueue = () => {
  const { userPermissions } = useRole()
  const { currentBusiness } = useBusiness()
  const { orders, ordersLoading: loading, fetchOrders, updatePackerStatus, updateTransporterDetails, updateCargoReceipt } = useOrders()
  const { getProductById } = useInventory()
  const { businessUsers, fetchBusinessUsers } = useUserManagement()
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showPreparationModal, setShowPreparationModal] = useState(false)
  const [preparationStatus, setPreparationStatus] = useState('')
  const [showTransporterModal, setShowTransporterModal] = useState(false)
  const [showCargoModal, setShowCargoModal] = useState(false)
  const [transporterDetails, setTransporterDetails] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    company: ''
  })
  const [cargoReceipt, setCargoReceipt] = useState({
    receiptNumber: '',
    transporterName: '',
    transporterPhone: '',
    imageFile: null as File | null
  })

  // Check if current user can access this page
  if (!userPermissions?.permissions?.includes('prepare_orders')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the preparation queue.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (currentBusiness) {
      fetchOrders()
      fetchBusinessUsers()
    }
  }, [currentBusiness, fetchOrders, fetchBusinessUsers])
  
  // Helper function to get packer name
  const getPackerName = (packerId: string) => {
    const packer = businessUsers.find(user => user.id === packerId)
    return packer ? (packer.userName || packer.userEmail) : 'Unknown Packer'
  }

  // Filter orders that are approved and ready for preparation
  const preparationOrders = orders.filter(order => 
    order.status === 'approved' && 
    order.assignedPacker && 
    order.deliveryMethod
  )

  // Filter orders that are in packer workflow
  const packerOrders = orders.filter(order => 
    ['accepted', 'packing', 'done_packing', 'handed_to_delivery'].includes(order.status)
  )

  const handleStartPreparation = async (order: any) => {
    try {
      console.log(`PreparationQueue: Starting preparation for order ${order.id} (current status: ${order.status})`)
      await updatePackerStatus(order.id!, 'accepted')
      console.log(`PreparationQueue: Successfully accepted order ${order.id}`)
      // Refresh orders to show updated status
      await fetchOrders()
    } catch (error: any) {
      console.error('Failed to accept order:', error)
      alert(`Failed to accept order: ${error.message || 'Unknown error'}`)
    }
  }

  const handlePackerStatusUpdate = async (orderId: string, status: 'accepted' | 'packing' | 'done_packing' | 'handed_to_delivery' | 'transported') => {
    try {
      console.log(`Updating order ${orderId} to status: ${status}`)
      await updatePackerStatus(orderId, status)
      console.log(`Successfully updated order ${orderId} to ${status}`)
      await fetchOrders()
    } catch (error: any) {
      console.error('Failed to update packer status:', error)
      alert(`Failed to update status: ${error.message || 'Unknown error'}`)
    }
  }

  const handleTransporterDetails = async (orderId: string) => {
    try {
      await updateTransporterDetails(orderId, transporterDetails)
      await updatePackerStatus(orderId, 'handed_to_delivery')
      setShowTransporterModal(false)
      setTransporterDetails({ name: '', phone: '', vehicleNumber: '', company: '' })
      await fetchOrders()
    } catch (error: any) {
      console.error('Failed to update transporter details:', error)
      alert(`Failed to update transporter details: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCargoReceipt = async (orderId: string) => {
    try {
      // In a real app, you'd upload the image to a storage service
      const cargoReceiptData = {
        ...cargoReceipt,
        imageUrl: cargoReceipt.imageFile ? URL.createObjectURL(cargoReceipt.imageFile) : '',
        uploadedAt: new Date().toISOString()
      }
      
      await updateCargoReceipt(orderId, cargoReceiptData)
      setShowCargoModal(false)
      setCargoReceipt({ receiptNumber: '', transporterName: '', transporterPhone: '', imageFile: null })
      await fetchOrders()
    } catch (error: any) {
      console.error('Failed to update cargo receipt:', error)
      alert(`Failed to update cargo receipt: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCompletePreparation = async () => {
    if (!selectedOrder) return
    
    try {
      // Update order status to prepared
      // This would call an API to update the order status
      console.log('Completing preparation for order:', selectedOrder.id)
      setShowPreparationModal(false)
      setSelectedOrder(null)
      // Refresh orders
      await fetchOrders()
    } catch (error) {
      console.error('Error completing preparation:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'preparing': 'bg-blue-100 text-blue-800',
      'prepared': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'preparing':
        return <Package className="w-4 h-4" />
      case 'prepared':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Preparation Queue</h1>
          <p className="text-gray-600 mt-2">Orders ready for preparation</p>
        </div>
        <div className="text-sm text-gray-500">
          {preparationOrders.length} orders ready for preparation
          {packerOrders.length > 0 && (
            <span className="ml-4 text-blue-600">
              {packerOrders.length} orders in packer workflow
            </span>
          )}
        </div>
      </div>

      {/* Preparation Queue */}
      <div className="grid gap-6">
        {preparationOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders to Prepare</h3>
            <p className="text-gray-600">All orders are prepared or no orders are assigned to you.</p>
          </div>
        ) : (
          preparationOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status.toUpperCase()}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Customer: {order.customerName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2" />
                      <span>Packer: {getPackerName(order.assignedPacker!)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>Delivery: {order.deliveryMethod}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Address: {order.deliveryAddress?.city || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item: any, index: number) => {
                        const product = getProductById ? getProductById(item.productId) : null
                        const description = (product && product.description) || item.description
                        return (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                            <div className="min-w-0">
                              <div className="truncate">{item.productName || item.name}</div>
                              {description && (
                                <div className="text-xs text-gray-500 truncate">{description}</div>
                              )}
                            </div>
                            <span className="font-medium whitespace-nowrap">Qty: {item.quantity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartPreparation(order)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Accept Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Packer Workflow Orders */}
      {packerOrders.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Orders in Progress</h2>
          {packerOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status.replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2" />
                      <span>{getPackerName(order.assignedPacker!)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>{order.deliveryMethod?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{order.deliveryAddress ? 'Address provided' : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Step Progress Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {[
                    { key: 'accepted', label: 'Accept', icon: '✓' },
                    { key: 'packing', label: 'Packing', icon: '📦' },
                    { key: 'done_packing', label: 'Done Packing', icon: '✅' },
                    { 
                      key: order.deliveryMethod === 'cargo_delivery' ? 'transported' : 'handed_to_delivery', 
                      label: order.deliveryMethod === 'cargo_delivery' ? 'Transport' : 
                             order.deliveryMethod === 'customer_pickup' ? 'Handed to Customer' : 'Handed to Delivery', 
                      icon: order.deliveryMethod === 'cargo_delivery' ? '🚛' : 
                            order.deliveryMethod === 'customer_pickup' ? '👤' : '🚚' 
                    }
                  ].map((step) => {
                    const isActive = order.status === step.key
                    const statusFlow = ['approved', 'accepted', 'packing', 'done_packing', 'handed_to_delivery', 'transported']
                    const currentIndex = statusFlow.indexOf(order.status)
                    const stepIndex = statusFlow.indexOf(step.key)
                    
                    const isCompleted = currentIndex > stepIndex
                    // Allow backward navigation within packer workflow, but not from final states
                    const canActivate = (currentIndex >= 0 && stepIndex <= currentIndex + 1) && 
                                      order.status !== 'transported' && 
                                      !(order.status === 'handed_to_delivery' && step.key !== 'transported')
                    
                    console.log(`Step ${step.key}: isActive=${isActive}, isCompleted=${isCompleted}, canActivate=${canActivate}, currentStatus=${order.status}`)

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <button
                          onClick={() => {
                            if (canActivate) {
                              // Special handling for done_packing stage - show transporter details modal for local delivery only
                              if (step.key === 'done_packing' && order.deliveryMethod === 'local_delivery') {
                                setSelectedOrder(order)
                                setShowTransporterModal(true)
                              }
                              // For customer pickup, go directly to handed_to_delivery without transporter details
                              else if (step.key === 'done_packing' && order.deliveryMethod === 'customer_pickup') {
                                handlePackerStatusUpdate(order.id!, 'handed_to_delivery')
                              }
                              // Special handling for cargo delivery - show cargo receipt modal
                              else if (step.key === 'transported' && order.deliveryMethod === 'cargo_delivery') {
                                setSelectedOrder(order)
                                setShowCargoModal(true)
                              }
                              // Regular status updates (including customer pickup)
                              else {
                                handlePackerStatusUpdate(order.id!, step.key as any)
                              }
                            } else {
                              console.log(`Cannot activate ${step.key} from current status ${order.status}`)
                              alert(`Cannot transition to ${step.label} from current status ${order.status}`)
                            }
                          }}
                          disabled={!canActivate}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : isCompleted 
                                ? 'bg-green-600 text-white' 
                                : canActivate 
                                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {step.icon}
                        </button>
                        <span className={`text-xs mt-2 text-center ${
                          isActive ? 'text-blue-600 font-semibold' : 
                          isCompleted ? 'text-green-600' : 
                          canActivate ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => {
                    const product = getProductById ? getProductById(item.productId) : null
                    const description = (product && product.description) || item.description
                    return (
                      <div key={index} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                        <div className="min-w-0">
                          <div className="truncate">{item.productName || item.name}</div>
                          {description && (
                            <div className="text-xs text-gray-500 truncate">{description}</div>
                          )}
                        </div>
                        <span className="font-medium whitespace-nowrap">Qty: {item.quantity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Created: {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preparation Modal */}
      {showPreparationModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Prepare Order #{selectedOrder.orderNumber}
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Status
                  </label>
                  <select
                    value={preparationStatus}
                    onChange={(e) => setPreparationStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preparing">Preparing</option>
                    <option value="prepared">Prepared</option>
                    <option value="ready_for_delivery">Ready for Delivery</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Items:</strong> {selectedOrder.items?.length || 0} items</p>
                  <p><strong>Delivery:</strong> {selectedOrder.deliveryMethod}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreparationModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePreparation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Preparation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transporter Details Modal */}
      {showTransporterModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Customer Pickup Details' : 'Transporter Details'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Customer Name *' : 'Transporter Name *'}
                  </label>
                  <input
                    type="text"
                    value={transporterDetails.name}
                    onChange={(e) => setTransporterDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder={selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Enter customer name' : 'Enter transporter name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={transporterDetails.phone}
                    onChange={(e) => setTransporterDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Vehicle Number (Optional)' : 'Vehicle Number *'}
                  </label>
                  <input
                    type="text"
                    value={transporterDetails.vehicleNumber}
                    onChange={(e) => setTransporterDetails(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder={selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Enter vehicle number (if applicable)' : 'Enter vehicle number'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                  <input
                    type="text"
                    value={transporterDetails.company}
                    onChange={(e) => setTransporterDetails(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransporterModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTransporterDetails(selectedOrder.id)}
                  disabled={!transporterDetails.name || !transporterDetails.phone || (selectedOrder?.deliveryMethod !== 'customer_pickup' && !transporterDetails.vehicleNumber)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {selectedOrder?.deliveryMethod === 'customer_pickup' ? 'Hand to Customer' : 'Hand to Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Receipt Modal */}
      {showCargoModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Receipt Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number *</label>
                  <input
                    type="text"
                    value={cargoReceipt.receiptNumber}
                    onChange={(e) => setCargoReceipt(prev => ({ ...prev, receiptNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter receipt number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name *</label>
                  <input
                    type="text"
                    value={cargoReceipt.transporterName}
                    onChange={(e) => setCargoReceipt(prev => ({ ...prev, transporterName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter transporter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Phone *</label>
                  <input
                    type="tel"
                    value={cargoReceipt.transporterPhone}
                    onChange={(e) => setCargoReceipt(prev => ({ ...prev, transporterPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCargoReceipt(prev => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a photo of the cargo receipt</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCargoModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCargoReceipt(selectedOrder.id)}
                  disabled={!cargoReceipt.receiptNumber || !cargoReceipt.transporterName || !cargoReceipt.transporterPhone || !cargoReceipt.imageFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Complete Transport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreparationQueue

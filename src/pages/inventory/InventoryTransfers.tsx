import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  CheckCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
  Package
} from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'
import { InventoryTransfer } from '../../contexts/InventoryContext'

const InventoryTransfers = () => {
  const { 
    transfers, 
    transfersLoading, 
    products, 
    stores, 
    getStoreById, 
    getProductById, 
    updateTransferStatus 
  } = useInventory()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-transit' | 'completed' | 'cancelled'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'quantity'>('date')
  const [selectedTransfer, setSelectedTransfer] = useState<InventoryTransfer | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)

  // fetch happens in context when business changes

  const filteredTransfers = useMemo(() => transfers.filter(transfer => {
    const product = getProductById(transfer.productId)
    const fromStore = getStoreById(transfer.fromStoreId)
    const toStore = getStoreById(transfer.toStoreId)
    
    const matchesSearch = 
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromStore?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toStore?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || transfer.status === filterStatus
    
    return matchesSearch && matchesStatus
  }), [transfers, searchTerm, filterStatus, products, stores])

  const sortedTransfers = useMemo(() => [...filteredTransfers].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      case 'quantity':
        return b.quantity - a.quantity
      default:
        return 0
    }
  }), [filteredTransfers, sortBy])

  const getStatusIcon = (status: InventoryTransfer['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'in-transit':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: InventoryTransfer['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (status: InventoryTransfer['status']) => {
    if (!selectedTransfer) return

    try {
      await updateTransferStatus(selectedTransfer.id!, status)
      setShowActionModal(false)
      setSelectedTransfer(null)
    } catch (error) {
      console.error('Error updating transfer status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (transfersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Transfers</h1>
          <p className="text-gray-600">Manage product transfers between stores</p>
        </div>
        <Link
          to="/app/inventory/transfers/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowRightLeft className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transfers</dt>
                  <dd className="text-lg font-medium text-gray-900">{transfers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transfers.filter(t => t.status === 'pending').length}
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
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Transit</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transfers.filter(t => t.status === 'in-transit').length}
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
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transfers.filter(t => t.status === 'completed').length}
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
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransfers.map((transfer) => {
                const product = getProductById(transfer.productId)
                const fromStore = getStoreById(transfer.fromStoreId)
                const toStore = getStoreById(transfer.toStoreId)
                
                if (!product || !fromStore || !toStore) return null
                
                return (
                  <tr key={transfer.id} className="hover:bg-gray-50">
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
                          <span className="font-medium">{fromStore.name}</span>
                          <ArrowRightLeft className="h-4 w-4 mx-2 text-gray-400" />
                          <span className="font-medium">{toStore.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {fromStore.type === 'main' ? 'Main Store' : 'Sub Store'} → {toStore.type === 'main' ? 'Main Store' : 'Sub Store'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transfer.quantity} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(transfer.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                          {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transfer.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTransfer(transfer)
                          setShowActionModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {sortedTransfers.length === 0 && (
          <div className="text-center py-12">
            <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No inventory transfers have been created yet.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="mt-6">
                <Link
                  to="/app/inventory/transfers/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transfer
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedTransfer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Transfer</h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Product:</strong> {getProductById(selectedTransfer.productId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>From:</strong> {getStoreById(selectedTransfer.fromStoreId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>To:</strong> {getStoreById(selectedTransfer.toStoreId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Quantity:</strong> {selectedTransfer.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong> {selectedTransfer.status}
                  </p>
                </div>
                
                {selectedTransfer.notes && (
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {selectedTransfer.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {selectedTransfer.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('in-transit')}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        Approve & Ship
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('cancelled')}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {selectedTransfer.status === 'in-transit' && (
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryTransfers



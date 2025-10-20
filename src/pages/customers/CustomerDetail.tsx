import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useBusiness } from '../../contexts/BusinessContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  creditLimit: number
  creditUsed: number
  isActive: boolean
  notes: string
  registrationDate: string
  lastOrderDate?: string
  totalOrders: number
  totalSpent: number
  createdAt: any
  updatedAt: any
}

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { currentBusiness } = useBusiness()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const formatCurrency = useCurrencyFormatter()

  const fetchCustomer = useCallback(async () => {
    if (!customerId || !currentBusiness) return

    try {
      setLoading(true)
      const customerRef = doc(db, currentBusiness.id, 'main', 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      
      if (customerSnap.exists()) {
        const nextData = {
          id: customerSnap.id,
          ...customerSnap.data()
        } as Customer
        setCustomer(prev => {
          // Avoid unnecessary state updates that can cause flicker
          if (prev && JSON.stringify(prev) === JSON.stringify(nextData)) return prev
          return nextData
        })
      } else {
        setError('Customer not found')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Failed to load customer details')
    } finally {
      setLoading(false)
    }
  }, [customerId, currentBusiness?.id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const handleDelete = async () => {
    if (!customerId || !currentBusiness) return

    setDeleteLoading(true)
    try {
      const customerRef = doc(db, currentBusiness.id, 'main', 'customers', customerId)
      await deleteDoc(customerRef)
      
      navigate('/app/customers', {
        state: { message: 'Customer deleted successfully!' }
      })
    } catch (error) {
      console.error('Error deleting customer:', error)
      setError('Failed to delete customer')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const toggleCustomerStatus = async () => {
    if (!customer || !currentBusiness) return

    try {
      const customerRef = doc(db, currentBusiness.id, 'main', 'customers', customer.id)
      await updateDoc(customerRef, {
        isActive: !customer.isActive,
        updatedAt: new Date()
      })
      
      setCustomer(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
    } catch (error) {
      console.error('Error updating customer status:', error)
      setError('Failed to update customer status')
    }
  }

  const getCreditStatus = (creditUsed: number, creditLimit: number) => {
    if (creditLimit === 0) return { status: 'Cash Only', color: 'text-gray-600', bg: 'bg-gray-100' }
    
    const percentage = (creditUsed / creditLimit) * 100
    if (percentage >= 90) return { status: 'High Risk', color: 'text-red-600', bg: 'bg-red-100' }
    if (percentage >= 70) return { status: 'Warning', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Customer not found</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Link
            to="/customers"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  const creditStatus = getCreditStatus(customer.creditUsed, customer.creditLimit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            customer.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </span>
          
          <button
            onClick={toggleCustomerStatus}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              customer.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {customer.isActive ? 'Deactivate' : 'Activate'}
          </button>
          
          <Link
            to={`/app/customers/edit/${customer.id}`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{customer.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(customer.totalSpent)}
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
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Credit Used</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(customer.creditUsed)}
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
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Credit Limit</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(customer.creditLimit)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600">
                  {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm text-gray-500">Customer ID: {customer.id.slice(-8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-sm text-gray-900">{formatDate(customer.registrationDate)}</p>
              </div>
              {customer.lastOrderDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Order</p>
                  <p className="text-sm text-gray-900">{formatDate(customer.lastOrderDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{customer.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm text-gray-900">
                  {customer.address}<br />
                  {customer.city}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Credit Limit</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(customer.creditLimit)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Credit Used</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(customer.creditUsed)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Credit Status</p>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${creditStatus.bg} ${creditStatus.color}`}>
              {creditStatus.status}
            </span>
          </div>
        </div>

        {customer.creditLimit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Credit Usage</span>
              <span>{Math.round((customer.creditUsed / customer.creditLimit) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (customer.creditUsed / customer.creditLimit) >= 0.9 ? 'bg-red-500' :
                  (customer.creditUsed / customer.creditLimit) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((customer.creditUsed / customer.creditLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center !mt-0">
          <div className="mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Customer</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {customer.firstName} {customer.lastName}? 
                  This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDetail


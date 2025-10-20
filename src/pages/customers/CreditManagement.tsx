import { useMemo, useState } from 'react'
import { Search, Save, ArrowDownCircle, ChevronDown, ChevronRight, User, CreditCard } from 'lucide-react'
import { useCustomer } from '../../contexts/CustomerContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

const CreditManagement = () => {
  const { customers, updateCustomer, addCustomerTransaction, loading } = useCustomer()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerId, setExpandedCustomerId] = useState<string>('')
  const [newLimit, setNewLimit] = useState<number | ''>('')
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const formatCurrency = useCurrencyFormatter()

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return customers
    return customers.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
      const search = searchTerm.toLowerCase().trim()
      return (
        fullName.includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
      )
    })
  }, [customers, searchTerm])


  const saveLimit = async (customerId: string) => {
    if (!newLimit) return
    setIsUpdating(true)
    try {
      await updateCustomer(customerId, { creditLimit: Number(newLimit) })
      setNewLimit('')
    } catch (error) {
      console.error('Error updating credit limit:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const recordPayment = async (customerId: string) => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return
    setIsUpdating(true)
    try {
      await addCustomerTransaction(customerId, { type: 'payment', amount: Number(paymentAmount), note: 'Manual payment' })
      setPaymentAmount('')
    } catch (error) {
      console.error('Error recording payment:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getCreditStatus = (customer: any) => {
    if (customer.creditLimit === 0) return { status: 'No Credit', color: 'text-gray-500' }
    
    const percentage = (customer.creditUsed / customer.creditLimit) * 100
    if (percentage < 70) return { status: 'Good', color: 'text-green-600' }
    if (percentage < 90) return { status: 'Warning', color: 'text-yellow-600' }
    return { status: 'High Risk', color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
        <p className="text-gray-600">Adjust limits and record payments</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filtered.map((customer) => {
          const isExpanded = expandedCustomerId === customer.id
          const creditStatus = getCreditStatus(customer)
          const availableCredit = customer.creditLimit - customer.creditUsed
          
          return (
            <div key={customer.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Customer Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCustomerId(isExpanded ? '' : customer.id!)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Credit Used:</span>
                          <span className="font-medium ml-1">{formatCurrency(customer.creditUsed)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Credit Limit:</span>
                          <span className="font-medium ml-1">{formatCurrency(customer.creditLimit)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium ml-1">{formatCurrency(availableCredit)}</span>
                        </div>
                        <div className={`text-sm font-medium ${creditStatus.color}`}>
                          {creditStatus.status}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Credit Status</div>
                      <div className={`font-medium ${creditStatus.color}`}>
                        {creditStatus.status}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Adjust Credit Limit */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                        Adjust Credit Limit
                      </h4>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          Current Limit: <span className="font-medium text-gray-900">{formatCurrency(customer.creditLimit)}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="New credit limit"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => saveLimit(customer.id!)}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-2" /> {isUpdating ? 'Saving...' : 'Save Limit'}
                        </button>
                      </div>
                    </div>

                    {/* Record Payment */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ArrowDownCircle className="w-5 h-5 mr-2 text-green-600" />
                        Record Payment
                      </h4>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          Current Balance: <span className="font-medium text-gray-900">{formatCurrency(customer.creditUsed)}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Payment amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                          onClick={() => recordPayment(customer.id!)}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <ArrowDownCircle className="h-4 w-4 mr-2" /> {isUpdating ? 'Processing...' : 'Apply Payment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No customers match your search criteria.' : 'No customers available.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CreditManagement




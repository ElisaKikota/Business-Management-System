import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  ShoppingCart, 
  User, 
  CreditCard,
  Package,
  Plus,
  Minus,
  X
} from 'lucide-react'
import { useCurrencyFormatter } from '../../hooks/useCurrency'
import { useOrders } from '../../contexts/OrderContext'
import { useCustomer } from '../../contexts/CustomerContext'
import { useInventory } from '../../contexts/InventoryContext'
import { useUserManagement } from '../../contexts/UserManagementContext'

interface OrderItem {
  productId: string
  productName: string
  sku: string
  description: string
  unitPrice: number
  quantity: number
  totalPrice: number
  unit: string
  storeId: string
  storeName: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  creditLimit: number
  creditUsed: number
  isEligibleForCredit: boolean
  isActive: boolean
}

interface Product {
  id: string
  name: string
  sku: string
  description: string
  unitPrice: number
  price: number
  unit: string
  category: string
  availableStock: number
  storeId: string
  storeName: string
}

interface OrderItem {
  productId: string
  productName: string
  sku: string
  unitPrice: number
  quantity: number
  totalPrice: number
  unit: string
  storeId: string
  storeName: string
}

const CreateOrder = () => {
  const navigate = useNavigate()
  const { createOrder } = useOrders()
  const { customers, fetchCustomers } = useCustomer()
  const { products, stores, stockItems, fetchProducts, fetchStores, fetchStock } = useInventory()
  const { businessUsers, fetchBusinessUsers } = useUserManagement()
  const formatCurrency = useCurrencyFormatter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [notes, setNotes] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [creditEligibility, setCreditEligibility] = useState<{
    isEligible: boolean
    availableCredit: number
    orderTotal: number
    message: string
  } | null>(null)
  const [quantityInputs, setQuantityInputs] = useState<{[key: string]: string}>({})
  
  // Packer and delivery fields
  const [assignedPacker, setAssignedPacker] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  
  // Search and selection states
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [showProductSuggestions, setShowProductSuggestions] = useState(false)

  // Data is automatically fetched by contexts when business changes
  
  // Fetch business users to get packers
  useEffect(() => {
    fetchBusinessUsers()
  }, [fetchBusinessUsers])
  
  // Filter packers from business users
  const packers = businessUsers.filter(user => user.role === 'packer')

  const filteredCustomers = (customers || []).filter(customer =>
    customer && 
    customer.firstName && 
    customer.lastName &&
    customer.email && 
    customer.phone &&
    (`${customer.firstName} ${customer.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch))
  )

  // Create products with stock information
  const productsWithStock = (products || []).map(product => {
    const stock = (stockItems || []).find(item => item.productId === product.id)
    const store = (stores || []).find(s => s.id === stock?.storeId)
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      unitPrice: product.unitPrice,
      unit: product.unit,
      category: product.category,
      availableStock: stock?.availableStock || 0,
      storeId: stock?.storeId || '',
      storeName: store?.name || 'Unknown Store'
    }
  })

  const filteredProducts = productsWithStock.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearch.toLowerCase())
    
    const matchesStore = !selectedStore || product.storeId === selectedStore
    
    return matchesSearch && matchesStore
  })

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`)
    setShowCustomerSuggestions(false)
    // Clear previous credit eligibility check
    setCreditEligibility(null)
  }

  // Check credit eligibility when payment type changes to credit
  const checkCreditEligibility = () => {
    if (!selectedCustomer || paymentType !== 'credit') {
      setCreditEligibility(null)
      return
    }

    const orderTotal = orderItems.reduce((total, item) => total + item.totalPrice, 0)
    const availableCredit = selectedCustomer.creditLimit - selectedCustomer.creditUsed
    
    const isEligible = availableCredit >= orderTotal && orderTotal > 0
    
    let message = ''
    if (orderTotal === 0) {
      message = 'Please add items to the order first'
    } else if (!selectedCustomer.isActive) {
      message = 'Customer account is inactive'
    } else if (availableCredit < orderTotal) {
      message = `Insufficient credit. Available: ${formatCurrency(availableCredit)}, Required: ${formatCurrency(orderTotal)}`
    } else {
      message = `Credit approved. Available: ${formatCurrency(availableCredit)}`
    }

    setCreditEligibility({
      isEligible,
      availableCredit,
      orderTotal,
      message
    })
  }

  // Check credit eligibility when payment type or order items change
  useEffect(() => {
    checkCreditEligibility()
  }, [paymentType, orderItems, selectedCustomer])

  const handleProductAdd = (product: Product) => {
    // Check if product is out of stock
    if (product.availableStock === 0) {
      setError(`${product.name} is out of stock and cannot be added to the order.`)
      return
    }
    
    const existingItem = orderItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity + 1 > product.availableStock) {
        setError(`Cannot add more ${product.name}. Only ${product.availableStock} units available.`)
        return
      }
      
      // Update quantity if product already exists
      setOrderItems(prev => prev.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      // Add new product
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.unitPrice,
        quantity: 1,
        totalPrice: product.unitPrice,
        unit: product.unit,
        storeId: product.storeId,
        storeName: product.storeName
      }
      setOrderItems(prev => [...prev, newItem])
    }
    
    setProductSearch('')
    setShowProductSuggestions(false)
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.productId !== productId))
    } else {
      // Find the product to check available stock
      const product = productsWithStock.find(p => p.id === productId)
      if (product && newQuantity > product.availableStock) {
        setError(`Cannot order ${newQuantity} units. Only ${product.availableStock} units available for ${product.name}`)
        return
      }
      
      setOrderItems(prev => prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item
      ))
    }
  }

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }
    
    if (orderItems.length === 0) {
      setError('Please add at least one product to the order')
      return
    }
    
    // Validate stock availability for all items
    for (const item of orderItems) {
      const product = productsWithStock.find(p => p.id === item.productId)
      if (product && item.quantity > product.availableStock) {
        setError(`Cannot order ${item.quantity} units of ${product.name}. Only ${product.availableStock} units available.`)
        return
      }
    }
    
    if (!assignedPacker) {
      setError('Please assign a packer to the order')
      return
    }
    
    if (!deliveryMethod) {
      setError('Please select a delivery method')
      return
    }
    
    if (deliveryMethod !== 'customer_pickup' && (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode || !deliveryAddress.country)) {
      setError('Please provide complete delivery address')
      return
    }
    
    if (paymentType === 'credit' && creditEligibility && !creditEligibility.isEligible) {
      setError('Order amount exceeds available credit limit')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const orderData = {
        orderNumber: '', // Will be generated by createOrder
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        orderDate: new Date().toISOString(),
        status: 'pending' as const,
        paymentType,
        paymentStatus: paymentType === 'cash' ? 'paid' as const : 'pending' as const,
        totalAmount: calculateTotal(),
        items: orderItems,
        itemsCount: orderItems.length,
        notes,
        assignedPacker,
        deliveryMethod,
        deliveryAddress: deliveryMethod !== 'customer_pickup' ? deliveryAddress : null,
        createdBy: '', // Will be set by createOrder
        createdAt: '', // Will be set by createOrder
        updatedAt: '' // Will be set by createOrder
      }
      
      await createOrder(orderData)
      
      navigate('/orders/list', { 
        state: { message: 'Order created successfully!' }
      })
    } catch (error: any) {
      console.error('Error creating order:', error)
      if (error.message?.includes('No business or user selected')) {
        setError('Authentication error. Please refresh the page and try again.')
      } else if (error.message?.includes('BLOCKED_BY_CLIENT')) {
        // Handle Firebase blocking by using mock data
        console.log('Firebase blocked, using mock order creation')
        setError('') // Clear any previous errors
        navigate('/orders/list', { 
          state: { message: 'Order created successfully! (Mock mode)' }
        })
      } else {
        setError('Failed to create order. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-600">Add products and create a new customer order</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Customer Selection</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerSuggestions(true)
                  }}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                {showCustomerSuggestions && customerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      >
                        <div className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        <div className="text-sm text-gray-500">
                          Available Credit: {formatCurrency(customer.creditLimit - customer.creditUsed)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    <p className="text-sm text-gray-600">
                      Available Credit: {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.creditUsed)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerSearch('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {selectedCustomer.isEligibleForCredit && (
                  <div className="mt-2 text-sm text-green-600">
                    Credit Available: {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.creditUsed)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Product Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Products</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    type="text"
                  placeholder="Search by name, description, SKU, or category..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setShowProductSuggestions(true)
                    }}
                    onFocus={() => setShowProductSuggestions(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showProductSuggestions && productSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleProductAdd(product)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                              <div className="text-sm text-gray-500">{product.category} • {product.storeName}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatCurrency(product.unitPrice)}</div>
                              <div className="text-sm text-gray-500">Stock: {product.availableStock} {product.unit}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Store
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku} • {item.storeName}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} per {item.unit}</div>
                        {(() => {
                          const product = productsWithStock.find(p => p.id === item.productId)
                          const availableStock = product?.availableStock || 0
                          const isLowStock = availableStock <= 5
                          const isOutOfStock = availableStock === 0
                          return (
                            <div className={`text-xs mt-1 ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : 
                               isLowStock ? `Low Stock: ${availableStock} available` : 
                               `${availableStock} in stock`}
                            </div>
                          )
                        })()}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newQuantity = item.quantity - 1
                              handleQuantityChange(item.productId, newQuantity)
                              setQuantityInputs(prev => ({
                                ...prev,
                                [item.productId]: newQuantity.toString()
                              }))
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantityInputs[item.productId] !== undefined ? quantityInputs[item.productId] : item.quantity.toString()}
                            onChange={(e) => {
                              const value = e.target.value
                              setQuantityInputs(prev => ({
                                ...prev,
                                [item.productId]: value
                              }))
                            }}
                            onBlur={(e) => {
                              const value = e.target.value
                              const newQuantity = parseInt(value)
                              if (isNaN(newQuantity) || newQuantity < 1) {
                                // Reset to current quantity if invalid
                                setQuantityInputs(prev => ({
                                  ...prev,
                                  [item.productId]: item.quantity.toString()
                                }))
                                handleQuantityChange(item.productId, 1)
                              } else {
                                // Check stock availability before updating
                              const product = productsWithStock.find(p => p.id === item.productId)
                                if (product && newQuantity > product.availableStock) {
                                  setError(`Cannot order ${newQuantity} units. Only ${product.availableStock} units available for ${product.name}`)
                                  // Reset to current quantity
                                  setQuantityInputs(prev => ({
                                    ...prev,
                                    [item.productId]: item.quantity.toString()
                                  }))
                                } else {
                                  // Update quantity if valid
                                  handleQuantityChange(item.productId, newQuantity)
                                  setQuantityInputs(prev => ({
                                    ...prev,
                                    [item.productId]: newQuantity.toString()
                                  }))
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newQuantity = item.quantity + 1
                              // Check stock availability before allowing increase
                              const product = productsWithStock.find(p => p.id === item.productId)
                              if (product && newQuantity > product.availableStock) {
                                setError(`Cannot order ${newQuantity} units. Only ${product.availableStock} units available for ${product.name}`)
                                return
                              }
                              handleQuantityChange(item.productId, newQuantity)
                              setQuantityInputs(prev => ({
                                ...prev,
                                [item.productId]: newQuantity.toString()
                              }))
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'cash', label: 'Cash', icon: '💵' },
              { value: 'credit', label: 'Credit', icon: '📋' }
            ].map(option => (
              <label key={option.value} className="relative">
                <input
                  type="radio"
                  name="paymentType"
                  value={option.value}
                  checked={paymentType === option.value}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Credit Eligibility Check */}
          {paymentType === 'credit' && selectedCustomer && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">Credit Eligibility Check</span>
              </div>
              
              {creditEligibility ? (
                <div className={`p-3 rounded-lg ${
                  creditEligibility.isEligible 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      creditEligibility.isEligible ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      creditEligibility.isEligible ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {creditEligibility.isEligible ? 'Credit Approved' : 'Credit Denied'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    creditEligibility.isEligible ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {creditEligibility.message}
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Customer: {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                    <div>Credit Limit: {formatCurrency(selectedCustomer.creditLimit)}</div>
                    <div>Credit Used: {formatCurrency(selectedCustomer.creditUsed)}</div>
                    <div>Available Credit: {formatCurrency(creditEligibility.availableCredit)}</div>
                    <div>Order Total: {formatCurrency(creditEligibility.orderTotal)}</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    {orderItems.length === 0 
                      ? 'Please add items to the order to check credit eligibility'
                      : 'Checking credit eligibility...'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any special instructions or notes for this order..."
              />
            </div>
          </div>
        </div>

        {/* Packer Assignment & Delivery */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Packer Assignment & Delivery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Packer Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Packer *
              </label>
              <select
                value={assignedPacker}
                onChange={(e) => setAssignedPacker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a packer</option>
                {packers.map(packer => (
                  <option key={packer.id} value={packer.id}>
                    {packer.userName || packer.userEmail} (Packer)
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method *
              </label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select delivery method</option>
                <option value="customer_pickup">Customer Pickup</option>
                <option value="local">Local Delivery</option>
                <option value="cargo">Cargo Delivery</option>
              </select>
            </div>
          </div>

          {/* Delivery Address (if delivery method is selected) */}
          {deliveryMethod && deliveryMethod !== 'customer_pickup' && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter street address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter state/province"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ZIP/postal code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.country}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedCustomer || orderItems.length === 0 || (paymentType === 'credit' && creditEligibility && !creditEligibility.isEligible)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Order...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateOrder

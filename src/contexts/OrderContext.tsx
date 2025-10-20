import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useBusiness } from './BusinessContext'
import { useAuth } from './AuthContext'
import { useCustomer } from './CustomerContext'
import { useInventory } from './InventoryContext'

export interface OrderItem {
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

export interface Order {
  id?: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  orderDate: string
  status: 'pending' | 'approved' | 'accepted' | 'packing' | 'done_packing' | 'handed_to_delivery' | 'transported' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentType: 'cash' | 'credit' | 'bank_transfer' | 'mobile_money'
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue'
  totalAmount: number
  items: OrderItem[]
  itemsCount: number
  notes?: string
  assignedPacker?: string
  deliveryMethod?: string
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  transporterDetails?: {
    name: string
    phone: string
    vehicleNumber: string
    company?: string
  }
  cargoReceipt?: {
    imageUrl: string
    receiptNumber: string
    transporterName: string
    transporterPhone: string
    uploadedAt: string
  }
  createdBy: string
  approvedBy?: string
  approvedAt?: string
  preparedBy?: string
  preparedAt?: string
  createdAt: string
  updatedAt: string
}

interface OrderContextType {
  orders: Order[]
  ordersLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  getOrderById: (orderId: string) => Order | undefined
  approveOrder: (orderId: string, approvedBy: string) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => Promise<void>
  markOrderAsPrepared: (orderId: string, preparedBy: string) => Promise<void>
  updatePackerStatus: (orderId: string, status: 'accepted' | 'packing' | 'done_packing' | 'handed_to_delivery' | 'transported') => Promise<void>
  updateTransporterDetails: (orderId: string, transporterDetails: any) => Promise<void>
  updateCargoReceipt: (orderId: string, cargoReceipt: any) => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

interface OrderProviderProps {
  children: ReactNode
}

export const OrderProvider = ({ children }: OrderProviderProps) => {
  const { currentBusiness } = useBusiness()
  const { currentUser } = useAuth()
  const { addCustomerTransaction } = useCustomer()
  const { stockItems, updateStock } = useInventory()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  // Helper function to update stock levels
  const updateStockForOrder = async (orderItems: OrderItem[], operation: 'reserve' | 'deduct' | 'restore') => {
    if (!updateStock) return

    for (const item of orderItems) {
      // Find the stock item for this product and store
      const stockItem = stockItems.find(stock => 
        stock.productId === item.productId && stock.storeId === item.storeId
      )

      if (stockItem?.id) {
        let newAvailableStock = stockItem.availableStock || stockItem.currentStock
        let newCurrentStock = stockItem.currentStock

        switch (operation) {
          case 'reserve':
            // Reserve stock when order is created (reduce available stock)
            newAvailableStock = Math.max(0, newAvailableStock - item.quantity)
            break
          case 'deduct':
            // Deduct stock when order is approved (reduce both available and current)
            newAvailableStock = Math.max(0, newAvailableStock - item.quantity)
            newCurrentStock = Math.max(0, newCurrentStock - item.quantity)
            break
          case 'restore':
            // Restore stock when order is cancelled (increase both available and current)
            newAvailableStock = newAvailableStock + item.quantity
            newCurrentStock = newCurrentStock + item.quantity
            break
        }

        try {
          await updateStock(stockItem.id, {
            availableStock: newAvailableStock,
            currentStock: newCurrentStock
          })
        } catch (error) {
          console.error(`Failed to update stock for product ${item.productId}:`, error)
          // Continue with other items even if one fails
        }
      }
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!currentBusiness) return

    setOrdersLoading(true)
    try {
      setError(null)
      const ordersRef = collection(db, currentBusiness.id, 'main', 'orders')
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'))
      const ordersSnapshot = await getDocs(ordersQuery)
      
      const ordersData: Order[] = ordersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          itemsCount: data.items?.length || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          orderDate: data.orderDate?.toDate?.()?.toISOString() || data.orderDate,
          approvedAt: data.approvedAt?.toDate?.()?.toISOString() || data.approvedAt
        }
      }) as Order[]
      
      setOrders(ordersData)
      setHasFetched(true)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      
      // Handle quota exceeded error specifically
      if (err.code === 'resource-exhausted' || err.message?.includes('quota')) {
        setError('Firebase quota exceeded. Please wait for quota reset or upgrade your plan.')
        // Set empty array to prevent blank pages
        setOrders([])
      } else {
        setError(err.message || 'Failed to fetch orders')
      }
    } finally {
      setOrdersLoading(false)
    }
  }, [currentBusiness])

  // Auto-fetch orders when business changes
  useEffect(() => {
    if (currentBusiness && !hasFetched) {
      fetchOrders()
    }
  }, [currentBusiness, hasFetched, fetchOrders])

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!currentBusiness || !currentUser) throw new Error('No business or user selected')

    try {
      setError(null)
      
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
      
      const orderPayload = {
        ...orderData,
        orderNumber,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(orderPayload).forEach(key => {
        if ((orderPayload as any)[key] === undefined) delete (orderPayload as any)[key]
      })

      const ordersRef = collection(db, currentBusiness.id, 'main', 'orders')
      const docRef = await addDoc(ordersRef, orderPayload)
      
      const newOrder: Order = {
        id: docRef.id,
        ...orderData,
        orderNumber: orderData.orderNumber,
        itemsCount: orderData.items.length,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Reserve stock when order is created
      try {
        await updateStockForOrder(orderData.items, 'reserve')
      } catch (stockError) {
        console.error('Failed to reserve stock:', stockError)
        // Don't fail the order creation if stock update fails
      }

      // If this is a credit order, update customer's credit usage
      if (orderData.paymentType === 'credit') {
        try {
          await addCustomerTransaction(orderData.customerId, {
            type: 'invoice',
            amount: orderData.totalAmount,
            reference: `Order ${orderNumber}`,
            note: `Credit order for ${orderData.totalAmount}`
          })
        } catch (creditError) {
          console.error('Failed to update customer credit:', creditError)
          // Don't fail the order creation if credit update fails
        }
      }
      
      setOrders(prev => [newOrder, ...prev])
      
      return docRef.id
    } catch (err: any) {
      console.error('Error creating order:', err)
      
      // If Firebase is blocked, create a mock order
      if (err.message?.includes('BLOCKED_BY_CLIENT') || err.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.log('Firebase blocked, creating mock order')
        const mockOrderId = `mock-order-${Date.now()}`
        const mockOrder: Order = {
          id: mockOrderId,
          ...orderData,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          itemsCount: orderData.items.length,
          createdBy: currentUser?.uid || 'mock-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Reserve stock when order is created (mock)
        try {
          await updateStockForOrder(orderData.items, 'reserve')
        } catch (stockError) {
          console.error('Failed to reserve stock:', stockError)
        }

        // If this is a credit order, update customer's credit usage (mock)
        if (orderData.paymentType === 'credit') {
          try {
            await addCustomerTransaction(orderData.customerId, {
              type: 'invoice',
              amount: orderData.totalAmount,
              reference: `Order ${orderData.orderNumber}`,
              note: `Credit order for ${orderData.totalAmount}`
            })
          } catch (creditError) {
            console.error('Failed to update customer credit:', creditError)
          }
        }
        
        setOrders(prev => [mockOrder, ...prev])
        setError(null)
        return mockOrderId
      }
      
      setError(err.message || 'Failed to create order')
      throw err
    }
  }

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      console.log(`OrderContext: updateOrder called for ${orderId} with updates:`, updates)
      
      const orderRef = doc(db, currentBusiness.id, 'main', 'orders', orderId)
      const updatePayload = {
        ...updates,
        updatedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if ((updatePayload as any)[key] === undefined) delete (updatePayload as any)[key]
      })

      console.log(`OrderContext: Updating Firestore with payload:`, updatePayload)
      await updateDoc(orderRef, updatePayload)
      console.log(`OrderContext: Firestore update successful for ${orderId}`)
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      ))
      console.log(`OrderContext: Local state updated for ${orderId}`)
    } catch (err: any) {
      console.error('Error updating order:', err)
      setError(err.message || 'Failed to update order')
      throw err
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      // Find the order to check if it's a credit order
      const order = orders.find(o => o.id === orderId)
      
      const orderRef = doc(db, currentBusiness.id, 'main', 'orders', orderId)
      await deleteDoc(orderRef)
      
      // Restore stock when order is deleted
      if (order) {
        try {
          await updateStockForOrder(order.items, 'restore')
        } catch (stockError) {
          console.error('Failed to restore stock:', stockError)
          // Don't fail the order deletion if stock update fails
        }
      }

      // If this was a credit order, refund the credit
      if (order && order.paymentType === 'credit') {
        try {
          await addCustomerTransaction(order.customerId, {
            type: 'refund',
            amount: order.totalAmount,
            reference: `Order ${order.orderNumber} (Cancelled)`,
            note: `Refund for cancelled credit order`
          })
        } catch (creditError) {
          console.error('Failed to refund customer credit:', creditError)
          // Don't fail the order deletion if credit refund fails
        }
      }
      
      setOrders(prev => prev.filter(order => order.id !== orderId))
    } catch (err: any) {
      console.error('Error deleting order:', err)
      setError(err.message || 'Failed to delete order')
      throw err
    }
  }

  const getOrderById = useCallback((orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId)
  }, [orders])

  const approveOrder = async (orderId: string, approvedBy: string) => {
    if (!currentUser) throw new Error('No user authenticated')
    
    // Find the order to validate
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    
    // Validate that packer and delivery method are assigned
    if (!order.assignedPacker) {
      throw new Error('Cannot approve order: No packer assigned')
    }
    
    if (!order.deliveryMethod) {
      throw new Error('Cannot approve order: No delivery method selected')
    }
    
    // If delivery method is not customer pickup, validate delivery address
    if (order.deliveryMethod !== 'customer_pickup' && !order.deliveryAddress) {
      throw new Error('Cannot approve order: Delivery address required for non-pickup orders')
    }
    
    // Deduct stock when order is approved
    try {
      await updateStockForOrder(order.items, 'deduct')
    } catch (stockError) {
      console.error('Failed to deduct stock:', stockError)
      // Don't fail the approval if stock update fails
    }

    await updateOrder(orderId, {
      status: 'approved',
      approvedBy: approvedBy,
      approvedAt: new Date().toISOString()
    })
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')

    // If order is being cancelled, restore stock
    if (status === 'cancelled') {
      try {
        await updateStockForOrder(order.items, 'restore')
      } catch (stockError) {
        console.error('Failed to restore stock:', stockError)
        // Don't fail the status update if stock update fails
      }
    }

    await updateOrder(orderId, { status })
  }

  const updatePaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    await updateOrder(orderId, { paymentStatus })
  }

  const markOrderAsPrepared = async (orderId: string, _preparedBy: string) => {
    if (!currentUser) throw new Error('No user authenticated')
    
    // Find the order to validate
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    
    // Only allow preparation of approved orders
    if (order.status !== 'approved') {
      throw new Error('Only approved orders can be prepared')
    }
    
    await updateOrder(orderId, {
      status: 'processing',
      preparedBy: currentUser.uid,
      preparedAt: new Date().toISOString()
    })
  }

  const updatePackerStatus = async (orderId: string, status: 'accepted' | 'packing' | 'done_packing' | 'handed_to_delivery' | 'transported') => {
    if (!currentUser) throw new Error('No user authenticated')
    
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    
    console.log(`OrderContext: Updating order ${orderId} from ${order.status} to ${status}`)
    
    // Allow backward navigation within packer workflow
    
    // Allow any transition within packer workflow, but not backward from final states
    if (order.status === 'handed_to_delivery' && status !== 'transported') {
      throw new Error('Cannot go backward from "Handed to Delivery"')
    }
    if (order.status === 'transported') {
      throw new Error('Order is already completed and cannot be changed')
    }
    
    try {
      await updateOrder(orderId, {
        status: status as any,
        preparedBy: currentUser.uid,
        preparedAt: new Date().toISOString()
      })
      console.log(`OrderContext: Successfully updated order ${orderId} to ${status}`)
    } catch (error) {
      console.error(`OrderContext: Failed to update order ${orderId}:`, error)
      throw error
    }
  }

  const updateTransporterDetails = async (orderId: string, transporterDetails: any) => {
    if (!currentUser) throw new Error('No user authenticated')
    
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    
    try {
      await updateOrder(orderId, {
        transporterDetails,
        preparedBy: currentUser.uid,
        preparedAt: new Date().toISOString()
      })
      console.log(`OrderContext: Successfully updated transporter details for order ${orderId}`)
    } catch (error) {
      console.error(`OrderContext: Failed to update transporter details for order ${orderId}:`, error)
      throw error
    }
  }

  const updateCargoReceipt = async (orderId: string, cargoReceipt: any) => {
    if (!currentUser) throw new Error('No user authenticated')
    
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    
    try {
      await updateOrder(orderId, {
        cargoReceipt,
        status: 'transported',
        preparedBy: currentUser.uid,
        preparedAt: new Date().toISOString()
      })
      console.log(`OrderContext: Successfully updated cargo receipt for order ${orderId}`)
    } catch (error) {
      console.error(`OrderContext: Failed to update cargo receipt for order ${orderId}:`, error)
      throw error
    }
  }

  const value: OrderContextType = {
    orders,
    ordersLoading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    approveOrder,
    updateOrderStatus,
    updatePaymentStatus,
    markOrderAsPrepared,
    updatePackerStatus,
    updateTransporterDetails,
    updateCargoReceipt
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}


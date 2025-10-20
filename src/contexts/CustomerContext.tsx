import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useBusiness } from './BusinessContext'

export interface Customer {
  id?: string
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
  createdAt?: any
  updatedAt?: any
}

export type CustomerTransactionType = 'invoice' | 'payment' | 'credit-adjustment' | 'refund'

export interface CustomerTransaction {
  id?: string
  type: CustomerTransactionType
  amount: number
  balanceAfter: number
  reference?: string
  note?: string
  createdAt: any
}

export interface CustomerTransactionInput {
  type: CustomerTransactionType
  amount: number
  reference?: string
  note?: string
}

interface CustomerContextType {
  customers: Customer[]
  loading: boolean
  error: string | null
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (customerId: string) => Promise<void>
  fetchCustomers: () => Promise<void>
  getCustomerById: (customerId: string) => Customer | undefined
  searchCustomers: (searchTerm: string) => Customer[]
  getCustomersByCreditStatus: (status: 'good' | 'warning' | 'high-risk' | 'cash-only') => Customer[]
  addCustomerTransaction: (customerId: string, tx: CustomerTransactionInput) => Promise<void>
  fetchCustomerTransactions: (customerId: string) => Promise<CustomerTransaction[]>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}

interface CustomerProviderProps {
  children: ReactNode
}

export const CustomerProvider = ({ children }: CustomerProviderProps) => {
  const { currentBusiness } = useBusiness()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchCustomers()
    } else {
      setCustomers([])
    }
  }, [currentBusiness?.id])

  const fetchCustomers = useCallback(async () => {
    if (!currentBusiness) return

    try {
      setLoading(true)
      setError(null)
      
      const customersRef = collection(db, currentBusiness.id, 'main', 'customers')
      const q = query(customersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[]
      
      setCustomers(customersData)
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      
      // Handle quota exceeded error specifically
      if (err.code === 'resource-exhausted' || err.message?.includes('quota')) {
        setError('Firebase quota exceeded. Please wait for quota reset or upgrade your plan.')
        // Set empty array to prevent blank pages
        setCustomers([])
      } else {
        setError(err.message || 'Failed to fetch customers')
      }
      
      // If Firebase is blocked, use mock data for testing
      if (err.message?.includes('BLOCKED_BY_CLIENT') || err.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.log('Firebase blocked, using mock customers for testing')
        const mockCustomers: Customer[] = [
          {
            id: 'mock-customer-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            address: '123 Main St',
            city: 'New York',
            creditLimit: 5000,
            creditUsed: 1200,
            isActive: true,
            notes: 'Test customer',
            registrationDate: new Date().toISOString(),
            totalOrders: 5,
            totalSpent: 1250
          },
          {
            id: 'mock-customer-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+0987654321',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            creditLimit: 3000,
            creditUsed: 2800,
            isActive: true,
            notes: 'Premium customer',
            registrationDate: new Date().toISOString(),
            totalOrders: 8,
            totalSpent: 2500
          }
        ]
        setCustomers(mockCustomers)
      }
    } finally {
      setLoading(false)
    }
  }, [currentBusiness?.id])

  const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const customerRef = collection(db, currentBusiness.id, 'main', 'customers')
      const docRef = await addDoc(customerRef, {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Add the new customer to local state
      const newCustomer: Customer = {
        id: docRef.id,
        ...customerData
      }
      
      setCustomers(prev => [newCustomer, ...prev])
    } catch (err: any) {
      console.error('Error adding customer:', err)
      setError(err.message || 'Failed to add customer')
      throw err
    }
  }

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const customerRef = doc(db, currentBusiness.id, 'main', 'customers', customerId)
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: new Date()
      })
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...updates }
          : customer
      ))
    } catch (err: any) {
      console.error('Error updating customer:', err)
      setError(err.message || 'Failed to update customer')
      throw err
    }
  }

  const deleteCustomer = async (customerId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const customerRef = doc(db, currentBusiness.id, 'main', 'customers', customerId)
      await deleteDoc(customerRef)
      
      // Remove from local state
      setCustomers(prev => prev.filter(customer => customer.id !== customerId))
    } catch (err: any) {
      console.error('Error deleting customer:', err)
      setError(err.message || 'Failed to delete customer')
      throw err
    }
  }

  const getCustomerById = (customerId: string): Customer | undefined => {
    return customers.find(customer => customer.id === customerId)
  }

  const addCustomerTransaction = async (customerId: string, tx: CustomerTransactionInput) => {
    if (!currentBusiness) throw new Error('No business selected')
    const customer = getCustomerById(customerId)
    if (!customer) throw new Error('Customer not found')

    // Compute new totals for basic account tracking
    // For simplicity: invoice increases balance (creditUsed), payment reduces
    const isDebit = tx.type === 'invoice'
    const isCredit = tx.type === 'payment' || tx.type === 'refund' || tx.type === 'credit-adjustment'

    let newCreditUsed = customer.creditUsed
    if (isDebit) newCreditUsed += tx.amount
    if (isCredit) newCreditUsed = Math.max(0, newCreditUsed - tx.amount)

    // Write transaction record
    const txRef = collection(db, currentBusiness.id, 'main', 'customers', customerId, 'transactions')
    await addDoc(txRef, {
      type: tx.type,
      amount: tx.amount,
      reference: tx.reference || null,
      note: tx.note || null,
      createdAt: serverTimestamp()
    })

    // Update aggregate fields
    await updateCustomer(customerId, {
      creditUsed: newCreditUsed,
      totalSpent: isDebit ? (customer.totalSpent + tx.amount) : customer.totalSpent,
      updatedAt: new Date().toISOString()
    })
  }

  const fetchCustomerTransactions = async (customerId: string): Promise<CustomerTransaction[]> => {
    if (!currentBusiness) return []
    const txRef = collection(db, currentBusiness.id, 'main', 'customers', customerId, 'transactions')
    const q = query(txRef, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerTransaction))
  }

  const searchCustomers = (searchTerm: string): Customer[] => {
    if (!searchTerm.trim()) return customers
    
    const term = searchTerm.toLowerCase()
    return customers.filter(customer => 
      customer.firstName.toLowerCase().includes(term) ||
      customer.lastName.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.includes(term) ||
      customer.address.toLowerCase().includes(term)
    )
  }

  const getCustomersByCreditStatus = (status: 'good' | 'warning' | 'high-risk' | 'cash-only'): Customer[] => {
    return customers.filter(customer => {
      if (status === 'cash-only') {
        return customer.creditLimit === 0
      }
      
      if (customer.creditLimit === 0) return false
      
      const percentage = (customer.creditUsed / customer.creditLimit) * 100
      
      switch (status) {
        case 'good':
          return percentage < 70
        case 'warning':
          return percentage >= 70 && percentage < 90
        case 'high-risk':
          return percentage >= 90
        default:
          return false
      }
    })
  }

  const value: CustomerContextType = {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomers,
    getCustomerById,
    searchCustomers,
    getCustomersByCreditStatus,
    addCustomerTransaction,
    fetchCustomerTransactions
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomers = () => {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider')
  }
  return context
}



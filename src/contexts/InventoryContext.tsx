import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useBusiness } from './BusinessContext'

export interface Product {
  id?: string
  name: string
  description: string
  category: string
  sku: string
  barcode?: string
  unitPrice: number
  costPrice: number
  unit: string
  minStockLevel: number
  maxStockLevel: number
  isActive: boolean
  images?: string[]
  tags?: string[]
  createdAt?: any
  updatedAt?: any
}

export interface Store {
  id?: string
  name: string
  type: 'main' | 'sub'
  address: string
  city: string
  manager?: string
  isActive: boolean
  createdAt?: any
  updatedAt?: any
}

export interface StockItem {
  id?: string
  productId: string
  storeId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  lastUpdated: string
  lastRestocked?: string
  createdAt?: any
  updatedAt?: any
}

export interface InventoryTransfer {
  id?: string
  fromStoreId: string
  toStoreId: string
  productId: string
  quantity: number
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled'
  requestedBy: string
  approvedBy?: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  notes?: string
  createdAt?: any
  updatedAt?: any
}

interface InventoryContextType {
  // Products
  products: Product[]
  productsLoading: boolean
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  fetchProducts: () => Promise<void>
  getProductById: (productId: string) => Product | undefined
  
  // Stores
  stores: Store[]
  storesLoading: boolean
  addStore: (store: Omit<Store, 'id'>) => Promise<void>
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>
  deleteStore: (storeId: string) => Promise<void>
  fetchStores: () => Promise<void>
  getStoreById: (storeId: string) => Store | undefined
  
  // Stock
  stockItems: StockItem[]
  stockLoading: boolean
  fetchStock: (storeId?: string) => Promise<void>
  updateStock: (stockItemId: string, updates: Partial<StockItem>) => Promise<void>
  getStockByProduct: (productId: string, storeId?: string) => StockItem[]
  getLowStockItems: (storeId?: string) => StockItem[]
  
  // Transfers
  transfers: InventoryTransfer[]
  transfersLoading: boolean
  fetchTransfers: () => Promise<void>
  createTransfer: (transfer: Omit<InventoryTransfer, 'id'>) => Promise<void>
  updateTransferStatus: (transferId: string, status: InventoryTransfer['status'], approvedBy?: string) => Promise<void>
  
  // General
  error: string | null
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export const useInventory = () => {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}

interface InventoryProviderProps {
  children: ReactNode
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
  const { currentBusiness } = useBusiness()
  
  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  
  // Stores state
  const [stores, setStores] = useState<Store[]>([])
  const [storesLoading, setStoresLoading] = useState(false)
  
  // Stock state
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  
  // Transfers state
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([])
  const [transfersLoading, setTransfersLoading] = useState(false)
  
  // General state
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentBusiness) {
      fetchProducts()
      fetchStores()
      fetchStock()
      fetchTransfers()
    } else {
      setProducts([])
      setStores([])
      setStockItems([])
      setTransfers([])
    }
  }, [currentBusiness?.id])

  // Products functions
  const fetchProducts = useCallback(async () => {
    if (!currentBusiness) return

    try {
      setProductsLoading(true)
      setError(null)
      
      const productsRef = collection(db, currentBusiness.id, 'main', 'products')
      const q = query(productsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      
      setProducts(productsData)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      
      // Handle quota exceeded error specifically
      if (err.code === 'resource-exhausted' || err.message?.includes('quota')) {
        setError('Firebase quota exceeded. Please wait for quota reset or upgrade your plan.')
        // Set empty array to prevent blank pages
        setProducts([])
      } else {
        setError(err.message || 'Failed to fetch products')
      }
    } finally {
      setProductsLoading(false)
    }
  }, [currentBusiness?.id])

  const addProduct = async (productData: Omit<Product, 'id'>, initialStock?: { storeId: string; quantity: number }[]) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const productRef = collection(db, currentBusiness.id, 'main', 'products')
      const payload: any = { ...productData, createdAt: new Date(), updatedAt: new Date() }
      // Remove undefined optional fields (e.g., barcode)
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key]
      })
      const docRef = await addDoc(productRef, payload)
      
      // Create initial stock if provided
      if (initialStock && initialStock.length > 0) {
        const stockRef = collection(db, currentBusiness.id, 'main', 'stock')
        for (const stockEntry of initialStock) {
          if (stockEntry.quantity > 0) {
            await addDoc(stockRef, {
              productId: docRef.id,
              storeId: stockEntry.storeId,
              currentStock: stockEntry.quantity,
              reservedStock: 0,
              availableStock: stockEntry.quantity,
              lastUpdated: new Date().toISOString(),
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        }
      }
      
      const newProduct: Product = {
        id: docRef.id,
        ...productData
      }
      
      setProducts(prev => [newProduct, ...prev])
      
      // Refresh stock data if initial stock was added
      if (initialStock && initialStock.length > 0) {
        fetchStock()
      }
    } catch (err: any) {
      console.error('Error adding product:', err)
      setError(err.message || 'Failed to add product')
      throw err
    }
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const productRef = doc(db, currentBusiness.id, 'main', 'products', productId)
      const updatePayload: any = { ...updates, updatedAt: new Date() }
      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined) delete updatePayload[key]
      })
      await updateDoc(productRef, updatePayload)
      
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates }
          : product
      ))
    } catch (err: any) {
      console.error('Error updating product:', err)
      setError(err.message || 'Failed to update product')
      throw err
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const productRef = doc(db, currentBusiness.id, 'main', 'products', productId)
      await deleteDoc(productRef)
      
      setProducts(prev => prev.filter(product => product.id !== productId))
    } catch (err: any) {
      console.error('Error deleting product:', err)
      setError(err.message || 'Failed to delete product')
      throw err
    }
  }

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(product => product.id === productId)
  }, [products])

  // Stores functions
  const fetchStores = useCallback(async () => {
    if (!currentBusiness) return

    try {
      setStoresLoading(true)
      setError(null)
      
      const storesRef = collection(db, currentBusiness.id, 'main', 'stores')
      const q = query(storesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Store[]
      
      setStores(storesData)
    } catch (err: any) {
      console.error('Error fetching stores:', err)
      setError(err.message || 'Failed to fetch stores')
    } finally {
      setStoresLoading(false)
    }
  }, [currentBusiness?.id])

  const addStore = async (storeData: Omit<Store, 'id'>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const storeRef = collection(db, currentBusiness.id, 'main', 'stores')
      const docRef = await addDoc(storeRef, {
        ...storeData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      const newStore: Store = {
        id: docRef.id,
        ...storeData
      }
      
      setStores(prev => [newStore, ...prev])
    } catch (err: any) {
      console.error('Error adding store:', err)
      setError(err.message || 'Failed to add store')
      throw err
    }
  }

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const storeRef = doc(db, currentBusiness.id, 'main', 'stores', storeId)
      await updateDoc(storeRef, {
        ...updates,
        updatedAt: new Date()
      })
      
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, ...updates }
          : store
      ))
    } catch (err: any) {
      console.error('Error updating store:', err)
      setError(err.message || 'Failed to update store')
      throw err
    }
  }

  const deleteStore = async (storeId: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const storeRef = doc(db, currentBusiness.id, 'main', 'stores', storeId)
      await deleteDoc(storeRef)
      
      setStores(prev => prev.filter(store => store.id !== storeId))
    } catch (err: any) {
      console.error('Error deleting store:', err)
      setError(err.message || 'Failed to delete store')
      throw err
    }
  }

  const getStoreById = (storeId: string): Store | undefined => {
    return stores.find(store => store.id === storeId)
  }

  // Stock functions
  const fetchStock = useCallback(async (storeId?: string) => {
    if (!currentBusiness) return

    try {
      setStockLoading(true)
      setError(null)
      
      const stockRef = collection(db, currentBusiness.id, 'main', 'stock')
      let q = query(stockRef, orderBy('lastUpdated', 'desc'))
      
      if (storeId) {
        q = query(stockRef, where('storeId', '==', storeId), orderBy('lastUpdated', 'desc'))
      }
      
      const snapshot = await getDocs(q)
      
      const stockData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockItem[]
      
      setStockItems(stockData)
    } catch (err: any) {
      console.error('Error fetching stock:', err)
      setError(err.message || 'Failed to fetch stock')
    } finally {
      setStockLoading(false)
    }
  }, [currentBusiness?.id])

  const updateStock = async (stockItemId: string, updates: Partial<StockItem>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const stockRef = doc(db, currentBusiness.id, 'main', 'stock', stockItemId)
      await updateDoc(stockRef, {
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date()
      })
      
      setStockItems(prev => prev.map(item => 
        item.id === stockItemId 
          ? { ...item, ...updates }
          : item
      ))
    } catch (err: any) {
      console.error('Error updating stock:', err)
      setError(err.message || 'Failed to update stock')
      throw err
    }
  }

  const getStockByProduct = (productId: string, storeId?: string): StockItem[] => {
    return stockItems.filter(item => {
      const matchesProduct = item.productId === productId
      const matchesStore = !storeId || item.storeId === storeId
      return matchesProduct && matchesStore
    })
  }

  const getLowStockItems = (storeId?: string): StockItem[] => {
    return stockItems.filter(item => {
      const matchesStore = !storeId || item.storeId === storeId
      if (!matchesStore) return false
      
      const product = getProductById(item.productId)
      if (!product) return false
      
      return item.currentStock <= product.minStockLevel
    })
  }

  // Transfer functions
  const fetchTransfers = useCallback(async () => {
    if (!currentBusiness) return

    try {
      setTransfersLoading(true)
      setError(null)
      
      const transfersRef = collection(db, currentBusiness.id, 'main', 'transfers')
      const q = query(transfersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const transfersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryTransfer[]
      
      setTransfers(transfersData)
    } catch (err: any) {
      console.error('Error fetching transfers:', err)
      setError(err.message || 'Failed to fetch transfers')
    } finally {
      setTransfersLoading(false)
    }
  }, [currentBusiness?.id])

  const createTransfer = async (transferData: Omit<InventoryTransfer, 'id'>) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const transferRef = collection(db, currentBusiness.id, 'main', 'transfers')
      const docRef = await addDoc(transferRef, {
        ...transferData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      const newTransfer: InventoryTransfer = {
        id: docRef.id,
        ...transferData
      }
      
      setTransfers(prev => [newTransfer, ...prev])
    } catch (err: any) {
      console.error('Error creating transfer:', err)
      setError(err.message || 'Failed to create transfer')
      throw err
    }
  }

  const updateTransferStatus = async (transferId: string, status: InventoryTransfer['status'], approvedBy?: string) => {
    if (!currentBusiness) throw new Error('No business selected')

    try {
      setError(null)
      
      const transferRef = doc(db, currentBusiness.id, 'main', 'transfers', transferId)
      const updates: any = {
        status,
        updatedAt: new Date()
      }
      
      if (approvedBy) {
        updates.approvedBy = approvedBy
        updates.approvedAt = new Date().toISOString()
      }
      
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString()
      }
      
      await updateDoc(transferRef, updates)

      // If completing, adjust stock for from/to stores
      if (status === 'completed') {
        const completed = transfers.find(t => t.id === transferId)
        if (completed) {
          // decrement fromStore stock
          const fromItem = stockItems.find(s => s.storeId === completed.fromStoreId && s.productId === completed.productId)
          if (fromItem?.id) {
            await updateStock(fromItem.id, {
              currentStock: Math.max(0, fromItem.currentStock - completed.quantity),
              availableStock: Math.max(0, (fromItem.availableStock ?? fromItem.currentStock) - completed.quantity)
            })
          }
          // increment toStore stock
          const toItem = stockItems.find(s => s.storeId === completed.toStoreId && s.productId === completed.productId)
          if (toItem?.id) {
            await updateStock(toItem.id, {
              currentStock: (toItem.currentStock + completed.quantity),
              availableStock: ((toItem.availableStock ?? toItem.currentStock) + completed.quantity)
            })
          }
        }
      }

      setTransfers(prev => prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, ...updates }
          : transfer
      ))
    } catch (err: any) {
      console.error('Error updating transfer status:', err)
      setError(err.message || 'Failed to update transfer status')
      throw err
    }
  }

  const value: InventoryContextType = {
    // Products
    products,
    productsLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
    getProductById,
    
    // Stores
    stores,
    storesLoading,
    addStore,
    updateStore,
    deleteStore,
    fetchStores,
    getStoreById,
    
    // Stock
    stockItems,
    stockLoading,
    fetchStock,
    updateStock,
    getStockByProduct,
    getLowStockItems,
    
    // Transfers
    transfers,
    transfersLoading,
    fetchTransfers,
    createTransfer,
    updateTransferStatus,
    
    // General
    error
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}



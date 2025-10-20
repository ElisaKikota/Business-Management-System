import { Routes, Route, Navigate } from 'react-router-dom'
import ProductCatalog from './inventory/ProductCatalog'
import ProductDetail from './inventory/ProductDetail'
import AddProduct from './inventory/AddProduct'
import MainStore from './inventory/MainStore'
import InventoryTransfers from './inventory/InventoryTransfers'
import CreateTransfer from './inventory/CreateTransfer'
import StoreManagement from './inventory/StoreManagement'
import LowStockAlerts from './inventory/LowStockAlerts'
import AddStore from './inventory/AddStore'

const Inventory = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/inventory/products" replace />} />
      <Route path="products" element={<ProductCatalog />} />
      <Route path="products/:productId" element={<ProductDetail />} />
      <Route path="products/add" element={<AddProduct />} />
      <Route path="products/edit/:productId" element={<AddProduct />} />
      <Route path="main" element={<MainStore />} />
      <Route path="substores" element={<StoreManagement />} />
      <Route path="stores/add" element={<AddStore />} />
      <Route path="stores/edit/:storeId" element={<AddStore />} />
      <Route path="transfers" element={<InventoryTransfers />} />
      <Route path="transfers/create" element={<CreateTransfer />} />
      <Route path="alerts" element={<LowStockAlerts />} />
      <Route path="*" element={<Navigate to="/inventory/products" replace />} />
    </Routes>
  )
}

export default Inventory
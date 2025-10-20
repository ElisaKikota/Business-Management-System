import { Routes, Route, Navigate } from 'react-router-dom'
import OrderList from './orders/OrderList'
import CreateOrder from './orders/CreateOrder'
import OrderDetail from './orders/OrderDetail'
import EditOrder from './orders/EditOrder'
import PendingApprovals from './orders/PendingApprovals'
import OrderHistory from './orders/OrderHistory'

const Orders = () => {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="list" element={<OrderList />} />
      <Route path="create" element={<CreateOrder />} />
      <Route path="approvals" element={<PendingApprovals />} />
      <Route path="history" element={<OrderHistory />} />
      <Route path=":orderId" element={<OrderDetail />} />
      <Route path="edit/:orderId" element={<EditOrder />} />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  )
}

export default Orders
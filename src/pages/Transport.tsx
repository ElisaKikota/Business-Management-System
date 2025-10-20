import { Routes, Route } from 'react-router-dom'
import { Truck } from 'lucide-react'

const TransportDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transport & Delivery</h1>
        <p className="text-gray-600">Manage deliveries and transport logistics</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transport Management</h3>
          <p className="text-gray-600">Transport and delivery management will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Transport = () => {
  return (
    <Routes>
      <Route index element={<TransportDashboard />} />
      <Route path="active" element={<div>Active Deliveries</div>} />
      <Route path="management" element={<div>Transport Management</div>} />
      <Route path="history" element={<div>Delivery History</div>} />
    </Routes>
  )
}

export default Transport

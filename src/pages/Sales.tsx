import { Routes, Route } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

const SalesDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-gray-600">Track your sales performance</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Management</h3>
          <p className="text-gray-600">Sales tracking and analytics will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Sales = () => {
  return (
    <Routes>
      <Route index element={<SalesDashboard />} />
      <Route path="create" element={<div>Create Sale</div>} />
      <Route path="reports" element={<div>Sales Reports</div>} />
    </Routes>
  )
}

export default Sales

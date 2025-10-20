import { Routes, Route } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'

const ReportsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Business insights and analytics</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Dashboard</h3>
          <p className="text-gray-600">Business reports and analytics will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Reports = () => {
  return (
    <Routes>
      <Route index element={<ReportsDashboard />} />
      <Route path="sales" element={<div>Sales Reports</div>} />
      <Route path="inventory" element={<div>Inventory Reports</div>} />
      <Route path="financial" element={<div>Financial Reports</div>} />
      <Route path="custom" element={<div>Custom Reports</div>} />
    </Routes>
  )
}

export default Reports

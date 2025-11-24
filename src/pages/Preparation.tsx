import { Routes, Route } from 'react-router-dom'
import { Package } from 'lucide-react'
import PreparationQueue from './PreparationQueue'

const PreparationDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Preparation Management</h1>
        <p className="text-gray-600">Manage order preparation and packing</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preparation Dashboard</h3>
          <p className="text-gray-600">Order preparation and packing management will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Preparation = () => {
  return (
    <Routes>
      <Route index element={<PreparationDashboard />} />
      <Route path="queue" element={<PreparationQueue />} />
      <Route path="assignments" element={<div>My Assignments</div>} />
      <Route path="history" element={<div>Preparation History</div>} />
    </Routes>
  )
}

export default Preparation



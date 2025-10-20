import { Routes, Route } from 'react-router-dom'
import { FileText } from 'lucide-react'

const InvoicingDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoicing</h1>
        <p className="text-gray-600">Manage invoices and payments</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Management</h3>
          <p className="text-gray-600">Invoice generation and payment tracking will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Invoicing = () => {
  return (
    <Routes>
      <Route index element={<InvoicingDashboard />} />
      <Route path="generate" element={<div>Generate Invoice</div>} />
      <Route path="history" element={<div>Invoice History</div>} />
      <Route path="payments" element={<div>Payment Tracking</div>} />
    </Routes>
  )
}

export default Invoicing

import { Routes, Route } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import PendingApprovals from './PendingApprovals'
import StoreConfiguration from './settings/StoreConfiguration'
import OrderApprovalSettings from './settings/OrderApprovalSettings'
import RolesManagement from './settings/RolesManagement'
import MyRoleSettings from './settings/MyRoleSettings'

const SettingsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600">Manage system settings and configuration</p>
      </div>

      <div className="gradient-card rounded-xl p-6">
        <div className="text-center py-12">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-600">System configuration and administration will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

const Settings = () => {
  return (
    <Routes>
      <Route index element={<SettingsDashboard />} />
      <Route path="approvals" element={<PendingApprovals />} />
        <Route path="users" element={<RolesManagement />} />
        <Route path="my-role" element={<MyRoleSettings />} />
        <Route path="system" element={<div>System Settings</div>} />
        <Route path="stores" element={<StoreConfiguration />} />
        <Route path="order-approval" element={<OrderApprovalSettings />} />
    </Routes>
  )
}

export default Settings

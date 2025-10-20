import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { BusinessProvider } from './contexts/BusinessContext'
import { UserApprovalProvider } from './contexts/UserApprovalContext'
import { UserManagementProvider } from './contexts/UserManagementContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { InventoryProvider } from './contexts/InventoryContext'
import { OrderProvider } from './contexts/OrderContext'
import { RoleProvider } from './contexts/RoleContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import UserRegistration from './pages/UserRegistration'
import BusinessSetup from './pages/BusinessSetup'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Preparation from './pages/Preparation'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import Transport from './pages/Transport'
import Invoicing from './pages/Invoicing'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserApprovalProvider>
          <BusinessProvider>
            <RoleProvider>
              <UserManagementProvider>
                <CustomerProvider>
                  <InventoryProvider>
                    <OrderProvider>
                    <div className="min-h-screen bg-gray-50">
                      <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<UserRegistration />} />
                        <Route path="/business-setup" element={<BusinessSetup />} />

                        {/* Default: redirect to dashboard if authenticated, otherwise login */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Protected routes with shared layout */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="orders/*" element={<Orders />} />
                                <Route path="preparation/*" element={<Preparation />} />
                                <Route path="inventory/*" element={<Inventory />} />
                                <Route path="customers/*" element={<Customers />} />
                                <Route path="sales/*" element={<Sales />} />
                                <Route path="transport/*" element={<Transport />} />
                                <Route path="invoicing/*" element={<Invoicing />} />
                                <Route path="reports/*" element={<Reports />} />
                                <Route path="settings/*" element={<Settings />} />
                          <Route path="help" element={<div>Help & Support</div>} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                      </Routes>
                    </div>
                  </OrderProvider>
                </InventoryProvider>
              </CustomerProvider>
            </UserManagementProvider>
            </RoleProvider>
          </BusinessProvider>
        </UserApprovalProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

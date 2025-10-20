import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerList from './customers/CustomerList'
import AddCustomer from './customers/AddCustomer'
import CustomerDetail from './customers/CustomerDetail'
import CustomerAccounts from './customers/CustomerAccounts'
import CreditManagement from './customers/CreditManagement'

const Customers = () => {
  return (
    <Routes>
      <Route index element={<CustomerList />} />
      <Route path="add" element={<AddCustomer />} />
      <Route path=":customerId" element={<CustomerDetail />} />
      <Route path="edit/:customerId" element={<AddCustomer />} />
      <Route path="accounts" element={<CustomerAccounts />} />
      <Route path="credit" element={<CreditManagement />} />
      <Route path="*" element={<Navigate to="/app/customers" replace />} />
    </Routes>
  )
}

export default Customers
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useCustomer } from '../../contexts/CustomerContext'
import { useCurrencyFormatter } from '../../hooks/useCurrency'

const CustomerAccounts = () => {
  const { customers } = useCustomer()
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<'all' | 'in_debt' | 'clear'>('all')
  const formatCurrency = useCurrencyFormatter()

  const filtered = useMemo(() => customers.filter(c => {
    const matches = (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    )
    const inDebt = c.creditUsed > 0
    const matchesStatus = status === 'all' || (status === 'in_debt' ? inDebt : !inDebt)
    return matches && matchesStatus
  }), [customers, searchTerm, status])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Accounts</h1>
          <p className="text-gray-600">Balances and account statements</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="in_debt">In Debt</option>
            <option value="clear">Cleared</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Credit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(c => {
                const available = Math.max(0, (c.creditLimit || 0) - (c.creditUsed || 0))
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                      <div className="text-sm text-gray-500">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(c.creditLimit || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(c.creditUsed || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(available)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/app/customers/${c.id}`} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Users className="h-4 w-4 mr-1" /> Statement
                        </Link>
                        <Link to={`/app/customers/edit/${c.id}`} className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">
                          <CreditCard className="h-4 w-4 mr-1" /> Adjust Limit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CustomerAccounts








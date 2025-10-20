import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const Dashboard = () => {
  // Mock data - in real app, this would come from Firebase
  const stats = [
    {
      name: 'Total Orders',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      name: 'Pending Orders',
      value: '23',
      change: '-5%',
      changeType: 'negative',
      icon: Clock,
      color: 'yellow'
    },
    {
      name: 'Products in Stock',
      value: '1,892',
      change: '+8%',
      changeType: 'positive',
      icon: Package,
      color: 'green'
    },
    {
      name: 'Low Stock Items',
      value: '15',
      change: '+3',
      changeType: 'warning',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      name: 'Active Customers',
      value: '456',
      change: '+18%',
      changeType: 'positive',
      icon: Users,
      color: 'purple'
    },
    {
      name: 'Monthly Revenue',
      value: '$24,567',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'emerald'
    }
  ]

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: '$1,250', status: 'Pending', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: '$890', status: 'Approved', date: '2024-01-15' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: '$2,100', status: 'Shipped', date: '2024-01-14' },
    { id: 'ORD-004', customer: 'Sarah Wilson', amount: '$750', status: 'Delivered', date: '2024-01-14' },
    { id: 'ORD-005', customer: 'David Brown', amount: '$1,800', status: 'Pending', date: '2024-01-13' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-blue-100 text-blue-800'
      case 'Shipped': return 'bg-purple-100 text-purple-800'
      case 'Delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getCardGradient = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-50 to-blue-100'
      case 'yellow': return 'from-yellow-50 to-yellow-100'
      case 'green': return 'from-green-50 to-green-100'
      case 'red': return 'from-red-50 to-red-100'
      case 'purple': return 'from-purple-50 to-purple-100'
      case 'emerald': return 'from-emerald-50 to-emerald-100'
      default: return 'from-gray-50 to-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your business management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className={`gradient-card rounded-xl p-6 border-l-4 ${
              stat.color === 'blue' ? 'border-l-blue-500' :
              stat.color === 'yellow' ? 'border-l-yellow-500' :
              stat.color === 'green' ? 'border-l-green-500' :
              stat.color === 'red' ? 'border-l-red-500' :
              stat.color === 'purple' ? 'border-l-purple-500' :
              'border-l-emerald-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${getChangeColor(stat.changeType)}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${getCardGradient(stat.color)}`}>
                  <Icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'red' ? 'text-red-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="gradient-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{order.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="gradient-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Create Order</p>
              <p className="text-sm text-gray-600">Start a new order</p>
            </button>
            <button className="p-4 bg-white rounded-lg border border-gray-100 hover:border-green-300 hover:bg-green-50 transition-colors text-left">
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Add Product</p>
              <p className="text-sm text-gray-600">Add new inventory</p>
            </button>
            <button className="p-4 bg-white rounded-lg border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">New Customer</p>
              <p className="text-sm text-gray-600">Register customer</p>
            </button>
            <button className="p-4 bg-white rounded-lg border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-left">
              <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-600">Business analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

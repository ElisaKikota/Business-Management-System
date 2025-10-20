import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Truck, 
  FileText, 
  BarChart3, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react'
import { useRole } from '../contexts/RoleContext'
import PermissionGuard from './PermissionGuard'

interface SidebarProps {
  isCollapsed: boolean
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation()
  const { userPermissions } = useRole()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const toggleExpanded = (item: string) => {
    setExpandedItem(prev => (prev === item ? null : item))
  }

  // Handle staged closing when sidebar is being collapsed
  useEffect(() => {
    if (isCollapsed && expandedItem) {
      // First close the expanded submenu
      setExpandedItem(null)
    }
  }, [isCollapsed])

  // Handle smooth animations

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    if (!userPermissions) return []
    
    return menuItems.filter(item => {
      const itemKey = item.name.toLowerCase().replace(/\s+/g, '-')
      return userPermissions.menuItems.includes(itemKey)
    })
  }

  // Permission mapping for menu items
  const getMenuPermissions = (itemName: string) => {
    const permissionMap: Record<string, string[]> = {
      'Dashboard': ['view_dashboard'],
      'Orders': ['view_orders'],
      'Preparation': ['prepare_orders'],
      'Inventory': ['view_inventory'],
      'Customers': ['view_customers'],
      'Sales': ['view_sales'],
      'Delivery': ['view_delivery'],
      'Invoicing': ['view_invoicing'],
      'Reports': ['view_reports'],
      'Settings': ['view_settings'],
      'Help': [] // Help is always accessible
    }
    return permissionMap[itemName] || []
  }

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      path: '/orders',
      children: [
        { name: 'All Orders', path: '/orders' },
        { name: 'Create Order', path: '/orders/create' },
        { name: 'Pending Approvals', path: '/orders/approvals' },
        { name: 'Order History', path: '/orders/history' }
      ]
    },
    {
      name: 'Preparation',
      icon: Package,
      path: '/preparation',
      children: [
        { name: 'Preparation Queue', path: '/preparation/queue' },
        { name: 'My Assignments', path: '/preparation/assignments' },
        { name: 'Preparation History', path: '/preparation/history' }
      ]
    },
    {
      name: 'Inventory',
      icon: Package,
      path: '/inventory',
      children: [
        { name: 'Main Store', path: '/inventory/main' },
        { name: 'Sub-Stores', path: '/inventory/substores' },
        { name: 'Product Catalog', path: '/inventory/products' },
        { name: 'Inventory Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
        { name: 'Low Stock Alerts', path: '/inventory/alerts' }
      ]
    },
    {
      name: 'Customers',
      icon: Users,
      path: '/customers',
      children: [
        { name: 'Customer List', path: '/customers' },
        { name: 'Add Customer', path: '/customers/add' },
        { name: 'Customer Accounts', path: '/customers/accounts' },
        { name: 'Credit Management', path: '/customers/credit' }
      ]
    },
    {
      name: 'Sales',
      icon: TrendingUp,
      path: '/sales',
      children: [
        { name: 'Sales Dashboard', path: '/sales' },
        { name: 'Create Sale', path: '/sales/create' },
        { name: 'Sales Reports', path: '/sales/reports' }
      ]
    },
    {
      name: 'Delivery',
      icon: Truck,
      path: '/transport',
      children: [
        { name: 'Active Deliveries', path: '/transport/active' },
        { name: 'Transport Management', path: '/transport/management' },
        { name: 'Delivery History', path: '/transport/history' }
      ]
    },
    {
      name: 'Invoicing',
      icon: FileText,
      path: '/invoicing',
      children: [
        { name: 'Generate Invoice', path: '/invoicing/generate' },
        { name: 'Invoice History', path: '/invoicing/history' },
        { name: 'Payment Tracking', path: '/invoicing/payments' }
      ]
    },
    {
      name: 'Reports',
      icon: BarChart3,
      path: '/reports',
      children: [
        { name: 'Sales Reports', path: '/reports/sales' },
        { name: 'Inventory Reports', path: '/reports/inventory' },
        { name: 'Financial Reports', path: '/reports/financial' },
        { name: 'Custom Reports', path: '/reports/custom' }
      ]
    },
          {
            name: 'Settings',
            icon: Settings,
            path: '/settings',
            children: [
              { name: 'My Role Settings', path: '/settings/my-role' },
              { name: 'Pending Approvals', path: '/settings/approvals' },
              { name: 'Order Approval Settings', path: '/settings/order-approval' },
              { name: 'User Management', path: '/settings/users' },
              { name: 'System Settings', path: '/settings/system' },
              { name: 'Store Configuration', path: '/settings/stores' }
            ]
          },
    {
      name: 'Help',
      icon: HelpCircle,
      path: '/help'
    }
  ]

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} sidebar-gradient text-white flex flex-col transition-all duration-500 ease-in-out overflow-hidden`}>
      {/* Clean sidebar without header titles */}
      
      <nav className={`flex-1 py-4 ${isCollapsed ? 'px-2' : 'px-4'} transition-all duration-300`}>
        {getFilteredMenuItems().map((item) => {
          const Icon = item.icon
          const itemKey = item.name.toLowerCase().replace(/\s+/g, '-')
          const isExpanded = expandedItem === itemKey
          const hasChildren = item.children && item.children.length > 0
          const requiredPermissions = getMenuPermissions(item.name)
          
          return (
            <PermissionGuard 
              key={item.name}
              permissions={requiredPermissions}
              fallback={null}
            >
              <div className="mb-2">
              {hasChildren ? (
                <>
                  <div
                    className={`flex items-center ${isCollapsed ? 'justify-start' : 'justify-between'} p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-blue-700'
                        : 'hover:bg-blue-700/50'
                    }`}
                    onClick={() => !isCollapsed && toggleExpanded(itemKey)}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-start' : 'space-x-3'} transition-all duration-300`}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                      {!isCollapsed && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                    </div>
                  </div>
                  
                  <div className={`transition-all duration-300 overflow-hidden ${isCollapsed || !isExpanded ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
                    <div className="ml-8 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 p-2 rounded-lg text-sm transition-all duration-300 ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'text-blue-200 hover:bg-blue-700/30 hover:text-white'
                              }`
                            }
                          >
                            {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                            <span className="transition-all duration-300">{child.name}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-700'
                        : 'hover:bg-blue-700/50'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-start' : 'space-x-3'} transition-all duration-300`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                      {item.name}
                    </span>
                  </div>
                </NavLink>
              )}
              </div>
            </PermissionGuard>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar

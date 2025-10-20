import { useState } from 'react'
import { Bell, User, LogOut, Settings, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import { useUserApproval } from '../contexts/UserApprovalContext'
import { useUserManagement } from '../contexts/UserManagementContext'

interface HeaderProps {
  onToggleSidebar: () => void
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { currentUser, logout } = useAuth()
  const { currentBusiness, pendingMembers } = useBusiness()
  const { approvalStatus } = useUserApproval()
  const { businessUsers } = useUserManagement()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Get current user's business user data
  const currentBusinessUser = businessUsers.find(user => user.userId === currentUser?.uid)
  
  // Format user name and role
  const getUserDisplayName = () => {
    if (currentBusinessUser?.userName) {
      return currentBusinessUser.userName
    }
    return currentUser?.email?.split('@')[0] || 'User'
  }

  const getUserRole = () => {
    if (approvalStatus.role) {
      return approvalStatus.role.replace('_', ' ').toUpperCase()
    }
    return 'USER'
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentBusiness?.name || 'Business Management System'}
            </h2>
            <p className="text-gray-600 text-sm">
              {getUserDisplayName()}, {getUserRole()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {pendingMembers.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={getUserDisplayName()}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

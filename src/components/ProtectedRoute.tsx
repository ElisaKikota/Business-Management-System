import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import { useUserApproval } from '../contexts/UserApprovalContext'
import { LogOut } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading: authLoading, logout } = useAuth()
  const { currentBusiness, loading: businessLoading } = useBusiness()
  const { approvalStatus } = useUserApproval()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  if (authLoading || businessLoading || approvalStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!currentBusiness) {
    // No current business: prompt user instead of redirecting away
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Selected</h2>
          <p className="text-gray-600 mb-4">Complete registration or join an existing business to continue.</p>
          <a href="/business-setup" className="inline-block px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Go to Business Setup</a>
        </div>
      </div>
    )
  }

  // Check if user is approved
  if (!approvalStatus.isApproved) {
    if (approvalStatus.status === 'pending') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Approval</h2>
            <p className="text-gray-600 mb-4">Your account is pending admin approval.</p>
            <p className="text-sm text-gray-500 mb-6">Please wait for an administrator to approve your access.</p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )
    } else if (approvalStatus.status === 'suspended') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Your account has been suspended.</p>
            <p className="text-sm text-gray-500">Please contact an administrator for assistance.</p>
          </div>
        </div>
      )
    } else {
      return <Navigate to="/business-setup" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

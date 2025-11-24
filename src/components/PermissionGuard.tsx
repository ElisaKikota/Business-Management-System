import React from 'react'
import { useRole } from '../contexts/RoleContext'
import { Shield } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showAccessDenied = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRole()

  // Check permissions
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions)
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } else {
    // If no permissions specified, allow access
    hasAccess = true
  }

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this content.</p>
          </div>
        </div>
      )
    }
    
    return fallback
  }

  return <>{children}</>
}

export default PermissionGuard



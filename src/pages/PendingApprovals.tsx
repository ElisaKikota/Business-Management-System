import { useState } from 'react'
import { useBusiness } from '../contexts/BusinessContext'
import { Users, CheckCircle, XCircle, Clock, User, Mail, Phone } from 'lucide-react'

const PendingApprovals = () => {
  const { pendingMembers, approveMember, rejectMember, currentBusiness } = useBusiness()
  const [loading, setLoading] = useState(false)
  
  // No need to fetch user details separately as they're now stored in the member data

  const handleApprove = async (memberId: string) => {
    setLoading(true)
    try {
      await approveMember(memberId)
    } catch (error) {
      console.error('Error approving member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (memberId: string) => {
    setLoading(true)
    try {
      await rejectMember(memberId)
    } catch (error) {
      console.error('Error rejecting member:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'packer': return 'bg-blue-100 text-blue-800'
      case 'inventory_manager': return 'bg-purple-100 text-purple-800'
      case 'sales_rep': return 'bg-green-100 text-green-800'
      case 'accountant': return 'bg-yellow-100 text-yellow-800'
      case 'customer': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'sales_rep': return 'Sales Representative'
      case 'inventory_manager': return 'Inventory Manager'
      case 'packer': return 'Packer'
      case 'customer': return 'Customer'
      default: return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  if (!currentBusiness) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600">Manage team member requests</p>
        </div>
        <div className="gradient-card rounded-xl p-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Selected</h3>
            <p className="text-gray-600">Please select a business to view pending approvals</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600">Review and approve team member requests for {currentBusiness.name}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{pendingMembers.length} pending request{pendingMembers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {pendingMembers.length === 0 ? (
        <div className="gradient-card rounded-xl p-6">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-gray-600">All team member requests have been processed</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingMembers.map((member) => {
            return (
              <div key={member.id} className="gradient-card rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {`${member.firstName} ${member.lastName}`}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                          {formatRoleName(member.role)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Requested on {member.joinedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PendingApprovals

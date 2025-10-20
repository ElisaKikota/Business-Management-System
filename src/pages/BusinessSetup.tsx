import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../contexts/BusinessContext'
import { Building2, UserPlus, Key, CheckCircle } from 'lucide-react'

const BusinessSetup = () => {
  const [mode, setMode] = useState<'register' | 'join'>('register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [authorizationCodes, setAuthorizationCodes] = useState<{
    businessCode: string;
    systemCode: string;
  } | null>(null)
  
  const { createBusiness, joinBusiness } = useBusiness()
  const navigate = useNavigate()

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    businessType: '',
    mainStoreLocation: '',
    currency: 'USD',
    timezone: 'UTC'
  })

  const [joinForm, setJoinForm] = useState({
    authorizationCode: '',
    role: 'sales_rep' as 'admin' | 'business_owner' | 'sales_rep' | 'inventory_manager' | 'packer' | 'accountant' | 'customer',
    systemAuthCode: ''
  })

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Generate authorization codes first
      const businessCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const systemCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      await createBusiness({
        name: businessForm.businessName,
        email: businessForm.email,
        phone: businessForm.phone,
        address: businessForm.address,
        businessType: businessForm.businessType,
        ownerId: '', // Will be set in context
        settings: {
          mainStoreLocation: businessForm.mainStoreLocation,
          approvalRoles: ['Admin', 'Sales Manager'],
          currency: businessForm.currency,
          timezone: businessForm.timezone
        }
      }, { businessCode, systemCode })
      
      setAuthorizationCodes({ businessCode, systemCode })
      setSuccess('Business registered successfully! Save these authorization codes.')
    } catch (error: any) {
      setError(error.message || 'Failed to register business')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await joinBusiness(
        joinForm.authorizationCode, 
        joinForm.role, 
        joinForm.role === 'admin' ? joinForm.systemAuthCode : undefined
      )
      
      if (joinForm.role === 'admin' && joinForm.systemAuthCode) {
        setSuccess('Successfully joined as admin! You now have full access.')
        setTimeout(() => navigate('/app/dashboard'), 1500)
      } else {
        setSuccess('Join request submitted! Please wait for admin approval. Redirecting to login...')
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to join business')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (mode === 'register') {
      setBusinessForm({
        ...businessForm,
        [e.target.name]: e.target.value
      })
    } else {
      setJoinForm({
        ...joinForm,
        [e.target.name]: e.target.value
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            {mode === 'register' ? (
              <Building2 className="h-8 w-8 text-white" />
            ) : (
              <UserPlus className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {mode === 'register' ? 'Register Your Business' : 'Join Existing Business'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'register' 
              ? 'Set up your business profile and create an authorization code for your team'
              : 'Enter the authorization code provided by your business administrator'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Register Business
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Business
          </button>
        </div>

        <div className="gradient-card rounded-xl p-8 shadow-lg">
          {mode === 'register' ? (
            <form className="space-y-6" onSubmit={handleBusinessSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {success}
                  </div>
                </div>
              )}

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Business Name *
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={businessForm.businessName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      required
                      value={businessForm.businessType}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select business type</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="distribution">Distribution</option>
                      <option value="service">Service</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Business Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={businessForm.email}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter business email"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Business Phone *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={businessForm.phone}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Business Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={businessForm.address}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter complete business address"
                  />
                </div>
              </div>


              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="mainStoreLocation" className="block text-sm font-medium text-gray-700">
                      Main Store Location *
                    </label>
                    <input
                      id="mainStoreLocation"
                      name="mainStoreLocation"
                      type="text"
                      required
                      value={businessForm.mainStoreLocation}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={businessForm.currency}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="TZS">TZS (TSh)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={businessForm.timezone}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Africa/Nairobi">Nairobi</option>
                      <option value="Africa/Dar_es_Salaam">Dar es Salaam</option>
                    </select>
                  </div>
                </div>
              </div>

              {authorizationCodes ? (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Authorization Codes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      <strong>Important:</strong> Save these codes securely. You'll need them to invite team members and grant admin access.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Sync Code (for team members)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={authorizationCodes.businessCode}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-center text-lg font-mono tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(authorizationCodes.businessCode)}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          System Authorization Code (for admin only)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={authorizationCodes.systemCode}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-center text-lg font-mono tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(authorizationCodes.systemCode)}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/app/dashboard')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Register Business'
                    )}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleJoinSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {success}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <Key className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Join Existing Business
                </h3>
                <p className="text-sm text-gray-600">
                  Enter the business authorization code and select your role.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Your Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={joinForm.role}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="packer">Packer</option>
                    <option value="accountant">Accountant</option>
                    <option value="customer">Customer</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Admin role requires system authorization code
                  </p>
                </div>

                <div>
                  <label htmlFor="authorizationCode" className="block text-sm font-medium text-gray-700">
                    Business Authorization Code *
                  </label>
                  <input
                    id="authorizationCode"
                    name="authorizationCode"
                    type="text"
                    required
                    value={joinForm.authorizationCode}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg font-mono tracking-wider"
                    placeholder="Enter 6-character code"
                    maxLength={6}
                  />
                </div>

                {joinForm.role === 'admin' && (
                  <div>
                    <label htmlFor="systemAuthCode" className="block text-sm font-medium text-gray-700">
                      System Authorization Code *
                    </label>
                    <input
                      id="systemAuthCode"
                      name="systemAuthCode"
                      type="text"
                      required
                      value={joinForm.systemAuthCode}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg font-mono tracking-wider"
                      placeholder="Enter system code"
                      maxLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Required for admin access. Get this from the business owner.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Join Business'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessSetup

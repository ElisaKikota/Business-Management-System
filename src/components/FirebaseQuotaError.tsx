import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'

const FirebaseQuotaError = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  const openFirebaseConsole = () => {
    window.open('https://console.firebase.google.com/', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Firebase Quota Exceeded
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your Firebase project has exceeded its usage limits. This is preventing the application from loading data.
          </p>
          
          <div className="space-y-3">
            <div className="text-left">
              <h3 className="font-medium text-gray-900 mb-2">Solutions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Wait for quota reset (usually 24 hours)</li>
                <li>• Upgrade to Blaze plan (pay-as-you-go)</li>
                <li>• Check Firebase Console for usage details</li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleRefresh}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={openFirebaseConsole}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Firebase Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirebaseQuotaError



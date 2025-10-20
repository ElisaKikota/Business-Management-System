import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Load from localStorage or default to false
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev: boolean) => !prev)
  }

  // Save to localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Full-width header at the top */}
      <Header onToggleSidebar={toggleSidebar} />
      
      {/* Content area with sidebar and main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

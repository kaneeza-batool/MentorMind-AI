import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DesktopSidebar, { MobileDrawer } from './Sidebar'
import Header from './Header'

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar />

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header — hidden on desktop */}
        <Header onMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-auto" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

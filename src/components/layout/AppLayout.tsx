import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useUiStore } from '@/store/uiStore'

export function AppLayout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUiStore()

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Drawer overlay (all screen sizes) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Dark top header with hamburger + logo */}
      <header className="flex items-center gap-3 px-4 py-3 bg-gray-900 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-white hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="font-bold text-white text-lg">InspekcjAI</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}

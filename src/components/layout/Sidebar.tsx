import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, ClipboardList, Users, FileText,
  Building2, Settings, CreditCard, LogOut, X,
} from 'lucide-react'
import { ROUTES } from '@/router/routePaths'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { supabase } from '@/config/supabase'

const navItems = [
  { to: ROUTES.DASHBOARD,       icon: LayoutDashboard, label: 'Panel główny' },
  { to: ROUTES.INSPECTIONS,     icon: ClipboardList,   label: 'Inspekcje' },
  { to: ROUTES.CLIENTS,         icon: Users,           label: 'Klienci' },
  { to: ROUTES.REPORTS,         icon: FileText,        label: 'Raporty' },
  { to: ROUTES.COMPANY_PROFILE, icon: Building2,       label: 'Profil Firmy' },
] as const

const bottomItems = [
  { to: ROUTES.SETTINGS,     icon: Settings,        label: 'Ustawienia' },
  { to: ROUTES.SUBSCRIPTION, icon: CreditCard,      label: 'Subskrypcja' },
] as const

export function Sidebar() {
  const profile = useAuthStore((s) => s.profile)
  const { setSidebarOpen } = useUiStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setSidebarOpen(false)
    await supabase.auth.signOut()
    useAuthStore.getState().reset()
    navigate(ROUTES.LOGIN)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition-colors',
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header with logo + close button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">InspekcjAI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X size={22} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.DASHBOARD}
            className={linkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 mt-2">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary-700 text-sm font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'Użytkownik'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-2 shrink-0 rounded-lg hover:bg-gray-100"
            title="Wyloguj"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

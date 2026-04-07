import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { LayoutDashboard, ClipboardList, Users, FileText, Building2, Settings } from 'lucide-react'
import { ROUTES } from '@/router/routePaths'

const items = [
  { to: ROUTES.DASHBOARD,       icon: LayoutDashboard, label: 'Panel' },
  { to: ROUTES.INSPECTIONS,     icon: ClipboardList,   label: 'Inspekcje' },
  { to: ROUTES.CLIENTS,         icon: Users,           label: 'Klienci' },
  { to: ROUTES.REPORTS,         icon: FileText,        label: 'Raporty' },
  { to: ROUTES.COMPANY_PROFILE, icon: Building2,       label: 'Profil Firmy' },
  { to: ROUTES.SETTINGS,        icon: Settings,        label: 'Ustawienia' },
] as const

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
      <div className="flex">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.DASHBOARD}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary-600' : 'text-gray-500',
            )}
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

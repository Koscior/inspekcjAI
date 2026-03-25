import { ClipboardList, Users, FileText, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Card, Button, Badge } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'
import { FREE_PLAN_REPORT_LIMIT } from '@/config/constants'

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const reportsUsed = profile?.reports_used_this_month ?? 0
  const reportLimit = profile?.subscription_plan === 'free' ? FREE_PLAN_REPORT_LIMIT : null
  const usagePercent = reportLimit ? Math.min((reportsUsed / reportLimit) * 100, 100) : 0

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dzień dobry, {profile?.full_name?.split(' ')[0] ?? 'Inspektorze'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Co dziś chcesz sprawdzić?</p>
      </div>

      {/* Quick action */}
      <Link to={ROUTES.INSPECTION_NEW}>
        <Button leftIcon={<Plus size={16} />} className="mb-6">
          Nowa inspekcja
        </Button>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500">Inspekcje</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500">Klienci</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500">Raporty</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage quota (free plan) */}
      {profile?.subscription_plan === 'free' && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">Raporty w tym miesiącu</p>
              <p className="text-xs text-gray-500">{reportsUsed} / {reportLimit} wykorzystanych</p>
            </div>
            <Badge color={reportsUsed >= (reportLimit ?? 3) ? 'red' : 'blue'}>
              Plan Darmowy
            </Badge>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {reportsUsed >= (reportLimit ?? 3) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-red-600">Osiągnięto limit raportów</p>
              <Link to={ROUTES.SUBSCRIPTION}>
                <Button size="xs" variant="primary">Ulepsz plan</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Recent inspections placeholder */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Ostatnie inspekcje</h2>
          <Link to={ROUTES.INSPECTIONS} className="text-sm text-primary-600 hover:underline">
            Zobacz wszystkie
          </Link>
        </div>
        <div className="text-center py-8 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Brak inspekcji</p>
          <p className="text-xs mt-1">Utwórz pierwszą inspekcję, aby zobaczyć ją tutaj</p>
        </div>
      </Card>
    </div>
  )
}

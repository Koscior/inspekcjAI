import { ClipboardList, Users, FileText, Plus, ChevronRight, AlertTriangle, Calendar } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Card, Button, Badge, StatusBadge, Spinner } from '@/components/ui'
import { ROUTES, buildPath } from '@/router/routePaths'
import { FREE_PLAN_REPORT_LIMIT, INSPECTION_TYPES } from '@/config/constants'
import { useInspections } from '@/hooks/useInspections'
import { useClients } from '@/hooks/useClients'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Inspection } from '@/types/database.types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const reportsUsed = profile?.reports_used_this_month ?? 0
  const reportLimit = profile?.subscription_plan === 'free' ? FREE_PLAN_REPORT_LIMIT : null
  const usagePercent = reportLimit ? Math.min((reportsUsed / reportLimit) * 100, 100) : 0

  const { data: inspections, isLoading: loadingInspections } = useInspections()
  const { data: clients, isLoading: loadingClients } = useClients()

  const totalInspections = inspections?.length ?? 0
  const activeInspections = inspections?.filter((i) => i.status === 'in_progress').length ?? 0
  const totalClients = clients?.length ?? 0
  const recentInspections = inspections?.slice(0, 5) ?? []

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Dzień dobry, {profile?.full_name?.split(' ')[0] ?? 'Inspektorze'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Co dziś chcesz sprawdzić?</p>
      </div>

      {/* Big "New inspection" button */}
      <Button
        onClick={() => navigate(ROUTES.INSPECTION_NEW)}
        className="w-full py-4 text-base font-bold gap-2"
      >
        <Plus size={20} />
        Nowa inspekcja
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="text-center">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <ClipboardList size={22} className="text-blue-600" />
            </div>
            {loadingInspections ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{totalInspections}</p>
            )}
            <p className="text-xs text-gray-500">Inspekcje</p>
            {activeInspections > 0 && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">{activeInspections} w trakcie</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users size={22} className="text-green-600" />
            </div>
            {loadingClients ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            )}
            <p className="text-xs text-gray-500">Klienci</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-11 h-11 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText size={22} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{reportsUsed}</p>
            <p className="text-xs text-gray-500">
              Raporty {reportLimit ? `/ ${reportLimit}` : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Free plan quota */}
      {profile?.subscription_plan === 'free' && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">Raporty w tym miesiącu</p>
              <p className="text-xs text-gray-500">{reportsUsed} / {reportLimit} wykorzystanych</p>
            </div>
            <Badge color={reportsUsed >= (reportLimit ?? 3) ? 'red' : 'blue'}>Plan Darmowy</Badge>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {reportsUsed >= (reportLimit ?? 3) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                Osiągnięto limit raportów
              </p>
              <Link to={ROUTES.SUBSCRIPTION}>
                <Button size="xs">Ulepsz plan</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Recent inspections */}
      <Card padding="none">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ostatnie inspekcje</h2>
          <Link to={ROUTES.INSPECTIONS} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Wszystkie
            <ChevronRight size={14} />
          </Link>
        </div>

        {loadingInspections ? (
          <div className="flex justify-center py-10">
            <Spinner label="Ładowanie..." />
          </div>
        ) : recentInspections.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Brak inspekcji</p>
            <p className="text-xs mt-1">Utwórz pierwszą inspekcję</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentInspections.map((insp) => {
              const i = insp as typeof insp & {
                clients: { full_name: string } | null
                defects: { count: number }[]
              }
              const defectCount = i.defects?.[0]?.count ?? 0

              return (
                <button
                  key={insp.id}
                  type="button"
                  onClick={() => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: insp.id }))}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-500">
                        {INSPECTION_TYPES[insp.type as Inspection['type']]}
                      </span>
                      <StatusBadge status={insp.status} />
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                      {insp.title}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {i.clients && (
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {i.clients.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {format(
                          new Date(insp.inspection_date ?? insp.created_at),
                          'd MMM yyyy',
                          { locale: pl }
                        )}
                      </span>
                      {defectCount > 0 && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <AlertTriangle size={10} />
                          {defectCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover:text-primary-500 transition-colors" />
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.CLIENT_NEW)}
          className="justify-center gap-2 py-4 text-sm font-semibold"
        >
          <Users size={18} />
          Nowy klient
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.CLIENTS)}
          className="justify-center gap-2 py-4 text-sm font-semibold"
        >
          <ClipboardList size={18} />
          Lista klientów
        </Button>
      </div>
    </div>
  )
}

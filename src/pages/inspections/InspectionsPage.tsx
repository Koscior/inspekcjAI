import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MapPin, User, Calendar, AlertTriangle, ChevronRight, Filter
} from 'lucide-react'
import { useInspections, type InspectionFilters } from '@/hooks/useInspections'
import { INSPECTION_TYPES } from '@/config/constants'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Button, Badge, StatusBadge, Card, EmptyState, Spinner } from '@/components/ui'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Inspection } from '@/types/database.types'

// ─── Typ ikony per inspection type ───────────────────────────────────────────

const TYPE_COLOR: Record<Inspection['type'], string> = {
  roczny:            'bg-blue-100 text-blue-700',
  piecioletni:       'bg-purple-100 text-purple-700',
  plac_zabaw:        'bg-green-100 text-green-700',
  odbior_mieszkania: 'bg-orange-100 text-orange-700',
  ogolna:            'bg-gray-100 text-gray-700',
}

// ─── InspectionCard ───────────────────────────────────────────────────────────

interface InspectionWithRelations {
  id: string
  title: string
  type: Inspection['type']
  status: Inspection['status']
  address: string
  inspection_date: string | null
  created_at: string
  clients: { id: string; full_name: string; email: string | null; phone: string | null } | null
  defects: { count: number }[]
}

function InspectionCard({ inspection, onClick }: {
  inspection: InspectionWithRelations
  onClick: () => void
}) {
  const defectCount = inspection.defects?.[0]?.count ?? 0

  return (
    <Card hover onClick={onClick} className="group">
      <div className="flex items-start gap-3">
        {/* Type indicator */}
        <div className={`mt-0.5 rounded-lg px-2 py-1 text-xs font-semibold shrink-0 ${TYPE_COLOR[inspection.type]}`}>
          {INSPECTION_TYPES[inspection.type].split(' ')[0]}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {inspection.title}
            </h3>
            <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5 group-hover:text-primary-600 transition-colors" />
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {inspection.address && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{inspection.address}</span>
              </span>
            )}
            {inspection.clients && (
              <span className="flex items-center gap-1">
                <User size={12} className="shrink-0" />
                <span className="truncate">{inspection.clients.full_name}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} className="shrink-0" />
              {inspection.inspection_date
                ? format(new Date(inspection.inspection_date), 'd MMM yyyy', { locale: pl })
                : format(new Date(inspection.created_at), 'd MMM yyyy', { locale: pl })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={inspection.status} />
        {defectCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <AlertTriangle size={12} className="text-orange-400" />
            {defectCount} {defectCount === 1 ? 'usterka' : defectCount < 5 ? 'usterki' : 'usterek'}
          </span>
        )}
      </div>
    </Card>
  )
}

// ─── Filters bar ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: Inspection['status'] | ''; label: string }> = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'draft', label: 'Szkic' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'completed', label: 'Zakończona' },
  { value: 'sent', label: 'Wysłana' },
]

const TYPE_OPTIONS: Array<{ value: Inspection['type'] | ''; label: string }> = [
  { value: '', label: 'Wszystkie typy' },
  ...Object.entries(INSPECTION_TYPES).map(([value, label]) => ({
    value: value as Inspection['type'],
    label,
  })),
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InspectionsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<InspectionFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, error } = useInspections({ ...filters, search: search || undefined })

  function handleCardClick(id: string) {
    navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id }))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspekcje</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.length} {data.length === 1 ? 'inspekcja' : data.length < 5 ? 'inspekcje' : 'inspekcji'}
            </p>
          )}
        </div>
        <Button onClick={() => navigate(ROUTES.INSPECTION_NEW)} className="gap-2">
          <Plus size={16} />
          Nowa inspekcja
        </Button>
      </div>

      {/* Search + Filters toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj po nazwie lub adresie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showFilters || filters.type || filters.status
              ? 'border-primary-500 text-primary-700 bg-primary-50'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={15} />
          Filtry
          {(filters.type || filters.status) && (
            <Badge color="blue" size="sm">
              {[filters.type, filters.status].filter(Boolean).length}
            </Badge>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Typ</label>
            <select
              value={filters.type ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value as Inspection['type']) || undefined }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <select
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as Inspection['status']) || undefined }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {(filters.type || filters.status) && (
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setFilters({})}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
              >
                Wyczyść
              </button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Ładowanie inspekcji..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Błąd podczas ładowania inspekcji. Spróbuj odświeżyć stronę.
        </div>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <EmptyState
          icon={search || filters.type || filters.status ? Search : undefined}
          title={search || filters.type || filters.status ? 'Brak wyników' : 'Brak inspekcji'}
          description={
            search || filters.type || filters.status
              ? 'Zmień kryteria wyszukiwania lub usuń filtry.'
              : 'Utwórz pierwszą inspekcję klikając przycisk powyżej.'
          }
          action={
            !search && !filters.type && !filters.status
              ? { label: 'Nowa inspekcja', onClick: () => navigate(ROUTES.INSPECTION_NEW) }
              : undefined
          }
        />
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection as InspectionWithRelations}
              onClick={() => handleCardClick(inspection.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

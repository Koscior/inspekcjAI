import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Bug, Filter } from 'lucide-react'
import { useDefects, type DefectFilters } from '@/hooks/useDefects'
import { ROUTES, buildPath } from '@/router/routePaths'
import { DEFECT_CATEGORIES, DEFECT_SEVERITY, DEFECT_TYPES, DEFECT_STATUSES } from '@/config/constants'
import { Button, Spinner, Badge, SeverityBadge, StatusBadge, EmptyState, Card } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { getPhotoUrl } from '@/hooks/usePhotos'

export default function DefectsPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DefectFilters>({})
  const [sortBy, setSortBy] = useState<'number' | 'severity' | 'date' | 'status'>('number')

  const activeFilters: DefectFilters = {
    ...filters,
    search: search || undefined,
  }

  const { data: defects, isLoading } = useDefects(inspectionId, activeFilters)

  // Sort defects
  const severityOrder = { critical: 0, serious: 1, minor: 2 }
  const statusOrder = { open: 0, in_progress: 1, closed: 2 }
  const sorted = defects ? [...defects].sort((a, b) => {
    if (sortBy === 'severity') return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
    if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'status') return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    return a.number - b.number
  }) : []

  // Group defects by category
  const grouped = new Map<string, typeof defects>()
  for (const d of sorted) {
    const cat = d.category || 'Bez kategorii'
    const existing = grouped.get(cat)
    if (existing) existing.push(d)
    else grouped.set(cat, [d])
  }

  return (
    <div className="max-w-2xl mx-auto">
      <InspectionNav />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Usterki</h1>
        <Button
          size="sm"
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_NEW, { id: inspectionId! }))}
        >
          <Plus size={16} />
          Dodaj
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj usterek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Kategoria</label>
            <select
              className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              value={filters.category || ''}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
            >
              <option value="">Wszystkie</option>
              {DEFECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Ważność</label>
              <select
                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                value={filters.severity || ''}
                onChange={(e) => setFilters((f) => ({ ...f, severity: (e.target.value || undefined) as DefectFilters['severity'] }))}
              >
                <option value="">Wszystkie</option>
                {Object.entries(DEFECT_SEVERITY).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                value={filters.status || ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as DefectFilters['status'] }))}
              >
                <option value="">Wszystkie</option>
                {Object.entries(DEFECT_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Typ zgłoszenia</label>
              <select
                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                value={filters.type || ''}
                onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value || undefined) as DefectFilters['type'] }))}
              >
                <option value="">Wszystkie</option>
                {Object.entries(DEFECT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Sortowanie</label>
              <select
                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="number">Nr (rosnąco)</option>
                <option value="severity">Ważność</option>
                <option value="date">Data (najnowsze)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({})}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Wyczyść filtry
            </button>
          )}
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" label="Ładowanie usterek..." className="py-16" />
      ) : !defects?.length ? (
        <EmptyState
          icon={Bug}
          title="Brak usterek"
          description="Dodaj pierwszą usterkę do tej inspekcji"
          action={{
            label: 'Dodaj usterkę',
            onClick: () => navigate(buildPath(ROUTES.INSPECTION_DEFECT_NEW, { id: inspectionId! })),
          }}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {category} — zgłoszeń: {items!.length}
              </h3>
              <div className="space-y-2">
                {items!.map((defect) => {
                  const thumb = (defect as any).photos?.[0]?.thumbnail_path
                  return (
                    <button
                      key={defect.id}
                      onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, {
                        id: inspectionId!,
                        defectId: defect.id,
                      }))}
                      className="w-full text-left bg-white rounded-xl border border-gray-200 p-3 hover:border-primary-300 hover:shadow-sm transition-all flex gap-3"
                    >
                      {thumb && (
                        <img
                          src={getPhotoUrl(thumb)}
                          alt=""
                          className="w-14 h-14 object-cover rounded-lg shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-gray-400">#{defect.number}</span>
                          <SeverityBadge severity={defect.severity} />
                          <StatusBadge status={defect.status} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{defect.title}</p>
                        {defect.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{defect.description}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_NEW, { id: inspectionId! }))}
        className="fixed bottom-20 right-4 sm:hidden w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}

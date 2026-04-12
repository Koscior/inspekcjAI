import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { FileText, Download, ExternalLink, Loader2, Send, Search, Filter } from 'lucide-react'
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui'
import { REPORT_TYPES, INSPECTION_TYPES } from '@/config/constants'
import { useReports, getReportDownloadUrl } from '@/hooks/useReports'
import { buildPath, ROUTES } from '@/router/routePaths'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

const REPORT_TYPE_OPTIONS = [
  { value: '', label: 'Wszystkie typy' },
  ...Object.entries(REPORT_TYPES).map(([value, label]) => ({ value, label })),
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const { data: reports, isLoading, error } = useReports()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    if (!reports) return []
    return reports.filter((r) => {
      if (typeFilter && r.report_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const title = r.inspections?.title?.toLowerCase() ?? ''
        const address = r.inspections?.address?.toLowerCase() ?? ''
        const num = r.report_number?.toLowerCase() ?? ''
        if (!title.includes(q) && !address.includes(q) && !num.includes(q)) return false
      }
      return true
    })
  }, [reports, search, typeFilter])

  const handleDownload = async (reportId: string, pdfPath: string | null) => {
    if (!pdfPath) return
    setDownloadingId(reportId)
    try {
      const url = await getReportDownloadUrl(pdfPath)
      window.open(url, '_blank')
    } catch (err) {
      Sentry.captureException(err, { tags: { action: 'report_download' } })
    } finally {
      setDownloadingId(null)
    }
  }

  const hasActiveFilters = !!typeFilter

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Błąd ładowania raportów: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporty</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} z {reports?.length ?? 0} raportów
          </p>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj po nazwie, adresie lub numerze..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-primary-500 text-primary-700 bg-primary-50'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={15} />
          Filtry
          {hasActiveFilters && (
            <Badge color="blue" size="sm">1</Badge>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Typ raportu</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {REPORT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setTypeFilter('')}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
              >
                Wyczyść
              </button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-300" />}
          title={search || typeFilter ? 'Brak wyników' : 'Brak raportów'}
          description={
            search || typeFilter
              ? 'Zmień kryteria wyszukiwania lub usuń filtry.'
              : 'Wygeneruj pierwszy raport z poziomu inspekcji.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const inspectionTitle = report.inspections?.title || '—'
            const inspectionType = report.inspections?.type as string
            const typeLabel =
              INSPECTION_TYPES[inspectionType as keyof typeof INSPECTION_TYPES] || inspectionType

            return (
              <Card key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color="blue">
                        {REPORT_TYPES[report.report_type as keyof typeof REPORT_TYPES]}
                      </Badge>
                      <span className="text-xs text-gray-400">v{report.version}</span>
                      <span className="text-xs font-mono text-gray-500">
                        {report.report_number}
                      </span>
                      {report.sent_at && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                          <Send className="w-3 h-3" />
                          Wysłany {format(new Date(report.sent_at), 'd MMM', { locale: pl })}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-gray-900 mt-1.5 truncate">{inspectionTitle}</p>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{typeLabel}</span>
                      <span>
                        {format(new Date(report.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(
                          buildPath(ROUTES.INSPECTION_REPORT, {
                            id: report.inspection_id,
                          }),
                        )
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!report.pdf_path || downloadingId === report.id}
                      onClick={() => handleDownload(report.id, report.pdf_path)}
                    >
                      {downloadingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

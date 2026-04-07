import { useNavigate } from 'react-router-dom'
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react'
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui'
import { REPORT_TYPES, INSPECTION_TYPES } from '@/config/constants'
import { useReports, getReportDownloadUrl } from '@/hooks/useReports'
import { buildPath, ROUTES } from '@/router/routePaths'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useState } from 'react'

export default function ReportsPage() {
  const navigate = useNavigate()
  const { data: reports, isLoading, error } = useReports()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (reportId: string, pdfPath: string | null) => {
    if (!pdfPath) return
    setDownloadingId(reportId)
    try {
      const url = await getReportDownloadUrl(pdfPath)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloadingId(null)
    }
  }

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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporty</h1>
          <p className="text-gray-500 text-sm mt-1">
            Wygenerowane raporty z inspekcji ({reports?.length || 0})
          </p>
        </div>
      </div>

      {!reports || reports.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-300" />}
          title="Brak raportów"
          description="Wygeneruj pierwszy raport z poziomu inspekcji"
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
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

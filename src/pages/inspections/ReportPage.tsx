import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { FileText, Download, Eye, AlertTriangle, CheckCircle, Loader2, ChevronLeft } from 'lucide-react'
import { Button, Card, Spinner } from '@/components/ui'
import { REPORT_TYPES, INSPECTION_TYPES, CHECKLIST_INSPECTION_TYPES, FLOORPLAN_INSPECTION_TYPES } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { collectReportData, type ReportData } from '@/services/reportDataService'
import { TechnicalReport } from '@/components/reports/TechnicalReport'
import { TaskReport } from '@/components/reports/TaskReport'
import { ProtocolReport } from '@/components/reports/ProtocolReport'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { buildPath, ROUTES } from '@/router/routePaths'
import { useSaveReport } from '@/hooks/useReports'

type ReportType = 'techniczny' | 'zadania' | 'protokol'

interface PreflightCheck {
  label: string
  ok: boolean
  warning?: string
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [selectedType, setSelectedType] = useState<ReportType>('techniczny')
  const [progress, setProgress] = useState<{ step: string; current: number; total: number } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const saveReport = useSaveReport()

  // Fetch inspection for preflight checks
  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection-report-preflight', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, defects(id), photos(id), floor_plans(id), checklist_items(id)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 30_000,
  })

  // Reset selected type when inspection loads
  useEffect(() => {
    if (!inspection) return
    const isProtocolOnly = CHECKLIST_INSPECTION_TYPES.includes(
      inspection.type as typeof CHECKLIST_INSPECTION_TYPES[number]
    )
    setSelectedType(isProtocolOnly ? 'protokol' : 'techniczny')
  }, [inspection?.type])

  // Preflight checks
  const preflightChecks: PreflightCheck[] = inspection
    ? [
        {
          label: 'Dane inspekcji',
          ok: !!inspection.title && !!inspection.address,
          warning: 'Brak tytułu lub adresu inspekcji',
        },
        ...(!CHECKLIST_INSPECTION_TYPES.includes(inspection.type as typeof CHECKLIST_INSPECTION_TYPES[number])
          ? [{
              label: 'Usterki / zgłoszenia',
              ok: (inspection.defects?.length ?? 0) > 0,
              warning: 'Brak zarejestrowanych usterek — raport będzie pusty',
            }]
          : []),
        {
          label: 'Zdjęcia',
          ok: (inspection.photos?.length ?? 0) > 0,
          warning: 'Brak zdjęć — sekcja dokumentacji fotograficznej będzie pusta',
        },
        ...(FLOORPLAN_INSPECTION_TYPES.includes(inspection.type as typeof FLOORPLAN_INSPECTION_TYPES[number])
          ? [{
              label: 'Plany budynku',
              ok: (inspection.floor_plans?.length ?? 0) > 0,
              warning: 'Brak planów — sekcja planów zostanie pominięta',
            }]
          : []),
        ...(selectedType === 'protokol' &&
        CHECKLIST_INSPECTION_TYPES.includes(inspection.type as typeof CHECKLIST_INSPECTION_TYPES[number])
          ? [
              {
                label: 'Checklist',
                ok: (inspection.checklist_items?.length ?? 0) > 0,
                warning: 'Brak wypełnionego checklistu — wymagany dla protokołu',
              },
            ]
          : []),
      ]
    : []

  const criticalFails = preflightChecks.filter((c) => !c.ok && !c.warning?.includes('będzie'))
  const warnings = preflightChecks.filter((c) => !c.ok && c.warning?.includes('będzie'))

  const handleProgress = useCallback((step: string, current: number, total: number) => {
    setProgress({ step, current, total })
  }, [])

  const handleGenerate = async () => {
    if (!id || !user) return

    setGenerating(true)
    setError(null)
    setGeneratedBlob(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    try {
      // 1. Collect data
      const data: ReportData = await collectReportData(id, user.id, selectedType, handleProgress)

      setProgress({ step: 'Generowanie PDF...', current: 0, total: 1 })

      // 2. Render PDF to blob
      const ReportComponent = getReportComponent(selectedType)
      const blob = await pdf(<ReportComponent data={data} />).toBlob()

      setGeneratedBlob(blob)

      // 3. Create preview URL
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      // 4. Save report record to DB
      await saveReport.mutateAsync({
        inspectionId: id,
        reportType: selectedType,
        reportNumber: data.reportNumber,
        blob,
      })

      setProgress(null)
    } catch (err) {
      console.error('Report generation failed:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas generowania raportu')
      setProgress(null)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedBlob || !inspection) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(generatedBlob)
    link.download = `${REPORT_TYPES[selectedType]}_${inspection.title || 'raport'}.pdf`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handlePreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  const inspectionType = inspection?.type as string
  const inspectionLabel = INSPECTION_TYPES[inspectionType as keyof typeof INSPECTION_TYPES] || inspectionType

  // Determine which report types are available for this inspection type
  const isProtocolOnly = CHECKLIST_INSPECTION_TYPES.includes(inspectionType as typeof CHECKLIST_INSPECTION_TYPES[number])

  const availableTypes: { key: ReportType; label: string; description: string }[] = isProtocolOnly
    ? [
        {
          key: 'protokol',
          label: 'Protokół Przeglądu',
          description: 'Protokół zgodny z Art. 62 Prawa Budowlanego',
        },
      ]
    : [
        {
          key: 'techniczny',
          label: 'Raport Techniczny',
          description: 'Usterki pogrupowane wg kategorii ze zdjęciami i planami',
        },
        {
          key: 'zadania',
          label: 'Raport Zadań',
          description: 'Rozszerzony raport z wykonawcami, statusami i terminami',
        },
      ]

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: id! }))}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Powrót do inspekcji
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generowanie raportu</h1>
        <p className="text-gray-500 mt-1">
          {inspection?.title} — {inspectionLabel}
        </p>
      </div>

      {/* Report type selection */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Typ raportu</h2>
        <div className="space-y-2">
          {availableTypes.map((rt) => (
            <label
              key={rt.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === rt.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="reportType"
                value={rt.key}
                checked={selectedType === rt.key}
                onChange={() => {
                  setSelectedType(rt.key)
                  setGeneratedBlob(null)
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                  }
                }}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">{rt.label}</p>
                <p className="text-sm text-gray-500">{rt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Preflight checks */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Sprawdzenie danych</h2>
        <div className="space-y-2">
          {preflightChecks.map((check, i) => (
            <div key={i} className="flex items-start gap-2">
              {check.ok ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm ${check.ok ? 'text-gray-700' : 'text-amber-700'}`}>
                  {check.label}
                </p>
                {!check.ok && check.warning && (
                  <p className="text-xs text-amber-600">{check.warning}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate button */}
      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {progress && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress.step}</span>
              {progress.total > 1 && (
                <span className="text-blue-500">
                  ({progress.current}/{progress.total})
                </span>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || criticalFails.length > 0}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generowanie...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generuj {REPORT_TYPES[selectedType]}
            </>
          )}
        </Button>

        {warnings.length > 0 && !generating && (
          <p className="text-xs text-amber-600 text-center">
            Niektóre sekcje raportu mogą być puste — uzupełnij dane, aby uzyskać pełny raport.
          </p>
        )}
      </div>

      {/* Preview / Download */}
      {generatedBlob && !generating && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-semibold text-gray-700">Raport gotowy!</h2>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePreview} className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Podgląd
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Pobierz PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function getReportComponent(type: ReportType) {
  switch (type) {
    case 'techniczny':
      return TechnicalReport
    case 'zadania':
      return TaskReport
    case 'protokol':
      return ProtocolReport
  }
}

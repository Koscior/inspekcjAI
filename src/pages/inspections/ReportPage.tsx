import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import {
  FileText, Download, Eye, AlertTriangle, CheckCircle, Loader2,
  User, Users, Check, PenTool, Send, Mail,
} from 'lucide-react'
import { Button, Card, Spinner, Modal } from '@/components/ui'
import { REPORT_TYPES, INSPECTION_TYPES, CHECKLIST_INSPECTION_TYPES, FLOORPLAN_INSPECTION_TYPES, STORAGE_BUCKETS } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { collectReportData, type ReportData } from '@/services/reportDataService'
import { TechnicalReport } from '@/components/reports/TechnicalReport'
import { TaskReport } from '@/components/reports/TaskReport'
import { ProtocolReport } from '@/components/reports/ProtocolReport'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { ROUTES } from '@/router/routePaths'
import { useSaveReport, useSendReport, useInspectionReports } from '@/hooks/useReports'
import { useProfile, useUploadSignature } from '@/hooks/useProfile'
import { useUiStore } from '@/store/uiStore'
import { SignaturePad } from '@/components/signature/SignaturePad'
import { InspectionNav } from '@/components/layout/InspectionNav'

type ReportType = 'techniczny' | 'zadania' | 'protokol'

interface PreflightCheck {
  label: string
  ok: boolean
  warning?: string
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const addToast = useUiStore((s) => s.addToast)
  const { data: profile } = useProfile()
  const uploadSignature = useUploadSignature()

  const [selectedType, setSelectedType] = useState<ReportType>('techniczny')
  const [progress, setProgress] = useState<{ step: string; current: number; total: number } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedReportId, setSavedReportId] = useState<string | null>(null)

  // Send email modal state
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Signature state
  const [clientSignatureUrl, setClientSignatureUrl] = useState<string | null>(null)
  const [savingClient, setSavingClient] = useState(false)

  const saveReport = useSaveReport()
  const sendReport = useSendReport()
  const { data: inspectionReports } = useInspectionReports(id)

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

  // Pre-fill recipient email from client
  useEffect(() => {
    if (inspection?.clients && 'email' in inspection.clients) {
      const email = (inspection.clients as { email?: string | null }).email
      if (email) setRecipientEmail(email)
    }
  }, [inspection?.clients])

  // ─── Signature handlers ─────────────────────────────────────────────────

  const handleInspectorSignatureSave = async (blob: Blob) => {
    try {
      await uploadSignature.mutateAsync(blob)
      addToast({ type: 'success', message: 'Podpis inspektora zapisany' })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu podpisu inspektora' })
    }
  }

  const handleClientSignatureSave = async (blob: Blob) => {
    if (!user) return
    setSavingClient(true)

    try {
      const storagePath = `${user.id}/${id}/client_signature_${Date.now()}.png`

      if (clientSignatureUrl) {
        const oldPath = extractStoragePath(clientSignatureUrl)
        if (oldPath) {
          await supabase.storage.from(STORAGE_BUCKETS.branding).remove([oldPath])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .upload(storagePath, blob, { contentType: 'image/png', upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .getPublicUrl(storagePath)

      const url = `${urlData.publicUrl}?t=${Date.now()}`
      setClientSignatureUrl(url)
      addToast({ type: 'success', message: 'Podpis klienta zapisany' })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu podpisu klienta' })
    } finally {
      setSavingClient(false)
    }
  }

  const handleClientSignatureClear = async () => {
    if (clientSignatureUrl) {
      const oldPath = extractStoragePath(clientSignatureUrl)
      if (oldPath) {
        await supabase.storage.from(STORAGE_BUCKETS.branding).remove([oldPath])
      }
    }
    setClientSignatureUrl(null)
  }

  // ─── Preflight checks ──────────────────────────────────────────────────

  const preflightChecks: PreflightCheck[] = inspection
    ? [
        {
          label: 'Dane inspekcji',
          ok: !!inspection.title && !!inspection.address,
          warning: 'Brak tytułu lub adresu inspekcji',
        },
        {
          label: 'Podpis inspektora',
          ok: !!profile?.signature_url,
          warning: 'Brak podpisu inspektora — uzupełnij powyżej',
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
      const data: ReportData = await collectReportData(id, user.id, selectedType, handleProgress)

      setProgress({ step: 'Generowanie PDF...', current: 0, total: 1 })

      const ReportComponent = getReportComponent(selectedType)
      const blob = await pdf(<ReportComponent data={data} />).toBlob()

      setGeneratedBlob(blob)

      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      const savedReport = await saveReport.mutateAsync({
        inspectionId: id,
        reportType: selectedType,
        reportNumber: data.reportNumber,
        blob,
      })

      setSavedReportId(savedReport.id)
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

  const handleSendEmail = async () => {
    if (!savedReportId || !id) return
    try {
      await sendReport.mutateAsync({
        reportId: savedReportId,
        inspectionId: id,
        recipientEmail,
        message: emailMessage.trim() || undefined,
      })
      addToast({ type: 'success', message: `Raport wysłany na ${recipientEmail}` })
      setSendModalOpen(false)
      setEmailMessage('')
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Błąd wysyłki emaila',
      })
    }
  }

  // Check if latest report was already sent
  const latestReport = inspectionReports?.[0]
  const alreadySent = latestReport?.sent_at != null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  const inspectionType = inspection?.type as string
  const inspectionLabel = INSPECTION_TYPES[inspectionType as keyof typeof INSPECTION_TYPES] || inspectionType

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
    <div className="max-w-3xl mx-auto space-y-4">
      <InspectionNav />

      {/* ─── Signatures Section ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PenTool size={18} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Podpisy</h2>
        </div>

        {/* Inspector signature */}
        <Card className="mb-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-900">Podpis inspektora</h3>
              {profile?.signature_url && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  <Check size={12} className="inline mr-0.5" />
                  Zapisany
                </span>
              )}
            </div>

            {profile?.signature_url ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <img
                  src={profile.signature_url}
                  alt="Podpis inspektora"
                  className="max-h-24 object-contain mx-auto"
                />
                <p className="text-xs text-gray-400 mt-2">{profile.full_name}</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    Brak podpisu inspektora. Narysuj podpis poniżej.
                  </p>
                </div>
                <SignaturePad
                  label="Narysuj podpis inspektora"
                  onSave={handleInspectorSignatureSave}
                  height={160}
                />
                {uploadSignature.isPending && (
                  <div className="flex items-center gap-2 justify-center">
                    <Spinner size="sm" />
                    <span className="text-xs text-gray-500">Zapisywanie...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Client signature */}
        <Card className="mb-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-900">Podpis klienta / zarządcy</h3>
              {clientSignatureUrl && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  <Check size={12} className="inline mr-0.5" />
                  Zapisany
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Podpis osoby potwierdzającej przeprowadzenie inspekcji (opcjonalny)
            </p>

            <SignaturePad
              label="Podpis klienta / zarządcy"
              existingUrl={clientSignatureUrl}
              onSave={handleClientSignatureSave}
              onClear={handleClientSignatureClear}
              height={180}
            />

            {savingClient && (
              <div className="flex items-center gap-2 justify-center">
                <Spinner size="sm" />
                <span className="text-xs text-gray-500">Zapisywanie podpisu klienta...</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Report type selection ──────────────────────────────────────── */}
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

      {/* ─── Preflight checks ───────────────────────────────────────────── */}
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

      {/* ─── Generate button ────────────────────────────────────────────── */}
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

      {/* ─── Preview / Download / Send ─────────────────────────────────── */}
      {generatedBlob && !generating && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-semibold text-gray-700">Raport gotowy!</h2>
            {alreadySent && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <Send className="w-3 h-3" />
                Wysłany
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={handlePreview} className="flex-1 min-w-[100px]">
              <Eye className="w-4 h-4 mr-2" />
              Podgląd
            </Button>
            <Button variant="secondary" onClick={handleDownload} className="flex-1 min-w-[100px]">
              <Download className="w-4 h-4 mr-2" />
              Pobierz
            </Button>
            <Button
              onClick={() => setSendModalOpen(true)}
              className="flex-1 min-w-[100px]"
            >
              <Mail className="w-4 h-4 mr-2" />
              Wyślij do klienta
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Send email modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title="Wyślij raport emailem"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres e-mail odbiorcy <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="klient@przykład.pl"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wiadomość <span className="text-gray-400 font-normal">(opcjonalna)</span>
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Przesyłam raport z przeprowadzonej inspekcji..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <p className="text-xs text-gray-500">
            Odbiorca otrzyma link do pobrania PDF ważny przez 7 dni.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setSendModalOpen(false)}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!recipientEmail || sendReport.isPending}
              loading={sendReport.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Wyślij
            </Button>
          </div>
        </div>
      </Modal>
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

function extractStoragePath(publicUrl: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.branding}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    let path = publicUrl.slice(idx + marker.length)
    const qIdx = path.indexOf('?')
    if (qIdx > -1) path = path.slice(0, qIdx)
    return path
  } catch {
    return null
  }
}

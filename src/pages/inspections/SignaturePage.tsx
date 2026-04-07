import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, User, Users } from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { SignaturePad } from '@/components/signature/SignaturePad'
import { useInspection } from '@/hooks/useInspections'
import { useProfile, useUploadSignature } from '@/hooks/useProfile'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import { ROUTES, buildPath } from '@/router/routePaths'

export default function SignaturePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const { data: inspection, isLoading: inspLoading } = useInspection(id!)
  const { data: profile, isLoading: profileLoading } = useProfile()
  const uploadSignature = useUploadSignature()

  const [clientSignatureUrl, setClientSignatureUrl] = useState<string | null>(null)
  const [savingClient, setSavingClient] = useState(false)

  if (inspLoading || profileLoading) {
    return <Spinner size="lg" label="Ładowanie..." className="py-16 flex justify-center" />
  }

  if (!inspection || !profile) {
    return <div className="p-6 text-center text-gray-500">Nie znaleziono inspekcji</div>
  }

  // ─── Inspector signature save ──────────────────────────────────────────────

  const handleInspectorSignatureSave = async (blob: Blob) => {
    try {
      await uploadSignature.mutateAsync(blob)
      addToast({ type: 'success', message: 'Podpis inspektora zapisany' })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu podpisu inspektora' })
    }
  }

  // ─── Client signature save ─────────────────────────────────────────────────

  const handleClientSignatureSave = async (blob: Blob) => {
    if (!user) return
    setSavingClient(true)

    try {
      const storagePath = `${user.id}/${id}/client_signature_${Date.now()}.png`

      // Remove old if exists
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

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const handleContinueToReport = () => {
    navigate(buildPath(ROUTES.INSPECTION_REPORT, { id: id! }))
  }

  const bothSigned = !!profile.signature_url && !!clientSignatureUrl

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <InspectionNav inspectionId={id!} />

      {/* Header */}
      <div>
        <button
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: id! }))}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
        >
          <ArrowLeft size={16} />
          {inspection.title}
        </button>
        <h1 className="text-xl font-bold text-gray-900">Podpisy</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Podpisy wymagane do wygenerowania raportu
        </p>
      </div>

      {/* Inspector signature */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Podpis inspektora</h2>
            {profile.signature_url && (
              <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <Check size={12} className="inline mr-0.5" />
                Zapisany
              </span>
            )}
          </div>

          {profile.signature_url ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <img
                src={profile.signature_url}
                alt="Podpis inspektora"
                className="max-h-24 object-contain mx-auto"
              />
              <p className="text-xs text-gray-400 mt-2">
                {profile.full_name}
              </p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.SETTINGS)}
                className="text-xs text-primary-600 hover:text-primary-700 mt-1"
              >
                Zmień w ustawieniach
              </button>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  Brak podpisu inspektora. Narysuj podpis poniżej lub ustaw go w{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.SETTINGS)}
                    className="underline font-medium"
                  >
                    Ustawieniach
                  </button>.
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
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Podpis klienta / zarządcy</h2>
            {clientSignatureUrl && (
              <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <Check size={12} className="inline mr-0.5" />
                Zapisany
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Podpis osoby potwierdzającej przeprowadzenie inspekcji
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

      {/* Status summary */}
      <Card>
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Status podpisów
          </h3>
          <div className="space-y-1.5">
            <StatusRow
              ok={!!profile.signature_url}
              label="Podpis inspektora"
            />
            <StatusRow
              ok={!!clientSignatureUrl}
              label="Podpis klienta / zarządcy"
              optional
            />
          </div>
        </div>
      </Card>

      {/* Continue button */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {bothSigned ? (
              <span className="text-green-600 font-medium">Oba podpisy zebrane</span>
            ) : clientSignatureUrl ? (
              <span className="text-amber-600">Brak podpisu inspektora</span>
            ) : profile.signature_url ? (
              <span className="text-gray-500">Podpis klienta opcjonalny</span>
            ) : (
              <span className="text-amber-600">Brak podpisów</span>
            )}
          </div>
          <Button onClick={handleContinueToReport} size="sm">
            Przejdź do raportu
            <ArrowLeft size={14} className="rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusRow({ ok, label, optional }: { ok: boolean; label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={ok ? 'text-green-500' : optional ? 'text-gray-300' : 'text-amber-500'}>
        {ok ? '✓' : optional ? '○' : '⚠'}
      </span>
      <span className={ok ? 'text-gray-600' : optional ? 'text-gray-400' : 'text-amber-600'}>
        {label}
        {!ok && optional && ' — opcjonalny'}
      </span>
    </div>
  )
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

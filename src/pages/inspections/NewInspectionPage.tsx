import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCreateInspection, useUpdateInspection } from '@/hooks/useInspections'
import { useCreateClient } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import { compressImage } from '@/lib/imageUtils'
import { Step1Type } from './wizard/Step1Type'
import { Step2Building } from './wizard/Step2Building'
import { Step3Client } from './wizard/Step3Client'
import { Step4Extra } from './wizard/Step4Extra'
import { Step5Summary } from './wizard/Step5Summary'
import type { Inspection } from '@/types/database.types'

// ─── Schema ───────────────────────────────────────────────────────────────────

export const wizardSchema = z.object({
  // Step 1
  type: z.enum(['roczny', 'piecioletni', 'polroczny', 'plac_zabaw', 'odbior_mieszkania', 'ogolna']),

  // Step 2
  title: z.string().min(2, 'Wymagane minimum 2 znaki'),
  address: z.string().min(3, 'Podaj adres'),
  city: z.string().optional(),
  building_type: z.string().optional(),
  construction_type: z.string().optional(),
  year_built: z.string().optional(),
  floor_or_unit: z.string().optional(),

  // Step 2 — technical data (conditional per type)
  powierzchnia_zabudowy: z.string().optional(),
  powierzchnia_uzytkowa: z.string().optional(),
  kubatura: z.string().optional(),
  kondygnacje_nadziemne: z.string().optional(),
  kondygnacje_podziemne: z.string().optional(),

  // Step 2 — playground-specific fields
  pg_nazwa: z.string().optional(),
  pg_liczba_urzadzen: z.string().optional(),
  pg_rodzaje_urzadzen: z.string().optional(),
  pg_material_urzadzen: z.string().optional(),
  pg_nawierzchnia: z.string().optional(),
  pg_nawierzchnia_pod_urzadzeniami: z.string().optional(),
  pg_mocowanie_urzadzen: z.string().optional(),
  pg_ogrodzenie: z.string().optional(),
  pg_naslonecznienie: z.string().optional(),

  // Step 3
  client_mode: z.enum(['existing', 'new', 'none']),
  client_id: z.string().optional(),
  new_client_name: z.string().optional(),
  new_client_email: z.string().optional(),
  new_client_phone: z.string().optional(),

  // Step 4 (conditional)
  owner_name: z.string().optional(),
  owner_address: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().optional(),
  manager_name: z.string().optional(),
  investor_name: z.string().optional(),
  contractor_name: z.string().optional(),
  inspection_date: z.string().optional(),
  next_inspection_date: z.string().optional(),
  notes: z.string().optional(),
})

export type WizardData = z.infer<typeof wizardSchema>

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Typ' },
  { label: 'Obiekt' },
  { label: 'Klient' },
  { label: 'Szczegóły' },
  { label: 'Podsumowanie' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInspectionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const createInspection = useCreateInspection()
  const updateInspection = useUpdateInspection()
  const createClient = useCreateClient()

  const methods = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      type: undefined,
      client_mode: 'none',
    },
    mode: 'onChange',
  })

  const { handleSubmit, trigger, getValues } = methods

  // ── Step validation fields ──────────────────────────────────────────────────
  const STEP_FIELDS: Array<Array<keyof WizardData>> = [
    ['type'],
    ['title', 'address'],
    [],   // client — optional
    [],   // extra — optional
    [],   // summary — no new fields
  ]

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as (keyof WizardData)[])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(
    async (data) => {
      try {
        let clientId: string | undefined = undefined

        // Create new client if needed
        if (data.client_mode === 'new' && data.new_client_name?.trim()) {
          const client = await createClient.mutateAsync({
            full_name: data.new_client_name.trim(),
            email: data.new_client_email || null,
            phone: data.new_client_phone || null,
          })
          clientId = client.id
        } else if (data.client_mode === 'existing' && data.client_id) {
          clientId = data.client_id
        }

        // Build full address
        const fullAddress = [data.address, data.city].filter(Boolean).join(', ')

        const inspection = await createInspection.mutateAsync({
          type: data.type as Inspection['type'],
          title: data.title,
          address: fullAddress,
          building_type: data.building_type || null,
          construction_type: data.construction_type || null,
          client_id: clientId || null,
          owner_name: data.owner_name || null,
          owner_address: data.owner_address || null,
          owner_phone: data.owner_phone || null,
          owner_email: data.owner_email || null,
          manager_name: data.manager_name || null,
          investor_name: data.investor_name || null,
          contractor_name: data.contractor_name || null,
          inspection_date: data.inspection_date || null,
          next_inspection_date: data.next_inspection_date || null,
          powierzchnia_zabudowy: data.powierzchnia_zabudowy ? Number(data.powierzchnia_zabudowy) : null,
          powierzchnia_uzytkowa: data.powierzchnia_uzytkowa ? Number(data.powierzchnia_uzytkowa) : null,
          kubatura: data.kubatura ? Number(data.kubatura) : null,
          kondygnacje_nadziemne: data.kondygnacje_nadziemne ? Number(data.kondygnacje_nadziemne) : null,
          kondygnacje_podziemne: data.kondygnacje_podziemne ? Number(data.kondygnacje_podziemne) : null,
          notes: data.notes || null,
          pg_nazwa: data.pg_nazwa || null,
          pg_liczba_urzadzen: data.pg_liczba_urzadzen || null,
          pg_rodzaje_urzadzen: data.pg_rodzaje_urzadzen || null,
          pg_material_urzadzen: data.pg_material_urzadzen || null,
          pg_nawierzchnia: data.pg_nawierzchnia || null,
          pg_nawierzchnia_pod_urzadzeniami: data.pg_nawierzchnia_pod_urzadzeniami || null,
          pg_mocowanie_urzadzen: data.pg_mocowanie_urzadzen || null,
          pg_ogrodzenie: data.pg_ogrodzenie || null,
          pg_naslonecznienie: data.pg_naslonecznienie || null,
          status: 'draft',
        })

        // Upload cover photo if selected
        if (coverPhotoFile && user) {
          try {
            const compressed = await compressImage(coverPhotoFile, 2048)
            const coverPath = `${user.id}/${inspection.id}/cover.webp`
            const { error: uploadErr } = await supabase.storage
              .from(STORAGE_BUCKETS.photos)
              .upload(coverPath, compressed, { contentType: 'image/webp' })
            if (!uploadErr) {
              await updateInspection.mutateAsync({
                id: inspection.id,
                updates: { cover_photo_path: coverPath },
              })
            }
          } catch {
            // Cover photo upload failed — non-blocking
          }
        }

        addToast({ type: 'success', message: 'Inspekcja została utworzona' })
        navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: inspection.id }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Błąd podczas tworzenia inspekcji'
        addToast({ type: 'error', message, duration: 8000 })
      }
    },
    () => {
      addToast({ type: 'error', message: 'Formularz zawiera błędy — sprawdź wszystkie kroki', duration: 6000 })
    },
  )

  const isLastStep = step === STEPS.length - 1
  const isPending = createInspection.isPending || createClient.isPending

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.INSPECTIONS)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronLeft size={16} />
          Inspekcje
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nowa inspekcja</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step
                    ? 'bg-primary-600 text-white'
                    : i === step
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium hidden sm:block ${
                i <= step ? 'text-primary-700' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                i < step ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {step === 0 && <Step1Type />}
            {step === 1 && (
              <Step2Building
                inspectionType={getValues('type')}
                coverPhotoFile={coverPhotoFile}
                coverPhotoPreview={null}
                onCoverPhotoChange={setCoverPhotoFile}
              />
            )}
            {step === 2 && <Step3Client />}
            {step === 3 && <Step4Extra inspectionType={getValues('type')} />}
            {step === 4 && <Step5Summary data={getValues()} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={step === 0 ? () => navigate(ROUTES.INSPECTIONS) : goBack}
            >
              <ChevronLeft size={16} />
              {step === 0 ? 'Anuluj' : 'Wstecz'}
            </Button>

            {isLastStep ? (
              <Button type="button" onClick={onSubmit} loading={isPending}>
                <Check size={16} />
                Utwórz inspekcję
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Dalej
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

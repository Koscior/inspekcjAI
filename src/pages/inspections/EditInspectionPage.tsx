import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { useInspection, useUpdateInspection } from '@/hooks/useInspections'
import { useCreateClient } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import { compressImage } from '@/lib/imageUtils'
import { getPhotoUrl } from '@/hooks/usePhotos'
import { wizardSchema, type WizardData } from './NewInspectionPage'
import { Step1Type } from './wizard/Step1Type'
import { Step2Building } from './wizard/Step2Building'
import { Step3Client } from './wizard/Step3Client'
import { Step4Extra } from './wizard/Step4Extra'
import { Step5Summary } from './wizard/Step5Summary'
import type { Inspection } from '@/types/database.types'

const STEPS = [
  { label: 'Typ' },
  { label: 'Obiekt' },
  { label: 'Klient' },
  { label: 'Szczegóły' },
  { label: 'Podsumowanie' },
]

export default function EditInspectionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null)
  const [coverPhotoRemoved, setCoverPhotoRemoved] = useState(false)
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const updateInspection = useUpdateInspection()
  const createClient = useCreateClient()

  const { data: inspection, isLoading } = useInspection(id)

  const methods = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
  })

  const { handleSubmit, trigger, getValues, reset } = methods

  // Initialize cover photo preview from existing data
  useEffect(() => {
    if (inspection?.cover_photo_path) {
      setCoverPhotoPreview(getPhotoUrl(inspection.cover_photo_path))
    }
  }, [inspection])

  useEffect(() => {
    if (inspection) {
      reset({
        type: inspection.type as WizardData['type'],
        title: inspection.title,
        address: inspection.address ?? '',
        city: '',
        building_type: inspection.building_type ?? '',
        construction_type: inspection.construction_type ?? '',
        client_mode: inspection.client_id ? 'existing' : 'none',
        client_id: inspection.client_id ?? '',
        owner_name: inspection.owner_name ?? '',
        owner_address: inspection.owner_address ?? '',
        owner_phone: inspection.owner_phone ?? '',
        owner_email: inspection.owner_email ?? '',
        manager_name: inspection.manager_name ?? '',
        investor_name: inspection.investor_name ?? '',
        contractor_name: inspection.contractor_name ?? '',
        inspection_date: inspection.inspection_date ?? '',
        next_inspection_date: inspection.next_inspection_date ?? '',
        notes: inspection.notes ?? '',
        powierzchnia_zabudowy: inspection.powierzchnia_zabudowy?.toString() ?? '',
        powierzchnia_uzytkowa: inspection.powierzchnia_uzytkowa?.toString() ?? '',
        kubatura: inspection.kubatura?.toString() ?? '',
        kondygnacje_nadziemne: inspection.kondygnacje_nadziemne?.toString() ?? '',
        kondygnacje_podziemne: inspection.kondygnacje_podziemne?.toString() ?? '',
        pg_liczba_urzadzen: inspection.pg_liczba_urzadzen ?? '',
        pg_rodzaje_urzadzen: inspection.pg_rodzaje_urzadzen ?? '',
        pg_material_urzadzen: inspection.pg_material_urzadzen ?? '',
        pg_nawierzchnia: inspection.pg_nawierzchnia ?? '',
        pg_nawierzchnia_pod_urzadzeniami: inspection.pg_nawierzchnia_pod_urzadzeniami ?? '',
        pg_mocowanie_urzadzen: inspection.pg_mocowanie_urzadzen ?? '',
        pg_ogrodzenie: inspection.pg_ogrodzenie ?? '',
        pg_naslonecznienie: inspection.pg_naslonecznienie ?? '',
      })
    }
  }, [inspection, reset])

  const STEP_FIELDS: Array<Array<keyof WizardData>> = [
    ['type'],
    ['title', 'address'],
    [],
    [],
    [],
  ]

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as (keyof WizardData)[])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const onSubmit = handleSubmit(
    async (data) => {
      if (!id) return
      try {
        let clientId: string | null = inspection?.client_id ?? null

        if (data.client_mode === 'new' && data.new_client_name?.trim()) {
          const client = await createClient.mutateAsync({
            full_name: data.new_client_name.trim(),
            email: data.new_client_email || null,
            phone: data.new_client_phone || null,
          })
          clientId = client.id
        } else if (data.client_mode === 'existing' && data.client_id) {
          clientId = data.client_id
        } else if (data.client_mode === 'none') {
          clientId = null
        }

        const fullAddress = [data.address, data.city].filter(Boolean).join(', ')

        // Handle cover photo upload
        let coverPhotoPath: string | null | undefined = undefined
        if (coverPhotoFile && user) {
          try {
            const compressed = await compressImage(coverPhotoFile, 2048)
            const path = `${user.id}/${id}/cover.webp`
            const { error: uploadErr } = await supabase.storage
              .from(STORAGE_BUCKETS.photos)
              .upload(path, compressed, { contentType: 'image/webp', upsert: true })
            if (!uploadErr) coverPhotoPath = path
          } catch {
            // Cover photo upload failed — non-blocking
          }
        } else if (coverPhotoRemoved) {
          coverPhotoPath = null
        }

        await updateInspection.mutateAsync({
          id,
          updates: {
            type: data.type as Inspection['type'],
            title: data.title,
            address: fullAddress,
            building_type: data.building_type || null,
            construction_type: data.construction_type || null,
            client_id: clientId,
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
            pg_liczba_urzadzen: data.pg_liczba_urzadzen || null,
            pg_rodzaje_urzadzen: data.pg_rodzaje_urzadzen || null,
            pg_material_urzadzen: data.pg_material_urzadzen || null,
            pg_nawierzchnia: data.pg_nawierzchnia || null,
            pg_nawierzchnia_pod_urzadzeniami: data.pg_nawierzchnia_pod_urzadzeniami || null,
            pg_mocowanie_urzadzen: data.pg_mocowanie_urzadzen || null,
            pg_ogrodzenie: data.pg_ogrodzenie || null,
            pg_naslonecznienie: data.pg_naslonecznienie || null,
            ...(coverPhotoPath !== undefined && { cover_photo_path: coverPhotoPath }),
          },
        })

        addToast({ type: 'success', message: 'Inspekcja została zaktualizowana' })
        navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Błąd podczas aktualizacji inspekcji'
        addToast({ type: 'error', message, duration: 8000 })
      }
    },
    () => {
      addToast({ type: 'error', message: 'Formularz zawiera błędy — sprawdź wszystkie kroki', duration: 6000 })
    },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie inspekcji..." />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono inspekcji</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(ROUTES.INSPECTIONS)}>
          Wróć do listy
        </Button>
      </div>
    )
  }

  const isLastStep = step === STEPS.length - 1
  const isPending = updateInspection.isPending || createClient.isPending

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: id! }))}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronLeft size={16} />
          Inspekcja
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edytuj inspekcję</h1>
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
                coverPhotoPreview={coverPhotoRemoved ? null : coverPhotoPreview}
                onCoverPhotoChange={(file) => {
                  setCoverPhotoFile(file)
                  if (file) {
                    setCoverPhotoRemoved(false)
                  } else {
                    setCoverPhotoPreview(null)
                    setCoverPhotoRemoved(true)
                  }
                }}
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
              onClick={step === 0 ? () => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: id! })) : goBack}
            >
              <ChevronLeft size={16} />
              {step === 0 ? 'Anuluj' : 'Wstecz'}
            </Button>

            {isLastStep ? (
              <Button type="button" onClick={onSubmit} loading={isPending}>
                <Check size={16} />
                Zapisz zmiany
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

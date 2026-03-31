import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, FileText } from 'lucide-react'
import { useInspection, useUpdateInspection } from '@/hooks/useInspections'
import { Spinner, Card, Button } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'

// ─── Zod schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  // Dokumentacja budynku
  building_docs_status: z.enum(['complete', 'incomplete', 'missing']).nullable().optional(),
  usage_docs_status: z.enum(['complete', 'incomplete', 'missing']).nullable().optional(),
  building_log_status: z.enum(['maintained', 'incomplete', 'missing']).nullable().optional(),

  // Poprzednia kontrola
  previous_protocol_notes: z.string().optional(),
  completed_works: z.string().optional(),
  tenant_complaints: z.string().optional(),
  incomplete_works: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DOC_STATUS_OPTIONS = [
  { value: 'complete',   label: 'Kompletna' },
  { value: 'incomplete', label: 'Niekompletna' },
  { value: 'missing',    label: 'Brak' },
] as const

const LOG_STATUS_OPTIONS = [
  { value: 'maintained', label: 'Prowadzona' },
  { value: 'incomplete', label: 'Niekompletna' },
  { value: 'missing',    label: 'Brak' },
] as const

// ─── Radio group ─────────────────────────────────────────────────────────────

interface RadioGroupProps {
  label: string
  hint?: string
  options: readonly { value: string; label: string }[]
  value: string | null | undefined
  onChange: (v: string) => void
}

function RadioGroup({ label, hint, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="flex gap-2 mt-1 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
              value === opt.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuildingDocsPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const addToast = useUiStore((s) => s.addToast)
  const updateInspection = useUpdateInspection()

  const { data: inspection, isLoading } = useInspection(inspectionId)

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Load current values
  useEffect(() => {
    if (!inspection) return
    reset({
      building_docs_status: inspection.building_docs_status ?? null,
      usage_docs_status: inspection.usage_docs_status ?? null,
      building_log_status: inspection.building_log_status ?? null,
      previous_protocol_notes: inspection.previous_protocol_notes ?? '',
      completed_works: inspection.completed_works ?? '',
      tenant_complaints: inspection.tenant_complaints ?? '',
      incomplete_works: inspection.incomplete_works ?? '',
    })
  }, [inspection, reset])

  const onSubmit = handleSubmit(async (data) => {
    if (!inspectionId) return
    try {
      await updateInspection.mutateAsync({
        id: inspectionId,
        updates: {
          building_docs_status: data.building_docs_status ?? null,
          usage_docs_status: data.usage_docs_status ?? null,
          building_log_status: data.building_log_status ?? null,
          previous_protocol_notes: data.previous_protocol_notes || null,
          completed_works: data.completed_works || null,
          tenant_complaints: data.tenant_complaints || null,
          incomplete_works: data.incomplete_works || null,
        },
      })
      addToast({ type: 'success', message: 'Dokumentacja zapisana' })
      reset(data) // clear dirty state
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu' })
    }
  })

  if (isLoading) return <Spinner size="lg" label="Ładowanie..." className="py-16" />

  return (
    <div className="max-w-2xl mx-auto">
      <InspectionNav />

      <h1 className="text-lg font-bold text-gray-900 mb-4">Dokumentacja budynku</h1>

      <form onSubmit={onSubmit} className="space-y-4">

        {/* ── Dokumentacja ───────────────────────────────────────────────── */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText size={15} className="text-gray-400" />
            Stan dokumentacji
          </h2>

          <RadioGroup
            label="Dokumentacja budowy"
            hint="Projekty, pozwolenia, protokoły odbioru"
            options={DOC_STATUS_OPTIONS}
            value={watch('building_docs_status')}
            onChange={(v) => setValue('building_docs_status', v as FormData['building_docs_status'], { shouldDirty: true })}
          />

          <RadioGroup
            label="Dokumentacja użytkowania"
            hint="Instrukcje, DTR, gwarancje"
            options={DOC_STATUS_OPTIONS}
            value={watch('usage_docs_status')}
            onChange={(v) => setValue('usage_docs_status', v as FormData['usage_docs_status'], { shouldDirty: true })}
          />

          <RadioGroup
            label="Książka obiektu budowlanego"
            options={LOG_STATUS_OPTIONS}
            value={watch('building_log_status')}
            onChange={(v) => setValue('building_log_status', v as FormData['building_log_status'], { shouldDirty: true })}
          />
        </Card>

        {/* ── Poprzednia kontrola ────────────────────────────────────────── */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Poprzednia kontrola</h2>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Zalecenia z poprzedniej kontroli</label>
              <VoiceRecorder onTranscription={(text) => setValue('previous_protocol_notes', text, { shouldDirty: true })} />
            </div>
            <textarea
              {...register('previous_protocol_notes')}
              placeholder="Wpisz zalecenia z poprzedniego protokołu (każde w nowej linii)..."
              rows={4}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Zakres wykonanych robót remontowych</label>
              <VoiceRecorder onTranscription={(text) => setValue('completed_works', text, { shouldDirty: true })} />
            </div>
            <textarea
              {...register('completed_works')}
              placeholder="Jakie roboty zostały wykonane od poprzedniej kontroli..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Zgłoszenia użytkowników lokali</label>
              <VoiceRecorder onTranscription={(text) => setValue('tenant_complaints', text, { shouldDirty: true })} />
            </div>
            <textarea
              {...register('tenant_complaints')}
              placeholder="Zgłoszenia od lokatorów, najemców, zarządcy..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Zakres NIE wykonanych robót</label>
              <VoiceRecorder onTranscription={(text) => setValue('incomplete_works', text, { shouldDirty: true })} />
            </div>
            <textarea
              {...register('incomplete_works')}
              placeholder="Roboty nakazane, a niewykonane od ostatniej kontroli..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end pb-6">
          <Button type="submit" loading={updateInspection.isPending} disabled={!isDirty}>
            <Save size={16} />
            Zapisz dokumentację
          </Button>
        </div>
      </form>
    </div>
  )
}

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, FileText, AlertTriangle } from 'lucide-react'
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

  // Wnioski pokontrolne
  wnioski_uwagi_zalecenia: z.string().optional(),
  pilnosc_1: z.string().optional(),
  pilnosc_2: z.string().optional(),
  pilnosc_3: z.string().optional(),
  ocena_stanu_tekst: z.string().optional(),
  ocena_nadaje_sie: z.boolean().nullable().optional(),
  ocena_stwierdzono_uszkodzenia: z.boolean().nullable().optional(),
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

// ─── Toggle pair ─────────────────────────────────────────────────────────────

interface TogglePairProps {
  value: boolean | null | undefined
  labelTrue: string
  labelFalse: string
  onChange: (v: boolean) => void
}

function TogglePair({ value, labelTrue, labelFalse, onChange }: TogglePairProps) {
  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-2 py-0.5 text-xs rounded border-2 font-medium transition-colors bg-white ${
          value === true
            ? 'border-gray-800 text-gray-900'
            : 'border-gray-200 text-gray-500 hover:border-gray-400'
        }`}
      >
        {labelTrue}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-2 py-0.5 text-xs rounded border-2 font-medium transition-colors bg-white ${
          value === false
            ? 'border-gray-800 text-gray-900'
            : 'border-gray-200 text-gray-500 hover:border-gray-400'
        }`}
      >
        {labelFalse}
      </button>
    </span>
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
      wnioski_uwagi_zalecenia: inspection.wnioski_uwagi_zalecenia ?? '',
      pilnosc_1: inspection.pilnosc_1 ?? '',
      pilnosc_2: inspection.pilnosc_2 ?? '',
      pilnosc_3: inspection.pilnosc_3 ?? '',
      ocena_stanu_tekst: inspection.ocena_stanu_tekst ?? '',
      ocena_nadaje_sie: inspection.ocena_nadaje_sie ?? null,
      ocena_stwierdzono_uszkodzenia: inspection.ocena_stwierdzono_uszkodzenia ?? null,
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
          wnioski_uwagi_zalecenia: data.wnioski_uwagi_zalecenia || null,
          pilnosc_1: data.pilnosc_1 || null,
          pilnosc_2: data.pilnosc_2 || null,
          pilnosc_3: data.pilnosc_3 || null,
          ocena_stanu_tekst: data.ocena_stanu_tekst || null,
          ocena_nadaje_sie: data.ocena_nadaje_sie ?? null,
          ocena_stwierdzono_uszkodzenia: data.ocena_stwierdzono_uszkodzenia ?? null,
        },
      })
      addToast({ type: 'success', message: 'Dokumentacja zapisana' })
      reset(data)
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
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('previous_protocol_notes', text, { shouldDirty: true })} context="zalecenia z poprzedniej kontroli budynku" />
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
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('completed_works', text, { shouldDirty: true })} context="zakres wykonanych robót remontowych budynku" />
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
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('tenant_complaints', text, { shouldDirty: true })} context="zgłoszenia użytkowników lokali budynku" />
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
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('incomplete_works', text, { shouldDirty: true })} context="zakres niewykonanych robót z poprzedniego protokołu" />
            </div>
            <textarea
              {...register('incomplete_works')}
              placeholder="Roboty nakazane, a niewykonane od ostatniej kontroli..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </Card>

        {/* ── Wnioski pokontrolne ────────────────────────────────────────── */}
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            Wnioski pokontrolne
          </h2>

          {/* Wnioski, opinie, uwagi, zalecenia */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Wnioski, opinie, uwagi, zalecenia</label>
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('wnioski_uwagi_zalecenia', text, { shouldDirty: true })} context="wnioski i zalecenia pokontrolne z inspekcji budowlanej" />
            </div>
            <textarea
              {...register('wnioski_uwagi_zalecenia')}
              placeholder="Wnioski z kontroli, zalecenia dla właściciela/zarządcy..."
              rows={4}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <p className="text-[11px] text-gray-400 italic mt-1">
              Wszystkie zalecenia do wykonania są zaleceniami sugerowanymi. Ich zakres i termin realizacji powinien być uzgodniony z właścicielem/zarządcą obiektu.
            </p>
          </div>

          {/* Pilność 1 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Pierwszy stopień pilności</label>
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('pilnosc_1', text, { shouldDirty: true })} context="pierwszy stopień pilności zaleceń pokontrolnych" />
            </div>
            <p className="text-[11px] text-gray-400 mb-1">Roboty do natychmiastowego wykonania (zagrożenie zdrowia/życia)</p>
            <textarea
              {...register('pilnosc_1')}
              placeholder="Roboty wymagające natychmiastowego wykonania..."
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Pilność 2 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Drugi stopień pilności</label>
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('pilnosc_2', text, { shouldDirty: true })} context="drugi stopień pilności zaleceń pokontrolnych" />
            </div>
            <p className="text-[11px] text-gray-400 mb-1">Roboty do wykonania w terminie do 6 miesięcy</p>
            <textarea
              {...register('pilnosc_2')}
              placeholder="Roboty wymagające wykonania w terminie do 6 miesięcy..."
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Pilność 3 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-medium text-gray-500">Trzeci stopień pilności</label>
              <VoiceRecorder inspectionId={inspectionId!} onTranscription={(text) => setValue('pilnosc_3', text, { shouldDirty: true })} context="trzeci stopień pilności zaleceń pokontrolnych" />
            </div>
            <p className="text-[11px] text-gray-400 mb-1">Roboty do wykonania w ramach bieżącej konserwacji</p>
            <textarea
              {...register('pilnosc_3')}
              placeholder="Roboty bieżącej konserwacji..."
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Ocena końcowa */}
          <div className="pt-3 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-600 block mb-2">Ocena końcowa stanu technicznego</label>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>
                Stan techniczny obiektu oceniam jako{' '}
                <input
                  type="text"
                  {...register('ocena_stanu_tekst')}
                  placeholder="dobry"
                  className="inline-block w-28 text-sm border-b-2 border-gray-300 focus:border-primary-500 outline-none px-1 py-0.5 text-center font-medium"
                />.
              </p>
              <p>
                Obiekt{' '}
                <TogglePair
                  value={watch('ocena_nadaje_sie')}
                  labelTrue="nadaje się"
                  labelFalse="nie nadaje się"
                  onChange={(v) => setValue('ocena_nadaje_sie', v, { shouldDirty: true })}
                />{' '}
                do dalszego użytkowania.
              </p>
              <p>
                W trakcie kontroli{' '}
                <TogglePair
                  value={watch('ocena_stwierdzono_uszkodzenia')}
                  labelTrue="stwierdzono"
                  labelFalse="nie stwierdzono"
                  onChange={(v) => setValue('ocena_stwierdzono_uszkodzenia', v, { shouldDirty: true })}
                />{' '}
                uszkodzenia mogące zagrażać życiu lub zdrowiu ludzi, bezpieczeństwu mienia lub środowiska.
              </p>
            </div>
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

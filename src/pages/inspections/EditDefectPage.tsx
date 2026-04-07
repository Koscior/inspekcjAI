import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Check, MapPin } from 'lucide-react'
import { Input, Select, Button, Card, Spinner } from '@/components/ui'
import { useDefect, useUpdateDefect } from '@/hooks/useDefects'
import { useFloorPlans } from '@/hooks/useFloorPlans'
import { useInspection } from '@/hooks/useInspections'
import { useCreatePin, useUpdatePin, useDeletePin } from '@/hooks/usePins'
import { useUiStore } from '@/store/uiStore'
import { ROUTES, buildPath } from '@/router/routePaths'
import { DEFECT_CATEGORIES, DEFECT_SEVERITY, DEFECT_TYPES, DEFECT_STATUSES, FLOORPLAN_INSPECTION_TYPES } from '@/config/constants'
import { FloorPlanViewer } from '@/components/floor-plans/FloorPlanViewer'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { defectSchema, type DefectFormData } from './defectSchema'

export default function EditDefectPage() {
  const { id: inspectionId, defectId } = useParams<{ id: string; defectId: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const updateDefect = useUpdateDefect()
  const createPin = useCreatePin()
  const updatePin = useUpdatePin()
  const deletePin = useDeletePin()

  const { data: defect, isLoading } = useDefect(inspectionId, defectId)
  const { data: floorPlans } = useFloorPlans(inspectionId)
  const { data: inspection } = useInspection(inspectionId)
  const hasFloorPlans = inspection
    ? FLOORPLAN_INSPECTION_TYPES.includes(inspection.type as typeof FLOORPLAN_INSPECTION_TYPES[number])
    : false

  const [pinLocation, setPinLocation] = useState<{ x: number; y: number } | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [originalPin, setOriginalPin] = useState<{ id: string; floorPlanId: string } | null>(null)

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<DefectFormData>({
    resolver: zodResolver(defectSchema),
  })

  useEffect(() => {
    if (defect) {
      reset({
        title: defect.title,
        description: defect.description ?? '',
        type: defect.type as DefectFormData['type'],
        severity: defect.severity as DefectFormData['severity'],
        category: defect.category ?? DEFECT_CATEGORIES[0],
        status: defect.status as DefectFormData['status'],
        contractor: defect.contractor ?? '',
        responsible_person: defect.responsible_person ?? '',
        deadline: defect.deadline ?? '',
        location_label: defect.location_label ?? '',
        floor_plan_id: defect.floor_plan_id ?? '',
      })

      // Set existing pin
      const pins = (defect as any).pins as Array<{ id: string; floor_plan_id: string; x_percent: number; y_percent: number }> | undefined
      if (pins && pins.length > 0) {
        const pin = pins[0]
        setPinLocation({ x: pin.x_percent, y: pin.y_percent })
        setOriginalPin({ id: pin.id, floorPlanId: pin.floor_plan_id })
      }
    }
  }, [defect, reset])

  const selectedCategory = watch('category')
  const selectedFloorPlanId = watch('floor_plan_id')
  const selectedPlan = floorPlans?.find((p) => p.id === selectedFloorPlanId)

  const onSubmit = handleSubmit(async (data) => {
    if (!inspectionId || !defectId || !defect) return

    try {
      const category = data.category === '__custom__' ? data.custom_category : data.category

      await updateDefect.mutateAsync({
        id: defectId,
        inspectionId,
        updates: {
          title: data.title,
          description: data.description || null,
          type: data.type,
          severity: data.severity,
          category: category || null,
          status: data.status,
          contractor: data.contractor || null,
          responsible_person: data.responsible_person || null,
          deadline: data.deadline || null,
          location_label: data.location_label || null,
          floor_plan_id: data.floor_plan_id || null,
        },
      })

      // Handle pin updates
      if (pinLocation && data.floor_plan_id) {
        if (originalPin) {
          // Update existing pin
          await updatePin.mutateAsync({
            id: originalPin.id,
            inspectionId,
            floorPlanId: data.floor_plan_id,
            updates: {
              x_percent: pinLocation.x,
              y_percent: pinLocation.y,
              floor_plan_id: data.floor_plan_id,
            },
          })
        } else {
          // Create new pin
          await createPin.mutateAsync({
            inspectionId,
            floor_plan_id: data.floor_plan_id,
            defect_id: defectId,
            x_percent: pinLocation.x,
            y_percent: pinLocation.y,
            label_number: defect.number,
          })
        }
      } else if (!pinLocation && originalPin) {
        // Remove pin
        await deletePin.mutateAsync({
          id: originalPin.id,
          inspectionId,
          floorPlanId: originalPin.floorPlanId,
        })
      }

      addToast({ type: 'success', message: `Usterka #${defect.number} zaktualizowana` })
      navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, { id: inspectionId, defectId }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas aktualizacji usterki'
      addToast({ type: 'error', message: msg, duration: 8000 })
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie..." />
      </div>
    )
  }

  if (!defect) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Nie znaleziono usterki</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId! }))}
        >
          Wróć do listy
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, { id: inspectionId!, defectId: defectId! }))}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
      >
        <ChevronLeft size={16} />
        Usterka #{defect.number}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edytuj usterkę #{defect.number}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title & Description */}
        <Card className="space-y-4">
          <Input
            label="Tytuł"
            placeholder="Np. Pęknięcie ściany w kuchni"
            required
            error={errors.title?.message}
            {...register('title')}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Opis / Uwagi</label>
              <VoiceRecorder
                inspectionId={inspectionId!}
                defectId={defectId}
                onTranscription={(text) => setValue('description', text, { shouldDirty: true })}
                context="opis usterki budowlanej"
              />
            </div>
            <textarea
              placeholder="Dodatkowy opis usterki..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500 resize-none"
              {...register('description')}
            />
          </div>
        </Card>

        {/* Classification */}
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Klasyfikacja</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Typ zgłoszenia</label>
              <div className="space-y-1">
                {Object.entries(DEFECT_TYPES).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={key} {...register('type')} className="text-primary-600" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ważność</label>
              <div className="space-y-1">
                {Object.entries(DEFECT_SEVERITY).map(([key, { label, color }]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={key} {...register('severity')} className="text-primary-600" />
                    <span className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Select
            label="Kategoria"
            error={errors.category?.message}
            {...register('category')}
          >
            {DEFECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">Inna (wpisz własną)...</option>
          </Select>

          {selectedCategory === '__custom__' && (
            <Input
              label="Własna kategoria"
              placeholder="Nazwa kategorii"
              {...register('custom_category')}
            />
          )}

          <Select
            label="Status"
            {...register('status')}
          >
            {Object.entries(DEFECT_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Card>

        {/* People & Deadline */}
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Osoby i terminy</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Wykonawca" placeholder="Firma / osoba" {...register('contractor')} />
            <Input label="Osoba odpowiedzialna" placeholder="Imię i nazwisko" {...register('responsible_person')} />
          </div>
          <Input label="Termin naprawy" type="date" {...register('deadline')} />
        </Card>

        {/* Location on floor plan */}
        {hasFloorPlans && floorPlans && floorPlans.length > 0 && (
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              <MapPin size={14} className="inline mr-1" />
              Lokalizacja na planie
            </h3>

            <Select label="Wybierz plan" {...register('floor_plan_id')}>
              <option value="">— brak —</option>
              {floorPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </Select>

            <Input label="Opis lokalizacji" placeholder="np. Pokój 3, ściana północna" {...register('location_label')} />

            {selectedPlan && (
              <div>
                {!showPlanPicker ? (
                  <div>
                    {pinLocation ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary-500 border-2 border-primary-700 flex items-center justify-center text-[9px] font-bold text-white">
                          {defect.number}
                        </div>
                        <span className="text-xs text-green-600 font-medium">
                          Pinezka #{defect.number} ustawiona
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setShowPlanPicker(true)}
                        >
                          Zmień
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPlanPicker(true)}
                      >
                        <MapPin size={14} />
                        Wskaż na planie
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <FloorPlanViewer
                      storagePath={selectedPlan.storage_path}
                      pins={(selectedPlan as any).pins || []}
                      mode="pick"
                      previewPin={pinLocation ? {
                        x_percent: pinLocation.x,
                        y_percent: pinLocation.y,
                        label_number: defect.number,
                      } : null}
                      onLocationPick={(x, y) => {
                        setPinLocation({ x, y })
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      {pinLocation && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowPlanPicker(false)}
                        >
                          <Check size={14} />
                          Potwierdź lokalizację
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPinLocation(null)
                          setShowPlanPicker(false)
                        }}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, { id: inspectionId!, defectId: defectId! }))}
          >
            Anuluj
          </Button>
          <Button type="submit" loading={updateDefect.isPending}>
            <Check size={16} />
            Zapisz zmiany
          </Button>
        </div>
      </form>
    </div>
  )
}

import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Check, MapPin, Camera, Plus } from 'lucide-react'
import { Input, Textarea, Select, Button, Card } from '@/components/ui'
import { useCreateDefect, useNextDefectNumber } from '@/hooks/useDefects'
import { useFloorPlans } from '@/hooks/useFloorPlans'
import { useInspection } from '@/hooks/useInspections'
import { useCreatePin } from '@/hooks/usePins'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES, buildPath } from '@/router/routePaths'
import { DEFECT_CATEGORIES, DEFECT_SEVERITY, DEFECT_TYPES, DEFECT_STATUSES, FLOORPLAN_INSPECTION_TYPES } from '@/config/constants'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoViewer } from '@/components/photos/PhotoViewer'
import { FloorPlanViewer } from '@/components/floor-plans/FloorPlanViewer'
import { usePhotos } from '@/hooks/usePhotos'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { defectSchema, type DefectFormData } from './defectSchema'

export default function NewDefectPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const profile = useAuthStore((s) => s.profile)
  const createDefect = useCreateDefect()
  const createPin = useCreatePin()
  const { data: nextNumber } = useNextDefectNumber(inspectionId)
  const { data: floorPlans } = useFloorPlans(inspectionId)
  const { data: inspection } = useInspection(inspectionId)
  const hasFloorPlans = inspection
    ? FLOORPLAN_INSPECTION_TYPES.includes(inspection.type as typeof FLOORPLAN_INSPECTION_TYPES[number])
    : false

  const [createdDefectId, setCreatedDefectId] = useState<string | null>(null)
  const [createdNumber, setCreatedNumber] = useState<number | null>(null)
  const [pinLocation, setPinLocation] = useState<{ x: number; y: number } | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  // Photos for newly created defect
  const { data: defectPhotos } = usePhotos(inspectionId, createdDefectId ? { defectId: createdDefectId } : undefined)

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<DefectFormData>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      type: 'usterka',
      severity: 'minor',
      status: 'open',
      category: DEFECT_CATEGORIES[0],
    },
  })

  const selectedCategory = watch('category')
  const selectedFloorPlanId = watch('floor_plan_id')
  const selectedPlan = floorPlans?.find((p) => p.id === selectedFloorPlanId)

  const onSubmit = handleSubmit(async (data) => {
    if (!inspectionId) return

    try {
      const category = data.category === '__custom__' ? data.custom_category : data.category

      const defect = await createDefect.mutateAsync({
        inspection_id: inspectionId,
        title: data.title,
        description: data.description || null,
        type: data.type,
        severity: data.severity,
        category: category || null,
        status: data.status,
        contractor: data.contractor || null,
        responsible_person: data.responsible_person || null,
        reporter_name: profile?.full_name || null,
        deadline: data.deadline || null,
        location_label: data.location_label || null,
        floor_plan_id: data.floor_plan_id || null,
      })

      // Create pin if location was picked
      if (pinLocation && data.floor_plan_id) {
        await createPin.mutateAsync({
          inspectionId,
          floor_plan_id: data.floor_plan_id,
          defect_id: defect.id,
          x_percent: pinLocation.x,
          y_percent: pinLocation.y,
          label_number: defect.number,
        })
      }

      setCreatedDefectId(defect.id)
      setCreatedNumber(defect.number)
      addToast({ type: 'success', message: `Usterka #${defect.number} zapisana — dodaj zdjęcia` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas dodawania usterki'
      addToast({ type: 'error', message: msg, duration: 8000 })
    }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId! }))}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
      >
        <ChevronLeft size={16} />
        Usterki
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nowa usterka</h1>
        {nextNumber && (
          <span className="text-sm font-mono text-gray-400">#{nextNumber}</span>
        )}
      </div>

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
                defectId={createdDefectId || undefined}
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
                          {nextNumber ?? '?'}
                        </div>
                        <span className="text-xs text-green-600 font-medium">
                          Pinezka #{nextNumber} ustawiona
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
                        label_number: nextNumber ?? 0,
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

        {/* Photos */}
        {!createdDefectId ? (
          <>
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                <Camera size={14} className="inline mr-1" />
                Zdjęcia
              </h3>
              <p className="text-xs text-gray-400">Zdjęcia dodasz po zapisaniu usterki</p>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId! }))}
              >
                Anuluj
              </Button>
              <Button type="submit" loading={createDefect.isPending}>
                <Check size={16} />
                Dodaj usterkę
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Phase 2 — defect saved, add photos */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Check size={16} className="text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  Usterka #{createdNumber} zapisana
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-700">
                <Camera size={14} className="inline mr-1" />
                Dodaj zdjęcia do usterki
              </h3>
              <PhotoUploader inspectionId={inspectionId!} defectId={createdDefectId} onUploaded={(id) => setHighlightedPhotoId(id)} />
              {defectPhotos && defectPhotos.length > 0 && (
                <PhotoGrid
                  photos={defectPhotos}
                  onPhotoClick={(p) => setViewerIndex(defectPhotos.indexOf(p))}
                  highlightedPhotoId={highlightedPhotoId}
                  onHighlightDone={clearHighlight}
                />
              )}
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreatedDefectId(null)
                  setCreatedNumber(null)
                  setPinLocation(null)
                  setShowPlanPicker(false)
                  setViewerIndex(null)
                  reset()
                }}
              >
                <Plus size={16} />
                Dodaj kolejną
              </Button>
              <Button
                type="button"
                onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId! }))}
              >
                Zakończ
              </Button>
            </div>
          </>
        )}
      </form>

      {/* Photo viewer */}
      {viewerIndex !== null && defectPhotos && (
        <PhotoViewer
          photos={defectPhotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAnnotate={(photo) => {
            navigate(buildPath(ROUTES.PHOTO_ANNOTATE, {
              inspectionId: inspectionId!,
              photoId: photo.id,
            }))
          }}
        />
      )}
    </div>
  )
}

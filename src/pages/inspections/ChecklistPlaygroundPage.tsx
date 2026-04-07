import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ClipboardList, ChevronDown, ChevronUp, Camera } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useInspection } from '@/hooks/useInspections'
import { useChecklist, useUpdateChecklistItem, type ChecklistSection } from '@/hooks/useChecklist'
import { usePhotos } from '@/hooks/usePhotos'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Spinner, EmptyState, Card, Badge } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoViewer } from '@/components/photos/PhotoViewer'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import type { ChecklistItem } from '@/types/database.types'
import type { Inspection } from '@/types/database.types'

export default function ChecklistPlaygroundPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const addToast = useUiStore((s) => s.addToast)

  const openItemId = searchParams.get('openItem')

  const { data: inspection } = useInspection(inspectionId)
  const { data: sections, isLoading } = useChecklist(inspectionId, inspection?.type as Inspection['type'])
  const updateItem = useUpdateChecklistItem()

  const [openSection, setOpenSection] = useState<string | null>(null)

  // Auto-expand section containing openItem (and collapse others)
  useEffect(() => {
    if (!openItemId || !sections) return
    for (const section of sections) {
      if (section.items.some((i) => i.id === openItemId)) {
        setOpenSection(section.section)
        break
      }
    }
  }, [openItemId, sections])

  const clearOpenItem = useCallback(() => {
    if (openItemId) {
      setSearchParams((prev) => {
        prev.delete('openItem')
        return prev
      }, { replace: true })
    }
  }, [openItemId, setSearchParams])

  function toggleSection(section: string) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  async function handleUpdate(item: ChecklistItem, updates: Record<string, unknown>) {
    if (!inspectionId) return
    try {
      await updateItem.mutateAsync({
        id: item.id,
        inspectionId,
        updates,
      })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu' })
    }
  }

  // Progress calculation
  const allItems = sections?.flatMap((s) => s.items) || []
  const filled = allItems.filter((i) => {
    const ft = i.field_type || 'text_photos'
    if (ft === 'yesno') return i.yesno_value !== null && i.yesno_value !== undefined
    if (ft === 'yesno_desc_photos') return i.yesno_value !== null && i.yesno_value !== undefined
    return !!i.notes || !!i.state
  }).length
  const progress = allItems.length > 0 ? Math.round((filled / allItems.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      <InspectionNav />

      <h1 className="text-lg font-bold text-gray-900 mb-2">Checklist — Plac zabaw</h1>

      {/* Progress */}
      {sections && sections.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{filled} / {allItems.length} wypełnione</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" label="Ładowanie checklisty..." className="py-16" />
      ) : !sections?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Brak checklisty"
          description="Brak szablonu checklisty dla placu zabaw"
        />
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openSection === section.section
            const sectionFilled = section.items.filter((i) => {
              const ft = i.field_type || 'text_photos'
              if (ft === 'yesno' || ft === 'yesno_desc_photos') return i.yesno_value !== null && i.yesno_value !== undefined
              return !!i.notes || !!i.state
            }).length

            return (
              <Card key={section.section} className="overflow-hidden !p-0">
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">{section.section}</h3>
                    <Badge color={sectionFilled === section.items.length ? 'green' : 'gray'} size="sm">
                      {sectionFilled}/{section.items.length}
                    </Badge>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    {section.items.map((item) => {
                      const ft = item.field_type || 'text_photos'
                      const isHighlighted = item.id === openItemId
                      if (ft === 'yesno') {
                        return (
                          <YesNoRow
                            key={item.id}
                            item={item}
                            onUpdate={handleUpdate}
                          />
                        )
                      }
                      if (ft === 'yesno_desc_photos') {
                        return (
                          <YesNoDescPhotosRow
                            key={item.id}
                            item={item}
                            inspectionId={inspectionId!}
                            onUpdate={handleUpdate}
                            highlighted={isHighlighted}
                            onHighlightConsumed={clearOpenItem}
                          />
                        )
                      }
                      return (
                        <TextPhotosRow
                          key={item.id}
                          item={item}
                          inspectionId={inspectionId!}
                          onUpdate={handleUpdate}
                          highlighted={isHighlighted}
                          onHighlightConsumed={clearOpenItem}
                        />
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── YesNo Row (compact) ─────────────────────────────────────────────────────

function YesNoRow({ item, onUpdate }: {
  item: ChecklistItem
  onUpdate: (item: ChecklistItem, updates: Record<string, unknown>) => void
}) {
  return (
    <div className="px-4 py-2.5 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3">
      <p className="text-sm text-gray-800 flex-1">{item.element_name}</p>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onUpdate(item, { yesno_value: true })}
          className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
            item.yesno_value === true
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
          }`}
        >
          Tak
        </button>
        <button
          type="button"
          onClick={() => onUpdate(item, { yesno_value: false })}
          className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
            item.yesno_value === false
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-500 border-gray-300 hover:border-red-400'
          }`}
        >
          Nie
        </button>
      </div>
    </div>
  )
}

// ─── YesNo + Description + Photos Row ────────────────────────────────────────

function YesNoDescPhotosRow({ item, inspectionId, onUpdate, highlighted, onHighlightConsumed }: {
  item: ChecklistItem
  inspectionId: string
  onUpdate: (item: ChecklistItem, updates: Record<string, unknown>) => void
  highlighted?: boolean
  onHighlightConsumed?: () => void
}) {
  const navigate = useNavigate()
  const rowRef = useRef<HTMLDivElement>(null)
  const [notesValue, setNotesValue] = useState(item.notes || '')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [flash, setFlash] = useState(false)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearPhotoHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  const { data: photos } = usePhotos(inspectionId, { checklistItemId: item.id })

  useEffect(() => {
    if (!highlighted) return
    setFlash(true)
    const scrollTimer = setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    const flashTimer = setTimeout(() => setFlash(false), 2000)
    onHighlightConsumed?.()
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(flashTimer)
    }
  }, [highlighted])

  function handleNotesInput(value: string) {
    setNotesValue(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => onUpdate(item, { notes: value || null }), 800)
    setDebounceTimer(timer)
  }

  return (
    <div ref={rowRef} className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors duration-700 ${flash ? 'bg-primary-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-800">{item.element_name}</p>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onUpdate(item, { yesno_value: true })}
            className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
              item.yesno_value === true
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
            }`}
          >
            Tak
          </button>
          <button
            type="button"
            onClick={() => onUpdate(item, { yesno_value: false })}
            className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
              item.yesno_value === false
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-500 border-gray-300 hover:border-red-400'
            }`}
          >
            Nie
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-gray-400">Opis</span>
          <VoiceRecorder
            inspectionId={inspectionId}
            onTranscription={(text) => {
              setNotesValue(text)
              onUpdate(item, { notes: text || null })
            }}
            context="opis stanu elementu placu zabaw"
          />
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => handleNotesInput(e.target.value)}
          placeholder="Opis stanu, uwagi..."
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mt-2">
          <PhotoGrid photos={photos} columns={4} onPhotoClick={(p) => setViewerIndex(photos.indexOf(p))} highlightedPhotoId={highlightedPhotoId} onHighlightDone={clearPhotoHighlight} />
        </div>
      )}
      <div className="mt-2">
        <PhotoUploader inspectionId={inspectionId} checklistItemId={item.id} onUploaded={(id) => setHighlightedPhotoId(id)} />
        {photos && photos.length > 0 && (
          <span className="text-[10px] text-gray-400 mt-1 block">
            {photos.length} {photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'}
          </span>
        )}
      </div>

      {viewerIndex !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAnnotate={(photo) => {
            navigate(buildPath(ROUTES.PHOTO_ANNOTATE, { inspectionId, photoId: photo.id }))
          }}
        />
      )}
    </div>
  )
}

// ─── State assessment options ────────────────────────────────────────────────

const STATE_OPTIONS = [
  { value: 'dobry' as const, label: 'Dobry', activeColor: 'bg-green-600 text-white border-green-600' },
  { value: 'sredni' as const, label: 'Średni', activeColor: 'bg-yellow-500 text-white border-yellow-500' },
  { value: 'dostateczny' as const, label: 'Dostateczny', activeColor: 'bg-red-600 text-white border-red-600' },
  { value: 'nie_dotyczy' as const, label: 'N/D', activeColor: 'bg-gray-500 text-white border-gray-500' },
] as const

// ─── Text + Photos Row ───────────────────────────────────────────────────────

function TextPhotosRow({ item, inspectionId, onUpdate, highlighted, onHighlightConsumed }: {
  item: ChecklistItem
  inspectionId: string
  onUpdate: (item: ChecklistItem, updates: Record<string, unknown>) => void
  highlighted?: boolean
  onHighlightConsumed?: () => void
}) {
  const navigate = useNavigate()
  const rowRef = useRef<HTMLDivElement>(null)
  const [notesValue, setNotesValue] = useState(item.notes || '')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [flash, setFlash] = useState(false)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearPhotoHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  const { data: photos } = usePhotos(inspectionId, { checklistItemId: item.id })

  useEffect(() => {
    if (!highlighted) return
    setFlash(true)
    const scrollTimer = setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    const flashTimer = setTimeout(() => setFlash(false), 2000)
    onHighlightConsumed?.()
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(flashTimer)
    }
  }, [highlighted])

  function handleNotesInput(value: string) {
    setNotesValue(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => onUpdate(item, { notes: value || null }), 800)
    setDebounceTimer(timer)
  }

  return (
    <div ref={rowRef} className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors duration-700 ${flash ? 'bg-primary-50' : ''}`}>
      <p className="text-sm font-medium text-gray-800">{item.element_name}</p>

      {/* State assessment */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {STATE_OPTIONS.map(({ value, label, activeColor }) => (
          <button
            key={value}
            type="button"
            onClick={() => onUpdate(item, { state: item.state === value ? null : value })}
            className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
              item.state === value
                ? activeColor
                : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mt-2">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-gray-400">Stan techniczny</span>
          <VoiceRecorder
            inspectionId={inspectionId}
            onTranscription={(text) => {
              setNotesValue(text)
              onUpdate(item, { notes: text || null })
            }}
            context="opis stanu technicznego elementu placu zabaw"
          />
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => handleNotesInput(e.target.value)}
          placeholder="Opis stanu technicznego..."
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mt-2">
          <PhotoGrid photos={photos} columns={4} onPhotoClick={(p) => setViewerIndex(photos.indexOf(p))} highlightedPhotoId={highlightedPhotoId} onHighlightDone={clearPhotoHighlight} />
        </div>
      )}
      <div className="mt-2">
        <PhotoUploader inspectionId={inspectionId} checklistItemId={item.id} onUploaded={(id) => setHighlightedPhotoId(id)} />
        {photos && photos.length > 0 && (
          <span className="text-[10px] text-gray-400 mt-1 block">
            {photos.length} {photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'}
          </span>
        )}
      </div>

      {viewerIndex !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAnnotate={(photo) => {
            navigate(buildPath(ROUTES.PHOTO_ANNOTATE, { inspectionId, photoId: photo.id }))
          }}
        />
      )}
    </div>
  )
}

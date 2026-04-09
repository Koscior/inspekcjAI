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
import type { ChecklistItem, Photo } from '@/types/database.types'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import type { Inspection } from '@/types/database.types'
import ChecklistPlaygroundPage from './ChecklistPlaygroundPage'

export default function ChecklistPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const openItemId = searchParams.get('openItem')

  const { data: inspection } = useInspection(inspectionId)

  // Dispatch to playground page for plac_zabaw
  if (inspection?.type === 'plac_zabaw') {
    return <ChecklistPlaygroundPage />
  }
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

  // Clear openItem from URL after it's been consumed (so refresh doesn't re-trigger)
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

  // Progress: count items with notes OR state
  const allItems = sections?.flatMap((s) => s.items) || []
  const filled = allItems.filter((i) => !!i.notes || !!i.state).length
  const progress = allItems.length > 0 ? Math.round((filled / allItems.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <InspectionNav />

      <h1 className="text-lg font-bold text-gray-900 mb-2">Checklist</h1>

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
          description="Ten typ inspekcji nie posiada szablonu checklisty"
        />
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openSection === section.section
            const sectionFilled = section.items.filter((i) => !!i.notes || !!i.state).length

            return (
              <Card key={section.section} className="overflow-hidden !p-0">
                {/* Section header */}
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

                {/* Items */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {section.items.map((item) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        inspectionId={inspectionId!}
                        onUpdate={handleUpdate}
                        highlighted={item.id === openItemId}
                        onHighlightConsumed={clearOpenItem}
                      />
                    ))}
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

// ─── State assessment options ────────────────────────────────────────────────

const STATE_OPTIONS = [
  { value: 'dobry' as const, label: 'Dobry', activeColor: 'bg-green-600 text-white border-green-600' },
  { value: 'sredni' as const, label: 'Średni', activeColor: 'bg-yellow-500 text-white border-yellow-500' },
  { value: 'dostateczny' as const, label: 'Dostateczny', activeColor: 'bg-red-600 text-white border-red-600' },
  { value: 'nie_dotyczy' as const, label: 'N/D', activeColor: 'bg-gray-500 text-white border-gray-500' },
] as const

// ─── Checklist Item Row ──────────────────────────────────────────────────────

interface ItemRowProps {
  item: ChecklistItem
  inspectionId: string
  onUpdate: (item: ChecklistItem, updates: Record<string, unknown>) => void
  highlighted?: boolean
  onHighlightConsumed?: () => void
}

function ChecklistItemRow({ item, inspectionId, onUpdate, highlighted, onHighlightConsumed }: ItemRowProps) {
  const navigate = useNavigate()
  const rowRef = useRef<HTMLDivElement>(null)
  const [notesValue, setNotesValue] = useState(item.notes || '')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [flash, setFlash] = useState(false)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearPhotoHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  const { data: photos } = usePhotos(inspectionId, { checklistItemId: item.id })

  // Auto-scroll and highlight when this item was just photographed
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
    <div
      ref={rowRef}
      className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors duration-700 ${flash ? 'bg-primary-50' : ''}`}
    >
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

      {/* Notes — always visible */}
      <div className="mt-2">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-gray-400">Uwagi</span>
          <VoiceRecorder
            inspectionId={inspectionId}
            onTranscription={(text) => {
              setNotesValue(text)
              onUpdate(item, { notes: text || null })
            }}
            context="ocena stanu elementu budynku, uwagi z inspekcji budowlanej"
          />
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => handleNotesInput(e.target.value)}
          placeholder="Opis stanu technicznego, uwagi..."
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mt-2">
          <PhotoGrid
            photos={photos}
            columns={4}
            onPhotoClick={(p) => setViewerIndex(photos.indexOf(p))}
            highlightedPhotoId={highlightedPhotoId}
            onHighlightDone={clearPhotoHighlight}
          />
        </div>
      )}

      {/* Photo buttons — always visible */}
      <div className="mt-2">
        <PhotoUploader
          inspectionId={inspectionId}
          checklistItemId={item.id}
          onUploaded={(id) => setHighlightedPhotoId(id)}
        />
        {photos && photos.length > 0 && (
          <span className="text-[10px] text-gray-400 mt-1 block">
            {photos.length} {photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'}
          </span>
        )}
      </div>

      {/* Photo viewer */}
      {viewerIndex !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAnnotate={(photo) => {
            navigate(buildPath(ROUTES.PHOTO_ANNOTATE, {
              inspectionId,
              photoId: photo.id,
            }))
          }}
        />
      )}
    </div>
  )
}

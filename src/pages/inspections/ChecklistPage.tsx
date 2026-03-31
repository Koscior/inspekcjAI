import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, ChevronDown, ChevronUp, CheckCircle2, Circle, MinusCircle } from 'lucide-react'
import { useState } from 'react'
import { useInspection } from '@/hooks/useInspections'
import { useChecklist, useUpdateChecklistItem, type ChecklistSection } from '@/hooks/useChecklist'
import { usePhotos } from '@/hooks/usePhotos'
import { ROUTES, buildPath } from '@/router/routePaths'
import { ELEMENT_STATE } from '@/config/constants'
import { Spinner, EmptyState, Card, Badge } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoViewer } from '@/components/photos/PhotoViewer'
import type { ChecklistItem, Photo } from '@/types/database.types'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import type { Inspection } from '@/types/database.types'

export default function ChecklistPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const { data: inspection } = useInspection(inspectionId)
  const { data: sections, isLoading } = useChecklist(inspectionId, inspection?.type as Inspection['type'])
  const updateItem = useUpdateChecklistItem()

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  async function handleStateChange(item: ChecklistItem, state: ChecklistItem['state']) {
    if (!inspectionId) return
    try {
      await updateItem.mutateAsync({
        id: item.id,
        inspectionId,
        updates: { state },
      })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu' })
    }
  }

  async function handleNotesChange(item: ChecklistItem, notes: string) {
    if (!inspectionId) return
    try {
      await updateItem.mutateAsync({
        id: item.id,
        inspectionId,
        updates: { notes: notes || null },
      })
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu' })
    }
  }

  // Calculate progress
  const allItems = sections?.flatMap((s) => s.items) || []
  const filled = allItems.filter((i) => i.state !== null).length
  const progress = allItems.length > 0 ? Math.round((filled / allItems.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
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
            const isOpen = expandedSections.has(section.section)
            const sectionFilled = section.items.filter((i) => i.state !== null).length

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
                        onStateChange={handleStateChange}
                        onNotesChange={handleNotesChange}
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

// ─── Checklist Item Row ──────────────────────────────────────────────────────

interface ItemRowProps {
  item: ChecklistItem
  inspectionId: string
  onStateChange: (item: ChecklistItem, state: ChecklistItem['state']) => void
  onNotesChange: (item: ChecklistItem, notes: string) => void
}

function ChecklistItemRow({ item, inspectionId, onStateChange, onNotesChange }: ItemRowProps) {
  const navigate = useNavigate()
  const [showNotes, setShowNotes] = useState(!!item.notes)
  const [notesValue, setNotesValue] = useState(item.notes || '')
  const [showUploader, setShowUploader] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { data: photos } = usePhotos(inspectionId, { checklistItemId: item.id })

  const stateOptions = Object.entries(ELEMENT_STATE) as [ChecklistItem['state'] & string, string][]

  function handleNotesInput(value: string) {
    setNotesValue(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => onNotesChange(item, value), 800)
    setDebounceTimer(timer)
  }

  const stateIcon = item.state === 'dobry'
    ? <CheckCircle2 size={16} className="text-green-500" />
    : item.state === 'nie_dotyczy'
    ? <MinusCircle size={16} className="text-gray-400" />
    : item.state
    ? <Circle size={16} className="text-orange-400" />
    : <Circle size={16} className="text-gray-300" />

  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{stateIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">{item.element_name}</p>

          {/* State buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {stateOptions.map(([key, label]) => (
              <button
                key={key}
                onClick={() => onStateChange(item, key as ChecklistItem['state'])}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  item.state === key
                    ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Notes toggle + input */}
          <div className="mt-2">
            {!showNotes ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowNotes(true)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  + Dodaj uwagę
                </button>
                <VoiceRecorder
                  onTranscription={(text) => {
                    setNotesValue(text)
                    setShowNotes(true)
                    onNotesChange(item, text)
                  }}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] text-gray-400">Uwagi</span>
                  <VoiceRecorder
                    onTranscription={(text) => {
                      setNotesValue(text)
                      onNotesChange(item, text)
                    }}
                  />
                </div>
                <textarea
                  value={notesValue}
                  onChange={(e) => handleNotesInput(e.target.value)}
                  placeholder="Uwagi do tego elementu..."
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Photos */}
          {photos && photos.length > 0 && (
            <div className="mt-2">
              <PhotoGrid
                photos={photos}
                columns={4}
                onPhotoClick={(p) => setViewerIndex(photos.indexOf(p))}
              />
            </div>
          )}

          {/* Add photo toggle */}
          <div className="mt-2">
            {!showUploader ? (
              <button
                onClick={() => setShowUploader(true)}
                className="text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span>
                Zdjęcie referencyjne
                {photos && photos.length > 0 && (
                  <span className="ml-1 text-gray-400">({photos.length})</span>
                )}
              </button>
            ) : (
              <div className="mt-1">
                <PhotoUploader
                  inspectionId={inspectionId}
                  checklistItemId={item.id}
                  onUploaded={() => setShowUploader(false)}
                />
              </div>
            )}
          </div>
        </div>
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

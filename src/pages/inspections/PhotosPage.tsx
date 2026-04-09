import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { usePhotos, useDeletePhoto } from '@/hooks/usePhotos'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Spinner, EmptyState } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoViewer } from '@/components/photos/PhotoViewer'
import type { Photo } from '@/types/database.types'

type FilterTab = 'all' | 'defects' | 'checklist' | 'free'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'defects', label: 'Usterki' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'free', label: 'Luźne' },
]

export default function PhotosPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const deletePhoto = useDeletePhoto()

  const { data: allPhotos, isLoading } = usePhotos(inspectionId)

  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  const photos = (allPhotos ?? []).filter((p) => {
    if (activeTab === 'defects') return !!p.defect_id
    if (activeTab === 'checklist') return !!p.checklist_item_id
    if (activeTab === 'free') return !p.defect_id && !p.checklist_item_id
    return true
  })

  async function handleDelete(photo: Photo) {
    if (!inspectionId) return
    if (!window.confirm(`Usunąć zdjęcie Fot. ${photo.photo_number}?`)) return
    try {
      await deletePhoto.mutateAsync({
        id: photo.id,
        inspectionId,
        originalPath: photo.original_path,
        thumbnailPath: photo.thumbnail_path,
        annotatedPath: photo.annotated_path,
      })
      addToast({ type: 'success', message: 'Zdjęcie usunięte' })
    } catch {
      addToast({ type: 'error', message: 'Błąd usuwania zdjęcia' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <InspectionNav />

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-gray-900">
          Zdjęcia{allPhotos?.length ? <span className="text-gray-400 font-normal text-base ml-1">({allPhotos.length})</span> : ''}
        </h1>
      </div>

      {/* Upload */}
      <div className="mb-4">
        <PhotoUploader inspectionId={inspectionId!} onUploaded={(id) => setHighlightedPhotoId(id)} />
      </div>

      {/* Filter tabs */}
      {(allPhotos?.length ?? 0) > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const count = (allPhotos ?? []).filter((p) => {
              if (tab.key === 'defects') return !!p.defect_id
              if (tab.key === 'checklist') return !!p.checklist_item_id
              if (tab.key === 'free') return !p.defect_id && !p.checklist_item_id
              return true
            }).length

            if (tab.key !== 'all' && count === 0) return null

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-0.5 ${activeTab === tab.key ? 'opacity-80' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" label="Ładowanie zdjęć..." className="py-16" />
      ) : !photos.length ? (
        <EmptyState
          icon={Camera}
          title={activeTab === 'all' ? 'Brak zdjęć' : 'Brak zdjęć w tej kategorii'}
          description={activeTab === 'all' ? 'Dodaj zdjęcia do tej inspekcji' : ''}
        />
      ) : (
        <PhotoGrid
          photos={photos}
          columns={4}
          onPhotoClick={(photo) => setViewerIndex(photos.indexOf(photo))}
          onDelete={handleDelete}
          highlightedPhotoId={highlightedPhotoId}
          onHighlightDone={clearHighlight}
        />
      )}

      {/* Viewer */}
      {viewerIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
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

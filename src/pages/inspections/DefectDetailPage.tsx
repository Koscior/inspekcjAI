import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2, Edit3, MapPin } from 'lucide-react'
import { useDefect, useDeleteDefect, useUpdateDefect } from '@/hooks/useDefects'
import { usePhotos, useDeletePhoto, getPhotoUrl } from '@/hooks/usePhotos'
import { useFloorPlan } from '@/hooks/useFloorPlans'
import { ROUTES, buildPath } from '@/router/routePaths'
import { DEFECT_SEVERITY, DEFECT_TYPES, DEFECT_STATUSES } from '@/config/constants'
import { Button, Spinner, Card, SeverityBadge, StatusBadge, Badge } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/Modal'
import { useUiStore } from '@/store/uiStore'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoViewer } from '@/components/photos/PhotoViewer'
import { AiAnalysisModal } from '@/components/photos/AiAnalysisModal'
import { useAiPhotoAnalysis } from '@/hooks/useAiPhotoAnalysis'
import { FloorPlanViewer } from '@/components/floor-plans/FloorPlanViewer'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Photo } from '@/types/database.types'

export default function DefectDetailPage() {
  const { id: inspectionId, defectId } = useParams<{ id: string; defectId: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const deleteDefect = useDeleteDefect()
  const deletePhoto = useDeletePhoto()

  const { data: defect, isLoading } = useDefect(inspectionId, defectId)
  const { data: photos } = usePhotos(inspectionId, defectId ? { defectId } : undefined)
  const { data: floorPlan } = useFloorPlan(defect?.floor_plan_id ?? undefined)

  const [viewerPhoto, setViewerPhoto] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const clearHighlight = useCallback(() => setHighlightedPhotoId(null), [])

  const ai = useAiPhotoAnalysis({ inspectionId: inspectionId! })

  async function handleDelete() {
    if (!inspectionId || !defectId) return
    try {
      await deleteDefect.mutateAsync({ id: defectId, inspectionId })
      addToast({ type: 'success', message: 'Usterka usunięta' })
      navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId }))
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania' })
    }
  }

  async function handleDeletePhoto(photo: Photo) {
    if (!inspectionId) return
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

  if (isLoading) {
    return <Spinner size="lg" label="Ładowanie..." className="py-16" />
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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECTS, { id: inspectionId! }))}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronLeft size={16} />
          Usterki
        </button>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-gray-400">#{defect.number}</span>
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{defect.title}</h1>
              {defect.category && (
                <Badge color="gray" size="sm" className="mt-1">{defect.category}</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(buildPath(ROUTES.INSPECTION_DEFECT_EDIT, { id: inspectionId!, defectId: defectId! }))}
              >
                <Edit3 size={15} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      {defect.description && (
        <Card>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Opis</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.description}</p>
        </Card>
      )}

      {/* Details */}
      <Card className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Szczegóły</h3>
        <DetailRow label="Typ zgłoszenia" value={DEFECT_TYPES[defect.type]} />
        <DetailRow label="Ważność" value={DEFECT_SEVERITY[defect.severity]?.label} />
        <DetailRow label="Status" value={DEFECT_STATUSES[defect.status]} />
        <DetailRow label="Wykonawca" value={defect.contractor} />
        <DetailRow label="Osoba odpowiedzialna" value={defect.responsible_person} />
        <DetailRow label="Zgłaszający" value={defect.reporter_name} />
        <DetailRow label="Lokalizacja" value={defect.location_label} />
        <DetailRow
          label="Termin naprawy"
          value={defect.deadline ? format(new Date(defect.deadline), 'd MMMM yyyy', { locale: pl }) : null}
        />
        <DetailRow
          label="Utworzono"
          value={format(new Date(defect.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
        />
        <DetailRow
          label="Aktualizacja"
          value={format(new Date(defect.updated_at), 'd MMM yyyy, HH:mm', { locale: pl })}
        />
      </Card>

      {/* Floor plan with pin */}
      {floorPlan && (
        <Card>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            <MapPin size={12} className="inline mr-1" />
            Lokalizacja na planie — {floorPlan.label}
          </h3>
          <FloorPlanViewer
            storagePath={floorPlan.storage_path}
            pins={(floorPlan as any).pins || []}
          />
        </Card>
      )}

      {/* Photos */}
      <Card className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Zdjęcia {photos?.length ? `(${photos.length})` : ''}
        </h3>
        <PhotoUploader inspectionId={inspectionId!} defectId={defectId} onUploaded={(id) => setHighlightedPhotoId(id)} />
        {photos && photos.length > 0 && (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(p) => setViewerPhoto(photos.indexOf(p))}
            onDelete={handleDeletePhoto}
            onAiAnalyze={(photo) => ai.trigger(photo)}
            highlightedPhotoId={highlightedPhotoId}
            onHighlightDone={clearHighlight}
          />
        )}
      </Card>

      {/* Photo viewer */}
      {viewerPhoto !== null && photos && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerPhoto}
          onClose={() => setViewerPhoto(null)}
          onAnnotate={(photo) => {
            navigate(buildPath(ROUTES.PHOTO_ANNOTATE, {
              inspectionId: inspectionId!,
              photoId: photo.id,
            }))
          }}
          onAiAnalyze={(photo) => ai.trigger(photo)}
        />
      )}

      {/* AI photo analysis */}
      <AiAnalysisModal
        isOpen={ai.state.open}
        loading={ai.state.loading}
        error={ai.state.error}
        aiText={ai.state.aiText}
        existingText={ai.state.existingText}
        onClose={ai.close}
        onReplace={ai.onReplace}
        onAppend={ai.onAppend}
      />

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Usuń usterkę"
        message={`Czy na pewno chcesz usunąć usterkę #${defect.number}? Ta operacja jest nieodwracalna.`}
        confirmLabel="Usuń"
        danger
        loading={deleteDefect.isPending}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

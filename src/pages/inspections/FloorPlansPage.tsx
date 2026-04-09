import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Map, Trash2, ChevronRight, Plus, GripVertical } from 'lucide-react'
import { useFloorPlans, useDeleteFloorPlan, getFloorPlanUrl } from '@/hooks/useFloorPlans'
import { Spinner, EmptyState, Card, Button } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { ConfirmModal } from '@/components/ui/Modal'
import { useUiStore } from '@/store/uiStore'
import { FloorPlanUploader } from '@/components/floor-plans/FloorPlanUploader'
import { FloorPlanViewer } from '@/components/floor-plans/FloorPlanViewer'

export default function FloorPlansPage() {
  const { id: inspectionId } = useParams<{ id: string }>()
  const addToast = useUiStore((s) => s.addToast)
  const deletePlan = useDeleteFloorPlan()

  const { data: plans, isLoading } = useFloorPlans(inspectionId)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; storagePath: string } | null>(null)

  async function handleDelete() {
    if (!inspectionId || !deleteTarget) return
    try {
      await deletePlan.mutateAsync({
        id: deleteTarget.id,
        inspectionId,
        storagePath: deleteTarget.storagePath,
      })
      addToast({ type: 'success', message: 'Plan usunięty' })
      setDeleteTarget(null)
      if (expandedId === deleteTarget.id) setExpandedId(null)
    } catch {
      addToast({ type: 'error', message: 'Błąd usuwania planu' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <InspectionNav />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Plany budynku</h1>
        <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
          <Plus size={16} />
          Dodaj plan
        </Button>
      </div>

      {/* Upload — toggle */}
      {showUpload && (
        <Card className="mb-4">
          <FloorPlanUploader
            inspectionId={inspectionId!}
            onUploaded={() => setShowUpload(false)}
          />
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" label="Ładowanie planów..." className="py-16" />
      ) : !plans?.length ? (
        <EmptyState
          icon={Map}
          title="Brak planów"
          description="Dodaj plan budynku aby móc oznaczać lokalizacje usterek"
          action={{
            label: 'Dodaj plan',
            onClick: () => setShowUpload(true),
          }}
        />
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const pinCount = (plan as any).pins?.length || 0
            const isExpanded = expandedId === plan.id

            return (
              <div key={plan.id}>
                {/* Thumbnail row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setExpandedId(isExpanded ? null : plan.id) }}
                  className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'border-primary-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <img
                    src={getFloorPlanUrl(plan.storage_path)}
                    alt={plan.label}
                    className="w-14 h-14 object-cover rounded-lg bg-gray-100 shrink-0"
                    loading="lazy"
                  />

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{plan.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pinCount > 0 ? `${pinCount} pinezek` : 'Brak pinezek'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget({
                          id: plan.id,
                          label: plan.label,
                          storagePath: plan.storage_path,
                        })
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight
                      size={16}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded viewer */}
                {isExpanded && (
                  <div className="mt-2 mb-2">
                    <FloorPlanViewer
                      storagePath={plan.storage_path}
                      inspectionId={inspectionId}
                      pins={(plan as any).pins || []}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Usuń plan"
        message={`Usunąć plan "${deleteTarget?.label}"? Wszystkie pinezki na tym planie zostaną usunięte.`}
        confirmLabel="Usuń"
        danger
        loading={deletePlan.isPending}
      />
    </div>
  )
}

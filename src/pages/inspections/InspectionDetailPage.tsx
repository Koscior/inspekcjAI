import { useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Edit3 } from 'lucide-react'
import { useInspection } from '@/hooks/useInspections'
import { INSPECTION_TYPES } from '@/config/constants'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Spinner } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import type { Inspection } from '@/types/database.types'

const CHECKLIST_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw']

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: inspection, isLoading, error } = useInspection(id)

  // Auto-redirect to first tab
  useEffect(() => {
    if (!inspection || !id) return
    const exactPath = buildPath(ROUTES.INSPECTION_DETAIL, { id })
    if (location.pathname !== exactPath) return

    const hasChecklist = CHECKLIST_TYPES.includes(inspection.type as Inspection['type'])
    const firstTab = hasChecklist
      ? buildPath(ROUTES.INSPECTION_CHECKLIST, { id })
      : buildPath(ROUTES.INSPECTION_DEFECTS, { id })

    navigate(firstTab, { replace: true })
  }, [inspection, id, location.pathname, navigate])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie inspekcji..." />
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono inspekcji</p>
        <button
          onClick={() => navigate(ROUTES.INSPECTIONS)}
          className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Dark inspection header */}
      <div className="bg-gray-800 text-white px-4 py-3 -mx-4 -mt-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.INSPECTIONS)}
            className="p-1.5 rounded-lg hover:bg-white/10 shrink-0"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{inspection.title}</h1>
            <p className="text-xs text-gray-300 truncate">
              {inspection.address}
              {' · '}
              {INSPECTION_TYPES[inspection.type as Inspection['type']]}
              {inspection.reference_number && ` · ${inspection.reference_number}`}
            </p>
          </div>
          <button
            onClick={() => navigate(buildPath(ROUTES.INSPECTION_EDIT, { id: id! }))}
            className="p-1.5 rounded-lg hover:bg-white/10 shrink-0"
          >
            <Edit3 size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Navigation tabs + photo button */}
      <InspectionNav />

      {/* Content area is empty — auto-redirect sends to first tab */}
    </div>
  )
}

import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ClipboardList, Bug, Map, FileText, Camera, BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useInspection } from '@/hooks/useInspections'
import type { Inspection } from '@/types/database.types'

const CHECKLIST_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'plac_zabaw']
const BUILDING_DOCS_TYPES: Inspection['type'][] = ['roczny', 'piecioletni']

/**
 * Sticky top navigation bar for inspection sub-pages.
 * Always visible on all inspection screens for quick switching on mobile.
 */
export function InspectionNav() {
  const { id, inspectionId } = useParams<{ id: string; inspectionId: string }>()
  const effectiveId = id || inspectionId || ''
  const location = useLocation()
  const navigate = useNavigate()

  const { data: inspection } = useInspection(effectiveId || undefined)
  const hasChecklist = inspection
    ? CHECKLIST_TYPES.includes(inspection.type as Inspection['type'])
    : false
  const hasBuildingDocs = inspection
    ? BUILDING_DOCS_TYPES.includes(inspection.type as Inspection['type'])
    : false

  const insp = inspection as typeof inspection & {
    defects?: { count: number }[]
    photos?: { count: number }[]
    floor_plans?: { count: number }[]
  }

  const defectCount = insp?.defects?.[0]?.count ?? 0
  const photoCount = insp?.photos?.[0]?.count ?? 0
  const planCount = insp?.floor_plans?.[0]?.count ?? 0

  const tabs = [
    ...(hasChecklist ? [{
      path: buildPath(ROUTES.INSPECTION_CHECKLIST, { id: effectiveId }),
      icon: ClipboardList,
      label: 'Checklist',
      count: 0,
    }] : []),
    {
      path: buildPath(ROUTES.INSPECTION_DEFECTS, { id: effectiveId }),
      icon: Bug,
      label: 'Usterki',
      count: defectCount,
    },
    {
      path: buildPath(ROUTES.INSPECTION_FLOORPLANS, { id: effectiveId }),
      icon: Map,
      label: 'Plany',
      count: planCount,
    },
    ...(hasBuildingDocs ? [{
      path: buildPath(ROUTES.INSPECTION_BUILDING_DOCS, { id: effectiveId }),
      icon: BookOpen,
      label: 'Dokumenty',
      count: 0,
    }] : []),
    {
      path: buildPath(ROUTES.INSPECTION_REPORT, { id: effectiveId }),
      icon: FileText,
      label: 'Raport',
      count: 0,
    },
  ]

  function isActive(tabPath: string) {
    return location.pathname.startsWith(tabPath)
  }

  return (
    <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 bg-gray-50">
      {/* Tab bar */}
      <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
                active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 active:scale-95',
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom photo strip */}
      <button
        onClick={() => navigate(buildPath(ROUTES.INSPECTION_PHOTOS, { id: effectiveId }))}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]',
          location.pathname.includes('/photos')
            ? 'bg-primary-700 text-white shadow-sm'
            : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
        )}
      >
        <Camera size={18} />
        Zdjęcia
        {photoCount > 0 && (
          <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {photoCount}
          </span>
        )}
      </button>
    </div>
  )
}

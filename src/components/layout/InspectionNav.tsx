import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ClipboardList, Bug, Map, FileText, Camera, BookOpen, PenTool, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef } from 'react'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useInspection } from '@/hooks/useInspections'
import { useChecklist, type ChecklistSection } from '@/hooks/useChecklist'
import { useUploadPhoto } from '@/hooks/usePhotos'
import { useUiStore } from '@/store/uiStore'
import type { Inspection } from '@/types/database.types'

const CHECKLIST_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw']
const BUILDING_DOCS_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw']
const FLOORPLAN_TYPES: Inspection['type'][] = ['odbior_mieszkania', 'ogolna']

/**
 * Sticky top navigation bar for inspection sub-pages.
 * Always visible on all inspection screens for quick switching on mobile.
 */
export function InspectionNav() {
  const { id, inspectionId: paramInspectionId } = useParams<{ id: string; inspectionId: string }>()
  const effectiveId = id || paramInspectionId || ''
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const { data: inspection } = useInspection(effectiveId || undefined)
  const hasChecklist = inspection
    ? CHECKLIST_TYPES.includes(inspection.type as Inspection['type'])
    : false
  const hasBuildingDocs = inspection
    ? BUILDING_DOCS_TYPES.includes(inspection.type as Inspection['type'])
    : false
  const hasFloorPlans = inspection
    ? FLOORPLAN_TYPES.includes(inspection.type as Inspection['type'])
    : false

  // Load checklist sections for category picker
  const { data: checklistSections } = useChecklist(
    hasChecklist ? effectiveId : undefined,
    hasChecklist ? (inspection?.type as Inspection['type']) : undefined,
  )

  const [showPicker, setShowPicker] = useState(false)
  const [selectedSection, setSelectedSection] = useState<ChecklistSection | null>(null)
  const [pendingMode, setPendingMode] = useState<'gallery' | 'camera' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<string | null>(null)
  const upload = useUploadPhoto()

  const insp = inspection as typeof inspection & {
    defects?: { count: number }[]
    photos?: { count: number }[]
    floor_plans?: { count: number }[]
  }

  const defectCount = insp?.defects?.[0]?.count ?? 0
  const planCount = insp?.floor_plans?.[0]?.count ?? 0

  const tabs = [
    ...(hasChecklist ? [{
      path: buildPath(ROUTES.INSPECTION_CHECKLIST, { id: effectiveId }),
      icon: ClipboardList,
      label: 'Checklist',
      count: 0,
    }] : []),
    ...(!hasChecklist ? [{
      path: buildPath(ROUTES.INSPECTION_DEFECTS, { id: effectiveId }),
      icon: Bug,
      label: 'Usterki',
      count: defectCount,
    }] : []),
    ...(hasFloorPlans ? [{
      path: buildPath(ROUTES.INSPECTION_FLOORPLANS, { id: effectiveId }),
      icon: Map,
      label: 'Plany',
      count: planCount,
    }] : []),
    ...(hasBuildingDocs ? [{
      path: buildPath(ROUTES.INSPECTION_BUILDING_DOCS, { id: effectiveId }),
      icon: BookOpen,
      label: 'Dokumenty',
      count: 0,
    }] : []),
    {
      path: buildPath(ROUTES.INSPECTION_SIGNATURE, { id: effectiveId }),
      icon: PenTool,
      label: 'Podpis',
      count: 0,
    },
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

  function handlePhotoBtnClick() {
    if (hasChecklist && checklistSections && checklistSections.length > 0) {
      setShowPicker(true)
      setSelectedSection(null)
    } else {
      navigate(buildPath(ROUTES.INSPECTION_PHOTOS, { id: effectiveId }))
    }
  }

  function handleItemSelect(itemId: string, mode: 'gallery' | 'camera') {
    selectedItemRef.current = itemId
    setPendingMode(mode)
    setShowPicker(false)
    // Trigger file input after modal closes
    setTimeout(() => {
      if (mode === 'gallery') fileRef.current?.click()
      else cameraRef.current?.click()
    }, 100)
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !selectedItemRef.current) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        addToast({ type: 'error', message: `${file.name} nie jest zdjęciem` })
        continue
      }
      try {
        await upload.mutateAsync({
          inspectionId: effectiveId,
          file,
          checklistItemId: selectedItemRef.current,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Błąd uploadu'
        addToast({ type: 'error', message: msg })
      }
    }

    addToast({ type: 'success', message: 'Zdjęcia dodane' })
    // Navigate to checklist with openItem so the section expands and scrolls to the item
    const itemId = selectedItemRef.current
    selectedItemRef.current = null
    setPendingMode(null)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''

    const checklistPath = buildPath(ROUTES.INSPECTION_CHECKLIST, { id: effectiveId })
    navigate(`${checklistPath}?openItem=${itemId}`)
  }

  return (
    <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 bg-gray-50">
      {/* Hidden file inputs for category photo upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

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
        onClick={handlePhotoBtnClick}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]',
          location.pathname.includes('/photos')
            ? 'bg-primary-700 text-white shadow-sm'
            : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
        )}
      >
        <Camera size={18} />
        Zdjęcia
      </button>

      {/* Category picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowPicker(false)}>
          <div
            className="bg-white w-full max-w-lg max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {selectedSection ? selectedSection.section : 'Wybierz kategorię'}
              </h3>
              <button
                onClick={() => {
                  if (selectedSection) setSelectedSection(null)
                  else setShowPicker(false)
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {selectedSection ? (
                  <span className="text-xs text-primary-600 font-medium">Wstecz</span>
                ) : (
                  <X size={18} />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {!selectedSection ? (
                // Step 1: Pick section (category)
                <div className="py-1">
                  {checklistSections?.map((section) => (
                    <button
                      key={section.section}
                      onClick={() => setSelectedSection(section)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-800">{section.section}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                // Step 2: Pick item (subcategory) then choose gallery/camera
                <div className="py-1">
                  {selectedSection.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm text-gray-800 mb-2">{item.element_name}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleItemSelect(item.id, 'gallery')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                        >
                          <Camera size={14} />
                          Dodaj zdjęcia
                        </button>
                        <button
                          onClick={() => handleItemSelect(item.id, 'camera')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-xs font-medium text-white transition-colors"
                        >
                          <Camera size={14} />
                          Aparat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

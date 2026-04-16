import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Camera, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef } from 'react'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useInspection } from '@/hooks/useInspections'
import { useChecklist, type ChecklistSection } from '@/hooks/useChecklist'
import { useUploadPhoto } from '@/hooks/usePhotos'
import { useUiStore } from '@/store/uiStore'
import { CameraCapture } from '@/components/photos/CameraCapture'
import type { Inspection } from '@/types/database.types'

const CHECKLIST_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw']

/**
 * 4 large tabs at the top + fixed "Zdjęcia" button at the bottom of screen.
 * Photo button hides on Raport and Więcej tabs.
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

  // Load checklist sections for category picker
  const { data: checklistSections } = useChecklist(
    hasChecklist ? effectiveId : undefined,
    hasChecklist ? (inspection?.type as Inspection['type']) : undefined,
  )

  const [showPicker, setShowPicker] = useState(false)
  const [selectedSection, setSelectedSection] = useState<ChecklistSection | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<string | null>(null)
  const upload = useUploadPhoto()

  // ─── Tab configuration ────────────────────────────────────────────────

  const reportPath = buildPath(ROUTES.INSPECTION_REPORT, { id: effectiveId })
  const morePath = buildPath(ROUTES.INSPECTION_MORE, { id: effectiveId })

  const tabs = hasChecklist
    ? [
        { path: buildPath(ROUTES.INSPECTION_CHECKLIST, { id: effectiveId }), label: 'Checklista' },
        { path: buildPath(ROUTES.INSPECTION_BUILDING_DOCS, { id: effectiveId }), label: 'Dokumenty' },
        { path: reportPath, label: 'Raport' },
        { path: morePath, label: 'Więcej' },
      ]
    : [
        { path: buildPath(ROUTES.INSPECTION_DEFECTS, { id: effectiveId }), label: 'Usterki' },
        { path: buildPath(ROUTES.INSPECTION_FLOORPLANS, { id: effectiveId }), label: 'Plany' },
        { path: reportPath, label: 'Raport' },
        { path: morePath, label: 'Więcej' },
      ]

  // Hide photo button on Raport and Więcej tabs
  const showPhotoButton = !location.pathname.startsWith(reportPath) && !location.pathname.startsWith(morePath)

  function isActive(tabPath: string) {
    return location.pathname.startsWith(tabPath)
  }

  // ─── Photo upload logic ───────────────────────────────────────────────

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
    setShowPicker(false)
    if (mode === 'gallery') {
      setTimeout(() => fileRef.current?.click(), 100)
    } else {
      setTimeout(() => setCameraOpen(true), 100)
    }
  }

  async function uploadOne(file: File) {
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: `${file.name} nie jest zdjęciem` })
      return false
    }
    try {
      await upload.mutateAsync({
        inspectionId: effectiveId,
        file,
        checklistItemId: selectedItemRef.current ?? undefined,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd uploadu'
      addToast({ type: 'error', message: msg })
      return false
    }
  }

  function finalizeItemUpload() {
    const itemId = selectedItemRef.current
    selectedItemRef.current = null
    if (!itemId) return
    const checklistPath = buildPath(ROUTES.INSPECTION_CHECKLIST, { id: effectiveId })
    navigate(`${checklistPath}?openItem=${itemId}`)
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !selectedItemRef.current) return
    let any = false
    for (const file of Array.from(files)) {
      if (await uploadOne(file)) any = true
    }
    if (any) addToast({ type: 'success', message: 'Zdjęcia dodane' })
    if (fileRef.current) fileRef.current.value = ''
    finalizeItemUpload()
  }

  async function handleCameraCapture(file: File) {
    if (!selectedItemRef.current) return
    const ok = await uploadOne(file)
    if (ok) addToast({ type: 'success', message: 'Zdjęcie dodane' })
    finalizeItemUpload()
  }

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 px-4 bg-gray-50">
        {/* Hidden file inputs for category photo upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {/* 4 Large Tabs */}
        <div className="grid grid-cols-4 gap-1 py-2">
          {tabs.map((tab) => {
            const active = isActive(tab.path)
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={clsx(
                  'py-3 rounded-lg text-sm font-bold text-center transition-all active:scale-[0.97]',
                  active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed bottom photo button — hidden on Raport and Więcej */}
      {showPhotoButton && (
        <button
          onClick={handlePhotoBtnClick}
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-2 py-4 text-base font-semibold transition-all active:scale-[0.98]',
            location.pathname.includes('/photos')
              ? 'bg-primary-700 text-white shadow-lg'
              : 'bg-primary-600 text-white shadow-lg hover:bg-primary-700',
          )}
        >
          <Camera size={22} />
          Zdjęcia
        </button>
      )}

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

      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => {
          setCameraOpen(false)
          if (selectedItemRef.current) selectedItemRef.current = null
        }}
        onCapture={handleCameraCapture}
      />
    </>
  )
}

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ZoomIn, ZoomOut, Maximize, ExternalLink } from 'lucide-react'
import { getFloorPlanUrl } from '@/hooks/useFloorPlans'
import { DEFECT_SEVERITY } from '@/config/constants'
import { ROUTES, buildPath } from '@/router/routePaths'

export interface PinData {
  id: string
  defect_id: string | null
  x_percent: number
  y_percent: number
  label_number: number
  defects?: {
    id: string
    title: string
    severity: 'critical' | 'serious' | 'minor'
    category: string | null
    number: number
  } | null
}

interface PreviewPin {
  x_percent: number
  y_percent: number
  label_number: number
}

interface FloorPlanViewerProps {
  storagePath: string
  inspectionId?: string
  pins?: PinData[]
  mode?: 'view' | 'pick'
  showPinList?: boolean
  previewPin?: PreviewPin | null
  onPinClick?: (pin: PinData) => void
  onLocationPick?: (xPercent: number, yPercent: number) => void
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500 border-red-700',
  serious: 'bg-orange-500 border-orange-700',
  minor: 'bg-yellow-400 border-yellow-600',
}

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  serious: 'bg-orange-500',
  minor: 'bg-yellow-400',
}

export function FloorPlanViewer({
  storagePath,
  inspectionId,
  pins = [],
  mode = 'view',
  showPinList = true,
  previewPin,
  onPinClick,
  onLocationPick,
}: FloorPlanViewerProps) {
  const navigate = useNavigate()
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null)
  const imageUrl = getFloorPlanUrl(storagePath)

  const defectPins = pins.filter((p) => p.defects)

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== 'pick' || !onLocationPick) return

      const rect = e.currentTarget.getBoundingClientRect()
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100

      onLocationPick(
        Math.round(xPercent * 100) / 100,
        Math.round(yPercent * 100) / 100,
      )
    },
    [mode, onLocationPick],
  )

  function handleNavigateToDefect(defectId: string) {
    if (!inspectionId) return
    navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, {
      id: inspectionId,
      defectId,
    }))
  }

  return (
    <div>
      {/* Map */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          panning={{ disabled: mode === 'pick' }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                <button
                  onClick={() => zoomIn()}
                  className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                >
                  <Maximize size={16} />
                </button>
              </div>

              {mode === 'pick' && (
                <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                  Kliknij na planie aby wybrać lokalizację
                </div>
              )}

              <TransformComponent
                wrapperStyle={{ width: '100%', minHeight: '300px' }}
                contentStyle={{ width: '100%' }}
              >
                <div className="relative inline-block" onClick={handleImageClick}>
                  <img
                    src={imageUrl}
                    alt="Plan budynku"
                    className="max-w-full"
                    draggable={false}
                  />

                  {/* Pins overlay */}
                  {pins.map((pin) => (
                    <button
                      key={pin.id}
                      className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white shadow-md transition-transform hover:scale-125 ${
                        selectedPin?.id === pin.id ? 'scale-125 ring-2 ring-white' : ''
                      } ${
                        pin.defects
                          ? severityColors[pin.defects.severity] || 'bg-gray-500 border-gray-700'
                          : 'bg-primary-500 border-primary-700'
                      }`}
                      style={{
                        left: `${pin.x_percent}%`,
                        top: `${pin.y_percent}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPin(selectedPin?.id === pin.id ? null : pin)
                        onPinClick?.(pin)
                      }}
                    >
                      {pin.label_number}
                    </button>
                  ))}

                  {/* Preview pin (for pick mode) */}
                  {previewPin && (
                    <div
                      className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-primary-500 border-primary-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce pointer-events-none"
                      style={{
                        left: `${previewPin.x_percent}%`,
                        top: `${previewPin.y_percent}%`,
                      }}
                    >
                      {previewPin.label_number}
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Pin detail popup */}
        {selectedPin?.defects && (
          <div className="absolute bottom-2 left-2 right-2 z-10 bg-white rounded-lg shadow-lg border p-3">
            <div className="flex items-start justify-between">
              <div
                className={inspectionId ? 'cursor-pointer' : ''}
                onClick={() => selectedPin.defects && inspectionId && handleNavigateToDefect(selectedPin.defects.id)}
              >
                <p className="text-sm font-semibold text-gray-900">
                  #{selectedPin.defects.number} {selectedPin.defects.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedPin.defects.category}
                  <span className="mx-1">·</span>
                  {DEFECT_SEVERITY[selectedPin.defects.severity]?.label}
                </p>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-gray-400 hover:text-gray-600 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pin list below map */}
      {showPinList && defectPins.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Pinezki ({defectPins.length})
          </p>
          {defectPins.map((pin) => (
            <button
              key={pin.id}
              onClick={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                selectedPin?.id === pin.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Number badge */}
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${
                pin.defects ? severityDot[pin.defects.severity] || 'bg-gray-400' : 'bg-gray-400'
              }`}>
                {pin.label_number}
              </span>

              {/* Defect info */}
              <span className="flex-1 min-w-0 truncate text-gray-700">
                {pin.defects ? `#${pin.defects.number} ${pin.defects.title}` : `Pinezka ${pin.label_number}`}
              </span>

              {/* Navigate */}
              {pin.defects && inspectionId && (
                <ExternalLink
                  size={12}
                  className="text-gray-300 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNavigateToDefect(pin.defects!.id)
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

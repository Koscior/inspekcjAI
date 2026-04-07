import { useRef, useEffect, useState, useCallback } from 'react'

interface SignaturePadProps {
  onSave: (blob: Blob) => void
  existingUrl?: string | null
  label: string
  onClear?: () => void
  height?: number
}

export function SignaturePad({ onSave, existingUrl, label, onClear, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [showExisting, setShowExisting] = useState(!!existingUrl)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || showExisting) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match display size (for retina)
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw guide line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    const lineY = rect.height * 0.75
    ctx.beginPath()
    ctx.moveTo(20, lineY)
    ctx.lineTo(rect.width - 20, lineY)
    ctx.stroke()
    ctx.setLineDash([])

    // Drawing style
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [showExisting])

  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()

    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPosition(e)
    if (!pos) return
    setIsDrawing(true)
    lastPos.current = pos
  }, [getPosition])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !lastPos.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const pos = getPosition(e)
    if (!pos) return

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastPos.current = pos
    if (!hasStrokes) setHasStrokes(true)
  }, [isDrawing, getPosition, hasStrokes])

  const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(false)
    lastPos.current = null
  }, [])

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Re-draw guide line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    const lineY = rect.height * 0.75
    ctx.beginPath()
    ctx.moveTo(20, lineY)
    ctx.lineTo(rect.width - 20, lineY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    setHasStrokes(false)
  }, [])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes) return

    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }, [hasStrokes, onSave])

  const handleRemoveExisting = useCallback(() => {
    setShowExisting(false)
    onClear?.()
  }, [onClear])

  // Show existing signature
  if (showExisting && existingUrl) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="border border-gray-200 rounded-xl bg-white p-4">
          <div className="flex items-center justify-center mb-3">
            <img
              src={existingUrl}
              alt={label}
              className="max-h-32 object-contain"
            />
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleRemoveExisting}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Zmień podpis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, touchAction: 'none' }}
          className="cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">
            {hasStrokes ? 'Podpis narysowany' : 'Narysuj podpis powyżej'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasStrokes}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Wyczyść
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasStrokes}
              className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Zatwierdź
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

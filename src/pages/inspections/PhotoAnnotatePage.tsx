import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Undo2, Redo2, Save, Palette, Type, Trash2 } from 'lucide-react'
import { usePhoto, useUpdatePhoto, getPhotoUrl } from '@/hooks/usePhotos'
import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Button, Spinner, Modal, Textarea } from '@/components/ui'

const COLORS = ['#FF0000', '#00FF00', '#0066FF', '#FFFF00', '#FF6600', '#FFFFFF', '#000000']
const STROKE_WIDTHS = [2, 4, 6]

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  width: number
}

interface TextAnnotation {
  x: number
  y: number
  text: string
  color: string
  size: number
}

export default function PhotoAnnotatePage() {
  const { inspectionId, photoId } = useParams<{ inspectionId: string; photoId: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const updatePhoto = useUpdatePhoto()

  const { data: photo, isLoading } = usePhoto(photoId)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([])
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [redoTexts, setRedoTexts] = useState<TextAnnotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [color, setColor] = useState('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [mode, setMode] = useState<'draw' | 'text'>('draw')
  const [saving, setSaving] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [textModalOpen, setTextModalOpen] = useState(false)
  const [pendingTextCoords, setPendingTextCoords] = useState<{ x: number; y: number } | null>(null)
  const [pendingText, setPendingText] = useState('')

  // Load existing annotations from ai_analysis
  useEffect(() => {
    if (!photo) return
    const data = photo.ai_analysis as any
    if (data?.annotations?.strokes) {
      setStrokes(data.annotations.strokes)
    }
    if (data?.annotations?.textAnnotations) {
      setTextAnnotations(data.annotations.textAnnotations)
    }
  }, [photo])

  // Load image as blob to avoid CORS canvas taint
  useEffect(() => {
    if (!photo) return
    let cancelled = false

    async function loadImage() {
      try {
        const url = getPhotoUrl(photo!.original_path)
        const resp = await fetch(url)
        const blob = await resp.blob()
        if (cancelled) return

        const blobUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          if (cancelled) { URL.revokeObjectURL(blobUrl); return }
          imageRef.current = img
          setImageLoaded(true)
        }
        img.src = blobUrl
      } catch (err) {
        if (!cancelled) addToast({ type: 'error', message: 'Nie udało się załadować zdjęcia' })
      }
    }

    loadImage()
    return () => { cancelled = true }
  }, [photo, addToast])

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')!
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // Draw image
    ctx.drawImage(img, 0, 0)

    // Draw completed strokes
    for (const stroke of strokes) {
      drawStroke(ctx, stroke)
    }

    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke)
    }

    // Draw text annotations
    for (const ta of textAnnotations) {
      ctx.font = `bold ${ta.size}px Arial`
      ctx.fillStyle = ta.color
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.strokeText(ta.text, ta.x, ta.y)
      ctx.fillText(ta.text, ta.x, ta.y)
    }
  }, [strokes, currentStroke, textAnnotations])

  useEffect(() => {
    if (imageLoaded) render()
  }, [imageLoaded, render])

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return
    ctx.beginPath()
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
  }

  function getCanvasCoords(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function handleTextConfirm() {
    if (pendingText.trim() && pendingTextCoords) {
      setTextAnnotations((prev) => [...prev, {
        x: pendingTextCoords.x,
        y: pendingTextCoords.y,
        text: pendingText.trim(),
        color,
        size: strokeWidth * 8,
      }])
      render()
    }
    setTextModalOpen(false)
    setPendingTextCoords(null)
    setPendingText('')
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (mode === 'text') {
      const coords = getCanvasCoords(e)
      setPendingTextCoords(coords)
      setPendingText('')
      setTextModalOpen(true)
      return
    }

    setIsDrawing(true)
    const coords = getCanvasCoords(e)
    setCurrentStroke({ points: [coords], color, width: strokeWidth })
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !currentStroke) return
    const coords = getCanvasCoords(e)
    setCurrentStroke((prev) => prev ? {
      ...prev,
      points: [...prev.points, coords],
    } : null)
    render()
  }

  function handlePointerUp() {
    if (!isDrawing || !currentStroke) return
    setIsDrawing(false)
    setStrokes((prev) => [...prev, currentStroke])
    setRedoStrokes([]) // clear redo on new stroke
    setCurrentStroke(null)
  }

  function handleUndo() {
    if (strokes.length > 0) {
      const last = strokes[strokes.length - 1]
      setStrokes((prev) => prev.slice(0, -1))
      setRedoStrokes((prev) => [...prev, last])
    } else if (textAnnotations.length > 0) {
      const last = textAnnotations[textAnnotations.length - 1]
      setTextAnnotations((prev) => prev.slice(0, -1))
      setRedoTexts((prev) => [...prev, last])
    }
    requestAnimationFrame(render)
  }

  function handleRedo() {
    if (redoStrokes.length > 0) {
      const next = redoStrokes[redoStrokes.length - 1]
      setRedoStrokes((prev) => prev.slice(0, -1))
      setStrokes((prev) => [...prev, next])
    } else if (redoTexts.length > 0) {
      const next = redoTexts[redoTexts.length - 1]
      setRedoTexts((prev) => prev.slice(0, -1))
      setTextAnnotations((prev) => [...prev, next])
    }
    requestAnimationFrame(render)
  }

  function handleClear() {
    setRedoStrokes([...strokes, ...redoStrokes])
    setStrokes([])
    setTextAnnotations([])
    requestAnimationFrame(render)
  }

  async function handleSave() {
    const canvas = canvasRef.current
    if (!canvas || !photo || !user || !inspectionId) return

    setSaving(true)
    try {
      // Resize canvas to max 2048px if needed, then export as WebP
      const MAX = 2048
      let sourceCanvas = canvas
      if (canvas.width > MAX || canvas.height > MAX) {
        const ratio = Math.min(MAX / canvas.width, MAX / canvas.height)
        const resized = document.createElement('canvas')
        resized.width  = Math.round(canvas.width  * ratio)
        resized.height = Math.round(canvas.height * ratio)
        resized.getContext('2d')!.drawImage(canvas, 0, 0, resized.width, resized.height)
        sourceCanvas = resized
      }
      const blob = await new Promise<Blob>((resolve) => {
        sourceCanvas.toBlob((b) => resolve(b!), 'image/webp', 0.85)
      })

      // Remove old annotated image if exists
      if (photo.annotated_path) {
        await supabase.storage.from(STORAGE_BUCKETS.photos).remove([photo.annotated_path])
      }

      // Upload with unique name to bust browser cache
      const ts = Date.now()
      const annotatedPath = `${user.id}/${inspectionId}/annotated_${photo.id}_${ts}.webp`
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKETS.photos)
        .upload(annotatedPath, blob, { contentType: 'image/webp' })
      if (uploadErr) throw uploadErr

      // Save annotations JSON in ai_analysis + annotated_path to DB
      const annotationsData = {
        annotations: {
          version: 1,
          strokes,
          textAnnotations,
        },
      }

      await updatePhoto.mutateAsync({
        id: photo.id,
        inspectionId,
        updates: {
          annotated_path: annotatedPath,
          ai_analysis: annotationsData,
        },
      })

      addToast({ type: 'success', message: 'Annotacje zapisane' })
      navigate(-1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd zapisu'
      addToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !photo) {
    return <Spinner size="lg" label="Ładowanie zdjęcia..." className="py-16" />
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-700 rounded">
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          {/* Mode */}
          <button
            onClick={() => setMode('draw')}
            className={`p-1.5 rounded ${mode === 'draw' ? 'bg-primary-600' : 'hover:bg-gray-700'}`}
            title="Rysowanie"
          >
            <Palette size={18} />
          </button>
          <button
            onClick={() => setMode('text')}
            className={`p-1.5 rounded ${mode === 'text' ? 'bg-primary-600' : 'hover:bg-gray-700'}`}
            title="Tekst"
          >
            <Type size={18} />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Colors */}
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c ? 'border-white scale-110' : 'border-gray-600'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Stroke width */}
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`p-1.5 rounded ${strokeWidth === w ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: w * 2 + 4, height: w * 2 + 4 }}
              />
            </button>
          ))}

          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Actions */}
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0 && textAnnotations.length === 0}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40"
            title="Cofnij"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStrokes.length === 0 && redoTexts.length === 0}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-40"
            title="Przywróć"
          >
            <Redo2 size={18} />
          </button>
          <button onClick={handleClear} className="p-1.5 hover:bg-gray-700 rounded text-red-400" title="Wyczyść">
            <Trash2 size={18} />
          </button>
        </div>

        <Button size="sm" onClick={handleSave} loading={saving}>
          <Save size={16} />
          Zapisz
        </Button>
      </div>

      {/* Canvas — object-contain behavior via CSS */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
        {!imageLoaded ? (
          <Spinner label="Ładowanie obrazu..." />
        ) : (
          <canvas
            ref={canvasRef}
            className="touch-none max-w-full max-h-full"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        )}
      </div>

      <Modal
        isOpen={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        title="Wpisz tekst adnotacji"
      >
        <Textarea
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          placeholder="Tekst adnotacji..."
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleTextConfirm()
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setTextModalOpen(false)}>
            Anuluj
          </Button>
          <Button onClick={handleTextConfirm} disabled={!pendingText.trim()}>
            Dodaj
          </Button>
        </div>
      </Modal>
    </div>
  )
}

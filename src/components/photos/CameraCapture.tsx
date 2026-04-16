import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, RotateCcw, Check, X, SwitchCamera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  multiple?: boolean
}

type FacingMode = 'environment' | 'user'

export function CameraCapture({ isOpen, onClose, onCapture, multiple = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<FacingMode>('environment')
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startStream = useCallback(async (mode: FacingMode) => {
    setError(null)
    setStarting(true)
    stopStream()

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Twoja przeglądarka nie obsługuje dostępu do kamery. Wymagane jest HTTPS oraz nowoczesna przeglądarka.')
      setStarting(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cams = devices.filter((d) => d.kind === 'videoinput')
        setHasMultipleCameras(cams.length > 1)
      } catch {
        setHasMultipleCameras(false)
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Brak uprawnień do kamery. Zezwól na dostęp w ustawieniach przeglądarki i spróbuj ponownie.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('Nie znaleziono kamery. Podłącz urządzenie z kamerą lub użyj opcji wgrania zdjęcia.')
      } else if (name === 'NotReadableError') {
        setError('Kamera jest używana przez inną aplikację. Zamknij ją i spróbuj ponownie.')
      } else {
        setError('Nie udało się uruchomić kamery. Spróbuj ponownie lub użyj opcji wgrania zdjęcia.')
      }
    } finally {
      setStarting(false)
    }
  }, [stopStream])

  useEffect(() => {
    if (!isOpen) {
      stopStream()
      setPreview(null)
      setError(null)
      return
    }
    startStream(facing)
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  function handleSwitchCamera() {
    const next: FacingMode = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    startStream(next)
  }

  async function handleCapture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
    )
    if (!blob) return

    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

    if (multiple) {
      onCapture(file)
    } else {
      const url = URL.createObjectURL(blob)
      setPreview({ url, file })
    }
  }

  function handleAccept() {
    if (!preview) return
    onCapture(preview.file)
    URL.revokeObjectURL(preview.url)
    setPreview(null)
    onClose()
  }

  function handleRetake() {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function handleClose() {
    stopStream()
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Zamknij"
        >
          <X size={24} />
        </button>
        <span className="text-sm font-medium">
          {preview ? 'Podgląd zdjęcia' : 'Aparat'}
        </span>
        {!preview && hasMultipleCameras ? (
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Przełącz kamerę"
          >
            <SwitchCamera size={22} />
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="px-6 max-w-md text-center text-white">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-sm text-gray-200 mb-4">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => startStream(facing)}>
              Spróbuj ponownie
            </Button>
          </div>
        ) : preview ? (
          <img src={preview.url} alt="Podgląd" className="max-h-full max-w-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="max-h-full max-w-full object-contain"
            />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                Uruchamianie kamery...
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-6 flex items-center justify-center gap-8 bg-black">
        {preview ? (
          <>
            <button
              type="button"
              onClick={handleRetake}
              className="flex flex-col items-center gap-1 text-white"
              aria-label="Zrób ponownie"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <RotateCcw size={24} />
              </div>
              <span className="text-xs">Ponów</span>
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex flex-col items-center gap-1 text-white"
              aria-label="Użyj zdjęcia"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                <Check size={28} />
              </div>
              <span className="text-xs">Użyj</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleCapture}
            disabled={!!error || starting}
            className="w-18 h-18 rounded-full border-4 border-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Zrób zdjęcie"
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
              <Camera size={24} className="text-black" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

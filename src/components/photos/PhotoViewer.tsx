import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Pencil, Sparkles } from 'lucide-react'
import { getPhotoUrl } from '@/hooks/usePhotos'
import type { Photo } from '@/types/database.types'

interface PhotoViewerProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onAnnotate?: (photo: Photo) => void
  onAiAnalyze?: (photo: Photo) => void
}

export function PhotoViewer({ photos, initialIndex, onClose, onAnnotate, onAiAnalyze }: PhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const photo = photos[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, photos.length])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!photo) return null

  const url = photo.annotated_path
    ? getPhotoUrl(photo.annotated_path)
    : getPhotoUrl(photo.original_path)

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          Fot. {photo.photo_number} ({index + 1}/{photos.length})
        </span>
        <div className="flex items-center gap-2">
          {onAiAnalyze && (
            <button
              onClick={() => onAiAnalyze(photo)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Analiza AI"
            >
              <Sparkles size={20} />
            </button>
          )}
          {onAnnotate && (
            <button
              onClick={() => onAnnotate(photo)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Annotuj"
            >
              <Pencil size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <img
          src={url}
          alt={photo.caption || `Fot. ${photo.photo_number}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Nav arrows */}
        {index > 0 && (
          <button
            onClick={() => setIndex(index - 1)}
            className="absolute left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={() => setIndex(index + 1)}
            className="absolute right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="text-center text-white/80 text-sm py-2">
          {photo.caption}
        </div>
      )}
    </div>
  )
}

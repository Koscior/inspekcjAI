import { useEffect, useRef, useCallback, useState } from 'react'
import { Trash2, Sparkles, Pencil } from 'lucide-react'
import { getPhotoUrl } from '@/hooks/usePhotos'
import type { Photo } from '@/types/database.types'

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo) => void
  onDelete?: (photo: Photo) => void
  onAiAnalyze?: (photo: Photo) => void
  columns?: 3 | 4 | 5
  highlightedPhotoId?: string | null
  onHighlightDone?: () => void
}

export function PhotoGrid({ photos, onPhotoClick, onDelete, onAiAnalyze, columns = 3, highlightedPhotoId, onHighlightDone }: PhotoGridProps) {
  const highlightRef = useRef<HTMLDivElement>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedPhotoId) return
    setFlashId(highlightedPhotoId)

    // Wait for React to render the element, then scroll
    const scrollTimer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)

    const clearTimer = setTimeout(() => {
      setFlashId(null)
      onHighlightDone?.()
    }, 2500)

    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(clearTimer)
    }
  }, [highlightedPhotoId, onHighlightDone])

  if (photos.length === 0) return null

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-3 sm:grid-cols-4',
    5: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-2`}>
      {photos.map((photo) => {
        const url = photo.annotated_path
          ? getPhotoUrl(photo.annotated_path)
          : photo.thumbnail_path
            ? getPhotoUrl(photo.thumbnail_path)
            : getPhotoUrl(photo.original_path)

        const isHighlighted = flashId === photo.id

        return (
          <div
            key={photo.id}
            ref={photo.id === highlightedPhotoId ? highlightRef : undefined}
            className={`relative group aspect-square rounded-lg transition-all duration-500 ${
              isHighlighted ? 'ring-3 ring-primary-500 ring-offset-2 scale-105' : ''
            }`}
          >
            <img
              src={url}
              alt={photo.caption || `Fot. ${photo.photo_number}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer"
              onClick={() => onPhotoClick?.(photo)}
              loading={photo.id === highlightedPhotoId ? 'eager' : 'lazy'}
            />
            <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
              {photo.annotated_path && <Pencil size={8} />}
              Fot. {photo.photo_number}
            </span>
            {onAiAnalyze && (
              <button
                onClick={(e) => { e.stopPropagation(); onAiAnalyze(photo) }}
                className="absolute top-1 left-1 p-1 bg-purple-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="AI analiza"
              >
                <Sparkles size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(photo) }}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

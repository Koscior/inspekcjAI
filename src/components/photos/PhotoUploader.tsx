import { useRef } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUploadPhoto } from '@/hooks/usePhotos'
import { useUiStore } from '@/store/uiStore'

interface PhotoUploaderProps {
  inspectionId: string
  defectId?: string
  checklistItemId?: string
  onUploaded?: (lastPhotoId: string) => void
}

export function PhotoUploader({ inspectionId, defectId, checklistItemId, onUploaded }: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const upload = useUploadPhoto()
  const addToast = useUiStore((s) => s.addToast)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return

    let lastPhotoId: string | undefined
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        addToast({ type: 'error', message: `${file.name} nie jest zdjęciem` })
        continue
      }

      try {
        const photo = await upload.mutateAsync({
          inspectionId,
          file,
          defectId,
          checklistItemId,
        })
        lastPhotoId = photo.id
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Błąd uploadu'
        addToast({ type: 'error', message: msg })
      }
    }

    if (lastPhotoId) onUploaded?.(lastPhotoId)
    // Reset inputs
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <div className="flex gap-2">
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

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
      >
        {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Dodaj zdjęcia
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => cameraRef.current?.click()}
        disabled={upload.isPending}
      >
        <Camera size={16} />
        Aparat
      </Button>
    </div>
  )
}

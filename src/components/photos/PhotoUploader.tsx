import { useRef, useState } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUploadPhoto } from '@/hooks/usePhotos'
import { useUiStore } from '@/store/uiStore'
import { CameraCapture } from './CameraCapture'

interface PhotoUploaderProps {
  inspectionId: string
  defectId?: string
  checklistItemId?: string
  onUploaded?: (lastPhotoId: string) => void
}

export function PhotoUploader({ inspectionId, defectId, checklistItemId, onUploaded }: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadPhoto()
  const addToast = useUiStore((s) => s.addToast)
  const [cameraOpen, setCameraOpen] = useState(false)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: `${file.name} nie jest zdjęciem` })
      return undefined
    }
    try {
      const photo = await upload.mutateAsync({
        inspectionId,
        file,
        defectId,
        checklistItemId,
      })
      return photo.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd uploadu'
      addToast({ type: 'error', message: msg })
      return undefined
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    let lastPhotoId: string | undefined
    for (const file of Array.from(files)) {
      const id = await uploadFile(file)
      if (id) lastPhotoId = id
    }
    if (lastPhotoId) onUploaded?.(lastPhotoId)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleCameraCapture(file: File) {
    const id = await uploadFile(file)
    if (id) onUploaded?.(id)
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
        onClick={() => setCameraOpen(true)}
        disabled={upload.isPending}
      >
        <Camera size={16} />
        Aparat
      </Button>

      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}

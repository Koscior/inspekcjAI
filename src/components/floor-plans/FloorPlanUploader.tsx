import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useUploadFloorPlan } from '@/hooks/useFloorPlans'
import { useUiStore } from '@/store/uiStore'

interface FloorPlanUploaderProps {
  inspectionId: string
  onUploaded?: () => void
}

export function FloorPlanUploader({ inspectionId, onUploaded }: FloorPlanUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const upload = useUploadFloorPlan()
  const addToast = useUiStore((s) => s.addToast)

  async function handleUpload() {
    if (!file || !label.trim()) return

    try {
      await upload.mutateAsync({
        inspectionId,
        file,
        label: label.trim(),
      })
      addToast({ type: 'success', message: 'Plan dodany' })
      setFile(null)
      setLabel('')
      if (fileRef.current) fileRef.current.value = ''
      onUploaded?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd uploadu'
      addToast({ type: 'error', message: msg })
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
        }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
        >
          <Upload size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Kliknij aby wybrać plan budynku</p>
          <p className="text-xs text-gray-400 mt-1">JPG lub PNG</p>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={URL.createObjectURL(file)}
              alt="Podgląd"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setFile(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
            >
              Usuń
            </Button>
          </div>

          <Input
            label="Etykieta planu"
            placeholder="np. Parter, Piętro 1, Dach"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />

          <Button
            type="button"
            onClick={handleUpload}
            loading={upload.isPending}
            disabled={!label.trim()}
            className="w-full"
          >
            {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Dodaj plan
          </Button>
        </div>
      )}
    </div>
  )
}

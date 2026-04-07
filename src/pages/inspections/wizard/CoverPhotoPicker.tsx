import { useRef, useEffect, useState } from 'react'
import { Camera, Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui'

interface CoverPhotoPickerProps {
  file: File | null
  previewUrl: string | null
  onChange: (file: File | null) => void
}

export function CoverPhotoPicker({ file, previewUrl, onChange }: CoverPhotoPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  // Create/revoke object URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setObjectUrl(null)
  }, [file])

  const displayUrl = objectUrl || previewUrl

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f && f.type.startsWith('image/')) {
      onChange(f)
    }
    e.target.value = ''
  }

  function handleRemove() {
    onChange(null)
  }

  if (displayUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <img
          src={displayUrl}
          alt="Zdjęcie okładkowe"
          className="w-full h-48 object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
        >
          <X size={16} className="text-gray-600" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-2.5 py-1 text-xs font-medium bg-white/90 rounded shadow hover:bg-white transition-colors text-gray-700"
          >
            Zmień
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="px-2.5 py-1 text-xs font-medium bg-white/90 rounded shadow hover:bg-white transition-colors text-gray-700"
          >
            <Camera size={12} className="inline mr-1" />
            Aparat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
          <ImageIcon size={24} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 text-center">
          Dodaj zdjęcie budynku na okładkę raportu
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={16} />
            Wybierz plik
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => cameraRef.current?.click()}>
            <Camera size={16} />
            Aparat
          </Button>
        </div>
      </div>
    </div>
  )
}

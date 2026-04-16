import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { Modal, Button, Spinner, Textarea } from '@/components/ui'
import { pl } from '@/i18n/pl'

interface AiAnalysisModalProps {
  isOpen: boolean
  loading: boolean
  error: string | null
  aiText: string | null
  existingText: string
  onClose: () => void
  onReplace: (text: string) => void
  onAppend: (text: string) => void
}

export function AiAnalysisModal({
  isOpen,
  loading,
  error,
  aiText,
  existingText,
  onClose,
  onReplace,
  onAppend,
}: AiAnalysisModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pl.photos.aiAnalysisTitle} size="xl">
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">{pl.photos.aiAnalysisHint}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-10">
            <Spinner />
            <span className="text-sm text-gray-600">{pl.photos.aiAnalysisLoading}</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && aiText !== null && (
          <AiEditor
            initialText={aiText}
            existingText={existingText}
            onCancel={onClose}
            onReplace={onReplace}
            onAppend={onAppend}
          />
        )}

        {(loading || error) && (
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>
              {pl.photos.aiCancel}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

interface AiEditorProps {
  initialText: string
  existingText: string
  onCancel: () => void
  onReplace: (text: string) => void
  onAppend: (text: string) => void
}

function AiEditor({ initialText, existingText, onCancel, onReplace, onAppend }: AiEditorProps) {
  const [draft, setDraft] = useState(initialText)
  const hasExisting = existingText.trim().length > 0
  const canApply = draft.trim().length > 0

  return (
    <>
      {hasExisting && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {pl.photos.aiExistingHeader}
          </label>
          <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
            {existingText}
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {pl.photos.aiResultHeader}
        </label>
        <Textarea
          rows={6}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          {pl.photos.aiCancel}
        </Button>
        {hasExisting && (
          <Button
            variant="secondary"
            disabled={!canApply}
            onClick={() => onAppend(draft.trim())}
          >
            {pl.photos.aiAppend}
          </Button>
        )}
        <Button disabled={!canApply} onClick={() => onReplace(draft.trim())}>
          {pl.photos.aiReplace}
        </Button>
      </div>
    </>
  )
}

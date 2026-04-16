import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAnalyzePhoto, type PhotoAnalysisContext } from '@/hooks/useVoiceNotes'
import { useUpdateDefect } from '@/hooks/useDefects'
import { useUpdateChecklistItem } from '@/hooks/useChecklist'
import { useUpdatePhoto } from '@/hooks/usePhotos'
import { useUiStore } from '@/store/uiStore'
import type { Photo } from '@/types/database.types'
import { pl } from '@/i18n/pl'

interface UseAiPhotoAnalysisOptions {
  inspectionId: string
}

interface AnalysisState {
  open: boolean
  loading: boolean
  photo: Photo | null
  aiText: string | null
  error: string | null
  existingText: string
}

const initialState: AnalysisState = {
  open: false,
  loading: false,
  photo: null,
  aiText: null,
  error: null,
  existingText: '',
}

async function fetchExistingText(photo: Photo): Promise<string> {
  if (photo.defect_id) {
    const { data } = await supabase
      .from('defects')
      .select('description')
      .eq('id', photo.defect_id)
      .single()
    const row = data as { description: string | null } | null
    return row?.description ?? ''
  }
  if (photo.checklist_item_id) {
    const { data } = await supabase
      .from('checklist_items')
      .select('notes')
      .eq('id', photo.checklist_item_id)
      .single()
    const row = data as { notes: string | null } | null
    return row?.notes ?? ''
  }
  return photo.caption ?? ''
}

export function useAiPhotoAnalysis({ inspectionId }: UseAiPhotoAnalysisOptions) {
  const [state, setState] = useState<AnalysisState>(initialState)
  const addToast = useUiStore((s) => s.addToast)

  const analyzePhoto = useAnalyzePhoto()
  const updateDefect = useUpdateDefect()
  const updateChecklistItem = useUpdateChecklistItem()
  const updatePhoto = useUpdatePhoto()

  // Reset on unmount
  useEffect(() => () => setState(initialState), [])

  const trigger = useCallback(
    async (photo: Photo) => {
      const context: PhotoAnalysisContext = photo.defect_id
        ? 'defect'
        : photo.checklist_item_id
          ? 'checklist'
          : 'general'

      setState({
        open: true,
        loading: true,
        photo,
        aiText: null,
        error: null,
        existingText: '',
      })

      // Load existing text in parallel with analysis
      fetchExistingText(photo).then((text) => {
        setState((s) => (s.photo?.id === photo.id ? { ...s, existingText: text } : s))
      }).catch(() => {
        // Non-fatal — proceed without existing text
      })

      analyzePhoto.mutate(
        { photo, context },
        {
          onSuccess: (description) => {
            setState((s) => (s.photo?.id === photo.id ? { ...s, loading: false, aiText: description } : s))
          },
          onError: (err) => {
            const message = err instanceof Error ? err.message : pl.photos.aiError
            setState((s) => (s.photo?.id === photo.id ? { ...s, loading: false, error: message } : s))
          },
        },
      )
    },
    [analyzePhoto],
  )

  const close = useCallback(() => {
    setState(initialState)
  }, [])

  const applyToTarget = useCallback(
    async (text: string, mode: 'replace' | 'append') => {
      if (!state.photo) return
      const current = state.existingText || ''
      const nextText =
        mode === 'append' && current.trim().length > 0
          ? `${current.trim()}\n\n${text.trim()}`
          : text.trim()

      try {
        if (state.photo.defect_id) {
          await updateDefect.mutateAsync({
            id: state.photo.defect_id,
            inspectionId,
            updates: { description: nextText },
          })
        } else if (state.photo.checklist_item_id) {
          await updateChecklistItem.mutateAsync({
            id: state.photo.checklist_item_id,
            inspectionId,
            updates: { notes: nextText },
          })
        } else {
          await updatePhoto.mutateAsync({
            id: state.photo.id,
            inspectionId,
            updates: { caption: nextText },
          })
        }

        addToast({ type: 'success', message: 'Opis zapisany' })
        close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nie udało się zapisać opisu'
        addToast({ type: 'error', message })
      }
    },
    [state.photo, state.existingText, inspectionId, updateDefect, updateChecklistItem, updatePhoto, addToast, close],
  )

  const onReplace = useCallback((text: string) => applyToTarget(text, 'replace'), [applyToTarget])
  const onAppend = useCallback((text: string) => applyToTarget(text, 'append'), [applyToTarget])

  return {
    trigger,
    close,
    onReplace,
    onAppend,
    state,
  }
}

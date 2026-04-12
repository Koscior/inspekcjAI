import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { STORAGE_BUCKETS } from '@/config/constants'
import { db } from '@/lib/offlineDb'
import { createVoiceNoteOffline } from '@/lib/offlineMutations'

/** Refresh session to ensure a valid JWT before Edge Function calls */
async function ensureFreshSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Nie zalogowano — zaloguj się ponownie')
  // Force refresh if token expires within 60 seconds
  const expiresAt = session.expires_at ?? 0
  if (expiresAt - Math.floor(Date.now() / 1000) < 60) {
    const { error } = await supabase.auth.refreshSession()
    if (error) throw new Error('Sesja wygasła — zaloguj się ponownie')
  }
}

// ─── Upload audio + create voice_note record ─────────────────────────────────

interface CreateVoiceNoteInput {
  inspectionId: string
  defectId?: string
  audioBlob: Blob
  durationSeconds: number
}

export function useCreateVoiceNote() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ inspectionId, defectId, audioBlob, durationSeconds }: CreateVoiceNoteInput) => {
      if (!user) throw new Error('Nie zalogowano')

      if (!navigator.onLine) {
        return createVoiceNoteOffline(
          { inspectionId, defectId, audioBlob, durationSeconds },
          user.id,
        )
      }

      const id = crypto.randomUUID()
      const storagePath = `${user.id}/${inspectionId}/${id}.webm`

      // Upload to voice-notes bucket
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.voiceNotes)
        .upload(storagePath, audioBlob, { contentType: 'audio/webm' })
      if (uploadError) throw uploadError

      // Insert DB record
      const { data, error } = await supabase
        .from('voice_notes')
        .insert({
          id,
          inspection_id: inspectionId,
          defect_id: defectId || null,
          storage_path: storagePath,
          duration_seconds: durationSeconds,
        })
        .select()
        .single()

      if (error) throw error

      // Write-through
      await db.voice_notes.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-notes'] })
    },
  })
}

// ─── Transcribe audio via ai-proxy Edge Function ─────────────────────────────

interface TranscribeInput {
  audioBlob: Blob
}

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: async ({ audioBlob }: TranscribeInput) => {
      if (!navigator.onLine) {
        throw new Error('Transkrypcja wymaga połączenia z internetem')
      }

      await ensureFreshSession()

      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      formData.append('action', 'transcribe')

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: formData,
      })

      if (error) {
        let detail = ''
        try {
          const ctx = (error as { context?: Response }).context
          if (ctx) {
            const body = await ctx.json()
            detail = body?.error || JSON.stringify(body)
          }
        } catch { /* ignore parse errors */ }
        throw new Error(detail || error.message || 'Błąd transkrypcji')
      }
      if (data?.error) throw new Error(data.error)

      return data.transcription as string
    },
  })
}

// ─── Professionalize text via ai-proxy Edge Function ─────────────────────────

interface ProfessionalizeInput {
  text: string
  context?: string
}

export function useProfessionalizeText() {
  return useMutation({
    mutationFn: async ({ text, context }: ProfessionalizeInput) => {
      if (!navigator.onLine) {
        throw new Error('Profesjonalizacja tekstu wymaga połączenia z internetem')
      }

      await ensureFreshSession()

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { action: 'professionalize', text, context },
      })

      if (error) {
        let detail = ''
        try {
          const ctx = (error as { context?: Response }).context
          if (ctx) {
            const body = await ctx.json()
            detail = body?.error || JSON.stringify(body)
          }
        } catch { /* ignore parse errors */ }
        throw new Error(detail || error.message || 'Błąd profesjonalizacji tekstu')
      }
      if (data?.error) throw new Error(data.error)

      return data.professional_text as string
    },
  })
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export function useDeleteVoiceNote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage
        .from(STORAGE_BUCKETS.voiceNotes)
        .remove([storagePath])

      const { error } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      await db.voice_notes.delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-notes'] })
    },
  })
}

// ─── Update voice note with transcriptions ───────────────────────────────────

interface UpdateTranscriptionInput {
  voiceNoteId: string
  transcriptionRaw: string
  transcriptionProfessional?: string
}

export function useUpdateVoiceNoteTranscription() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ voiceNoteId, transcriptionRaw, transcriptionProfessional }: UpdateTranscriptionInput) => {
      const { data, error } = await supabase
        .from('voice_notes')
        .update({
          transcription_raw: transcriptionRaw,
          transcription_professional: transcriptionProfessional || null,
        })
        .eq('id', voiceNoteId)
        .select()
        .single()

      if (error) throw error

      await db.voice_notes.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-notes'] })
    },
  })
}

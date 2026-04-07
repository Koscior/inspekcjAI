import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { STORAGE_BUCKETS } from '@/config/constants'
import { compressImage } from '@/lib/imageUtils'
import type { Photo, PhotoInsert, PhotoUpdate } from '@/types/database.types'

const QUERY_KEY = 'photos'

// ─── List ────────────────────────────────────────────────────────────────────

export interface PhotoFilters {
  defectId?: string
  checklistItemId?: string
  unlinked?: boolean // photos not linked to any defect or checklist item
}

export function usePhotos(inspectionId: string | undefined, filters?: PhotoFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, filters],
    queryFn: async () => {
      let query = supabase
        .from('photos')
        .select('*')
        .eq('inspection_id', inspectionId!)
        .order('photo_number', { ascending: true })

      if (filters?.defectId) query = query.eq('defect_id', filters.defectId)
      if (filters?.checklistItemId) query = query.eq('checklist_item_id', filters.checklistItemId)
      if (filters?.unlinked) {
        query = query.is('defect_id', null).is('checklist_item_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Photo[]
    },
    enabled: !!inspectionId,
  })
}

// ─── Single ──────────────────────────────────────────────────────────────────

export function usePhoto(photoId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'single', photoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId!)
        .single()

      if (error) throw error
      return data as Photo
    },
    enabled: !!photoId,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate thumbnail */
async function generateThumbnail(file: File): Promise<Blob> {
  return compressImage(file, 300)
}

/** Get public URL for a storage path */
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.photos)
    .getPublicUrl(storagePath)
  return data.publicUrl
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export function useUploadPhoto() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({
      inspectionId,
      file,
      defectId,
      checklistItemId,
      caption,
    }: {
      inspectionId: string
      file: File
      defectId?: string
      checklistItemId?: string
      caption?: string
    }) => {
      if (!user) throw new Error('Brak zalogowanego użytkownika')

      const fileId = crypto.randomUUID()
      const basePath = `${user.id}/${inspectionId}`

      // Compress original (max 2048px)
      const compressed = await compressImage(file, 2048)
      const originalPath = `${basePath}/${fileId}.webp`

      // Generate thumbnail (300px)
      const thumbnail = await generateThumbnail(file)
      const thumbnailPath = `${basePath}/thumbs/${fileId}.webp`

      // Upload original
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.photos)
        .upload(originalPath, compressed, { contentType: 'image/webp' })
      if (uploadError) throw uploadError

      // Upload thumbnail
      const { error: thumbError } = await supabase.storage
        .from(STORAGE_BUCKETS.photos)
        .upload(thumbnailPath, thumbnail, { contentType: 'image/webp' })
      if (thumbError) throw thumbError

      // Get next photo_number
      const { data: existing } = await supabase
        .from('photos')
        .select('photo_number')
        .eq('inspection_id', inspectionId)
        .order('photo_number', { ascending: false })
        .limit(1)

      const photoNumber = (existing?.[0]?.photo_number ?? 0) + 1

      // Create DB record
      const insert: PhotoInsert = {
        inspection_id: inspectionId,
        original_path: originalPath,
        thumbnail_path: thumbnailPath,
        photo_number: photoNumber,
        defect_id: defectId ?? null,
        checklist_item_id: checklistItemId ?? null,
        caption: caption ?? null,
      }

      const { data, error } = await supabase
        .from('photos')
        .insert(insert)
        .select()
        .single()

      if (error) throw error
      return data as Photo
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: ['defects', inspectionId] })
    },
  })
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function useUpdatePhoto() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, updates }: {
      id: string
      inspectionId: string
      updates: PhotoUpdate
    }) => {
      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Photo
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export function useDeletePhoto() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, originalPath, thumbnailPath, annotatedPath }: {
      id: string
      inspectionId: string
      originalPath: string
      thumbnailPath?: string | null
      annotatedPath?: string | null
    }) => {
      // Delete from storage
      const pathsToDelete = [originalPath]
      if (thumbnailPath) pathsToDelete.push(thumbnailPath)
      if (annotatedPath) pathsToDelete.push(annotatedPath)

      await supabase.storage
        .from(STORAGE_BUCKETS.photos)
        .remove(pathsToDelete)

      // Delete DB record
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: ['defects', inspectionId] })
    },
  })
}

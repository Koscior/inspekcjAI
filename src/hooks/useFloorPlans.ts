import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { STORAGE_BUCKETS } from '@/config/constants'
import type { FloorPlan, FloorPlanInsert, FloorPlanUpdate } from '@/types/database.types'

const QUERY_KEY = 'floor-plans'

// ─── List ────────────────────────────────────────────────────────────────────

export function useFloorPlans(inspectionId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floor_plans')
        .select(`
          *,
          pins ( id, defect_id, x_percent, y_percent, label_number )
        `)
        .eq('inspection_id', inspectionId!)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!inspectionId,
  })
}

// ─── Single ──────────────────────────────────────────────────────────────────

export function useFloorPlan(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'single', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floor_plans')
        .select(`
          *,
          pins (
            id, defect_id, x_percent, y_percent, label_number,
            defects ( id, title, severity, category, number )
          )
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFloorPlanUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.floorPlans)
    .getPublicUrl(storagePath)
  return data.publicUrl
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export function useUploadFloorPlan() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({
      inspectionId,
      file,
      label,
    }: {
      inspectionId: string
      file: File
      label: string
    }) => {
      if (!user) throw new Error('Brak zalogowanego użytkownika')

      const fileId = crypto.randomUUID()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const storagePath = `${user.id}/${inspectionId}/${fileId}.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.floorPlans)
        .upload(storagePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      // Get next sort_order
      const { data: existing } = await supabase
        .from('floor_plans')
        .select('sort_order')
        .eq('inspection_id', inspectionId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const sortOrder = (existing?.[0]?.sort_order ?? 0) + 1

      const insert: FloorPlanInsert = {
        inspection_id: inspectionId,
        label,
        storage_path: storagePath,
        file_type: 'image',
        sort_order: sortOrder,
      }

      const { data, error } = await supabase
        .from('floor_plans')
        .insert(insert)
        .select()
        .single()

      if (error) throw error
      return data as FloorPlan
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function useUpdateFloorPlan() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, updates }: {
      id: string
      inspectionId: string
      updates: FloorPlanUpdate
    }) => {
      const { data, error } = await supabase
        .from('floor_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as FloorPlan
    },
    onSuccess: (_data, { inspectionId, id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'single', id] })
    },
  })
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export function useDeleteFloorPlan() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, storagePath }: {
      id: string
      inspectionId: string
      storagePath: string
    }) => {
      // Delete from storage
      await supabase.storage
        .from(STORAGE_BUCKETS.floorPlans)
        .remove([storagePath])

      // Delete DB record (cascade deletes pins)
      const { error } = await supabase
        .from('floor_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

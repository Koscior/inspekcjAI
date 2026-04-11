import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { promoteInspectionStatus } from '@/lib/inspectionStatus'
import type { Defect, DefectInsert, DefectUpdate } from '@/types/database.types'

const QUERY_KEY = 'defects'

// ─── Filters ────────────────────────────────────────────────────────────────

export interface DefectFilters {
  category?: string
  severity?: Defect['severity']
  status?: Defect['status']
  type?: Defect['type']
  search?: string
}

// ─── List ────────────────────────────────────────────────────────────────────

export function useDefects(inspectionId: string | undefined, filters?: DefectFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, filters],
    queryFn: async () => {
      let query = supabase
        .from('defects')
        .select(`
          *,
          photos ( id, thumbnail_path, photo_number ),
          pins ( id, floor_plan_id, x_percent, y_percent, label_number )
        `)
        .eq('inspection_id', inspectionId!)
        .order('number', { ascending: true })

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.severity) query = query.eq('severity', filters.severity)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.type) query = query.eq('type', filters.type)
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!inspectionId,
  })
}

// ─── Single ──────────────────────────────────────────────────────────────────

export function useDefect(inspectionId: string | undefined, defectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, defectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('defects')
        .select(`
          *,
          photos ( id, original_path, annotated_path, thumbnail_path, photo_number, caption ),
          pins ( id, floor_plan_id, x_percent, y_percent, label_number )
        `)
        .eq('id', defectId!)
        .eq('inspection_id', inspectionId!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!inspectionId && !!defectId,
  })
}

// ─── Next number ─────────────────────────────────────────────────────────────

export function useNextDefectNumber(inspectionId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, 'next-number'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('defects')
        .select('number')
        .eq('inspection_id', inspectionId!)
        .order('number', { ascending: false })
        .limit(1)

      if (error) throw error
      return (data?.[0]?.number ?? 0) + 1
    },
    enabled: !!inspectionId,
  })
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function useCreateDefect() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: Omit<DefectInsert, 'number'> & { number?: number }) => {
      if (!user) throw new Error('Brak zalogowanego użytkownika')

      // Auto-assign number if not provided
      let number = input.number
      if (!number) {
        const { data: existing } = await supabase
          .from('defects')
          .select('number')
          .eq('inspection_id', input.inspection_id)
          .order('number', { ascending: false })
          .limit(1)

        number = (existing?.[0]?.number ?? 0) + 1
      }

      const { data, error } = await supabase
        .from('defects')
        .insert({ ...input, number })
        .select()
        .single()

      if (error) throw error
      return data as Defect
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, input.inspection_id] })
      promoteInspectionStatus(input.inspection_id, 'in_progress').then(() => {
        qc.invalidateQueries({ queryKey: ['inspections'] })
      })
    },
  })
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function useUpdateDefect() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, updates }: {
      id: string
      inspectionId: string
      updates: DefectUpdate
    }) => {
      const { data, error } = await supabase
        .from('defects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Defect
    },
    onSuccess: (_data, { inspectionId, id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId, id] })
    },
  })
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export function useDeleteDefect() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId }: { id: string; inspectionId: string }) => {
      const { error } = await supabase
        .from('defects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

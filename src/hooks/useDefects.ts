import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { promoteInspectionStatus } from '@/lib/inspectionStatus'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import {
  createDefectOffline,
  updateDefectOffline,
  deleteDefectOffline,
} from '@/lib/offlineMutations'
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
    queryFn: withOfflineFallback(
      async () => {
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

        // Write-through to local DB
        if (data) {
          const localRecords = data.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { photos, pins, ...rest } = r as Record<string, unknown>
            return { ...rest, _sync_status: 'synced' as const }
          })
          await db.defects.bulkPut(localRecords as never[])
        }

        return data
      },
      async () => {
        let results = await db.defects
          .where('inspection_id')
          .equals(inspectionId!)
          .sortBy('number')

        if (filters?.category) results = results.filter((r) => r.category === filters.category)
        if (filters?.severity) results = results.filter((r) => r.severity === filters.severity)
        if (filters?.status) results = results.filter((r) => r.status === filters.status)
        if (filters?.type) results = results.filter((r) => r.type === filters.type)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          results = results.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              (r.description && r.description.toLowerCase().includes(q)),
          )
        }

        // Load related photos and pins from local DB
        const withRelations = await Promise.all(
          results.map(async (defect) => {
            const photos = await db.photos
              .where('defect_id')
              .equals(defect.id)
              .toArray()
            const pins = await db.pins
              .where('defect_id')
              .equals(defect.id)
              .toArray()
            return {
              ...defect,
              photos: photos.map((p) => ({
                id: p.id,
                thumbnail_path: p.thumbnail_path,
                photo_number: p.photo_number,
              })),
              pins: pins.map((p) => ({
                id: p.id,
                floor_plan_id: p.floor_plan_id,
                x_percent: p.x_percent,
                y_percent: p.y_percent,
                label_number: p.label_number,
              })),
            }
          }),
        )

        return withRelations as any
      },
    ),
    enabled: !!inspectionId,
  })
}

// ─── Single ──────────────────────────────────────────────────────────────────

export function useDefect(inspectionId: string | undefined, defectId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, defectId],
    queryFn: withOfflineFallback(
      async () => {
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

        // Write-through (without relations)
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { photos, pins, ...rest } = data as Record<string, unknown>
          await db.defects.put({ ...rest, _sync_status: 'synced' } as never)
        }

        return data
      },
      async () => {
        const defect = await db.defects.get(defectId!)
        if (!defect) throw new Error('Usterka nie znaleziona')

        const photos = await db.photos
          .where('defect_id')
          .equals(defectId!)
          .toArray()
        const pins = await db.pins
          .where('defect_id')
          .equals(defectId!)
          .toArray()

        return {
          ...defect,
          photos: photos.map((p) => ({
            id: p.id,
            original_path: p.original_path,
            annotated_path: p.annotated_path,
            thumbnail_path: p.thumbnail_path,
            photo_number: p.photo_number,
            caption: p.caption,
          })),
          pins: pins.map((p) => ({
            id: p.id,
            floor_plan_id: p.floor_plan_id,
            x_percent: p.x_percent,
            y_percent: p.y_percent,
            label_number: p.label_number,
          })),
        } as any
      },
    ),
    enabled: !!inspectionId && !!defectId,
  })
}

// ─── Next number ─────────────────────────────────────────────────────────────

export function useNextDefectNumber(inspectionId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId, 'next-number'],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('defects')
          .select('number')
          .eq('inspection_id', inspectionId!)
          .order('number', { ascending: false })
          .limit(1)

        if (error) throw error
        return (data?.[0]?.number ?? 0) + 1
      },
      async () => {
        const existing = await db.defects
          .where('inspection_id')
          .equals(inspectionId!)
          .sortBy('number')
        return (existing.at(-1)?.number ?? 0) + 1
      },
    ),
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

      if (!navigator.onLine) {
        return createDefectOffline(input, input.inspection_id) as unknown as Defect
      }

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

      // Write-through
      await db.defects.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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
      if (!navigator.onLine) {
        return updateDefectOffline(id, updates, inspectionId) as unknown as Defect
      }

      const { data, error } = await supabase
        .from('defects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Write-through
      await db.defects.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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
      if (!navigator.onLine) {
        return deleteDefectOffline(id, inspectionId)
      }

      const { error } = await supabase
        .from('defects')
        .delete()
        .eq('id', id)

      if (error) throw error

      await db.defects.delete(id)
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

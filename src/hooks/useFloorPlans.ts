import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { STORAGE_BUCKETS } from '@/config/constants'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import { getBlobUrl } from '@/lib/offlineStorage'
import { uploadFloorPlanOffline } from '@/lib/offlineMutations'
import type { FloorPlan, FloorPlanInsert, FloorPlanUpdate } from '@/types/database.types'

const QUERY_KEY = 'floor-plans'

// ─── List ────────────────────────────────────────────────────────────────────

export function useFloorPlans(inspectionId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('floor_plans')
          .select(`
            *,
            pins ( id, defect_id, x_percent, y_percent, label_number )
          `)
          .eq('inspection_id', inspectionId!)
          .order('sort_order', { ascending: true })

        if (error) throw error

        // Write-through
        if (data) {
          const localRecords = data.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pins, ...rest } = r as Record<string, unknown>
            return { ...rest, _sync_status: 'synced' as const }
          })
          await db.floor_plans.bulkPut(localRecords as never[])
        }

        return data
      },
      async () => {
        const floorPlans = await db.floor_plans
          .where('inspection_id')
          .equals(inspectionId!)
          .sortBy('sort_order')

        const withPins = await Promise.all(
          floorPlans.map(async (fp) => {
            const pins = await db.pins
              .where('floor_plan_id')
              .equals(fp.id)
              .toArray()
            return {
              ...fp,
              pins: pins.map((p) => ({
                id: p.id,
                defect_id: p.defect_id,
                x_percent: p.x_percent,
                y_percent: p.y_percent,
                label_number: p.label_number,
              })),
            }
          }),
        )

        return withPins as any
      },
    ),
    enabled: !!inspectionId,
  })
}

// ─── Single ──────────────────────────────────────────────────────────────────

export function useFloorPlan(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'single', id],
    queryFn: withOfflineFallback(
      async () => {
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

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { pins, ...rest } = data as Record<string, unknown>
          await db.floor_plans.put({ ...rest, _sync_status: 'synced' } as never)
        }

        return data
      },
      async () => {
        const fp = await db.floor_plans.get(id!)
        if (!fp) throw new Error('Plan nie znaleziony')

        const pins = await db.pins
          .where('floor_plan_id')
          .equals(id!)
          .toArray()

        const pinsWithDefects = await Promise.all(
          pins.map(async (pin) => {
            let defect = null
            if (pin.defect_id) {
              const d = await db.defects.get(pin.defect_id)
              if (d) defect = { id: d.id, title: d.title, severity: d.severity, category: d.category, number: d.number }
            }
            return { ...pin, defects: defect }
          }),
        )

        return { ...fp, pins: pinsWithDefects } as any
      },
    ),
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

/**
 * Hook that resolves a floor plan URL with local-first fallback.
 */
export function useFloorPlanUrl(storagePath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!storagePath) {
      setUrl(null)
      return
    }

    let cancelled = false

    getBlobUrl(storagePath).then((localUrl) => {
      if (cancelled) return
      if (localUrl) {
        setUrl(localUrl)
      } else {
        setUrl(getFloorPlanUrl(storagePath))
      }
    })

    return () => {
      cancelled = true
    }
  }, [storagePath])

  return url
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

      if (!navigator.onLine) {
        return uploadFloorPlanOffline({ inspectionId, file, label }, user.id) as unknown as FloorPlan
      }

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

      await db.floor_plans.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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

      await db.floor_plans.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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

      await db.floor_plans.delete(id)
      // Also delete local pins
      const localPins = await db.pins.where('floor_plan_id').equals(id).primaryKeys()
      await db.pins.bulkDelete(localPins)
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

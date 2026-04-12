import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { db } from '@/lib/offlineDb'
import {
  createPinOffline,
  updatePinOffline,
  deletePinOffline,
} from '@/lib/offlineMutations'
import type { PinInsert, PinUpdate } from '@/types/database.types'

// Pins are loaded via floor_plans relations, so no separate query hook needed.
// These mutations invalidate the floor-plans query key.

const FLOOR_PLANS_KEY = 'floor-plans'

// ─── Create ──────────────────────────────────────────────────────────────────

export function useCreatePin() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: PinInsert & { inspectionId: string }) => {
      const { inspectionId, ...pinData } = input

      if (!navigator.onLine) {
        return createPinOffline(pinData, inspectionId)
      }

      const { data, error } = await supabase
        .from('pins')
        .insert(pinData)
        .select()
        .single()

      if (error) throw error

      await db.pins.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data
    },
    onSuccess: (_data, { inspectionId, floor_plan_id }) => {
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, 'single', floor_plan_id] })
    },
  })
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function useUpdatePin() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, floorPlanId, updates }: {
      id: string
      inspectionId: string
      floorPlanId: string
      updates: PinUpdate
    }) => {
      if (!navigator.onLine) {
        return updatePinOffline(id, updates, inspectionId)
      }

      const { data, error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await db.pins.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data
    },
    onSuccess: (_data, { inspectionId, floorPlanId }) => {
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, 'single', floorPlanId] })
    },
  })
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export function useDeletePin() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, floorPlanId }: {
      id: string
      inspectionId: string
      floorPlanId: string
    }) => {
      if (!navigator.onLine) {
        return deletePinOffline(id, inspectionId)
      }

      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id)

      if (error) throw error

      await db.pins.delete(id)
    },
    onSuccess: (_data, { inspectionId, floorPlanId }) => {
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, 'single', floorPlanId] })
    },
  })
}

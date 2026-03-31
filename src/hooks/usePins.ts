import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import type { PinInsert, PinUpdate } from '@/types/database.types'

// Pins are loaded via floor_plans relations, so no separate query hook needed.
// These mutations invalidate the floor-plans query key.

const FLOOR_PLANS_KEY = 'floor-plans'

// ─── Create ──────────────────────────────────────────────────────────────────

export function useCreatePin() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: PinInsert & { inspectionId: string }) => {
      const { inspectionId: _, ...pinData } = input

      const { data, error } = await supabase
        .from('pins')
        .insert(pinData)
        .select()
        .single()

      if (error) throw error
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
      const { data, error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
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
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, { inspectionId, floorPlanId }) => {
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, inspectionId] })
      qc.invalidateQueries({ queryKey: [FLOOR_PLANS_KEY, 'single', floorPlanId] })
    },
  })
}

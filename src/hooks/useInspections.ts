import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import {
  createInspectionOffline,
  updateInspectionOffline,
  deleteInspectionOffline,
} from '@/lib/offlineMutations'
import type { Inspection, InspectionInsert, InspectionUpdate } from '@/types/database.types'

const QUERY_KEY = 'inspections'

// ─── Filters ────────────────────────────────────────────────────────────────

export interface InspectionFilters {
  type?: Inspection['type']
  status?: Inspection['status']
  clientId?: string
  search?: string
}

// ─── List ────────────────────────────────────────────────────────────────────

export function useInspections(filters?: InspectionFilters) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: withOfflineFallback(
      async () => {
        let query = supabase
          .from('inspections')
          .select(`
            *,
            clients ( id, full_name, email, phone ),
            defects ( count )
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })

        if (filters?.type) query = query.eq('type', filters.type)
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.clientId) query = query.eq('client_id', filters.clientId)
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
        }

        const { data, error } = await query
        if (error) throw error

        // Write-through to local DB
        if (data) {
          const localRecords = data.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { clients, defects, ...rest } = r as Record<string, unknown>
            return { ...rest, _sync_status: 'synced' as const }
          })
          await db.inspections.bulkPut(localRecords as never[])
        }

        return data
      },
      async () => {
        let results = await db.inspections
          .where('user_id')
          .equals(user!.id)
          .toArray()

        // Apply filters locally
        if (filters?.type) results = results.filter((r) => r.type === filters.type)
        if (filters?.status) results = results.filter((r) => r.status === filters.status)
        if (filters?.clientId) results = results.filter((r) => r.client_id === filters.clientId)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          results = results.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.address.toLowerCase().includes(q),
          )
        }

        // Sort by created_at descending
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return results as any
      },
    ),
    enabled: !!user,
  })
}

// ─── Upcoming / overdue inspections (next_inspection_date set) ───────────────

export function useUpcomingInspections() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, 'upcoming'],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('inspections')
          .select('id, title, address, type, next_inspection_date, clients ( full_name )')
          .eq('user_id', user!.id)
          .not('next_inspection_date', 'is', null)
          .order('next_inspection_date', { ascending: true })
          .limit(10)

        if (error) throw error
        return data as Array<{
          id: string
          title: string
          address: string
          type: string
          next_inspection_date: string
          clients: { full_name: string } | null
        }>
      },
      async () => {
        const results = await db.inspections
          .where('user_id')
          .equals(user!.id)
          .toArray()

        return results
          .filter((r) => r.next_inspection_date)
          .sort((a, b) => {
            const dateA = new Date(a.next_inspection_date!).getTime()
            const dateB = new Date(b.next_inspection_date!).getTime()
            return dateA - dateB
          })
          .slice(0, 10)
          .map((r) => ({
            id: r.id,
            title: r.title,
            address: r.address,
            type: r.type,
            next_inspection_date: r.next_inspection_date!,
            clients: null,
          }))
      },
    ),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useInspection(id: string | undefined) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            clients ( id, full_name, email, phone, address ),
            defects ( count ),
            photos ( count ),
            floor_plans ( count )
          `)
          .eq('id', id!)
          .eq('user_id', user!.id)
          .single()

        if (error) throw error

        // Write-through to local DB (without relations)
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { clients, defects, photos, floor_plans, ...rest } = data as Record<string, unknown>
          await db.inspections.put({ ...rest, _sync_status: 'synced' } as never)
        }

        return data
      },
      async () => {
        const record = await db.inspections.get(id!)
        if (!record) throw new Error('Inspekcja nie znaleziona')

        // Load relation counts from local DB
        const defectCount = await db.defects.where('inspection_id').equals(id!).count()
        const photoCount = await db.photos.where('inspection_id').equals(id!).count()
        const floorPlanCount = await db.floor_plans.where('inspection_id').equals(id!).count()

        // Load client if exists
        let client = null
        if (record.client_id) {
          client = await db.clients.get(record.client_id)
        }

        return {
          ...record,
          clients: client ? { id: client.id, full_name: client.full_name, email: client.email, phone: client.phone, address: client.address } : null,
          defects: [{ count: defectCount }],
          photos: [{ count: photoCount }],
          floor_plans: [{ count: floorPlanCount }],
        } as any
      },
    ),
    enabled: !!user && !!id,
  })
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateInspection() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: Omit<InspectionInsert, 'user_id'>) => {
      if (!user) throw new Error('Brak zalogowanego użytkownika')

      if (!navigator.onLine) {
        return createInspectionOffline(input, user.id) as unknown as Inspection
      }

      const { data, error } = await supabase
        .from('inspections')
        .insert({ ...input, user_id: user.id, status: input.status ?? 'draft' })
        .select()
        .single()

      if (error) throw error

      // Write-through to local DB
      await db.inspections.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data as Inspection
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateInspection() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InspectionUpdate }) => {
      if (!navigator.onLine) {
        return updateInspectionOffline(id, updates) as unknown as Inspection
      }

      const { data, error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Write-through to local DB
      await db.inspections.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data as Inspection
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] })
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteInspection() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        return deleteInspectionOffline(id)
      }

      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local DB
      await db.inspections.delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

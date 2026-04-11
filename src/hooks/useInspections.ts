import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
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
    queryFn: async () => {
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
      return data
    },
    enabled: !!user,
  })
}

// ─── Upcoming / overdue inspections (next_inspection_date set) ───────────────

export function useUpcomingInspections() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, 'upcoming'],
    queryFn: async () => {
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
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useInspection(id: string | undefined) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
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
      return data
    },
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

      const { data, error } = await supabase
        .from('inspections')
        .insert({ ...input, user_id: user.id, status: input.status ?? 'draft' })
        .select()
        .single()

      if (error) throw error
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
      const { data, error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
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
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

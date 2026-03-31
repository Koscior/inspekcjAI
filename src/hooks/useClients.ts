import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database.types'

const QUERY_KEY = 'clients'

// ─── List ────────────────────────────────────────────────────────────────────

export function useClients(search?: string) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, search],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          inspections ( count )
        `)
        .eq('user_id', user!.id)
        .order('full_name', { ascending: true })

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useClient(id: string | undefined) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          inspections (
            id, title, type, status, inspection_date, created_at,
            reports ( count )
          )
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

export function useCreateClient() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: Omit<ClientInsert, 'user_id'>) => {
      if (!user) throw new Error('Brak zalogowanego użytkownika')

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdate }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] })
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

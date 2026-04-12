import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import {
  createClientOffline,
  updateClientOffline,
  deleteClientOffline,
} from '@/lib/offlineMutations'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database.types'

const QUERY_KEY = 'clients'

// ─── List ────────────────────────────────────────────────────────────────────

export function useClients(search?: string) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, search],
    queryFn: withOfflineFallback(
      async () => {
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

        // Write-through
        if (data) {
          const localRecords = data.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { inspections, ...rest } = r as Record<string, unknown>
            return { ...rest, _sync_status: 'synced' as const }
          })
          await db.clients.bulkPut(localRecords as never[])
        }

        return data
      },
      async () => {
        let results = await db.clients
          .where('user_id')
          .equals(user!.id)
          .toArray()

        if (search) {
          const q = search.toLowerCase()
          results = results.filter(
            (r) =>
              r.full_name.toLowerCase().includes(q) ||
              (r.email && r.email.toLowerCase().includes(q)),
          )
        }

        // Sort by full_name
        results.sort((a, b) => a.full_name.localeCompare(b.full_name))

        return results as any
      },
    ),
    enabled: !!user,
  })
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useClient(id: string | undefined) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: withOfflineFallback(
      async () => {
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

        // Write-through (without relations)
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { inspections, ...rest } = data as Record<string, unknown>
          await db.clients.put({ ...rest, _sync_status: 'synced' } as never)
        }

        return data
      },
      async () => {
        const record = await db.clients.get(id!)
        if (!record) throw new Error('Klient nie znaleziony')

        // Load related inspections from local DB
        const inspections = await db.inspections
          .where('client_id')
          .equals(id!)
          .toArray()

        return {
          ...record,
          inspections: inspections.map((insp) => ({
            id: insp.id,
            title: insp.title,
            type: insp.type,
            status: insp.status,
            inspection_date: insp.inspection_date,
            created_at: insp.created_at,
            reports: [{ count: 0 }],
          })),
        } as any
      },
    ),
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

      if (!navigator.onLine) {
        return createClientOffline({ ...input, user_id: user.id }) as unknown as Client
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error

      await db.clients.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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
      if (!navigator.onLine) {
        return updateClientOffline(id, updates) as unknown as Client
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await db.clients.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

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
      if (!navigator.onLine) {
        return deleteClientOffline(id)
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      await db.clients.delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

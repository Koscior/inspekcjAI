import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/useClients'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { createMockUser, createMockClient } from '../../test-utils'

vi.mock('@/config/supabase', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'or', 'not', 'is', 'order', 'limit', 'insert', 'update', 'delete']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    })
    return chain
  }

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => createChain()),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  }
})

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={qc}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      )
    },
    queryClient: qc,
  }
}

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('is disabled when no user', () => {
    useAuthStore.setState({ user: null })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useClients(), { wrapper: Wrapper })
    expect(result.current.isFetching).toBe(false)
  })

  it('calls supabase.from("clients") when user is present', async () => {
    const clients = [createMockClient()]
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit']) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: clients, error: null })
      return Promise.resolve({ data: clients, error: null })
    })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useClients(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('clients')
  })

  it('applies search filter', async () => {
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit']) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    renderHook(() => useClients('Nowak'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('Nowak'))
    })
  })
})

describe('useCreateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('creates client with user_id', async () => {
    const newClient = createMockClient({ id: 'client-new' })
    const chain: Record<string, unknown> = {}
    for (const m of ['insert', 'select', 'eq']) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue({ data: newClient, error: null })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateClient(), { wrapper: Wrapper })

    await waitFor(async () => {
      const data = await result.current.mutateAsync({
        full_name: 'Nowy Klient',
        email: 'nowy@example.com',
      } as never)
      expect(data).toEqual(newClient)
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123', full_name: 'Nowy Klient' }),
    )
  })

  it('throws when no user', async () => {
    useAuthStore.setState({ user: null })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateClient(), { wrapper: Wrapper })

    await expect(
      result.current.mutateAsync({ full_name: 'Test' } as never),
    ).rejects.toThrow('Brak zalogowanego użytkownika')
  })
})

describe('useDeleteClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('deletes client and invalidates cache', async () => {
    const chain: Record<string, unknown> = {}
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteClient(), { wrapper: Wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync('client-1')
    })

    expect(supabase.from).toHaveBeenCalledWith('clients')
    expect(chain.delete).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInspections, useCreateInspection, useDeleteInspection } from '@/hooks/useInspections'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { createMockUser, createMockInspection } from '../../test-utils'

vi.mock('@/config/supabase', () => {
  const createChain = (finalData: unknown = [], finalError: unknown = null) => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'or', 'not', 'is', 'order', 'limit', 'ilike', 'insert', 'update', 'delete']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
    // Make chain thenable for non-single queries
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: finalData, error: finalError })
      return Promise.resolve({ data: finalData, error: finalError })
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
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
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

describe('useInspections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: createMockUser(),
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('is disabled when no user', () => {
    useAuthStore.setState({ user: null })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useInspections(), { wrapper: Wrapper })
    // When disabled, the query should not be fetching
    expect(result.current.isFetching).toBe(false)
  })

  it('calls supabase.from("inspections") when user is present', async () => {
    const mockInspections = [createMockInspection()]
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'or', 'not', 'is', 'order', 'limit', 'ilike']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: mockInspections, error: null })
      return Promise.resolve({ data: mockInspections, error: null })
    })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useInspections(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true)
    })

    expect(supabase.from).toHaveBeenCalledWith('inspections')
  })

  it('passes filters to query', async () => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'or', 'not', 'is', 'order', 'limit', 'ilike']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    renderHook(
      () => useInspections({ type: 'roczny', status: 'draft' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('type', 'roczny')
    })

    expect(chain.eq).toHaveBeenCalledWith('status', 'draft')
  })
})

describe('useCreateInspection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: createMockUser(),
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('inserts inspection with user_id and default status', async () => {
    const newInspection = createMockInspection({ id: 'insp-new' })
    const chain: Record<string, unknown> = {}
    const methods = ['insert', 'select', 'eq']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue({ data: newInspection, error: null })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateInspection(), { wrapper: Wrapper })

    await waitFor(async () => {
      const data = await result.current.mutateAsync({
        title: 'Nowa inspekcja',
        address: 'ul. Nowa 1',
        type: 'roczny',
      } as never)
      expect(data).toEqual(newInspection)
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        title: 'Nowa inspekcja',
      }),
    )
  })

  it('throws when no user is logged in', async () => {
    useAuthStore.setState({ user: null })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateInspection(), { wrapper: Wrapper })

    await expect(
      result.current.mutateAsync({
        title: 'Test',
        address: 'Test',
        type: 'roczny',
      } as never),
    ).rejects.toThrow('Brak zalogowanego użytkownika')
  })
})

describe('useDeleteInspection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: createMockUser(),
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('deletes inspection by id', async () => {
    const chain: Record<string, unknown> = {}
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteInspection(), { wrapper: Wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync('insp-1')
    })

    expect(supabase.from).toHaveBeenCalledWith('inspections')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'insp-1')
    expect(invalidateSpy).toHaveBeenCalled()
  })
})

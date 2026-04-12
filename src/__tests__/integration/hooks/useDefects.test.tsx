import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDefects, useCreateDefect, useDeleteDefect } from '@/hooks/useDefects'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { createMockUser, createMockDefect } from '../../test-utils'

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

vi.mock('@/lib/inspectionStatus', () => ({
  promoteInspectionStatus: vi.fn().mockResolvedValue(undefined),
}))

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

describe('useDefects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('is disabled when no inspectionId', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDefects(undefined), { wrapper: Wrapper })
    expect(result.current.isFetching).toBe(false)
  })

  it('fetches defects for a given inspectionId', async () => {
    const defects = [createMockDefect()]
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit']) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: defects, error: null })
      return Promise.resolve({ data: defects, error: null })
    })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDefects('insp-1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('defects')
    expect(chain.eq).toHaveBeenCalledWith('inspection_id', 'insp-1')
  })

  it('applies severity filter', async () => {
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
    renderHook(() => useDefects('insp-1', { severity: 'critical' }), { wrapper: Wrapper })

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('severity', 'critical')
    })
  })
})

describe('useCreateDefect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('auto-assigns number when not provided', async () => {
    const newDefect = createMockDefect({ id: 'defect-new', number: 3 })

    // First call: get existing defects for number calculation
    const existingChain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order', 'limit']) {
      existingChain[m] = vi.fn().mockReturnValue(existingChain)
    }
    existingChain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [{ number: 2 }], error: null })
      return Promise.resolve({ data: [{ number: 2 }], error: null })
    })

    // Second call: insert
    const insertChain: Record<string, unknown> = {}
    for (const m of ['insert', 'select', 'eq']) {
      insertChain[m] = vi.fn().mockReturnValue(insertChain)
    }
    insertChain.single = vi.fn().mockResolvedValue({ data: newDefect, error: null })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      return (callCount === 1 ? existingChain : insertChain) as never
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateDefect(), { wrapper: Wrapper })

    await waitFor(async () => {
      const data = await result.current.mutateAsync({
        inspection_id: 'insp-1',
        title: 'Nowa usterka',
        type: 'usterka',
        severity: 'minor',
        status: 'open',
      } as never)
      expect(data).toEqual(newDefect)
    })

    // Should have inserted with number = 3 (existing max 2 + 1)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ number: 3 }),
    )
  })

  it('promotes inspection status after creating defect', async () => {
    const { promoteInspectionStatus } = await import('@/lib/inspectionStatus')

    const insertChain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'insert', 'order', 'limit']) {
      insertChain[m] = vi.fn().mockReturnValue(insertChain)
    }
    insertChain.single = vi.fn().mockResolvedValue({ data: createMockDefect(), error: null })
    insertChain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [{ number: 0 }], error: null })
      return Promise.resolve({ data: [{ number: 0 }], error: null })
    })

    vi.mocked(supabase.from).mockReturnValue(insertChain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateDefect(), { wrapper: Wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({
        inspection_id: 'insp-1',
        title: 'Test',
        type: 'usterka',
        severity: 'minor',
        status: 'open',
      } as never)
    })

    expect(promoteInspectionStatus).toHaveBeenCalledWith('insp-1', 'in_progress')
  })
})

describe('useDeleteDefect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('deletes defect and invalidates by inspectionId', async () => {
    const chain: Record<string, unknown> = {}
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteDefect(), { wrapper: Wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ id: 'defect-1', inspectionId: 'insp-1' })
    })

    expect(supabase.from).toHaveBeenCalledWith('defects')
    expect(invalidateSpy).toHaveBeenCalled()
  })
})

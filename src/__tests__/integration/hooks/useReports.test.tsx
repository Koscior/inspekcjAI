import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useReports, useSaveReport } from '@/hooks/useReports'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/config/supabase'
import { createMockUser } from '../../test-utils'

vi.mock('@/config/supabase', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'or', 'order', 'insert', 'update', 'delete', 'limit']
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null, count: 0 })
      return Promise.resolve({ data: [], error: null, count: 0 })
    })
    return chain
  }

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => createChain()),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: 'https://test.example/signed' },
            error: null,
          }),
        }),
      },
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
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

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('is disabled when no user', () => {
    useAuthStore.setState({ user: null })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useReports(), { wrapper: Wrapper })
    expect(result.current.isFetching).toBe(false)
  })

  it('fetches reports when user exists', async () => {
    const mockReports = [{ id: 'report-1', report_number: 'INS/2025/001' }]
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'or', 'order']) {
      chain[m] = vi.fn().mockReturnValue(chain)
    }
    chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: mockReports, error: null })
      return Promise.resolve({ data: mockReports, error: null })
    })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useReports(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('reports')
  })
})

describe('useSaveReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: createMockUser(), isInitialized: true })
  })

  it('uploads PDF then inserts report record', async () => {
    const mockReport = { id: 'report-new', report_number: 'INS/2025/001', version: 1 }

    // Mock the count query (from('reports').select('*', { count: 'exact', head: true }))
    const countChain: Record<string, unknown> = {}
    for (const m of ['select', 'eq']) {
      countChain[m] = vi.fn().mockReturnValue(countChain)
    }
    countChain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ count: 0, error: null })
      return Promise.resolve({ count: 0, error: null })
    })

    // Mock the insert query
    const insertChain: Record<string, unknown> = {}
    for (const m of ['insert', 'select', 'eq']) {
      insertChain[m] = vi.fn().mockReturnValue(insertChain)
    }
    insertChain.single = vi.fn().mockResolvedValue({ data: mockReport, error: null })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      return (callCount === 1 ? countChain : insertChain) as never
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSaveReport(), { wrapper: Wrapper })

    const blob = new Blob(['fake pdf'], { type: 'application/pdf' })

    await waitFor(async () => {
      const data = await result.current.mutateAsync({
        inspectionId: 'insp-1',
        reportType: 'techniczny',
        reportNumber: 'INS/2025/001',
        blob,
      })
      expect(data).toEqual(mockReport)
    })

    // Should have uploaded to storage first
    expect(supabase.storage.from).toHaveBeenCalledWith('report-pdfs')
    const storageUpload = vi.mocked(supabase.storage.from('report-pdfs').upload)
    expect(storageUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-123/insp-1/techniczny_'),
      blob,
      expect.objectContaining({ contentType: 'application/pdf' }),
    )

    // Then inserted report record
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        inspection_id: 'insp-1',
        report_type: 'techniczny',
        report_number: 'INS/2025/001',
        version: 1,
      }),
    )
  })

  it('throws when upload fails', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Storage full' } }),
    } as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSaveReport(), { wrapper: Wrapper })

    const blob = new Blob(['fake'], { type: 'application/pdf' })

    await expect(
      result.current.mutateAsync({
        inspectionId: 'insp-1',
        reportType: 'techniczny',
        reportNumber: 'INS/2025/001',
        blob,
      }),
    ).rejects.toThrow('Upload PDF nie powiódł się')
  })
})

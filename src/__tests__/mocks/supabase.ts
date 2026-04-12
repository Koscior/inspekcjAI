import { vi } from 'vitest'

// Chainable query builder mock
function createQueryBuilder() {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}

  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'lt', 'gte', 'lte',
    'like', 'ilike', 'is', 'in', 'not', 'or', 'and',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'filter', 'match', 'contains', 'containedBy',
    'textSearch', 'csv',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  // Terminal methods return data
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null })
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

  // Make the builder itself thenable (for queries without .single())
  builder.then = vi.fn().mockImplementation((resolve: (value: unknown) => void) => {
    resolve({ data: [], error: null })
  })

  return builder
}

export const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => createQueryBuilder()),
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test/path.jpg' } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test' }, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
  },
}

// This can be used with vi.mock('@/config/supabase', ...)
export function createSupabaseMock() {
  return { supabase: mockSupabaseClient }
}

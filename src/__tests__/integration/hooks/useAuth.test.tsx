import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { supabase } from '@/config/supabase'
import { createMockUser, createMockSession, createMockProfile } from '../../test-utils'

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    useAuthStore.setState({
      user: null, session: null, profile: null,
      isLoading: false, isInitialized: true,
    })
    useUiStore.setState({ toasts: [] })
  })

  // ── Login ─────────────────────────────────────────────────────────────────

  it('login success updates store and navigates to dashboard', async () => {
    const mockSession = createMockSession()
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(useAuthStore.getState().user).toEqual(mockSession.user)
    expect(useAuthStore.getState().session).toEqual(mockSession)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('login failure shows error toast and throws', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid credentials' },
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await expect(
      act(async () => {
        await result.current.login('bad@example.com', 'wrong')
      }),
    ).rejects.toThrow()

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.type).toBe('error')
    expect(toasts[0]?.message).toContain('Błędny e-mail lub hasło')
  })

  it('login sets isLoading true during request, false after', async () => {
    let resolveLogin: (value: unknown) => void
    const loginPromise = new Promise((resolve) => { resolveLogin = resolve })

    vi.mocked(supabase.auth.signInWithPassword).mockReturnValue(loginPromise as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    // Start login (don't await)
    const loginAct = act(async () => {
      await result.current.login('test@example.com', 'pass')
    })

    // Should be loading
    expect(useAuthStore.getState().isLoading).toBe(true)

    // Resolve the login
    resolveLogin!({
      data: { session: createMockSession(), user: createMockUser() },
      error: null,
    })
    await loginAct

    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  // ── Register ──────────────────────────────────────────────────────────────

  it('register with session navigates to onboarding', async () => {
    const mockSession = createMockSession()
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.register('new@example.com', 'password123', 'Jan')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding')
    const toasts = useUiStore.getState().toasts
    expect(toasts.some((t) => t.message.includes('Konto zostało utworzone'))).toBe(true)
  })

  it('register without session (email confirmation) shows toast and navigates to login', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: createMockUser() },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.register('new@example.com', 'password123', 'Jan')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/login')
    const toasts = useUiStore.getState().toasts
    expect(toasts.some((t) => t.message.includes('e-mail'))).toBe(true)
  })

  it('register failure shows error toast and throws', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await expect(
      act(async () => {
        await result.current.register('existing@example.com', 'pass', 'Jan')
      }),
    ).rejects.toThrow()

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.type).toBe('error')
  })

  // ── Logout ────────────────────────────────────────────────────────────────

  it('logout resets store and navigates to login', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    // Set up authenticated state
    useAuthStore.getState().setUser(createMockUser())
    useAuthStore.getState().setSession(createMockSession())

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.logout()
    })

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  // ── Update profile ────────────────────────────────────────────────────────

  it('updateProfile updates store with merged data', async () => {
    const mockProfile = createMockProfile()
    useAuthStore.getState().setUser(createMockUser())
    useAuthStore.getState().setProfile(mockProfile)

    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.updateProfile({ full_name: 'Nowe Imię' })
    })

    expect(useAuthStore.getState().profile?.full_name).toBe('Nowe Imię')
    const toasts = useUiStore.getState().toasts
    expect(toasts.some((t) => t.message.includes('Profil zapisany'))).toBe(true)
  })

  // ── Computed properties ───────────────────────────────────────────────────

  it('isAuthenticated returns true when user exists', () => {
    useAuthStore.getState().setUser(createMockUser())

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('isAuthenticated returns false when no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isAuthenticated).toBe(false)
  })

  // ── fetchProfile ──────────────────────────────────────────────────────────

  it('fetchProfile fetches and sets profile', async () => {
    const mockProfile = createMockProfile()
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    })
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.fetchProfile('user-123')
    })

    expect(useAuthStore.getState().profile).toEqual(mockProfile)
  })
})

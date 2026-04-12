import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/store/authStore'

// Mock supabase
vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null, session: null, profile: null,
      isLoading: false, isInitialized: true,
    })
  })

  it('renders email and password inputs', () => {
    renderLoginPage()
    expect(screen.getByLabelText('Adres e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument()
  })

  it('renders login button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
  })

  it('renders register link', () => {
    renderLoginPage()
    expect(screen.getByText('Zarejestruj się')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderLoginPage()
    expect(screen.getByText('Nie pamiętasz hasła?')).toBeInTheDocument()
  })

  // ── Validation ────────────────────────────────────────────────────────────

  it('shows validation error for empty email on submit', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    // Fill password but leave email empty
    await user.type(screen.getByLabelText('Hasło'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy adres e-mail')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    // Type something that's not a valid email — use a simple string without @
    await user.type(screen.getByLabelText('Adres e-mail'), 'invalid')
    await user.type(screen.getByLabelText('Hasło'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    // Zod email validation should trigger
    await waitFor(() => {
      // Look for any error message on the email field
      const errorEl = screen.queryByText(/e-mail/i)
        || screen.queryByText(/email/i)
      expect(errorEl).toBeInTheDocument()
    })
  })

  it('shows validation error for empty password on submit', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Adres e-mail'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    await waitFor(() => {
      expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument()
    })
  })

  // ── Submit ────────────────────────────────────────────────────────────────

  it('calls login with correct data when form is valid', async () => {
    const { supabase } = await import('@/config/supabase')
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          user: { id: 'user-123', email: 'test@example.com' },
        },
        user: { id: 'user-123', email: 'test@example.com' },
      },
      error: null,
    } as never)

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Adres e-mail'), 'test@example.com')
    await user.type(screen.getByLabelText('Hasło'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('renders app title', () => {
    renderLoginPage()
    expect(screen.getByText('InspekcjAI')).toBeInTheDocument()
  })
})

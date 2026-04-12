import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions, renderHook, type RenderHookOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Client, Inspection, Defect } from '@/types/domain'

// ─── Fresh QueryClient for each test ────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

// ─── Providers wrapper ──────────────────────────────────────────────────────

interface WrapperOptions {
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
}

function createWrapper({ routerProps, queryClient }: WrapperOptions = {}) {
  const qc = queryClient ?? createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter {...routerProps}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

// ─── Custom render ──────────────────────────────────────────────────────────

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { routerProps, queryClient, ...renderOptions } = options
  const Wrapper = createWrapper({ routerProps, queryClient })
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient ?? createTestQueryClient(),
  }
}

// ─── Custom renderHook ──────────────────────────────────────────────────────

export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: Omit<RenderHookOptions<TProps>, 'wrapper'> & WrapperOptions = {} as never,
) {
  const { routerProps, queryClient, ...hookOptions } = options
  const Wrapper = createWrapper({ routerProps, queryClient })
  return renderHook(hook, { wrapper: Wrapper, ...hookOptions })
}

// ─── Mock factories ─────────────────────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { full_name: 'Jan Kowalski' },
    aud: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as User
}

export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: createMockUser(),
    ...overrides,
  } as Session
}

export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Jan Kowalski',
    role: 'inspector',
    company_id: null,
    company_name: null,
    license_number: 'BUD/12345',
    poiib_number: 'MAZ/1234',
    phone: '+48123456789',
    logo_url: null,
    signature_url: null,
    cert_urls: [],
    subscription_plan: 'free',
    onboarding_complete: true,
    reports_used_this_month: 0,
    reports_reset_at: '2025-02-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-1',
    user_id: 'user-123',
    full_name: 'Anna Nowak',
    email: 'anna@example.com',
    phone: '+48111222333',
    address: 'ul. Testowa 1, 00-001 Warszawa',
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: 'insp-1',
    user_id: 'user-123',
    client_id: 'client-1',
    type: 'roczny',
    status: 'draft',
    reference_number: 'INS/2025/001',
    title: 'Przegląd roczny budynku',
    address: 'ul. Testowa 1, 00-001 Warszawa',
    building_type: null,
    construction_type: null,
    owner_name: null,
    owner_address: null,
    owner_phone: null,
    owner_email: null,
    manager_name: null,
    investor_name: null,
    contractor_name: null,
    inspection_date: null,
    next_inspection_date: null,
    previous_protocol_notes: null,
    completed_works: null,
    tenant_complaints: null,
    incomplete_works: null,
    building_docs_status: null,
    usage_docs_status: null,
    building_log_status: null,
    notes: null,
    powierzchnia_uzytkowa: null,
    powierzchnia_zabudowy: null,
    kubatura: null,
    kondygnacje_podziemne: null,
    kondygnacje_nadziemne: null,
    cover_photo_path: null,
    wnioski_uwagi_zalecenia: null,
    pilnosc_1: null,
    pilnosc_2: null,
    pilnosc_3: null,
    ocena_stanu_tekst: null,
    ocena_nadaje_sie: null,
    ocena_stwierdzono_uszkodzenia: null,
    pg_nazwa: null,
    pg_liczba_urzadzen: null,
    pg_rodzaje_urzadzen: null,
    pg_material_urzadzen: null,
    pg_nawierzchnia: null,
    pg_nawierzchnia_pod_urzadzeniami: null,
    pg_mocowanie_urzadzen: null,
    pg_ogrodzenie: null,
    pg_naslonecznienie: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockDefect(overrides: Partial<Defect> = {}): Defect {
  return {
    id: 'defect-1',
    inspection_id: 'insp-1',
    number: 1,
    title: 'Rysy na ścianie',
    description: 'Widoczne zarysowania na ścianie wschodniej',
    type: 'usterka',
    severity: 'serious',
    category: 'Ściany',
    status: 'open',
    contractor: null,
    responsible_person: null,
    reporter_name: null,
    deadline: null,
    location_label: null,
    floor_plan_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

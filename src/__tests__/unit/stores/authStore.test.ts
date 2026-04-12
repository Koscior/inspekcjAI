import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { createMockUser, createMockSession, createMockProfile } from '../../test-utils'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
    })
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.isInitialized).toBe(false)
  })

  // ── Setters ───────────────────────────────────────────────────────────────

  it('setUser updates user', () => {
    const mockUser = createMockUser()
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('setUser can set null', () => {
    useAuthStore.getState().setUser(createMockUser())
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setSession updates session', () => {
    const mockSession = createMockSession()
    useAuthStore.getState().setSession(mockSession)
    expect(useAuthStore.getState().session).toEqual(mockSession)
  })

  it('setProfile updates profile', () => {
    const mockProfile = createMockProfile()
    useAuthStore.getState().setProfile(mockProfile)
    expect(useAuthStore.getState().profile).toEqual(mockProfile)
  })

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)

    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setInitialized updates isInitialized', () => {
    useAuthStore.getState().setInitialized(true)
    expect(useAuthStore.getState().isInitialized).toBe(true)
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  it('reset clears user, session, and profile', () => {
    useAuthStore.getState().setUser(createMockUser())
    useAuthStore.getState().setSession(createMockSession())
    useAuthStore.getState().setProfile(createMockProfile())

    useAuthStore.getState().reset()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.profile).toBeNull()
  })

  it('reset does not affect isLoading or isInitialized', () => {
    useAuthStore.getState().setLoading(true)
    useAuthStore.getState().setInitialized(true)

    useAuthStore.getState().reset()

    expect(useAuthStore.getState().isLoading).toBe(true)
    expect(useAuthStore.getState().isInitialized).toBe(true)
  })

  // ── Persist middleware ────────────────────────────────────────────────────

  it('has correct persist store name', () => {
    // The store name is used as localStorage key
    expect(useAuthStore.persist.getOptions().name).toBe('inspekcjai-auth')
  })

  it('partialize only persists user and session', () => {
    const partialize = useAuthStore.persist.getOptions().partialize
    if (!partialize) {
      throw new Error('partialize should be defined')
    }

    const fullState = {
      user: createMockUser(),
      session: createMockSession(),
      profile: createMockProfile(),
      isLoading: true,
      isInitialized: true,
      setUser: () => {},
      setSession: () => {},
      setProfile: () => {},
      setLoading: () => {},
      setInitialized: () => {},
      reset: () => {},
    }

    const persisted = partialize(fullState)
    expect(persisted).toHaveProperty('user')
    expect(persisted).toHaveProperty('session')
    expect(persisted).not.toHaveProperty('profile')
    expect(persisted).not.toHaveProperty('isLoading')
    expect(persisted).not.toHaveProperty('isInitialized')
  })
})

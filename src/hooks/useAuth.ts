import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/router/routePaths'
import type { Profile } from '@/types/domain'

export function useAuth() {
  const { user, session, profile, isLoading, isInitialized,
          setUser, setSession, setProfile, setLoading, reset } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()

  // ── Fetch profile from DB ─────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as unknown as Profile)
    }
  }, [setProfile])

  // Auth initialization is handled by useAuthInit in App.tsx

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      addToast({ type: 'error', message: 'Błędny e-mail lub hasło' })
      throw error
    }

    // Set user/session in store immediately so ProtectedRoute sees them
    // before onAuthStateChange fires asynchronously
    if (data.session) {
      setSession(data.session)
      setUser(data.session.user)
    }

    navigate(ROUTES.DASHBOARD)
  }, [setLoading, setSession, setUser, addToast, navigate])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)

    if (error) {
      addToast({ type: 'error', message: error.message })
      throw error
    }

    if (!data.session) {
      // Email confirmation is required — user must verify before signing in
      addToast({ type: 'success', message: 'Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.' })
      navigate(ROUTES.LOGIN)
      return
    }

    // Auto-confirmed (email confirmation disabled in Supabase) — go to onboarding
    addToast({ type: 'success', message: 'Konto zostało utworzone!' })
    navigate(ROUTES.ONBOARDING)
  }, [setLoading, addToast, navigate])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
    navigate(ROUTES.LOGIN)
  }, [reset, navigate])

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      addToast({ type: 'error', message: 'Błąd podczas zapisywania profilu' })
      throw error
    }

    setProfile({ ...profile!, ...updates })
    addToast({ type: 'success', message: 'Profil zapisany' })
  }, [user, profile, setProfile, addToast])

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    fetchProfile,
  }
}

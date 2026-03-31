import { useEffect, useRef } from 'react'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/domain'

/**
 * Initializes Supabase auth listener at the app root level.
 * Must be called once, before any ProtectedRoute renders.
 * Only manages isInitialized — does NOT touch isLoading
 * (isLoading is reserved for explicit user actions like login/register).
 */
export function useAuthInit() {
  const { setUser, setSession, setProfile, setInitialized } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double-init in StrictMode
    if (initialized.current) return
    initialized.current = true

    async function fetchProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          setProfile(data as unknown as Profile)
        }
      } catch {
        // Profile fetch failed — not critical, continue without profile
      }
    }

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch {
        // Auth check failed — treat as logged out
        setSession(null)
        setUser(null)
      } finally {
        // ALWAYS mark as initialized, no matter what happened
        setInitialized(true)
      }
    }

    init()

    // Listen for subsequent auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

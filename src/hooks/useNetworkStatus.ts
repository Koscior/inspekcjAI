import { useEffect, useRef } from 'react'
import { useNetworkStore } from '@/store/networkStore'
import { getPendingCount } from '@/lib/syncQueue'
import { syncProcessor } from '@/lib/syncProcessor'
import { supabase } from '@/config/supabase'

/**
 * Hook that monitors online/offline state, triggers sync on reconnect,
 * and keeps the pending count up to date.
 *
 * Should be called once in App.tsx.
 */
export function useNetworkStatus() {
  const {
    setOnline,
    setSyncStatus,
    setPendingCount,
    setLastSyncAt,
  } = useNetworkStore()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Update pending count on mount
    refreshPendingCount()

    const handleOnline = () => {
      verifyConnectivity().then((reallyOnline) => {
        setOnline(reallyOnline)
        if (reallyOnline) {
          triggerSync()
        }
      })
    }

    const handleOffline = () => {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial connectivity check
    if (navigator.onLine) {
      verifyConnectivity().then((reallyOnline) => {
        setOnline(reallyOnline)
        if (reallyOnline) {
          triggerSync()
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshPendingCount() {
    const count = await getPendingCount()
    setPendingCount(count)
  }

  async function verifyConnectivity(): Promise<boolean> {
    try {
      // Lightweight ping to Supabase — just check auth session
      const { error } = await supabase.auth.getSession()
      return !error
    } catch {
      return false
    }
  }

  async function triggerSync() {
    const pending = await getPendingCount()
    if (pending === 0) return

    setSyncStatus('syncing')
    setPendingCount(pending)

    try {
      await syncProcessor.processAll()
      setSyncStatus('idle')
      setLastSyncAt(new Date())
    } catch {
      setSyncStatus('error')
    }

    await refreshPendingCount()
  }
}

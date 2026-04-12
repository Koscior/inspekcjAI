/**
 * Wraps a React Query queryFn with offline fallback.
 *
 * When online: runs onlineFn (which should also write-through to Dexie).
 * When offline (or on network error): runs offlineFn (reads from Dexie).
 */
export function withOfflineFallback<T>(
  onlineFn: () => Promise<T>,
  offlineFn: () => Promise<T>,
): () => Promise<T> {
  return async () => {
    if (navigator.onLine) {
      try {
        return await onlineFn()
      } catch (err) {
        if (isNetworkError(err)) {
          return offlineFn()
        }
        throw err
      }
    }
    return offlineFn()
  }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes('fetch')) return true
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    const msg = (err as { message: string }).message.toLowerCase()
    if (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('networkerror')
    ) {
      return true
    }
  }
  return false
}

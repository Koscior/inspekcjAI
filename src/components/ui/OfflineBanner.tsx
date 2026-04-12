import { useState } from 'react'
import { WifiOff, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { useNetworkStore } from '@/store/networkStore'
import { SyncLogModal } from './SyncLogModal'

export function OfflineBanner() {
  const { isOnline, syncStatus, pendingCount } = useNetworkStore()
  const [showSyncLog, setShowSyncLog] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Nothing to show when online with no pending items and no errors
  if (isOnline && syncStatus === 'idle' && pendingCount === 0) return null

  // User dismissed the banner (reappears on status change)
  if (dismissed && isOnline && syncStatus === 'idle') return null

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm shrink-0">
          <WifiOff size={16} />
          <span className="flex-1">
            Tryb offline — zmiany zostaną zsynchronizowane po powrocie do sieci
          </span>
          {pendingCount > 0 && (
            <span className="bg-amber-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount}
            </span>
          )}
        </div>
      )}

      {/* Syncing banner */}
      {isOnline && syncStatus === 'syncing' && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center gap-2 text-sm shrink-0">
          <RefreshCw size={16} className="animate-spin" />
          <span className="flex-1">
            Synchronizacja...
          </span>
          {pendingCount > 0 && (
            <span className="bg-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount}
            </span>
          )}
        </div>
      )}

      {/* Error banner */}
      {isOnline && syncStatus === 'error' && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2 text-sm shrink-0">
          <AlertTriangle size={16} />
          <span className="flex-1">
            Nie udało się zsynchronizować niektórych zmian
          </span>
          <button
            onClick={() => setShowSyncLog(true)}
            className="bg-red-600 hover:bg-red-700 px-3 py-0.5 rounded text-xs font-medium transition-colors"
          >
            Szczegóły
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 hover:bg-red-600 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pending items badge (online, idle, but items remain) */}
      {isOnline && syncStatus === 'idle' && pendingCount > 0 && (
        <div className="bg-gray-100 text-gray-700 px-4 py-2 flex items-center gap-2 text-sm shrink-0">
          <RefreshCw size={16} />
          <span className="flex-1">
            {pendingCount} {pendingCount === 1 ? 'zmiana oczekuje' : 'zmian oczekuje'} na synchronizację
          </span>
          <button
            onClick={() => setShowSyncLog(true)}
            className="text-primary-600 hover:text-primary-700 text-xs font-medium transition-colors"
          >
            Pokaż
          </button>
        </div>
      )}

      {showSyncLog && <SyncLogModal onClose={() => setShowSyncLog(false)} />}
    </>
  )
}

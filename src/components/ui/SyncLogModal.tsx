import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { getFailedItems, retryQueueItem, retryAllFailed, getPendingCount } from '@/lib/syncQueue'
import { useNetworkStore } from '@/store/networkStore'
import { syncProcessor } from '@/lib/syncProcessor'
import type { SyncQueueItem } from '@/lib/offlineDb'

interface SyncLogModalProps {
  onClose: () => void
}

const ENTITY_LABELS: Record<string, string> = {
  inspection: 'Inspekcja',
  client: 'Klient',
  defect: 'Usterka',
  photo: 'Zdjęcie',
  floor_plan: 'Plan budynku',
  pin: 'Pinezka',
  checklist_item: 'Element checklisty',
  voice_note: 'Notatka głosowa',
  report: 'Raport',
}

const OPERATION_LABELS: Record<string, string> = {
  insert: 'Tworzenie',
  update: 'Aktualizacja',
  delete: 'Usuwanie',
}

export function SyncLogModal({ onClose }: SyncLogModalProps) {
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([])
  const [retrying, setRetrying] = useState(false)
  const { setSyncStatus, setPendingCount } = useNetworkStore()

  useEffect(() => {
    loadFailedItems()
  }, [])

  async function loadFailedItems() {
    const items = await getFailedItems()
    setFailedItems(items)
  }

  async function handleRetryOne(id: number) {
    await retryQueueItem(id)
    await loadFailedItems()
    triggerSync()
  }

  async function handleRetryAll() {
    setRetrying(true)
    await retryAllFailed()
    await loadFailedItems()
    await triggerSync()
    setRetrying(false)
  }

  async function triggerSync() {
    const pending = await getPendingCount()
    if (pending === 0) return

    setSyncStatus('syncing')
    setPendingCount(pending)

    try {
      await syncProcessor.processAll()
      setSyncStatus('idle')
    } catch {
      setSyncStatus('error')
    }

    const remaining = await getPendingCount()
    setPendingCount(remaining)
    await loadFailedItems()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Log synchronizacji</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {failedItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Brak błędów synchronizacji</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-red-200 rounded-lg p-3 bg-red-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-900">
                          {OPERATION_LABELS[item.operation] ?? item.operation}{' '}
                          {ENTITY_LABELS[item.entity] ?? item.entity}
                        </span>
                      </div>
                      {item.last_error && (
                        <p className="text-xs text-red-600 mt-1 break-words">
                          {item.last_error}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Prób: {item.retry_count} | {new Date(item.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRetryOne(item.id!)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors shrink-0"
                      title="Ponów"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {failedItems.length > 0 && (
          <div className="px-6 py-4 border-t flex justify-between">
            <button
              onClick={handleRetryAll}
              disabled={retrying}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
            >
              <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
              Ponów wszystkie
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

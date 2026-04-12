import { create } from 'zustand'

export type SyncStatusType = 'idle' | 'syncing' | 'error'

interface NetworkState {
  isOnline: boolean
  syncStatus: SyncStatusType
  pendingCount: number
  lastSyncAt: Date | null
  setOnline: (v: boolean) => void
  setSyncStatus: (v: SyncStatusType) => void
  setPendingCount: (n: number) => void
  setLastSyncAt: (d: Date | null) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncStatus: 'idle',
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}))

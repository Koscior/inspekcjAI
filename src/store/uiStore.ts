import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface UiState {
  sidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: crypto.randomUUID(), duration: toast.duration ?? 4000 },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

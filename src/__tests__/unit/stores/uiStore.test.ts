import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUiStore } from '@/store/uiStore'

// Mock crypto.randomUUID for predictable IDs
vi.stubGlobal('crypto', {
  randomUUID: vi.fn()
    .mockReturnValueOnce('uuid-1')
    .mockReturnValueOnce('uuid-2')
    .mockReturnValueOnce('uuid-3')
    .mockReturnValue('uuid-default'),
})

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarOpen: false, toasts: [] })
    vi.mocked(crypto.randomUUID).mockClear()
      .mockReturnValueOnce('uuid-1')
      .mockReturnValueOnce('uuid-2')
      .mockReturnValueOnce('uuid-3')
      .mockReturnValue('uuid-default')
  })

  // ── Sidebar ───────────────────────────────────────────────────────────────

  it('has sidebar initially closed', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it('toggleSidebar flips the state', () => {
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(true)

    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it('setSidebarOpen sets specific value', () => {
    useUiStore.getState().setSidebarOpen(true)
    expect(useUiStore.getState().sidebarOpen).toBe(true)

    useUiStore.getState().setSidebarOpen(false)
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  // ── Toasts ────────────────────────────────────────────────────────────────

  it('starts with empty toasts', () => {
    expect(useUiStore.getState().toasts).toEqual([])
  })

  it('addToast appends a toast with UUID and default duration', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Zapisano!' })

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toEqual({
      id: 'uuid-1',
      type: 'success',
      message: 'Zapisano!',
      duration: 4000,
    })
  })

  it('addToast respects custom duration', () => {
    useUiStore.getState().addToast({ type: 'error', message: 'Błąd!', duration: 8000 })

    expect(useUiStore.getState().toasts[0]?.duration).toBe(8000)
  })

  it('addToast appends multiple toasts in order', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Pierwszy' })
    useUiStore.getState().addToast({ type: 'error', message: 'Drugi' })

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(2)
    expect(toasts[0]?.message).toBe('Pierwszy')
    expect(toasts[1]?.message).toBe('Drugi')
  })

  it('removeToast removes by id', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Toast 1' })
    const toastsAfterFirst = useUiStore.getState().toasts
    const firstId = toastsAfterFirst[0]!.id

    useUiStore.getState().addToast({ type: 'error', message: 'Toast 2' })

    useUiStore.getState().removeToast(firstId)

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.message).toBe('Toast 2')
  })

  it('removeToast with non-existent id does nothing', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Toast' })
    useUiStore.getState().removeToast('non-existent')

    expect(useUiStore.getState().toasts).toHaveLength(1)
  })
})

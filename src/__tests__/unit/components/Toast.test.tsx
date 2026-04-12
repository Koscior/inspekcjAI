import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastContainer } from '@/components/ui/Toast'
import { useUiStore } from '@/store/uiStore'

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useUiStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toast message', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'success', message: 'Zapisano pomyślnie!', duration: 4000 }],
    })

    render(<ToastContainer />)
    expect(screen.getByText('Zapisano pomyślnie!')).toBeInTheDocument()
  })

  it('renders correct icon for success toast', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'success', message: 'OK', duration: 4000 }],
    })

    const { container } = render(<ToastContainer />)
    // CheckCircle icon has text-green-500 class
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('renders correct icon for error toast', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'error', message: 'Błąd', duration: 4000 }],
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
  })

  it('renders correct icon for warning toast', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'warning', message: 'Uwaga', duration: 4000 }],
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument()
  })

  it('renders correct icon for info toast', () => {
    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'info', message: 'Info', duration: 4000 }],
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
  })

  it('close button removes toast', async () => {
    vi.useRealTimers() // Need real timers for user events
    const user = userEvent.setup()
    const removeToast = vi.fn()

    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'success', message: 'Test', duration: 99999 }],
      removeToast,
    })

    render(<ToastContainer />)

    // Find the close button (X icon button)
    const closeButtons = screen.getAllByRole('button')
    await user.click(closeButtons[0]!)

    expect(removeToast).toHaveBeenCalledWith('toast-1')
  })

  it('renders multiple toasts', () => {
    useUiStore.setState({
      toasts: [
        { id: 'toast-1', type: 'success', message: 'Toast 1', duration: 4000 },
        { id: 'toast-2', type: 'error', message: 'Toast 2', duration: 4000 },
      ],
    })

    render(<ToastContainer />)
    expect(screen.getByText('Toast 1')).toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
  })

  it('auto-dismisses toast after duration', () => {
    const removeToast = vi.fn()

    useUiStore.setState({
      toasts: [{ id: 'toast-1', type: 'info', message: 'Auto', duration: 3000 }],
      removeToast,
    })

    render(<ToastContainer />)

    // Should not have been called yet
    expect(removeToast).not.toHaveBeenCalled()

    // Fast forward past duration
    vi.advanceTimersByTime(3001)

    expect(removeToast).toHaveBeenCalledWith('toast-1')
  })
})

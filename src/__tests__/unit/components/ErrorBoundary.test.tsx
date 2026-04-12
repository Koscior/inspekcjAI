import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Component that throws on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <p>Working correctly</p>
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console errors in test output
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <p>Child content</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Coś poszło nie tak')).toBeInTheDocument()
    expect(screen.getByText(/Wystąpił nieoczekiwany błąd/)).toBeInTheDocument()
  })

  it('shows retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument()
  })

  it('shows reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Strona główna')).toBeInTheDocument()
  })

  it('retry button resets error state', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function ConditionalThrow() {
      if (shouldThrow) throw new Error('boom')
      return <p>Recovered</p>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Coś poszło nie tak')).toBeInTheDocument()

    // Fix the error before retrying
    shouldThrow = false
    await user.click(screen.getByText('Spróbuj ponownie'))

    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  it('reload button navigates to home', async () => {
    const user = userEvent.setup()

    // Mock window.location
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, href: originalHref },
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    await user.click(screen.getByText('Strona główna'))
    expect(window.location.href).toBe('/')
  })
})

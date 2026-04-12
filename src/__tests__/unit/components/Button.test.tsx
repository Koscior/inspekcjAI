import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Zapisz</Button>)
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Kliknij</Button>)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // ── Variants ──────────────────────────────────────────────────────────────

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary-600')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-white')
    expect(btn.className).toContain('border-gray-300')
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button').className).toContain('bg-red-600')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button').className).toContain('bg-transparent')
  })

  // ── Sizes ─────────────────────────────────────────────────────────────────

  it('applies md size classes by default', () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole('button').className).toContain('px-4')
  })

  it('applies xs size classes', () => {
    render(<Button size="xs">XS</Button>)
    expect(screen.getByRole('button').className).toContain('px-2.5')
  })

  // ── Loading ───────────────────────────────────────────────────────────────

  it('shows spinner and disables when loading', () => {
    render(<Button loading>Zapisz</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    // Loader2 icon should be present (animate-spin class)
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('hides rightIcon when loading', () => {
    render(<Button loading rightIcon={<span data-testid="right">R</span>}>Zapisz</Button>)
    expect(screen.queryByTestId('right')).not.toBeInTheDocument()
  })

  // ── Disabled ──────────────────────────────────────────────────────────────

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)

    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  // ── Icons ─────────────────────────────────────────────────────────────────

  it('renders leftIcon', () => {
    render(<Button leftIcon={<span data-testid="left-icon">L</span>}>With Icon</Button>)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('renders rightIcon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">R</span>}>With Icon</Button>)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  // ── Ref forwarding ────────────────────────────────────────────────────────

  it('forwards ref to button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  // ── displayName ───────────────────────────────────────────────────────────

  it('has displayName set', () => {
    expect(Button.displayName).toBe('Button')
  })
})

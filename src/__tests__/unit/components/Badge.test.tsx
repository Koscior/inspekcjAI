import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('applies default gray color', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default').className).toContain('bg-gray-100')
  })

  it('applies specified color', () => {
    render(<Badge color="red">Red</Badge>)
    expect(screen.getByText('Red').className).toContain('bg-red-100')
  })

  it('renders dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot color="green">Dot</Badge>)
    const dot = container.querySelector('.rounded-full.bg-green-500')
    expect(dot).toBeInTheDocument()
  })

  it('applies sm size by default', () => {
    render(<Badge>Small</Badge>)
    expect(screen.getByText('Small').className).toContain('text-xs')
  })

  it('applies md size', () => {
    render(<Badge size="md">Medium</Badge>)
    expect(screen.getByText('Medium').className).toContain('text-sm')
  })
})

describe('SeverityBadge', () => {
  it('renders critical with red color and Polish label', () => {
    render(<SeverityBadge severity="critical" />)
    const badge = screen.getByText('Krytyczna')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-red-100')
  })

  it('renders serious with orange color', () => {
    render(<SeverityBadge severity="serious" />)
    const badge = screen.getByText('Poważna')
    expect(badge.className).toContain('bg-orange-100')
  })

  it('renders minor with yellow color', () => {
    render(<SeverityBadge severity="minor" />)
    const badge = screen.getByText('Drobna')
    expect(badge.className).toContain('bg-yellow-100')
  })
})

describe('StatusBadge', () => {
  it('renders all known statuses with correct labels', () => {
    const cases: Array<{ status: string; label: string }> = [
      { status: 'draft', label: 'Szkic' },
      { status: 'in_progress', label: 'W trakcie' },
      { status: 'completed', label: 'Zakończona' },
      { status: 'sent', label: 'Wysłana' },
      { status: 'open', label: 'Otwarte' },
      { status: 'closed', label: 'Zamknięte' },
    ]

    for (const { status, label } of cases) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('falls back to raw status text for unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })

  it('falls back to gray color for unknown status', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('unknown').className).toContain('bg-gray-100')
  })
})

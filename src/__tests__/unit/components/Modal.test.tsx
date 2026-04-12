import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  }

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays title', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('displays children content', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    // The close button has an X icon
    const buttons = screen.getByRole('dialog').parentElement!.querySelectorAll('button')
    const closeBtn = buttons[0]! // First button in the header
    fireEvent.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on overlay click', () => {
    const onClose = vi.fn()
    const { container } = render(<Modal {...defaultProps} onClose={onClose} />)

    // The overlay is the outer fixed div
    const overlay = container.querySelector('.fixed.inset-0')!
    fireEvent.click(overlay)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on overlay click when closeOnOverlay is false', () => {
    const onClose = vi.fn()
    const { container } = render(<Modal {...defaultProps} onClose={onClose} closeOnOverlay={false} />)

    const overlay = container.querySelector('.fixed.inset-0')!
    fireEvent.click(overlay)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('locks body scroll when open', () => {
    render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<Modal {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('renders footer when provided', () => {
    render(<Modal {...defaultProps} footer={<button>Save</button>} />)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('has aria-modal attribute', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})

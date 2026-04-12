import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Input, Textarea, Select } from '@/components/ui/Input'

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Wpisz..." />)
    expect(screen.getByPlaceholderText('Wpisz...')).toBeInTheDocument()
  })

  it('renders label with htmlFor association', () => {
    render(<Input label="Email" />)
    const label = screen.getByText('Email')
    const input = screen.getByLabelText('Email')
    expect(label).toBeInTheDocument()
    expect(input).toBeInTheDocument()
  })

  it('generates id from label text', () => {
    render(<Input label="Numer telefonu" />)
    const input = screen.getByLabelText('Numer telefonu')
    expect(input.id).toBe('numer-telefonu')
  })

  it('uses provided id over generated one', () => {
    render(<Input label="Email" id="custom-id" />)
    expect(screen.getByLabelText('Email').id).toBe('custom-id')
  })

  it('shows error message in red', () => {
    render(<Input error="Pole wymagane" />)
    const error = screen.getByText('Pole wymagane')
    expect(error).toBeInTheDocument()
    expect(error.className).toContain('text-red-600')
  })

  it('shows hint when no error', () => {
    render(<Input hint="Podpowiedź" />)
    expect(screen.getByText('Podpowiedź')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<Input hint="Podpowiedź" error="Błąd" />)
    expect(screen.queryByText('Podpowiedź')).not.toBeInTheDocument()
    expect(screen.getByText('Błąd')).toBeInTheDocument()
  })

  it('applies error border styles when error is present', () => {
    render(<Input error="Błąd" />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('border-red-300')
  })

  it('shows required asterisk', () => {
    render(<Input label="Imię" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders leftAddon', () => {
    render(<Input leftAddon={<span data-testid="addon">@</span>} />)
    expect(screen.getByTestId('addon')).toBeInTheDocument()
  })

  it('renders rightAddon', () => {
    render(<Input rightAddon={<span data-testid="addon">zł</span>} />)
    expect(screen.getByTestId('addon')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('has displayName set', () => {
    expect(Input.displayName).toBe('Input')
  })
})

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Opis" />)
    expect(screen.getByLabelText('Opis')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Textarea error="Za krótki opis" />)
    expect(screen.getByText('Za krótki opis')).toBeInTheDocument()
  })

  it('has displayName set', () => {
    expect(Textarea.displayName).toBe('Textarea')
  })
})

describe('Select', () => {
  it('renders options from array', () => {
    const options = [
      { value: 'a', label: 'Opcja A' },
      { value: 'b', label: 'Opcja B' },
    ]
    render(<Select label="Typ" options={options} />)
    expect(screen.getByLabelText('Typ')).toBeInTheDocument()
    expect(screen.getByText('Opcja A')).toBeInTheDocument()
    expect(screen.getByText('Opcja B')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    render(<Select placeholder="Wybierz..." options={[]} />)
    expect(screen.getByText('Wybierz...')).toBeInTheDocument()
  })

  it('has displayName set', () => {
    expect(Select.displayName).toBe('Select')
  })
})

import { describe, it, expect } from 'vitest'
import { clientSchema } from '@/pages/clients/clientSchema'

const validClient = {
  full_name: 'Anna Nowak',
}

describe('clientSchema', () => {
  it('accepts a valid minimal client (only full_name)', () => {
    const result = clientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  it('accepts a full client with all fields', () => {
    const result = clientSchema.safeParse({
      full_name: 'Anna Nowak',
      email: 'anna@example.com',
      phone: '+48111222333',
      address: 'ul. Testowa 1, 00-001 Warszawa',
      notes: 'Stały klient',
    })
    expect(result.success).toBe(true)
  })

  // ── full_name validation ──────────────────────────────────────────────────

  it('rejects empty full_name', () => {
    const result = clientSchema.safeParse({ full_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects full_name with 1 character', () => {
    const result = clientSchema.safeParse({ full_name: 'A' })
    expect(result.success).toBe(false)
  })

  it('accepts full_name with 2 characters (boundary)', () => {
    const result = clientSchema.safeParse({ full_name: 'AB' })
    expect(result.success).toBe(true)
  })

  it('provides Polish error message for short full_name', () => {
    const result = clientSchema.safeParse({ full_name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('minimum 2 znaki')
    }
  })

  // ── email validation ──────────────────────────────────────────────────────

  it('accepts valid email', () => {
    const result = clientSchema.safeParse({ ...validClient, email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = clientSchema.safeParse({ ...validClient, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for email (optional)', () => {
    const result = clientSchema.safeParse({ ...validClient, email: '' })
    expect(result.success).toBe(true)
  })

  it('accepts omitted email', () => {
    const result = clientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  // ── optional fields ───────────────────────────────────────────────────────

  it('accepts all optional fields as undefined', () => {
    const result = clientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeUndefined()
      expect(result.data.phone).toBeUndefined()
      expect(result.data.address).toBeUndefined()
      expect(result.data.notes).toBeUndefined()
    }
  })
})

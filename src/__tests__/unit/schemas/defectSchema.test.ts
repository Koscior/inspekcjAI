import { describe, it, expect } from 'vitest'
import { defectSchema } from '@/pages/inspections/defectSchema'

const validDefect = {
  title: 'Rysy na ścianie',
  type: 'usterka' as const,
  severity: 'serious' as const,
  status: 'open' as const,
}

describe('defectSchema', () => {
  it('accepts a valid minimal defect', () => {
    const result = defectSchema.safeParse(validDefect)
    expect(result.success).toBe(true)
  })

  it('accepts a full defect with all optional fields', () => {
    const result = defectSchema.safeParse({
      ...validDefect,
      description: 'Opis usterki',
      category: 'Ściany',
      custom_category: 'Niestandardowa',
      contractor: 'Firma ABC',
      responsible_person: 'Jan Kowalski',
      deadline: '2025-06-01',
      location_label: 'Piętro 2, pokój 201',
      floor_plan_id: 'fp-1',
    })
    expect(result.success).toBe(true)
  })

  // ── Title validation ──────────────────────────────────────────────────────

  it('rejects empty title', () => {
    const result = defectSchema.safeParse({ ...validDefect, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title with only 1 character', () => {
    const result = defectSchema.safeParse({ ...validDefect, title: 'A' })
    expect(result.success).toBe(false)
  })

  it('accepts title with 2 characters (boundary)', () => {
    const result = defectSchema.safeParse({ ...validDefect, title: 'AB' })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const { title: _, ...noTitle } = validDefect
    const result = defectSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  // ── Type validation ───────────────────────────────────────────────────────

  it('accepts all valid types', () => {
    for (const type of ['usterka', 'uwaga', 'zalecenie'] as const) {
      const result = defectSchema.safeParse({ ...validDefect, type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid type', () => {
    const result = defectSchema.safeParse({ ...validDefect, type: 'invalid' })
    expect(result.success).toBe(false)
  })

  // ── Severity validation ───────────────────────────────────────────────────

  it('accepts all valid severities', () => {
    for (const severity of ['critical', 'serious', 'minor'] as const) {
      const result = defectSchema.safeParse({ ...validDefect, severity })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid severity', () => {
    const result = defectSchema.safeParse({ ...validDefect, severity: 'low' })
    expect(result.success).toBe(false)
  })

  // ── Status validation ─────────────────────────────────────────────────────

  it('accepts all valid statuses', () => {
    for (const status of ['open', 'in_progress', 'closed'] as const) {
      const result = defectSchema.safeParse({ ...validDefect, status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = defectSchema.safeParse({ ...validDefect, status: 'pending' })
    expect(result.success).toBe(false)
  })

  // ── Optional fields ───────────────────────────────────────────────────────

  it('accepts all optional fields as undefined', () => {
    const result = defectSchema.safeParse(validDefect)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
      expect(result.data.category).toBeUndefined()
      expect(result.data.contractor).toBeUndefined()
      expect(result.data.deadline).toBeUndefined()
    }
  })

  it('provides Polish error message for short title', () => {
    const result = defectSchema.safeParse({ ...validDefect, title: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toContain('minimum 2 znaki')
    }
  })
})

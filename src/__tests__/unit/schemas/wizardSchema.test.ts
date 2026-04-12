import { describe, it, expect } from 'vitest'
import { wizardSchema } from '@/pages/inspections/NewInspectionPage'

const validMinimal = {
  type: 'roczny' as const,
  title: 'Przegląd roczny',
  address: 'ul. Testowa 1, Warszawa',
  client_mode: 'none' as const,
}

describe('wizardSchema', () => {
  // ── Minimal valid data ────────────────────────────────────────────────────

  it('accepts minimal valid data', () => {
    const result = wizardSchema.safeParse(validMinimal)
    expect(result.success).toBe(true)
  })

  it('accepts full data with all fields', () => {
    const result = wizardSchema.safeParse({
      ...validMinimal,
      city: 'Warszawa',
      building_type: 'mieszkalny',
      construction_type: 'murowana',
      year_built: '2010',
      floor_or_unit: '3/15',
      powierzchnia_zabudowy: '200',
      powierzchnia_uzytkowa: '180',
      kubatura: '600',
      kondygnacje_nadziemne: '3',
      kondygnacje_podziemne: '1',
      client_mode: 'existing' as const,
      client_id: 'client-1',
      owner_name: 'Jan Kowalski',
      owner_address: 'ul. Właściciela 5',
      owner_phone: '+48123456789',
      owner_email: 'jan@example.com',
      manager_name: 'Anna Nowak',
      investor_name: 'Inwestor Sp. z o.o.',
      contractor_name: 'Budowlani S.A.',
      inspection_date: '2025-06-15',
      next_inspection_date: '2026-06-15',
      notes: 'Uwagi do inspekcji',
    })
    expect(result.success).toBe(true)
  })

  // ── Step 1: type ──────────────────────────────────────────────────────────

  it('accepts all valid inspection types', () => {
    const types = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw', 'odbior_mieszkania', 'ogolna'] as const
    for (const type of types) {
      const result = wizardSchema.safeParse({ ...validMinimal, type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid inspection type', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects missing type', () => {
    const { type: _, ...noType } = validMinimal
    const result = wizardSchema.safeParse(noType)
    expect(result.success).toBe(false)
  })

  // ── Step 2: title ─────────────────────────────────────────────────────────

  it('rejects empty title', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title with 1 character', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, title: 'A' })
    expect(result.success).toBe(false)
  })

  it('accepts title with 2 characters (boundary)', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, title: 'AB' })
    expect(result.success).toBe(true)
  })

  // ── Step 2: address ───────────────────────────────────────────────────────

  it('rejects empty address', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, address: '' })
    expect(result.success).toBe(false)
  })

  it('rejects address with 2 characters', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, address: 'AB' })
    expect(result.success).toBe(false)
  })

  it('accepts address with 3 characters (boundary)', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, address: 'ABC' })
    expect(result.success).toBe(true)
  })

  // ── Step 2: playground-specific fields ────────────────────────────────────

  it('accepts playground-specific fields for plac_zabaw type', () => {
    const result = wizardSchema.safeParse({
      ...validMinimal,
      type: 'plac_zabaw',
      pg_nazwa: 'Plac Zabaw przy Szkole nr 5',
      pg_liczba_urzadzen: '12',
      pg_rodzaje_urzadzen: 'huśtawki, zjeżdżalnie, karuzela',
      pg_material_urzadzen: 'drewno, metal',
      pg_nawierzchnia: 'piasek',
      pg_nawierzchnia_pod_urzadzeniami: 'piasek z matami',
      pg_mocowanie_urzadzen: 'betonowe fundamenty',
      pg_ogrodzenie: 'metalowe, wys. 1.2m',
      pg_naslonecznienie: 'częściowe zacienienie',
    })
    expect(result.success).toBe(true)
  })

  it('accepts playground fields as optional (can be omitted)', () => {
    const result = wizardSchema.safeParse({
      ...validMinimal,
      type: 'plac_zabaw',
    })
    expect(result.success).toBe(true)
  })

  // ── Step 3: client_mode ───────────────────────────────────────────────────

  it('accepts all valid client modes', () => {
    for (const client_mode of ['existing', 'new', 'none'] as const) {
      const result = wizardSchema.safeParse({ ...validMinimal, client_mode })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid client_mode', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, client_mode: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts new client fields when client_mode is new', () => {
    const result = wizardSchema.safeParse({
      ...validMinimal,
      client_mode: 'new',
      new_client_name: 'Nowy Klient',
      new_client_email: 'nowy@example.com',
      new_client_phone: '+48999888777',
    })
    expect(result.success).toBe(true)
  })

  // ── Step 4: extra fields ──────────────────────────────────────────────────

  it('accepts all step 4 fields as optional', () => {
    const result = wizardSchema.safeParse(validMinimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.owner_name).toBeUndefined()
      expect(result.data.manager_name).toBeUndefined()
      expect(result.data.inspection_date).toBeUndefined()
    }
  })

  // ── Polish error messages ─────────────────────────────────────────────────

  it('provides Polish error for short title', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, title: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toContain('minimum 2 znaki')
    }
  })

  it('provides Polish error for short address', () => {
    const result = wizardSchema.safeParse({ ...validMinimal, address: 'AB' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const addressError = result.error.issues.find((i) => i.path.includes('address'))
      expect(addressError?.message).toContain('adres')
    }
  })
})

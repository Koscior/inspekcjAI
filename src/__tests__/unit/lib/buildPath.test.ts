import { describe, it, expect } from 'vitest'
import { buildPath, ROUTES } from '@/router/routePaths'

describe('buildPath', () => {
  it('replaces single param', () => {
    expect(buildPath(ROUTES.INSPECTION_DETAIL, { id: 'abc-123' }))
      .toBe('/inspections/abc-123')
  })

  it('replaces multiple params', () => {
    expect(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, { id: 'insp-1', defectId: 'def-1' }))
      .toBe('/inspections/insp-1/defects/def-1')
  })

  it('returns path unchanged when no params provided', () => {
    expect(buildPath(ROUTES.DASHBOARD)).toBe('/')
  })

  it('returns path unchanged when empty params', () => {
    expect(buildPath(ROUTES.INSPECTIONS, {})).toBe('/inspections')
  })

  it('leaves unmatched param placeholders intact', () => {
    expect(buildPath('/test/:unknown', { id: '123' })).toBe('/test/:unknown')
  })

  it('handles PHOTO_ANNOTATE with two different param names', () => {
    expect(buildPath(ROUTES.PHOTO_ANNOTATE, { inspectionId: 'insp-1', photoId: 'photo-1' }))
      .toBe('/inspections/insp-1/photos/photo-1/annotate')
  })
})

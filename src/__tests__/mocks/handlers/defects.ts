import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

const MOCK_DEFECTS = [
  {
    id: 'defect-1',
    inspection_id: 'insp-1',
    number: 1,
    title: 'Rysy na ścianie',
    description: 'Widoczne zarysowania na ścianie wschodniej',
    type: 'usterka',
    severity: 'serious',
    category: 'Ściany',
    status: 'open',
    contractor: null,
    deadline: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    photos: [],
    pins: [],
  },
  {
    id: 'defect-2',
    inspection_id: 'insp-1',
    number: 2,
    title: 'Nieszczelne okno',
    description: 'Okno w salonie nie domyka się',
    type: 'usterka',
    severity: 'critical',
    category: 'Stolarka okienna',
    status: 'open',
    contractor: null,
    deadline: null,
    created_at: '2025-01-15T11:00:00Z',
    updated_at: '2025-01-15T11:00:00Z',
    photos: [],
    pins: [],
  },
]

export const defectHandlers = [
  http.get(`${BASE}/rest/v1/defects`, ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')

    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      const defect = MOCK_DEFECTS.find((d) => d.id === id)
      if (defect) return HttpResponse.json(defect)
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }

    return HttpResponse.json(MOCK_DEFECTS)
  }),

  http.post(`${BASE}/rest/v1/defects`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'defect-new',
      number: 3,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${BASE}/rest/v1/defects`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      ...MOCK_DEFECTS[0],
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/rest/v1/defects`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

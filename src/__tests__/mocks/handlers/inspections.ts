import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

const MOCK_INSPECTIONS = [
  {
    id: 'insp-1',
    user_id: 'user-123',
    client_id: 'client-1',
    type: 'roczny',
    status: 'draft',
    title: 'Przegląd roczny budynku',
    address: 'ul. Testowa 1, Warszawa',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    clients: { id: 'client-1', full_name: 'Anna Nowak', email: 'anna@example.com', phone: null },
    defects: [{ count: 3 }],
  },
  {
    id: 'insp-2',
    user_id: 'user-123',
    client_id: null,
    type: 'odbior_mieszkania',
    status: 'in_progress',
    title: 'Odbiór mieszkania przy Mokotowskiej',
    address: 'ul. Mokotowska 10/5, Warszawa',
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-01-12T14:00:00Z',
    clients: null,
    defects: [{ count: 0 }],
  },
]

export const inspectionHandlers = [
  // List inspections
  http.get(`${BASE}/rest/v1/inspections`, ({ request }) => {
    const url = new URL(request.url)
    const select = url.searchParams.get('select')

    // Single inspection fetch (has .single() → expects object)
    const idFilter = url.searchParams.get('id')
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      const inspection = MOCK_INSPECTIONS.find((i) => i.id === id)
      if (inspection) return HttpResponse.json(inspection)
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }

    // Check for count-only query
    if (select === '*' && url.searchParams.get('head') === 'true') {
      return new HttpResponse(null, {
        status: 200,
        headers: { 'content-range': `0-0/${MOCK_INSPECTIONS.length}` },
      })
    }

    return HttpResponse.json(MOCK_INSPECTIONS)
  }),

  // Create inspection
  http.post(`${BASE}/rest/v1/inspections`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'insp-new',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  // Update inspection
  http.patch(`${BASE}/rest/v1/inspections`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'insp-1',
      ...MOCK_INSPECTIONS[0],
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  // Delete inspection
  http.delete(`${BASE}/rest/v1/inspections`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

const MOCK_CLIENTS = [
  {
    id: 'client-1',
    user_id: 'user-123',
    full_name: 'Anna Nowak',
    email: 'anna@example.com',
    phone: '+48111222333',
    address: 'ul. Testowa 1, 00-001 Warszawa',
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    inspections: [{ count: 2 }],
  },
  {
    id: 'client-2',
    user_id: 'user-123',
    full_name: 'Piotr Wiśniewski',
    email: 'piotr@example.com',
    phone: null,
    address: null,
    notes: 'Stały klient',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
    inspections: [{ count: 1 }],
  },
]

export const clientHandlers = [
  http.get(`${BASE}/rest/v1/clients`, ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')

    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      const client = MOCK_CLIENTS.find((c) => c.id === id)
      if (client) return HttpResponse.json(client)
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }

    return HttpResponse.json(MOCK_CLIENTS)
  }),

  http.post(`${BASE}/rest/v1/clients`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'client-new',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${BASE}/rest/v1/clients`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      ...MOCK_CLIENTS[0],
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/rest/v1/clients`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

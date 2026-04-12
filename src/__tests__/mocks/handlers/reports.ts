import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

const MOCK_REPORTS = [
  {
    id: 'report-1',
    inspection_id: 'insp-1',
    report_number: 'INS/2025/001',
    report_type: 'techniczny',
    pdf_path: 'user-123/insp-1/techniczny_1705312800000.pdf',
    inspector_signature_url: null,
    client_signature_url: null,
    client_signed_at: null,
    version: 1,
    sent_at: null,
    recipient_email: null,
    created_at: '2025-01-15T12:00:00Z',
    inspections: { title: 'Przegląd roczny budynku', address: 'ul. Testowa 1', type: 'roczny' },
  },
]

export const reportHandlers = [
  http.get(`${BASE}/rest/v1/reports`, () => {
    return HttpResponse.json(MOCK_REPORTS)
  }),

  http.post(`${BASE}/rest/v1/reports`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'report-new',
      ...body,
      version: 1,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  // RPC for report number
  http.post(`${BASE}/rest/v1/rpc/generate_report_number`, () => {
    return HttpResponse.json('INS/2025/002')
  }),
]

import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

const MOCK_PROFILE = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Jan Kowalski',
  role: 'inspector',
  company_id: null,
  company_name: null,
  license_number: 'BUD/12345',
  poiib_number: 'MAZ/1234',
  phone: '+48123456789',
  logo_url: null,
  signature_url: null,
  cert_urls: [],
  subscription_plan: 'free',
  onboarding_complete: true,
  reports_used_this_month: 0,
  reports_reset_at: '2025-02-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
}

export const profileHandlers = [
  http.get(`${BASE}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')

    if (idFilter) {
      return HttpResponse.json(MOCK_PROFILE)
    }

    return HttpResponse.json([MOCK_PROFILE])
  }),

  http.patch(`${BASE}/rest/v1/profiles`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      ...MOCK_PROFILE,
      ...body,
    })
  }),
]

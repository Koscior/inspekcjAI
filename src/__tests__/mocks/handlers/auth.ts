import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

export const authHandlers = [
  // Sign in with password
  http.post(`${BASE}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url)
    const grantType = url.searchParams.get('grant_type')

    if (grantType === 'password') {
      const body = await request.json() as { email: string; password: string }

      if (body.email === 'test@example.com' && body.password === 'password123') {
        return HttpResponse.json({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: { full_name: 'Jan Kowalski' },
          },
        })
      }

      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid login credentials' },
        { status: 400 },
      )
    }

    return HttpResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }),

  // Sign up
  http.post(`${BASE}/auth/v1/signup`, async () => {
    return HttpResponse.json({
      id: 'new-user-123',
      email: 'new@example.com',
      user_metadata: { full_name: 'Nowy Użytkownik' },
    })
  }),

  // Sign out
  http.post(`${BASE}/auth/v1/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Get session
  http.get(`${BASE}/auth/v1/session`, () => {
    return HttpResponse.json({ data: { session: null } })
  }),
]

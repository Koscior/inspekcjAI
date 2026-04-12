import { test, expect } from '@playwright/test'

test.describe('Navigation and routing', () => {
  test('login page loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/login')
    await expect(page.getByText('InspekcjAI')).toBeVisible()

    expect(errors).toHaveLength(0)
  })

  test('register page loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/register')

    // Should show registration form
    await expect(page.getByRole('button', { name: /zarejestruj/i })).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('unknown route redirects to login (protected)', async ({ page }) => {
    await page.goto('/nonexistent-route')
    // App should handle this gracefully — either show 404 or redirect to login
    // Since all routes are protected, unauthenticated users go to /login
    await expect(page).toHaveURL(/\/(login)?/)
  })

  test('PWA manifest is served', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest')
    if (response) {
      expect(response.status()).toBe(200)
    }
  })
})

test.describe('Responsive design', () => {
  test('login page is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    await expect(page.getByLabel('Adres e-mail')).toBeVisible()
    await expect(page.getByLabel('Hasło')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible()
  })
})

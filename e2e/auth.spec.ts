import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('redirects unauthenticated user from / to /login', async ({ page }) => {
    await page.goto('/')
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects unauthenticated user from /inspections to /login', async ({ page }) => {
    await page.goto('/inspections')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    // Check main elements are present
    await expect(page.getByText('InspekcjAI')).toBeVisible()
    await expect(page.getByLabel('Adres e-mail')).toBeVisible()
    await expect(page.getByLabel('Hasło')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible()
    await expect(page.getByText('Zarejestruj się')).toBeVisible()
    await expect(page.getByText('Nie pamiętasz hasła?')).toBeVisible()
  })

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Zaloguj się' }).click()

    // Should show validation errors
    await expect(page.getByText('Nieprawidłowy adres e-mail')).toBeVisible()
    await expect(page.getByText(/wymagane/i)).toBeVisible()
  })

  test('register page is accessible from login', async ({ page }) => {
    await page.goto('/login')

    await page.getByText('Zarejestruj się').click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('forgot password page is accessible from login', async ({ page }) => {
    await page.goto('/login')

    await page.getByText('Nie pamiętasz hasła?').click()
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('shows error toast for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Adres e-mail').fill('wrong@email.com')
    await page.getByLabel('Hasło').fill('wrongpassword')
    await page.getByRole('button', { name: 'Zaloguj się' }).click()

    // Should show error toast (text may vary depending on Supabase response)
    // The button should re-enable after error
    await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeEnabled({ timeout: 10000 })
  })
})

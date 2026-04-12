import { test, expect } from '@playwright/test'

test.describe('Accessibility basics', () => {
  test('login page has proper heading structure', async ({ page }) => {
    await page.goto('/login')

    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText('InspekcjAI')
  })

  test('login form inputs have associated labels', async ({ page }) => {
    await page.goto('/login')

    // All form inputs should be accessible by label
    const emailInput = page.getByLabel('Adres e-mail')
    const passwordInput = page.getByLabel('Hasło')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    // Inputs should have proper types
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('login form inputs have autocomplete attributes', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('Adres e-mail')).toHaveAttribute('autocomplete', 'email')
    await expect(page.getByLabel('Hasło')).toHaveAttribute('autocomplete', 'current-password')
  })

  test('login button is keyboard accessible', async ({ page }) => {
    await page.goto('/login')

    // Tab through form fields
    await page.getByLabel('Adres e-mail').focus()
    await page.keyboard.press('Tab') // Move to password
    await page.keyboard.press('Tab') // Move to forgot password link
    await page.keyboard.press('Tab') // Move to submit button

    const submitButton = page.getByRole('button', { name: 'Zaloguj się' })
    await expect(submitButton).toBeFocused()
  })

  test('page has meta viewport tag for mobile', async ({ page }) => {
    await page.goto('/login')

    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/)
  })
})

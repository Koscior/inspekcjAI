import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
import { createMockUser, createMockProfile } from '../../test-utils'

function renderProtectedRoute(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>Protected content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
    })
  })

  it('shows spinner when not initialized', () => {
    useAuthStore.setState({ isInitialized: false })
    renderProtectedRoute()

    expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to login when initialized but no user', () => {
    useAuthStore.setState({ isInitialized: true, user: null })
    renderProtectedRoute()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to onboarding when user has not completed onboarding', () => {
    useAuthStore.setState({
      isInitialized: true,
      user: createMockUser(),
      profile: createMockProfile({ onboarding_complete: false }),
    })
    renderProtectedRoute()

    expect(screen.getByText('Onboarding page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated and onboarding is complete', () => {
    useAuthStore.setState({
      isInitialized: true,
      user: createMockUser(),
      profile: createMockProfile({ onboarding_complete: true }),
    })
    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when user exists but profile is null (not yet loaded)', () => {
    useAuthStore.setState({
      isInitialized: true,
      user: createMockUser(),
      profile: null,
    })
    renderProtectedRoute()

    // Profile is null → no onboarding redirect condition met → renders children
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})

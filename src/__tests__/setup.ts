import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers and clean up after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()

  // Reset Zustand stores to prevent state leakage
  useAuthStore.setState({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isInitialized: false,
  })
  useUiStore.setState({
    sidebarOpen: false,
    toasts: [],
  })
})

// Clean up after all tests
afterAll(() => server.close())

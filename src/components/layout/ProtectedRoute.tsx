import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PageSpinner } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isInitialized, isLoading, profile } = useAuthStore()
  const location = useLocation()

  if (!isInitialized || isLoading) {
    return <PageSpinner label="Ładowanie..." />
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Redirect to onboarding if not complete
  if (profile && !profile.onboarding_complete && location.pathname !== ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.ONBOARDING} replace />
  }

  return <>{children}</>
}

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PageSpinner } from '@/components/ui'
import { ROUTES } from './routePaths'

// Lazy-loaded pages
const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage   = lazy(() => import('@/pages/auth/RegisterPage'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'))
const DashboardPage  = lazy(() => import('@/pages/dashboard/DashboardPage'))

// Placeholders for future pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-500 mt-2">Ta sekcja jest w trakcie budowy...</p>
  </div>
)

const wrap = (element: React.ReactNode) => (
  <Suspense fallback={<PageSpinner />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    path: ROUTES.LOGIN,
    element: wrap(<LoginPage />),
  },
  {
    path: ROUTES.REGISTER,
    element: wrap(<RegisterPage />),
  },
  {
    path: ROUTES.ONBOARDING,
    element: wrap(<OnboardingPage />),
  },

  // Protected app routes
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: wrap(<DashboardPage />),
      },
      {
        path: ROUTES.INSPECTIONS,
        element: wrap(<PlaceholderPage title="Inspekcje" />),
      },
      {
        path: ROUTES.INSPECTION_NEW,
        element: wrap(<PlaceholderPage title="Nowa inspekcja" />),
      },
      {
        path: ROUTES.INSPECTION_DETAIL,
        element: wrap(<PlaceholderPage title="Szczegóły inspekcji" />),
      },
      {
        path: ROUTES.CLIENTS,
        element: wrap(<PlaceholderPage title="Klienci" />),
      },
      {
        path: ROUTES.CLIENT_NEW,
        element: wrap(<PlaceholderPage title="Nowy klient" />),
      },
      {
        path: ROUTES.CLIENT_DETAIL,
        element: wrap(<PlaceholderPage title="Szczegóły klienta" />),
      },
      {
        path: ROUTES.REPORTS,
        element: wrap(<PlaceholderPage title="Raporty" />),
      },
      {
        path: ROUTES.SETTINGS,
        element: wrap(<PlaceholderPage title="Ustawienia" />),
      },
      {
        path: ROUTES.SUBSCRIPTION,
        element: wrap(<PlaceholderPage title="Subskrypcja" />),
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])

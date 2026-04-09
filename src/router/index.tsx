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
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const InspectionsPage    = lazy(() => import('@/pages/inspections/InspectionsPage'))
const NewInspectionPage       = lazy(() => import('@/pages/inspections/NewInspectionPage'))
const InspectionDetailPage    = lazy(() => import('@/pages/inspections/InspectionDetailPage'))
const ClientsPage             = lazy(() => import('@/pages/clients/ClientsPage'))
const NewClientPage           = lazy(() => import('@/pages/clients/NewClientPage'))
const ClientDetailPage        = lazy(() => import('@/pages/clients/ClientDetailPage'))
const EditClientPage          = lazy(() => import('@/pages/clients/EditClientPage'))

// Phase 3 pages
const DefectsPage         = lazy(() => import('@/pages/inspections/DefectsPage'))
const NewDefectPage       = lazy(() => import('@/pages/inspections/NewDefectPage'))
const DefectDetailPage    = lazy(() => import('@/pages/inspections/DefectDetailPage'))
const EditDefectPage      = lazy(() => import('@/pages/inspections/EditDefectPage'))
const EditInspectionPage  = lazy(() => import('@/pages/inspections/EditInspectionPage'))
const PhotosPage          = lazy(() => import('@/pages/inspections/PhotosPage'))
const PhotoAnnotatePage   = lazy(() => import('@/pages/inspections/PhotoAnnotatePage'))
const FloorPlansPage      = lazy(() => import('@/pages/inspections/FloorPlansPage'))
const ChecklistPage       = lazy(() => import('@/pages/inspections/ChecklistPage'))
const BuildingDocsPage    = lazy(() => import('@/pages/inspections/BuildingDocsPage'))
const ReportPage          = lazy(() => import('@/pages/inspections/ReportPage'))
const MorePage            = lazy(() => import('@/pages/inspections/MorePage'))

// Reports page
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))

// Settings page
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const CompanyProfilePage = lazy(() => import('@/pages/settings/CompanyProfilePage'))

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
        element: wrap(<InspectionsPage />),
      },
      {
        path: ROUTES.INSPECTION_NEW,
        element: wrap(<NewInspectionPage />),
      },
      {
        path: ROUTES.INSPECTION_DETAIL,
        element: wrap(<InspectionDetailPage />),
      },
      {
        path: ROUTES.INSPECTION_EDIT,
        element: wrap(<EditInspectionPage />),
      },
      {
        path: ROUTES.CLIENTS,
        element: wrap(<ClientsPage />),
      },
      {
        path: ROUTES.CLIENT_NEW,
        element: wrap(<NewClientPage />),
      },
      {
        path: ROUTES.CLIENT_DETAIL,
        element: wrap(<ClientDetailPage />),
      },
      {
        path: ROUTES.CLIENT_EDIT,
        element: wrap(<EditClientPage />),
      },
      // Phase 3 routes
      {
        path: ROUTES.INSPECTION_DEFECTS,
        element: wrap(<DefectsPage />),
      },
      {
        path: ROUTES.INSPECTION_DEFECT_NEW,
        element: wrap(<NewDefectPage />),
      },
      {
        path: ROUTES.INSPECTION_DEFECT_DETAIL,
        element: wrap(<DefectDetailPage />),
      },
      {
        path: ROUTES.INSPECTION_DEFECT_EDIT,
        element: wrap(<EditDefectPage />),
      },
      {
        path: ROUTES.INSPECTION_PHOTOS,
        element: wrap(<PhotosPage />),
      },
      {
        path: ROUTES.PHOTO_ANNOTATE,
        element: wrap(<PhotoAnnotatePage />),
      },
      {
        path: ROUTES.INSPECTION_FLOORPLANS,
        element: wrap(<FloorPlansPage />),
      },
      {
        path: ROUTES.INSPECTION_CHECKLIST,
        element: wrap(<ChecklistPage />),
      },
      {
        path: ROUTES.INSPECTION_BUILDING_DOCS,
        element: wrap(<BuildingDocsPage />),
      },
      {
        path: ROUTES.INSPECTION_REPORT,
        element: wrap(<ReportPage />),
      },
      {
        path: ROUTES.INSPECTION_MORE,
        element: wrap(<MorePage />),
      },
      {
        path: ROUTES.REPORTS,
        element: wrap(<ReportsPage />),
      },
      {
        path: ROUTES.COMPANY_PROFILE,
        element: wrap(<CompanyProfilePage />),
      },
      {
        path: ROUTES.SETTINGS,
        element: wrap(<SettingsPage />),
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

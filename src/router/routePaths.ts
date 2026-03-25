export const ROUTES = {
  // Auth
  LOGIN:        '/login',
  REGISTER:     '/register',
  ONBOARDING:   '/onboarding',

  // App
  DASHBOARD:    '/',

  // Clients
  CLIENTS:          '/clients',
  CLIENT_DETAIL:    '/clients/:id',
  CLIENT_NEW:       '/clients/new',

  // Inspections
  INSPECTIONS:           '/inspections',
  INSPECTION_NEW:        '/inspections/new',
  INSPECTION_DETAIL:     '/inspections/:id',
  INSPECTION_DEFECTS:    '/inspections/:id/defects',
  INSPECTION_FLOORPLANS: '/inspections/:id/floor-plans',
  INSPECTION_PHOTOS:     '/inspections/:id/photos',
  INSPECTION_CHECKLIST:  '/inspections/:id/checklist',
  INSPECTION_REPORT:     '/inspections/:id/report',

  // Photo annotation
  PHOTO_ANNOTATE: '/inspections/:inspectionId/photos/:photoId/annotate',

  // Reports
  REPORTS:        '/reports',
  REPORT_VIEW:    '/reports/:id',

  // Settings
  SETTINGS:             '/settings',
  SETTINGS_PROFILE:     '/settings/profile',
  SETTINGS_BRANDING:    '/settings/branding',
  SETTINGS_TEAM:        '/settings/team',

  // Subscription
  SUBSCRIPTION: '/subscription',
} as const

export type RouteKey = keyof typeof ROUTES

/** Helper: replace :id or :inspectionId etc. in path with actual value */
export function buildPath(route: string, params: Record<string, string> = {}): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    route,
  )
}

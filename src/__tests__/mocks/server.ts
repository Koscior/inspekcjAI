import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { inspectionHandlers } from './handlers/inspections'
import { defectHandlers } from './handlers/defects'
import { clientHandlers } from './handlers/clients'
import { profileHandlers } from './handlers/profiles'
import { storageHandlers } from './handlers/storage'
import { reportHandlers } from './handlers/reports'

export const server = setupServer(
  ...authHandlers,
  ...inspectionHandlers,
  ...defectHandlers,
  ...clientHandlers,
  ...profileHandlers,
  ...storageHandlers,
  ...reportHandlers,
)

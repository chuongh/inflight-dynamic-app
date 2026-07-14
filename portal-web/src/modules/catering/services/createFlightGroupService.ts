import { env } from '../../../core/config/env'
import type { FlightGroupService } from './flightGroupService'
import { mockFlightGroupService } from './mockFlightGroupService'

export function createFlightGroupService(): FlightGroupService {
  if (env.dataSource === 'api') {
    throw new Error('ApiFlightGroupService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockFlightGroupService
}

export const flightGroupService = createFlightGroupService()

import { env } from '../../../core/config/env'
import type { AirportService } from './airportService'
import { mockAirportService } from './mockAirportService'

export function createAirportService(): AirportService {
  if (env.dataSource === 'api') {
    throw new Error('ApiAirportService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockAirportService
}

export const airportService = createAirportService()

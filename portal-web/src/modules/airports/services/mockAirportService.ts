import { getAirportsCache, saveAirportsCache } from '../../../mock-data/loaders/loadAirports'
import type { AirportService } from './airportService'

export const mockAirportService: AirportService = {
  async listAirports() {
    return getAirportsCache()
  },

  async getAirport(code: string) {
    return getAirportsCache().find((airport) => airport.code === code) ?? null
  },

  async saveAirports(airports) {
    saveAirportsCache(airports)
  },
}

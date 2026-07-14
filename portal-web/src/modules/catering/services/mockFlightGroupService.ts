import { getFlightGroupCache, saveFlightGroupCache } from '../../../mock-data/loaders/loadFlightGroups'
import type { FlightGroupService } from './flightGroupService'

export const mockFlightGroupService: FlightGroupService = {
  async getFlightGroups() {
    return getFlightGroupCache()
  },

  async saveFlightGroups(dataset) {
    saveFlightGroupCache(dataset)
  },
}

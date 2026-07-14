import { env } from '../../../core/config/env'
import {
  getCrewMealConfigCache,
  saveCrewMealConfigCache,
} from '../../../mock-data/loaders/loadCrewMealConfig'
import type { CrewMealDataset } from '../crewMealTypes'

export interface CrewMealConfigService {
  getCrewMealConfig(): Promise<CrewMealDataset>
  saveCrewMealConfig(dataset: CrewMealDataset): Promise<void>
}

const mockCrewMealConfigService: CrewMealConfigService = {
  async getCrewMealConfig() {
    return getCrewMealConfigCache()
  },
  async saveCrewMealConfig(dataset) {
    saveCrewMealConfigCache(dataset)
  },
}

export function createCrewMealConfigService(): CrewMealConfigService {
  if (env.dataSource === 'api') {
    throw new Error('ApiCrewMealConfigService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockCrewMealConfigService
}

export const crewMealConfigService = createCrewMealConfigService()

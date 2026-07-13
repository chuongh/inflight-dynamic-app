import { env } from '../../../core/config/env'
import type { EquipmentService } from './equipmentService'
import { mockEquipmentService } from './mockEquipmentService'

export function createEquipmentService(): EquipmentService {
  if (env.dataSource === 'api') {
    throw new Error('ApiEquipmentService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockEquipmentService
}

export const equipmentService = createEquipmentService()

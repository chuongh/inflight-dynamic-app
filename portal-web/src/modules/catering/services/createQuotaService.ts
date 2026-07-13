import { env } from '../../../core/config/env'
import { mockQuotaService } from './mockQuotaService'
import type { QuotaService } from './quotaService'

export function createQuotaService(): QuotaService {
  if (env.dataSource === 'api') {
    throw new Error('ApiQuotaService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockQuotaService
}

export const quotaService = createQuotaService()

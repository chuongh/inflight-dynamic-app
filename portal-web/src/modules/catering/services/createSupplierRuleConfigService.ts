import { env } from '../../../core/config/env'
import { mockSupplierRuleConfigService } from './mockSupplierRuleConfigService'
import type { SupplierRuleConfigService } from './supplierRuleConfigService'

export function createSupplierRuleConfigService(): SupplierRuleConfigService {
  if (env.dataSource === 'api') {
    throw new Error(
      'ApiSupplierRuleConfigService not implemented yet. Set VITE_DATA_SOURCE=mock.',
    )
  }
  return mockSupplierRuleConfigService
}

export const supplierRuleConfigService = createSupplierRuleConfigService()

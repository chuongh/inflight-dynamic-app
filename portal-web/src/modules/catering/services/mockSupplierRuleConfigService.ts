import {
  getSupplierRuleConfigCache,
  saveSupplierRuleConfigCache,
} from '../../../mock-data/loaders/loadSupplierRuleConfig'
import type { SupplierRuleConfigService } from './supplierRuleConfigService'

export const mockSupplierRuleConfigService: SupplierRuleConfigService = {
  async getSupplierRuleConfig() {
    return getSupplierRuleConfigCache()
  },

  async saveSupplierRuleConfig(dataset) {
    saveSupplierRuleConfigCache(dataset)
  },
}

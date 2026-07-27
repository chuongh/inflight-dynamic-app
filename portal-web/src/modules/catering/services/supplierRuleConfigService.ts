import type { SupplierRuleConfigDataset } from '../supplierRuleConfigTypes'

export interface SupplierRuleConfigService {
  getSupplierRuleConfig(): Promise<SupplierRuleConfigDataset>
  saveSupplierRuleConfig(dataset: SupplierRuleConfigDataset): Promise<void>
}

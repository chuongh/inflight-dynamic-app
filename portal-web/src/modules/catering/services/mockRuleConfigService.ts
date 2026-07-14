import { getRuleConfigCache, saveRuleConfigCache } from '../../../mock-data/loaders/loadRuleConfig'
import type { RuleConfigService } from './ruleConfigService'

export const mockRuleConfigService: RuleConfigService = {
  async getRuleConfig() {
    return getRuleConfigCache()
  },

  async saveRuleConfig(dataset) {
    saveRuleConfigCache(dataset)
  },
}

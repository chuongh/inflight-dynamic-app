import { env } from '../../../core/config/env'
import { mockRuleConfigService } from './mockRuleConfigService'
import type { RuleConfigService } from './ruleConfigService'

export function createRuleConfigService(): RuleConfigService {
  if (env.dataSource === 'api') {
    throw new Error('ApiRuleConfigService not implemented yet. Set VITE_DATA_SOURCE=mock.')
  }
  return mockRuleConfigService
}

export const ruleConfigService = createRuleConfigService()

import type { RuleConfigDataset } from '../configTypes'

/** Data-source-agnostic contract for the catering rule-config dataset. */
export interface RuleConfigService {
  getRuleConfig(): Promise<RuleConfigDataset>
  saveRuleConfig(dataset: RuleConfigDataset): Promise<void>
}

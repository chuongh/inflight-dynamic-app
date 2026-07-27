import { describe, expect, it } from 'vitest'
import ecoRouteRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'
import lookupJson from '../../../mock-data/catering/supplier/sbb-lookups.json'
import {
  isValidQuantity,
  parseEcoRouteRuleDataset,
  parseSbbLookupDataset,
} from './validation'
import type { EcoRouteRuleDataset, SbbLookupDataset } from './types'

const lookup = lookupJson as SbbLookupDataset
const ecoRouteRules = ecoRouteRulesJson as EcoRouteRuleDataset

describe('supplier dataset parsing', () => {
  it('parses ECO route rules and SBB lookups used by builders', () => {
    expect(parseEcoRouteRuleDataset(ecoRouteRules).ok).toBe(true)
    expect(parseSbbLookupDataset(lookup).ok).toBe(true)
  })

  it('keeps isValidQuantity for config quantity checks', () => {
    expect(isValidQuantity(0)).toBe(true)
    expect(isValidQuantity(-1)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import ecoRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'
import sbbLookupJson from '../../../mock-data/catering/supplier/sbb-lookups.json'
import {
  isValidQuantity,
  parseEcoRouteRuleDataset,
  parseSbbLookupDataset,
} from './validation'

describe('supplier runtime guards', () => {
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid quantity %s',
    (value) => {
      expect(isValidQuantity(value)).toBe(false)
    },
  )

  it('accepts non-negative integer quantities', () => {
    expect(isValidQuantity(0)).toBe(true)
    expect(isValidQuantity(316)).toBe(true)
  })

  it('parses the complete ECO route rule dataset', () => {
    const result = parseEcoRouteRuleDataset(ecoRulesJson)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseEcoRouteRuleDataset(result.value).ok).toBe(true)
    }
  })

  it('rejects missing ECO route rule fields and invalid effective dates', () => {
    const missingField = structuredClone(ecoRulesJson)
    delete (missingField.fields as Partial<typeof missingField.fields>).skybossEggs
    const badDate = { ...ecoRulesJson, effectiveFrom: '31/02/2026' }
    const reversedRange = {
      ...ecoRulesJson,
      effectiveFrom: '09/07/2026',
      effectiveTo: '08/07/2026',
    }

    expect(parseEcoRouteRuleDataset(missingField).ok).toBe(false)
    expect(parseEcoRouteRuleDataset(badDate).ok).toBe(false)
    expect(parseEcoRouteRuleDataset(reversedRange).ok).toBe(false)
  })

  it('rejects missing SBB sheets and duplicate businessPax lookup rows', () => {
    const missingSheet = structuredClone(sbbLookupJson)
    delete (
      missingSheet.sheets as Partial<typeof missingSheet.sheets>
    )['VIET-HAN-NHAT']
    const duplicate = structuredClone(sbbLookupJson)
    duplicate.sheets['ÚC&KAZ'].push({
      businessPax: 11,
      items: {},
    })

    expect(parseSbbLookupDataset(missingSheet).ok).toBe(false)
    expect(parseSbbLookupDataset(duplicate).ok).toBe(false)
  })

  it('idempotently accepts a normalized SBB lookup dataset', () => {
    const parsed = parseSbbLookupDataset(sbbLookupJson)

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parseSbbLookupDataset(parsed.value).ok).toBe(true)
    }
  })
})

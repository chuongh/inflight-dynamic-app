import { describe, expect, it } from 'vitest'
import {
  activeSupplierRuleVersion,
  nextSupplierRuleVersionNumber,
  supplierRuleVersionsNewestFirst,
  withNewSupplierRuleVersion,
} from './supplierRuleConfig'
import type { SupplierRuleConfigVersion } from './supplierRuleConfigTypes'
import type { EcoRouteRuleDataset, SbbLookupDataset } from './supplier/types'

const eco: EcoRouteRuleDataset = {
  effectiveFrom: '08/07/2026',
  effectiveTo: '31/12/2026',
  airports: ['BNE', 'MEL', 'SYD'],
  source: 'test',
  fields: {
    australiaNoodleVegetables: { value: 25, ruleId: 'ECO.Z' },
    skybossEggs: { input: 'skybossEco', ruleId: 'ECO.AE' },
    australiaSkybossYogurt: { input: 'skybossEco', ruleId: 'ECO.AG' },
    australiaRoundBread: { input: 'skybossEco', ruleId: 'ECO.AW' },
  },
}

const sbb: SbbLookupDataset = {
  effectiveFrom: '08/07/2026',
  effectiveTo: '31/12/2026',
  source: 'test',
  sheets: {
    'VIET-HAN-NHAT': [],
    'CHAY(VIỆT-HÀN-NHẬT)': [],
    ẤN: [],
    'ÚC&KAZ': [],
  },
}

function ver(
  partial: Partial<SupplierRuleConfigVersion> & Pick<SupplierRuleConfigVersion, 'id' | 'version' | 'status'>,
): SupplierRuleConfigVersion {
  return {
    effectiveFrom: '08/07/2026',
    updatedBy: 'Test',
    updatedAt: '08/07/2026',
    ecoRouteRules: eco,
    sbbLookups: sbb,
    ...partial,
  }
}

describe('supplierRuleConfig', () => {
  it('selects the newest version effective on the requested operating date', () => {
    const versions = [
      ver({ id: 's2', version: 2, status: 'scheduled', effectiveFrom: '01/08/2026' }),
      ver({ id: 's1', version: 1, status: 'active', effectiveFrom: '08/07/2026' }),
    ]
    expect(activeSupplierRuleVersion(versions, '30/07/2026')?.id).toBe('s1')
    expect(activeSupplierRuleVersion(versions, '01/08/2026')?.id).toBe('s2')
    expect(activeSupplierRuleVersion([
      ver({ id: 's3', version: 3, status: 'superseded' }),
      ver({ id: 's2', version: 2, status: 'superseded' }),
    ], '01/01/2026')?.id).toBe('s3')
  })

  it('sorts newest first', () => {
    const sorted = supplierRuleVersionsNewestFirst([
      ver({ id: 's1', version: 1, status: 'superseded' }),
      ver({ id: 's3', version: 3, status: 'active' }),
      ver({ id: 's2', version: 2, status: 'superseded' }),
    ])
    expect(sorted.map((v) => v.id)).toEqual(['s3', 's2', 's1'])
  })

  it('publishes a new active version and supersedes the prior active', () => {
    const next = withNewSupplierRuleVersion(
      [ver({ id: 's1', version: 1, status: 'active' })],
      { ecoRouteRules: { ...eco, airports: ['BNE'] }, sbbLookups: sbb },
      {
        effectiveFrom: '09/07/2026',
        updatedBy: 'Commercial',
        updatedAt: '09/07/2026',
        startsInFuture: false,
      },
    )
    expect(nextSupplierRuleVersionNumber([ver({ id: 's1', version: 1, status: 'active' })])).toBe(2)
    expect(next[0]).toMatchObject({ id: 's2', status: 'active', effectiveFrom: '09/07/2026' })
    expect(next[0].ecoRouteRules.airports).toEqual(['BNE'])
    expect(next[1]).toMatchObject({ id: 's1', status: 'superseded', effectiveTo: '09/07/2026' })
  })

  it('schedules a future version without superseding the active one yet', () => {
    const next = withNewSupplierRuleVersion(
      [ver({ id: 's1', version: 1, status: 'active' })],
      { ecoRouteRules: eco, sbbLookups: sbb },
      {
        effectiveFrom: '01/01/2027',
        updatedBy: 'Commercial',
        updatedAt: '09/07/2026',
        startsInFuture: true,
      },
    )
    expect(next[0].status).toBe('scheduled')
    expect(next[1].status).toBe('active')
    expect(next[1].effectiveTo).toBeUndefined()
  })
})

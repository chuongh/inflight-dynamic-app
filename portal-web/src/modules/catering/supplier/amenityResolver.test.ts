import { describe, expect, it } from 'vitest'
import {
  appendOddSectorShortRoundTripPackage,
  resolveAmenityComposition,
  resolveAmenityPackages,
} from './amenityResolver'
import { DEFAULT_ECO_QUANTITY_RULES, evalQuantityRule } from './ecoQuantityEval'
import { DEFAULT_ECO_AMENITY_CONFIG } from './amenityDefaults'
import { DEFAULT_AMENITY_PACKAGE_COMPOSITIONS } from './amenityQuantityDefaults'
import { buildEcoSupplierRow } from './ecoBuilder'
import ecoRouteRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'
import type { EcoRouteRuleDataset, EcoSupplierInput } from './types'

const routeRules = ecoRouteRulesJson as EcoRouteRuleDataset

const baseHotmeal: EcoSupplierInput['hotmealItems'] = {
  spaghetti: 10,
  glassNoodles: 0,
  banhChung: 0,
  stirFriedNoodles: 0,
  thaiFriedRice: 0,
  savoryStickyRice: 0,
  khucStickyRice: 0,
  beefRice: 0,
  coconutRice: 0,
  indianPotatoParatha: 0,
  chickenCurry: 0,
  fishCurry: 0,
  vegetarianYangzhouRice: 0,
  vegetarianBasmatiCurry: 0,
}

describe('resolveAmenityPackages', () => {
  it('selects 10+15 for A330 SGN-MEL ĐẦU NGÀY (NEW sheet fixture)', () => {
    const result = resolveAmenityPackages({
      aircraftType: 'A330',
      dep: 'SGN',
      arr: 'MEL',
      upliftType: 'DAU_NGAY',
    })
    expect(result.label).toBe('10+15')
    expect(result.packageIds).toEqual([10, 15])
  })

  it('selects 1+5 for A321 SGN-PER ĐẦU NGÀY via LIST INT>=4h', () => {
    const result = resolveAmenityPackages({
      aircraftType: 'A321',
      dep: 'SGN',
      arr: 'PER',
      upliftType: 'DAU_NGAY',
    })
    expect(result.label).toBe('1+5')
    expect(result.hourClassId).toBe('INT_GE_4H')
  })

  it('selects 1+4 for A321 SGN-DPS ĐẦU NGÀY and 4 for ĐỔI TỔ', () => {
    const dauNgay = resolveAmenityPackages({
      aircraftType: 'A321',
      dep: 'SGN',
      arr: 'DPS',
      upliftType: 'DAU_NGAY',
    })
    const doiTo = resolveAmenityPackages({
      aircraftType: 'A321',
      dep: 'SGN',
      arr: 'DPS',
      upliftType: 'DOI_TO',
    })
    expect(dauNgay.label).toBe('1+4')
    expect(doiTo.label).toBe('4')
  })

  it('maps A330 ICN to package 12 (QT Hàn/Nhật/Ấn) with ĐẦU NGÀY aircraft pack', () => {
    const result = resolveAmenityPackages({
      aircraftType: 'A330',
      dep: 'SGN',
      arr: 'ICN',
      upliftType: 'DAU_NGAY',
    })
    expect(result.label).toBe('10+12')
  })

  it('respects amenity override from workbook', () => {
    const result = resolveAmenityPackages({
      aircraftType: 'A330',
      dep: 'SGN',
      arr: 'HAN',
      upliftType: 'DOI_TO',
      amenityOverride: '10+15',
    })
    expect(result.label).toBe('10+15')
    expect(result.source).toContain('override')
  })
})

describe('eco quantity rules', () => {
  it('computes AL Muối tiêu Ấn from soySauce on Indian routes', () => {
    const rule = DEFAULT_ECO_QUANTITY_RULES.find(
      (r) => r.id === 'ECO.AL.indianSalt',
    )!
    const onIndia = evalQuantityRule(rule, {
      columns: { soySauce: 40 },
      metrics: {},
      hotmealTotal: 80,
      dep: 'SGN',
      arr: 'BOM',
      amenityPackageIds: [5],
      routeGroups: DEFAULT_ECO_AMENITY_CONFIG.routeGroups,
    })
    const elsewhere = evalQuantityRule(rule, {
      columns: { soySauce: 40 },
      metrics: {},
      hotmealTotal: 80,
      dep: 'SGN',
      arr: 'HAN',
      amenityPackageIds: [3],
      routeGroups: DEFAULT_ECO_AMENITY_CONFIG.routeGroups,
    })
    expect(onIndia.value).toBe(40)
    expect(elsewhere.value).toBe(0)
  })

  it('computes AN reserve utensils for A330 Úc as 30 when input absent', () => {
    const row = buildEcoSupplierRow(
      {
        operatingDate: '08/07/2026',
        flightNo: 'VJ081',
        dep: 'SGN',
        arr: 'MEL',
        aircraftType: 'A330',
        upliftType: 'DAU_NGAY',
        quotaCommercial: null,
        totalPrebook: 10,
        skybossEco: 2,
        boiledEggs: 0,
        reserveUtensils: null,
        hotmealItems: baseHotmeal,
      },
      routeRules,
    )
    expect(row.amenityLabel).toBe('10+15')
    expect(row.cells.reserveUtensils.value).toBe(30)
    expect(row.cells.indianSaltPepper.value).toBe(0)
  })
})

describe('resolveAmenityComposition', () => {
  it('sums products across multiple packages', () => {
    const pkg2 = DEFAULT_AMENITY_PACKAGE_COMPOSITIONS.find((c) => c.packageId === 2)!
    const pkg5 = DEFAULT_AMENITY_PACKAGE_COMPOSITIONS.find((c) => c.packageId === 5)!
    expect(pkg2.items.length).toBeGreaterThan(0)
    expect(pkg5.items.length).toBeGreaterThan(0)

    const single = resolveAmenityComposition([2])
    const trashBagMid = single.find((i) => i.productCode === '30000879')
    expect(trashBagMid?.quantity).toBe(3)

    const combined = resolveAmenityComposition([2, 5])
    const combinedTrash = combined.find((i) => i.productCode === '30000879')
    expect(combinedTrash?.quantity).toBe(3 + 8)
  })

  it('appends short round-trip package on odd-sector last leg and doubles its qty', () => {
    const base = [1, 5]
    const withExtra = appendOddSectorShortRoundTripPackage(base, 3, true)
    expect(withExtra).toEqual([1, 5, 2])
    expect(appendOddSectorShortRoundTripPackage(base, 3, false)).toEqual(base)
    expect(appendOddSectorShortRoundTripPackage(base, 2, true)).toEqual(base)

    const once = resolveAmenityComposition([2]).find((i) => i.productCode === '30000879')
    const twice = resolveAmenityComposition([2, 2]).find((i) => i.productCode === '30000879')
    expect(twice?.quantity).toBe((once?.quantity ?? 0) * 2)
  })
})

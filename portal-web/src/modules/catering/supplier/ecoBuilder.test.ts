import { describe, expect, it } from 'vitest'
import ecoRouteRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'
import supplierFlightsJson from '../../../mock-data/catering/supplier/flights-2026-07-08.json'
import { DEFAULT_ECO_AMENITY_CONFIG } from './amenityDefaults'
import { buildEcoSupplierRow } from './ecoBuilder'
import { DEFAULT_ECO_QUANTITY_RULES } from './ecoQuantityEval'
import type { EcoRouteRuleDataset, EcoSupplierInput } from './types'

const vj81Input = supplierFlightsJson.find(
  (flight) => flight.flightNo === 'VJ081',
) as EcoSupplierInput
const routeRules = ecoRouteRulesJson as EcoRouteRuleDataset
const buildEco = (input: EcoSupplierInput) =>
  buildEcoSupplierRow(input, routeRules)

describe('buildEcoSupplierRow', () => {
  it('builds the verified ECO formulas and VJ81 golden totals', () => {
    const row = buildEco(vj81Input)

    expect(row.key).toBe('2026-07-08|VJ81|SGN|MEL')
    expect(Object.fromEntries([
      'spaghetti',
      'glassNoodles',
      'banhChung',
      'stirFriedNoodles',
      'thaiFriedRice',
      'savoryStickyRice',
      'khucStickyRice',
      'beefRice',
      'coconutRice',
      'indianPotatoParatha',
      'chickenCurry',
      'fishCurry',
      'vegetarianYangzhouRice',
      'vegetarianBasmatiCurry',
    ].map((field) => [
      field,
      row.cells[field as keyof typeof row.cells].value,
    ]))).toEqual({
      spaghetti: 77,
      glassNoodles: 5,
      banhChung: 0,
      stirFriedNoodles: 5,
      thaiFriedRice: 87,
      savoryStickyRice: 5,
      khucStickyRice: 0,
      beefRice: 5,
      coconutRice: 7,
      indianPotatoParatha: 0,
      chickenCurry: 24,
      fishCurry: 0,
      vegetarianYangzhouRice: 53,
      vegetarianBasmatiCurry: 48,
    })
    expect(row.cells.hotmealTotal.value).toBe(316)
    expect(row.cells.bread.value).toBe(1)
    expect(row.cells.bread.source).toContain('workbookReferenceBread')
    expect(row.cells.prebook.value).toBe(282)
    expect(row.cells.skyboss.value).toBe(13)
    // boiledEggs (manual input, 2) + skybossEggs (unconfirmed AU rule, previewed at skybossEco 13) = 15.
    expect(row.cells.totalEggs.value).toBe(15)
    expect(row.cells.ketchup.value).toBe(77)
    expect(row.cells.chiliSauce.value).toBe(158)
    expect(row.cells.soySauce.value).toBe(158)
    expect(row.cells.hotmealUtensils.value).toBe(316)
    expect(row.cells.totalUtensils.value).toBe(346)
    expect(row.cells.prebookCashews.value).toBe(282)
    expect(row.cells.spaghetti.source).toContain('workbook')
    expect(row.cells.spaghetti.source).toContain('J:X')
    expect(row.cells.prebook.source).toContain('AQ')
  })

  it('excludes bread from AH hotmeal total', () => {
    const row = buildEco(vj81Input)

    expect(row.cells.hotmealTotal.value).toBe(316)
    expect(row.cells.hotmealTotal.value).not.toBe(602)
  })

  it('computes bread as breadPrebook only (commercial bánh mì is separate) when workbook bread is absent', () => {
    const withQuota = buildEco({
      ...vj81Input,
      workbookReferenceBread: null,
      quotaCommercial: 4,
      quotaBanhMi: 3,
      quotaTraSua: 2,
      breadPrebook: 6,
      totalPrebook: 282,
    })
    const neither = buildEco({
      ...vj81Input,
      workbookReferenceBread: null,
      quotaCommercial: null,
      quotaBanhMi: null,
      quotaTraSua: null,
      breadPrebook: null,
    })

    // Prebook only — not 4 + 6. Commercial hotmeal / bánh mì / trà sữa stay separate.
    expect(withQuota.cells.bread.value).toBe(6)
    expect(withQuota.cells.bread.source).toContain('ECO.S.bread')
    expect(withQuota.cells.banhMiCommercial.value).toBe(3)
    expect(withQuota.cells.traSuaCommercial.value).toBe(2)
    expect(neither.cells.bread.value).toBeNull()
    expect(neither.cells.banhMiCommercial.value).toBeNull()
    expect(neither.cells.traSuaCommercial.value).toBeNull()
  })

  it('resolves prebookCashews via the quantity rule engine', () => {
    const row = buildEco(vj81Input)
    expect(row.cells.prebookCashews.value).toBe(282)
    expect(row.cells.prebookCashews.source).toContain('ECO.AZ.prebookCashews')
  })

  it('resolves freshWater as totalPrebook and prefers freshWaterOverride', () => {
    const row = buildEco(vj81Input)
    expect(row.cells.freshWater.value).toBe(282)
    expect(row.cells.freshWater.source).toContain('ECO.AY.freshWater')

    const overridden = buildEco({ ...vj81Input, freshWaterOverride: 40 })
    expect(overridden.cells.freshWater.value).toBe(40)
    expect(overridden.cells.freshWater.source).toContain('freshWaterOverride')
  })

  it('prefers workbookReferenceBread over the quota+prebook formula', () => {
    const row = buildEco({
      ...vj81Input,
      workbookReferenceBread: 1,
      quotaCommercial: 4,
      totalPrebook: 282,
    })
    expect(row.cells.bread.value).toBe(1)
  })

  it('sums known hotmeal items treating missing items as zero when any are present', () => {
    const row = buildEco({
      ...vj81Input,
      hotmealItems: { spaghetti: 10, glassNoodles: null },
    })

    expect(row.cells.hotmealTotal.value).toBe(10)
    expect(row.cells.chiliSauce.value).toBe(5)
  })

  it('applies Australia route rules and takes beef/bread vegetables from input', () => {
    const row = buildEco({
      ...vj81Input,
      australiaBeefFreshVegetables: 4,
      australiaBreadVegetables: 5,
    })

    // Unconfirmed rules still preview their computed value (branch matched: AU) —
    // only the "Unconfirmed" flag on the resulting line keeps ops from trusting it blindly.
    expect(row.cells.australiaNoodleVegetables.value).toBe(25)
    expect(row.cells.australiaNoodleVegetables.source).toContain('unconfirmed')
    expect(row.cells.australiaSkybossYogurt.value).toBe(13)
    expect(row.cells.australiaRoundBread.value).toBe(13)
    expect(row.cells.skybossEggs.value).toBe(13)
    expect(row.cells.australiaBeefFreshVegetables.value).toBe(4)
    expect(row.cells.australiaBreadVegetables.value).toBe(5)
  })

  it('maps amenity / ops columns from the ECO workbook seed (VJ81)', () => {
    const row = buildEco(vj81Input)
    expect(row.cells.reserveCrewWater.value).toBe(68)
    expect(row.cells.smallIceBox.value).toBe(13)
    expect(row.cells.largeIceBox.value).toBe(0)
    expect(row.cells.wetIceKg.value).toBe(60)
    expect(row.cells.dryIceKg.value).toBe(14)
    expect(row.cells.dutyFree.value).toBe(1)
    expect(row.cells.highlift.value).toBe(1)
    expect(row.cells.reserveCrewWater.source).toContain('Suối')
  })

  it('leaves amenity / ops null when not provided (except fields with a quantity rule fallback)', () => {
    const row = buildEco({
      ...vj81Input,
      reserveCrewWater: null,
      smallIceBox: null,
      largeIceBox: null,
      wetIceKg: null,
      dryIceKg: null,
      dutyFree: null,
      highlift: null,
      smallTruck: null,
      lastMinuteTopUp: null,
      sourceRefs: {
        ...vj81Input.sourceRefs,
        reserveCrewWater: undefined,
      },
    })
    // No manual reserveCrewWater — falls back to the (unconfirmed) rule preview.
    // VJ81 is AU (MEL) but not A330, so no branch matches; fallback const = 0.
    expect(row.cells.reserveCrewWater.value).toBe(0)
    // highlift has no quantity rule at all, so it genuinely stays null.
    expect(row.cells.highlift.value).toBeNull()
  })

  it('falls back to zero for Australia route fields when route does not match AU group', () => {
    const unsupportedRoute = buildEco({
      ...vj81Input,
      dep: 'SGN',
      arr: 'HAN',
    })

    // No branch matches a non-AU route, so each rule's fallback (const 0) applies.
    expect(unsupportedRoute.cells.australiaNoodleVegetables.value).toBe(0)
    expect(unsupportedRoute.cells.skybossEggs.value).toBe(0)
    expect(unsupportedRoute.cells.australiaSkybossYogurt.value).toBe(0)
    expect(unsupportedRoute.cells.australiaRoundBread.value).toBe(0)
  })

  it('resolves maccaKazSalted for KAZ routes and zero elsewhere', () => {
    const kaz = buildEco({
      ...vj81Input,
      dep: 'SGN',
      arr: 'ALA',
      skybossEco: 9,
    })
    const other = buildEco({
      ...vj81Input,
      dep: 'SGN',
      arr: 'HAN',
      skybossEco: 9,
    })

    expect(kaz.cells.maccaKazSalted.value).toBe(9)
    expect(kaz.cells.maccaKazSalted.source).toContain('ECO.AS.maccaKazSalted')
    expect(other.cells.maccaKazSalted.value).toBe(0)
  })

  it('resolves maccaSkybossRaisins as skybossEco', () => {
    const row = buildEco(vj81Input)
    expect(row.cells.maccaSkybossRaisins.value).toBe(13)
    expect(row.cells.maccaSkybossRaisins.source).toContain('ECO.AR.maccaSkybossRaisins')
  })

  it('previews unconfirmed blanket3in1Prebook from its fallback formula', () => {
    const row = buildEco(vj81Input)
    expect(row.cells.blanket3in1Prebook.value).toBe(282)
    expect(row.cells.blanket3in1Prebook.source).toContain('unconfirmed')
  })

  it('uses quantityConfig rules for AU noodle vegetables instead of legacy dataset', () => {
    const row = buildEcoSupplierRow(vj81Input, null, {
      amenity: DEFAULT_ECO_AMENITY_CONFIG,
      quantityRules: [
        {
          id: 'TEST.Z',
          targetColumn: 'australiaNoodleVegetables',
          enabled: true,
          branches: [
            {
              id: 'au',
              when: { routeGroups: ['AU'] },
              value: { kind: 'const', value: 99 },
            },
          ],
          fallback: { kind: 'const', value: 0 },
        },
      ],
    })

    expect(row.cells.australiaNoodleVegetables.value).toBe(99)
    expect(row.cells.australiaNoodleVegetables.source).toContain('TEST.Z')
  })

  it('uses the reserve utensil source reference', () => {
    const row = buildEco(vj81Input)

    expect(row.cells.reserveUtensils.source).toContain('column AN')
  })

  it('keeps derived cells null when a required input is missing', () => {
    // Manual boiledEggs missing AND its quantity-rule fallback disabled, so the
    // cell is genuinely null (not just falling back to a rule preview) —
    // exercises derivedFrom's strict null-propagation for totalEggs.
    const quantityRules = DEFAULT_ECO_QUANTITY_RULES.map((r) =>
      r.targetColumn === 'boiledEggs' ? { ...r, enabled: false } : r,
    )
    const row = buildEcoSupplierRow(
      { ...vj81Input, boiledEggs: null },
      routeRules,
      { amenity: DEFAULT_ECO_AMENITY_CONFIG, quantityRules },
    )

    expect(row.cells.boiledEggs.value).toBeNull()
    expect(row.cells.totalEggs.value).toBeNull()
  })

  it('puts value and source on every output cell', () => {
    const row = buildEco(vj81Input)

    for (const cell of Object.values(row.cells)) {
      expect(cell.source.length).toBeGreaterThan(0)
      expect(Object.keys(cell).sort()).toEqual(['source', 'value'])
      expect(cell.value === null || typeof cell.value === 'number').toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'
import type { DayGrouping, FlightGroup, FlightLeg } from '../groupingTypes'
import { DEFAULT_AMENITY_PACKAGE_COMPOSITIONS } from './amenityQuantityDefaults'
import { buildEcoSupplySnapshot } from './buildEcoSupplySnapshot'
import ecoRouteRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'

const leg = (
  partial: Partial<FlightLeg> & Pick<FlightLeg, 'flightNo' | 'dep' | 'arr'>,
): FlightLeg => ({
  std: '08:00',
  sta: '10:00',
  intl: false,
  ...partial,
})

const group = (
  partial: Partial<FlightGroup> & Pick<FlightGroup, 'id' | 'confirmed' | 'legs'>,
): FlightGroup => ({
  aircraft: 'VN-A1',
  aircraftType: 'A321',
  purser: 'P',
  purserCode: 'P1',
  confidence: 'high',
  ...partial,
})

const dayOf = (groups: FlightGroup[]): DayGrouping => ({
  serviceDate: '08/07/2026',
  serviceWeekday: 'Thứ Tư',
  status: 'grouped',
  groups,
})

describe('buildEcoSupplySnapshot', () => {
  it('emits amenity composition lines for package override [2]', () => {
    const day = dayOf([
      group({
        id: 'g1',
        confirmed: true,
        aircraftType: 'A321',
        legs: [
          leg({
            flightNo: 'VJ001',
            dep: 'SGN',
            arr: 'DAD',
            premeal: 20,
            supplier: {
              totalPrebook: 20,
              skybossEco: 0,
              boiledEggs: 0,
              amenityOverride: '2',
            },
          }),
        ],
      }),
    ])

    const lines = buildEcoSupplySnapshot({
      day,
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
    })

    const amenityLines = lines.filter((l) => l.group === 'amenity_composition')
    const expected = DEFAULT_AMENITY_PACKAGE_COMPOSITIONS.find((c) => c.packageId === 2)!
    const expectedPositive = expected.items.filter(
      (i) => typeof i.quantity === 'number' && i.quantity > 0,
    )

    expect(amenityLines.length).toBe(expectedPositive.length)
    for (const item of expectedPositive) {
      const line = amenityLines.find((l) => l.productCode === item.productCode)
      expect(line?.qty).toBe(item.quantity)
    }

    const water = lines.find((l) => l.field === 'freshWater')
    expect(water?.qty).toBe(20)

    const macca = lines.find((l) => l.field === 'maccaSkybossRaisins')
    expect(macca?.qty).toBe(0)
    expect(macca?.source.toLowerCase()).toContain('manual')
  })
})

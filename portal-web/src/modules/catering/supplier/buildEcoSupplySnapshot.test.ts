import { describe, expect, it } from 'vitest'
import type { CrewMealProfile } from '../crewMealTypes'
import type { DayGrouping, FlightGroup, FlightLeg } from '../groupingTypes'
import { computeGroupCrewMeals } from '../groupCrewMeal'
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

const cockpitProfile: CrewMealProfile = {
  group: 'cockpit',
  enabled: true,
  windows: [
    { id: 'w1', slot: 'morning', start: '06:00', end: '08:00' },
    { id: 'w2', slot: 'noon', start: '11:00', end: '13:00' },
    { id: 'w3', slot: 'evening', start: '17:00', end: '19:00' },
    { id: 'w4', slot: 'night', start: '22:00', end: '04:00' },
  ],
  preStdMinutes: 60,
  postStaMinutes: 20,
  minOverlapMinutes: 10,
  countedColumns: ['cockpit', 'jumpseat', 'positioning'],
  dedupeByEmployee: true,
  splitByLandingDate: true,
}

describe('buildEcoSupplySnapshot', () => {
  it('emits amenity package count line for package override [2]', () => {
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

    const { lines, byFlight } = buildEcoSupplySnapshot({
      day,
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
    })

    const amenityLines = lines.filter((l) => l.group === 'amenity_composition')

    expect(amenityLines.length).toBe(1)
    expect(amenityLines[0].qty).toBe(1)
    expect(amenityLines[0].field).toBe('amenityPackage2')
    expect(amenityLines[0].unit).toBe('gói')

    const water = lines.find((l) => l.field === 'freshWater')
    expect(water?.qty).toBe(20)

    const macca = lines.find((l) => l.field === 'maccaSkybossRaisins')
    expect(macca?.qty).toBe(0)
    expect(macca?.source.toLowerCase()).toContain('manual')

    expect(byFlight).toHaveLength(1)
    expect(byFlight[0]).toMatchObject({ flightNo: 'VJ1', dep: 'SGN', arr: 'DAD' })
    expect(byFlight[0].cells.prebook).toBe(20)
    expect(byFlight[0].cells.freshWater).toBe(20)
  })

  it('always emits always-manual fields (e.g. boiledEggs) even at qty 0, so ops can enter a value', () => {
    const day = dayOf([
      group({
        id: 'g1',
        confirmed: true,
        legs: [
          leg({
            flightNo: 'VJ001',
            dep: 'SGN',
            arr: 'DAD',
            supplier: { totalPrebook: 5, skybossEco: 0, boiledEggs: 0 },
          }),
        ],
      }),
    ])

    const { lines } = buildEcoSupplySnapshot({
      day,
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
    })

    const boiledEggs = lines.find((l) => l.field === 'boiledEggs')
    expect(boiledEggs).toBeDefined()
    expect(boiledEggs?.qty).toBe(0)
    expect(boiledEggs?.source.toLowerCase()).toContain('manual')

    const smallIceBox = lines.find((l) => l.field === 'smallIceBox')
    expect(smallIceBox).toBeDefined()
    expect(smallIceBox?.qty).toBe(0)
  })

  it('returns empty snapshot when no confirmed inputs', () => {
    const { lines, byFlight } = buildEcoSupplySnapshot({
      day: dayOf([]),
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
    })
    expect(lines).toEqual([])
    expect(byFlight).toEqual([])
  })

  it('emits crewCockpit line matching computeGroupCrewMeals for a rotation', () => {
    const g = group({
      id: 'g-crew',
      confirmed: true,
      legs: [
        leg({
          flightNo: 'VJ5512',
          dep: 'SGN',
          arr: 'HAN',
          std: '05:40',
          sta: '07:50',
          cockpitCrew: [
            { role: 'CP', name: 'Nguyễn Văn A', code: 'P01234' },
            { role: 'FO', name: 'Trần Văn B', code: 'P02345' },
          ],
          supplier: { totalPrebook: 1, skybossEco: 0, boiledEggs: 0 },
        }),
        leg({
          flightNo: 'VJ5513',
          dep: 'HAN',
          arr: 'SGN',
          std: '08:30',
          sta: '10:40',
          cockpitCrew: [
            { role: 'CP', name: 'Nguyễn Văn A', code: 'P01234' },
            { role: 'FO', name: 'Trần Văn B', code: 'P02345' },
          ],
        }),
      ],
    })
    const day = dayOf([g])
    const expected = computeGroupCrewMeals(g, cockpitProfile).meals

    const { lines } = buildEcoSupplySnapshot({
      day,
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
      crewMealProfile: cockpitProfile,
    })

    const crewLine = lines.find((l) => l.field === 'crewCockpit')
    expect(crewLine).toBeDefined()
    expect(crewLine?.qty).toBe(expected)
    expect(expected).toBeGreaterThan(0)
  })

  it('skips crewCockpit when crewMealProfile is absent', () => {
    const day = dayOf([
      group({
        id: 'g1',
        confirmed: true,
        legs: [
          leg({
            flightNo: 'VJ001',
            dep: 'SGN',
            arr: 'DAD',
            supplier: { totalPrebook: 5, skybossEco: 0, boiledEggs: 0 },
          }),
        ],
      }),
    ])
    const { lines } = buildEcoSupplySnapshot({
      day,
      station: 'SGN',
      mealCatalog: null,
      amenityCatalog: null,
      ecoRouteRules: ecoRouteRulesJson,
    })
    expect(lines.find((l) => l.field === 'crewCockpit')).toBeUndefined()
  })
})

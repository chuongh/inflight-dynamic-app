import { describe, expect, it } from 'vitest'
import type { DayGrouping, FlightGroup, FlightLeg } from '../groupingTypes'
import { flightGroupsToSupplierInputs } from './fromFlightGroup'

const leg = (partial: Partial<FlightLeg> & Pick<FlightLeg, 'flightNo' | 'dep' | 'arr'>): FlightLeg => ({
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

describe('flightGroupsToSupplierInputs', () => {
  it('includes only confirmed groups at the station', () => {
    const day = dayOf([
      group({
        id: 'ok',
        confirmed: true,
        legs: [leg({ flightNo: 'VJ081', dep: 'SGN', arr: 'MEL', supplier: { businessPax: 11 } })],
      }),
      group({
        id: 'pending',
        confirmed: false,
        legs: [leg({ flightNo: 'VJ162', dep: 'SGN', arr: 'HAN', supplier: { businessPax: 1 } })],
      }),
      group({
        id: 'other-station',
        confirmed: true,
        legs: [leg({ flightNo: 'VJ120', dep: 'HAN', arr: 'SGN', supplier: { businessPax: 2 } })],
      }),
    ])

    const { inputs } = flightGroupsToSupplierInputs(day, 'SGN')
    expect(inputs.map((i) => i.flightNo)).toEqual(['VJ081'])
    expect(inputs[0]).toMatchObject({
      operatingDate: '08/07/2026',
      dep: 'SGN',
      arr: 'MEL',
      businessPax: 11,
    })
  })

  it('falls back totalPrebook to leg.premeal when supplier.totalPrebook is absent', () => {
    const day = dayOf([
      group({
        id: 'g1',
        confirmed: true,
        legs: [
          leg({
            flightNo: 'VJ083',
            dep: 'SGN',
            arr: 'BNE',
            premeal: 150,
            supplier: { skybossEco: 8 },
          }),
        ],
      }),
    ])

    const { inputs } = flightGroupsToSupplierInputs(day, 'SGN')
    expect(inputs[0].totalPrebook).toBe(150)
  })

  it('counts pending legs from unconfirmed groups at the station', () => {
    const day = dayOf([
      group({
        id: 'confirmed',
        confirmed: true,
        legs: [leg({ flightNo: 'VJ081', dep: 'SGN', arr: 'MEL' })],
      }),
      group({
        id: 'pending-sgn',
        confirmed: false,
        legs: [
          leg({ flightNo: 'VJ162', dep: 'SGN', arr: 'HAN' }),
          leg({ flightNo: 'VJ163', dep: 'HAN', arr: 'DAD' }),
        ],
      }),
      group({
        id: 'pending-han',
        confirmed: false,
        legs: [leg({ flightNo: 'VJ120', dep: 'HAN', arr: 'SGN' })],
      }),
    ])

    const { pendingCount } = flightGroupsToSupplierInputs(day, 'SGN')
    // both legs of the unconfirmed SGN-origin group count
    expect(pendingCount).toBe(2)
  })

  it('maps sbb* and australia* supplier fields onto SupplierFlightInput', () => {
    const day = dayOf([
      group({
        id: 'g1',
        confirmed: true,
        legs: [
          leg({
            flightNo: 'VJ081',
            dep: 'SGN',
            arr: 'MEL',
            supplier: {
              totalPrebook: 282,
              businessPax: 11,
              australiaBeefFreshVegetables: 10,
              australiaBreadVegetables: 10,
              sbbCocktail: 22,
              sbbMaccaRaisins: 22,
              sbbUtensils: 38,
              sbbKit: 12,
              sbbPillow: 12,
              sbbMattress: 12,
              sbbMealType: 'standard',
              hotmealItems: { spaghetti: 77 },
              sourceRefs: { flightNo: 'ref' },
            },
          }),
        ],
      }),
    ])

    const { inputs } = flightGroupsToSupplierInputs(day, 'SGN')
    expect(inputs[0]).toMatchObject({
      operatingDate: '08/07/2026',
      flightNo: 'VJ081',
      dep: 'SGN',
      arr: 'MEL',
      totalPrebook: 282,
      businessPax: 11,
      australiaBeefFreshVegetables: 10,
      australiaBreadVegetables: 10,
      sbbCocktail: 22,
      sbbMaccaRaisins: 22,
      sbbUtensils: 38,
      sbbKit: 12,
      sbbPillow: 12,
      sbbMattress: 12,
      sbbMealType: 'standard',
      hotmealItems: { spaghetti: 77 },
      sourceRefs: { flightNo: 'ref' },
    })
  })
})

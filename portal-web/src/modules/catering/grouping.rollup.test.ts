import { describe, expect, it } from 'vitest'
import { autoGroupFlights, rollupLegMeals } from './grouping'
import type { RawFlight } from './groupingTypes'

const F = (p: Partial<RawFlight>): RawFlight => ({
  flightNo: 'VJ1', aircraft: 'VN-A1', aircraftType: 'A321', dep: 'SGN', arr: 'HAN',
  std: '06:00', sta: '08:00', purser: 'P', purserCode: 'P1', intl: false, ...p,
})

describe('rollupLegMeals', () => {
  it('sums per-leg dish counts desc by count', () => {
    expect(rollupLegMeals([
      { flightNo: 'a', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, meals: [{ name: 'Phở', count: 3 }] },
      { flightNo: 'b', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', intl: false, meals: [{ name: 'Phở', count: 2 }, { name: 'Mì', count: 7 }] },
    ])).toEqual([{ name: 'Mì', count: 7 }, { name: 'Phở', count: 5 }])
  })
})

describe('autoGroupFlights leg meals', () => {
  it('copies per-flight meals onto each leg and derives group.meals from them', () => {
    const groups = autoGroupFlights(
      [
        F({ flightNo: 'VJ1', aircraft: 'VN-A1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', meals: [{ name: 'Phở', count: 4 }] }),
        F({ flightNo: 'VJ2', aircraft: 'VN-A1', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', meals: [{ name: 'Phở', count: 6 }] }),
      ],
      { cateringStations: new Set(['SGN']), groupByPurser: true },
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].legs.map((l) => l.meals)).toEqual([[{ name: 'Phở', count: 4 }], [{ name: 'Phở', count: 6 }]])
    expect(groups[0].meals).toEqual([{ name: 'Phở', count: 10 }])
  })
})

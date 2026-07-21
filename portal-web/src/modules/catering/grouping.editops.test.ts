import { describe, expect, it } from 'vitest'
import { aggregateDayMeals, autoGroupFlights, mergeGroups, splitGroupAt } from './grouping'
import type { RawFlight } from './groupingTypes'

const F = (p: Partial<RawFlight>): RawFlight => ({
  flightNo: 'VJ1', aircraft: 'VN-A1', aircraftType: 'A321', dep: 'SGN', arr: 'HAN',
  std: '06:00', sta: '08:00', purser: 'P', purserCode: 'P1', intl: false, ...p,
})

function twoLegGroup() {
  return autoGroupFlights(
    [
      F({ flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', meals: [{ name: 'Phở', count: 4 }] }),
      F({ flightNo: 'VJ2', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', meals: [{ name: 'Phở', count: 6 }] }),
    ],
    { cateringStations: new Set(['SGN']), groupByPurser: true },
  )
}

describe('edit ops keep day-total meals correct', () => {
  it('does not double-count dishes after a split', () => {
    const groups = twoLegGroup()
    expect(aggregateDayMeals(groups)).toEqual([{ name: 'Phở', count: 10 }])

    const split = splitGroupAt(groups, groups[0].id, 1)
    expect(split).toHaveLength(2)
    expect(aggregateDayMeals(split)).toEqual([{ name: 'Phở', count: 10 }])
    expect(split[0].meals).toEqual([{ name: 'Phở', count: 4 }])
    expect(split[1].meals).toEqual([{ name: 'Phở', count: 6 }])
  })

  it('keeps the total after split-then-merge', () => {
    const groups = twoLegGroup()
    const split = splitGroupAt(groups, groups[0].id, 1)
    const merged = mergeGroups(split, split[0].id, split[1].id)
    expect(merged).toHaveLength(1)
    expect(aggregateDayMeals(merged)).toEqual([{ name: 'Phở', count: 10 }])
    expect(merged[0].meals).toEqual([{ name: 'Phở', count: 10 }])
  })
})

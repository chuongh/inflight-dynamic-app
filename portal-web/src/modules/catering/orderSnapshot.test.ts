import { describe, expect, it } from 'vitest'
import { buildOrderSnapshot } from './orderSnapshot'
import type { FlightGroup, FlightLeg } from './groupingTypes'

const codeOf = () => ['X']
const group = (id: string, legs: FlightLeg[]): FlightGroup => ({
  id, aircraft: 'VN-A1', aircraftType: 'A321', purser: 'P', purserCode: 'P1',
  confidence: 'high', confirmed: true, legs,
})

describe('buildOrderSnapshot', () => {
  it('emits one prebook cell per flight per dish, and lines aggregate them', () => {
    const groups = [
      group('g1', [
        { flightNo: 'VJ1', dep: 'SGN', arr: 'PQC', std: '06:00', sta: '07:00', intl: false, meals: [{ name: 'Cơm', count: 40 }] },
        { flightNo: 'VJ2', dep: 'PQC', arr: 'SGN', std: '09:00', sta: '10:00', intl: false, meals: [{ name: 'Cơm', count: 38 }] },
      ]),
      group('g2', [
        { flightNo: 'VJ9', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, meals: [{ name: 'Cơm', count: 20 }] },
      ]),
    ]
    const { lines, breakdown } = buildOrderSnapshot(groups, undefined, codeOf)
    const prebook = breakdown.filter((c) => c.category === 'prebook')
    expect(prebook).toHaveLength(3)
    expect(prebook.map((c) => [c.flightNo, c.qty])).toEqual([['VJ1', 40], ['VJ2', 38], ['VJ9', 20]])
    const com = lines.find((l) => l.name === 'Cơm')!
    expect(com.qty).toBe(98)
    expect(com.suggested).toBe(98)
    expect(com.pbmlCodes).toEqual(['X'])
  })

  it('emits a per-flight sales cell from leg salesQuota', () => {
    const groups = [
      group('g1', [
        { flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, salesQuota: { hotmeal: 5, banhMi: 0, traSua: 0 } },
      ]),
    ]
    const { breakdown } = buildOrderSnapshot(groups, undefined, codeOf)
    const sales = breakdown.filter((c) => c.category === 'sales')
    expect(sales).toEqual([{ category: 'sales', name: 'hotmeal', groupId: 'g1', flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', qty: 5 }])
  })
})

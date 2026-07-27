import { describe, expect, it } from 'vitest'
import { createFlightJoinKey, normalizeFlightNumber } from './normalize'

describe('supplier flight normalization', () => {
  it('normalizes VJ083 and VJ83 to the same flight number', () => {
    expect(normalizeFlightNumber(' VJ083 ')).toBe('VJ83')
    expect(normalizeFlightNumber('VJ83')).toBe('VJ83')
  })

  it('builds the required operating-date, flight, departure and arrival join key', () => {
    expect(createFlightJoinKey({
      operatingDate: '08/07/2026',
      flightNo: ' VJ083 ',
      dep: 'sgn',
      arr: 'mel',
    })).toBe('2026-07-08|VJ83|SGN|MEL')
  })
})

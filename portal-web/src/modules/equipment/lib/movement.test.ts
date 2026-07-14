import { describe, expect, it } from 'vitest'
import type { TrolleyUnit } from '../constants'
import { applyCheckin, applyCheckout, isStale } from './movement'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

function unit(p: Partial<TrolleyUnit> = {}): TrolleyUnit {
  return {
    code: 'F-001', type: 'full', status: 'service', station: 'SGN',
    repairs: 0, lastRepairReason: '—', vendor: 'ABC Repair', daysInStatus: 5,
    updatedAt: NOW - 5 * DAY, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
    yearOfManufacture: 2022, registrationLocation: 'SGN', repairHistory: [],
    rfidEpc: 'E280 0000 0001', lastSeenAt: NOW - 5 * DAY, lastSeenStation: 'SGN', movements: [],
    ...p,
  }
}

describe('applyCheckout', () => {
  it('moves unit to in-transit with custody and a checkout movement', () => {
    const next = applyCheckout(
      unit(),
      { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' },
      NOW,
    )
    expect(next.status).toBe('in-transit')
    expect(next.custody).toEqual({ holder: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', since: NOW })
    expect(next.lastSeenAt).toBe(NOW)
    expect(next.lastSeenStation).toBe('SGN')
    expect(next.movements[0]).toMatchObject({ type: 'checkout', flight: 'VJ311', toStation: 'HAN', condition: 'ok' })
  })
})

describe('applyCheckin', () => {
  it('returns to service and clears custody when condition ok', () => {
    const inTransit = applyCheckout(unit(), { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' }, NOW)
    const next = applyCheckin(inTransit, { actor: 'CC. Ha', station: 'HAN', condition: 'ok' }, NOW + DAY)
    expect(next.status).toBe('service')
    expect(next.custody).toBeUndefined()
    expect(next.station).toBe('HAN')
    expect(next.lastSeenStation).toBe('HAN')
    expect(next.movements[0]).toMatchObject({ type: 'checkin', station: 'HAN', condition: 'ok' })
  })

  it('moves to not-service when condition damaged', () => {
    const inTransit = applyCheckout(unit(), { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' }, NOW)
    const next = applyCheckin(inTransit, { actor: 'CC. Ha', station: 'HAN', condition: 'damaged', note: 'Rear wheel seized' }, NOW + DAY)
    expect(next.status).toBe('not-service')
    expect(next.lastRepairReason).toBe('Rear wheel seized')
    expect(next.daysInStatus).toBe(0)
  })
})

describe('isStale', () => {
  it('flags units not scanned within threshold, excluding in-transit/retired', () => {
    expect(isStale(unit({ lastSeenAt: NOW - 8 * DAY }), NOW)).toBe(true)
    expect(isStale(unit({ lastSeenAt: NOW - 3 * DAY }), NOW)).toBe(false)
    expect(isStale(unit({ status: 'in-transit', lastSeenAt: NOW - 40 * DAY }), NOW)).toBe(false)
    expect(isStale(unit({ status: 'retired', lastSeenAt: NOW - 40 * DAY }), NOW)).toBe(false)
  })
})

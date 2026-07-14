import { describe, expect, it } from 'vitest'
import type { TrolleyUnit } from '../constants'
import { normalizeTrolley } from './normalizeTrolley'

const NOW = 1_760_000_000_000

const legacy = {
  code: 'F-142', type: 'full', status: 'not-service', station: 'SGN',
  repairs: 9, lastRepairReason: 'Wheel', vendor: 'ABC Repair', daysInStatus: 3,
  updatedAt: NOW, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
  yearOfManufacture: 2020, registrationLocation: 'SGN', repairHistory: [],
} as unknown as TrolleyUnit

describe('normalizeTrolley', () => {
  it('adds a deterministic RFID EPC derived from the code', () => {
    const a = normalizeTrolley(legacy, NOW)
    const b = normalizeTrolley(legacy, NOW)
    expect(a.rfidEpc).toMatch(/^E280 /)
    expect(a.rfidEpc).toBe(b.rfidEpc) // deterministic
  })

  it('fills lastSeenAt/lastSeenStation and empty movements when missing', () => {
    const n = normalizeTrolley(legacy, NOW)
    expect(typeof n.lastSeenAt).toBe('number')
    expect(n.lastSeenStation).toBe('SGN')
    expect(Array.isArray(n.movements)).toBe(true)
  })

  it('never overwrites values that already exist', () => {
    const withData = { ...legacy, rfidEpc: 'E280 AAAA BBBB', lastSeenStation: 'HAN', movements: [] } as TrolleyUnit
    const n = normalizeTrolley(withData, NOW)
    expect(n.rfidEpc).toBe('E280 AAAA BBBB')
    expect(n.lastSeenStation).toBe('HAN')
  })
})

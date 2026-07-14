import { describe, expect, it } from 'vitest'
import type { TrolleyRepairEntry, TrolleyUnit } from '../constants'
import { computeVendorOnTime } from './vendorOnTime'

const DAY = 86_400_000
const NOW = 1_760_000_000_000 // fixed epoch for determinism

function entry(p: Partial<TrolleyRepairEntry> & { startedAt: number }): TrolleyRepairEntry {
  return {
    id: p.id ?? `e-${p.startedAt}-${p.vendor ?? 'x'}`,
    startedAt: p.startedAt,
    completedAt: p.completedAt,
    issueDescription: p.issueDescription ?? 'Wheel failure',
    repairContent: p.repairContent,
    rootCause: p.rootCause,
    vendor: p.vendor ?? 'ABC Repair',
  }
}

function unit(p: Partial<TrolleyUnit>): TrolleyUnit {
  return {
    code: 'F-001', type: 'full', status: 'service', station: 'SGN',
    repairs: 0, lastRepairReason: '—', vendor: 'ABC Repair', daysInStatus: 1,
    updatedAt: NOW, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
    yearOfManufacture: 2020, registrationLocation: 'SGN', repairHistory: [],
    rfidEpc: 'E280 0000 0001', lastSeenAt: NOW, lastSeenStation: 'SGN', movements: [],
    ...p,
  }
}

describe('computeVendorOnTime', () => {
  it('is 100 when all of a vendor\'s completed repairs finish within the SLA window', () => {
    const trolleys = [
      unit({
        code: 'F-010',
        repairHistory: [
          entry({ startedAt: NOW - 10 * DAY, completedAt: NOW - 5 * DAY, vendor: 'ABC Repair' }), // TAT 5d
          entry({ startedAt: NOW - 30 * DAY, completedAt: NOW - 27 * DAY, vendor: 'ABC Repair' }), // TAT 3d
        ],
      }),
    ]
    expect(computeVendorOnTime(trolleys)).toEqual({ 'ABC Repair': 100 })
  })

  it('is 50 when only one of two completed repairs meets the SLA', () => {
    const trolleys = [
      unit({
        code: 'F-011',
        repairHistory: [
          entry({ startedAt: NOW - 20 * DAY, completedAt: NOW - 15 * DAY, vendor: 'TLD Vietnam' }), // TAT 5d -> on time
          entry({ startedAt: NOW - 50 * DAY, completedAt: NOW - 30 * DAY, vendor: 'TLD Vietnam' }), // TAT 20d -> late
        ],
      }),
    ]
    expect(computeVendorOnTime(trolleys)).toEqual({ 'TLD Vietnam': 50 })
  })

  it('is 0 for a vendor with repairs but none completed', () => {
    const trolleys = [
      unit({
        code: 'F-012',
        repairHistory: [entry({ startedAt: NOW - 5 * DAY, vendor: 'Zero Vendor' })], // still open
      }),
    ]
    expect(computeVendorOnTime(trolleys)).toEqual({ 'Zero Vendor': 0 })
  })

  it('respects a custom slaDays threshold', () => {
    const trolleys = [
      unit({
        code: 'F-013',
        repairHistory: [
          entry({ startedAt: NOW - 10 * DAY, completedAt: NOW - 5 * DAY, vendor: 'Strict Co' }), // TAT 5d
        ],
      }),
    ]
    expect(computeVendorOnTime(trolleys, 3)).toEqual({ 'Strict Co': 0 })
    expect(computeVendorOnTime(trolleys, 7)).toEqual({ 'Strict Co': 100 })
  })

  it('does not mutate the input trolleys', () => {
    const trolleys = [
      unit({
        code: 'F-014',
        repairHistory: [entry({ startedAt: NOW - 10 * DAY, completedAt: NOW - 5 * DAY, vendor: 'ABC Repair' })],
      }),
    ]
    const snapshot = JSON.parse(JSON.stringify(trolleys))
    computeVendorOnTime(trolleys)
    expect(trolleys).toEqual(snapshot)
  })
})

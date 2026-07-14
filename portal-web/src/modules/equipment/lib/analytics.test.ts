import { describe, expect, it } from 'vitest'
import type { TrolleyRepairEntry, TrolleyUnit } from '../constants'
import {
  computeHealthScore,
  computeMtbfDays,
  computeReworkStats,
  computeVendorScorecard,
  isReworkEntry,
} from './analytics'

const DAY = 86_400_000
const NOW = 1_760_000_000_000 // fixed epoch for determinism

function entry(p: Partial<TrolleyRepairEntry> & { startedAt: number }): TrolleyRepairEntry {
  return {
    id: `e-${p.startedAt}`,
    startedAt: p.startedAt,
    completedAt: p.completedAt ?? p.startedAt + 3 * DAY,
    issueDescription: p.issueDescription ?? 'Wheel failure',
    repairContent: p.repairContent ?? 'Replaced wheel',
    rootCause: p.rootCause ?? 'Wear',
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

describe('computeHealthScore', () => {
  it('is 100 for a brand-new unit with no repairs', () => {
    expect(computeHealthScore(unit({ yearOfManufacture: 2026 }), NOW)).toBe(100)
  })

  it('drops with repair count, age, and rework, clamped to 0..100', () => {
    const many = Array.from({ length: 9 }, (_, i) => entry({ startedAt: NOW - (300 - i * 30) * DAY }))
    const score = computeHealthScore(
      unit({ repairs: 9, yearOfManufacture: 2020, repairHistory: many }),
      NOW,
    )
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThan(60)
  })
})

describe('computeMtbfDays', () => {
  it('returns null when fewer than 2 completed repairs', () => {
    expect(computeMtbfDays(unit({ repairHistory: [entry({ startedAt: NOW - 10 * DAY })] }))).toBeNull()
  })

  it('averages the gap between consecutive completed repair starts', () => {
    const h = [
      entry({ startedAt: NOW - 100 * DAY }),
      entry({ startedAt: NOW - 60 * DAY }),
      entry({ startedAt: NOW - 20 * DAY }),
    ]
    // gaps: 40d and 40d -> mean 40
    expect(computeMtbfDays(unit({ repairHistory: h }))).toBe(40)
  })
})

describe('isReworkEntry / computeReworkStats', () => {
  it('flags a repair that follows another within 30 days', () => {
    // history is newest-first (matches app convention)
    const history = [
      entry({ startedAt: NOW - 5 * DAY }),   // index 0, newest — 17d after prev -> rework
      entry({ startedAt: NOW - 22 * DAY }),  // index 1, older
    ]
    expect(isReworkEntry(history, 0)).toBe(true)
    expect(isReworkEntry(history, 1)).toBe(false)
  })

  it('does not flag repairs spaced beyond the window', () => {
    const history = [entry({ startedAt: NOW - 5 * DAY }), entry({ startedAt: NOW - 90 * DAY })]
    expect(isReworkEntry(history, 0)).toBe(false)
  })

  it('computes rework rate over total repairs', () => {
    const history = [entry({ startedAt: NOW - 5 * DAY }), entry({ startedAt: NOW - 22 * DAY })]
    const stats = computeReworkStats(unit({ repairHistory: history }))
    expect(stats).toEqual({ reworkCount: 1, total: 2, rate: 0.5 })
  })
})

describe('computeVendorScorecard', () => {
  it('aggregates repairs, reworks and TAT per vendor, sorted by reworkRate desc', () => {
    const a = unit({
      code: 'F-002',
      repairHistory: [
        entry({ startedAt: NOW - 5 * DAY, vendor: 'ABC Repair' }),
        entry({ startedAt: NOW - 22 * DAY, vendor: 'ABC Repair' }),
      ],
    })
    const b = unit({
      code: 'F-003',
      repairHistory: [entry({ startedAt: NOW - 200 * DAY, completedAt: NOW - 196 * DAY, vendor: 'TLD Vietnam' })],
    })
    const board = computeVendorScorecard([a, b])
    const abc = board.find((v) => v.vendor === 'ABC Repair')!
    const tld = board.find((v) => v.vendor === 'TLD Vietnam')!
    expect(abc.repairs).toBe(2)
    expect(abc.reworks).toBe(1)
    expect(tld.reworks).toBe(0)
    expect(board[0].vendor).toBe('ABC Repair') // highest rework rate first
  })
})

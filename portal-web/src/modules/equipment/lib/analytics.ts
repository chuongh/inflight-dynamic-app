import type { TrolleyRepairEntry, TrolleyUnit } from '../constants'

const DAY = 86_400_000
const REWORK_WINDOW_DAYS = 30

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** Completed repairs only, sorted oldest→newest by startedAt. */
function completedSorted(unit: TrolleyUnit): TrolleyRepairEntry[] {
  return unit.repairHistory
    .filter((entry) => entry.completedAt != null)
    .slice()
    .sort((left, right) => left.startedAt - right.startedAt)
}

/**
 * 0–100. Starts at 100; penalised by repair count, age, and recent rework.
 * Deterministic and monotonic — new+unrepaired = 100.
 */
export function computeHealthScore(unit: TrolleyUnit, now: number): number {
  const ageYears = Math.max(0, (now - new Date(unit.yearOfManufacture, 0, 1).getTime()) / (365 * DAY))
  const { reworkCount } = computeReworkStats(unit)
  const raw = 100 - unit.repairs * 6 - ageYears * 3 - reworkCount * 10
  return Math.round(clamp(raw, 0, 100))
}

/** Mean days between consecutive completed repairs; null if < 2. */
export function computeMtbfDays(unit: TrolleyUnit): number | null {
  const completed = completedSorted(unit)
  if (completed.length < 2) return null
  let totalGap = 0
  for (let i = 1; i < completed.length; i += 1) {
    totalGap += completed[i].startedAt - completed[i - 1].startedAt
  }
  return Math.round(totalGap / (completed.length - 1) / DAY)
}

/**
 * True when the repair at `index` (in a newest-first history) started within
 * REWORK_WINDOW_DAYS after the immediately-preceding (older) repair completed.
 */
export function isReworkEntry(
  history: TrolleyRepairEntry[],
  index: number,
  windowDays = REWORK_WINDOW_DAYS,
): boolean {
  const current = history[index]
  const previous = history[index + 1] // older (history is newest-first)
  if (!current || !previous) return false
  const previousEnd = previous.completedAt ?? previous.startedAt
  const gapDays = (current.startedAt - previousEnd) / DAY
  return gapDays >= 0 && gapDays <= windowDays
}

export function computeReworkStats(unit: TrolleyUnit): {
  reworkCount: number
  total: number
  rate: number
} {
  const history = unit.repairHistory
  let reworkCount = 0
  for (let i = 0; i < history.length; i += 1) {
    if (isReworkEntry(history, i)) reworkCount += 1
  }
  const total = history.length
  return { reworkCount, total, rate: total === 0 ? 0 : reworkCount / total }
}

export interface VendorScore {
  vendor: string
  repairs: number
  reworks: number
  reworkRate: number
  avgTatDays: number
}

export function computeVendorScorecard(trolleys: TrolleyUnit[]): VendorScore[] {
  const map = new Map<string, { repairs: number; reworks: number; tatSum: number; tatCount: number }>()

  for (const unit of trolleys) {
    const history = unit.repairHistory
    for (let i = 0; i < history.length; i += 1) {
      const entry = history[i]
      const bucket = map.get(entry.vendor) ?? { repairs: 0, reworks: 0, tatSum: 0, tatCount: 0 }
      bucket.repairs += 1
      if (isReworkEntry(history, i)) bucket.reworks += 1
      if (entry.completedAt != null) {
        bucket.tatSum += Math.max(1, Math.floor((entry.completedAt - entry.startedAt) / DAY))
        bucket.tatCount += 1
      }
      map.set(entry.vendor, bucket)
    }
  }

  return Array.from(map.entries())
    .map(([vendor, b]) => ({
      vendor,
      repairs: b.repairs,
      reworks: b.reworks,
      reworkRate: b.repairs === 0 ? 0 : b.reworks / b.repairs,
      avgTatDays: b.tatCount === 0 ? 0 : Math.round((b.tatSum / b.tatCount) * 10) / 10,
    }))
    .sort((left, right) => right.reworkRate - left.reworkRate || right.repairs - left.repairs)
}

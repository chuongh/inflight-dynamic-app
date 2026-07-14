/**
 * Crew-meal configuration — pure domain helpers + the simulator engine.
 * No React / no I/O. Implements the BRule-04 / 26–29 computation so the
 * config UI can show, live, how a rule change moves the meal count.
 */
import type {
  CrewGroup,
  CrewMealConfigVersion,
  CrewMealProfile,
  MealWindow,
  SampleRotation,
} from './crewMealTypes'
import type { VersionStatus } from './types'

/** The version currently in effect (falls back to the newest if none active). */
export function activeCrewMealVersion(
  versions: CrewMealConfigVersion[],
): CrewMealConfigVersion | null {
  if (versions.length === 0) return null
  return (
    versions.find((v) => v.status === 'active') ??
    [...versions].sort((a, b) => b.version - a.version)[0]
  )
}

/** Versions newest-first — the order shown in the selector. */
export function crewMealVersionsNewestFirst(
  versions: CrewMealConfigVersion[],
): CrewMealConfigVersion[] {
  return [...versions].sort((a, b) => b.version - a.version)
}

/** Next numeric version id from the current set. */
export function nextCrewMealVersionNumber(versions: CrewMealConfigVersion[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1
}

/**
 * Produce the next dataset after publishing an edited profile set. The prior
 * active version is superseded; the new one is 'active' if it starts today or
 * earlier, otherwise 'scheduled'. Mirrors withNewConfigVersion for quota rules.
 */
export function withNewCrewMealVersion(
  versions: CrewMealConfigVersion[],
  profiles: CrewMealProfile[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): CrewMealConfigVersion[] {
  const num = nextCrewMealVersionNumber(versions)
  const newStatus: VersionStatus = meta.startsInFuture ? 'scheduled' : 'active'

  const updated = versions.map((v) =>
    v.status === 'active' && !meta.startsInFuture
      ? { ...v, status: 'superseded' as VersionStatus, effectiveTo: meta.effectiveFrom }
      : v,
  )

  const created: CrewMealConfigVersion = {
    id: `m${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    profiles,
  }

  return [created, ...updated]
}

/** The profile for a crew group within a version. */
export function profileFor(
  version: CrewMealConfigVersion,
  group: CrewGroup,
): CrewMealProfile | undefined {
  return version.profiles.find((p) => p.group === group)
}

/* ------------------------------------------------------------------ */
/* Simulator engine — BRule-04 / 26 / 27 / 28 / 29                     */
/* ------------------------------------------------------------------ */

/** HH:MM → minutes from midnight. */
export function hhmmToMinutes(t: string): number {
  const [h, m] = t.split(':')
  return Number(h) * 60 + Number(m)
}

/** Whether a window wraps past midnight (close ≤ open). */
export function windowCrossesMidnight(w: MealWindow): boolean {
  return hhmmToMinutes(w.end) <= hhmmToMinutes(w.start)
}

/** Human span, e.g. "06:00–08:00" or "22:00–04:00 (+1)". */
export function windowSpanLabel(w: MealWindow): string {
  return `${w.start}–${w.end}${windowCrossesMidnight(w) ? ' (+1)' : ''}`
}

interface DutySpan {
  /** Absolute minutes from base-day midnight. */
  start: number
  end: number
}

interface WindowOccurrence {
  windowId: string
  slot: MealWindow['slot']
  /** Which calendar day (offset from base day) the meal falls on. */
  day: number
  /** Overlap with the duty span, in minutes. */
  overlap: number
}

export interface SimulationResult {
  dutySpan: DutySpan
  /** Windows overlapped by ≥ minOverlap, one entry per counted occasion. */
  hits: WindowOccurrence[]
  /** Distinct meal occasions counted after the split rule. */
  windowsHit: number
  /** Head-count after column filter + dedupe. */
  uniquePeople: number
  /** Head-count rows before dedupe (for the "N rows → M people" hint). */
  countedRows: number
  meals: number
}

/** Duty span for a rotation under a profile (BRule-26). */
function computeDutySpan(rotation: SampleRotation, profile: CrewMealProfile): DutySpan {
  const deps = rotation.legs.map((l) => l.depDay * 1440 + hhmmToMinutes(l.std))
  const arrs = rotation.legs.map((l) => l.arrDay * 1440 + hhmmToMinutes(l.sta))
  return {
    start: Math.min(...deps) - profile.preStdMinutes,
    end: Math.max(...arrs) + profile.postStaMinutes,
  }
}

/** Overlap (minutes) of [aStart,aEnd] with [bStart,bEnd]. */
function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

/**
 * Run one rotation through a profile. Windows overlapped by ≥ minOverlap are
 * counted (BRule-27). Multi-day duties see a window once per calendar day when
 * splitByLandingDate is on (BRule-29); otherwise each distinct window counts once.
 */
export function simulateCrewMeal(
  rotation: SampleRotation,
  profile: CrewMealProfile,
): SimulationResult {
  const duty = computeDutySpan(rotation, profile)
  const firstDay = Math.floor(duty.start / 1440)
  const lastDay = Math.floor(duty.end / 1440)

  const occurrences: WindowOccurrence[] = []
  for (const w of profile.windows) {
    const open = hhmmToMinutes(w.start)
    const close = hhmmToMinutes(w.end)
    const span = windowCrossesMidnight(w) ? close + 1440 : close
    for (let day = firstDay - 1; day <= lastDay + 1; day++) {
      const base = day * 1440
      const ov = overlapMinutes(duty.start, duty.end, base + open, base + span)
      if (ov >= profile.minOverlapMinutes) {
        occurrences.push({ windowId: w.id, slot: w.slot, day, overlap: ov })
      }
    }
  }

  // BRule-29: split by landing date → each per-day occurrence is its own meal.
  // Off → collapse to distinct windows regardless of day.
  const hits = profile.splitByLandingDate
    ? occurrences
    : occurrences.filter(
        (o, i) => occurrences.findIndex((x) => x.windowId === o.windowId) === i,
      )

  const counted = rotation.crew.filter((c) => profile.countedColumns.includes(c.column))
  const uniquePeople = profile.dedupeByEmployee
    ? new Set(counted.map((c) => `${c.name}|${c.code}`)).size
    : counted.length

  const windowsHit = hits.length
  return {
    dutySpan: duty,
    hits,
    windowsHit,
    uniquePeople,
    countedRows: counted.length,
    meals: uniquePeople * windowsHit,
  }
}

/** Absolute minutes → "HH:MM" (+1 suffix when past base day). */
export function absMinutesToLabel(min: number): string {
  const day = Math.floor(min / 1440)
  const within = ((min % 1440) + 1440) % 1440
  const h = String(Math.floor(within / 60)).padStart(2, '0')
  const m = String(within % 60).padStart(2, '0')
  return `${h}:${m}${day > 0 ? ` (+${day})` : day < 0 ? ` (${day})` : ''}`
}

/* ------------------------------------------------------------------ */
/* Canned rotations for the simulator (verify baselines from UC-06)   */
/* ------------------------------------------------------------------ */

export const SAMPLE_ROTATIONS: SampleRotation[] = [
  {
    id: 'rot-vj5512',
    label: 'VJ5512 → VJ5513 · SGN⇄HAN',
    date: '25/06/2026',
    note: 'Baseline UC-06: 4 người · trúng 1 khung (Sáng) → 4 suất.',
    legs: [
      { flightNo: 'VJ5512', from: 'SGN', to: 'HAN', std: '05:40', sta: '07:50', depDay: 0, arrDay: 0 },
      { flightNo: 'VJ5513', from: 'HAN', to: 'SGN', std: '08:30', sta: '10:40', depDay: 0, arrDay: 0 },
    ],
    crew: [
      { name: 'Nguyễn Văn A', code: 'P01234', column: 'cockpit' },
      { name: 'Trần Văn B', code: 'P02345', column: 'cockpit' },
      { name: 'Lê Thị C', code: 'C03456', column: 'cabin' },
      { name: 'Phạm Thị D', code: 'C04567', column: 'cabin' },
      { name: 'Vũ Văn E', code: 'C05678', column: 'cabin' },
      { name: 'Đỗ Thị F', code: 'C06789', column: 'cabin' },
    ],
  },
  {
    id: 'rot-vj1604',
    label: 'VJ1604 · rotation trùng tên (dedupe)',
    date: '25/06/2026',
    note: 'BRule-28: một cơ trưởng lặp ở 2 dòng → dedupe còn 3 người.',
    legs: [
      { flightNo: 'VJ1604', from: 'SGN', to: 'DAD', std: '06:20', sta: '07:40', depDay: 0, arrDay: 0 },
      { flightNo: 'VJ1605', from: 'DAD', to: 'SGN', std: '08:15', sta: '09:35', depDay: 0, arrDay: 0 },
    ],
    crew: [
      { name: 'Hoàng Văn G', code: 'P07001', column: 'cockpit' },
      { name: 'Hoàng Văn G', code: 'P07001', column: 'positioning' },
      { name: 'Bùi Văn H', code: 'P07002', column: 'cockpit' },
      { name: 'Mai Văn K', code: 'P07003', column: 'jumpseat' },
    ],
  },
  {
    id: 'rot-vj083',
    label: 'VJ083 · long-haul (2 khung)',
    date: '26/06/2026',
    note: 'Ca bay dài trúng Trưa + Chiều → người × 2.',
    legs: [
      { flightNo: 'VJ083', from: 'SGN', to: 'MEL', std: '10:20', sta: '19:50', depDay: 0, arrDay: 0 },
    ],
    crew: [
      { name: 'Ngô Văn L', code: 'P08001', column: 'cockpit' },
      { name: 'Đặng Văn M', code: 'P08002', column: 'cockpit' },
      { name: 'Tạ Văn N', code: 'P08003', column: 'jumpseat' },
    ],
  },
  {
    id: 'rot-vj896',
    label: 'VJ896 · red-eye qua đêm',
    date: '26/06/2026',
    note: 'Hạ cánh sang ngày kế — thử toggle "tách theo ngày hạ cánh".',
    legs: [
      { flightNo: 'VJ896', from: 'ICN', to: 'SGN', std: '21:10', sta: '05:20', depDay: 0, arrDay: 1 },
    ],
    crew: [
      { name: 'Lý Văn P', code: 'P09001', column: 'cockpit' },
      { name: 'Hồ Văn Q', code: 'P09002', column: 'cockpit' },
    ],
  },
]

/** Pure helpers for UC-11 catering flight-grouping. All functions are
 *  immutable — editing operations return a fresh `groups` array. */
import type { FlightGroup, FlightLeg, RawFlight } from './groupingTypes'

/** Stations that have catering — a rotation loads its meals at one of these. */
export const CATERING_STATIONS = new Set(['SGN', 'HAN', 'CXR'])

export function isCateringStation(code: string): boolean {
  return CATERING_STATIONS.has(code)
}

/** `HH:MM` → minutes since midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Sort key that treats after-midnight times (< 04:00) as next-day. */
export function legTimeKey(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h < 4 ? h + 24 : h) * 60 + m
}

/** Airborne minutes of one leg, handling overnight arrivals. */
export function legDurationMin(leg: FlightLeg): number {
  return (toMinutes(leg.sta) - toMinutes(leg.std) + 1440) % 1440
}

/** Total scheduled flight time of a whole group, in minutes. */
export function groupFlightMinutes(group: FlightGroup): number {
  return group.legs.reduce((sum, leg) => sum + legDurationMin(leg), 0)
}

/** Minutes → `Hh MM`, e.g. 280 → `4h40`. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

/** Ordered station codes of a rotation: [dep0, arr0, arr1, …]. */
export function stationsOf(group: FlightGroup): string[] {
  if (group.legs.length === 0) return []
  return [group.legs[0].dep, ...group.legs.map((l) => l.arr)]
}

/** A group the AI is unsure about and the staff has not yet confirmed. */
export function isReview(group: FlightGroup): boolean {
  return group.confidence === 'mid' && !group.confirmed
}

/** Review-needed first, confirmed last, otherwise keep source order. */
export function sortForReview(groups: FlightGroup[]): FlightGroup[] {
  const rank = (g: FlightGroup) => (isReview(g) ? 0 : g.confirmed ? 2 : 1)
  return groups
    .map((g, i) => ({ g, i }))
    .sort((a, b) => rank(a.g) - rank(b.g) || a.i - b.i)
    .map((x) => x.g)
}

let splitSeq = 0
function newGroupId(base: string): string {
  splitSeq += 1
  return `${base}-s${splitSeq}`
}

/**
 * Auto-group raw flights the way the AI does: sequence per aircraft by time,
 * then break into a new group whenever the purser changes. This mirrors the
 * manual Excel rule (group by A/C, then by purser rotation).
 */
export function autoGroupFlights(flights: RawFlight[]): FlightGroup[] {
  const sorted = [...flights].sort(
    (a, b) => a.aircraft.localeCompare(b.aircraft) || legTimeKey(a.std) - legTimeKey(b.std),
  )
  const groups: FlightGroup[] = []
  let current: FlightGroup | null = null
  let seq = 0
  for (const f of sorted) {
    const sameRun =
      current !== null && current.aircraft === f.aircraft && current.purserCode === f.purserCode
    if (!sameRun) {
      seq += 1
      current = {
        id: `ag${seq}`,
        aircraft: f.aircraft,
        aircraftType: f.aircraftType,
        purser: f.purser,
        purserCode: f.purserCode,
        confidence: 'high',
        confirmed: false,
        legs: [],
      }
      groups.push(current)
    }
    current!.legs.push({
      flightNo: f.flightNo,
      dep: f.dep,
      arr: f.arr,
      std: f.std,
      sta: f.sta,
      intl: f.intl,
    })
  }
  return groups
}

/** Split a group into two at leg index `at` (1..legs.length-1). */
export function splitGroupAt(groups: FlightGroup[], groupId: string, at: number): FlightGroup[] {
  const idx = groups.findIndex((g) => g.id === groupId)
  if (idx === -1) return groups
  const g = groups[idx]
  if (at <= 0 || at >= g.legs.length) return groups
  const head: FlightGroup = {
    ...g,
    confidence: 'high',
    confirmed: false,
    reviewNote: undefined,
    legs: g.legs.slice(0, at),
  }
  const tail: FlightGroup = {
    ...g,
    id: newGroupId(g.id),
    confidence: 'high',
    confirmed: false,
    reviewNote: undefined,
    legs: g.legs.slice(at),
  }
  return [...groups.slice(0, idx), head, tail, ...groups.slice(idx + 1)]
}

/** Merge `sourceId` into `targetId` (legs re-sorted by departure time). */
export function mergeGroups(groups: FlightGroup[], targetId: string, sourceId: string): FlightGroup[] {
  if (targetId === sourceId) return groups
  const target = groups.find((g) => g.id === targetId)
  const source = groups.find((g) => g.id === sourceId)
  if (!target || !source) return groups
  const merged: FlightGroup = {
    ...target,
    confirmed: false,
    legs: [...target.legs, ...source.legs].sort((a, b) => legTimeKey(a.std) - legTimeKey(b.std)),
  }
  return groups.flatMap((g) => (g.id === sourceId ? [] : g.id === targetId ? [merged] : [g]))
}

/** Move one leg from a source group to a destination group. Empty source groups are dropped. */
export function moveLeg(
  groups: FlightGroup[],
  sourceId: string,
  legIndex: number,
  destId: string,
): FlightGroup[] {
  if (sourceId === destId) return groups
  const source = groups.find((g) => g.id === sourceId)
  const dest = groups.find((g) => g.id === destId)
  if (!source || !dest || legIndex < 0 || legIndex >= source.legs.length) return groups
  const leg = source.legs[legIndex]
  const nextSource: FlightGroup = {
    ...source,
    confirmed: false,
    legs: source.legs.filter((_, i) => i !== legIndex),
  }
  const nextDest: FlightGroup = {
    ...dest,
    confirmed: false,
    legs: [...dest.legs, leg].sort((a, b) => legTimeKey(a.std) - legTimeKey(b.std)),
  }
  return groups.flatMap((g) => {
    if (g.id === sourceId) return nextSource.legs.length === 0 ? [] : [nextSource]
    if (g.id === destId) return [nextDest]
    return [g]
  })
}

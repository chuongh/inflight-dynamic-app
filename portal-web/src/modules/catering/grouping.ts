/** Pure helpers for UC-11 catering flight-grouping. All functions are
 *  immutable — editing operations return a fresh `groups` array. */
import type { CockpitCrewMember, FlightGroup, FlightLeg, RawFlight } from './groupingTypes'

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

/** Chronological sort key for a leg, honouring the explicit next-day flag. */
export function legSortKey(leg: FlightLeg): number {
  const [h, m] = leg.std.split(':').map(Number)
  const nextDay = leg.stdNextDay ?? h < 4
  return (nextDay ? 24 : 0) * 60 + h * 60 + m
}

/** Airborne minutes of one leg, handling overnight arrivals. */
export function legDurationMin(leg: FlightLeg): number {
  return (toMinutes(leg.sta) - toMinutes(leg.std) + 1440) % 1440
}

/** Total scheduled flight time of a whole group, in minutes. */
export function groupFlightMinutes(group: FlightGroup): number {
  return group.legs.reduce((sum, leg) => sum + legDurationMin(leg), 0)
}

/** Sum of premeal across a group's legs (stays correct after split/merge/move). */
export function groupPremeal(group: FlightGroup): number {
  return group.legs.reduce((sum, leg) => sum + (leg.premeal ?? 0), 0)
}

/** Whether any leg in the group carries premeal data. */
export function hasPremeal(group: FlightGroup): boolean {
  return group.legs.some((leg) => leg.premeal != null)
}

/** A rotation that crosses midnight (any leg departs or arrives next day). */
export function isOvernight(group: FlightGroup): boolean {
  return group.legs.some((leg) => leg.stdNextDay || leg.staNextDay)
}

export type DishKind = 'business' | 'veg' | 'snack' | 'main'

/** Derived menu category from a dish name (reference-only grouping). */
export function dishKind(name: string): DishKind {
  const n = name.toLowerCase()
  if (n.includes('business')) return 'business'
  if (n.includes('chay') || n.includes('vegetarian') || n.startsWith('vcs')) return 'veg'
  if (n.includes('snack') || n.includes('happy meal') || n.includes('soda') || n.includes('bia'))
    return 'snack'
  return 'main'
}

/**
 * Distinct cockpit crew across a rotation, deduped by employee code — a pilot
 * flying several legs is one person, and a crew change mid-rotation adds
 * people. Prefers an operating record over a positioning one for the same
 * pilot. Falls back to the per-leg `cockpit`/`extra` counts when no named
 * roster exists (older seed days). This deduped list is what the crew-meal
 * head-count is built from, so the meal quantity matches the real names.
 */
export function groupCockpitRoster(group: FlightGroup): CockpitCrewMember[] {
  const byCode = new Map<string, CockpitCrewMember>()
  for (const leg of group.legs) {
    for (const m of leg.cockpitCrew ?? []) {
      const prev = byCode.get(m.code)
      // Keep the operating record if the same pilot also appears as positioning.
      if (!prev || (prev.riding && !m.riding)) byCode.set(m.code, m)
    }
  }
  return [...byCode.values()]
}

/** Distinct cockpit head-count for a group = operating + riding pilots. */
export function groupCockpitHeadcount(group: FlightGroup): { operating: number; riding: number } {
  const roster = groupCockpitRoster(group)
  if (roster.length > 0) {
    const operating = roster.filter((m) => !m.riding).length
    return { operating, riding: roster.length - operating }
  }
  // Fallback for days without a named roster: per-leg counts (crew assumed
  // constant across legs, so take the max leg).
  const operating = Math.max(0, ...group.legs.map((l) => l.cockpit ?? 0))
  const riding = Math.max(0, ...group.legs.map((l) => l.extra ?? 0))
  return { operating, riding }
}

/** Whether crew composition is known for the group. */
export function hasCrewData(group: FlightGroup): boolean {
  return group.legs.some((l) => l.cockpit != null)
}

/** Sum the commercial upsell quota across a group's legs. */
export function groupSalesQuota(group: FlightGroup): { hotmeal: number; banhMi: number; traSua: number } {
  return group.legs.reduce(
    (a, l) => ({
      hotmeal: a.hotmeal + (l.salesQuota?.hotmeal ?? 0),
      banhMi: a.banhMi + (l.salesQuota?.banhMi ?? 0),
      traSua: a.traSua + (l.salesQuota?.traSua ?? 0),
    }),
    { hotmeal: 0, banhMi: 0, traSua: 0 },
  )
}

export function hasSalesQuota(group: FlightGroup): boolean {
  return group.legs.some((l) => l.salesQuota != null)
}

/** Sum every group's per-dish premeal into a day total, sorted desc by qty. */
export function aggregateDayMeals(groups: FlightGroup[]): { name: string; count: number }[] {
  const map = new Map<string, number>()
  for (const g of groups) {
    for (const m of g.meals ?? []) map.set(m.name, (map.get(m.name) ?? 0) + m.count)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
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
    legs: [...target.legs, ...source.legs].sort((a, b) => legSortKey(a) - legSortKey(b)),
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
    legs: [...dest.legs, leg].sort((a, b) => legSortKey(a) - legSortKey(b)),
  }
  return groups.flatMap((g) => {
    if (g.id === sourceId) return nextSource.legs.length === 0 ? [] : [nextSource]
    if (g.id === destId) return [nextDest]
    return [g]
  })
}

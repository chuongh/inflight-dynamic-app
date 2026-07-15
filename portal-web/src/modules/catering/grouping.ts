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

/** Whether crew composition is known for the group (named roster or per-leg count). */
export function hasCrewData(group: FlightGroup): boolean {
  return group.legs.some((l) => l.cockpit != null || (l.cockpitCrew?.length ?? 0) > 0)
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

/** A group's uplift/origin station — where its meals are loaded (its first leg's departure). */
export function groupOrigin(group: FlightGroup): string {
  return group.legs[0]?.dep ?? ''
}

/** Inputs the AI-grouping rule needs beyond the raw flights themselves. */
export interface AutoGroupOptions {
  /** Break a group when the purser changes (config rule `group_by_purser`). */
  groupByPurser: boolean
  /**
   * Cap a group's cumulative flight time, in hours (config `group_by_flight_hour`);
   * over the cap the rotation is split at the next catering station (a fresh
   * uplift). Omit / 0 = no cap.
   */
  maxHours?: number
  /**
   * Per-flight onboard-sales quota keyed by flightNo, from the active inflight
   * meal-quota version. Attached to each leg so the grouped view can total it.
   */
  quotaByFlightNo?: Map<string, { hotmeal: number; banhMi: number; traSua: number }>
}

/**
 * Group flights into catering rotations under VietJet's uplift policy.
 *
 * Meals are uplifted **once, at the rotation's origin** — the station where the
 * purser's continuous duty starts — and cover every leg. The aircraft is NOT
 * re-catered when it merely passes through another catering station (SGN/HAN/CXR),
 * to keep check-in/out simple. A rotation is only **split** (a fresh uplift +
 * separate station order) when a config rule is violated: `group_by_purser` (the
 * purser changes) or `group_by_flight_hour` (cumulative flight time exceeds
 * `maxHours`, split at the next catering station).
 *
 * Grouping is computed **globally across all stations** and every group is
 * returned; each group's uplift station is its first leg's departure
 * (`groupOrigin`). The caller filters by station: a planner at SGN/HAN/CXR sees
 * the groups uplifting at their station (their supplier order). Groups whose
 * origin is a NON-catering station (a purser starting mid-network, usually
 * positioned overnight) belong to an earlier day and match no station's list.
 *
 * Each leg carries its premeal + cockpit roster + upsell quota, and the group's
 * per-dish breakdown + premeal total are rolled up.
 */
export function autoGroupFlights(flights: RawFlight[], opts: AutoGroupOptions): FlightGroup[] {
  const { groupByPurser, maxHours, quotaByFlightNo } = opts
  const capMin = maxHours && maxHours > 0 ? maxHours * 60 : Number.POSITIVE_INFINITY
  const legMinutes = (f: { std: string; sta: string }) =>
    (toMinutes(f.sta) - toMinutes(f.std) + 1440) % 1440

  const byAircraft = new Map<string, RawFlight[]>()
  for (const f of flights) {
    const list = byAircraft.get(f.aircraft)
    if (list) list.push(f)
    else byAircraft.set(f.aircraft, [f])
  }

  const groups: FlightGroup[] = []
  let seq = 0

  for (const aircraft of [...byAircraft.keys()].sort()) {
    const legs = byAircraft
      .get(aircraft)!
      .slice()
      .sort((a, b) => legTimeKey(a.std) - legTimeKey(b.std))

    let current: FlightGroup | null = null
    let dishes = new Map<string, number>()
    let cumMin = 0

    const finalize = () => {
      if (!current) return
      if (dishes.size > 0) {
        current.meals = [...dishes.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      }
      const total = current.legs.reduce((sum, l) => sum + (l.premeal ?? 0), 0)
      if (total > 0) current.premealTotal = total
      current = null
    }

    for (const f of legs) {
      const legMin = legMinutes(f)
      const purserBreak = groupByPurser && current !== null && current.purserCode !== f.purserCode
      // Flight-hour cap: only split at a catering station, where a fresh uplift is possible.
      const hourBreak = current !== null && cumMin + legMin > capMin && isCateringStation(f.dep)
      if (current === null || purserBreak || hourBreak) {
        finalize()
        seq += 1
        current = {
          id: `ag${seq}`,
          aircraft,
          aircraftType: f.aircraftType,
          purser: f.purser,
          purserCode: f.purserCode,
          confidence: 'high',
          confirmed: false,
          legs: [],
        }
        dishes = new Map()
        cumMin = 0
        groups.push(current)
      }
      current!.legs.push({
        flightNo: f.flightNo,
        dep: f.dep,
        arr: f.arr,
        std: f.std,
        sta: f.sta,
        intl: f.intl,
        premeal: f.premeal,
        cockpitCrew: f.cockpitCrew,
        salesQuota: quotaByFlightNo?.get(f.flightNo),
      })
      for (const m of f.meals ?? []) dishes.set(m.name, (dishes.get(m.name) ?? 0) + m.count)
      cumMin += legMin
    }
    finalize()
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

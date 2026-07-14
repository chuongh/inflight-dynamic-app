/**
 * UC-11 · Supplier order helpers. One order "file" = all versions sharing a
 * (station, service-date). Each version is a `CateringOrder` record that is
 * either `draft` (editable) or `sent`. Building an order merges three demand
 * streams — pre-book dishes, cockpit crew meals, and onboard sales quota — from
 * the day's CONFIRMED groups into a single flat line list.
 */
import { computeGroupCrewMeals } from './groupCrewMeal'
import { aggregateDayMeals, groupSalesQuota } from './grouping'
import type { FlightGroup } from './groupingTypes'
import type { CrewMealProfile } from './crewMealTypes'
import type { MealCatalog } from './mealsTypes'
import type { CateringOrder, CateringOrderLine, OrderCategory } from './orderTypes'

/** Accent-insensitive, đ→d, collapsed-space name key for dish matching. */
export function normalizeName(s: string): string {
  return [...s.toLowerCase().normalize('NFD')]
    .filter((ch) => {
      const c = ch.charCodeAt(0)
      return c < 0x300 || c > 0x36f
    })
    .join('')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Build a dish-name → PBML-codes lookup from the meal catalog. */
export function makeCodeOf(catalog: MealCatalog | undefined): (name: string) => string[] {
  const m = new Map<string, string[]>()
  ;(catalog?.meals ?? []).forEach((x) => m.set(normalizeName(x.name), x.pbmlCodes))
  return (name: string) => m.get(normalizeName(name)) ?? []
}

/** `DD/MM/YYYY` → `YYYYMMDD` (stable, sortable). */
export function dateCompact(serviceDate: string): string {
  const [d, m, y] = serviceDate.split('/')
  return `${y}${m}${d}`
}

/** Stable id for the order file (station + date), independent of version. */
export function orderFileId(station: string, serviceDate: string): string {
  return `ORD-${station}-${dateCompact(serviceDate)}`
}

export function lineTotal(lines: CateringOrderLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0)
}

export function categoryTotal(lines: CateringOrderLine[], cat: OrderCategory): number {
  return lines.reduce((s, l) => (l.category === cat ? s + l.qty : s), 0)
}

export function suggestedTotal(lines: CateringOrderLine[]): number {
  return lines.reduce((s, l) => s + l.suggested, 0)
}

/**
 * Build the merged order lines from confirmed groups. `codeOf` maps a dish name
 * to its PBML codes (from the meal catalog); `profile` is the active cockpit
 * crew-meal profile (crew line omitted when absent).
 */
export function buildOrderLines(
  groups: FlightGroup[],
  profile: CrewMealProfile | undefined,
  codeOf: (name: string) => string[],
): CateringOrderLine[] {
  const lines: CateringOrderLine[] = []

  // 1 · Pre-book — one line per dish.
  for (const dish of aggregateDayMeals(groups)) {
    lines.push({
      name: dish.name,
      category: 'prebook',
      pbmlCodes: codeOf(dish.name),
      suggested: dish.count,
      qty: dish.count,
    })
  }

  // 2 · Crew — one aggregate cockpit line.
  if (profile) {
    const crew = groups.reduce((s, g) => s + computeGroupCrewMeals(g, profile).meals, 0)
    if (crew > 0) {
      lines.push({ name: 'crewCockpit', category: 'crew', pbmlCodes: ['CRWM'], suggested: crew, qty: crew })
    }
  }

  // 3 · Sales — onboard buy-on-board quota (UC-10).
  const q = groups.reduce(
    (a, g) => {
      const s = groupSalesQuota(g)
      return { hotmeal: a.hotmeal + s.hotmeal, banhMi: a.banhMi + s.banhMi, traSua: a.traSua + s.traSua }
    },
    { hotmeal: 0, banhMi: 0, traSua: 0 },
  )
  const salesDefs: Array<[string, string, number]> = [
    ['hotmeal', 'HOT', q.hotmeal],
    ['banhMi', 'BMI', q.banhMi],
    ['traSua', 'TSA', q.traSua],
  ]
  for (const [name, code, n] of salesDefs) {
    if (n > 0) lines.push({ name, category: 'sales', pbmlCodes: [code], suggested: n, qty: n })
  }

  return lines
}

/** One logical order file: all versions for a (station, date), newest last. */
export interface OrderFile {
  fileId: string
  station: string
  serviceDate: string
  /** Ascending by version. */
  versions: CateringOrder[]
  /** Highest version — the current state. */
  latest: CateringOrder
}

/** Group raw order records into files, newest file first. */
export function groupOrderFiles(orders: CateringOrder[]): OrderFile[] {
  const byFile = new Map<string, CateringOrder[]>()
  for (const o of orders) {
    const key = orderFileId(o.station, o.serviceDate)
    const arr = byFile.get(key) ?? []
    arr.push(o)
    byFile.set(key, arr)
  }
  const files: OrderFile[] = []
  for (const [fileId, recs] of byFile) {
    const versions = [...recs].sort((a, b) => a.version - b.version)
    const latest = versions[versions.length - 1]
    files.push({ fileId, station: latest.station, serviceDate: latest.serviceDate, versions, latest })
  }
  // Newest service date first.
  return files.sort((a, b) => dateCompact(b.serviceDate).localeCompare(dateCompact(a.serviceDate)))
}

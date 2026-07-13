/**
 * UC-10 quota — pure domain helpers (version selection, diffing, aggregation).
 * No React / no I/O; safe to unit test.
 */
import type {
  DiffRow,
  DiffSummary,
  QuotaRow,
  QuotaVersion,
  VersionStatus,
} from './types'

/** The version currently in effect (falls back to the newest if none active). */
export function activeVersion(versions: QuotaVersion[]): QuotaVersion | null {
  if (versions.length === 0) return null
  return (
    versions.find((v) => v.status === 'active') ??
    [...versions].sort((a, b) => b.version - a.version)[0]
  )
}

/** Versions newest-first — the order shown in the selector and timeline. */
export function versionsNewestFirst(versions: QuotaVersion[]): QuotaVersion[] {
  return [...versions].sort((a, b) => b.version - a.version)
}

export interface QuotaTotals {
  flights: number
  hotmeal: number
  banhMi: number
  traSua: number
  zeroFlights: number
}

/** Column totals for the KPI row. */
export function totals(rows: QuotaRow[]): QuotaTotals {
  return rows.reduce<QuotaTotals>(
    (acc, r) => {
      acc.flights += 1
      acc.hotmeal += r.hotmeal
      acc.banhMi += r.banhMi
      acc.traSua += r.traSua
      if (r.hotmeal === 0 && r.banhMi === 0 && r.traSua === 0) acc.zeroFlights += 1
      return acc
    },
    { flights: 0, hotmeal: 0, banhMi: 0, traSua: 0, zeroFlights: 0 },
  )
}

/** Distinct normalized Type buckets present in a row set. */
export function distinctTypes(rows: QuotaRow[]): number {
  return new Set(rows.map((r) => r.type)).size
}

/** Distinct routes present in a row set. */
export function distinctRoutes(rows: QuotaRow[]): number {
  return new Set(rows.map((r) => r.route)).size
}

/**
 * Diff two versions by flight number. `from` = older, `to` = newer.
 * Only changed / added / removed lines are returned.
 */
export function diffVersions(from: QuotaVersion, to: QuotaVersion): DiffSummary {
  const fromByFlight = new Map(from.rows.map((r) => [r.flightNo, r]))
  const toByFlight = new Map(to.rows.map((r) => [r.flightNo, r]))
  const rows: DiffRow[] = []

  for (const t of to.rows) {
    const f = fromByFlight.get(t.flightNo)
    if (!f) {
      rows.push({
        flightNo: t.flightNo,
        route: t.route,
        kind: 'added',
        hotmealTo: t.hotmeal,
        banhMi: t.banhMi,
        traSua: t.traSua,
      })
      continue
    }
    if (t.hotmeal !== f.hotmeal) {
      rows.push({
        flightNo: t.flightNo,
        route: t.route,
        kind: t.hotmeal > f.hotmeal ? 'increase' : 'decrease',
        hotmealFrom: f.hotmeal,
        hotmealTo: t.hotmeal,
        banhMi: t.banhMi,
        traSua: t.traSua,
      })
    }
  }

  for (const f of from.rows) {
    if (!toByFlight.has(f.flightNo)) {
      rows.push({
        flightNo: f.flightNo,
        route: f.route,
        kind: 'removed',
        hotmealFrom: f.hotmeal,
        banhMi: f.banhMi,
        traSua: f.traSua,
      })
    }
  }

  return {
    increases: rows.filter((r) => r.kind === 'increase').length,
    decreases: rows.filter((r) => r.kind === 'decrease').length,
    added: rows.filter((r) => r.kind === 'added').length,
    removed: rows.filter((r) => r.kind === 'removed').length,
    rows,
  }
}

/** Next numeric version id from the current set. */
export function nextVersionNumber(versions: QuotaVersion[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1
}

/**
 * Produce the next dataset state after confirming a new version from `rows`.
 * The prior active version is marked superseded (its effectiveTo is set to the
 * day the new one starts). The new version is 'active' if it starts today or
 * earlier, otherwise 'scheduled'. No mutation — returns a fresh array.
 */
export function withNewVersion(
  versions: QuotaVersion[],
  rows: QuotaRow[],
  meta: {
    effectiveFrom: string
    importedBy: string
    importedAt: string
    source: string
    sourceKind: QuotaVersion['sourceKind']
    startsInFuture: boolean
  },
): QuotaVersion[] {
  const num = nextVersionNumber(versions)
  const newStatus: VersionStatus = meta.startsInFuture ? 'scheduled' : 'active'

  const updated = versions.map((v) =>
    v.status === 'active' && !meta.startsInFuture
      ? { ...v, status: 'superseded' as VersionStatus, effectiveTo: meta.effectiveFrom }
      : v,
  )

  const created: QuotaVersion = {
    id: `v${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    importedBy: meta.importedBy,
    importedAt: meta.importedAt,
    source: meta.source,
    sourceKind: meta.sourceKind,
    rows,
  }

  return [created, ...updated]
}

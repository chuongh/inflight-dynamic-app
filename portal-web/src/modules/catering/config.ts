/**
 * Catering rule configuration — pure domain helpers (version selection,
 * catalog metadata, defaults). No React / no I/O.
 */
import type {
  FlightStatus,
  Rule,
  RuleConfigVersion,
  RuleKind,
} from './configTypes'
import type { VersionStatus } from './types'

/** The version currently in effect (falls back to the newest if none active). */
export function activeConfigVersion(versions: RuleConfigVersion[]): RuleConfigVersion | null {
  if (versions.length === 0) return null
  return (
    versions.find((v) => v.status === 'active') ??
    [...versions].sort((a, b) => b.version - a.version)[0]
  )
}

/** Versions newest-first — the order shown in the selector. */
export function configVersionsNewestFirst(versions: RuleConfigVersion[]): RuleConfigVersion[] {
  return [...versions].sort((a, b) => b.version - a.version)
}

/** Next numeric version id from the current set. */
export function nextConfigVersionNumber(versions: RuleConfigVersion[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1
}

/**
 * Produce the next dataset state after publishing a new rule set. The prior
 * active version is superseded (effectiveTo set to the new start). The new
 * version is 'active' if it starts today or earlier, otherwise 'scheduled'.
 */
export function withNewConfigVersion(
  versions: RuleConfigVersion[],
  rules: Rule[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): RuleConfigVersion[] {
  const num = nextConfigVersionNumber(versions)
  const newStatus: VersionStatus = meta.startsInFuture ? 'scheduled' : 'active'

  const updated = versions.map((v) =>
    v.status === 'active' && !meta.startsInFuture
      ? { ...v, status: 'superseded' as VersionStatus, effectiveTo: meta.effectiveFrom }
      : v,
  )

  const created: RuleConfigVersion = {
    id: `c${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    rules,
  }

  return [created, ...updated]
}

/** Catalog category a rule kind belongs to (drives the card accent). */
export type RuleCategory = 'reduction' | 'exclusion' | 'grouping'

export const RULE_CATEGORY: Record<RuleKind, RuleCategory> = {
  threshold_reduction: 'reduction',
  time_exclusion: 'exclusion',
  status_exclusion: 'exclusion',
  group_by_purser: 'grouping',
  group_by_flight_hour: 'grouping',
}

/** Quota-shaping kinds — the catalog offered under the Hotmeal quota tab. */
export const QUOTA_RULE_KINDS: RuleKind[] = [
  'threshold_reduction',
  'time_exclusion',
  'status_exclusion',
]

/** Leg-grouping kinds — the catalog offered under the Flight grouping tab. */
export const GROUPING_RULE_KINDS: RuleKind[] = ['group_by_purser', 'group_by_flight_hour']

const ALL_STATUSES: FlightStatus[] = ['cancelled', 'ferry', 'diverted']

/** Fresh rule with sensible defaults for the "add rule" flow. */
export function defaultRule(kind: RuleKind, id: string): Rule {
  switch (kind) {
    case 'threshold_reduction':
      return { id, kind, enabled: true, metric: 'prebook', threshold: 50, reducePct: 50 }
    case 'time_exclusion':
      return { id, kind, enabled: true, scope: 'DOM', fromTime: '21:00' }
    case 'status_exclusion':
      return { id, kind, enabled: true, statuses: ['cancelled', 'ferry'] }
    case 'group_by_purser':
      return { id, kind, enabled: true }
    case 'group_by_flight_hour':
      return { id, kind, enabled: true, maxHours: 8 }
  }
}

/** Count of enabled rules in a set — the headline the config summary shows. */
export function activeRuleCount(rules: Rule[]): number {
  return rules.filter((r) => r.enabled).length
}

export { ALL_STATUSES }

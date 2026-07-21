/**
 * OPP-016 · UC-10 — Catering rule configuration.
 *
 * The Commercial business rules that used to live as a static note on the quota
 * screen are here modelled as configurable, versioned data. Each rule is a typed
 * instance from a small catalog (reduction · exclusion · grouping); users add,
 * remove, toggle and tune them. A rule set is published as an immutable VERSION
 * with an effective-from date — same lifecycle as the quota versions (BRule-10).
 */
import type { VersionStatus } from './types'

/** The rule archetypes the catalog offers. */
export type RuleKind =
  /** Cut quota by a % when a per-flight metric crosses a threshold. */
  | 'threshold_reduction'
  /** Zero the quota for a flight scope departing at/after a time. */
  | 'time_exclusion'
  /** Zero the quota for flights in one of the listed operational states. */
  | 'status_exclusion'
  /** Break the uplift leg-group whenever the assigned purser changes. */
  | 'group_by_purser'
  /** Cap each leg-group by total flight time, splitting from a catering airport. */
  | 'group_by_flight_hour'

/** Per-flight metric a threshold rule can test (only pre-book today). */
export type RuleMetric = 'prebook'

/** Flight scope a time rule applies to. */
export type FlightScope = 'DOM' | 'INT' | 'ALL'

/** Operational states a status rule can exclude. */
export type FlightStatus = 'cancelled' | 'ferry' | 'diverted'

interface RuleBase {
  /** Stable id within a version. */
  id: string
  kind: RuleKind
  /** Toggled off rules are kept but ignored by the computation. */
  enabled: boolean
}

export interface ThresholdReductionRule extends RuleBase {
  kind: 'threshold_reduction'
  metric: RuleMetric
  /** Threshold value, e.g. 50 (pre-book count). */
  threshold: number
  /** Quota is cut to this percentage, e.g. 50 → 50%. */
  reducePct: number
}

export interface TimeExclusionRule extends RuleBase {
  kind: 'time_exclusion'
  scope: FlightScope
  /** Departure cut-off HH:MM — flights at/after this get zero quota. */
  fromTime: string
}

export interface StatusExclusionRule extends RuleBase {
  kind: 'status_exclusion'
  statuses: FlightStatus[]
}

/** Split the leg-group each time the purser changes (no extra params). */
export interface GroupByPurserRule extends RuleBase {
  kind: 'group_by_purser'
}

export interface GroupByFlightHourRule extends RuleBase {
  kind: 'group_by_flight_hour'
  /** Max cumulative flight time per group, in hours. */
  maxHours: number
}

export type Rule =
  | ThresholdReductionRule
  | TimeExclusionRule
  | StatusExclusionRule
  | GroupByPurserRule
  | GroupByFlightHourRule

/** An immutable published version of the whole rule set. */
export interface RuleConfigVersion {
  /** Display id, e.g. "c3". */
  id: string
  /** Numeric version, e.g. 3. */
  version: number
  status: VersionStatus
  /** Effective-from date, DD/MM/YYYY. Applies until the next version. */
  effectiveFrom: string
  /** Effective-to date, DD/MM/YYYY — set only once superseded. */
  effectiveTo?: string
  /** Who published it (display name · role). */
  updatedBy: string
  /** Publish date, DD/MM/YYYY. */
  updatedAt: string
  /** Optional changelog note. */
  note?: string
  rules: Rule[]
}

/** The whole persisted rule-config dataset (mock store shape). */
export interface RuleConfigDataset {
  versions: RuleConfigVersion[]
}

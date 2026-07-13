import type { DiffKind, RowFlag, VersionStatus } from './types'

/** Normalized flight Type buckets seen in the Commercial report (12 groups). */
export const FLIGHT_TYPES = [
  'INT_Regular',
  'Domestic_South_Other',
  'Domestic_North_Other',
  'Domestic_South_Morning',
  'Domestic_Middle_Other',
  'Domestic_North_Morning',
  'Domestic_Middle_Morning',
  'Multiple_Religion_SIN_HKG',
  'India_Hindu',
  'Muslim',
  'Multiple_Religion_AUS',
  'Domestic_Middle_South',
] as const

/** Ant Design Tag colors per version status. */
export const VERSION_STATUS_COLOR: Record<VersionStatus, string> = {
  active: 'green',
  scheduled: 'blue',
  superseded: 'default',
  draft: 'gold',
}

/** Ant Design Tag colors per review flag. */
export const FLAG_COLOR: Record<RowFlag, string> = {
  error: 'gold',
  new: 'blue',
  delta: 'red',
  ok: 'green',
}

/** Ant Design Tag colors per diff kind. */
export const DIFF_COLOR: Record<DiffKind, string> = {
  increase: 'green',
  decrease: 'red',
  added: 'blue',
  removed: 'default',
}

/** Delta threshold (absolute hotmeal change) that raises a 'delta' flag. */
export const DELTA_THRESHOLD = 2

/** HH:MM 24h validator used to flag malformed time cells. */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

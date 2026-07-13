/**
 * OPP-016 · UC-10 — Upsell (catering) quota — "Định mức bán thêm".
 *
 * Team Commercial sends a per-flight quota report (hotmeal · bánh mì · trà sữa).
 * An AI Agent ingests + normalizes it (group Type · time · dedupe · flag bad
 * cells), then it is upserted as a NEW immutable VERSION with an effective date
 * (no end date — applies until the next version). Full history is kept; old
 * versions are never deleted and stay queryable (BRule-10 · FR-WP-C4..C6).
 *
 * This dataset is the source for the UC-06 meal-prep computation.
 */

/** One quota line for a single flight. */
export interface QuotaRow {
  /** Flight number, e.g. "VJ021" — unique within a version. */
  flightNo: string
  /** IATA route, e.g. "HAN-VTE". */
  route: string
  /** Normalized flight Type bucket (e.g. "INT_Regular", "Muslim"). */
  type: string
  /** Scheduled block time HH:MM (optional — reference only). */
  block?: string
  /** Scheduled time of departure HH:MM. */
  std: string
  /** Scheduled time of arrival HH:MM. */
  sta: string
  /** Commercial hotmeal upsell quota. */
  hotmeal: number
  /** Bánh mì upsell quota. */
  banhMi: number
  /** Trà sữa upsell quota. */
  traSua: number
}

export type VersionStatus =
  /** Currently in effect. */
  | 'active'
  /** Confirmed, effective on a future date. */
  | 'scheduled'
  /** Replaced by a newer version. */
  | 'superseded'
  /** Saved but not yet confirmed. */
  | 'draft'

export type SourceKind = 'file' | 'email' | 'manual'

/** An immutable published version of the whole quota table. */
export interface QuotaVersion {
  /** Display id, e.g. "v5". */
  id: string
  /** Numeric version, e.g. 5. */
  version: number
  status: VersionStatus
  /** Effective-from date, DD/MM/YYYY. Applies until the next version. */
  effectiveFrom: string
  /** Effective-to date, DD/MM/YYYY — set only once superseded. */
  effectiveTo?: string
  /** Who imported it (display name · role). */
  importedBy: string
  /** Import date, DD/MM/YYYY. */
  importedAt: string
  /** Source label — file name or "email · DD/MM". */
  source: string
  sourceKind: SourceKind
  rows: QuotaRow[]
}

/** Flag the AI Agent raises on a candidate row during review. */
export type RowFlag =
  /** Malformed cell (bad time format, missing value). */
  | 'error'
  /** Flight not present in the current active version. */
  | 'new'
  /** Large change vs the current active version. */
  | 'delta'
  /** Matches / small change — auto-accepted. */
  | 'ok'

/** A candidate row shown in the AI ingest review step. */
export interface ReviewRow extends QuotaRow {
  flag: RowFlag
  /** Which field triggered an 'error' flag. */
  errorField?: 'std' | 'sta'
  /** Short human note for the flag. */
  note?: string
  /** Previous hotmeal value (for 'delta' rows). */
  prevHotmeal?: number
}

/** A pending AI-ingested report awaiting review & version creation. */
export interface PendingImport {
  source: string
  sourceKind: SourceKind
  /** Total rows read from the report. */
  sourceRows: number
  /** Distinct normalized Type buckets. */
  normalizedTypes: number
  /** Rows merged during case-insensitive Type dedupe. */
  dedupedRows: number
  /** Suggested effective-from date, DD/MM/YYYY. */
  suggestedEffectiveFrom: string
  reviewRows: ReviewRow[]
}

/** The whole persisted UC-10 dataset (mock store shape). */
export interface QuotaDataset {
  versions: QuotaVersion[]
  pendingImport: PendingImport | null
}

/** A single changed line between two versions (diff view). */
export type DiffKind = 'increase' | 'decrease' | 'added' | 'removed'

export interface DiffRow {
  flightNo: string
  route: string
  kind: DiffKind
  hotmealFrom?: number
  hotmealTo?: number
  banhMi?: number
  traSua?: number
}

export interface DiffSummary {
  increases: number
  decreases: number
  added: number
  removed: number
  rows: DiffRow[]
}

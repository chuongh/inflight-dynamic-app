/**
 * OPP-016 · UC-06 — Crew-meal rule configuration (suất ăn tổ bay).
 *
 * The crew-meal engine (BRule-04, 26–30) used to live as hard-coded constants
 * in the catering algorithm. Here it is modelled as configurable, versioned
 * data — same lifecycle as the Commercial quota rules (BRule-10). Each crew
 * GROUP (cockpit / cabin) carries its own independent PROFILE so the cockpit
 * (Pilot/FO) meal norm can diverge from the cabin one.
 */
import type { VersionStatus } from './types'

/** Crew groups that get an independent meal-rule profile. */
export type CrewGroup = 'cockpit' | 'cabin'

/**
 * The manifest columns a duty roster is counted from (BRule-28). A cockpit
 * profile typically counts the flight-deck + jump-seat + positioning rows;
 * cabin counts the cabin roster.
 */
export type CrewColumn = 'cockpit' | 'jumpseat' | 'positioning' | 'cabin'

/** One of the four daily meal windows (BRule-04). `end <= start` ⇒ crosses midnight. */
export interface MealWindow {
  /** Stable id within a profile, e.g. 'w1'. */
  id: string
  /** Slot archetype — drives the icon and default label. */
  slot: 'morning' | 'noon' | 'evening' | 'night'
  /** Window open, HH:MM 24h. */
  start: string
  /** Window close, HH:MM 24h. If ≤ start the window wraps past midnight (e.g. 22:00→04:00). */
  end: string
}

/** The full rule set for one crew group. */
export interface CrewMealProfile {
  group: CrewGroup
  /**
   * Whether this airline applies a meal policy to the group. Vietjet feeds only
   * the cockpit today, so the cabin profile ships disabled — the rule set is
   * kept ready and an airline that does serve cabin crew just flips this on.
   */
  enabled: boolean
  /** The four meal windows (BRule-04). */
  windows: MealWindow[]
  /** Minutes before first STD the duty span opens (BRule-26). */
  preStdMinutes: number
  /** Minutes after last STA the duty span closes (BRule-26). */
  postStaMinutes: number
  /** A window overlapped by less than this is not counted (BRule-27). */
  minOverlapMinutes: number
  /** Manifest columns counted toward the head-count (BRule-28). */
  countedColumns: CrewColumn[]
  /** Collapse rows sharing name + employee code to one person (BRule-28). */
  dedupeByEmployee: boolean
  /** Landing on the next calendar day is counted per landing date (BRule-29). */
  splitByLandingDate: boolean
}

/** An immutable published version of the whole crew-meal config. */
export interface CrewMealConfigVersion {
  /** Display id, e.g. "m3". */
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
  /** One profile per crew group. */
  profiles: CrewMealProfile[]
}

/** The whole persisted crew-meal dataset (mock store shape). */
export interface CrewMealDataset {
  versions: CrewMealConfigVersion[]
}

/** A crew member on a sample rotation (simulator input). */
export interface SampleCrewMember {
  name: string
  /** Employee code — the dedupe key together with name. */
  code: string
  column: CrewColumn
}

/** One leg of a sample rotation. `depDay`/`arrDay` are day offsets (0 = base day). */
export interface SampleLeg {
  flightNo: string
  from: string
  to: string
  /** Scheduled departure HH:MM. */
  std: string
  /** Scheduled arrival HH:MM. */
  sta: string
  depDay: number
  arrDay: number
}

/** A canned rotation the simulator runs the active profile against. */
export interface SampleRotation {
  id: string
  label: string
  date: string
  note?: string
  legs: SampleLeg[]
  crew: SampleCrewMember[]
}

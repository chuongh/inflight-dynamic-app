/**
 * UC-11 · Catering flight-grouping (premeal prep).
 * Ground staff review AI-grouped aircraft rotations before creating a
 * supplier meal-order. Grouping rule (from manual Excel `08jul.xlsx`):
 *  - legs sequenced per aircraft (A/C tail)
 *  - a group loads its whole rotation's premeal at a catering station
 *    (SGN/HAN/CXR); a new group breaks when the purser changes
 *  - only rotations departing the staff's station have orders to prep here
 * Meal quantities are intentionally NOT modelled here — there are many meal
 * types and the per-type detail belongs to the supplier order, not this
 * grouping step. This screen focuses on WHICH groups need preparing.
 */

export interface FlightLeg {
  flightNo: string
  dep: string
  arr: string
  /** Scheduled time of departure, local `HH:MM`. */
  std: string
  /** Scheduled time of arrival, local `HH:MM`. */
  sta: string
  /** International leg (shown as a "QT" marker). */
  intl: boolean
  /** Departure is on the day after the group's service day (source `+`). */
  stdNextDay?: boolean
  /** Arrival is on the day after departure / next calendar day (source `+`). */
  staNextDay?: boolean
  /**
   * Pre-ordered meals (premeal) on this leg. When the source is a full crew
   * list (e.g. 15/07), this is the real per-flight count from that flight's
   * dish columns. When the source records a rotation's premeal on its first
   * leg only (e.g. 14/07), seed data splits the group total evenly across
   * legs. Optional — absent when no premeal data exists for the day.
   */
  premeal?: number
  /** Per-dish premeal breakdown for THIS leg (from the crew-list meal columns).
   *  Kept at leg level so a group's rollup stays correct after split/merge/move. */
  meals?: MealBreakdownItem[]
  /** Operating cockpit crew count (CP + FO) on this leg — derived from `cockpitCrew`. */
  cockpit?: number
  /** Extra / deadhead pilots riding along (CP-Pax, FO-Pax) — derived from `cockpitCrew`. */
  extra?: number
  /**
   * Named cockpit roster for this leg, from the crew-list source. Drives the
   * crew-meal head-count (deduped by employee code across the rotation) so the
   * meal quantity is auditable against real names, not an assumed CP+FO=2.
   */
  cockpitCrew?: CockpitCrewMember[]
  /** Commercial upsell quota for this leg (from the inflight meal quota, UC-10). */
  salesQuota?: { hotmeal: number; banhMi: number; traSua: number }
}

/** One cockpit crew member on a leg, parsed from the crew-list COCKPIT column. */
export interface CockpitCrewMember {
  /** Source role tag: `CP`, `FO`, `CP/T`, `FO/T`, `CP-Pax`, `FO-Pax`. */
  role: string
  /** Full name as printed on the crew list. */
  name: string
  /** Employee code (dedupe key across the rotation's legs). */
  code: string
  /** Positioning / deadhead (`-Pax`) — rides along, not operating this leg. */
  riding?: boolean
}

/** A premeal dish and its ordered quantity for a group. */
export interface MealBreakdownItem {
  name: string
  count: number
}

export type GroupConfidence = 'high' | 'mid'

export interface FlightGroup {
  id: string
  /** Aircraft tail number, e.g. `VN-A202`. */
  aircraft: string
  aircraftType: string
  purser: string
  purserCode: string
  /** AI confidence — `mid` groups are surfaced for review. */
  confidence: GroupConfidence
  confirmed: boolean
  /** Why the AI is unsure (only on `mid` confidence). */
  reviewNote?: string
  legs: FlightLeg[]
  /** Group's premeal count as recorded in the source (before per-leg split). */
  premealTotal?: number
  /** Premeal dishes ordered for this rotation (for the supplier order). */
  meals?: MealBreakdownItem[]
}

/** A single flight leg before AI grouping (raw crew-list row). */
export interface RawFlight {
  flightNo: string
  aircraft: string
  aircraftType: string
  dep: string
  arr: string
  std: string
  sta: string
  purser: string
  purserCode: string
  intl: boolean
  /** Departure is on the day after the service day (source `+` on STD). */
  stdNextDay?: boolean
  /** Arrival is on the next calendar day (source `+` on STA). */
  staNextDay?: boolean
  /**
   * Pre-ordered passenger meals (premeal) on this flight. Known before grouping;
   * the sales quota and crew meals are only computed once flights are grouped.
   */
  premeal?: number
  /**
   * Per-dish premeal breakdown (non-zero dishes only), from the crew-list meal
   * columns. Lets the planner review exactly which dishes to prep per flight
   * before grouping. Optional — absent on days seeded with only a premeal total.
   */
  meals?: MealBreakdownItem[]
  /** Named cockpit roster (CP + FO) for this flight, from the crew-list source. */
  cockpitCrew?: CockpitCrewMember[]
}

export type DayStatus = 'grouped' | 'ungrouped'

/** One service day's grouping state. */
export interface DayGrouping {
  /** Service date, `DD/MM/YYYY`. */
  serviceDate: string
  serviceWeekday: string
  /** `ungrouped` = AI has not run yet; raw flights wait in `ungroupedFlights`. */
  status: DayStatus
  /** When the AI produced this grouping (display string). */
  aiGroupedAt?: string
  /** AI self-reported accuracy, 0–100. */
  aiAccuracy?: number
  groups: FlightGroup[]
  /** Flights awaiting grouping (present when `status = 'ungrouped'`). */
  ungroupedFlights?: RawFlight[]
}

export interface FlightGroupDataset {
  /** Bump when the seed changes so the localStorage cache re-seeds (demo). */
  seedVersion?: string
  /** Catering station the staff prepares meals at, e.g. `SGN`. */
  station: string
  stationName: string
  /**
   * Config rule: an SGN/HAN/CXR departure before this `HH:MM` cutoff counts as
   * the PREVIOUS day's order (the meals are prepped the evening before), so an
   * early-morning `+` flight still belongs to the day the order was created.
   */
  nextDayCutoff?: string
  /** One entry per service day (e.g. tomorrow + the day after). */
  days: DayGrouping[]
}

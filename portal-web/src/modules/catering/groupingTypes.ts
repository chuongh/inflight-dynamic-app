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
  /** One entry per service day (e.g. tomorrow + the day after). */
  days: DayGrouping[]
}

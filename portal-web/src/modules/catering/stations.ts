/**
 * Catering stations are DERIVED from the airport master-data (WP-B), not a
 * separate list: an ACTIVE airport whose `hasCatering` flag is on is where meals
 * can be uplifted. Single source of truth — the Airports admin toggles
 * `hasCatering`, and that drives BOTH the planner station filter and the
 * grouping engine (which airports a rotation may take on a fresh uplift at).
 */
import type { Airport } from '../airports/types'

/** Active airports that have catering — the planner's station options. */
export function cateringAirports(airports: Airport[]): Airport[] {
  return airports.filter((a) => a.hasCatering && a.status === 'active')
}

/** Set of catering-station codes — the engine's uplift-station test. */
export function cateringStationSet(airports: Airport[]): Set<string> {
  return new Set(cateringAirports(airports).map((a) => a.code))
}

/** Pure helpers over the catering-station config. */
import type { CateringStation } from './stationTypes'

/** Enabled catering stations, in config order (what the planner dropdown lists). */
export function enabledStations(stations: CateringStation[]): CateringStation[] {
  return stations.filter((s) => s.enabled)
}

/**
 * Set of enabled catering-station codes — the grouping engine's uplift-station
 * test and the "which groups belong to a station" filter both use this.
 */
export function cateringStationSet(stations: CateringStation[]): Set<string> {
  return new Set(enabledStations(stations).map((s) => s.code))
}

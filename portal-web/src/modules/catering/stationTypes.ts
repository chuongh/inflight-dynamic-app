/**
 * Catering-station configuration. Which airports can uplift meals is CONFIG,
 * not a hardcoded list: the grouping engine (where a rotation may take on a
 * fresh uplift) and the planner station filter both follow the ENABLED entries
 * here, so turning a station on/off changes both without touching code.
 */
export interface CateringStation {
  /** IATA code, e.g. "SGN". */
  code: string
  /** Display name, e.g. "Tân Sơn Nhất". */
  name: string
  /** Whether catering is currently operational (uplift possible) at this station. */
  enabled: boolean
}

export interface CateringStationConfig {
  stations: CateringStation[]
}

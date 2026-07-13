/**
 * OPP-016 · WP-B — Airport & airport-map master data.
 *
 * The `hasCatering` flag is the key cross-module input: it decides which
 * airports appear in the UC-06 catering dashboard and act as UpliftLegGroup
 * cut points (§2.6). The airport map (points/zones → GeoJSON) is the Wave-sau
 * extension consumed by Ops Ride dispatch (UC-08).
 */

export type AirportKind = 'domestic' | 'international'
export type AirportStatus = 'active' | 'draft' | 'inactive'

/** Point categories per FR-WP-B3. */
export type MapPointType =
  | 'gate'
  | 'apron'
  | 'crew_center'
  | 'hangar'
  | 'cargo'
  | 'parking'

export interface MapPoint {
  id: string
  name: string
  type: MapPointType
}

export interface MapZone {
  id: string
  name: string
  /** Vehicle classes allowed in the zone (free text for the mock). */
  allowedVehicles: string
  note?: string
}

export interface AirportMap {
  points: MapPoint[]
  zones: MapZone[]
  /** Published GeoJSON is what the mobile app downloads. */
  published: boolean
  version: number
}

export interface Airport {
  /** IATA code — primary key. */
  code: string
  icao?: string
  name: string
  city: string
  country: string
  kind: AirportKind
  /** Feeds UC-06 catering dashboard + UpliftLegGroup cut points. */
  hasCatering: boolean
  status: AirportStatus
  note?: string
  map?: AirportMap
  updatedAt: number
}

/** Payload for the add/edit airport form. */
export type AirportFormValues = Pick<
  Airport,
  'code' | 'icao' | 'name' | 'city' | 'country' | 'kind' | 'hasCatering' | 'status' | 'note'
>

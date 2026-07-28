/**
 * Dynamic ECO quantity rules + Amenity package selection config.
 * Seeded from GC-SGN ECO sheets A321 / A330 / LIST ĐƯỜNG BAY THEO GIỜ.
 */

export type EcoRuleBase = 'by_item' | 'by_hotmeal_total' | 'by_std_arr'

export type EcoUpliftType = 'DAU_NGAY' | 'DOI_TO' | 'NIGHTSTOP'

export type RouteHourClassId =
  | 'DOM_LE_1H15'
  | 'DOM_GT_1H15'
  | 'INT_LT_4H'
  | 'INT_GE_4H'

export type AircraftFamily = 'A320_A321' | 'A330'

export type AmenitySpecialKind =
  | 'aircraft_day_start'
  | 'route_hour'
  | 'australia'
  | 'kazakhstan'
  | 'russia'
  | 'ferry_cargo'
  | 'nightstop'
  | 'charter_china'

export interface SupplierRouteGroup {
  id: string
  label: string
  airports: string[]
}

export interface RouteHourClass {
  id: RouteHourClassId
  label: string
  /** Round-trip keys as in workbook, e.g. SGN-DPS-SGN */
  routes: string[]
}

export interface AmenityPackageDef {
  id: number
  label: string
  aircraftFamily: AircraftFamily
  kind: AmenitySpecialKind
  /** When kind === route_hour */
  hourClassId?: RouteHourClassId
}

export type EcoQuantityValue =
  | { kind: 'const'; value: number }
  | { kind: 'metric'; metricId: string; coef?: number }
  | { kind: 'column'; columnId: string; coef?: number }
  | { kind: 'hotmeal_total'; coef?: number }
  | { kind: 'sum'; parts: EcoQuantityValue[] }
  | { kind: 'manual' }

export interface EcoQuantityExpr {
  source: 'column' | 'hotmeal_total' | 'metric'
  id?: string
  coef: number
  round?: 'ceil' | 'none'
}

export interface EcoQuantityWhen {
  routeGroups?: string[]
  routePairs?: string[]
  aircraftFamilies?: AircraftFamily[]
  upliftTypes?: EcoUpliftType[]
  hourClasses?: RouteHourClassId[]
  amenityPackages?: number[]
  flightKinds?: Array<'ferry_cargo' | 'charter_china' | 'normal'>
}

export interface EcoQuantityBranch {
  id: string
  when: EcoQuantityWhen
  value: EcoQuantityValue
  note?: string
}

export interface EcoQuantityRule {
  id: string
  base: EcoRuleBase
  /** Target EcoCells key or logical column id */
  targetColumn: string
  enabled: boolean
  docRef?: string
  /** Base 1–2 */
  expr?: EcoQuantityExpr
  /** Base 3 */
  branches?: EcoQuantityBranch[]
  fallback?: EcoQuantityValue
}

export interface EcoAmenityConfig {
  routeHourClasses: RouteHourClass[]
  packages: AmenityPackageDef[]
  routeGroups: SupplierRouteGroup[]
}

export interface EcoQuantityConfig {
  amenity: EcoAmenityConfig
  quantityRules: EcoQuantityRule[]
}

export interface AmenityResolveInput {
  aircraftType?: string | null
  dep: string
  arr: string
  upliftType?: EcoUpliftType | null
  flightKind?: 'ferry_cargo' | 'charter_china' | 'normal' | null
  /** Explicit override from workbook / user */
  amenityOverride?: string | null
}

export interface AmenityResolveResult {
  packageIds: number[]
  label: string | null
  aircraftPackageId: number | null
  routePackageId: number | null
  hourClassId: RouteHourClassId | null
  source: string
}

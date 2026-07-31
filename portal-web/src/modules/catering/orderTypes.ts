/**
 * Catering order file — a versioned, timestamped supplier order built from a
 * day's aggregated premeal statistics. The planner can adjust each dish qty
 * away from the AI-suggested amount before saving a version / sending.
 */
/** Which demand stream a line belongs to (one order merges all three). */
export type OrderCategory = 'prebook' | 'crew' | 'sales'

export interface CateringOrderLine {
  /**
   * For `prebook` lines this is the dish name shown as-is. For `crew`/`sales`
   * system lines it is a stable key resolved via i18n (`catering.orders.line.*`).
   */
  name: string
  category: OrderCategory
  productCodes: string[]
  /** System-suggested quantity (aggregated from the flight grouping). */
  suggested: number
  /** Final quantity after manual adjustment. */
  qty: number
}

/** ECO supply line rolled up across confirmed flights (catalog-backed). */
export type EcoSupplyGroupId =
  | 'main'
  | 'vegetarian'
  | 'appetizer'
  | 'dessert'
  | 'bread'
  | 'drink'
  | 'snack'
  | 'condiment'
  /** Commercial upsell items (bánh mì / trà sữa quota) — not prebook or hotmeal dishes. */
  | 'commercial'
  | 'amenity'
  | 'amenity_composition'
  | 'other'

export interface EcoSupplyLine {
  id: string
  field: string
  group: EcoSupplyGroupId
  catalogItemId: string | null
  productCode: string | null
  name: string
  unit: string | null
  suggested: number
  qty: number
  source: string
  overridden: boolean
  /** false when computed from a rule with confirmed=false; undefined when no rule applies. */
  confirmed?: boolean
  /** true when the field has no quantity rule — always show even at qty 0. */
  noRuleConfigured?: boolean
  /**
   * Which cabin catalog(s) this item belongs to — an item shared by both
   * catalogs (e.g. Bánh mì tròn & bơ) carries both and shows under each
   * cabin's section. Empty/undefined for cross-cabin lines (amenity/crew/other).
   */
  cabinScopes?: Array<'ECO' | 'SBB'>
}

/** Per-flight slice of ECO supply quantities (snapshot at build time). */
export interface EcoSupplyFlightAmenityPackage {
  id: number
  label: string
  count: number
}

export interface EcoSupplyFlightLeg {
  flightNo: string
  dep: string
  arr: string
}

/**
 * Per-rotation ECO supply breakdown (snapshot at build time) — legs of the same
 * confirmed group (e.g. VJ240 + VJ243) are merged into one entry, matching how
 * the Flight Grouping screen treats a rotation as one unit.
 */
export interface EcoSupplyFlightBreakdown {
  groupId: string
  /** All legs of this rotation, in flight order. */
  legs: EcoSupplyFlightLeg[]
  /** field key → qty summed across the group's legs (0 omitted) */
  cells: Record<string, number>
  /** Commercial hotmeal quota summed across the group's legs. */
  quotaCommercial?: number
  /** Commercial bánh mì quota summed across the group's legs. */
  quotaBanhMi?: number
  /** Commercial trà sữa quota summed across the group's legs. */
  quotaTraSua?: number
  /** Amenity packages assigned across the group's legs. */
  amenityPackages?: EcoSupplyFlightAmenityPackage[]
}

/**
 * One traceable source contribution to an order line. Pre-book and sales cells
 * are per-flight; crew cells are per-group (no single flight owns a crew meal).
 * The sum of a line's cells === that line's qty at build time.
 */
export interface OrderSourceCell {
  category: OrderCategory
  name: string
  groupId: string
  flightNo?: string
  dep?: string
  arr?: string
  qty: number
}

export type OrderStatus = 'draft' | 'sent'

export interface CateringOrder {
  id: string
  version: number
  serviceDate: string
  station: string
  /** Creation timestamp (ms). */
  createdAt: number
  createdBy: string
  status: OrderStatus
  lines: CateringOrderLine[]
  /**
   * Immutable per-flight/per-group source snapshot the `lines` were derived from
   * — the reconciliation spine (enables per-flight trace and version deltas).
   * Optional: versions created before reconciliation have no breakdown.
   */
  breakdown?: OrderSourceCell[]
  /** ECO supply lines (catalog items) computed at create-order time. */
  ecoSupplyLines?: EcoSupplyLine[]
  /** Per-flight ECO supply breakdown (same snapshot as `ecoSupplyLines`). */
  ecoSupplyByFlight?: EcoSupplyFlightBreakdown[]
  /**
   * Manual overrides on a single flight group's portion of a dish/amenity qty —
   * keyed by groupId → field → qty. The order-wide `ecoSupplyLines` total for an
   * edited field is recomputed as the sum of each group's effective value.
   */
  ecoSupplyByFlightEdits?: Record<string, Record<string, number>>
  /** Direct numeric patches keyed by flightKey → product → field → number */
  supplierEdits?: Record<string, {
    eco?: Partial<Record<string, number>>
    sbb?: Partial<Record<string, number>>
  }>
}

export interface CateringOrderDataset {
  orders: CateringOrder[]
}

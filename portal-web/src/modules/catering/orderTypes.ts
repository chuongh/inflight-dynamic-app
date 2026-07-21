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
  pbmlCodes: string[]
  /** System-suggested quantity (aggregated from the flight grouping). */
  suggested: number
  /** Final quantity after manual adjustment. */
  qty: number
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
}

export interface CateringOrderDataset {
  orders: CateringOrder[]
}

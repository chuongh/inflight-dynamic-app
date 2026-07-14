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
}

export interface CateringOrderDataset {
  orders: CateringOrder[]
}

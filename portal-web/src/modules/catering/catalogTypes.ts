/**
 * Versioned Catering catalogs: Meal (food SKUs), Combo, Amenity (utensils).
 * Excel Master_Data is the SKU source; productCode is used for order line codes.
 */
import type { VersionStatus } from './types'

/**
 * Cross-cabin dish taxonomy — decoupled from cabin. Which cabin an item
 * belongs to is `cabinScopes`, not the category (see MealCatalogItem below).
 */
export type MealItemCategory =
  | 'main'
  | 'vegetarian'
  | 'appetizer'
  | 'dessert'
  | 'bread'
  | 'drink'
  | 'snack'
  | 'condiment'

export type CabinScope = 'ECO' | 'SBB' | 'CHARTER' | 'AMENITY'

export type ComboKind = 'charter' | 'happy_meal' | 'prebook_combo' | 'set' | 'meal_box'

export interface MealCatalogItem {
  id: string
  productCode: string | null
  name: { vi: string; en?: string }
  unit: string | null
  category: MealItemCategory
  cabinScopes: CabinScope[]
  active: boolean
  needsCode: boolean
  /** Ghi chú công thức/nguồn số liệu — hiện ở Catalog và tham chiếu khi tạo rule. */
  note?: string
}

export interface ComboCatalogItem {
  id: string
  name: { vi: string; en?: string }
  description: string
  kind: ComboKind
  productCode: string | null
  active: boolean
}

export interface AmenityCatalogItem {
  id: string
  productCode: string | null
  name: { vi: string; en?: string }
  unit: string | null
  active: boolean
  needsCode: boolean
  /** Ghi chú công thức/nguồn số liệu — hiện ở Catalog và tham chiếu khi tạo rule. */
  note?: string
}

interface CatalogVersionBase {
  id: string
  version: number
  status: VersionStatus
  effectiveFrom: string
  effectiveTo?: string
  updatedBy: string
  updatedAt: string
  note?: string
}

export interface MealCatalogVersion extends CatalogVersionBase {
  items: MealCatalogItem[]
}

export interface ComboCatalogVersion extends CatalogVersionBase {
  items: ComboCatalogItem[]
}

export interface AmenityCatalogVersion extends CatalogVersionBase {
  items: AmenityCatalogItem[]
}

export interface MealCatalogDataset {
  seedVersion?: string
  versions: MealCatalogVersion[]
}

export interface ComboCatalogDataset {
  seedVersion?: string
  versions: ComboCatalogVersion[]
}

export interface AmenityCatalogDataset {
  seedVersion?: string
  versions: AmenityCatalogVersion[]
}

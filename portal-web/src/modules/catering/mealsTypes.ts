/**
 * Catering meal master data (menu catalog). Each dish maps to one or more
 * product codes; dish names match the flight-grouping premeal breakdown.
 */
export interface MealItem {
  name: string
  description: string
  /** Product / SKU code(s) stamped onto prebook order lines. */
  productCodes: string[]
}

export interface MealCatalog {
  meals: MealItem[]
}

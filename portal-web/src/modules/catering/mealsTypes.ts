/**
 * Catering meal master data (menu catalog). Each dish maps to one or more
 * PBML booking codes used by the pre-book (premeal) system; these dish names
 * are what the flight-grouping premeal breakdown references.
 */
export interface MealItem {
  name: string
  description: string
  /** PBML codes this dish is sold under (booking channel / cabin variants). */
  pbmlCodes: string[]
}

export interface MealCatalog {
  meals: MealItem[]
}

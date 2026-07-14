import type { MealCatalog } from '../../modules/catering/mealsTypes'
import mealsJson from '../catering/meals.json'

/** Static read-only meal catalog (reference data, no local edits). */
export function getMealCatalog(): MealCatalog {
  return mealsJson as MealCatalog
}

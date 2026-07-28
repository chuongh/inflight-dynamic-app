import { useQuery } from '@tanstack/react-query'
import {
  getComboCatalogDataset,
  getMealCatalogDataset,
} from '../../../mock-data/loaders/loadCatalog'
import { activeCatalogVersion, toLegacyMealCatalog } from '../catalog'

export const mealsQueryKey = ['catering', 'meals'] as const

/** Prebook lookup: product codes from active Meal + Combo catalogs. */
export function useMeals() {
  return useQuery({
    queryKey: mealsQueryKey,
    queryFn: async () => {
      const mealDs = getMealCatalogDataset()
      const comboDs = getComboCatalogDataset()
      const meals = activeCatalogVersion(mealDs.versions)?.items
      const combos = activeCatalogVersion(comboDs.versions)?.items
      return toLegacyMealCatalog(meals, combos)
    },
  })
}

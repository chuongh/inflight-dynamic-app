import { useQuery } from '@tanstack/react-query'
import { getMealCatalog } from '../../../mock-data/loaders/loadMeals'

export const mealsQueryKey = ['catering', 'meals'] as const

export function useMeals() {
  return useQuery({
    queryKey: mealsQueryKey,
    queryFn: async () => getMealCatalog(),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAmenityCatalogDataset,
  getComboCatalogDataset,
  getMealCatalogDataset,
  saveAmenityCatalogDataset,
  saveComboCatalogDataset,
  saveMealCatalogDataset,
} from '../../../mock-data/loaders/loadCatalog'
import type {
  AmenityCatalogDataset,
  ComboCatalogDataset,
  MealCatalogDataset,
} from '../catalogTypes'
import { mealsQueryKey } from './useMeals'

export const mealCatalogQueryKey = ['catering', 'catalog', 'meals'] as const
export const comboCatalogQueryKey = ['catering', 'catalog', 'combos'] as const
export const amenityCatalogQueryKey = ['catering', 'catalog', 'amenity'] as const

export function useMealCatalogData() {
  return useQuery({
    queryKey: mealCatalogQueryKey,
    queryFn: async () => getMealCatalogDataset(),
  })
}

export function useSaveMealCatalogData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dataset: MealCatalogDataset) => {
      saveMealCatalogDataset(dataset)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mealCatalogQueryKey })
      void qc.invalidateQueries({ queryKey: mealsQueryKey })
    },
  })
}

export function useComboCatalogData() {
  return useQuery({
    queryKey: comboCatalogQueryKey,
    queryFn: async () => getComboCatalogDataset(),
  })
}

export function useSaveComboCatalogData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dataset: ComboCatalogDataset) => {
      saveComboCatalogDataset(dataset)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: comboCatalogQueryKey })
      void qc.invalidateQueries({ queryKey: mealsQueryKey })
    },
  })
}

export function useAmenityCatalogData() {
  return useQuery({
    queryKey: amenityCatalogQueryKey,
    queryFn: async () => getAmenityCatalogDataset(),
  })
}

export function useSaveAmenityCatalogData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dataset: AmenityCatalogDataset) => {
      saveAmenityCatalogDataset(dataset)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: amenityCatalogQueryKey }),
  })
}

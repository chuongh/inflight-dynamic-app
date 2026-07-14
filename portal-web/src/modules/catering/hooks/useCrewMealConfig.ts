import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crewMealConfigService } from '../services/crewMealConfigService'
import type { CrewMealDataset } from '../crewMealTypes'

export const crewMealConfigQueryKey = ['catering', 'crew-meal-config'] as const

export function useCrewMealConfigData() {
  return useQuery({
    queryKey: crewMealConfigQueryKey,
    queryFn: () => crewMealConfigService.getCrewMealConfig(),
  })
}

export function useSaveCrewMealConfigData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataset: CrewMealDataset) =>
      crewMealConfigService.saveCrewMealConfig(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(crewMealConfigQueryKey, dataset)
    },
  })
}

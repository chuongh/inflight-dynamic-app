import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { flightGroupService } from '../services/createFlightGroupService'
import type { FlightGroupDataset } from '../groupingTypes'

export const flightGroupsQueryKey = ['catering', 'flight-groups'] as const

export function useFlightGroups() {
  return useQuery({
    queryKey: flightGroupsQueryKey,
    queryFn: () => flightGroupService.getFlightGroups(),
  })
}

export function useSaveFlightGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataset: FlightGroupDataset) => flightGroupService.saveFlightGroups(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(flightGroupsQueryKey, dataset)
    },
  })
}

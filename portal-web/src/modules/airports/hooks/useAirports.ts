import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Airport } from '../types'
import { airportService } from '../services/createAirportService'

export const airportsQueryKey = ['airports', 'list'] as const

export function useAirports() {
  return useQuery({
    queryKey: airportsQueryKey,
    queryFn: () => airportService.listAirports(),
  })
}

export function useSaveAirports() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (airports: Airport[]) => airportService.saveAirports(airports),
    onSuccess: (_data, airports) => {
      queryClient.setQueryData(airportsQueryKey, airports)
    },
  })
}

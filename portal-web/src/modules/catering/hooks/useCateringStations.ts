import { useQuery } from '@tanstack/react-query'
import { getCateringStations } from '../../../mock-data/loaders/loadCateringStations'

export const cateringStationsQueryKey = ['catering', 'stations'] as const

export function useCateringStations() {
  return useQuery({
    queryKey: cateringStationsQueryKey,
    queryFn: async () => getCateringStations(),
  })
}

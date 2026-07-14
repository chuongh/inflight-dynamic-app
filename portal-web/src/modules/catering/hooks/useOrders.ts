import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrdersCache, saveOrdersCache } from '../../../mock-data/loaders/loadOrders'
import type { CateringOrderDataset } from '../orderTypes'

export const ordersQueryKey = ['catering', 'orders'] as const

export function useOrders() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => getOrdersCache(),
  })
}

export function useSaveOrders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dataset: CateringOrderDataset) => saveOrdersCache(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(ordersQueryKey, dataset)
    },
  })
}

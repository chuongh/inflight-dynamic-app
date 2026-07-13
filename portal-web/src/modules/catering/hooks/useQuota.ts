import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quotaService } from '../services/createQuotaService'
import type { QuotaDataset } from '../types'

export const quotaQueryKey = ['catering', 'quota'] as const

export function useQuotaData() {
  return useQuery({
    queryKey: quotaQueryKey,
    queryFn: () => quotaService.getQuotaData(),
  })
}

export function useSaveQuotaData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataset: QuotaDataset) => quotaService.saveQuotaData(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(quotaQueryKey, dataset)
    },
  })
}

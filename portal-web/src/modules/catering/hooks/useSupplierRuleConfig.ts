import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supplierRuleConfigService } from '../services/createSupplierRuleConfigService'
import type { SupplierRuleConfigDataset } from '../supplierRuleConfigTypes'

export const supplierRuleConfigQueryKey = ['catering', 'supplier-rule-config'] as const

export function useSupplierRuleConfigData() {
  return useQuery({
    queryKey: supplierRuleConfigQueryKey,
    queryFn: () => supplierRuleConfigService.getSupplierRuleConfig(),
  })
}

export function useSaveSupplierRuleConfigData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataset: SupplierRuleConfigDataset) =>
      supplierRuleConfigService.saveSupplierRuleConfig(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(supplierRuleConfigQueryKey, dataset)
    },
  })
}

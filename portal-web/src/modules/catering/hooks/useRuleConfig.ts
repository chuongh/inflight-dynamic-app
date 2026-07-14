import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ruleConfigService } from '../services/createRuleConfigService'
import type { RuleConfigDataset } from '../configTypes'

export const ruleConfigQueryKey = ['catering', 'rule-config'] as const

export function useRuleConfigData() {
  return useQuery({
    queryKey: ruleConfigQueryKey,
    queryFn: () => ruleConfigService.getRuleConfig(),
  })
}

export function useSaveRuleConfigData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataset: RuleConfigDataset) => ruleConfigService.saveRuleConfig(dataset),
    onSuccess: (_data, dataset) => {
      queryClient.setQueryData(ruleConfigQueryKey, dataset)
    },
  })
}

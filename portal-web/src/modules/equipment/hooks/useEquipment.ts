import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PortableDevice } from '@/modules/equipment/lib/generatePortableDevices'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import type { CompleteRepairRequestInput, RepairRequestFilters } from '../types'
import { equipmentService } from '../services/createEquipmentService'

export const trolleyQueryKey = ['equipment', 'trolleys'] as const
export const posQueryKey = ['equipment', 'pos'] as const
export const ipadQueryKey = ['equipment', 'ipads'] as const
export const repairRequestsQueryKey = ['equipment', 'repair-requests'] as const

export function useTrolleys() {
  return useQuery({
    queryKey: trolleyQueryKey,
    queryFn: () => equipmentService.listTrolleys(),
  })
}

export function useSaveTrolleys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (trolleys: TrolleyUnit[]) => equipmentService.saveTrolleys(trolleys),
    onSuccess: (_data, trolleys) => {
      queryClient.setQueryData(trolleyQueryKey, trolleys)
    },
  })
}

export function usePosDevices() {
  return useQuery({
    queryKey: posQueryKey,
    queryFn: () => equipmentService.listPosDevices(),
  })
}

export function useSavePosDevices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (devices: PortableDevice[]) => equipmentService.savePosDevices(devices),
    onSuccess: (_data, devices) => {
      queryClient.setQueryData(posQueryKey, devices)
    },
  })
}

export function useIpads() {
  return useQuery({
    queryKey: ipadQueryKey,
    queryFn: () => equipmentService.listIpads(),
  })
}

export function useSaveIpads() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (devices: PortableDevice[]) => equipmentService.saveIpads(devices),
    onSuccess: (_data, devices) => {
      queryClient.setQueryData(ipadQueryKey, devices)
    },
  })
}

export function useSendTrolleysToRepair() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      codes,
      vendor,
      requestedBy,
    }: {
      codes: string[]
      vendor: string
      requestedBy?: string
    }) => equipmentService.sendTrolleysToRepair(codes, vendor, requestedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairRequestsQueryKey })
      queryClient.invalidateQueries({ queryKey: trolleyQueryKey })
    },
  })
}

export function useDefectCatalog() {
  return useQuery({
    queryKey: ['equipment', 'defects'],
    queryFn: () => equipmentService.listDefects(),
  })
}

export function useSaveDefectCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: equipmentService.saveDefects.bind(equipmentService),
    onSuccess: (defects) => {
      queryClient.setQueryData(['equipment', 'defects'], defects)
    },
  })
}

export function useRepairRequests(filters?: RepairRequestFilters) {
  return useQuery({
    queryKey: [...repairRequestsQueryKey, filters ?? {}],
    queryFn: () => equipmentService.listRepairRequests(filters),
  })
}

export function useRepairRequest(id: string) {
  return useQuery({
    queryKey: [...repairRequestsQueryKey, 'detail', id],
    queryFn: () => equipmentService.getRepairRequest(id),
    enabled: id.length > 0,
  })
}

export function useCompleteRepairRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompleteRepairRequestInput }) =>
      equipmentService.completeRepairRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairRequestsQueryKey })
      queryClient.invalidateQueries({ queryKey: trolleyQueryKey })
    },
  })
}

export function useCancelRepairRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipmentService.cancelRepairRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairRequestsQueryKey })
      queryClient.invalidateQueries({ queryKey: trolleyQueryKey })
    },
  })
}

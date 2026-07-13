import type { PortableDevice } from '@/modules/equipment/lib/generatePortableDevices'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import {
  getEquipmentCache,
  saveEquipmentCache,
} from '../../../mock-data/loaders/loadEquipment'
import { loadDefectCatalog } from '../../../mock-data/loaders/loadDefects'
import {
  applyCancelRepairRequest,
  applyCompleteRepairRequest,
  createBatchSendToRepairPayload,
  filterRepairRequests,
  nextRequestId,
  syncTrolleyOnCancel,
  syncTrolleyOnComplete,
} from '../repairRequest'
import type {
  CompleteRepairRequestInput,
  DefectCatalogItem,
  RepairRequest,
  RepairRequestFilters,
} from '../types'
import type { EquipmentService } from './equipmentService'

let defectCache: DefectCatalogItem[] | null = null

function getDefects(): DefectCatalogItem[] {
  if (!defectCache) defectCache = loadDefectCatalog()
  return defectCache
}

function getRepairRequests(): RepairRequest[] {
  return getEquipmentCache().repairRequests ?? []
}

function updateRepairRequest(next: RepairRequest) {
  const cache = getEquipmentCache()
  const repairRequests = (cache.repairRequests ?? []).map((request) =>
    request.id === next.id ? next : request,
  )
  saveEquipmentCache({ ...cache, repairRequests })
  return next
}

export const mockEquipmentService: EquipmentService = {
  async listTrolleys() {
    return getEquipmentCache().trolleys
  },

  async getTrolley(code: string) {
    return getEquipmentCache().trolleys.find((item) => item.code === code) ?? null
  },

  async saveTrolleys(trolleys: TrolleyUnit[]) {
    const cache = getEquipmentCache()
    saveEquipmentCache({ ...cache, trolleys })
  },

  async listPosDevices() {
    return getEquipmentCache().posDevices
  },

  async savePosDevices(devices: PortableDevice[]) {
    const cache = getEquipmentCache()
    saveEquipmentCache({ ...cache, posDevices: devices })
  },

  async listIpads() {
    return getEquipmentCache().ipads
  },

  async saveIpads(devices: PortableDevice[]) {
    const cache = getEquipmentCache()
    saveEquipmentCache({ ...cache, ipads: devices })
  },

  async listDefects() {
    return getDefects()
  },

  async saveDefects(defects: DefectCatalogItem[]) {
    defectCache = defects
  },

  async listRepairRequests(filters?: RepairRequestFilters) {
    return filterRepairRequests(getRepairRequests(), filters)
  },

  async getRepairRequest(id: string) {
    return getRepairRequests().find((request) => request.id === id) ?? null
  },

  async sendTrolleysToRepair(codes: string[], vendor: string, requestedBy?: string) {
    const cache = getEquipmentCache()
    const codeSet = new Set(codes)
    let repairRequests = [...(cache.repairRequests ?? [])]
    const toSend = cache.trolleys.filter((trolley) => codeSet.has(trolley.code))
    if (toSend.length === 0) return []

    const requestId = nextRequestId(repairRequests)
    const { request, trolleys: updatedBatch } = createBatchSendToRepairPayload(
      toSend,
      vendor,
      requestId,
    )
    const withActor = requestedBy ? { ...request, requestedBy } : request
    const updatedMap = new Map(updatedBatch.map((trolley) => [trolley.code, trolley]))
    const trolleys = cache.trolleys.map((trolley) => updatedMap.get(trolley.code) ?? trolley)

    repairRequests = [withActor, ...repairRequests]
    saveEquipmentCache({ ...cache, trolleys, repairRequests })
    return [withActor]
  },

  async completeRepairRequest(id: string, input: CompleteRepairRequestInput) {
    const existing = getRepairRequests().find((request) => request.id === id)
    if (!existing) throw new Error(`Repair request ${id} not found`)
    if (existing.status !== 'open') throw new Error('Only open requests can be completed')

    const completed = applyCompleteRepairRequest(existing, input)
    updateRepairRequest(completed)

    if (completed.equipmentType === 'trolley') {
      const cache = getEquipmentCache()
      const codeSet = new Set(completed.equipmentCodes)
      const trolleys = cache.trolleys.map((trolley) =>
        codeSet.has(trolley.code)
          ? syncTrolleyOnComplete(trolley, completed, completed.completedAt)
          : trolley,
      )
      saveEquipmentCache({ ...cache, trolleys, repairRequests: getRepairRequests() })
    }

    return completed
  },

  async cancelRepairRequest(id: string) {
    const existing = getRepairRequests().find((request) => request.id === id)
    if (!existing) throw new Error(`Repair request ${id} not found`)
    if (existing.status !== 'open') throw new Error('Only open requests can be cancelled')

    const cancelled = applyCancelRepairRequest(existing)
    updateRepairRequest(cancelled)

    if (cancelled.equipmentType === 'trolley') {
      const cache = getEquipmentCache()
      const codeSet = new Set(cancelled.equipmentCodes)
      const trolleys = cache.trolleys.map((trolley) =>
        codeSet.has(trolley.code) ? syncTrolleyOnCancel(trolley, cancelled) : trolley,
      )
      saveEquipmentCache({ ...cache, trolleys, repairRequests: getRepairRequests() })
    }

    return cancelled
  },
}

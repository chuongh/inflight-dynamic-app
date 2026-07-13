export type EquipmentType = 'trolley' | 'pos' | 'ipad'

export interface DefectCatalogItem {
  id: string
  equipmentType: EquipmentType
  code: string
  label: string
  active: boolean
}

export interface EquipmentEvent {
  id: string
  equipmentCode: string
  type: 'handover' | 'damage' | 'repair' | 'status_change'
  timestamp: number
  summary: string
  actor?: string
}

export interface MaintenanceRequest {
  id: string
  equipmentCode: string
  vendor?: string
  status: 'waiting' | 'repairing' | 'completed'
  createdAt: number
  completedAt?: number
}

export type RepairRequestStatus = 'open' | 'completed' | 'cancelled'

export interface RepairRequest {
  id: string
  equipmentType: EquipmentType
  /** One or more equipment units included in this send-to-repair request */
  equipmentCodes: string[]
  station: string
  status: RepairRequestStatus
  defectCode?: string
  issueDescription: string
  vendor: string
  requestedBy?: string
  requestedAt: number
  completedAt?: number
  repairContent?: string
  rootCause?: string
  turnaroundDays?: number
  internalNote?: string
  /** equipmentCode → TrolleyRepairEntry.id */
  repairHistoryIds?: Record<string, string>
  createdAt: number
  updatedAt: number
}

export interface CompleteRepairRequestInput {
  repairContent: string
  rootCause: string
  completedAt?: number
}

export interface RepairRequestFilters {
  status?: RepairRequestStatus | 'all'
  station?: string
  vendor?: string
  defectCode?: string
  equipmentCode?: string
  from?: number
  to?: number
  search?: string
}

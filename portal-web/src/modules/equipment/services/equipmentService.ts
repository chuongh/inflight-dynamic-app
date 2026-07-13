import type { PortableDevice } from '@/modules/equipment/lib/generatePortableDevices'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import type {
  CompleteRepairRequestInput,
  DefectCatalogItem,
  RepairRequest,
  RepairRequestFilters,
} from '../types'

export interface EquipmentService {
  listTrolleys(): Promise<TrolleyUnit[]>
  getTrolley(code: string): Promise<TrolleyUnit | null>
  saveTrolleys(trolleys: TrolleyUnit[]): Promise<void>
  listPosDevices(): Promise<PortableDevice[]>
  savePosDevices(devices: PortableDevice[]): Promise<void>
  listIpads(): Promise<PortableDevice[]>
  saveIpads(devices: PortableDevice[]): Promise<void>
  listDefects(): Promise<DefectCatalogItem[]>
  saveDefects(defects: DefectCatalogItem[]): Promise<void>
  listRepairRequests(filters?: RepairRequestFilters): Promise<RepairRequest[]>
  getRepairRequest(id: string): Promise<RepairRequest | null>
  sendTrolleysToRepair(codes: string[], vendor: string, requestedBy?: string): Promise<RepairRequest[]>
  completeRepairRequest(id: string, input: CompleteRepairRequestInput): Promise<RepairRequest>
  cancelRepairRequest(id: string): Promise<RepairRequest>
}

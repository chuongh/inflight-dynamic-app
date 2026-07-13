import {
  generateIpadDevices,
  generatePosDevices,
  type PortableDevice,
} from '@/modules/equipment/lib/generatePortableDevices'
import { generateTrolleys } from '@/modules/equipment/lib/generateTrolleys'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import { backfillRepairRequestsFromTrolleys, normalizeRepairRequest } from '../../modules/equipment/repairRequest'
import type { RepairRequest } from '../../modules/equipment/types'
import trolleysJson from '../equipment/trolleys.json'
import posJson from '../equipment/pos-devices.json'
import ipadsJson from '../equipment/ipads.json'

const DEMO_STORAGE_KEY = 'vj-mock-equipment-cache'

interface EquipmentCache {
  trolleys: TrolleyUnit[]
  posDevices: PortableDevice[]
  ipads: PortableDevice[]
  repairRequests?: RepairRequest[]
}

function readCache(): EquipmentCache | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EquipmentCache
  } catch {
    return null
  }
}

function writeCache(cache: EquipmentCache) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(cache))
}

function seedFromJson(): EquipmentCache {
  const hasJson =
    Array.isArray(trolleysJson) &&
    trolleysJson.length > 0 &&
    Array.isArray(posJson) &&
    posJson.length > 0

  if (hasJson) {
    return {
      trolleys: trolleysJson as TrolleyUnit[],
      posDevices: posJson as PortableDevice[],
      ipads: ipadsJson as PortableDevice[],
    }
  }

  return {
    trolleys: generateTrolleys(),
    posDevices: generatePosDevices(),
    ipads: generateIpadDevices(),
  }
}

function ensureRepairRequests(cache: EquipmentCache): EquipmentCache {
  const repairRequests =
    cache.repairRequests && cache.repairRequests.length > 0
      ? cache.repairRequests.map((request) => normalizeRepairRequest(request))
      : backfillRepairRequestsFromTrolleys(cache.trolleys)

  return { ...cache, repairRequests }
}

export function getEquipmentCache(): EquipmentCache {
  const cached = readCache()
  if (cached) return ensureRepairRequests(cached)
  const seeded = seedFromJson()
  const withRequests = ensureRepairRequests(seeded)
  writeCache(withRequests)
  return withRequests
}

export function saveEquipmentCache(cache: EquipmentCache) {
  writeCache(cache)
}

export function resetEquipmentCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

export function loadInitialTrolleys(): TrolleyUnit[] {
  return getEquipmentCache().trolleys
}

export function loadInitialPosDevices(): PortableDevice[] {
  return getEquipmentCache().posDevices
}

export function loadInitialIpads(): PortableDevice[] {
  return getEquipmentCache().ipads
}

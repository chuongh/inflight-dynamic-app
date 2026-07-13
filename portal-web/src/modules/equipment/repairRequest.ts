import type { TrolleyRepairEntry, TrolleyUnit } from './constants'
import type {
  CompleteRepairRequestInput,
  RepairRequest,
  RepairRequestFilters,
  RepairRequestStatus,
} from './types'

const DAY_MS = 86_400_000

export function computeTurnaroundDays(requestedAt: number, completedAt: number) {
  return Math.max(1, Math.floor((completedAt - requestedAt) / DAY_MS))
}

export function formatRequestId(year: number, sequence: number) {
  return `RR-${year}-${String(sequence).padStart(5, '0')}`
}

export function requestIncludesCode(request: RepairRequest, code: string) {
  return request.equipmentCodes.includes(code)
}

export function formatEquipmentCodes(codes: string[]) {
  if (codes.length === 0) return '—'
  if (codes.length <= 3) return codes.join(', ')
  return `${codes.slice(0, 3).join(', ')} +${codes.length - 3}`
}

function resolveStation(trolleys: TrolleyUnit[]) {
  const stations = new Set(trolleys.map((trolley) => trolley.station))
  if (stations.size <= 1) return trolleys[0]?.station ?? '—'
  return 'Mixed'
}

function repairEntryStatus(entry: TrolleyRepairEntry): RepairRequestStatus {
  return entry.completedAt == null ? 'open' : 'completed'
}

function repairEntryToRequest(
  trolley: TrolleyUnit,
  entry: TrolleyRepairEntry,
  id: string,
): RepairRequest {
  const status = repairEntryStatus(entry)
  const requestedAt = entry.startedAt
  const completedAt = entry.completedAt
  const turnaroundDays =
    completedAt != null ? computeTurnaroundDays(requestedAt, completedAt) : undefined

  return {
    id,
    equipmentType: 'trolley',
    equipmentCodes: [trolley.code],
    station: trolley.station,
    status,
    issueDescription: entry.issueDescription,
    vendor: entry.vendor,
    requestedAt,
    completedAt,
    repairContent: entry.repairContent,
    rootCause: entry.rootCause,
    turnaroundDays,
    repairHistoryIds: { [trolley.code]: entry.id },
    createdAt: requestedAt,
    updatedAt: completedAt ?? requestedAt,
  }
}

export function nextRequestId(requests: RepairRequest[], now = Date.now()) {
  const year = new Date(now).getFullYear()
  const prefix = `RR-${year}-`
  const maxSeq = requests
    .filter((request) => request.id.startsWith(prefix))
    .map((request) => Number.parseInt(request.id.slice(prefix.length), 10))
    .filter((value) => !Number.isNaN(value))
    .reduce((max, value) => Math.max(max, value), 0)
  return formatRequestId(year, maxSeq + 1)
}

export function summarizeRepairRequests(requests: RepairRequest[]) {
  const trolleyRequests = requests.filter((request) => request.equipmentType === 'trolley')
  const open = trolleyRequests.filter((request) => request.status === 'open')
  const completed = trolleyRequests.filter((request) => request.status === 'completed')
  const turnaroundDays = completed
    .map((request) => request.turnaroundDays)
    .filter((value): value is number => value != null)
  const avgTurnaround =
    turnaroundDays.length > 0
      ? Math.round((turnaroundDays.reduce((sum, value) => sum + value, 0) / turnaroundDays.length) * 10) /
        10
      : 0

  return {
    total: trolleyRequests.length,
    open: open.length,
    completed: completed.length,
    cancelled: trolleyRequests.filter((request) => request.status === 'cancelled').length,
    avgTurnaround,
    unitsInOpenRequests: open.reduce((sum, request) => sum + request.equipmentCodes.length, 0),
  }
}

export function createBatchSendToRepairPayload(
  trolleys: TrolleyUnit[],
  vendor: string,
  requestId: string,
  now = Date.now(),
): { request: RepairRequest; trolleys: TrolleyUnit[] } {
  const repairHistoryIds: Record<string, string> = {}
  const issueDescription =
    trolleys.length === 1
      ? trolleys[0].lastRepairReason || 'Sent for repair'
      : `Batch send — ${trolleys.length} trolley carts`

  const updatedTrolleys = trolleys.map((trolley) => {
    const entryId = `${requestId}:${trolley.code}`
    repairHistoryIds[trolley.code] = entryId
    const entry: TrolleyRepairEntry = {
      id: entryId,
      startedAt: now,
      issueDescription: trolley.lastRepairReason || issueDescription,
      vendor,
    }

    return {
      ...trolley,
      status: 'repairing' as const,
      vendor,
      daysInStatus: 0,
      updatedAt: now,
      repairHistory: [entry, ...trolley.repairHistory],
    }
  })

  return {
    request: {
      id: requestId,
      equipmentType: 'trolley',
      equipmentCodes: trolleys.map((trolley) => trolley.code),
      station: resolveStation(trolleys),
      status: 'open',
      issueDescription,
      vendor,
      requestedAt: now,
      repairHistoryIds,
      createdAt: now,
      updatedAt: now,
    },
    trolleys: updatedTrolleys,
  }
}

export function findOpenRequestForTrolley(requests: RepairRequest[], code: string) {
  return requests.find(
    (request) =>
      request.equipmentType === 'trolley' &&
      request.status === 'open' &&
      requestIncludesCode(request, code),
  )
}

export function backfillRepairRequestsFromTrolleys(trolleys: TrolleyUnit[]): RepairRequest[] {
  const entries: Array<{ trolley: TrolleyUnit; entry: TrolleyRepairEntry }> = []

  for (const trolley of trolleys) {
    for (const entry of trolley.repairHistory) {
      entries.push({ trolley, entry })
    }
  }

  entries.sort((left, right) => left.entry.startedAt - right.entry.startedAt)

  const yearCounters = new Map<number, number>()
  const requests: RepairRequest[] = []

  for (const { trolley, entry } of entries) {
    const year = new Date(entry.startedAt).getFullYear()
    const next = (yearCounters.get(year) ?? 0) + 1
    yearCounters.set(year, next)
    requests.push(repairEntryToRequest(trolley, entry, formatRequestId(year, next)))
  }

  return requests.sort((left, right) => right.requestedAt - left.requestedAt)
}

export function filterRepairRequests(
  requests: RepairRequest[],
  filters: RepairRequestFilters = {},
): RepairRequest[] {
  const query = filters.search?.trim().toLowerCase() ?? ''

  return requests.filter((request) => {
    if (filters.status && filters.status !== 'all' && request.status !== filters.status) {
      return false
    }
    if (filters.station && request.station !== filters.station) return false
    if (filters.vendor && request.vendor !== filters.vendor) return false
    if (filters.defectCode && request.defectCode !== filters.defectCode) return false
    if (filters.equipmentCode && !requestIncludesCode(request, filters.equipmentCode)) return false
    if (filters.from != null && request.requestedAt < filters.from) return false
    if (filters.to != null && request.requestedAt > filters.to) return false
    if (
      query !== '' &&
      !request.id.toLowerCase().includes(query) &&
      !request.equipmentCodes.some((code) => code.toLowerCase().includes(query)) &&
      !request.issueDescription.toLowerCase().includes(query) &&
      !request.vendor.toLowerCase().includes(query)
    ) {
      return false
    }
    return true
  })
}

export function getRequestsForEquipment(
  requests: RepairRequest[],
  equipmentCode: string,
  excludeId?: string,
) {
  return requests
    .filter(
      (request) => requestIncludesCode(request, equipmentCode) && request.id !== excludeId,
    )
    .sort((left, right) => right.requestedAt - left.requestedAt)
}

export function applyCompleteRepairRequest(
  request: RepairRequest,
  input: CompleteRepairRequestInput,
): RepairRequest {
  const completedAt = input.completedAt ?? Date.now()
  return {
    ...request,
    status: 'completed',
    completedAt,
    repairContent: input.repairContent,
    rootCause: input.rootCause,
    turnaroundDays: computeTurnaroundDays(request.requestedAt, completedAt),
    updatedAt: completedAt,
  }
}

export function applyCancelRepairRequest(request: RepairRequest, now = Date.now()): RepairRequest {
  return {
    ...request,
    status: 'cancelled',
    updatedAt: now,
  }
}

export function syncTrolleyOnComplete(
  trolley: TrolleyUnit,
  request: RepairRequest,
  now = Date.now(),
): TrolleyUnit {
  const historyId = request.repairHistoryIds?.[trolley.code]
  const repairHistory = trolley.repairHistory.map((entry) => {
    if (historyId && entry.id === historyId) {
      return {
        ...entry,
        completedAt: request.completedAt ?? now,
        repairContent: request.repairContent,
        rootCause: request.rootCause,
      }
    }
    if (!historyId && entry.completedAt == null) {
      return {
        ...entry,
        completedAt: request.completedAt ?? now,
        repairContent: request.repairContent,
        rootCause: request.rootCause,
      }
    }
    return entry
  })

  const hadOpenRepair = trolley.repairHistory.some((entry) => entry.completedAt == null)

  return {
    ...trolley,
    status: 'service',
    daysInStatus: 0,
    updatedAt: now,
    repairs: hadOpenRepair ? trolley.repairs + 1 : trolley.repairs,
    repairHistory,
  }
}

export function syncTrolleyOnCancel(
  trolley: TrolleyUnit,
  request: RepairRequest,
  now = Date.now(),
): TrolleyUnit {
  if (request.status !== 'cancelled' || trolley.status !== 'repairing') return trolley

  const historyId = request.repairHistoryIds?.[trolley.code]
  const hasOtherOpen = trolley.repairHistory.some(
    (entry) => entry.completedAt == null && (!historyId || entry.id !== historyId),
  )

  if (hasOtherOpen) return { ...trolley, updatedAt: now }

  return {
    ...trolley,
    status: 'not-service',
    daysInStatus: 0,
    updatedAt: now,
  }
}

type LegacyRepairRequest = RepairRequest & {
  equipmentCode?: string
  repairHistoryId?: string
}

export function normalizeRepairRequest(request: LegacyRepairRequest): RepairRequest {
  if (Array.isArray(request.equipmentCodes) && request.equipmentCodes.length > 0) {
    return request
  }

  const code = request.equipmentCode
  const equipmentCodes = code ? [code] : []
  const repairHistoryIds =
    request.repairHistoryIds ??
    (code && request.repairHistoryId ? { [code]: request.repairHistoryId } : undefined)

  const { equipmentCode: _legacyCode, repairHistoryId: _legacyHistoryId, ...rest } = request
  return {
    ...rest,
    equipmentCodes,
    repairHistoryIds,
  }
}

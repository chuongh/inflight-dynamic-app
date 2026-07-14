import {
  MANUFACTURERS,
  STATIONS,
  VENDORS,
  type MovementEvent,
  type TrolleyCustody,
  type TrolleyRepairEntry,
  type TrolleyStatus,
  type TrolleyType,
  type TrolleyUnit,
} from '../constants'

const DAY = 86_400_000
const HOUR = 3_600_000

/** Deterministic pool of Vietnamese cabin-crew names (prefixed) for custody/movements. */
const CABIN_CREW = [
  'CC. Nguyễn T. Lan',
  'CC. Trần V. Minh',
  'CC. Lê T. Hà',
  'CC. Phạm Q. Anh',
  'CC. Hoàng V. Dũng',
  'CC. Vũ T. Mai',
] as const

function movementId(code: string, type: string, timestamp: number) {
  return `${code}-mv-${type}-${timestamp}`
}

function pickOtherStation(random: () => number, exclude: string): string {
  const options = STATIONS.filter((station) => station !== exclude)
  return pick(random, options)
}

const REPAIR_NARRATIVES = [
  {
    issue: 'Wheel/brake failure',
    content: 'Replaced front caster wheels and brake shoes',
    rootCause: 'Wear and tear',
  },
  {
    issue: 'Door lock broken',
    content: 'Replaced door latch assembly and adjusted alignment',
    rootCause: 'Operational impact',
  },
  {
    issue: 'Power socket fault',
    content: 'Rewired galley power outlet and replaced socket block',
    rootCause: 'Electrical issue',
  },
  {
    issue: 'Caster wheel seized',
    content: 'Cleaned and replaced seized rear caster bearings',
    rootCause: 'Wear and tear',
  },
  {
    issue: 'Frame crack',
    content: 'Welded side frame crack and reinforced bracket',
    rootCause: 'Structural fatigue',
  },
  {
    issue: 'Brake lever fault',
    content: 'Replaced brake lever mechanism and cable',
    rootCause: 'Operational impact',
  },
  {
    issue: 'Damaged side rail',
    content: 'Replaced left side aluminium rail panel',
    rootCause: 'Impact damage',
  },
  {
    issue: 'Corroded frame member',
    content: 'Treated corrosion and replaced lower frame member',
    rootCause: 'Environmental corrosion',
  },
] as const

/** Hub-heavy station mix for demo (SGN dominant). */
const STATION_WEIGHTS: Array<{ station: (typeof STATIONS)[number]; weight: number }> = [
  { station: 'SGN', weight: 0.42 },
  { station: 'HAN', weight: 0.28 },
  { station: 'CXR', weight: 0.15 },
  { station: 'DAD', weight: 0.1 },
  { station: 'PQC', weight: 0.05 },
]

function createSeededRandom(seed: number) {
  let state = seed | 0
  return () => {
    state = (state + 1831565813) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

const EPC_HEX = '0123456789ABCDEF'

/** Deterministic-looking RFID EPC, e.g. "E280 6994 A142 03F1" */
function createEpc(random: () => number): string {
  let hex = 'E280'
  for (let group = 0; group < 3; group += 1) {
    let chunk = ''
    for (let i = 0; i < 4; i += 1) {
      chunk += EPC_HEX[Math.floor(random() * EPC_HEX.length)]
    }
    hex += ` ${chunk}`
  }
  return hex
}

function pickWeightedStation(random: () => number): string {
  const value = random()
  let cumulative = 0
  for (const item of STATION_WEIGHTS) {
    cumulative += item.weight
    if (value <= cumulative) return item.station
  }
  return 'SGN'
}

function createRepairHistory(
  random: () => number,
  code: string,
  completedRepairs: number,
  status: TrolleyStatus,
  now: number,
): TrolleyRepairEntry[] {
  const history: TrolleyRepairEntry[] = []
  let cursor = now - Math.floor((90 + random() * 500) * DAY)

  for (let index = 0; index < completedRepairs; index += 1) {
    const narrative = pick(random, REPAIR_NARRATIVES)
    const startedAt = cursor + Math.floor((7 + random() * 28) * DAY)
    const durationDays = Math.max(2, Math.floor(3 + random() * 10))
    const completedAt = startedAt + durationDays * DAY
    cursor = completedAt + Math.floor(random() * 14) * DAY

    history.push({
      id: `${code}-r${index + 1}`,
      startedAt,
      completedAt,
      issueDescription: narrative.issue,
      repairContent: narrative.content,
      rootCause: narrative.rootCause,
      vendor: pick(random, VENDORS),
    })
  }

  if (status === 'repairing') {
    const narrative = pick(random, REPAIR_NARRATIVES)
    history.push({
      id: `${code}-in-progress`,
      startedAt: now - Math.floor((1 + random() * 10) * DAY),
      issueDescription: narrative.issue,
      vendor: pick(random, VENDORS),
    })
  }

  return history.sort((left, right) => right.startedAt - left.startedAt)
}

function buildUnit(options: {
  code: string
  type: TrolleyType
  status: TrolleyStatus
  station: string
  manufacturer: string
  completedRepairs: number
  daysInStatus: number
  yearOfManufacture: number
  now: number
  random: () => number
  partNo: string
  serialNumber: string
  registrationLocation?: string
}): TrolleyUnit {
  const repairHistory = createRepairHistory(
    options.random,
    options.code,
    options.completedRepairs,
    options.status,
    options.now,
  )
  const latestRepair = repairHistory[0]
  const latestCompleted =
    repairHistory.find((entry) => entry.completedAt != null) ?? latestRepair
  const lastRepairReason = latestCompleted?.issueDescription ?? '—'
  const updatedAt = options.now - Math.min(options.daysInStatus, 20) * DAY

  // Chain-of-custody + movement ledger — seeded so the JSON is deterministic.
  let lastSeenAt = options.now - Math.floor(options.random() * 6) * HOUR
  let lastSeenStation = options.station
  let custody: TrolleyCustody | undefined
  let movements: MovementEvent[] = []

  if (options.status === 'in-transit') {
    const holder = pick(options.random, CABIN_CREW)
    const fromStation = options.station
    const toStation = pickOtherStation(options.random, fromStation)
    const flight = `VJ${100 + Math.floor(options.random() * 899)}`
    const checkoutAt = options.now - (1 + Math.floor(options.random() * 6)) * HOUR

    lastSeenAt = checkoutAt
    lastSeenStation = fromStation
    custody = { holder, flight, fromStation, toStation, since: checkoutAt }

    const checkout: MovementEvent = {
      id: movementId(options.code, 'out', checkoutAt),
      type: 'checkout',
      timestamp: checkoutAt,
      station: fromStation,
      fromStation,
      toStation,
      flight,
      actor: holder,
      condition: 'ok',
    }
    // One prior completed leg: returned to this station before the current trip.
    const priorAt = checkoutAt - (1 + Math.floor(options.random() * 5)) * DAY
    const priorCheckin: MovementEvent = {
      id: movementId(options.code, 'in', priorAt),
      type: 'checkin',
      timestamp: priorAt,
      station: fromStation,
      actor: pick(options.random, CABIN_CREW),
      condition: 'ok',
    }
    movements = [checkout, priorCheckin]
  } else if (options.status === 'not-service') {
    // Newest movement is a damaged check-in so the workshop queue shows the fault.
    const checkin: MovementEvent = {
      id: movementId(options.code, 'in', updatedAt),
      type: 'checkin',
      timestamp: updatedAt,
      station: options.station,
      actor: pick(options.random, CABIN_CREW),
      condition: 'damaged',
      note: `${lastRepairReason} reported on arrival`,
    }
    lastSeenAt = updatedAt
    lastSeenStation = options.station
    movements = [checkin]
  }

  return {
    code: options.code,
    type: options.type,
    status: options.status,
    station: options.station,
    repairs: options.completedRepairs,
    lastRepairReason,
    vendor: latestRepair?.vendor ?? pick(options.random, VENDORS),
    daysInStatus: options.daysInStatus,
    updatedAt,
    partNo: options.partNo,
    serialNumber: options.serialNumber,
    manufacturer: options.manufacturer,
    yearOfManufacture: options.yearOfManufacture,
    yearOfExpiry:
      options.random() > 0.35 ? options.yearOfManufacture + 10 + Math.floor(options.random() * 3) : undefined,
    registrationLocation: options.registrationLocation ?? options.station,
    repairHistory,
    rfidEpc: createEpc(options.random),
    lastSeenAt,
    lastSeenStation,
    custody,
    movements,
  }
}

/**
 * Demo fleet sized like meeting baseline (~364 carts):
 * Full ~248 · Half ~116 · mostly In Service · smaller Not-service / Repairing pool.
 * Includes a few showcase units for guided customer walkthrough.
 */
export function generateTrolleys(now = Date.now()): TrolleyUnit[] {
  const random = createSeededRandom(20260706)
  const fullCount = 248
  const halfCount = 116
  const total = fullCount + halfCount

  // Target mix ≈ dashboard mock: ~86% service · ~9% repairing · ~5% not-service
  const notServiceCount = 18
  const repairingCount = 34
  const inTransitCount = 21
  const serviceCount = total - notServiceCount - repairingCount - inTransitCount

  const showcase: TrolleyUnit[] = [
    buildUnit({
      code: 'F-102',
      type: 'full',
      status: 'repairing',
      station: 'SGN',
      manufacturer: 'Zodiac',
      completedRepairs: 7,
      daysInStatus: 4,
      yearOfManufacture: 2019,
      now,
      random,
      partNo: 'AT-7721',
      serialNumber: 'SN-882910',
      registrationLocation: 'SGN',
    }),
    buildUnit({
      code: 'F-215',
      type: 'full',
      status: 'not-service',
      station: 'HAN',
      manufacturer: 'TLD',
      completedRepairs: 5,
      daysInStatus: 12,
      yearOfManufacture: 2018,
      now,
      random,
      partNo: 'AT-7840',
      serialNumber: 'SN-883015',
      registrationLocation: 'SGN',
    }),
    buildUnit({
      code: 'H-045',
      type: 'half',
      status: 'not-service',
      station: 'SGN',
      manufacturer: 'Mallaghan',
      completedRepairs: 6,
      daysInStatus: 8,
      yearOfManufacture: 2020,
      now,
      random,
      partNo: 'AT-7602',
      serialNumber: 'SN-881120',
      registrationLocation: 'SGN',
    }),
    buildUnit({
      code: 'F-008',
      type: 'full',
      status: 'service',
      station: 'CXR',
      manufacturer: 'JBT AeroTech',
      completedRepairs: 2,
      daysInStatus: 21,
      yearOfManufacture: 2021,
      now,
      random,
      partNo: 'AT-7710',
      serialNumber: 'SN-882100',
      registrationLocation: 'CXR',
    }),
  ]

  const usedCodes = new Set(showcase.map((item) => item.code))
  const units: TrolleyUnit[] = [...showcase]

  const remaining = {
    service: serviceCount - showcase.filter((item) => item.status === 'service').length,
    'not-service':
      notServiceCount - showcase.filter((item) => item.status === 'not-service').length,
    repairing: repairingCount - showcase.filter((item) => item.status === 'repairing').length,
    'in-transit':
      inTransitCount - showcase.filter((item) => item.status === 'in-transit').length,
  }

  const statusQueue: TrolleyStatus[] = [
    ...Array.from({ length: Math.max(0, remaining.service) }, () => 'service' as const),
    ...Array.from({ length: Math.max(0, remaining['not-service']) }, () => 'not-service' as const),
    ...Array.from({ length: Math.max(0, remaining.repairing) }, () => 'repairing' as const),
    ...Array.from({ length: Math.max(0, remaining['in-transit']) }, () => 'in-transit' as const),
  ]

  for (let index = statusQueue.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[statusQueue[index], statusQueue[swap]] = [statusQueue[swap], statusQueue[index]]
  }

  let statusIndex = 0

  const pushUnit = (type: TrolleyType, sequence: number) => {
    const prefix = type === 'full' ? 'F' : 'H'
    const code = `${prefix}-${String(sequence).padStart(3, '0')}`
    if (usedCodes.has(code)) return

    const status = statusQueue[statusIndex] ?? 'service'
    statusIndex += 1

    const completedRepairs =
      status === 'service' || status === 'in-transit'
        ? Math.floor(random() * 4)
        : status === 'not-service'
          ? 1 + Math.floor(random() * 5)
          : 2 + Math.floor(random() * 6)

    units.push(
      buildUnit({
        code,
        type,
        status,
        station: pickWeightedStation(random),
        manufacturer: pick(random, MANUFACTURERS),
        completedRepairs,
        daysInStatus:
          status === 'not-service'
            ? 3 + Math.floor(random() * 20)
            : status === 'repairing'
              ? 1 + Math.floor(random() * 12)
              : 1 + Math.floor(random() * 40),
        yearOfManufacture: 2015 + Math.floor(random() * 10),
        now,
        random,
        partNo: `AT-${7700 + sequence + (type === 'half' ? 200 : 0)}`,
        serialNumber: `SN-${882900 + sequence + (type === 'half' ? 5000 : 0)}`,
      }),
    )
  }

  for (let sequence = 1; sequence <= fullCount; sequence += 1) pushUnit('full', sequence)
  for (let sequence = 1; sequence <= halfCount; sequence += 1) pushUnit('half', sequence)

  return units.sort((left, right) => left.code.localeCompare(right.code))
}

export function summarizeFleet(trolleys: TrolleyUnit[]) {
  const full = trolleys.filter((item) => item.type === 'full').length
  const half = trolleys.filter((item) => item.type === 'half').length
  const service = trolleys.filter((item) => item.status === 'service').length
  const notService = trolleys.filter((item) => item.status === 'not-service').length
  const repairing = trolleys.filter((item) => item.status === 'repairing').length
  const inTransit = trolleys.filter((item) => item.status === 'in-transit').length
  const retired = trolleys.filter((item) => item.status === 'retired').length

  return { total: trolleys.length, full, half, service, notService, repairing, inTransit, retired }
}

export function exportTrolleysCsv(trolleys: TrolleyUnit[]) {
  const escape = (value: unknown) => {
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const headers = [
    'Code',
    'RFID/EPC',
    'Type',
    'Status',
    'Station',
    'Last seen station',
    'Repairs',
    'Last repair',
    'Vendor',
    'Days in status',
    'Updated',
    'Part No',
    'Serial Number',
    'Manufacturer',
  ]

  const rows = trolleys.map((item) => [
    item.code,
    item.rfidEpc,
    item.type === 'full' ? 'Full-size' : 'Half-size',
    item.status,
    item.station,
    item.lastSeenStation,
    item.repairs,
    item.lastRepairReason,
    item.vendor,
    item.daysInStatus,
    new Date(item.updatedAt).toISOString().slice(0, 10),
    item.partNo,
    item.serialNumber,
    item.manufacturer,
  ])

  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `trolley-list-${trolleys.length}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

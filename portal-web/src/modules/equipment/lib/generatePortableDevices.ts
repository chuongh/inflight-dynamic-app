import { STATIONS, VENDORS, type TrolleyStatus } from '../constants'

export interface PortableDevice {
  code: string
  serialNumber?: string
  imei?: string
  manufacturer: string
  yearOfManufacture: number
  status: TrolleyStatus
  station: string
  holder: string
  totalRepairs: number
  updatedAt: number
  vendor?: string
  sentForRepairAt?: number
  issueDescription?: string
}

const DAY = 86_400_000

const CREW = [
  'Nguyen T. Anh',
  'Le H. Mai',
  'Pham K. Linh',
  'Tran M. Quang',
  'Do T. Minh',
  'Vo N. Ha',
  'Hoang T. Lan',
  'Bui Q. Huy',
]

const POS_MANUFACTURERS = ['Ingenico', 'Verifone', 'PAX', 'Castles'] as const
const IPAD_MANUFACTURERS = ['Apple'] as const

const STATION_WEIGHTS: Array<{ station: (typeof STATIONS)[number]; weight: number }> = [
  { station: 'SGN', weight: 0.4 },
  { station: 'HAN', weight: 0.3 },
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

function pick<T>(random: () => number, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)]
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

function pickStatus(random: () => number): TrolleyStatus {
  const value = random()
  if (value < 0.82) return 'service'
  if (value < 0.93) return 'not-service'
  return 'repairing'
}

function buildImei(prefix: string, index: number) {
  return `${prefix}${String(1000000000000 + index).slice(0, 13)}`
}

export function generatePosDevices(count = 58, now = Date.now()): PortableDevice[] {
  const random = createSeededRandom(20260708)
  const result: PortableDevice[] = []

  // Showcase units for demo walkthrough
  result.push(
    {
      code: 'POS-0001',
      serialNumber: 'SN-P970001',
      imei: buildImei('35', 1),
      manufacturer: 'Ingenico',
      yearOfManufacture: 2022,
      status: 'service',
      station: 'SGN',
      holder: 'Nguyen T. Anh',
      totalRepairs: 1,
      updatedAt: now - 2 * DAY,
    },
    {
      code: 'POS-0007',
      serialNumber: undefined,
      imei: buildImei('35', 7),
      manufacturer: 'Verifone',
      yearOfManufacture: 2021,
      status: 'not-service',
      station: 'HAN',
      holder: 'Le H. Mai',
      totalRepairs: 3,
      updatedAt: now - 6 * DAY,
    },
    {
      code: 'POS-0012',
      serialNumber: 'SN-P970012',
      imei: undefined,
      manufacturer: 'PAX',
      yearOfManufacture: 2020,
      status: 'repairing',
      station: 'SGN',
      holder: 'Tran M. Quang',
      totalRepairs: 2,
      updatedAt: now - 3 * DAY,
      vendor: 'TLD Vietnam',
      sentForRepairAt: now - 3 * DAY,
      issueDescription: 'Card reader intermittent failure',
    },
  )

  const used = new Set(result.map((item) => item.code))

  for (let index = 1; index <= count; index += 1) {
    const code = `POS-${String(index).padStart(4, '0')}`
    if (used.has(code)) continue

    const status = pickStatus(random)
    const identityRoll = random()
    // Meeting rule: at least one of Serial / IMEI. Mix for demo realism.
    const serialOnly = identityRoll < 0.25
    const imeiOnly = identityRoll >= 0.25 && identityRoll < 0.45
    const daysAgo = Math.floor(1 + random() * 12)

    result.push({
      code,
      serialNumber: imeiOnly ? undefined : `SN-P${970000 + index}`,
      imei: serialOnly ? undefined : buildImei('35', index),
      manufacturer: pick(random, POS_MANUFACTURERS),
      yearOfManufacture: 2019 + Math.floor(random() * 7),
      status,
      station: pickWeightedStation(random),
      holder: pick(random, CREW),
      totalRepairs:
        status === 'service' ? Math.floor(random() * 3) : 1 + Math.floor(random() * 4),
      updatedAt: now - Math.floor(random() * 20) * DAY,
      ...(status === 'repairing'
        ? {
            vendor: pick(random, VENDORS),
            sentForRepairAt: now - daysAgo * DAY,
            issueDescription: 'Hardware fault — sent to vendor',
            updatedAt: now - daysAgo * DAY,
          }
        : {}),
    })
  }

  return result.sort((left, right) => left.code.localeCompare(right.code))
}

export function generateIpadDevices(count = 44, now = Date.now()): PortableDevice[] {
  const random = createSeededRandom(20260709)
  const result: PortableDevice[] = []

  result.push(
    {
      code: 'IPD-0003',
      serialNumber: 'SN-I880003',
      imei: buildImei('99', 3),
      manufacturer: 'Apple',
      yearOfManufacture: 2023,
      status: 'service',
      station: 'SGN',
      holder: 'Pham K. Linh',
      totalRepairs: 0,
      updatedAt: now - DAY,
    },
    {
      code: 'IPD-0011',
      serialNumber: 'SN-I880011',
      imei: buildImei('99', 11),
      manufacturer: 'Apple',
      yearOfManufacture: 2022,
      status: 'not-service',
      station: 'CXR',
      holder: 'Do T. Minh',
      totalRepairs: 2,
      updatedAt: now - 5 * DAY,
    },
    {
      code: 'IPD-0018',
      serialNumber: 'SN-I880018',
      imei: buildImei('99', 18),
      manufacturer: 'Apple',
      yearOfManufacture: 2021,
      status: 'repairing',
      station: 'HAN',
      holder: 'Vo N. Ha',
      totalRepairs: 4,
      updatedAt: now - 4 * DAY,
      vendor: 'XYZ Service',
      sentForRepairAt: now - 4 * DAY,
      issueDescription: 'Battery swelling — safety check',
    },
  )

  const used = new Set(result.map((item) => item.code))

  for (let index = 1; index <= count; index += 1) {
    const code = `IPD-${String(index).padStart(4, '0')}`
    if (used.has(code)) continue

    const status = pickStatus(random)
    const daysAgo = Math.floor(1 + random() * 12)
    result.push({
      code,
      serialNumber: `SN-I${880000 + index}`,
      imei: buildImei('99', index),
      manufacturer: pick(random, IPAD_MANUFACTURERS),
      yearOfManufacture: 2020 + Math.floor(random() * 6),
      status,
      station: pickWeightedStation(random),
      holder: pick(random, CREW),
      totalRepairs:
        status === 'service' ? Math.floor(random() * 2) : 1 + Math.floor(random() * 3),
      updatedAt: now - Math.floor(random() * 18) * DAY,
      ...(status === 'repairing'
        ? {
            vendor: pick(random, VENDORS),
            sentForRepairAt: now - daysAgo * DAY,
            issueDescription: 'Device fault — sent to vendor',
            updatedAt: now - daysAgo * DAY,
          }
        : {}),
    })
  }

  return result.sort((left, right) => left.code.localeCompare(right.code))
}

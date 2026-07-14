export type TrolleyType = 'full' | 'half'
export type TrolleyStatus = 'service' | 'not-service' | 'repairing' | 'in-transit' | 'retired'

export interface TrolleyRepairEntry {
  id: string
  startedAt: number
  completedAt?: number
  issueDescription: string
  repairContent?: string
  rootCause?: string
  vendor: string
}

export type ConditionReport = 'ok' | 'damaged'
export type MovementType = 'checkout' | 'checkin'

export interface MovementEvent {
  id: string
  type: MovementType
  timestamp: number
  /** Station where the scan happened */
  station: string
  /** checkout: origin station */
  fromStation?: string
  /** checkout: destination station */
  toStation?: string
  flight?: string
  /** Cabin-crew member name/id performing the scan */
  actor: string
  condition: ConditionReport
  note?: string
}

export interface TrolleyCustody {
  holder: string
  flight: string
  fromStation: string
  toStation: string
  since: number
}

export interface TrolleyUnit {
  code: string
  type: TrolleyType
  status: TrolleyStatus
  station: string
  repairs: number
  lastRepairReason: string
  vendor: string
  daysInStatus: number
  updatedAt: number
  partNo: string
  serialNumber: string
  manufacturer: string
  yearOfManufacture: number
  yearOfExpiry?: number
  registrationLocation: string
  repairHistory: TrolleyRepairEntry[]
  /** RFID EPC tag, e.g. "E280 6994 A142" — unique physical identity */
  rfidEpc: string
  /** Epoch ms of the most recent RFID scan (any gate/handheld) */
  lastSeenAt: number
  /** Station where the unit was last scanned */
  lastSeenStation: string
  /** Present only while status === 'in-transit' */
  custody?: TrolleyCustody
  /** Chain-of-custody ledger, newest-first */
  movements: MovementEvent[]
}

export const TROLLEY_TYPE_LABELS: Record<TrolleyType, string> = {
  full: 'Full-size',
  half: 'Half-size',
}

export const TROLLEY_STATUS_LABELS: Record<TrolleyStatus, string> = {
  service: 'In Service',
  'not-service': 'Not-service',
  repairing: 'Repairing',
  'in-transit': 'In Transit',
  retired: 'Retired',
}

export const STATIONS = ['SGN', 'HAN', 'DAD', 'CXR', 'PQC'] as const

export const VENDORS = [
  'ABC Repair',
  'XYZ Service',
  'TLD Vietnam',
  'Zodiac GSE',
  'Mallaghan SGN',
] as const

export const MANUFACTURERS = ['Zodiac', 'TLD', 'Mallaghan', 'JBT AeroTech'] as const

export const REPAIR_REASONS = [
  'Wheel/brake failure',
  'Door lock broken',
  'Power socket fault',
  'Caster wheel seized',
  'Frame crack',
  'Brake lever fault',
  'Damaged side rail',
  'Corroded frame member',
]

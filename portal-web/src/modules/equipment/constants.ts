export type TrolleyType = 'full' | 'half'
export type TrolleyStatus = 'service' | 'not-service' | 'repairing'

export interface TrolleyRepairEntry {
  id: string
  startedAt: number
  completedAt?: number
  issueDescription: string
  repairContent?: string
  rootCause?: string
  vendor: string
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
}

export const TROLLEY_TYPE_LABELS: Record<TrolleyType, string> = {
  full: 'Full-size',
  half: 'Half-size',
}

export const TROLLEY_STATUS_LABELS: Record<TrolleyStatus, string> = {
  service: 'In Service',
  'not-service': 'Not-service',
  repairing: 'Repairing',
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

import type { ConditionReport, MovementEvent, TrolleyUnit } from '../constants'

const DAY = 86_400_000
const STALE_THRESHOLD_DAYS = 7

export interface CheckoutInput {
  actor: string
  flight: string
  fromStation: string
  toStation: string
  condition: ConditionReport
  note?: string
}

export interface CheckinInput {
  actor: string
  station: string
  condition: ConditionReport
  note?: string
}

function movementId(code: string, now: number, type: string) {
  return `${code}-mv-${type}-${now}`
}

export function applyCheckout(unit: TrolleyUnit, input: CheckoutInput, now: number): TrolleyUnit {
  const movement: MovementEvent = {
    id: movementId(unit.code, now, 'out'),
    type: 'checkout',
    timestamp: now,
    station: input.fromStation,
    fromStation: input.fromStation,
    toStation: input.toStation,
    flight: input.flight,
    actor: input.actor,
    condition: input.condition,
    note: input.note,
  }
  return {
    ...unit,
    status: 'in-transit',
    custody: {
      holder: input.actor,
      flight: input.flight,
      fromStation: input.fromStation,
      toStation: input.toStation,
      since: now,
    },
    lastSeenAt: now,
    lastSeenStation: input.fromStation,
    updatedAt: now,
    movements: [movement, ...unit.movements],
  }
}

export function applyCheckin(unit: TrolleyUnit, input: CheckinInput, now: number): TrolleyUnit {
  const damaged = input.condition === 'damaged'
  const movement: MovementEvent = {
    id: movementId(unit.code, now, 'in'),
    type: 'checkin',
    timestamp: now,
    station: input.station,
    actor: input.actor,
    condition: input.condition,
    note: input.note,
  }
  return {
    ...unit,
    status: damaged ? 'not-service' : 'service',
    custody: undefined,
    station: input.station,
    lastSeenAt: now,
    lastSeenStation: input.station,
    daysInStatus: 0,
    updatedAt: now,
    lastRepairReason: damaged ? input.note ?? unit.lastRepairReason : unit.lastRepairReason,
    movements: [movement, ...unit.movements],
  }
}

export function isStale(unit: TrolleyUnit, now: number, thresholdDays = STALE_THRESHOLD_DAYS): boolean {
  if (unit.status === 'in-transit' || unit.status === 'retired') return false
  return now - unit.lastSeenAt > thresholdDays * DAY
}

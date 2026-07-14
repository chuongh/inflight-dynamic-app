import type { TrolleyUnit } from '../constants'

/** Deterministic 8-hex-char suffix from the unit code, e.g. "F-142" -> "6994A142". */
function epcFromCode(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0').slice(0, 8)
  return `E280 ${hex.slice(0, 4)} ${hex.slice(4, 8)}`
}

/** Idempotently fill the RFID/movement fields for legacy or JSON-seeded units. */
export function normalizeTrolley(unit: TrolleyUnit, now: number): TrolleyUnit {
  const next: TrolleyUnit = { ...unit }
  if (!next.rfidEpc) next.rfidEpc = epcFromCode(unit.code)
  if (!next.movements) next.movements = []
  if (!next.lastSeenStation) next.lastSeenStation = unit.station
  if (typeof next.lastSeenAt !== 'number') {
    // in-transit units are "seen" at checkout; others fall back to updatedAt
    next.lastSeenAt = unit.updatedAt ?? now
  }
  return next
}

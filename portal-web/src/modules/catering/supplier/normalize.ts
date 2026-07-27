import type { FlightIdentity } from './types'

export function parseProjectDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function parseIsoDate(value: string): string | null {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null
  return trimmed
}

export function parseDatasetDate(value: string): string | null {
  return parseProjectDate(value) ?? parseIsoDate(value)
}

export function normalizeOperatingDate(value: string): string {
  const trimmed = value.trim()
  return parseProjectDate(trimmed) ?? trimmed
}

export function normalizeFlightNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '')
  const match = /^([A-Z]{2})(\d+)$/.exec(compact)
  if (!match) return compact
  return `${match[1]}${Number(match[2])}`
}

export function normalizeAirport(value: string): string {
  return value.trim().toUpperCase()
}

export function normalizeFlightIdentity(identity: FlightIdentity): FlightIdentity {
  return {
    operatingDate: normalizeOperatingDate(identity.operatingDate),
    flightNo: normalizeFlightNumber(identity.flightNo),
    dep: normalizeAirport(identity.dep),
    arr: normalizeAirport(identity.arr),
  }
}

export function createFlightJoinKey(identity: FlightIdentity): string {
  const normalized = normalizeFlightIdentity(identity)
  return [
    normalized.operatingDate,
    normalized.flightNo,
    normalized.dep,
    normalized.arr,
  ].join('|')
}

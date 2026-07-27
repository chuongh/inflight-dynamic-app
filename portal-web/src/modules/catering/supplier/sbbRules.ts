import { normalizeAirport } from './normalize'
import type { SbbRouteSheet } from './types'

const INDIA_AIRPORTS = new Set(['AMD', 'BLR', 'BOM', 'COK', 'DEL', 'HYD'])
const AUSTRALIA_KAZ_AIRPORTS = new Set([
  'ADL',
  'ALA',
  'BNE',
  'MEL',
  'NQZ',
  'PER',
  'SYD',
])

export function selectSbbRouteSheet(
  dep: string,
  arr: string,
  mealType: 'standard' | 'vegetarian' = 'standard',
): SbbRouteSheet {
  if (mealType === 'vegetarian') return 'CHAY(VIỆT-HÀN-NHẬT)'
  const airports = [normalizeAirport(dep), normalizeAirport(arr)]
  if (airports.some((airport) => INDIA_AIRPORTS.has(airport))) return 'ẤN'
  if (airports.some((airport) => AUSTRALIA_KAZ_AIRPORTS.has(airport))) return 'ÚC&KAZ'
  return 'VIET-HAN-NHAT'
}

export function isDateWithinRange(
  operatingDate: string,
  effectiveFrom: string,
  effectiveTo: string,
): boolean {
  return operatingDate >= effectiveFrom && operatingDate <= effectiveTo
}

export function isOutboundAustraliaKazakhstan(dep: string, arr: string): boolean {
  const normalizedDep = normalizeAirport(dep)
  const normalizedArr = normalizeAirport(arr)
  return (
    !AUSTRALIA_KAZ_AIRPORTS.has(normalizedDep) &&
    AUSTRALIA_KAZ_AIRPORTS.has(normalizedArr)
  )
}

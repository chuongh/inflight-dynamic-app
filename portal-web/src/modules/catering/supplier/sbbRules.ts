import { normalizeAirport } from './normalize'
import type { SbbRouteSheet, SbbSheetRouteBinding } from './types'

/** Default STD/ARR bindings — same sets previously hardcoded in selectSbbRouteSheet. */
export const DEFAULT_SBB_SHEET_BINDINGS: Partial<
  Record<SbbRouteSheet, SbbSheetRouteBinding>
> = {
  ẤN: {
    airports: ['AMD', 'BLR', 'BOM', 'COK', 'DEL', 'HYD'],
    priority: 10,
    note: 'DEP hoặc ARR thuộc Ấn Độ → sheet ẤN',
  },
  'ÚC&KAZ': {
    airports: ['ADL', 'ALA', 'BNE', 'MEL', 'NQZ', 'PER', 'SYD'],
    priority: 20,
    note: 'DEP hoặc ARR thuộc Úc / KAZ → sheet ÚC&KAZ',
  },
  'VIET-HAN-NHAT': {
    airports: [],
    priority: 100,
    note: 'Fallback khi không khớp Ấn / Úc&KAZ (và không phải meal chay)',
  },
  'CHAY(VIỆT-HÀN-NHẬT)': {
    airports: [],
    priority: 0,
    note: 'Chọn theo mealType = vegetarian, không theo STD/ARR',
  },
}

function bindingAirports(
  bindings: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>>,
  sheet: SbbRouteSheet,
): Set<string> {
  const fromConfig = bindings[sheet]?.airports
  const fallback = DEFAULT_SBB_SHEET_BINDINGS[sheet]?.airports ?? []
  return new Set((fromConfig ?? fallback).map(normalizeAirport))
}

function matchesBinding(
  binding: SbbSheetRouteBinding | undefined,
  dep: string,
  arr: string,
): boolean {
  if (!binding) return false
  const depN = normalizeAirport(dep)
  const arrN = normalizeAirport(arr)
  const airports = new Set((binding.airports ?? []).map(normalizeAirport))
  if (airports.size > 0 && (airports.has(depN) || airports.has(arrN))) {
    return true
  }
  const pair = `${depN}-${arrN}`
  const rev = `${arrN}-${depN}`
  return (binding.routePairs ?? []).some((p) => p === pair || p === rev)
}

/**
 * Pick SBB lookup sheet from STD/ARR (+ meal type) using configurable bindings.
 */
export function selectSbbRouteSheet(
  dep: string,
  arr: string,
  mealType: 'standard' | 'vegetarian' = 'standard',
  bindings: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> = DEFAULT_SBB_SHEET_BINDINGS,
): SbbRouteSheet {
  if (mealType === 'vegetarian') return 'CHAY(VIỆT-HÀN-NHẬT)'

  const merged: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> = {
    ...DEFAULT_SBB_SHEET_BINDINGS,
    ...bindings,
  }

  const candidates: Array<{ sheet: SbbRouteSheet; priority: number }> = []
  for (const sheet of ['ẤN', 'ÚC&KAZ'] as SbbRouteSheet[]) {
    if (matchesBinding(merged[sheet], dep, arr)) {
      candidates.push({
        sheet,
        priority: merged[sheet]?.priority ?? 50,
      })
    }
  }
  candidates.sort((a, b) => a.priority - b.priority)
  if (candidates.length > 0) return candidates[0].sheet
  return 'VIET-HAN-NHAT'
}

export function isDateWithinRange(
  operatingDate: string,
  effectiveFrom: string,
  effectiveTo: string,
): boolean {
  return operatingDate >= effectiveFrom && operatingDate <= effectiveTo
}

export function isOutboundAustraliaKazakhstan(
  dep: string,
  arr: string,
  bindings: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> = DEFAULT_SBB_SHEET_BINDINGS,
): boolean {
  const airports = bindingAirports(bindings, 'ÚC&KAZ')
  const normalizedDep = normalizeAirport(dep)
  const normalizedArr = normalizeAirport(arr)
  return !airports.has(normalizedDep) && airports.has(normalizedArr)
}

/** Resolve effective bindings (config overlay on defaults). */
export function resolveSbbSheetBindings(
  bindings?: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> | null,
): Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> {
  return { ...DEFAULT_SBB_SHEET_BINDINGS, ...(bindings ?? {}) }
}

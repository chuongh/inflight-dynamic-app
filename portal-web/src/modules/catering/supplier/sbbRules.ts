import { DEFAULT_ROUTE_GROUPS } from './amenityDefaults'
import { normalizeAirport } from './normalize'
import type { SupplierRouteGroup } from './ecoQuantityTypes'
import type {
  SbbLookupDataset,
  SbbLookupSheetDef,
  SbbRouteSheet,
  SbbSheetRouteBinding,
} from './types'

/** Default dynamic sheet defs — tabs are driven from this list. */
export const DEFAULT_SBB_SHEET_DEFS: SbbLookupSheetDef[] = [
  {
    id: 'ẤN',
    label: 'Ấn',
    routeGroupIds: ['IN'],
    priority: 10,
  },
  {
    id: 'ÚC&KAZ',
    label: 'Úc & KAZ',
    routeGroupIds: ['AU', 'KAZ'],
    priority: 20,
  },
  {
    id: 'SGN-PQC',
    label: 'SGN–PQC',
    routeGroupIds: [],
    routePairs: ['SGN-PQC'],
    priority: 30,
  },
  {
    id: 'VIET-HAN-NHAT',
    label: 'Việt · Hàn · Nhật',
    routeGroupIds: ['KR_JP'],
    priority: 50,
    fallback: true,
  },
  {
    id: 'CHAY(VIỆT-HÀN-NHẬT)',
    label: 'Chay',
    routeGroupIds: [],
    vegetarian: true,
    priority: 0,
  },
]

/** @deprecated Prefer DEFAULT_SBB_SHEET_DEFS — kept for older call sites. */
export const DEFAULT_SBB_SHEET_BINDINGS: Partial<
  Record<SbbRouteSheet, SbbSheetRouteBinding>
> = Object.fromEntries(
  DEFAULT_SBB_SHEET_DEFS.map((d) => [
    d.id,
    {
      routeGroupIds: d.routeGroupIds,
      routePairs: d.routePairs,
      priority: d.priority,
      note: d.vegetarian
        ? 'Chọn theo mealType = vegetarian'
        : d.fallback
          ? 'Fallback + route groups'
          : d.routePairs?.length
            ? `Route pairs: ${d.routePairs.join(', ')}`
            : `Route groups: ${d.routeGroupIds.join(', ')}`,
    } satisfies SbbSheetRouteBinding,
  ]),
)

function effectiveRouteGroups(routeGroups: SupplierRouteGroup[]): SupplierRouteGroup[] {
  return routeGroups.length > 0 ? routeGroups : DEFAULT_ROUTE_GROUPS
}

/** Merge sheetDefs + legacy sheetBindings into a single editable list. */
export function resolveSbbSheetDefs(
  dataset?: Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'> | null,
): SbbLookupSheetDef[] {
  if (dataset?.sheetDefs && dataset.sheetDefs.length > 0) {
    return dataset.sheetDefs.map((d) => ({ ...d }))
  }
  const bindings = dataset?.sheetBindings
  if (bindings && Object.keys(bindings).length > 0) {
    return DEFAULT_SBB_SHEET_DEFS.map((def) => {
      const b = bindings[def.id]
      if (!b) return { ...def }
      // Explicit airports-only override clears default route groups.
      const routeGroupIds =
        b.routeGroupIds ??
        (b.airports && b.airports.length > 0 ? [] : def.routeGroupIds)
      return {
        ...def,
        routeGroupIds,
        routePairs: b.routePairs ?? def.routePairs,
        priority: b.priority ?? def.priority,
      }
    })
  }
  return DEFAULT_SBB_SHEET_DEFS.map((d) => ({ ...d }))
}

export function resolveSheetAirports(
  def: Pick<SbbLookupSheetDef, 'routeGroupIds'> | SbbSheetRouteBinding | undefined,
  routeGroups: SupplierRouteGroup[] = [],
  legacyAirports: string[] = [],
): string[] {
  if (!def) return []
  const groups = effectiveRouteGroups(routeGroups)
  const routeGroupIds =
    'routeGroupIds' in def && def.routeGroupIds ? def.routeGroupIds : []
  const fromGroups = routeGroupIds.flatMap((id) => {
    const group = groups.find((g) => g.id === id)
    return group?.airports ?? []
  })
  const fromBinding =
    'airports' in def && Array.isArray(def.airports) ? def.airports : legacyAirports
  return [...new Set([...fromGroups, ...fromBinding].map(normalizeAirport).filter(Boolean))]
}

function matchesDef(
  def: SbbLookupSheetDef,
  dep: string,
  arr: string,
  routeGroups: SupplierRouteGroup[],
  legacyAirports: string[] = [],
  legacyPairs: string[] = [],
): boolean {
  const depN = normalizeAirport(dep)
  const arrN = normalizeAirport(arr)
  const airports = new Set(resolveSheetAirports(def, routeGroups, legacyAirports))
  if (airports.size > 0 && (airports.has(depN) || airports.has(arrN))) {
    return true
  }
  const pair = `${depN}-${arrN}`
  const rev = `${arrN}-${depN}`
  const pairs = [...(def.routePairs ?? []), ...legacyPairs]
  return pairs.some((p) => {
    const n = p.trim().toUpperCase()
    return n === pair || n === rev
  })
}

/**
 * Pick SBB lookup sheet from STD/ARR (+ meal type) using dynamic sheet defs
 * and live route-group airport lists.
 */
export function selectSbbRouteSheet(
  dep: string,
  arr: string,
  mealType: 'standard' | 'vegetarian' = 'standard',
  bindingsOrDataset:
    | Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>>
    | Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'>
    | null
    | undefined = undefined,
  routeGroups: SupplierRouteGroup[] = [],
): SbbRouteSheet {
  const dataset: Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'> =
    bindingsOrDataset &&
    (Array.isArray((bindingsOrDataset as SbbLookupDataset).sheetDefs) ||
      'sheetBindings' in (bindingsOrDataset as object) ||
      'sheetDefs' in (bindingsOrDataset as object))
      ? (bindingsOrDataset as Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'>)
      : { sheetBindings: bindingsOrDataset as Partial<Record<string, SbbSheetRouteBinding>> }

  const defs = resolveSbbSheetDefs(dataset)
  const groups = effectiveRouteGroups(routeGroups)
  const legacy = dataset.sheetBindings ?? {}

  if (mealType === 'vegetarian') {
    const veg = defs.find((d) => d.vegetarian)
    if (veg) return veg.id
  }

  const candidates: Array<{ sheet: SbbRouteSheet; priority: number }> = []
  for (const def of defs) {
    if (def.vegetarian) continue
    if (matchesDef(
      def,
      dep,
      arr,
      groups,
      legacy[def.id]?.airports ?? [],
      legacy[def.id]?.routePairs ?? [],
    )) {
      candidates.push({ sheet: def.id, priority: def.priority ?? 50 })
    }
  }
  candidates.sort((a, b) => a.priority - b.priority)
  if (candidates.length > 0) return candidates[0].sheet

  const fallback = defs.find((d) => d.fallback && !d.vegetarian)
  return fallback?.id ?? 'VIET-HAN-NHAT'
}

export function isDateWithinRange(
  operatingDate: string,
  effectiveFrom: string,
  effectiveTo: string,
): boolean {
  return operatingDate >= effectiveFrom && operatingDate <= effectiveTo
}

/** True when sheet covers AU or KAZ route groups (amenity uplift rules). */
export function sheetCoversAustraliaKazakhstan(
  sheetId: SbbRouteSheet,
  dataset?: Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'> | null,
): boolean {
  const def = resolveSbbSheetDefs(dataset).find((d) => d.id === sheetId)
  if (!def) return sheetId === 'ÚC&KAZ'
  return def.routeGroupIds.some((id) => id === 'AU' || id === 'KAZ')
}

export function isOutboundAustraliaKazakhstan(
  dep: string,
  arr: string,
  bindingsOrDataset:
    | Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>>
    | Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'>
    | null
    | undefined = undefined,
  routeGroups: SupplierRouteGroup[] = [],
): boolean {
  const dataset: Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'> =
    bindingsOrDataset &&
    (Array.isArray((bindingsOrDataset as SbbLookupDataset).sheetDefs) ||
      'sheetBindings' in (bindingsOrDataset as object) ||
      'sheetDefs' in (bindingsOrDataset as object))
      ? (bindingsOrDataset as Pick<SbbLookupDataset, 'sheetDefs' | 'sheetBindings'>)
      : { sheetBindings: bindingsOrDataset as Partial<Record<string, SbbSheetRouteBinding>> }

  const defs = resolveSbbSheetDefs(dataset)
  const aukaz = defs.find((d) => d.routeGroupIds.some((id) => id === 'AU' || id === 'KAZ'))
  if (!aukaz) return false
  const airports = new Set(
    resolveSheetAirports(aukaz, routeGroups, dataset.sheetBindings?.[aukaz.id]?.airports ?? []),
  )
  const normalizedDep = normalizeAirport(dep)
  const normalizedArr = normalizeAirport(arr)
  return !airports.has(normalizedDep) && airports.has(normalizedArr)
}

/** @deprecated Prefer resolveSbbSheetDefs. */
export function resolveSbbSheetBindings(
  bindings?: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> | null,
): Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> {
  return { ...DEFAULT_SBB_SHEET_BINDINGS, ...(bindings ?? {}) }
}

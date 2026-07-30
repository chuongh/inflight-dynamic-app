import { normalizeAirport } from './normalize'
import { DEFAULT_ECO_AMENITY_CONFIG } from './amenityDefaults'
import { DEFAULT_AMENITY_PACKAGE_COMPOSITIONS } from './amenityQuantityDefaults'
import type {
  AircraftFamily,
  AmenityPackageDef,
  AmenityResolveInput,
  AmenityResolveResult,
  EcoAmenityConfig,
  EcoUpliftType,
  RouteHourClassId,
} from './ecoQuantityTypes'

/** Package 2 = A321 khứ hồi ngắn (DOM ≤ 1h15) — odd-sector last-leg top-up. */
export const SHORT_ROUND_TRIP_PACKAGE_ID = 2

const ODD_SECTOR_COUNTS = new Set([1, 3, 5])

function normalizeUplift(raw: string | null | undefined): EcoUpliftType | null {
  if (!raw) return null
  if (raw === 'DAU_NGAY' || raw === 'DOI_TO' || raw === 'NIGHTSTOP') return raw
  const u = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (u.includes('DAU') || u.includes('START')) return 'DAU_NGAY'
  if (u.includes('DOI') || u.includes('CHANGE')) return 'DOI_TO'
  if (u.includes('NIGHT')) return 'NIGHTSTOP'
  return null
}

export function resolveAircraftFamily(
  aircraftType: string | null | undefined,
): AircraftFamily | null {
  if (!aircraftType) return null
  const t = aircraftType.toUpperCase().replace(/\s+/g, '')
  if (t.includes('A330')) return 'A330'
  if (t.includes('A321')) return 'A321'
  return null
}

/** Build undirected round-trip key matching LIST sheet, e.g. SGN-DPS-SGN */
export function roundTripRouteKey(dep: string, arr: string): string {
  const a = normalizeAirport(dep)
  const b = normalizeAirport(arr)
  return `${a}-${b}-${a}`
}

export function lookupHourClass(
  config: EcoAmenityConfig,
  dep: string,
  arr: string,
): RouteHourClassId | null {
  const key = roundTripRouteKey(dep, arr)
  const reverse = roundTripRouteKey(arr, dep)
  for (const cls of config.routeHourClasses) {
    if (cls.routes.includes(key) || cls.routes.includes(reverse)) return cls.id
  }
  // Also match one-way against LIST mid airport: SGN-DPS from SGN-DPS-SGN
  const depN = normalizeAirport(dep)
  const arrN = normalizeAirport(arr)
  for (const cls of config.routeHourClasses) {
    for (const route of cls.routes) {
      const parts = route.split('-')
      if (parts.length !== 3) continue
      if (
        (parts[0] === depN && parts[1] === arrN) ||
        (parts[0] === arrN && parts[1] === depN)
      ) {
        return cls.id
      }
    }
  }
  return null
}

function touchesRouteGroup(
  config: EcoAmenityConfig,
  groupId: string,
  dep: string,
  arr: string,
): boolean {
  const group = config.routeGroups.find((g) => g.id === groupId)
  if (!group) return false
  const airports = new Set(group.airports.map(normalizeAirport))
  return [normalizeAirport(dep), normalizeAirport(arr)].some((a) =>
    airports.has(a),
  )
}

function findPackage(
  packages: AmenityPackageDef[],
  family: AircraftFamily,
  kind: AmenityPackageDef['kind'],
  hourClassId?: RouteHourClassId | null,
): AmenityPackageDef | null {
  return (
    packages.find((p) => {
      if (p.aircraftFamily !== family || p.kind !== kind) return false
      if (kind === 'route_hour') {
        if (family === 'A330') {
          // A330: pack 11 = any DOM; pack 12 = any INT hour class
          if (hourClassId === 'DOM_LE_1H15' || hourClassId === 'DOM_GT_1H15') {
            return p.id === 11
          }
          if (hourClassId === 'INT_LT_4H' || hourClassId === 'INT_GE_4H') {
            return p.id === 12
          }
          return false
        }
        return p.hourClassId === hourClassId
      }
      return true
    }) ?? null
  )
}

function resolveRoutePackage(
  config: EcoAmenityConfig,
  family: AircraftFamily,
  input: AmenityResolveInput,
  hourClassId: RouteHourClassId | null,
): AmenityPackageDef | null {
  const { packages } = config
  const kind = input.flightKind ?? 'normal'
  const uplift = normalizeUplift(input.upliftType)

  // Priority: ferry / nightstop / charter overrides before LIST + airport groups
  if (kind === 'ferry_cargo') {
    return findPackage(packages, family, 'ferry_cargo')
  }
  if (uplift === 'NIGHTSTOP') {
    return findPackage(packages, family, 'nightstop')
  }
  if (kind === 'charter_china') {
    return findPackage(packages, family, 'charter_china')
  }
  if (touchesRouteGroup(config, 'AU', input.dep, input.arr)) {
    const au = findPackage(packages, family, 'australia')
    if (au) return au
    // A321 has no dedicated Australia package — use QT >=4h (gói 5)
    if (family === 'A321') {
      return findPackage(packages, family, 'route_hour', 'INT_GE_4H')
    }
  }
  if (touchesRouteGroup(config, 'KAZ', input.dep, input.arr)) {
    const kaz = findPackage(packages, family, 'kazakhstan')
    if (kaz) return kaz
  }
  if (touchesRouteGroup(config, 'RU', input.dep, input.arr)) {
    const ru = findPackage(packages, family, 'russia')
    if (ru) return ru
  }
  if (hourClassId) {
    return findPackage(packages, family, 'route_hour', hourClassId)
  }
  return null
}

function parseOverride(label: string): number[] {
  return label
    .split('+')
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/**
 * Select Amenity package(s) from A/C + flight + LIST / route groups.
 * ĐẦU NGÀY → aircraft package + route package (e.g. 10+15).
 * ĐỔI TỔ → route package only.
 */
export function resolveAmenityPackages(
  input: AmenityResolveInput,
  config: EcoAmenityConfig = DEFAULT_ECO_AMENITY_CONFIG,
): AmenityResolveResult {
  if (input.amenityOverride?.trim()) {
    const ids = parseOverride(input.amenityOverride)
    return {
      packageIds: ids,
      label: input.amenityOverride.trim(),
      aircraftPackageId: ids.length > 1 ? ids[0] : null,
      routePackageId: ids.length > 1 ? ids[1] : ids[0] ?? null,
      hourClassId: lookupHourClass(config, input.dep, input.arr),
      source: 'Amenity override',
    }
  }

  const family = resolveAircraftFamily(input.aircraftType)
  if (!family) {
    return {
      packageIds: [],
      label: null,
      aircraftPackageId: null,
      routePackageId: null,
      hourClassId: null,
      source: 'Aircraft type required for Amenity',
    }
  }

  const hourClassId = lookupHourClass(config, input.dep, input.arr)
  const uplift = normalizeUplift(input.upliftType)
  const routePkg = resolveRoutePackage(config, family, input, hourClassId)
  const aircraftPkg = findPackage(config.packages, family, 'aircraft_day_start')

  if (!routePkg) {
    return {
      packageIds: [],
      label: null,
      aircraftPackageId: aircraftPkg?.id ?? null,
      routePackageId: null,
      hourClassId,
      source: 'No matching Amenity route package',
    }
  }

  const includeAircraft =
    uplift === 'DAU_NGAY' && aircraftPkg != null && aircraftPkg.id !== routePkg.id

  const packageIds = includeAircraft
    ? [aircraftPkg.id, routePkg.id]
    : [routePkg.id]
  const label = packageIds.join('+')

  return {
    packageIds,
    label,
    aircraftPackageId: includeAircraft ? aircraftPkg.id : null,
    routePackageId: routePkg.id,
    hourClassId,
    source: `Amenity ${family}; ${uplift ?? 'unknown uplift'}; LIST/route groups`,
  }
}

export function formatAmenityLabel(packageIds: number[]): string | null {
  if (packageIds.length === 0) return null
  return packageIds.join('+')
}

/**
 * When a flight group has 1/3/5 sectors, the last leg also loads one extra
 * "khứ hồi ngắn" bag (package 2). Duplicates are intentional so composition sums twice.
 */
export function appendOddSectorShortRoundTripPackage(
  packageIds: number[],
  sectorCount: number,
  isLastLegOfGroup: boolean,
): number[] {
  if (!isLastLegOfGroup || !ODD_SECTOR_COUNTS.has(sectorCount)) {
    return packageIds
  }
  return [...packageIds, SHORT_ROUND_TRIP_PACKAGE_ID]
}

/**
 * Sum fixed product quantities across selected amenity packages.
 * Duplicate packageIds are summed again (used by odd-sector short round-trip extra).
 * String / periodic top-up items are excluded — see DEFAULT_PERIODIC_TOPUP_ITEMS.
 */
export function resolveAmenityComposition(
  packageIds: number[],
): Array<{ productCode: string; quantity: number }> {
  const totals = new Map<string, number>()
  for (const packageId of packageIds) {
    const composition = DEFAULT_AMENITY_PACKAGE_COMPOSITIONS.find(
      (c) => c.packageId === packageId,
    )
    if (!composition) continue
    for (const item of composition.items) {
      if (typeof item.quantity !== 'number') continue
      totals.set(
        item.productCode,
        (totals.get(item.productCode) ?? 0) + item.quantity,
      )
    }
  }
  return [...totals.entries()]
    .filter(([, quantity]) => quantity > 0)
    .map(([productCode, quantity]) => ({ productCode, quantity }))
    .sort((a, b) => a.productCode.localeCompare(b.productCode))
}

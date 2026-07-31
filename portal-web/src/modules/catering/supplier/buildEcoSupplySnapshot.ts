/**
 * Build order-level ECO supply lines (catalog-backed) from confirmed flight groups.
 */
import { activeCatalogVersion } from '../catalog'
import type {
  AmenityCatalogDataset,
  AmenityCatalogItem,
  MealCatalogDataset,
  MealCatalogItem,
} from '../catalogTypes'
import type { CrewMealProfile } from '../crewMealTypes'
import { groupOrigin } from '../grouping'
import type { DayGrouping } from '../groupingTypes'
import { computeGroupCrewMeals } from '../groupCrewMeal'
import type {
  EcoSupplyFlightBreakdown,
  EcoSupplyFlightLeg,
  EcoSupplyLine,
} from '../orderTypes'
import { DEFAULT_ECO_AMENITY_CONFIG } from './amenityDefaults'
import { buildEcoSupplierRow } from './ecoBuilder'
import {
  DEFAULT_ECO_QUANTITY_RULES,
  migrateEcoQuantityRules,
} from './ecoQuantityEval'
import type { EcoQuantityConfig } from './ecoQuantityTypes'
import {
  ALWAYS_MANUAL_FIELDS,
  ECO_QUANTITY_TARGET_COLUMNS,
  ECO_SUPPLY_FIELDS,
  ECO_SUPPLY_GROUP_ORDER,
  type EcoSupplyFieldKey,
  type EcoSupplyGroupId,
} from './ecoSupplyRegistry'
import { flightGroupsToSupplierInputs } from './fromFlightGroup'

export interface BuildEcoSupplyArgs {
  day: DayGrouping
  station: string
  mealCatalog: MealCatalogDataset | null | undefined
  amenityCatalog: AmenityCatalogDataset | null | undefined
  ecoRouteRules: unknown
  quantityConfig?: EcoQuantityConfig | null
  /** Active cockpit crew-meal profile; omit/null to skip crew line. */
  crewMealProfile?: CrewMealProfile | null
}

export interface EcoSupplySnapshot {
  lines: EcoSupplyLine[]
  byFlight: EcoSupplyFlightBreakdown[]
}

/**
 * Which cabin catalog(s) an item belongs to. Items shared across cabins
 * (e.g. Bánh mì tròn & bơ, Yogurt, Muối tiêu) carry both — Order Details
 * shows them under each cabin's section, matching the Meal Catalog pages.
 */
function mealCabinScopes(item: MealCatalogItem): Array<'ECO' | 'SBB'> {
  return item.cabinScopes.filter((s): s is 'ECO' | 'SBB' => s === 'ECO' || s === 'SBB')
}

function lookupCatalog(
  def: {
    productCode: string | null
    catalogItemId?: string | null
    catalog: 'meal' | 'amenity' | 'none'
    /** Overrides the linked catalog item's own cabinScopes — see EcoSupplyFieldDef. */
    cabinScopeOverride?: Array<'ECO' | 'SBB'>
  },
  meals: MealCatalogItem[],
  amenities: AmenityCatalogItem[],
): {
  catalogItemId: string | null
  name: string
  unit: string | null
  productCode: string | null
  group: EcoSupplyGroupId | null
  /** ECO/SBB catalog(s) this item belongs to; empty for amenity items (cross-cabin). */
  cabinScopes: Array<'ECO' | 'SBB'>
} {
  const { productCode, catalogItemId, catalog, cabinScopeOverride } = def
  if (catalog === 'none') {
    return { catalogItemId: null, name: '', unit: null, productCode, group: null, cabinScopes: [] }
  }

  const mealFirst = catalog === 'meal'
  const pools = mealFirst ? [meals, amenities] : [amenities, meals]

  if (catalogItemId) {
    for (let i = 0; i < pools.length; i++) {
      const hit = pools[i].find((item) => item.id === catalogItemId && item.active !== false)
      if (!hit) continue
      const fromMeal = mealFirst ? i === 0 : i === 1
      return {
        catalogItemId: hit.id,
        name: hit.name.vi,
        unit: hit.unit,
        productCode: hit.productCode ?? productCode,
        group: fromMeal && 'category' in hit ? (hit as MealCatalogItem).category : 'amenity',
        cabinScopes: cabinScopeOverride ?? (fromMeal ? mealCabinScopes(hit as MealCatalogItem) : []),
      }
    }
  }

  if (productCode) {
    for (let i = 0; i < pools.length; i++) {
      const hit = pools[i].find((item) => item.productCode === productCode && item.active !== false)
      if (!hit) continue
      const fromMeal = mealFirst ? i === 0 : i === 1
      return {
        catalogItemId: hit.id,
        name: hit.name.vi,
        unit: hit.unit,
        productCode: hit.productCode,
        group: fromMeal && 'category' in hit ? (hit as MealCatalogItem).category : 'amenity',
        cabinScopes: cabinScopeOverride ?? (fromMeal ? mealCabinScopes(hit as MealCatalogItem) : []),
      }
    }
  }

  return { catalogItemId: null, name: '', unit: null, productCode, group: null, cabinScopes: [] }
}

function flightCellsFromRow(
  row: ReturnType<typeof buildEcoSupplierRow>,
): Record<string, number> {
  const cells: Record<string, number> = {}
  for (const def of ECO_SUPPLY_FIELDS) {
    const value = row.cells[def.field]?.value
    if (value == null || !Number.isFinite(value) || value === 0) continue
    cells[def.field] = Math.round(value)
  }
  return cells
}

export function buildEcoSupplySnapshot(args: BuildEcoSupplyArgs): EcoSupplySnapshot {
  const {
    day,
    station,
    mealCatalog,
    amenityCatalog,
    ecoRouteRules,
    quantityConfig,
    crewMealProfile,
  } = args
  const { inputs } = flightGroupsToSupplierInputs(day, station)
  if (inputs.length === 0) return { lines: [], byFlight: [] }

  const meals = activeCatalogVersion(mealCatalog?.versions ?? [])?.items ?? []
  const amenities = activeCatalogVersion(amenityCatalog?.versions ?? [])?.items ?? []
  const quantityRules = migrateEcoQuantityRules(
    quantityConfig?.quantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
  )
  const alwaysManual = new Set<string>(ALWAYS_MANUAL_FIELDS)
  const ruleTargetColumns = new Set<string>(ECO_QUANTITY_TARGET_COLUMNS)

  const totals = new Map<
    EcoSupplyFieldKey,
    { qty: number; sources: string[]; def: (typeof ECO_SUPPLY_FIELDS)[number] }
  >()

  const packageTotals = new Map<number, number>()
  const amenityConfigForPackages = quantityConfig?.amenity ?? DEFAULT_ECO_AMENITY_CONFIG
  const packageDefsEarly = new Map(amenityConfigForPackages.packages.map((p) => [p.id, p]))
  const packageLabel = (packageId: number): string => {
    const def = packageDefsEarly.get(packageId)
    const idLabel = String(packageId).padStart(2, '0')
    return def ? `Gói ${idLabel} · ${def.label}` : `Gói ${idLabel}`
  }

  /** Legs of the same confirmed FlightGroup merge into one by-flight card. */
  interface GroupBucket {
    legs: EcoSupplyFlightLeg[]
    cells: Record<string, number>
    quotaCommercial: number
    quotaBanhMi: number
    quotaTraSua: number
    packageCounts: Map<number, number>
  }
  const dynamicTotals = new Map<string, { qty: number; sources: string[] }>()
  const groupBuckets = new Map<string, GroupBucket>()

  for (const input of inputs) {
    const row = buildEcoSupplierRow(
      {
        ...input,
        quotaCommercial: input.quotaCommercial ?? null,
        quotaBanhMi: input.quotaBanhMi ?? null,
        quotaTraSua: input.quotaTraSua ?? null,
        totalPrebook: input.totalPrebook ?? null,
        skybossEco: input.skybossEco ?? null,
        boiledEggs: input.boiledEggs ?? null,
        reserveUtensils: input.reserveUtensils ?? null,
        hotmealItems: input.hotmealItems ?? {},
      },
      ecoRouteRules,
      quantityConfig,
    )

    const groupId = input.groupId ?? row.flightNo
    const bucket: GroupBucket = groupBuckets.get(groupId) ?? {
      legs: [],
      cells: {},
      quotaCommercial: 0,
      quotaBanhMi: 0,
      quotaTraSua: 0,
      packageCounts: new Map(),
    }
    bucket.legs.push({ flightNo: row.flightNo, dep: row.dep, arr: row.arr })
    for (const [field, qty] of Object.entries(flightCellsFromRow(row))) {
      bucket.cells[field] = (bucket.cells[field] ?? 0) + qty
    }
    for (const [field, cell] of Object.entries(row.dynamicCells)) {
      const value = cell.value
      if (value == null || !Number.isFinite(value) || value === 0) continue
      bucket.cells[field] = (bucket.cells[field] ?? 0) + Math.round(value)
      const previous = dynamicTotals.get(field)
      if (previous) {
        previous.qty += value
        if (cell.source && !previous.sources.includes(cell.source)) previous.sources.push(cell.source)
      } else {
        dynamicTotals.set(field, { qty: value, sources: cell.source ? [cell.source] : [] })
      }
    }
    bucket.quotaCommercial += input.quotaCommercial ?? 0
    bucket.quotaBanhMi += input.quotaBanhMi ?? 0
    bucket.quotaTraSua += input.quotaTraSua ?? 0
    for (const packageId of row.amenityPackageIds) {
      bucket.packageCounts.set(packageId, (bucket.packageCounts.get(packageId) ?? 0) + 1)
    }
    groupBuckets.set(groupId, bucket)

    for (const def of ECO_SUPPLY_FIELDS) {
      const cell = row.cells[def.field]
      const value = cell?.value
      if (value == null || !Number.isFinite(value) || value === 0) continue
      const prev = totals.get(def.field)
      if (prev) {
        prev.qty += value
        if (cell.source && !prev.sources.includes(cell.source)) {
          prev.sources.push(cell.source)
        }
      } else {
        totals.set(def.field, {
          qty: value,
          sources: cell.source ? [cell.source] : [],
          def,
        })
      }
    }

    // TODO: odd-sector short round-trip needs sectorCount/isLastLeg on FlightLeg
    for (const packageId of row.amenityPackageIds) {
      packageTotals.set(packageId, (packageTotals.get(packageId) ?? 0) + 1)
    }
  }

  const byFlight: EcoSupplyFlightBreakdown[] = [...groupBuckets].map(([groupId, bucket]) => ({
    groupId,
    legs: bucket.legs,
    cells: bucket.cells,
    quotaCommercial: bucket.quotaCommercial,
    quotaBanhMi: bucket.quotaBanhMi,
    quotaTraSua: bucket.quotaTraSua,
    amenityPackages: [...bucket.packageCounts].map(([id, count]) => ({
      id,
      label: packageLabel(id),
      count,
    })),
  }))

  const packageDefs = packageDefsEarly

  const lines: EcoSupplyLine[] = []
  for (const def of ECO_SUPPLY_FIELDS) {
    const rule = quantityRules.find((r) => r.targetColumn === def.field)
    const noRuleConfigured =
      !rule && ruleTargetColumns.has(def.field) && !alwaysManual.has(def.field)
    const confirmed = rule ? rule.confirmed !== false : undefined
    const agg = totals.get(def.field)
    // Always emit unconfirmed / no-rule / always-manual lines (even at qty 0) —
    // manual fields have no formula, so ops need the row visible to enter a value at all.
    if (
      !agg &&
      !def.includeZero &&
      !noRuleConfigured &&
      confirmed !== false &&
      !alwaysManual.has(def.field)
    ) {
      continue
    }
    const cat = lookupCatalog(def, meals, amenities)
    const qty = Math.round(agg?.qty ?? 0)
    lines.push({
      id: `eco-${def.field}`,
      field: def.field,
      group:
        def.group === 'other' || def.group === 'commercial'
          ? def.group
          : (cat.group ?? def.group),
      catalogItemId: cat.catalogItemId,
      productCode: cat.productCode ?? def.productCode,
      name: cat.name || def.fallbackNameVi,
      unit: cat.unit,
      suggested: qty,
      qty,
      source:
        agg?.sources[0] ??
        (def.includeZero || noRuleConfigured || alwaysManual.has(def.field)
          ? 'Manual/operational input'
          : 'ECO rules'),
      overridden: false,
      cabinScopes: cat.cabinScopes,
      ...(confirmed === undefined ? {} : { confirmed }),
      ...(noRuleConfigured ? { noRuleConfigured: true } : {}),
    })
  }

  for (const [field, total] of dynamicTotals) {
    const catalogItemId = field.slice('catalog:'.length)
    const meal = meals.find((item) => item.id === catalogItemId && item.active !== false)
    const amenity = amenities.find((item) => item.id === catalogItemId && item.active !== false)
    const item = meal ?? amenity
    if (!item) continue
    lines.push({
      id: `eco-${field}`,
      field,
      group: meal ? meal.category : 'amenity',
      catalogItemId: item.id,
      productCode: item.productCode,
      name: item.name.vi,
      unit: item.unit,
      suggested: Math.round(total.qty),
      qty: Math.round(total.qty),
      source: total.sources[0] ?? 'ECO rules',
      overridden: false,
      cabinScopes: meal ? mealCabinScopes(meal) : [],
    })
  }

  for (const [packageId, count] of packageTotals) {
    if (!Number.isFinite(count) || count <= 0) continue
    const def = packageDefs.get(packageId)
    const idLabel = String(packageId).padStart(2, '0')
    lines.push({
      id: `amenity-package-${packageId}`,
      field: `amenityPackage${packageId}`,
      group: 'amenity_composition',
      catalogItemId: null,
      productCode: null,
      name: def ? `Gói ${idLabel} · ${def.label}` : `Gói ${idLabel}`,
      unit: 'gói',
      suggested: count,
      qty: count,
      source: 'Amenity package selection',
      overridden: false,
    })
  }

  // Crew meals are per rotation (FlightGroup), not per leg — same filter as supplier inputs.
  if (crewMealProfile) {
    let crewTotal = 0
    for (const group of day.groups) {
      if (groupOrigin(group) !== station || !group.confirmed) continue
      crewTotal += computeGroupCrewMeals(group, crewMealProfile).meals
    }
    lines.push({
      id: 'eco-crewCockpit',
      field: 'crewCockpit',
      group: 'other',
      catalogItemId: null,
      productCode: null,
      name: 'Suất ăn tổ bay',
      unit: null,
      suggested: crewTotal,
      qty: crewTotal,
      source: 'computeGroupCrewMeals (BRule-04/26-29)',
      overridden: false,
    })
  }

  const rank = (g: EcoSupplyGroupId) => {
    const i = ECO_SUPPLY_GROUP_ORDER.indexOf(g)
    return i < 0 ? 999 : i
  }
  return {
    lines: lines.sort((a, b) => rank(a.group) - rank(b.group) || a.name.localeCompare(b.name, 'vi')),
    byFlight,
  }
}

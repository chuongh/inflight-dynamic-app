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
import type { DayGrouping } from '../groupingTypes'
import type { EcoSupplyLine } from '../orderTypes'
import { DEFAULT_AMENITY_PRODUCTS } from './amenityQuantityDefaults'
import { resolveAmenityComposition } from './amenityResolver'
import { buildEcoSupplierRow } from './ecoBuilder'
import type { EcoQuantityConfig } from './ecoQuantityTypes'
import {
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
}

function lookupCatalog(
  def: {
    productCode: string | null
    catalogItemId?: string | null
    catalog: 'meal' | 'amenity' | 'none'
  },
  meals: MealCatalogItem[],
  amenities: AmenityCatalogItem[],
): {
  catalogItemId: string | null
  name: string
  unit: string | null
  productCode: string | null
  group: EcoSupplyGroupId | null
} {
  const { productCode, catalogItemId, catalog } = def
  if (catalog === 'none') {
    return { catalogItemId: null, name: '', unit: null, productCode, group: null }
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
      }
    }
  }

  return { catalogItemId: null, name: '', unit: null, productCode, group: null }
}

export function buildEcoSupplySnapshot(args: BuildEcoSupplyArgs): EcoSupplyLine[] {
  const { day, station, mealCatalog, amenityCatalog, ecoRouteRules, quantityConfig } = args
  const { inputs } = flightGroupsToSupplierInputs(day, station)
  if (inputs.length === 0) return []

  const meals = activeCatalogVersion(mealCatalog?.versions ?? [])?.items ?? []
  const amenities = activeCatalogVersion(amenityCatalog?.versions ?? [])?.items ?? []

  const totals = new Map<
    EcoSupplyFieldKey,
    { qty: number; sources: string[]; def: (typeof ECO_SUPPLY_FIELDS)[number] }
  >()

  const amenityTotals = new Map<string, number>()

  for (const input of inputs) {
    const row = buildEcoSupplierRow(
      {
        ...input,
        quotaCommercial: input.quotaCommercial ?? null,
        totalPrebook: input.totalPrebook ?? null,
        skybossEco: input.skybossEco ?? null,
        boiledEggs: input.boiledEggs ?? null,
        reserveUtensils: input.reserveUtensils ?? null,
        hotmealItems: input.hotmealItems ?? {},
      },
      ecoRouteRules,
      quantityConfig,
    )

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
    const composition = resolveAmenityComposition(row.amenityPackageIds)
    for (const item of composition) {
      amenityTotals.set(
        item.productCode,
        (amenityTotals.get(item.productCode) ?? 0) + item.quantity,
      )
    }
  }

  const productByCode = new Map(DEFAULT_AMENITY_PRODUCTS.map((p) => [p.code, p]))

  const lines: EcoSupplyLine[] = []
  for (const def of ECO_SUPPLY_FIELDS) {
    const agg = totals.get(def.field)
    if (!agg && !def.includeZero) continue
    const cat = lookupCatalog(def, meals, amenities)
    const qty = Math.round(agg?.qty ?? 0)
    lines.push({
      id: `eco-${def.field}`,
      field: def.field,
      group: cat.group ?? def.group,
      catalogItemId: cat.catalogItemId,
      productCode: cat.productCode ?? def.productCode,
      name: cat.name || def.fallbackNameVi,
      unit: cat.unit,
      suggested: qty,
      qty,
      source: agg?.sources[0] ?? (def.includeZero ? 'Manual/operational input' : 'ECO rules'),
      overridden: false,
    })
  }

  for (const [productCode, rawQty] of amenityTotals) {
    if (!Number.isFinite(rawQty) || rawQty <= 0) continue
    const qty = Math.round(rawQty)
    const master = productByCode.get(productCode)
    const cat = lookupCatalog(
      { productCode, catalogItemId: null, catalog: 'amenity' },
      meals,
      amenities,
    )
    lines.push({
      id: `amenity-${productCode}`,
      field: productCode,
      group: 'amenity_composition',
      catalogItemId: cat.catalogItemId,
      productCode,
      name: cat.name || master?.name || productCode,
      unit: cat.unit ?? master?.unit ?? null,
      suggested: qty,
      qty,
      source: 'Amenity package composition',
      overridden: false,
    })
  }

  const rank = (g: EcoSupplyGroupId) => {
    const i = ECO_SUPPLY_GROUP_ORDER.indexOf(g)
    return i < 0 ? 999 : i
  }
  return lines.sort((a, b) => rank(a.group) - rank(b.group) || a.name.localeCompare(b.name, 'vi'))
}

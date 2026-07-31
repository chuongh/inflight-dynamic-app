/**
 * Maps SkyBoss Business lookup columns → meal / amenity catalog SKUs.
 * Column headers in config UI resolve names/codes from the live catalog.
 */
import type { AmenityCatalogItem, MealCatalogItem } from '../catalogTypes'
import type { SbbLookupItem, SbbRouteSheet } from './types'

export interface SbbLookupItemDef {
  item: SbbLookupItem
  catalog: 'meal' | 'amenity' | 'none'
  /** Default catalog item id (meal or amenity). */
  catalogItemId: string | null
  fallbackNameVi: string
  /** Per-sheet catalog override when the same logical column maps to different SKUs. */
  bySheet?: Partial<Record<SbbRouteSheet, { catalogItemId: string }>>
}

export const SBB_LOOKUP_ITEM_DEFS: readonly SbbLookupItemDef[] = [
  {
    item: 'bread',
    catalog: 'meal',
    catalogItemId: 'sku-sbb12',
    fallbackNameVi: 'Bánh mì',
    bySheet: { ẤN: { catalogItemId: 'sku-sbb9' } },
  },
  {
    item: 'basa',
    catalog: 'meal',
    catalogItemId: 'sku-sbb23',
    fallbackNameVi: 'Cá Basa',
  },
  {
    item: 'pho',
    catalog: 'meal',
    catalogItemId: 'sku-sbb7',
    fallbackNameVi: 'Phở bò',
  },
  {
    item: 'bunBo',
    catalog: 'meal',
    catalogItemId: 'sku-sbb37',
    fallbackNameVi: 'Bún bò Huế',
  },
  {
    item: 'stickyRice',
    catalog: 'meal',
    catalogItemId: 'sku-sbb11',
    fallbackNameVi: 'Xôi mặn',
  },
  {
    item: 'chickenGravy',
    catalog: 'meal',
    catalogItemId: 'sku-sbb24',
    fallbackNameVi: 'Gà Gravy',
    bySheet: { ẤN: { catalogItemId: 'sku-sbb41' } },
  },
  {
    item: 'blanket',
    catalog: 'amenity',
    catalogItemId: 'amn-chan-sbb-bh-4h',
    fallbackNameVi: 'Chăn SBB',
  },
]

export const SBB_LOOKUP_ITEMS: SbbLookupItem[] = SBB_LOOKUP_ITEM_DEFS.map((d) => d.item)

export function sbbLookupItemDef(item: SbbLookupItem): SbbLookupItemDef | undefined {
  return SBB_LOOKUP_ITEM_DEFS.find((d) => d.item === item)
}

export function sbbLookupCatalogItemId(
  item: SbbLookupItem,
  sheet?: SbbRouteSheet,
): string | null {
  const def = sbbLookupItemDef(item)
  if (!def) return null
  if (sheet && def.bySheet?.[sheet]?.catalogItemId) {
    return def.bySheet[sheet]!.catalogItemId
  }
  return def.catalogItemId
}

export function sbbLookupDisplay(
  item: SbbLookupItem,
  sheet: SbbRouteSheet,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[] = [],
): { name: string; productCode: string | null } {
  const def = sbbLookupItemDef(item)
  const catalogItemId = sbbLookupCatalogItemId(item, sheet)
  if (catalogItemId) {
    const hit =
      mealCatalog.find((i) => i.id === catalogItemId) ??
      amenityCatalog.find((i) => i.id === catalogItemId)
    if (hit) {
      return { name: hit.name.vi, productCode: hit.productCode }
    }
  }
  return { name: def?.fallbackNameVi ?? item, productCode: null }
}

import { describe, expect, it } from 'vitest'
import amenityCatalogJson from '@/mock-data/catering/catalog/amenity-item-catalog.json'
import mealCatalogJson from '@/mock-data/catering/catalog/meal-item-catalog.json'
import { ECO_QUANTITY_TARGET_COLUMNS, ECO_SUPPLY_FIELDS } from './ecoSupplyRegistry'

type CatalogItem = {
  id: string
  productCode?: string | null
  name?: { vi?: string }
  category?: string
}

function catalogItems(raw: {
  versions: Array<{ items: CatalogItem[] }>
}): CatalogItem[] {
  return raw.versions.flatMap((v) => v.items)
}

const mealItems = catalogItems(mealCatalogJson as { versions: Array<{ items: CatalogItem[] }> })
const amenityItems = catalogItems(
  amenityCatalogJson as { versions: Array<{ items: CatalogItem[] }> },
)
const allItems = [...mealItems, ...amenityItems]

const productCodes = new Set(
  allItems.map((i) => i.productCode).filter((c): c is string => Boolean(c)),
)
const itemIds = new Set(allItems.map((i) => i.id))

describe('ECO_SUPPLY_FIELDS ↔ catalog master data', () => {
  it('every non-null productCode exists in meal or amenity catalog', () => {
    const orphans = ECO_SUPPLY_FIELDS.filter(
      (f) => f.productCode != null && !productCodes.has(f.productCode),
    ).map((f) => `${f.field}:${f.productCode}`)

    expect(orphans, `orphan productCodes: ${orphans.join(', ')}`).toEqual([])
  })

  it('every catalogItemId resolves in meal or amenity catalog', () => {
    const orphans = ECO_SUPPLY_FIELDS.filter(
      (f) => f.catalogItemId != null && f.catalogItemId !== '' && !itemIds.has(f.catalogItemId),
    ).map((f) => `${f.field}:${f.catalogItemId}`)

    expect(orphans, `orphan catalogItemIds: ${orphans.join(', ')}`).toEqual([])
  })

  it('fields linked to a catalog have catalogItemId (primary identity)', () => {
    const missing = ECO_SUPPLY_FIELDS.filter(
      (f) => f.catalog !== 'none' && !f.catalogItemId,
    ).map((f) => f.field)

    expect(missing, `missing catalogItemId: ${missing.join(', ')}`).toEqual([])
  })

  it('every quantity-rule target column resolves via catalogItemId', () => {
    const missing = ECO_QUANTITY_TARGET_COLUMNS.filter((field) => {
      const def = ECO_SUPPLY_FIELDS.find((f) => f.field === field)
      return !def?.catalogItemId || !itemIds.has(def.catalogItemId)
    })
    expect(missing, `quantity targets without catalog: ${missing.join(', ')}`).toEqual([])
  })

  it('bread ECO field points at sku-40000294 (Bánh mì)', () => {
    const bread = ECO_SUPPLY_FIELDS.find((f) => f.field === 'bread')
    expect(bread?.productCode).toBe('40000294')
    expect(bread?.catalogItemId).toBe('sku-40000294')
    const item = mealItems.find((i) => i.id === 'sku-40000294')
    expect(item?.name?.vi).toBe('Bánh mì')
    expect(item?.productCode).toBe('40000294')
    expect(item?.category).toBe('bread')
  })

  it('prebook metric points at meal-prebook-total master item', () => {
    const prebook = ECO_SUPPLY_FIELDS.find((f) => f.field === 'prebook')
    expect(prebook?.catalogItemId).toBe('meal-prebook-total')
    expect(mealItems.some((i) => i.id === 'meal-prebook-total')).toBe(true)
  })
})

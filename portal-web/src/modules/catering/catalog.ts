/**
 * Pure helpers for catering catalogs (meal / combo / amenity).
 */
import type {
  AmenityCatalogDataset,
  ComboCatalogDataset,
  MealCatalogDataset,
  MealCatalogItem,
  ComboCatalogItem,
} from './catalogTypes'
import type { VersionStatus } from './types'

type AnyVersion = { id: string; version: number; status: VersionStatus; effectiveTo?: string }

export function activeCatalogVersion<T extends AnyVersion>(versions: T[]): T | null {
  if (versions.length === 0) return null
  return (
    versions.find((v) => v.status === 'active') ??
    [...versions].sort((a, b) => b.version - a.version)[0]
  )
}

export function catalogVersionsNewestFirst<T extends AnyVersion>(versions: T[]): T[] {
  return [...versions].sort((a, b) => b.version - a.version)
}

/** Update items on the active catalog version in place (no new version). */
export function replaceActiveCatalogItems<T extends AnyVersion & { items: unknown }>(
  versions: T[],
  items: T['items'],
  patch?: { updatedBy?: string; updatedAt?: string },
): T[] {
  const active = activeCatalogVersion(versions)
  if (!active) return versions
  return versions.map((v) => (v.id === active.id ? { ...v, items, ...patch } : v))
}

/** Legacy MealCatalog shape for order prebook product-code lookup. */
export function toLegacyMealCatalog(
  meals: MealCatalogItem[] | undefined,
  combos: ComboCatalogItem[] | undefined,
): { meals: Array<{ name: string; description: string; productCodes: string[] }> } {
  const rows: Array<{ name: string; description: string; productCodes: string[] }> = []
  for (const m of meals ?? []) {
    if (!m.active || !m.productCode) continue
    rows.push({ name: m.name.vi, description: '', productCodes: [m.productCode] })
  }
  for (const c of combos ?? []) {
    if (!c.active || !c.productCode) continue
    rows.push({ name: c.name.vi, description: c.description, productCodes: [c.productCode] })
  }
  return { meals: rows }
}

export type { MealCatalogDataset, ComboCatalogDataset, AmenityCatalogDataset }

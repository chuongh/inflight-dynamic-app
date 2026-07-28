/**
 * Pure helpers for versioned catering catalogs (meal / combo / amenity).
 */
import type {
  AmenityCatalogDataset,
  AmenityCatalogItem,
  AmenityCatalogVersion,
  ComboCatalogDataset,
  ComboCatalogItem,
  ComboCatalogVersion,
  MealCatalogDataset,
  MealCatalogItem,
  MealCatalogVersion,
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

function nextVersionNumber(versions: { version: number }[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1
}

function publishMeta(
  versions: AnyVersion[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
) {
  const num = nextVersionNumber(versions)
  const newStatus: VersionStatus = meta.startsInFuture ? 'scheduled' : 'active'
  const updated = versions.map((v) =>
    v.status === 'active' && !meta.startsInFuture
      ? { ...v, status: 'superseded' as VersionStatus, effectiveTo: meta.effectiveFrom }
      : v,
  )
  return { num, newStatus, updated }
}

export function withNewMealCatalogVersion(
  versions: MealCatalogVersion[],
  items: MealCatalogItem[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): MealCatalogVersion[] {
  const { num, newStatus, updated } = publishMeta(versions, meta)
  const created: MealCatalogVersion = {
    id: `m${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    items,
  }
  return [created, ...updated]
}

export function withNewComboCatalogVersion(
  versions: ComboCatalogVersion[],
  items: ComboCatalogItem[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): ComboCatalogVersion[] {
  const { num, newStatus, updated } = publishMeta(versions, meta)
  const created: ComboCatalogVersion = {
    id: `c${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    items,
  }
  return [created, ...updated]
}

export function withNewAmenityCatalogVersion(
  versions: AmenityCatalogVersion[],
  items: AmenityCatalogItem[],
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): AmenityCatalogVersion[] {
  const { num, newStatus, updated } = publishMeta(versions, meta)
  const created: AmenityCatalogVersion = {
    id: `a${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    items,
  }
  return [created, ...updated]
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

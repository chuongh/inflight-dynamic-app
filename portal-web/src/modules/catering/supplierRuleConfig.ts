/**
 * Supplier rule configuration — pure domain helpers (version selection,
 * publish). No React / no I/O.
 */
import type {
  EcoRouteRuleDataset,
  SbbLookupDataset,
} from './supplier/types'
import type {
  SupplierRuleConfigDataset,
  SupplierRuleConfigVersion,
} from './supplierRuleConfigTypes'
import type { VersionStatus } from './types'

export function activeSupplierRuleVersion(
  versions: SupplierRuleConfigVersion[],
): SupplierRuleConfigVersion | null {
  if (versions.length === 0) return null
  return (
    versions.find((v) => v.status === 'active') ??
    [...versions].sort((a, b) => b.version - a.version)[0]
  )
}

export function supplierRuleVersionsNewestFirst(
  versions: SupplierRuleConfigVersion[],
): SupplierRuleConfigVersion[] {
  return [...versions].sort((a, b) => b.version - a.version)
}

export function nextSupplierRuleVersionNumber(
  versions: SupplierRuleConfigVersion[],
): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1
}

export function withNewSupplierRuleVersion(
  versions: SupplierRuleConfigVersion[],
  payload: {
    ecoRouteRules: EcoRouteRuleDataset
    sbbLookups: SbbLookupDataset
  },
  meta: {
    effectiveFrom: string
    updatedBy: string
    updatedAt: string
    note?: string
    startsInFuture: boolean
  },
): SupplierRuleConfigVersion[] {
  const num = nextSupplierRuleVersionNumber(versions)
  const newStatus: VersionStatus = meta.startsInFuture ? 'scheduled' : 'active'

  const updated = versions.map((v) =>
    v.status === 'active' && !meta.startsInFuture
      ? { ...v, status: 'superseded' as VersionStatus, effectiveTo: meta.effectiveFrom }
      : v,
  )

  const created: SupplierRuleConfigVersion = {
    id: `s${num}`,
    version: num,
    status: newStatus,
    effectiveFrom: meta.effectiveFrom,
    updatedBy: meta.updatedBy,
    updatedAt: meta.updatedAt,
    note: meta.note,
    ecoRouteRules: payload.ecoRouteRules,
    sbbLookups: payload.sbbLookups,
  }

  return [created, ...updated]
}

export type { SupplierRuleConfigDataset, SupplierRuleConfigVersion }

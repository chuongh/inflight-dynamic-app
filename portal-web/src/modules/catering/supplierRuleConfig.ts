/**
 * Supplier rule configuration — pure domain helpers (version selection,
 * publish). No React / no I/O.
 */
import type {
  EcoRouteRuleDataset,
  SbbLookupDataset,
} from './supplier/types'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
} from './supplier/ecoQuantityTypes'
import type {
  SupplierRuleConfigDataset,
  SupplierRuleConfigVersion,
} from './supplierRuleConfigTypes'
import type { VersionStatus } from './types'

function dmyToNumber(dmy: string): number | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy)
  if (!match) return null
  const [, day, month, year] = match
  const value = Number(`${year}${month}${day}`)
  return Number.isFinite(value) ? value : null
}

function todayDmy(): string {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

export function activeSupplierRuleVersion(
  versions: SupplierRuleConfigVersion[],
  effectiveOn = todayDmy(),
): SupplierRuleConfigVersion | null {
  if (versions.length === 0) return null
  const date = dmyToNumber(effectiveOn)
  if (date != null) {
    const effective = versions
      .filter((version) => {
        const from = dmyToNumber(version.effectiveFrom)
        const to = version.effectiveTo ? dmyToNumber(version.effectiveTo) : null
        return from != null && from <= date && (to == null || date <= to)
      })
      .sort((a, b) => b.version - a.version)
    if (effective.length > 0) return effective[0]
  }
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
    ecoAmenity?: EcoAmenityConfig
    ecoQuantityRules?: EcoQuantityRule[]
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
    ecoAmenity: payload.ecoAmenity,
    ecoQuantityRules: payload.ecoQuantityRules,
  }

  return [created, ...updated]
}

export type { SupplierRuleConfigDataset, SupplierRuleConfigVersion }

/**
 * Versioned ECO route rules + SBB lookup tables used by Order Detail
 * supplier review. Same lifecycle as commercial rule-config versions.
 */
import type { EcoRouteRuleDataset, SbbLookupDataset } from './supplier/types'
import type { VersionStatus } from './types'

export interface SupplierRuleConfigVersion {
  /** Display id, e.g. "s1". */
  id: string
  version: number
  status: VersionStatus
  /** Effective-from date, DD/MM/YYYY. */
  effectiveFrom: string
  /** Effective-to date, DD/MM/YYYY — set once superseded. */
  effectiveTo?: string
  updatedBy: string
  updatedAt: string
  note?: string
  ecoRouteRules: EcoRouteRuleDataset
  sbbLookups: SbbLookupDataset
}

export interface SupplierRuleConfigDataset {
  versions: SupplierRuleConfigVersion[]
}

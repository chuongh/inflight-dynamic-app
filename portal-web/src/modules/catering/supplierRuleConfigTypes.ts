/**
 * Versioned ECO route rules + SBB lookup tables used by Order Detail
 * supplier review. Same lifecycle as commercial rule-config versions.
 */
import type { EcoRouteRuleDataset, SbbLookupDataset } from './supplier/types'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
} from './supplier/ecoQuantityTypes'
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
  /** Optional Amenity + LIST config (defaults applied when absent). */
  ecoAmenity?: EcoAmenityConfig
  /** Optional dynamic ECO quantity rules (defaults applied when absent). */
  ecoQuantityRules?: EcoQuantityRule[]
}

export interface SupplierRuleConfigDataset {
  versions: SupplierRuleConfigVersion[]
}

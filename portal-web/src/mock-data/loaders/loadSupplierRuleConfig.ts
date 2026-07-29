import type { SupplierRuleConfigDataset } from '../../modules/catering/supplierRuleConfigTypes'
import configJson from '../catering/supplier-rule-configs.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-supplier-rule-config-cache'
const SEED_VERSION_KEY = `${DEMO_STORAGE_KEY}-seed-version`
const SEED_VERSION = 6

function readCache(): SupplierRuleConfigDataset | null {
  try {
    if (Number(localStorage.getItem(SEED_VERSION_KEY)) !== SEED_VERSION) return null
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SupplierRuleConfigDataset
    return Array.isArray(parsed.versions) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(dataset: SupplierRuleConfigDataset) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(dataset))
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
}

export function getSupplierRuleConfigCache(): SupplierRuleConfigDataset {
  const cached = readCache()
  if (cached && cached.versions.length > 0) return cached
  const seeded = configJson as SupplierRuleConfigDataset
  writeCache(seeded)
  return seeded
}

export function saveSupplierRuleConfigCache(dataset: SupplierRuleConfigDataset) {
  writeCache(dataset)
}

export function resetSupplierRuleConfigCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
  localStorage.removeItem(SEED_VERSION_KEY)
}

import type { RuleConfigDataset } from '../../modules/catering/configTypes'
import configJson from '../catering/rule-configs.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-rule-config-cache'
const SEED_VERSION_KEY = `${DEMO_STORAGE_KEY}-seed-version`
/** Bump whenever the seed JSON shape/content changes so stale caches self-refresh. */
const SEED_VERSION = 2

function readCache(): RuleConfigDataset | null {
  try {
    // A cache seeded before the current SEED_VERSION is stale — force a reseed.
    if (Number(localStorage.getItem(SEED_VERSION_KEY)) !== SEED_VERSION) return null
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RuleConfigDataset
    return Array.isArray(parsed.versions) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(dataset: RuleConfigDataset) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(dataset))
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
}

export function getRuleConfigCache(): RuleConfigDataset {
  const cached = readCache()
  if (cached && cached.versions.length > 0) return cached
  const seeded = configJson as RuleConfigDataset
  writeCache(seeded)
  return seeded
}

export function saveRuleConfigCache(dataset: RuleConfigDataset) {
  writeCache(dataset)
}

export function resetRuleConfigCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

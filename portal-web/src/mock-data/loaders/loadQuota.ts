import type { QuotaDataset } from '../../modules/catering/types'
import quotaJson from '../catering/quota-versions.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-quota-cache'
const SEED_VERSION_KEY = `${DEMO_STORAGE_KEY}-seed-version`
/** Bump whenever the seed JSON shape/content changes so stale caches self-refresh. */
const SEED_VERSION = 2

function readCache(): QuotaDataset | null {
  try {
    if (Number(localStorage.getItem(SEED_VERSION_KEY)) !== SEED_VERSION) return null
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuotaDataset
    return Array.isArray(parsed.versions) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(dataset: QuotaDataset) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(dataset))
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
}

export function getQuotaCache(): QuotaDataset {
  const cached = readCache()
  if (cached && cached.versions.length > 0) return cached
  const seeded = quotaJson as QuotaDataset
  writeCache(seeded)
  return seeded
}

export function saveQuotaCache(dataset: QuotaDataset) {
  writeCache(dataset)
}

export function resetQuotaCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

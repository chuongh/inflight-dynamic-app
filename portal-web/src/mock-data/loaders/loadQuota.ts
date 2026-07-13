import type { QuotaDataset } from '../../modules/catering/types'
import quotaJson from '../catering/quota-versions.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-quota-cache'

function readCache(): QuotaDataset | null {
  try {
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

import type { CrewMealDataset } from '../../modules/catering/crewMealTypes'
import configJson from '../catering/crew-meal-configs.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-crew-meal-config-cache'
const SEED_VERSION_KEY = `${DEMO_STORAGE_KEY}-seed-version`
/** Bump whenever the seed JSON shape/content changes so stale caches self-refresh. */
const SEED_VERSION = 2

function readCache(): CrewMealDataset | null {
  try {
    if (Number(localStorage.getItem(SEED_VERSION_KEY)) !== SEED_VERSION) return null
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CrewMealDataset
    return Array.isArray(parsed.versions) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(dataset: CrewMealDataset) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(dataset))
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
}

export function getCrewMealConfigCache(): CrewMealDataset {
  const cached = readCache()
  if (cached && cached.versions.length > 0) return cached
  const seeded = configJson as CrewMealDataset
  writeCache(seeded)
  return seeded
}

export function saveCrewMealConfigCache(dataset: CrewMealDataset) {
  writeCache(dataset)
}

export function resetCrewMealConfigCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

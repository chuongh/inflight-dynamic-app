import type { Airport } from '../../modules/airports/types'
import airportsJson from '../airports/airports.json'

const DEMO_STORAGE_KEY = 'vj-mock-airports-cache'

function readCache(): Airport[] | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Airport[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(airports: Airport[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(airports))
}

export function getAirportsCache(): Airport[] {
  const cached = readCache()
  if (cached && cached.length > 0) return cached
  const seeded = airportsJson as Airport[]
  writeCache(seeded)
  return seeded
}

export function saveAirportsCache(airports: Airport[]) {
  writeCache(airports)
}

export function resetAirportsCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

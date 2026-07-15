import type { FlightGroupDataset } from '../../modules/catering/groupingTypes'
import flightGroupsJson from '../catering/flight-groups.json'

const DEMO_STORAGE_KEY = 'vj-mock-catering-flight-groups-cache'

function readCache(): FlightGroupDataset | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FlightGroupDataset
    return Array.isArray(parsed.days) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(dataset: FlightGroupDataset) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(dataset))
}

export function getFlightGroupCache(): FlightGroupDataset {
  const seeded = flightGroupsJson as FlightGroupDataset
  const cached = readCache()
  // Re-seed when the demo dataset changes (seedVersion mismatch) so new days appear.
  if (cached && cached.days.length > 0 && cached.seedVersion === seeded.seedVersion) return cached
  writeCache(seeded)
  return seeded
}

export function saveFlightGroupCache(dataset: FlightGroupDataset) {
  writeCache(dataset)
}

export function resetFlightGroupCache() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

/** The original seed (pre-grouping) — used to reset a day back to ungrouped. */
export function getSeedDataset(): FlightGroupDataset {
  return flightGroupsJson as FlightGroupDataset
}

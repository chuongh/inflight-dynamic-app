/**
 * Clear demo catering caches so seed JSON / new catalog rules take effect.
 * Call when intentionally reseeding the local mock environment.
 */
const CATERING_CACHE_KEYS = [
  'vj-mock-catering-orders',
  'vj-mock-catering-orders-seed',
  'vj-mock-catering-meal-catalog-cache',
  'vj-mock-catering-combo-catalog-cache',
  'vj-mock-catering-amenity-catalog-cache',
  'vj-mock-catering-supplier-rule-config-cache',
  'vj-mock-catering-supplier-rule-config-cache-seed-version',
  'vj-mock-catering-flight-groups-cache',
  'vj-mock-catering-crew-meal-config-cache',
  'vj-mock-catering-crew-meal-config-cache-seed-version',
  'vj-mock-catering-rule-config-cache',
  'vj-mock-catering-rule-config-cache-seed-version',
  'vj-mock-catering-quota-cache',
  'vj-mock-catering-quota-cache-seed-version',
] as const

/** Bump to force a one-time wipe of catering localStorage on next app load. */
export const CATERING_DEMO_RESET_VERSION = 8
const RESET_FLAG_KEY = 'vj-mock-catering-demo-reset-version'

export function clearCateringDemoCaches(): void {
  for (const key of CATERING_CACHE_KEYS) {
    localStorage.removeItem(key)
  }
}

/** Wipe stale catering demo data once per reset version, then reseed loaders normally. */
export function ensureCateringDemoReseed(): void {
  try {
    const current = Number(localStorage.getItem(RESET_FLAG_KEY) ?? 0)
    if (current === CATERING_DEMO_RESET_VERSION) return
    clearCateringDemoCaches()
    localStorage.setItem(RESET_FLAG_KEY, String(CATERING_DEMO_RESET_VERSION))
  } catch {
    // ignore (SSR / private mode)
  }
}

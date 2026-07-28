import type {
  AmenityCatalogDataset,
  ComboCatalogDataset,
  MealCatalogDataset,
} from '../../modules/catering/catalogTypes'
import amenityJson from '../catering/catalog/amenity-item-catalog.json'
import comboJson from '../catering/catalog/combo-catalog.json'
import mealJson from '../catering/catalog/meal-item-catalog.json'

const MEAL_KEY = 'vj-mock-catering-meal-catalog-cache'
const COMBO_KEY = 'vj-mock-catering-combo-catalog-cache'
const AMENITY_KEY = 'vj-mock-catering-amenity-catalog-cache'

function readCache<T extends { seedVersion?: string; versions: unknown[] }>(
  key: string,
  seeded: T,
): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as T
    if (
      Array.isArray(parsed.versions) &&
      parsed.versions.length > 0 &&
      parsed.seedVersion === seeded.seedVersion
    ) {
      return parsed
    }
    localStorage.setItem(key, JSON.stringify(seeded))
    return seeded
  } catch {
    return seeded
  }
}

function writeCache(key: string, dataset: unknown) {
  localStorage.setItem(key, JSON.stringify(dataset))
}

export function getMealCatalogDataset(): MealCatalogDataset {
  return readCache(MEAL_KEY, mealJson as MealCatalogDataset)
}

export function saveMealCatalogDataset(dataset: MealCatalogDataset) {
  writeCache(MEAL_KEY, dataset)
}

export function getComboCatalogDataset(): ComboCatalogDataset {
  return readCache(COMBO_KEY, comboJson as ComboCatalogDataset)
}

export function saveComboCatalogDataset(dataset: ComboCatalogDataset) {
  writeCache(COMBO_KEY, dataset)
}

export function getAmenityCatalogDataset(): AmenityCatalogDataset {
  return readCache(AMENITY_KEY, amenityJson as AmenityCatalogDataset)
}

export function saveAmenityCatalogDataset(dataset: AmenityCatalogDataset) {
  writeCache(AMENITY_KEY, dataset)
}

import type { TFunction } from 'i18next'
import type { MealItemCategory } from './catalogTypes'

export const MEAL_CATEGORIES: MealItemCategory[] = [
  'main',
  'vegetarian',
  'appetizer',
  'dessert',
  'bread',
  'drink',
  'snack',
  'condiment',
]

export const MEAL_CATEGORY_STYLE: Record<
  MealItemCategory,
  { bg: string; color: string; border: string }
> = {
  main: { bg: '#EDF9E0', color: '#4A7A00', border: '#B8E67A' },
  vegetarian: { bg: '#FFF4C4', color: '#C9A000', border: '#F0DC7A' },
  appetizer: { bg: '#FEEAE9', color: '#B91C1C', border: '#FECACA' },
  dessert: { bg: '#FCE7F3', color: '#BE185D', border: '#FBCFE8' },
  bread: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  drink: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  snack: { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },
  condiment: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
}

export type RuleCatalogCategory = MealItemCategory | 'amenity' | 'other'

/** Display order for quantity-rule category tabs (only show tabs with ≥1 rule). */
export const RULE_CATEGORY_TAB_ORDER: readonly RuleCatalogCategory[] = [
  'main',
  'vegetarian',
  'bread',
  'condiment',
  'dessert',
  'snack',
  'drink',
  'appetizer',
  'amenity',
  'other',
]

export const RULE_CATEGORY_STYLE: Record<
  RuleCatalogCategory,
  { bg: string; color: string; border: string }
> = {
  ...MEAL_CATEGORY_STYLE,
  amenity: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  other: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
}

export function mealCategoryLabel(cat: MealItemCategory, t: TFunction): string {
  return t(`catering.catalog.category.${cat}`)
}

export function ruleCategoryLabel(cat: RuleCatalogCategory, t: TFunction): string {
  if (cat === 'amenity') return t('catering.config.supplier.ruleCatAmenity')
  if (cat === 'other') return t('catering.config.supplier.ruleCatOther')
  return mealCategoryLabel(cat, t)
}

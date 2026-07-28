import type {
  AmenityCatalogItem,
  MealCatalogItem,
  MealItemCategory,
} from '@/modules/catering/catalogTypes'
import type { RuleCatalogCategory } from '@/modules/catering/mealCategoryMeta'
import { ECO_SUPPLY_FIELDS } from '@/modules/catering/supplier/ecoSupplyRegistry'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
  EcoQuantityValue,
  EcoQuantityWhen,
  EcoRuleBase,
  EcoUpliftType,
} from '@/modules/catering/supplier/ecoQuantityTypes'

/** Real product code for an EcoCells field key, or null when unmapped. */
export function productCodeFor(targetColumn: string): string | null {
  return ECO_SUPPLY_FIELDS.find((f) => f.field === targetColumn)?.productCode ?? null
}

export function supplyFieldDef(targetColumn: string) {
  return ECO_SUPPLY_FIELDS.find((f) => f.field === targetColumn)
}

/** Display name from meal/amenity catalog (never free-text rule.label). */
export function displayNameFor(
  targetColumn: string,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): string {
  const def = supplyFieldDef(targetColumn)
  if (def?.catalogItemId) {
    const byId =
      mealCatalog.find((i) => i.id === def.catalogItemId) ??
      amenityCatalog.find((i) => i.id === def.catalogItemId)
    if (byId?.name.vi) return byId.name.vi
  }
  const code = def?.productCode ?? null
  if (code) {
    const byCode =
      mealCatalog.find((i) => i.productCode === code) ??
      amenityCatalog.find((i) => i.productCode === code)
    if (byCode?.name.vi) return byCode.name.vi
  }
  if (def?.fallbackNameVi) return def.fallbackNameVi
  return targetColumn
}

/** Dropdown label: `"Tương cà — DC07"` when a product code exists. */
export function columnOptionLabel(
  targetColumn: string,
  mealCatalog: MealCatalogItem[] = [],
  amenityCatalog: AmenityCatalogItem[] = [],
): string {
  const name = displayNameFor(targetColumn, mealCatalog, amenityCatalog)
  const code = productCodeFor(targetColumn)
  return code ? `${name} — ${code}` : name
}

/** Badge text: product code, else first 2 chars of the field key (never Excel docRef). */
export function fieldBadge(targetColumn: string): string {
  return productCodeFor(targetColumn) ?? targetColumn.slice(0, 2).toUpperCase()
}

export function ruleCategoryOf(
  rule: EcoQuantityRule,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): RuleCatalogCategory {
  const def = supplyFieldDef(rule.targetColumn)
  if (!def || def.catalog === 'none') return 'other'
  if (def.catalog === 'amenity') return 'amenity'
  if (def.catalogItemId) {
    const item = mealCatalog.find((i) => i.id === def.catalogItemId)
    if (item) return item.category
  }
  const code = def.productCode
  if (code) {
    const item = mealCatalog.find((i) => i.productCode === code)
    if (item) return item.category
  }
  if (def.group !== 'amenity' && def.group !== 'amenity_composition' && def.group !== 'other') {
    return def.group as MealItemCategory
  }
  return 'other'
}

/** EcoCells keys commonly targeted by quantity rules. */
export const ECO_QUANTITY_TARGET_COLUMNS = [
  'ketchup',
  'chiliSauce',
  'soySauce',
  'hotmealUtensils',
  'indianSaltPepper',
  'reserveUtensils',
  'bread',
  'prebookCashews',
  'freshWater',
  'australiaNoodleVegetables',
  'skybossEggs',
  'australiaSkybossYogurt',
  'australiaRoundBread',
  'maccaSkybossRaisins',
  'maccaKazSalted',
  'charterSnack',
  'wine',
  'blanketCSkyboss',
  'blanket3in1Prebook',
  'maccaRegular',
  'mangoChiliSaltGdsDeluxe',
  'beerSnackComboBC',
  'sodaMaccaComboBD',
  'boiledEggs',
  'totalEggs',
  'reserveCrewWater',
  'smallIceBox',
  'largeIceBox',
  'wetIceKg',
  'dryIceKg',
  'dutyFree',
  'highlift',
  'smallTruck',
  'lastMinuteTopUp',
] as const

const METRIC_LABELS: Record<string, string> = {
  totalPrebook: 'Tổng prebook',
  quotaCommercial: 'Quota commercial',
  skybossEco: 'SkyBoss ECO',
  hotmeal_total: 'Tổng hotmeal',
}

const UPLIFT_LABELS: Record<EcoUpliftType, string> = {
  DAU_NGAY: 'Đầu ngày',
  DOI_TO: 'Đổi tổ',
  NIGHTSTOP: 'Nightstop',
}

const FLIGHT_KIND_LABELS: Record<string, string> = {
  ferry_cargo: 'Ferry/cargo',
  charter_china: 'Charter TQ',
  normal: 'Thường',
}

function metricLabel(id: string): string {
  return METRIC_LABELS[id] ?? id
}

function summarizeValueNatural(
  value: EcoQuantityValue | undefined,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): string {
  if (!value) return '—'
  switch (value.kind) {
    case 'const':
      return String(value.value)
    case 'metric': {
      const label = metricLabel(value.metricId)
      const coef = value.coef != null && value.coef !== 1 ? ` × ${value.coef}` : ''
      return `${label}${coef}`
    }
    case 'column': {
      const name = displayNameFor(value.columnId, mealCatalog, amenityCatalog)
      const coef = value.coef != null && value.coef !== 1 ? ` × ${value.coef}` : ''
      return `${name}${coef}`
    }
    case 'hotmeal_total': {
      const coef = value.coef != null && value.coef !== 1 ? ` × ${value.coef}` : ''
      return `Tổng hotmeal${coef}`
    }
    case 'sum':
      return value.parts
        .map((p) => summarizeValueNatural(p, mealCatalog, amenityCatalog))
        .join(' + ')
    case 'manual':
      return 'Nhập tay'
    default:
      return '—'
  }
}

function whenNatural(
  when: EcoQuantityWhen,
  amenityConfig: EcoAmenityConfig,
): string {
  const parts: string[] = []
  for (const id of when.routeGroups ?? []) {
    const label = amenityConfig.routeGroups.find((g) => g.id === id)?.label ?? id
    parts.push(`Nhóm ${label}`)
  }
  for (const id of when.hourClasses ?? []) {
    const label = amenityConfig.routeHourClasses.find((c) => c.id === id)?.label ?? id
    parts.push(label)
  }
  for (const fam of when.aircraftFamilies ?? []) {
    parts.push(fam === 'A330' ? 'A330' : 'A320/A321')
  }
  for (const u of when.upliftTypes ?? []) {
    parts.push(UPLIFT_LABELS[u] ?? u)
  }
  for (const k of when.flightKinds ?? []) {
    parts.push(FLIGHT_KIND_LABELS[k] ?? k)
  }
  for (const pair of when.routePairs ?? []) {
    parts.push(pair)
  }
  for (const pkg of when.amenityPackages ?? []) {
    const label = amenityConfig.packages.find((p) => p.id === pkg)?.label
    parts.push(label ? `Gói ${label}` : `Gói ${pkg}`)
  }
  return parts.length > 0 ? parts.join(', ') : 'Mọi trường hợp'
}

export function summarizeRule(
  rule: EcoQuantityRule,
  mealCatalog: MealCatalogItem[] = [],
  amenityCatalog: AmenityCatalogItem[] = [],
): string {
  if (rule.expr) {
    const src =
      rule.expr.source === 'hotmeal_total'
        ? 'Tổng hotmeal'
        : rule.expr.source === 'column'
          ? displayNameFor(rule.expr.id ?? 'column', mealCatalog, amenityCatalog)
          : metricLabel(rule.expr.id ?? 'metric')
    const body = `= ${src} × ${rule.expr.coef}`
    return rule.expr.round === 'ceil' ? `${body}, làm tròn lên` : body
  }
  if (rule.fallback?.kind === 'sum') {
    const sumText = summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)
    const branchCount = rule.branches?.length ?? 0
    return branchCount > 0
      ? `${branchCount} nhánh; trường hợp khác: = ${sumText}`
      : `= ${sumText}`
  }
  const branchCount = rule.branches?.length ?? 0
  if (branchCount === 0 && rule.fallback) {
    return `= ${summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)}`
  }
  return branchCount > 0
    ? `${branchCount} nhánh điều kiện`
    : 'Chưa có công thức'
}

/** Natural-language lines for by_std_arr branch preview. */
export function summarizeBranchesPreview(
  rule: EcoQuantityRule,
  amenityConfig: EcoAmenityConfig,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): string[] | null {
  if (!rule.branches?.length && !rule.fallback) return null
  const lines: string[] = []
  for (const branch of rule.branches ?? []) {
    const when = whenNatural(branch.when, amenityConfig)
    const value = summarizeValueNatural(branch.value, mealCatalog, amenityCatalog)
    lines.push(`${when}: = ${value}`)
  }
  if (rule.fallback) {
    lines.push(
      `Trường hợp khác: = ${summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)}`,
    )
  }
  return lines.length > 0 ? lines : null
}

export function newEcoQuantityRule(
  base: EcoRuleBase,
  targetColumn: string,
): EcoQuantityRule {
  const id = `ECO.custom.${targetColumn}.${Date.now().toString(36)}`
  if (base === 'by_std_arr') {
    return {
      id,
      base,
      targetColumn,
      enabled: true,
      branches: [],
      fallback: { kind: 'manual' },
    }
  }
  return {
    id,
    base,
    targetColumn,
    enabled: true,
    expr: {
      source: base === 'by_hotmeal_total' ? 'hotmeal_total' : 'column',
      id: base === 'by_item' ? 'spaghetti' : undefined,
      coef: 1,
      round: 'none',
    },
  }
}

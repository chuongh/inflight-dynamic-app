import type {
  AmenityCatalogItem,
  MealCatalogItem,
  MealItemCategory,
} from '@/modules/catering/catalogTypes'
import type { RuleCatalogCategory } from '@/modules/catering/mealCategoryMeta'
import { ECO_QUANTITY_TARGET_COLUMNS, ECO_SUPPLY_FIELDS } from '@/modules/catering/supplier/ecoSupplyRegistry'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
  EcoQuantityValue,
  EcoQuantityWhen,
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

export { ECO_QUANTITY_TARGET_COLUMNS }

const METRIC_LABELS: Record<string, string> = {
  totalPrebook: 'Tổng Prebook',
  quotaCommercial: 'Quota thương mại',
  skybossEco: 'Số khách SkyBoss',
  breadPrebook: 'Prebook Bánh mì',
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

export type ValueSourceGroup = {
  label: string
  options: Array<{ value: string; label: string }>
}

/** Grouped options for the unified "Tính theo" dropdown. */
export function buildValueSourceGroups(
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): ValueSourceGroup[] {
  return [
    {
      label: 'Số liệu chuyến bay',
      options: [
        { value: 'metric:quotaCommercial', label: 'Quota thương mại' },
        { value: 'metric:totalPrebook', label: 'Tổng Prebook' },
        { value: 'metric:breadPrebook', label: 'Prebook Bánh mì' },
        { value: 'metric:skybossEco', label: 'Số khách SkyBoss' },
        { value: 'hotmeal_total', label: 'Tổng suất ăn nóng' },
      ],
    },
    {
      label: 'Sản phẩm khác',
      options: ECO_QUANTITY_TARGET_COLUMNS.map((c) => ({
        value: `column:${c}`,
        label: displayNameFor(c, mealCatalog, amenityCatalog),
      })),
    },
  ]
}

export function encodeValueSource(value: EcoQuantityValue): string | null {
  switch (value.kind) {
    case 'metric':
      return `metric:${value.metricId}`
    case 'column':
      return `column:${value.columnId}`
    case 'hotmeal_total':
      return 'hotmeal_total'
    default:
      return null
  }
}

export function decodeValueSource(encoded: string, coef = 1): EcoQuantityValue {
  if (encoded === 'hotmeal_total') return { kind: 'hotmeal_total', coef }
  if (encoded.startsWith('metric:')) {
    return { kind: 'metric', metricId: encoded.slice('metric:'.length), coef }
  }
  if (encoded.startsWith('column:')) {
    return { kind: 'column', columnId: encoded.slice('column:'.length), coef }
  }
  return { kind: 'const', value: 0 }
}

export function sourceCoef(value: EcoQuantityValue): number {
  if (value.kind === 'metric' || value.kind === 'column' || value.kind === 'hotmeal_total') {
    return value.coef ?? 1
  }
  return 1
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
      return `Tổng suất ăn nóng${coef}`
    }
    case 'sum':
      return value.parts
        .map((p) => summarizeValueNatural(p, mealCatalog, amenityCatalog))
        .join(' + ')
    default:
      return '—'
  }
}

export function whenNatural(
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
    parts.push(fam === 'A330' ? 'A330' : 'A321')
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
  return parts.length > 0 ? parts.join(', ') : 'Tất cả'
}

/** Chip labels for active when-conditions (progressive disclosure UI). */
export function whenConditionChips(
  when: EcoQuantityWhen,
  amenityConfig: EcoAmenityConfig,
): Array<{ key: keyof EcoQuantityWhen; label: string }> {
  const chips: Array<{ key: keyof EcoQuantityWhen; label: string }> = []
  if (when.routeGroups?.length) {
    const labels = when.routeGroups.map(
      (id) => amenityConfig.routeGroups.find((g) => g.id === id)?.label ?? id,
    )
    chips.push({ key: 'routeGroups', label: `Nhóm: ${labels.join(', ')}` })
  }
  if (when.hourClasses?.length) {
    const labels = when.hourClasses.map(
      (id) => amenityConfig.routeHourClasses.find((c) => c.id === id)?.label ?? id,
    )
    chips.push({ key: 'hourClasses', label: `Giờ: ${labels.join(', ')}` })
  }
  if (when.aircraftFamilies?.length) {
    const labels = when.aircraftFamilies.map((f) => (f === 'A330' ? 'A330' : 'A321'))
    chips.push({ key: 'aircraftFamilies', label: `Tàu: ${labels.join(', ')}` })
  }
  if (when.upliftTypes?.length) {
    const labels = when.upliftTypes.map((u) => UPLIFT_LABELS[u] ?? u)
    chips.push({ key: 'upliftTypes', label: `Uplift: ${labels.join(', ')}` })
  }
  if (when.flightKinds?.length) {
    const labels = when.flightKinds.map((k) => FLIGHT_KIND_LABELS[k] ?? k)
    chips.push({ key: 'flightKinds', label: `Chuyến: ${labels.join(', ')}` })
  }
  if (when.routePairs?.length) {
    chips.push({ key: 'routePairs', label: `Route: ${when.routePairs.join(', ')}` })
  }
  return chips
}

export function summarizeRule(
  rule: EcoQuantityRule,
  mealCatalog: MealCatalogItem[] = [],
  amenityCatalog: AmenityCatalogItem[] = [],
): string {
  const roundSuffix = rule.round === 'ceil' ? ', làm tròn lên' : ''
  if (rule.branches.length === 0) {
    return `= ${summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)}${roundSuffix}`
  }
  if (rule.fallback.kind === 'sum') {
    const sumText = summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)
    return `${rule.branches.length} nhánh; còn lại: = ${sumText}${roundSuffix}`
  }
  return `${rule.branches.length} nhánh${roundSuffix}`
}

/** Natural-language lines for branch preview. */
export function summarizeBranchesPreview(
  rule: EcoQuantityRule,
  amenityConfig: EcoAmenityConfig,
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
): string[] | null {
  if (rule.branches.length === 0) return null
  const lines: string[] = []
  for (const branch of rule.branches) {
    const when = whenNatural(branch.when, amenityConfig)
    const value = summarizeValueNatural(branch.value, mealCatalog, amenityCatalog)
    lines.push(`${when}: = ${value}`)
  }
  lines.push(
    `Còn lại: = ${summarizeValueNatural(rule.fallback, mealCatalog, amenityCatalog)}`,
  )
  return lines
}

export function newEcoQuantityRule(targetColumn: string): EcoQuantityRule {
  return {
    id: `ECO.custom.${targetColumn}.${Date.now().toString(36)}`,
    targetColumn,
    enabled: true,
    confirmed: true,
    branches: [],
    fallback: { kind: 'const', value: 0 },
  }
}

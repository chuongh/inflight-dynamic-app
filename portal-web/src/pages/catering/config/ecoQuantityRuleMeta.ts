import type { TFunction } from 'i18next'
import type {
  AmenityCatalogItem,
  MealCatalogItem,
  MealItemCategory,
} from '@/modules/catering/catalogTypes'
import { ruleCategoryLabel, type RuleCatalogCategory } from '@/modules/catering/mealCategoryMeta'
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

const CATALOG_TARGET_PREFIX = 'catalog:'

function catalogItemIdForTarget(targetColumn: string): string | null {
  return targetColumn.startsWith(CATALOG_TARGET_PREFIX)
    ? targetColumn.slice(CATALOG_TARGET_PREFIX.length)
    : null
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
  const catalogItemId = catalogItemIdForTarget(targetColumn)
  if (catalogItemId) {
    return (
      mealCatalog.find((item) => item.id === catalogItemId)?.name.vi ??
      amenityCatalog.find((item) => item.id === catalogItemId)?.name.vi ??
      targetColumn
    )
  }
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
  const catalogItemId = catalogItemIdForTarget(rule.targetColumn)
  if (catalogItemId) {
    return mealCatalog.find((item) => item.id === catalogItemId)?.category ?? 'other'
  }
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

/** Configurable supplier fields that belong to one catalog category. */
export function targetColumnsForCategory(
  category: RuleCatalogCategory,
  mealCatalog: MealCatalogItem[],
): string[] {
  const registered = ECO_QUANTITY_TARGET_COLUMNS.filter((targetColumn) =>
    ruleCategoryOf(
      {
        id: `category.${targetColumn}`,
        targetColumn,
        enabled: true,
        branches: [],
        fallback: { kind: 'const', value: 0 },
      },
      mealCatalog,
    ) === category,
  )
  if (category === 'amenity' || category === 'other') return registered

  const registeredCatalogIds = new Set(
    registered
      .map((targetColumn) => supplyFieldDef(targetColumn)?.catalogItemId)
      .filter((id): id is string => !!id),
  )
  const extraCatalogItems = mealCatalog
    .filter(
      (item) =>
        item.active !== false &&
        item.category === category &&
        item.cabinScopes.includes('ECO') &&
        !registeredCatalogIds.has(item.id),
    )
    .map((item) => `${CATALOG_TARGET_PREFIX}${item.id}`)
  return [...registered, ...extraCatalogItems]
}

export { ECO_QUANTITY_TARGET_COLUMNS }

const METRIC_LABELS: Record<string, string> = {
  totalPrebook: 'Tổng Prebook',
  quotaCommercial: 'Quota thương mại',
  skybossEco: 'Số khách SkyBoss',
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

/** Category label for a supply-registry group, for the unlinked-legacy-field fallback. */
function groupLabelFor(group: string, t: TFunction): string {
  const normalized = group === 'amenity_composition' ? 'amenity' : group
  return ruleCategoryLabel(normalized as RuleCatalogCategory, t)
}

/** Catalog-first source options; values retain the linked ECO cell key for evaluation. */
function catalogColumnOptions(
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
  t: TFunction,
): Array<{ value: string; label: string }> {
  const byCatalogId = new Map(
    ECO_SUPPLY_FIELDS.filter((field) => field.catalogItemId).map((field) => [
      field.catalogItemId!,
      field.field,
    ]),
  )
  const byProductCode = new Map(
    ECO_SUPPLY_FIELDS.filter((field) => field.productCode).map((field) => [
      field.productCode!,
      field.field,
    ]),
  )
  const seen = new Set<string>()
  const options = [...mealCatalog, ...amenityCatalog]
    .filter((item) => item.active !== false)
    .flatMap((item) => {
      const field =
        byCatalogId.get(item.id) ??
        (item.productCode ? byProductCode.get(item.productCode) : undefined)
      if (!field || seen.has(field)) return []
      seen.add(field)
      // Amenity catalog items have no `category` of their own — fall back to
      // the supply-registry field's group (e.g. amenity/amenity_composition).
      const category =
        'category' in item
          ? ruleCategoryLabel((item as MealCatalogItem).category, t)
          : groupLabelFor('amenity', t)
      const name = item.productCode ? `${item.name.vi} · ${item.productCode}` : item.name.vi
      return [{
        value: `column:${field}`,
        label: `${name} · ${category}`,
      }]
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'))

  // Keep unlinked legacy fields editable when their catalog record is absent.
  for (const field of ECO_SUPPLY_FIELDS) {
    if (!seen.has(field.field)) {
      options.push({
        value: `column:${field.field}`,
        label: `${field.fallbackNameVi} · ${groupLabelFor(field.group, t)}`,
      })
    }
  }
  return options
}

/** Grouped options for the unified "Tính theo" dropdown. */
export function buildValueSourceGroups(
  mealCatalog: MealCatalogItem[],
  amenityCatalog: AmenityCatalogItem[],
  t: TFunction,
): ValueSourceGroup[] {
  return [
    {
      label: 'Số liệu chuyến bay',
      options: [
        { value: 'metric:quotaCommercial', label: 'Quota thương mại' },
        { value: 'metric:totalPrebook', label: 'Tổng Prebook' },
        { value: 'metric:skybossEco', label: 'Số khách SkyBoss' },
        { value: 'hotmeal_total', label: 'Tổng suất ăn nóng' },
      ],
    },
    {
      label: 'Sản phẩm khác',
      options: catalogColumnOptions(mealCatalog, amenityCatalog, t),
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
    const labels = when.aircraftFamilies.map((f) => (f === 'A330' ? 'A330' : 'A320/A321'))
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

const METRIC_IDS = new Set(['totalPrebook', 'quotaCommercial', 'skybossEco'])
const WHEN_KEYS: Array<keyof EcoQuantityWhen> = [
  'routeGroups',
  'routePairs',
  'aircraftFamilies',
  'upliftTypes',
  'hourClasses',
  'amenityPackages',
  'flightKinds',
]

function validateValue(value: EcoQuantityValue, path: string, errors: string[]): void {
  if (value.kind === 'const') {
    if (!Number.isFinite(value.value) || !Number.isInteger(value.value) || value.value < 0) {
      errors.push(`${path}: số lượng phải là số nguyên không âm`)
    }
    return
  }
  if (value.kind === 'sum') {
    if (value.parts.length === 0) errors.push(`${path}: tổng phải có ít nhất một nguồn`)
    value.parts.forEach((part, index) => validateValue(part, `${path}, nguồn ${index + 1}`, errors))
    return
  }
  const source = value.kind === 'metric' ? value.metricId : value.kind === 'column' ? value.columnId : null
  if (value.kind === 'metric' && !METRIC_IDS.has(value.metricId)) errors.push(`${path}: nguồn dữ liệu không tồn tại`)
  if (value.kind === 'column' && !ECO_QUANTITY_TARGET_COLUMNS.includes(value.columnId as never)) errors.push(`${path}: sản phẩm nguồn không tồn tại`)
  if (!Number.isFinite(value.coef ?? 1) || (value.coef ?? 1) < 0) errors.push(`${path}: hệ số phải không âm`)
  void source
}

function branchCovers(earlier: EcoQuantityWhen, later: EcoQuantityWhen): boolean {
  return WHEN_KEYS.every((key) => {
    const earlierValues = earlier[key]
    if (!earlierValues?.length) return true
    const laterValues = later[key]
    return !!laterValues?.length && laterValues.every((value) => earlierValues.includes(value as never))
  })
}

function valueColumnReferences(value: EcoQuantityValue): string[] {
  if (value.kind === 'column') return [value.columnId]
  if (value.kind === 'sum') return value.parts.flatMap(valueColumnReferences)
  return []
}

/** Validation gate before a quantity-rule version may be published. */
export function validateEcoQuantityRules(rules: EcoQuantityRule[]): string[] {
  const errors: string[] = []
  const seenTargets = new Set<string>()
  for (const rule of rules) {
    const label = displayNameFor(rule.targetColumn, [], [])
    if (
      !ECO_QUANTITY_TARGET_COLUMNS.includes(rule.targetColumn as never) &&
      !catalogItemIdForTarget(rule.targetColumn)
    ) {
      errors.push(`${label}: sản phẩm không hợp lệ`)
    }
    if (seenTargets.has(rule.targetColumn)) errors.push(`${label}: có nhiều hơn một quy tắc`)
    seenTargets.add(rule.targetColumn)
    validateValue(rule.fallback, `${label}, mặc định`, errors)
    const branchIds = new Set<string>()
    rule.branches.forEach((branch, index) => {
      const branchLabel = `${label}, nhánh ${index + 1}`
      if (branchIds.has(branch.id)) errors.push(`${branchLabel}: mã nhánh bị trùng`)
      branchIds.add(branch.id)
      if (Object.values(branch.when).every((value) => !value?.length)) {
        errors.push(`${branchLabel}: cần có ít nhất một điều kiện; dùng phần Mặc định cho trường hợp còn lại`)
      }
      for (const pair of branch.when.routePairs ?? []) {
        if (!/^[A-Z]{3}-[A-Z]{3}$/.test(pair.trim().toUpperCase())) {
          errors.push(`${branchLabel}: chặng bay phải theo dạng SGN-MEL`)
        }
      }
      validateValue(branch.value, branchLabel, errors)
      const shadowingIndex = rule.branches.findIndex(
        (earlier, earlierIndex) =>
          earlierIndex < index && branchCovers(earlier.when, branch.when),
      )
      if (shadowingIndex >= 0) {
        errors.push(`${branchLabel}: không bao giờ được dùng vì bị nhánh ${shadowingIndex + 1} che phủ`)
      }
    })
  }

  const dependencies = new Map(
    rules.map((rule) => [
      rule.targetColumn,
      new Set([
        ...valueColumnReferences(rule.fallback),
        ...rule.branches.flatMap((branch) => valueColumnReferences(branch.value)),
      ]),
    ]),
  )
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (target: string, trail: string[]): void => {
    if (visiting.has(target)) {
      errors.push(`Vòng phụ thuộc công thức: ${[...trail, target].join(' → ')}`)
      return
    }
    if (visited.has(target)) return
    visiting.add(target)
    for (const dependency of dependencies.get(target) ?? []) {
      if (dependencies.has(dependency)) visit(dependency, [...trail, target])
    }
    visiting.delete(target)
    visited.add(target)
  }
  for (const target of dependencies.keys()) visit(target, [])
  return [...new Set(errors)]
}

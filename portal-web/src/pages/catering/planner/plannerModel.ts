import { buildEcoSupplierRow } from '@/modules/catering/supplier/ecoBuilder'
import { buildSbbSupplierRow } from '@/modules/catering/supplier/sbbBuilder'
import {
  parseEcoRouteRuleDataset,
  parseSbbLookupDataset,
} from '@/modules/catering/supplier/validation'
import type {
  EcoCells,
  EcoRouteRuleDataset,
  EcoSupplierInput,
  EcoSupplierRow,
  SbbCells,
  SbbLookupDataset,
  SbbRouteSheet,
  SbbSupplierRow,
  SupplierCell,
  SupplierFlightInput,
} from '@/modules/catering/supplier/types'

export type PlannerProduct = 'eco' | 'sbb'
export type PlannerFlightStatus = 'ready' | 'warning' | 'blocked'

export interface PlannerFieldGroup<TField extends string> {
  key: string
  label: string
  fields: readonly TField[]
}

export const ECO_FIELD_GROUPS: readonly PlannerFieldGroup<keyof EcoCells>[] = [
  {
    key: 'hotmeal',
    label: 'Suất nóng',
    fields: [
      'spaghetti', 'glassNoodles', 'banhChung', 'stirFriedNoodles',
      'thaiFriedRice', 'savoryStickyRice', 'khucStickyRice', 'beefRice',
      'coconutRice', 'indianPotatoParatha', 'chickenCurry', 'fishCurry',
      'vegetarianYangzhouRice', 'vegetarianBasmatiCurry', 'hotmealTotal',
    ],
  },
  {
    key: 'bread-eggs',
    label: 'Bánh mì & trứng',
    fields: [
      'bread', 'boiledEggs', 'skybossEggs', 'totalEggs',
      'australiaBeefFreshVegetables', 'australiaNoodleVegetables',
      'australiaBreadVegetables', 'australiaSkybossYogurt', 'australiaRoundBread',
    ],
  },
  {
    key: 'condiments',
    label: 'Gia vị',
    fields: ['ketchup', 'chiliSauce', 'soySauce'],
  },
  {
    key: 'utensils',
    label: 'Dụng cụ',
    fields: ['hotmealUtensils', 'reserveUtensils', 'totalUtensils'],
  },
  {
    key: 'commercial',
    label: 'Thương mại',
    fields: ['skyboss', 'prebook', 'prebookCashews'],
  },
  {
    key: 'amenity-ops',
    label: 'Tiện ích & khai thác',
    fields: [
      'reserveCrewWater', 'smallIceBox', 'largeIceBox', 'wetIceKg',
      'dryIceKg', 'dutyFree', 'highlift', 'smallTruck', 'lastMinuteTopUp',
    ],
  },
] as const

export const SBB_FIELD_GROUPS: readonly PlannerFieldGroup<keyof SbbCells>[] = [
  {
    key: 'passengers-meals',
    label: 'Hành khách & suất ăn',
    fields: [
      'businessPax', 'bread', 'basa', 'pho', 'bunBo', 'stickyRice',
      'chickenGravy',
    ],
  },
  {
    key: 'service',
    label: 'Phục vụ',
    fields: ['cocktail', 'maccaRaisins', 'utensils'],
  },
  {
    key: 'amenities',
    label: 'Tiện ích SkyBoss',
    fields: ['kit', 'pillow', 'mattress', 'blanket'],
  },
] as const

export const FIELD_LABELS: Record<keyof EcoCells | keyof SbbCells, string> = {
  spaghetti: 'Mỳ Ý',
  glassNoodles: 'Miến',
  banhChung: 'Bánh chưng',
  stirFriedNoodles: 'Mỳ xào',
  thaiFriedRice: 'Cơm chiên Thái',
  savoryStickyRice: 'Xôi mặn',
  khucStickyRice: 'Xôi khúc',
  beefRice: 'Cơm bò',
  coconutRice: 'Cơm dừa',
  indianPotatoParatha: 'Paratha khoai tây',
  chickenCurry: 'Cà ri gà',
  fishCurry: 'Cà ri cá',
  vegetarianYangzhouRice: 'Cơm Dương Châu chay',
  vegetarianBasmatiCurry: 'Basmati cà ri chay',
  hotmealTotal: 'Tổng suất nóng',
  bread: 'Bánh mì',
  boiledEggs: 'Trứng luộc',
  skybossEggs: 'Trứng SkyBoss',
  totalEggs: 'Tổng trứng',
  australiaNoodleVegetables: 'Rau mỳ Úc',
  australiaSkybossYogurt: 'Sữa chua SkyBoss Úc',
  australiaRoundBread: 'Bánh tròn Úc',
  australiaBeefFreshVegetables: 'Rau tươi bò Úc',
  australiaBreadVegetables: 'Rau bánh mì Úc',
  ketchup: 'Tương cà',
  chiliSauce: 'Tương ớt',
  soySauce: 'Nước tương',
  hotmealUtensils: 'Dụng cụ suất nóng',
  reserveUtensils: 'Dụng cụ dự phòng',
  totalUtensils: 'Tổng dụng cụ',
  skyboss: 'SkyBoss ECO',
  prebook: 'Prebook',
  prebookCashews: 'Hạt điều prebook',
  reserveCrewWater: 'Nước tổ bay dự phòng',
  smallIceBox: 'Thùng đá nhỏ',
  largeIceBox: 'Thùng đá lớn',
  wetIceKg: 'Đá ướt (kg)',
  dryIceKg: 'Đá khô (kg)',
  dutyFree: 'Duty free',
  highlift: 'Highlift',
  smallTruck: 'Xe tải nhỏ',
  lastMinuteTopUp: 'Bổ sung phút chót',
  businessPax: 'Khách Business',
  basa: 'Cá basa',
  pho: 'Phở',
  bunBo: 'Bún bò',
  stickyRice: 'Xôi',
  chickenGravy: 'Gà sốt',
  cocktail: 'Cocktail',
  maccaRaisins: 'Macca & nho khô',
  utensils: 'Dụng cụ',
  kit: 'Bộ kit',
  pillow: 'Gối',
  mattress: 'Nệm',
  blanket: 'Chăn',
}

/** Direct numeric patches keyed by flightKey → product → field → number */
export type SupplierEdits = Record<string, {
  eco?: Partial<Record<string, number>>
  sbb?: Partial<Record<string, number>>
}>

export interface PlannerIssueCount {
  blockers: number
  warnings: number
}

export interface PlannerFlight extends PlannerIssueCount {
  key: string
  input: SupplierFlightInput
  flightNo: string
  dep: string
  arr: string
  operatingDate: string
  eco: EcoSupplierRow
  sbb: SbbSupplierRow | null
  status: PlannerFlightStatus
}

export interface PlannerReadiness extends PlannerIssueCount {
  totalFlights: number
  readyFlights: number
  warningFlights: number
  blockedFlights: number
  readinessPercent: number
}

export interface PlannerWorkspace {
  flights: PlannerFlight[]
  ecoRows: EcoSupplierRow[]
  sbbRows: SbbSupplierRow[]
  summary: PlannerReadiness
}

export interface PlannerContext {
  stationLabel: string
  dateLabel: string
  stations: string[]
  dates: string[]
}

export interface SbbRouteSheetGroup {
  sheet: SbbRouteSheet
  flights: PlannerFlight[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(row: Record<string, unknown>, field: string): string | null {
  const value = row[field]
  return typeof value === 'string' && value.trim() ? value : null
}

export function parsePlannerFlights(input: unknown): SupplierFlightInput[] {
  if (!Array.isArray(input)) throw new Error('Planner flight dataset must be an array')
  return input.map((candidate, index) => {
    if (!isRecord(candidate)) throw new Error(`Invalid planner flight at row ${index + 1}`)
    const operatingDate = requiredString(candidate, 'operatingDate')
    const flightNo = requiredString(candidate, 'flightNo')
    const dep = requiredString(candidate, 'dep')
    const arr = requiredString(candidate, 'arr')
    if (!operatingDate || !flightNo || !dep || !arr) {
      throw new Error(`Invalid planner flight at row ${index + 1}`)
    }
    return { ...candidate, operatingDate, flightNo, dep, arr } as SupplierFlightInput
  })
}

function toEcoInput(input: SupplierFlightInput): EcoSupplierInput {
  return {
    operatingDate: input.operatingDate,
    flightNo: input.flightNo,
    dep: input.dep,
    arr: input.arr,
    quotaCommercial: input.quotaCommercial ?? null,
    totalPrebook: input.totalPrebook ?? null,
    skybossEco: input.skybossEco ?? null,
    boiledEggs: input.boiledEggs ?? null,
    reserveUtensils: input.reserveUtensils ?? null,
    workbookReferenceBread: input.workbookReferenceBread,
    hotmealItems: input.hotmealItems ?? {},
    australiaBeefFreshVegetables: input.australiaBeefFreshVegetables,
    australiaBreadVegetables: input.australiaBreadVegetables,
    reserveCrewWater: input.reserveCrewWater,
    smallIceBox: input.smallIceBox,
    largeIceBox: input.largeIceBox,
    wetIceKg: input.wetIceKg,
    dryIceKg: input.dryIceKg,
    dutyFree: input.dutyFree,
    highlift: input.highlift,
    smallTruck: input.smallTruck,
    lastMinuteTopUp: input.lastMinuteTopUp,
    sourceRefs: input.sourceRefs,
  }
}

export function countCellsIssues(
  _cells: Record<string, SupplierCell<number>>,
): PlannerIssueCount {
  return { blockers: 0, warnings: 0 }
}

export function countRowIssues(
  row: EcoSupplierRow | SbbSupplierRow,
): PlannerIssueCount {
  return countCellsIssues(
    row.cells as unknown as Record<string, SupplierCell<number>>,
  )
}

export function selectFlightStatus(
  _issues: PlannerIssueCount,
): PlannerFlightStatus {
  return 'ready'
}

function displayProjectDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

export function derivePlannerContext(
  rows: readonly Pick<PlannerFlight, 'dep' | 'operatingDate'>[],
): PlannerContext {
  const stations = [...new Set(rows.map((row) => row.dep))]
  const dates = [...new Set(rows.map((row) => row.operatingDate))]
  return {
    stations,
    dates,
    stationLabel:
      stations.length === 0 ? 'Chưa có trạm' :
      stations.length === 1 ? stations[0] : 'Nhiều trạm',
    dateLabel:
      dates.length === 0 ? 'Chưa có ngày' :
      dates.length === 1 ? displayProjectDate(dates[0]) : 'Nhiều ngày',
  }
}

export function getPlannerCellAccessibleName(
  label: string,
  cell: SupplierCell<number>,
): string {
  return [
    label,
    `giá trị ${cell.value == null ? 'chưa có' : cell.value.toLocaleString('vi-VN')}`,
  ].join(', ')
}

export function selectPlannerFlight(
  flights: readonly PlannerFlight[],
  selectedKey?: string,
): PlannerFlight | undefined {
  return flights.find((flight) => flight.key === selectedKey) ?? flights[0]
}

export function groupFlightsBySbbRouteSheet(
  flights: readonly PlannerFlight[],
): SbbRouteSheetGroup[] {
  const grouped = new Map<SbbRouteSheet, PlannerFlight[]>()
  for (const flight of flights) {
    if (!flight.sbb) continue
    const group = grouped.get(flight.sbb.sheet)
    if (group) group.push(flight)
    else grouped.set(flight.sbb.sheet, [flight])
  }
  return [...grouped].map(([sheet, routeFlights]) => ({
    sheet,
    flights: routeFlights,
  }))
}

export function getPlannerScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? 'auto' : 'smooth'
}

const ecoDatasetCache = new WeakMap<object, EcoRouteRuleDataset | unknown>()
const sbbDatasetCache = new WeakMap<object, SbbLookupDataset | unknown>()

function cachedEcoRules(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  const cached = ecoDatasetCache.get(value)
  if (cached !== undefined) return cached
  const parsed = parseEcoRouteRuleDataset(value)
  const resolved = parsed.ok ? parsed.value : value
  ecoDatasetCache.set(value, resolved)
  return resolved
}

function cachedSbbLookups(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  const cached = sbbDatasetCache.get(value)
  if (cached !== undefined) return cached
  const parsed = parseSbbLookupDataset(value)
  const resolved = parsed.ok ? parsed.value : value
  sbbDatasetCache.set(value, resolved)
  return resolved
}

function patchCells<TCells extends object>(
  cells: TCells,
  edits: Partial<Record<string, number>> | undefined,
): TCells {
  if (!edits) return cells
  const record = cells as Record<string, SupplierCell<number>>
  let next: Record<string, SupplierCell<number>> | null = null
  for (const [field, value] of Object.entries(edits)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (!(field in record)) continue
    if (!next) next = { ...record }
    next[field] = {
      ...record[field],
      value,
      source: 'Manual edit',
    }
  }
  return (next as TCells | null) ?? cells
}

/**
 * Apply direct numeric patches onto a built workspace (display + export rows).
 */
export function applySupplierEdits(
  workspace: PlannerWorkspace,
  edits?: SupplierEdits,
): PlannerWorkspace {
  if (!edits || Object.keys(edits).length === 0) return workspace

  const flights = workspace.flights.map((flight) => {
    const flightEdits = edits[flight.key]
    if (!flightEdits) return flight

    const ecoCells = patchCells(flight.eco.cells, flightEdits.eco)
    const eco = ecoCells === flight.eco.cells
      ? flight.eco
      : { ...flight.eco, cells: ecoCells }

    let sbb = flight.sbb
    if (sbb && flightEdits.sbb) {
      const sbbCells = patchCells(sbb.cells, flightEdits.sbb)
      if (sbbCells !== sbb.cells) sbb = { ...sbb, cells: sbbCells }
    }

    if (eco === flight.eco && sbb === flight.sbb) return flight
    return { ...flight, eco, sbb }
  })

  return {
    ...workspace,
    flights,
    ecoRows: flights.map((flight) => flight.eco),
    sbbRows: flights.flatMap((flight) => (flight.sbb ? [flight.sbb] : [])),
  }
}

export function buildPlannerWorkspace(
  flightInput: unknown,
  ecoRouteRules: unknown,
  sbbLookups: unknown,
): PlannerWorkspace {
  const inputs = parsePlannerFlights(flightInput)
  const parsedEcoRules = cachedEcoRules(ecoRouteRules)
  const parsedSbbLookups = cachedSbbLookups(sbbLookups)
  const flights = inputs.map((input): PlannerFlight => {
    const eco = buildEcoSupplierRow(toEcoInput(input), parsedEcoRules)
    const sbb = buildSbbSupplierRow(input, parsedSbbLookups)
    return {
      key: eco.key,
      input,
      flightNo: eco.flightNo,
      dep: eco.dep,
      arr: eco.arr,
      operatingDate: eco.operatingDate,
      eco,
      sbb,
      blockers: 0,
      warnings: 0,
      status: 'ready',
    }
  })

  return {
    flights,
    ecoRows: flights.map((flight) => flight.eco),
    sbbRows: flights.flatMap((flight) => (flight.sbb ? [flight.sbb] : [])),
    summary: {
      totalFlights: flights.length,
      readyFlights: flights.length,
      warningFlights: 0,
      blockedFlights: 0,
      blockers: 0,
      warnings: 0,
      readinessPercent: flights.length ? 100 : 0,
    },
  }
}

/** Dish Overview sections derived from ECO/SBB — amenities excluded. */
const DISH_ROLLUP_ECO_GROUPS = new Set(['hotmeal', 'bread-eggs', 'condiments', 'commercial'])
const DISH_ROLLUP_SBB_GROUPS = new Set(['passengers-meals', 'service'])
/** Totals / pax that would double-count or are not “món”. */
const DISH_ROLLUP_SKIP_FIELDS = new Set([
  'hotmealTotal',
  'totalEggs',
  'totalUtensils',
  'businessPax',
])

export interface DishRollupLine {
  key: string
  label: string
  product: PlannerProduct
  field: string
  qty: number
}

export interface DishRollupSection {
  key: string
  label: string
  product: PlannerProduct
  lines: DishRollupLine[]
  total: number
}

export interface DishRollup {
  sections: DishRollupSection[]
  /** Sum of all dish lines (amenities excluded). */
  total: number
  /** ECO hotmeal item sums (excl. hotmealTotal). */
  ecoMeals: number
  /** ECO commercial-ish (skyboss + prebook + cashews + bread group non-skip). */
  ecoCommercial: number
  /** SBB meal + service sums. */
  sbbMeals: number
}

function sumFieldAcrossFlights(
  flights: readonly PlannerFlight[],
  product: PlannerProduct,
  field: string,
): number {
  let sum = 0
  for (const flight of flights) {
    const cells = product === 'eco' ? flight.eco.cells : flight.sbb?.cells
    if (!cells) continue
    const cell = cells[field as never] as SupplierCell<number> | undefined
    if (cell?.value != null && Number.isFinite(cell.value)) sum += cell.value
  }
  return sum
}

export function rollupDishOverview(flights: readonly PlannerFlight[]): DishRollup {
  const sections: DishRollupSection[] = []

  for (const group of ECO_FIELD_GROUPS) {
    if (!DISH_ROLLUP_ECO_GROUPS.has(group.key)) continue
    const lines: DishRollupLine[] = []
    for (const field of group.fields) {
      if (DISH_ROLLUP_SKIP_FIELDS.has(field)) continue
      const qty = sumFieldAcrossFlights(flights, 'eco', field)
      if (qty === 0) continue
      lines.push({
        key: `eco:${field}`,
        label: FIELD_LABELS[field],
        product: 'eco',
        field,
        qty,
      })
    }
    if (lines.length === 0) continue
    sections.push({
      key: `eco:${group.key}`,
      label: `ECO · ${group.label}`,
      product: 'eco',
      lines,
      total: lines.reduce((acc, line) => acc + line.qty, 0),
    })
  }

  for (const group of SBB_FIELD_GROUPS) {
    if (!DISH_ROLLUP_SBB_GROUPS.has(group.key)) continue
    const lines: DishRollupLine[] = []
    for (const field of group.fields) {
      if (DISH_ROLLUP_SKIP_FIELDS.has(field)) continue
      const qty = sumFieldAcrossFlights(flights, 'sbb', field)
      if (qty === 0) continue
      lines.push({
        key: `sbb:${field}`,
        label: FIELD_LABELS[field],
        product: 'sbb',
        field,
        qty,
      })
    }
    if (lines.length === 0) continue
    sections.push({
      key: `sbb:${group.key}`,
      label: `SBB · ${group.label}`,
      product: 'sbb',
      lines,
      total: lines.reduce((acc, line) => acc + line.qty, 0),
    })
  }

  const ecoMeals = sections
    .filter((s) => s.key === 'eco:hotmeal' || s.key === 'eco:bread-eggs' || s.key === 'eco:condiments')
    .reduce((acc, s) => acc + s.total, 0)
  const ecoCommercial = sections
    .filter((s) => s.key === 'eco:commercial')
    .reduce((acc, s) => acc + s.total, 0)
  const sbbMeals = sections
    .filter((s) => s.product === 'sbb')
    .reduce((acc, s) => acc + s.total, 0)
  const total = sections.reduce((acc, s) => acc + s.total, 0)

  return { sections, total, ecoMeals, ecoCommercial, sbbMeals }
}

import { normalizeAirport, parseDatasetDate } from './normalize'
import type {
  EcoRoutePolicyField,
  EcoRouteRuleDataset,
  EcoRouteRuleDefinition,
  SbbLookupDataset,
  SbbLookupItem,
  SbbLookupRow,
  SbbRouteSheet,
  SbbSheetRouteBinding,
} from './types'

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

const ECO_ROUTE_FIELDS: EcoRoutePolicyField[] = [
  'australiaNoodleVegetables',
  'skybossEggs',
  'australiaSkybossYogurt',
  'australiaRoundBread',
]
const SBB_SHEETS: SbbRouteSheet[] = [
  'VIET-HAN-NHAT',
  'CHAY(VIỆT-HÀN-NHẬT)',
  'ẤN',
  'ÚC&KAZ',
]
const SBB_ITEMS: SbbLookupItem[] = [
  'bread',
  'basa',
  'pho',
  'bunBo',
  'stickyRice',
  'chickenGravy',
  'blanket',
]
const ecoRouteRuleCache = new WeakMap<object, ParseResult<EcoRouteRuleDataset>>()
const sbbLookupCache = new WeakMap<object, ParseResult<SbbLookupDataset>>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isValidQuantity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  )
}

function parseEffectiveRange(
  value: Record<string, unknown>,
): ParseResult<{ effectiveFrom: string; effectiveTo: string }> {
  if (
    typeof value.effectiveFrom !== 'string' ||
    typeof value.effectiveTo !== 'string'
  ) return { ok: false, error: 'Effective range is required' }
  const effectiveFrom = parseDatasetDate(value.effectiveFrom)
  const effectiveTo = parseDatasetDate(value.effectiveTo)
  if (!effectiveFrom || !effectiveTo || effectiveFrom > effectiveTo) {
    return {
      ok: false,
      error: 'Effective range must contain valid DD/MM/YYYY or YYYY-MM-DD dates',
    }
  }
  return { ok: true, value: { effectiveFrom, effectiveTo } }
}

export function parseEcoRouteRuleDataset(
  value: unknown,
): ParseResult<EcoRouteRuleDataset> {
  if (typeof value !== 'object' || value === null) {
    return parseEcoRouteRuleDatasetUncached(value)
  }
  const cached = ecoRouteRuleCache.get(value)
  if (cached) return cached
  const parsed = parseEcoRouteRuleDatasetUncached(value)
  ecoRouteRuleCache.set(value, parsed)
  return parsed
}

function parseEcoRouteRuleDatasetUncached(
  value: unknown,
): ParseResult<EcoRouteRuleDataset> {
  if (!isRecord(value)) return { ok: false, error: 'ECO rules must be an object' }
  const range = parseEffectiveRange(value)
  if (!range.ok) return range
  if (
    typeof value.source !== 'string' ||
    !value.source.trim() ||
    !Array.isArray(value.airports) ||
    value.airports.length === 0 ||
    !value.airports.every((airport) => typeof airport === 'string' && airport.trim())
  ) return { ok: false, error: 'ECO rule source and airports are required' }
  if (!isRecord(value.fields)) {
    return { ok: false, error: 'ECO rule fields are required' }
  }

  const fields = {} as Record<EcoRoutePolicyField, EcoRouteRuleDefinition>
  for (const field of ECO_ROUTE_FIELDS) {
    const rule = value.fields[field]
    if (!isRecord(rule) || typeof rule.ruleId !== 'string' || !rule.ruleId.trim()) {
      return { ok: false, error: `Invalid ECO route rule ${field}` }
    }
    const hasValue = Object.hasOwn(rule, 'value')
    const hasInput = Object.hasOwn(rule, 'input')
    if (
      hasValue === hasInput ||
      (hasValue && !isValidQuantity(rule.value)) ||
      (hasInput && rule.input !== 'skybossEco')
    ) return { ok: false, error: `Invalid ECO route rule value ${field}` }
    fields[field] = hasValue
      ? { ruleId: rule.ruleId, value: rule.value as number }
      : { ruleId: rule.ruleId, input: 'skybossEco' }
  }

  return {
    ok: true,
    value: {
      effectiveFrom: range.value.effectiveFrom,
      effectiveTo: range.value.effectiveTo,
      airports: (value.airports as string[]).map(normalizeAirport),
      source: value.source,
      fields,
    },
  }
}

export function parseSbbLookupDataset(value: unknown): ParseResult<SbbLookupDataset> {
  if (typeof value !== 'object' || value === null) {
    return parseSbbLookupDatasetUncached(value)
  }
  const cached = sbbLookupCache.get(value)
  if (cached) return cached
  const parsed = parseSbbLookupDatasetUncached(value)
  sbbLookupCache.set(value, parsed)
  return parsed
}

function parseSbbLookupDatasetUncached(value: unknown): ParseResult<SbbLookupDataset> {
  if (!isRecord(value)) return { ok: false, error: 'SBB lookup must be an object' }
  const range = parseEffectiveRange(value)
  if (!range.ok) return range
  if (typeof value.source !== 'string' || !value.source.trim() || !isRecord(value.sheets)) {
    return { ok: false, error: 'SBB lookup source and sheets are required' }
  }

  const sheets = {} as Record<SbbRouteSheet, SbbLookupRow[]>
  for (const sheet of SBB_SHEETS) {
    const rawRows = value.sheets[sheet]
    if (!Array.isArray(rawRows)) {
      return { ok: false, error: `Missing SBB sheet ${sheet}` }
    }
    const seen = new Set<number>()
    const rows: SbbLookupRow[] = []
    for (const rawRow of rawRows) {
      if (
        !isRecord(rawRow) ||
        !isValidQuantity(rawRow.businessPax) ||
        rawRow.businessPax === 0 ||
        seen.has(rawRow.businessPax) ||
        !isRecord(rawRow.items)
      ) return { ok: false, error: `Invalid or duplicate row in ${sheet}` }
      const items: Partial<Record<SbbLookupItem, number | null>> = {}
      for (const [item, quantity] of Object.entries(rawRow.items)) {
        if (
          !SBB_ITEMS.includes(item as SbbLookupItem) ||
          (quantity !== null && !isValidQuantity(quantity))
        ) return { ok: false, error: `Invalid item in ${sheet}` }
        items[item as SbbLookupItem] = quantity as number | null
      }
      seen.add(rawRow.businessPax)
      rows.push({ businessPax: rawRow.businessPax, items })
    }
    sheets[sheet] = rows
  }

  return {
    ok: true,
    value: {
      effectiveFrom: range.value.effectiveFrom,
      effectiveTo: range.value.effectiveTo,
      source: value.source,
      sheets,
      sheetBindings: parseSbbSheetBindings(value.sheetBindings),
    },
  }
}

function parseSbbSheetBindings(
  raw: unknown,
): Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> | undefined {
  if (!isRecord(raw)) return undefined
  const result: Partial<Record<SbbRouteSheet, SbbSheetRouteBinding>> = {}
  for (const sheet of SBB_SHEETS) {
    const entry = raw[sheet]
    if (!isRecord(entry)) continue
    const airports = Array.isArray(entry.airports)
      ? entry.airports
          .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
          .map(normalizeAirport)
      : []
    const routePairs = Array.isArray(entry.routePairs)
      ? entry.routePairs.filter(
          (p): p is string => typeof p === 'string' && p.trim().length > 0,
        )
      : undefined
    const priority =
      typeof entry.priority === 'number' && Number.isFinite(entry.priority)
        ? entry.priority
        : undefined
    const note = typeof entry.note === 'string' ? entry.note : undefined
    result[sheet] = { airports, routePairs, priority, note }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

import { normalizeAirport } from './normalize'
import type {
  EcoRouteRuleDataset,
  EcoRouteRuleDefinition,
  SupplierCell,
} from './types'

export function ecoCell(
  value: number | null,
  source: string,
): SupplierCell<number> {
  return { value, source }
}

export function sumKnown(values: Array<number | null | undefined>): number | null {
  const present = values.filter((value): value is number => value != null)
  if (present.length === 0) return null
  return present.reduce((total, value) => total + value, 0)
}

export function sumHotmealItems(
  values: Array<number | null | undefined>,
): number | null {
  if (!values.some((value) => value != null)) return null
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

export function derivedFrom(
  dependencies: Array<number | null>,
  calculate: (values: number[]) => number,
): number | null {
  if (dependencies.some((value) => value == null)) return null
  return calculate(dependencies as number[])
}

export function isEcoRouteRuleApplicable(
  dataset: EcoRouteRuleDataset,
  operatingDate: string,
  dep: string,
  arr: string,
): boolean {
  return (
    isEcoRouteRuleDateApplicable(dataset, operatingDate) &&
    isEcoRouteSupported(dataset, dep, arr)
  )
}

export function isEcoRouteRuleDateApplicable(
  dataset: EcoRouteRuleDataset,
  operatingDate: string,
): boolean {
  return (
    operatingDate >= dataset.effectiveFrom &&
    operatingDate <= dataset.effectiveTo
  )
}

export function isEcoRouteSupported(
  dataset: EcoRouteRuleDataset,
  dep: string,
  arr: string,
): boolean {
  const airports = new Set(dataset.airports.map(normalizeAirport))
  return [normalizeAirport(dep), normalizeAirport(arr)].some((airport) =>
    airports.has(airport),
  )
}

export function resolveEcoRouteRuleValue(
  rule: EcoRouteRuleDefinition,
  skybossEco: number | null,
): number | null {
  if (rule.input === 'skybossEco') return skybossEco
  return rule.value ?? null
}

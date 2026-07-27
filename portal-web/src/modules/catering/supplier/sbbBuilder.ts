import {
  createFlightJoinKey,
  normalizeFlightIdentity,
  parseProjectDate,
} from './normalize'
import {
  isDateWithinRange,
  isOutboundAustraliaKazakhstan,
  selectSbbRouteSheet,
} from './sbbRules'
import type {
  SbbCells,
  SbbLookupItem,
  SbbLookupRow,
  SbbSupplierRow,
  SupplierCell,
  SupplierFlightInput,
} from './types'
import { parseSbbLookupDataset } from './validation'

function sbbCell(value: number | null, source: string): SupplierCell<number> {
  return { value, source }
}

function lookupCell(
  row: SbbLookupRow | undefined,
  item: SbbLookupItem,
  source: string,
): SupplierCell<number> {
  if (!row) return sbbCell(null, `${source}; no exact businessPax row`)
  const value = row.items[item]
  return sbbCell(
    value ?? null,
    `${source}; exact businessPax=${row.businessPax} row`,
  )
}

export function buildSbbSupplierRow(
  input: SupplierFlightInput,
  lookupInput: unknown,
): SbbSupplierRow | null {
  const parsedDate = parseProjectDate(input.operatingDate)
  const identity = normalizeFlightIdentity(input)
  const effectiveDate = parsedDate ?? input.operatingDate.trim()
  const sheet = selectSbbRouteSheet(identity.dep, identity.arr, input.sbbMealType)
  const businessPaxValue = input.businessPax ?? null

  if (businessPaxValue == null || businessPaxValue === 0) return null

  const base = {
    ...identity,
    operatingDate: effectiveDate,
    key: createFlightJoinKey({ ...identity, operatingDate: effectiveDate }),
    sheet,
  }

  const businessPax = sbbCell(
    businessPaxValue,
    input.sourceRefs?.businessPax ??
      'Verified business passenger input; distinct from skybossEco',
  )

  const parsedLookup = parseSbbLookupDataset(lookupInput)
  const lookup = parsedLookup.ok ? parsedLookup.value : null
  const lookupInRange =
    lookup != null &&
    isDateWithinRange(effectiveDate, lookup.effectiveFrom, lookup.effectiveTo)
  const row =
    lookupInRange
      ? lookup.sheets[sheet].find(
          (candidate) => candidate.businessPax === businessPaxValue,
        )
      : undefined
  const lookupSource = lookup?.source ?? 'SBB lookup unavailable'

  const australiaKazakhstan = sheet === 'ÚC&KAZ'
  const outbound = isOutboundAustraliaKazakhstan(identity.dep, identity.arr)
  const amenityValue = australiaKazakhstan
    ? businessPaxValue + (outbound ? 1 : 0)
    : null

  const inputAmenity = (
    value: number | null | undefined,
    source: string,
  ): SupplierCell<number> => sbbCell(value ?? null, source)

  const cells: SbbCells = {
    businessPax,
    bread: lookupCell(row, 'bread', `${lookupSource}; ${sheet}`),
    basa: lookupCell(row, 'basa', `${lookupSource}; ${sheet}`),
    pho: lookupCell(row, 'pho', `${lookupSource}; ${sheet}`),
    bunBo: lookupCell(row, 'bunBo', `${lookupSource}; ${sheet}`),
    stickyRice: lookupCell(row, 'stickyRice', `${lookupSource}; ${sheet}`),
    chickenGravy: lookupCell(row, 'chickenGravy', `${lookupSource}; ${sheet}`),
    cocktail: australiaKazakhstan
      ? sbbCell(2 * businessPaxValue, '2 × businessPax')
      : inputAmenity(input.sbbCocktail, 'SBB cocktail input'),
    maccaRaisins: australiaKazakhstan
      ? sbbCell(2 * businessPaxValue, '2 × businessPax')
      : inputAmenity(input.sbbMaccaRaisins, 'SBB macca/raisins input'),
    utensils: australiaKazakhstan
      ? sbbCell(
          3 * businessPaxValue + Math.ceil(businessPaxValue / 2),
          '3 × businessPax + ceil(businessPax / 2)',
        )
      : inputAmenity(input.sbbUtensils, 'SBB utensils input'),
    kit: australiaKazakhstan
      ? sbbCell(
          amenityValue,
          outbound ? 'Outbound businessPax + 1' : 'Return businessPax',
        )
      : inputAmenity(input.sbbKit, 'SBB kit input'),
    pillow: australiaKazakhstan
      ? sbbCell(
          amenityValue,
          outbound ? 'Outbound businessPax + 1' : 'Return businessPax',
        )
      : inputAmenity(input.sbbPillow, 'SBB pillow input'),
    mattress: australiaKazakhstan
      ? sbbCell(
          amenityValue,
          outbound ? 'Outbound businessPax + 1' : 'Return businessPax',
        )
      : inputAmenity(input.sbbMattress, 'SBB mattress input'),
    blanket: lookupCell(row, 'blanket', `${lookupSource}; ${sheet}`),
  }

  return { ...base, cells }
}

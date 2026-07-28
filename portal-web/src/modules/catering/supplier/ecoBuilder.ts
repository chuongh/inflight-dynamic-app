import {
  derivedFrom,
  ecoCell,
  isEcoRouteRuleApplicable,
  resolveEcoRouteRuleValue,
  sumHotmealItems,
} from './ecoRules'
import {
  createFlightJoinKey,
  normalizeFlightIdentity,
  parseProjectDate,
} from './normalize'
import { DEFAULT_ECO_AMENITY_CONFIG } from './amenityDefaults'
import { resolveAmenityPackages } from './amenityResolver'
import {
  DEFAULT_ECO_QUANTITY_RULES,
  evalQuantityRule,
  type EcoQuantityEvalContext,
} from './ecoQuantityEval'
import type { EcoQuantityConfig, EcoUpliftType } from './ecoQuantityTypes'
import type {
  EcoCells,
  EcoRoutePolicyField,
  EcoSupplierInput,
  EcoSupplierRow,
  HotmealItemKey,
  SupplierCell,
} from './types'
import { parseEcoRouteRuleDataset } from './validation'

const HOTMEAL_KEYS: HotmealItemKey[] = [
  'spaghetti',
  'glassNoodles',
  'banhChung',
  'stirFriedNoodles',
  'thaiFriedRice',
  'savoryStickyRice',
  'khucStickyRice',
  'beefRice',
  'coconutRice',
  'indianPotatoParatha',
  'chickenCurry',
  'fishCurry',
  'vegetarianYangzhouRice',
  'vegetarianBasmatiCurry',
]

const EMPTY_OPS_SOURCE = 'Not provided'

function inputCell(
  value: number | null | undefined,
  source: string,
): SupplierCell<number> {
  return ecoCell(value ?? null, source)
}

function normalizeUpliftType(
  raw: string | null | undefined,
): EcoUpliftType | null {
  if (!raw) return null
  if (raw === 'DAU_NGAY' || raw === 'DOI_TO' || raw === 'NIGHTSTOP') return raw
  const u = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (u.includes('DAU') || u.includes('START')) return 'DAU_NGAY'
  if (u.includes('DOI') || u.includes('CHANGE')) return 'DOI_TO'
  if (u.includes('NIGHT')) return 'NIGHTSTOP'
  return null
}

export function buildEcoSupplierRow(
  input: EcoSupplierInput,
  routeRulesInput: unknown,
  quantityConfig?: EcoQuantityConfig | null,
): EcoSupplierRow {
  const parsedDate = parseProjectDate(input.operatingDate)
  const identity = normalizeFlightIdentity(input)
  const effectiveDate = parsedDate ?? input.operatingDate.trim()
  const parsedRules = parseEcoRouteRuleDataset(routeRulesInput)
  const routeRules = parsedRules.ok ? parsedRules.value : null
  const sourceRefs = input.sourceRefs ?? {}
  const amenityConfig = quantityConfig?.amenity ?? DEFAULT_ECO_AMENITY_CONFIG
  const quantityRules =
    quantityConfig?.quantityRules ?? DEFAULT_ECO_QUANTITY_RULES
  const upliftType = normalizeUpliftType(input.upliftType)

  const amenity = resolveAmenityPackages(
    {
      aircraftType: input.aircraftType,
      dep: identity.dep,
      arr: identity.arr,
      upliftType,
      flightKind: input.flightKind,
      amenityOverride: input.amenityOverride,
    },
    amenityConfig,
  )

  const hotmealCells = Object.fromEntries(
    HOTMEAL_KEYS.map((key) => [
      key,
      inputCell(
        input.hotmealItems[key],
        `${sourceRefs.hotmealItems ?? 'FlightView item allocation plus item-level adjustments'}; ${key}`,
      ),
    ]),
  ) as Record<HotmealItemKey, SupplierCell<number>>

  const boiledEggs = inputCell(
    input.boiledEggs,
    sourceRefs.boiledEggs ?? 'Operational input',
  )
  const skyboss = inputCell(
    input.skybossEco,
    sourceRefs.skybossEco ?? 'FlightView SkyBoss ECO passenger count',
  )
  const prebook = inputCell(
    input.totalPrebook,
    sourceRefs.totalPrebook ?? 'FlightView Meal Info Prebook',
  )
  const quota = inputCell(
    input.quotaCommercial,
    sourceRefs.quotaCommercial ?? 'Commercial quota source',
  )

  const routePolicyCell = (
    field: EcoRoutePolicyField,
  ): SupplierCell<number> => {
    if (
      !routeRules ||
      !isEcoRouteRuleApplicable(
        routeRules,
        effectiveDate,
        identity.dep,
        identity.arr,
      )
    ) {
      return ecoCell(null, routeRules?.source ?? 'ECO route rule not applicable')
    }
    const rule = routeRules.fields[field]
    const source =
      rule.input === 'skybossEco'
        ? `${routeRules.source}; ${skyboss.source}`
        : routeRules.source
    return ecoCell(
      resolveEcoRouteRuleValue(rule, skyboss.value),
      source,
    )
  }

  const skybossEggs = routePolicyCell('skybossEggs')
  const hotmealValues = HOTMEAL_KEYS.map((key) => hotmealCells[key].value)
  const hotmealTotalValue = sumHotmealItems(hotmealValues)
  const hotmealTotal = ecoCell(
    hotmealTotalValue,
    'Sum of 14 hotmeal items; bread excluded',
  )

  const breadValue =
    input.workbookReferenceBread != null
      ? input.workbookReferenceBread
      : input.quotaCommercial != null || input.totalPrebook != null
        ? (input.quotaCommercial ?? 0) + (input.totalPrebook ?? 0)
        : null
  const bread = ecoCell(
    breadValue,
    input.workbookReferenceBread != null
      ? `${sourceRefs.workbookReferenceBread ?? 'Workbook bread column'}; workbookReferenceBread`
      : `quotaCommercial + totalPrebook; ${quota.source}; ${prebook.source}`,
  )

  const ketchup = ecoCell(
    hotmealCells.spaghetti.value,
    'J spaghetti quantity',
  )
  const chiliSauce = ecoCell(
    hotmealTotalValue == null ? null : Math.ceil(hotmealTotalValue / 2),
    'ceil(AH hotmeal total / 2)',
  )
  const soySauce = ecoCell(
    hotmealTotalValue == null ? null : Math.ceil(hotmealTotalValue / 2),
    'ceil(AH hotmeal total / 2)',
  )
  const hotmealUtensils = ecoCell(
    hotmealTotalValue,
    'AH hotmeal total',
  )

  const columnSnapshot: Record<string, number | null> = {
    spaghetti: hotmealCells.spaghetti.value,
    ketchup: ketchup.value,
    chiliSauce: chiliSauce.value,
    soySauce: soySauce.value,
    hotmealUtensils: hotmealUtensils.value,
    bread: bread.value,
    skyboss: skyboss.value,
    prebook: prebook.value,
  }

  const evalCtx: EcoQuantityEvalContext = {
    columns: columnSnapshot,
    metrics: {
      quotaCommercial: quota.value,
      totalPrebook: prebook.value,
      skybossEco: skyboss.value,
    },
    hotmealTotal: hotmealTotalValue,
    dep: identity.dep,
    arr: identity.arr,
    aircraftType: input.aircraftType,
    upliftType,
    hourClassId: amenity.hourClassId,
    amenityPackageIds: amenity.packageIds,
    flightKind: input.flightKind,
    routeGroups: amenityConfig.routeGroups,
  }

  const ruleByTarget = (target: string) =>
    quantityRules.find((r) => r.enabled && r.targetColumn === target)

  const indianSaltRule = ruleByTarget('indianSaltPepper')
  const indianSaltPepper = indianSaltRule
    ? (() => {
        const resolved = evalQuantityRule(indianSaltRule, evalCtx)
        return ecoCell(resolved.value, resolved.source)
      })()
    : ecoCell(null, 'indianSaltPepper rule not configured')

  const reserveRule = ruleByTarget('reserveUtensils')
  let reserveUtensils: SupplierCell<number>
  if (input.reserveUtensils != null) {
    reserveUtensils = inputCell(
      input.reserveUtensils,
      sourceRefs.reserveUtensils ?? 'Manual package/route reserve input',
    )
  } else if (reserveRule) {
    const resolved = evalQuantityRule(reserveRule, evalCtx)
    reserveUtensils = ecoCell(resolved.value, resolved.source)
  } else {
    reserveUtensils = inputCell(
      null,
      sourceRefs.reserveUtensils ?? 'Manual package/route reserve input',
    )
  }

  const cells: EcoCells = {
    ...hotmealCells,
    bread,
    boiledEggs,
    skybossEggs,
    totalEggs: ecoCell(
      derivedFrom(
        [boiledEggs.value, skybossEggs.value],
        ([boiled, skybossValue]) => boiled + skybossValue,
      ),
      'AD boiled eggs + AE SkyBoss eggs',
    ),
    australiaNoodleVegetables: routePolicyCell('australiaNoodleVegetables'),
    australiaSkybossYogurt: routePolicyCell('australiaSkybossYogurt'),
    australiaRoundBread: routePolicyCell('australiaRoundBread'),
    australiaBeefFreshVegetables: inputCell(
      input.australiaBeefFreshVegetables,
      'Australia beef/fresh vegetables input',
    ),
    australiaBreadVegetables: inputCell(
      input.australiaBreadVegetables,
      'Australia bread vegetables input',
    ),
    hotmealTotal,
    ketchup,
    chiliSauce,
    soySauce,
    indianSaltPepper,
    hotmealUtensils,
    reserveUtensils,
    totalUtensils: ecoCell(
      derivedFrom(
        [hotmealUtensils.value, reserveUtensils.value],
        ([hotmeal, reserve]) => hotmeal + reserve,
      ),
      'AM hotmeal utensils + AN reserve utensils',
    ),
    skyboss,
    prebook,
    prebookCashews: ecoCell(prebook.value, 'AQ total prebook'),
    reserveCrewWater: inputCell(
      input.reserveCrewWater,
      sourceRefs.reserveCrewWater ?? EMPTY_OPS_SOURCE,
    ),
    smallIceBox: inputCell(
      input.smallIceBox,
      sourceRefs.smallIceBox ?? EMPTY_OPS_SOURCE,
    ),
    largeIceBox: inputCell(
      input.largeIceBox,
      sourceRefs.largeIceBox ?? EMPTY_OPS_SOURCE,
    ),
    wetIceKg: inputCell(
      input.wetIceKg,
      sourceRefs.wetIceKg ?? EMPTY_OPS_SOURCE,
    ),
    dryIceKg: inputCell(
      input.dryIceKg,
      sourceRefs.dryIceKg ?? EMPTY_OPS_SOURCE,
    ),
    dutyFree: inputCell(
      input.dutyFree,
      sourceRefs.dutyFree ?? EMPTY_OPS_SOURCE,
    ),
    highlift: inputCell(
      input.highlift,
      sourceRefs.highlift ?? EMPTY_OPS_SOURCE,
    ),
    smallTruck: inputCell(
      input.smallTruck,
      sourceRefs.smallTruck ?? EMPTY_OPS_SOURCE,
    ),
    lastMinuteTopUp: inputCell(
      input.lastMinuteTopUp,
      sourceRefs.lastMinuteTopUp ?? EMPTY_OPS_SOURCE,
    ),
  }

  return {
    ...identity,
    operatingDate: effectiveDate,
    key: createFlightJoinKey({ ...identity, operatingDate: effectiveDate }),
    cells,
    amenityLabel: amenity.label,
    amenityPackageIds: amenity.packageIds,
  }
}

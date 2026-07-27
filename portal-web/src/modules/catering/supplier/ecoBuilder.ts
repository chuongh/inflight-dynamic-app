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

export function buildEcoSupplierRow(
  input: EcoSupplierInput,
  routeRulesInput: unknown,
): EcoSupplierRow {
  const parsedDate = parseProjectDate(input.operatingDate)
  const identity = normalizeFlightIdentity(input)
  const effectiveDate = parsedDate ?? input.operatingDate.trim()
  const parsedRules = parseEcoRouteRuleDataset(routeRulesInput)
  const routeRules = parsedRules.ok ? parsedRules.value : null
  const sourceRefs = input.sourceRefs ?? {}

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
  const reserveUtensils = inputCell(
    input.reserveUtensils,
    sourceRefs.reserveUtensils ?? 'Manual package/route reserve input',
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

  const hotmealUtensils = ecoCell(
    hotmealTotalValue,
    'AH hotmeal total',
  )

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
    ketchup: ecoCell(
      hotmealCells.spaghetti.value,
      'J spaghetti quantity',
    ),
    chiliSauce: ecoCell(
      hotmealTotalValue == null ? null : Math.ceil(hotmealTotalValue / 2),
      'ceil(AH hotmeal total / 2)',
    ),
    soySauce: ecoCell(
      hotmealTotalValue == null ? null : Math.ceil(hotmealTotalValue / 2),
      'ceil(AH hotmeal total / 2)',
    ),
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
  }
}

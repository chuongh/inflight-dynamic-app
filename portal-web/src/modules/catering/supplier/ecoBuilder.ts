import {
  derivedFrom,
  ecoCell,
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
  migrateEcoQuantityRules,
  type EcoQuantityEvalContext,
} from './ecoQuantityEval'
import type { EcoQuantityConfig, EcoUpliftType } from './ecoQuantityTypes'
import type {
  EcoCells,
  EcoSupplierInput,
  EcoSupplierRow,
  HotmealItemKey,
  SupplierCell,
} from './types'

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
  /** @deprecated Legacy EcoRouteRuleDataset — AU formulas now live in quantityRules. Kept for call-site compat. */
  _routeRulesInput?: unknown,
  quantityConfig?: EcoQuantityConfig | null,
): EcoSupplierRow {
  const parsedDate = parseProjectDate(input.operatingDate)
  const identity = normalizeFlightIdentity(input)
  const effectiveDate = parsedDate ?? input.operatingDate.trim()
  const sourceRefs = input.sourceRefs ?? {}
  const amenityConfig = quantityConfig?.amenity ?? DEFAULT_ECO_AMENITY_CONFIG
  const quantityRules = migrateEcoQuantityRules(
    quantityConfig?.quantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
  )
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
  const banhMiCommercial = inputCell(
    input.quotaBanhMi,
    sourceRefs.quotaBanhMi ?? 'Commercial quota · bánh mì (salesQuota.banhMi)',
  )
  const traSuaCommercial = inputCell(
    input.quotaTraSua,
    sourceRefs.quotaTraSua ?? 'Commercial quota · trà sữa (salesQuota.traSua)',
  )
  const breadPrebook = inputCell(
    input.breadPrebook,
    sourceRefs.breadPrebook ?? 'Ungrouped flight premeal breakdown; Bánh mì',
  )

  const hotmealValues = HOTMEAL_KEYS.map((key) => hotmealCells[key].value)
  const hotmealTotalValue = sumHotmealItems(hotmealValues)
  const hotmealTotal = ecoCell(
    hotmealTotalValue,
    'Sum of 14 hotmeal items; bread excluded',
  )

  const columnSnapshot: Record<string, number | null> = {
    spaghetti: hotmealCells.spaghetti.value,
    skyboss: skyboss.value,
    prebook: prebook.value,
    // Bánh mì's raw prebook count — seeded here (not as a "metric") so a
    // formula can reference it as `column: 'bread'`, same as any other dish.
    // Overwritten below with the rule-computed final quantity once the bread
    // rule itself has run, so *later* rules that reference bread see the
    // final output, not the raw prebook count.
    bread: breadPrebook.value,
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

  const resolveRuleCell = (
    target: string,
    fallbackSource: string,
  ): SupplierCell<number> => {
    const rule = ruleByTarget(target)
    if (!rule) return ecoCell(null, `${target} rule not configured`)
    const resolved = evalQuantityRule(rule, evalCtx)
    return ecoCell(resolved.value, resolved.source || fallbackSource)
  }

  let bread: SupplierCell<number>
  if (input.workbookReferenceBread != null) {
    // Confirmed final count straight from the finalized workbook — outranks the formula.
    bread = ecoCell(
      input.workbookReferenceBread,
      `${sourceRefs.workbookReferenceBread ?? 'Workbook bread column'}; workbookReferenceBread`,
    )
  } else {
    bread = resolveRuleCell('bread', 'breadPrebook')
  }

  const ketchup = resolveRuleCell('ketchup', 'J spaghetti quantity')
  const chiliSauce = resolveRuleCell('chiliSauce', 'ceil(AH hotmeal total / 2)')
  const soySauce = resolveRuleCell('soySauce', 'ceil(AH hotmeal total / 2)')
  const hotmealUtensils = resolveRuleCell('hotmealUtensils', 'AH hotmeal total')

  // Keep derived columns visible to later rules (e.g. indian salt ← soySauce).
  evalCtx.columns.ketchup = ketchup.value
  evalCtx.columns.chiliSauce = chiliSauce.value
  evalCtx.columns.soySauce = soySauce.value
  evalCtx.columns.hotmealUtensils = hotmealUtensils.value
  evalCtx.columns.bread = bread.value

  const boiledEggsRule = ruleByTarget('boiledEggs')
  let boiledEggs: SupplierCell<number>
  if (input.boiledEggs != null) {
    boiledEggs = inputCell(input.boiledEggs, sourceRefs.boiledEggs ?? 'Operational input')
  } else if (boiledEggsRule) {
    const resolved = evalQuantityRule(boiledEggsRule, evalCtx)
    boiledEggs = ecoCell(resolved.value, resolved.source)
  } else {
    boiledEggs = inputCell(null, sourceRefs.boiledEggs ?? 'Operational input')
  }

  const skybossEggs = resolveRuleCell('skybossEggs', 'SkyBoss ECO on AU routes')
  const australiaNoodleVegetables = resolveRuleCell(
    'australiaNoodleVegetables',
    'AU noodle vegetables const',
  )
  const australiaSkybossYogurt = resolveRuleCell(
    'australiaSkybossYogurt',
    'SkyBoss ECO on AU routes',
  )
  const australiaRoundBread = resolveRuleCell(
    'australiaRoundBread',
    'SkyBoss ECO on AU routes',
  )

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

  const reserveCrewWaterRule = ruleByTarget('reserveCrewWater')
  let reserveCrewWater: SupplierCell<number>
  if (input.reserveCrewWater != null) {
    reserveCrewWater = inputCell(
      input.reserveCrewWater,
      sourceRefs.reserveCrewWater ?? EMPTY_OPS_SOURCE,
    )
  } else if (reserveCrewWaterRule) {
    const resolved = evalQuantityRule(reserveCrewWaterRule, evalCtx)
    reserveCrewWater = ecoCell(resolved.value, resolved.source)
  } else {
    reserveCrewWater = inputCell(null, sourceRefs.reserveCrewWater ?? EMPTY_OPS_SOURCE)
  }

  const prebookCashews = resolveRuleCell('prebookCashews', 'AQ total prebook')

  let freshWater: SupplierCell<number>
  if (input.freshWaterOverride != null) {
    freshWater = ecoCell(
      input.freshWaterOverride,
      'Manual freshWaterOverride',
    )
  } else {
    freshWater = resolveRuleCell('freshWater', 'AY = totalPrebook')
  }

  const maccaSkybossRaisins = resolveRuleCell(
    'maccaSkybossRaisins',
    'AR = skybossEco',
  )
  const maccaKazSalted = resolveRuleCell('maccaKazSalted', 'AS Macca muối KAZ')
  const blanket3in1Prebook = resolveRuleCell(
    'blanket3in1Prebook',
    'AX = totalPrebook (approx)',
  )

  const manualSnack = (value: number | null | undefined, label: string) =>
    inputCell(value, `Manual/operational input; ${label}`)

  const cells: EcoCells = {
    ...hotmealCells,
    bread,
    banhMiCommercial,
    traSuaCommercial,
    boiledEggs,
    skybossEggs,
    totalEggs: ecoCell(
      derivedFrom(
        [boiledEggs.value, skybossEggs.value],
        ([boiled, skybossValue]) => boiled + skybossValue,
      ),
      'AD boiled eggs + AE SkyBoss eggs',
    ),
    australiaNoodleVegetables,
    australiaSkybossYogurt,
    australiaRoundBread,
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
    quotaCommercial: quota,
    prebookCashews,
    freshWater,
    maccaSkybossRaisins,
    maccaKazSalted,
    charterSnack: manualSnack(input.charterSnack, 'AT Snack charter'),
    wine: manualSnack(input.wine, 'AU Rượu vang'),
    blanketCSkyboss: manualSnack(input.blanketCSkyboss, 'AV Chăn C SkyBoss'),
    blanket3in1Prebook,
    maccaRegular: manualSnack(input.maccaRegular, 'BA Macca thường'),
    mangoChiliSaltGdsDeluxe: manualSnack(
      input.mangoChiliSaltGdsDeluxe,
      'BB Xoài muối ớt GDS/DELUXE',
    ),
    beerSnackComboBC: manualSnack(input.beerSnackComboBC, 'BC Bia + khô gà + snack'),
    sodaMaccaComboBD: manualSnack(input.sodaMaccaComboBD, 'BD Soda dâu + Macca'),
    reserveCrewWater,
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

  // Catalog-only targets are evaluated after fixed cells so they can reference
  // any regular ECO result while remaining independent from workbook columns.
  Object.assign(
    evalCtx.columns,
    Object.fromEntries(Object.entries(cells).map(([key, cell]) => [key, cell.value])),
  )
  const dynamicCells: Record<string, SupplierCell<number>> = {}
  for (const rule of quantityRules) {
    if (!rule.enabled || !rule.targetColumn.startsWith('catalog:')) continue
    const resolved = evalQuantityRule(rule, evalCtx)
    dynamicCells[rule.targetColumn] = ecoCell(resolved.value, resolved.source)
    evalCtx.columns[rule.targetColumn] = resolved.value
  }

  return {
    ...identity,
    operatingDate: effectiveDate,
    key: createFlightJoinKey({ ...identity, operatingDate: effectiveDate }),
    cells,
    dynamicCells,
    amenityLabel: amenity.label,
    amenityPackageIds: amenity.packageIds,
  }
}

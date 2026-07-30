import { groupOrigin } from '../grouping'
import type { DayGrouping, FlightLeg, SupplierLegExtension } from '../groupingTypes'
import { isBreadMealName, mapMealNameToHotmealField } from './ecoSupplyRegistry'
import type { HotmealInput, SupplierFlightInput } from './types'

function mapLegToInput(
  operatingDate: string,
  leg: FlightLeg,
  aircraftType?: string,
  groupId?: string,
): SupplierFlightInput {
  const s: SupplierLegExtension = leg.supplier ?? {}
  const hotmealFromMeals: HotmealInput | undefined = (() => {
    if (s.hotmealItems && Object.keys(s.hotmealItems).length > 0) return s.hotmealItems
    if (!leg.meals?.length) return undefined
    const hotmealItems: HotmealInput = {}
    for (const m of leg.meals) {
      const field = mapMealNameToHotmealField(m.name)
      if (!field) continue
      const key = field as keyof HotmealInput
      hotmealItems[key] = (hotmealItems[key] ?? 0) + m.count
    }
    return Object.keys(hotmealItems).length > 0 ? hotmealItems : undefined
  })()
  // Bánh mì's own prebook count from the ungrouped flight's per-dish premeal
  // breakdown (kept at leg level through grouping) — not the flight's total
  // prebook (that's every dish combined, not just bread).
  const breadPrebookFromMeals: number | null = (() => {
    if (!leg.meals?.length) return null
    const total = leg.meals
      .filter((m) => isBreadMealName(m.name))
      .reduce((sum, m) => sum + m.count, 0)
    return total > 0 ? total : null
  })()

  return {
    operatingDate,
    groupId,
    flightNo: leg.flightNo,
    dep: leg.dep,
    arr: leg.arr,
    aircraftType: s.aircraftType ?? aircraftType ?? null,
    upliftType: s.upliftType ?? null,
    flightKind: s.flightKind ?? null,
    amenityOverride: s.amenityOverride ?? null,
    quotaCommercial: s.quotaCommercial ?? leg.salesQuota?.hotmeal ?? null,
    totalPrebook: s.totalPrebook ?? leg.premeal ?? null,
    skybossEco: s.skybossEco,
    businessPax: s.businessPax,
    deluxePax: s.deluxePax,
    boiledEggs: s.boiledEggs,
    reserveUtensils: s.reserveUtensils,
    workbookReferenceBread: s.workbookReferenceBread,
    breadPrebook: s.breadPrebook ?? breadPrebookFromMeals,
    hotmealItems: hotmealFromMeals,
    australiaBeefFreshVegetables: s.australiaBeefFreshVegetables,
    australiaBreadVegetables: s.australiaBreadVegetables,
    freshWaterOverride: s.freshWaterOverride,
    maccaSkybossRaisins: s.maccaSkybossRaisins,
    maccaKazSalted: s.maccaKazSalted,
    charterSnack: s.charterSnack,
    wine: s.wine,
    blanketCSkyboss: s.blanketCSkyboss,
    blanket3in1Prebook: s.blanket3in1Prebook,
    maccaRegular: s.maccaRegular,
    mangoChiliSaltGdsDeluxe: s.mangoChiliSaltGdsDeluxe,
    beerSnackComboBC: s.beerSnackComboBC,
    sodaMaccaComboBD: s.sodaMaccaComboBD,
    reserveCrewWater: s.reserveCrewWater,
    smallIceBox: s.smallIceBox,
    largeIceBox: s.largeIceBox,
    wetIceKg: s.wetIceKg,
    dryIceKg: s.dryIceKg,
    dutyFree: s.dutyFree,
    highlift: s.highlift,
    smallTruck: s.smallTruck,
    lastMinuteTopUp: s.lastMinuteTopUp,
    sbbCocktail: s.sbbCocktail,
    sbbMaccaRaisins: s.sbbMaccaRaisins,
    sbbUtensils: s.sbbUtensils,
    sbbKit: s.sbbKit,
    sbbPillow: s.sbbPillow,
    sbbMattress: s.sbbMattress,
    sbbMealType: s.sbbMealType,
    crewHeadcount:
      leg.cockpitCrew?.length ??
      (leg.cockpit != null || leg.extra != null
        ? (leg.cockpit ?? 0) + (leg.extra ?? 0)
        : null),
    sourceRefs: s.sourceRefs,
  }
}

/**
 * Flatten confirmed groups at `station` into supplier workbook inputs.
 * `pendingCount` counts legs in unconfirmed groups whose origin is `station`.
 */
export function flightGroupsToSupplierInputs(
  day: DayGrouping,
  station: string,
): { inputs: SupplierFlightInput[]; pendingCount: number } {
  const inputs: SupplierFlightInput[] = []
  let pendingCount = 0

  for (const group of day.groups) {
    if (groupOrigin(group) !== station) continue
    if (group.confirmed) {
      for (const leg of group.legs) {
        inputs.push(mapLegToInput(day.serviceDate, leg, group.aircraftType, group.id))
      }
    } else {
      pendingCount += group.legs.length
    }
  }

  return { inputs, pendingCount }
}

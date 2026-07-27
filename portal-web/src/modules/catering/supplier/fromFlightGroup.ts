import { groupOrigin } from '../grouping'
import type { DayGrouping, FlightLeg, SupplierLegExtension } from '../groupingTypes'
import type { SupplierFlightInput } from './types'

function mapLegToInput(operatingDate: string, leg: FlightLeg): SupplierFlightInput {
  const s: SupplierLegExtension = leg.supplier ?? {}
  return {
    operatingDate,
    flightNo: leg.flightNo,
    dep: leg.dep,
    arr: leg.arr,
    quotaCommercial: s.quotaCommercial,
    totalPrebook: s.totalPrebook ?? leg.premeal ?? null,
    skybossEco: s.skybossEco,
    businessPax: s.businessPax,
    boiledEggs: s.boiledEggs,
    reserveUtensils: s.reserveUtensils,
    workbookReferenceBread: s.workbookReferenceBread,
    hotmealItems: s.hotmealItems,
    australiaBeefFreshVegetables: s.australiaBeefFreshVegetables,
    australiaBreadVegetables: s.australiaBreadVegetables,
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
        inputs.push(mapLegToInput(day.serviceDate, leg))
      }
    } else {
      pendingCount += group.legs.length
    }
  }

  return { inputs, pendingCount }
}

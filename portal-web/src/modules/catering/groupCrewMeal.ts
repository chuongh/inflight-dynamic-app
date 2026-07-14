/**
 * Bridge: run the real UC-06 crew-meal engine (BRule-04/26-29, configured on
 * the Catering → Config → Crew meal tab) against a flight-grouping rotation.
 * No invented rule — meals = counted crew × meal windows the duty span hits.
 */
import { simulateCrewMeal, type SimulationResult } from './crewMeal'
import type { CrewMealProfile, SampleRotation } from './crewMealTypes'
import { groupCockpitHeadcount, groupCockpitRoster } from './grouping'
import type { FlightGroup } from './groupingTypes'

/** Build a simulator rotation from a group (day offsets from the +1 flags). */
export function groupToRotation(group: FlightGroup): SampleRotation {
  const roster = groupCockpitRoster(group)
  // Prefer the real named roster: the engine dedupes by employee code, so
  // feeding actual pilots makes the meal count auditable against names.
  const crew =
    roster.length > 0
      ? roster.map((m) => ({
          name: m.name,
          code: m.code,
          column: (m.riding ? 'positioning' : 'cockpit') as const,
        }))
      : (() => {
          // Fallback: fabricate anonymous crew from per-leg counts.
          const { operating, riding } = groupCockpitHeadcount(group)
          return [
            ...Array.from({ length: operating }, (_, i) => ({
              name: `CP/FO ${i + 1}`,
              code: `OP${group.id}-${i + 1}`,
              column: 'cockpit' as const,
            })),
            ...Array.from({ length: riding }, (_, i) => ({
              name: `Riding ${i + 1}`,
              code: `PX${group.id}-${i + 1}`,
              column: 'positioning' as const,
            })),
          ]
        })()
  return {
    id: group.id,
    label: group.aircraft,
    date: '',
    legs: group.legs.map((l) => ({
      flightNo: l.flightNo,
      from: l.dep,
      to: l.arr,
      std: l.std,
      sta: l.sta,
      depDay: l.stdNextDay ? 1 : 0,
      arrDay: l.staNextDay ? 1 : 0,
    })),
    crew,
  }
}

/** Crew meals for a group under the active cockpit profile. */
export function computeGroupCrewMeals(
  group: FlightGroup,
  profile: CrewMealProfile,
): SimulationResult {
  return simulateCrewMeal(groupToRotation(group), profile)
}

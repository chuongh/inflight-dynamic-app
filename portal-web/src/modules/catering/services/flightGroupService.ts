import type { FlightGroupDataset } from '../groupingTypes'

/** Data-source-agnostic contract for the UC-11 flight-grouping dataset. */
export interface FlightGroupService {
  getFlightGroups(): Promise<FlightGroupDataset>
  saveFlightGroups(dataset: FlightGroupDataset): Promise<void>
}

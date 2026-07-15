import type { CateringStationConfig } from '../../modules/catering/stationTypes'
import stationsJson from '../catering/catering-stations.json'

/** Static catering-station config — which airports can uplift meals. */
export function getCateringStations(): CateringStationConfig {
  return stationsJson as CateringStationConfig
}

import type {
  AmenityPackageDef,
  EcoAmenityConfig,
  RouteHourClass,
  SupplierRouteGroup,
} from './ecoQuantityTypes'

/** LIST ĐƯỜNG BAY THEO GIỜ from GC-SGN ECO 08 JUL VER 04.xlsx */
export const DEFAULT_ROUTE_HOUR_CLASSES: RouteHourClass[] = [
  {
    id: 'DOM_LE_1H15',
    label: 'Quốc nội ≤ 1h15',
    routes: [
      'SGN-BMV-SGN',
      'SGN-CXR-SGN',
      'SGN-PQC-SGN',
      'SGN-PXU-SGN',
      'SGN-UIH-SGN',
      'SGN-VCS-SGN',
    ],
  },
  {
    id: 'DOM_GT_1H15',
    label: 'Quốc nội > 1h15',
    routes: [
      'SGN-DAD-SGN',
      'SGN-HAN-SGN',
      'SGN-HPH-SGN',
      'SGN-HUI-SGN',
      'SGN-THD-SGN',
      'SGN-VCL-SGN',
      'SGN-VDH-SGN',
      'SGN-VII-SGN',
    ],
  },
  {
    id: 'INT_LT_4H',
    label: 'Quốc tế < 4h',
    routes: [
      'SGN-BKK-SGN',
      'SGN-CAN-SGN',
      'SGN-DPS-SGN',
      'SGN-ENH-SGN',
      'SGN-HKG-SGN',
      'SGN-HKT-SGN',
      'SGN-KHH-SGN',
      'SGN-KUL-SGN',
      'SGN-KWL-SGN',
      'SGN-LJG-SGN',
      'SGN-MNL-SGN',
      'SGN-RMQ-SGN',
      'SGN-SIN-SGN',
      'SGN-TPE-SGN',
      'SGN-VTE-SGN',
    ],
  },
  {
    id: 'INT_GE_4H',
    label: 'Quốc tế ≥ 4h',
    routes: [
      'SGN-AMD-SGN',
      'SGN-BLR-SGN',
      'SGN-BOM-SGN',
      'SGN-CGK-SGN',
      'SGN-HND-SGN',
      'SGN-HYD-SGN',
      'SGN-ICN-SGN',
      'SGN-KIX-SGN',
      'SGN-NRT-SGN',
      'SGN-PER-SGN',
      'SGN-PKX-SGN',
      'SGN-PUS-SGN',
      'SGN-PVG-SGN',
    ],
  },
]

export const DEFAULT_ROUTE_GROUPS: SupplierRouteGroup[] = [
  { id: 'AU', label: 'Úc', airports: ['BNE', 'MEL', 'SYD'] },
  { id: 'KAZ', label: 'KAZ', airports: ['ALA', 'NQZ'] },
  { id: 'IN', label: 'Ấn', airports: ['AMD', 'BLR', 'BOM', 'COK', 'DEL', 'HYD'] },
  { id: 'KR_JP', label: 'Hàn/Nhật', airports: ['ICN', 'NRT', 'KIX', 'HND', 'PUS'] },
  { id: 'RU', label: 'Nga', airports: ['SVO', 'VVO', 'OVB'] },
]

/** Package legend from sheets A321 / A330 */
export const DEFAULT_AMENITY_PACKAGES: AmenityPackageDef[] = [
  { id: 1, label: 'Vật tư đầu ngày (theo tàu)', aircraftFamily: 'A321', kind: 'aircraft_day_start' },
  { id: 2, label: 'Quốc nội ≤ 1h15', aircraftFamily: 'A321', kind: 'route_hour', hourClassId: 'DOM_LE_1H15' },
  { id: 3, label: 'Quốc nội > 1h15', aircraftFamily: 'A321', kind: 'route_hour', hourClassId: 'DOM_GT_1H15' },
  { id: 4, label: 'Quốc tế < 4h', aircraftFamily: 'A321', kind: 'route_hour', hourClassId: 'INT_LT_4H' },
  { id: 5, label: 'Quốc tế ≥ 4h', aircraftFamily: 'A321', kind: 'route_hour', hourClassId: 'INT_GE_4H' },
  { id: 6, label: 'Charter Trung Quốc (full meal)', aircraftFamily: 'A321', kind: 'charter_china' },
  { id: 7, label: 'Nga', aircraftFamily: 'A321', kind: 'russia' },
  { id: 8, label: 'Ferry/Cargo', aircraftFamily: 'A321', kind: 'ferry_cargo' },
  { id: 9, label: 'Nightstop', aircraftFamily: 'A321', kind: 'nightstop' },
  { id: 10, label: 'Vật tư đầu ngày (theo tàu)', aircraftFamily: 'A330', kind: 'aircraft_day_start' },
  { id: 11, label: 'Quốc nội', aircraftFamily: 'A330', kind: 'route_hour', hourClassId: 'DOM_LE_1H15' },
  { id: 12, label: 'Quốc tế (Hàn/Nhật/Ấn)', aircraftFamily: 'A330', kind: 'route_hour', hourClassId: 'INT_GE_4H' },
  { id: 13, label: 'Kazakhstan', aircraftFamily: 'A330', kind: 'kazakhstan' },
  { id: 14, label: 'Nga', aircraftFamily: 'A330', kind: 'russia' },
  { id: 15, label: 'Úc', aircraftFamily: 'A330', kind: 'australia' },
  { id: 16, label: 'Ferry/Cargo', aircraftFamily: 'A330', kind: 'ferry_cargo' },
  { id: 17, label: 'Nightstop', aircraftFamily: 'A330', kind: 'nightstop' },
]

export const DEFAULT_ECO_AMENITY_CONFIG: EcoAmenityConfig = {
  routeHourClasses: DEFAULT_ROUTE_HOUR_CLASSES,
  packages: DEFAULT_AMENITY_PACKAGES,
  routeGroups: DEFAULT_ROUTE_GROUPS,
}

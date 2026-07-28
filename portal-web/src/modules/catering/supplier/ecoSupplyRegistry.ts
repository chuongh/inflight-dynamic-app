/**
 * ECO supply line registry: maps ecoBuilder cell keys → Catalog product codes
 * and groups using the same categories as Meal / Amenity catalogs.
 */
import type { MealItemCategory } from '../catalogTypes'
import type { EcoCells } from './types'

/** Supply section id — meal catalog categories + amenity / composition / misc. */
export type EcoSupplyGroupId =
  | MealItemCategory
  | 'amenity'
  | 'amenity_composition'
  | 'other'

export type EcoSupplyFieldKey = keyof EcoCells

export interface EcoSupplyFieldDef {
  field: EcoSupplyFieldKey
  productCode: string | null
  /** When productCode is null, resolve name via meal/amenity catalog id. */
  catalogItemId?: string | null
  /** Fallback label when catalog lookup misses */
  fallbackNameVi: string
  /** Used when catalog item has no category (or non-SKU metrics). */
  group: EcoSupplyGroupId
  catalog: 'meal' | 'amenity' | 'none'
  /** Emit a 0-qty line so ops can enter values on the order. */
  includeZero?: boolean
}

/** Ordered fields shown on the ECO supply page. */
export const ECO_SUPPLY_FIELDS: readonly EcoSupplyFieldDef[] = [
  { field: 'spaghetti', productCode: 'HM9', fallbackNameVi: 'Mì Ý', group: 'eco_main', catalog: 'meal' },
  { field: 'glassNoodles', productCode: 'HM5', fallbackNameVi: 'Miến xào', group: 'eco_main', catalog: 'meal' },
  { field: 'banhChung', productCode: 'HM8', fallbackNameVi: 'Bánh chưng', group: 'eco_main', catalog: 'meal' },
  { field: 'stirFriedNoodles', productCode: 'HM6', fallbackNameVi: 'Bún xào', group: 'eco_main', catalog: 'meal' },
  { field: 'thaiFriedRice', productCode: 'HM7', fallbackNameVi: 'Cơm chiên Thái', group: 'eco_main', catalog: 'meal' },
  { field: 'savoryStickyRice', productCode: 'HM2', fallbackNameVi: 'Xôi mặn', group: 'eco_main', catalog: 'meal' },
  { field: 'khucStickyRice', productCode: 'HM1', fallbackNameVi: 'Xôi khúc', group: 'eco_main', catalog: 'meal' },
  { field: 'beefRice', productCode: 'HM4', fallbackNameVi: 'Cơm bò', group: 'eco_main', catalog: 'meal' },
  { field: 'coconutRice', productCode: 'HM3', fallbackNameVi: 'Cơm dừa Malaysia', group: 'eco_main', catalog: 'meal' },
  {
    field: 'indianPotatoParatha',
    productCode: 'HM14',
    fallbackNameVi: 'Khoai viên chay Ấn + Paratha',
    group: 'eco_main',
    catalog: 'meal',
  },
  { field: 'chickenCurry', productCode: 'HM12', fallbackNameVi: 'Cơm cà ri gà', group: 'eco_main', catalog: 'meal' },
  { field: 'fishCurry', productCode: 'HM15', fallbackNameVi: 'Cơm cà ri cá', group: 'eco_main', catalog: 'meal' },
  {
    field: 'vegetarianYangzhouRice',
    productCode: 'HM11',
    fallbackNameVi: 'Cơm chiên Dương Châu chay',
    group: 'eco_main',
    catalog: 'meal',
  },
  {
    field: 'vegetarianBasmatiCurry',
    productCode: 'HM13',
    fallbackNameVi: 'Cơm Basmati cà ri chay',
    group: 'eco_main',
    catalog: 'meal',
  },
  {
    field: 'australiaBeefFreshVegetables',
    productCode: '40000403',
    fallbackNameVi: 'Thịt bò + rau tươi',
    group: 'eco_main',
    catalog: 'meal',
  },
  {
    field: 'australiaNoodleVegetables',
    productCode: 'HM22',
    fallbackNameVi: 'Rau ăn mỳ/phở (Úc)',
    group: 'eco_main',
    catalog: 'meal',
  },
  {
    field: 'australiaBreadVegetables',
    productCode: 'HM23',
    fallbackNameVi: 'Rau ăn bánh mì (Úc)',
    group: 'eco_main',
    catalog: 'meal',
  },

  { field: 'bread', productCode: '40000294', fallbackNameVi: 'Bánh mì', group: 'bread', catalog: 'meal' },
  {
    field: 'australiaRoundBread',
    productCode: null,
    fallbackNameVi: 'Bánh mì tròn + bơ lạc',
    group: 'bread',
    catalog: 'none',
  },

  { field: 'boiledEggs', productCode: '40000261', fallbackNameVi: 'Trứng luộc', group: 'snack', catalog: 'meal' },
  { field: 'skybossEggs', productCode: null, fallbackNameVi: 'Trứng SkyBoss', group: 'dessert', catalog: 'none' },
  { field: 'totalEggs', productCode: null, fallbackNameVi: 'Tổng trứng', group: 'dessert', catalog: 'none' },
  {
    field: 'australiaSkybossYogurt',
    productCode: null,
    fallbackNameVi: 'Yogurt Sky Úc',
    group: 'dessert',
    catalog: 'none',
  },

  { field: 'ketchup', productCode: 'DC07', fallbackNameVi: 'Tương cà', group: 'condiment', catalog: 'meal' },
  { field: 'chiliSauce', productCode: 'DC06', fallbackNameVi: 'Tương ớt', group: 'condiment', catalog: 'meal' },
  { field: 'soySauce', productCode: 'DC08', fallbackNameVi: 'Xì dầu', group: 'condiment', catalog: 'meal' },
  {
    field: 'indianSaltPepper',
    productCode: 'DC10',
    fallbackNameVi: 'Muối tiêu (đường Ấn)',
    group: 'condiment',
    catalog: 'meal',
  },

  {
    field: 'prebookCashews',
    productCode: null,
    catalogItemId: 'meal-hat-dieu-prebook',
    fallbackNameVi: 'Hạt điều Prebook',
    group: 'snack',
    catalog: 'meal',
  },
  {
    field: 'freshWater',
    productCode: null,
    catalogItemId: 'meal-suoi-350ml-sboss-prebook',
    fallbackNameVi: 'Suối 350ml (sboss+prebook)',
    group: 'drink',
    catalog: 'meal',
  },
  {
    field: 'maccaSkybossRaisins',
    productCode: null,
    catalogItemId: 'meal-macca-nho-kho-sboss',
    fallbackNameVi: 'Macca nho khô SkyBoss',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'maccaKazSalted',
    productCode: null,
    catalogItemId: 'meal-macca-muoi-kaz',
    fallbackNameVi: 'Macca muối KAZ',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'charterSnack',
    productCode: null,
    fallbackNameVi: 'Snack khoai tây/trái cây sấy',
    group: 'snack',
    catalog: 'none',
    includeZero: true,
  },
  {
    field: 'wine',
    productCode: null,
    catalogItemId: 'meal-ruou-vang',
    fallbackNameVi: 'Rượu vang',
    group: 'drink',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'blanketCSkyboss',
    productCode: null,
    catalogItemId: 'amn-chan-c-skyboss',
    fallbackNameVi: 'Chăn C SkyBoss',
    group: 'amenity',
    catalog: 'amenity',
    includeZero: true,
  },
  {
    field: 'blanket3in1Prebook',
    productCode: null,
    catalogItemId: 'amn-chan-3in1-prebook',
    fallbackNameVi: 'Chăn 3in1 Prebook',
    group: 'amenity',
    catalog: 'amenity',
    includeZero: true,
  },
  {
    field: 'maccaRegular',
    productCode: null,
    catalogItemId: 'meal-macca-thuong',
    fallbackNameVi: 'Macca thường',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'mangoChiliSaltGdsDeluxe',
    productCode: null,
    catalogItemId: 'meal-xoai-muoi-ot-gds-deluxe',
    fallbackNameVi: 'Xoài muối ớt GDS/DELUXE',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'beerSnackComboBC',
    productCode: null,
    fallbackNameVi: 'Bia + khô gà + snack chả giò',
    group: 'snack',
    catalog: 'none',
    includeZero: true,
  },
  {
    field: 'sodaMaccaComboBD',
    productCode: null,
    fallbackNameVi: 'Soda dâu + Macca',
    group: 'snack',
    catalog: 'none',
    includeZero: true,
  },

  {
    field: 'reserveCrewWater',
    productCode: '30000100',
    fallbackNameVi: 'Suối tổ bay 1.5L',
    group: 'drink',
    catalog: 'meal',
  },

  {
    field: 'hotmealUtensils',
    productCode: null,
    fallbackNameVi: 'Bộ thìa dĩa tăm (theo hotmeal)',
    group: 'amenity',
    catalog: 'none',
  },
  {
    field: 'reserveUtensils',
    productCode: null,
    fallbackNameVi: 'Bộ thìa dĩa tăm dự phòng',
    group: 'amenity',
    catalog: 'none',
  },
  {
    field: 'totalUtensils',
    productCode: 'DC04',
    fallbackNameVi: 'Tổng bộ thìa, dĩa, tăm',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'smallIceBox',
    productCode: 'DC02',
    fallbackNameVi: 'Thùng xốp nhỏ',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'largeIceBox',
    productCode: 'DC01',
    fallbackNameVi: 'Thùng xốp lớn',
    group: 'amenity',
    catalog: 'amenity',
  },
  { field: 'wetIceKg', productCode: 'DC09', fallbackNameVi: 'Đá ướt (kg)', group: 'amenity', catalog: 'amenity' },
  { field: 'dryIceKg', productCode: 'DC03', fallbackNameVi: 'Đá khô (kg)', group: 'amenity', catalog: 'amenity' },
  { field: 'dutyFree', productCode: null, fallbackNameVi: 'Duty Free', group: 'amenity', catalog: 'none' },
  { field: 'highlift', productCode: 'HL', fallbackNameVi: 'Xe highlift', group: 'amenity', catalog: 'amenity' },
  { field: 'smallTruck', productCode: 'TO', fallbackNameVi: 'Xe tải nhỏ', group: 'amenity', catalog: 'amenity' },
  {
    field: 'lastMinuteTopUp',
    productCode: 'TOL',
    fallbackNameVi: 'Top-up giờ chót',
    group: 'amenity',
    catalog: 'amenity',
  },

  { field: 'skyboss', productCode: null, fallbackNameVi: 'SkyBoss (pax)', group: 'other', catalog: 'none' },
] as const

/** Same order as Meal Catalog categories, then amenity / other. */
export const ECO_SUPPLY_GROUP_ORDER: readonly EcoSupplyGroupId[] = [
  'eco_main',
  'sbb_main',
  'appetizer',
  'dessert',
  'bread',
  'drink',
  'snack',
  'condiment',
  'amenity',
  'amenity_composition',
  'other',
]

/** Map FlightView dish names → hotmeal field keys. */
const MEAL_NAME_TO_FIELD: Array<{ match: RegExp; field: EcoSupplyFieldKey }> = [
  { match: /m[iì]\s*[ýy]|spaghetti|mỳ\s*[ýy]/i, field: 'spaghetti' },
  { match: /miến/i, field: 'glassNoodles' },
  { match: /bánh\s*chưng/i, field: 'banhChung' },
  { match: /bún\s*xào|bun\s*xao/i, field: 'stirFriedNoodles' },
  { match: /chiên\s*thái|thai\s*fried/i, field: 'thaiFriedRice' },
  { match: /xôi\s*mặn/i, field: 'savoryStickyRice' },
  { match: /xôi\s*khúc/i, field: 'khucStickyRice' },
  { match: /cơm\s*bò|com\s*bo/i, field: 'beefRice' },
  { match: /dừa|coconut/i, field: 'coconutRice' },
  { match: /paratha|khoai\s*viên/i, field: 'indianPotatoParatha' },
  { match: /cà\s*ri\s*gà|curry\s*gà|chicken\s*curry/i, field: 'chickenCurry' },
  { match: /cà\s*ri\s*cá|fish\s*curry/i, field: 'fishCurry' },
  { match: /dương\s*châu|yangzhou/i, field: 'vegetarianYangzhouRice' },
  { match: /basmati/i, field: 'vegetarianBasmatiCurry' },
]

export function mapMealNameToHotmealField(name: string): EcoSupplyFieldKey | null {
  const n = name.trim()
  for (const row of MEAL_NAME_TO_FIELD) {
    if (row.match.test(n)) return row.field
  }
  return null
}

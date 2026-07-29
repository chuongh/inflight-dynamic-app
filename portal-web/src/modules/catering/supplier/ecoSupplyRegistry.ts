/**
 * ECO supply line registry: maps ecoBuilder cell keys → Catalog items
 * and groups using the same categories as Meal / Amenity catalogs.
 *
 * Source of truth for product identity is `catalogItemId` (master data).
 * `productCode` is retained only as a fallback display / export hint when
 * the catalog cannot be loaded — do not treat it as the primary name key.
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
  /**
   * Fallback product code (from catalog at authoring time). Prefer resolving
   * via `catalogItemId`; do not invent codes that are absent from catalogs.
   */
  productCode: string | null
  /** Primary link into meal / amenity catalog master data. */
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
  {
    field: 'spaghetti',
    productCode: 'HM9',
    catalogItemId: 'sku-hm9',
    fallbackNameVi: 'Mì Ý',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'glassNoodles',
    productCode: 'HM5',
    catalogItemId: 'sku-hm5',
    fallbackNameVi: 'Miến xào',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'banhChung',
    productCode: 'HM8',
    catalogItemId: 'sku-hm8',
    fallbackNameVi: 'Bánh chưng',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'stirFriedNoodles',
    productCode: 'HM6',
    catalogItemId: 'sku-hm6',
    fallbackNameVi: 'Bún xào',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'thaiFriedRice',
    productCode: 'HM7',
    catalogItemId: 'sku-hm7',
    fallbackNameVi: 'Cơm chiên Thái',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'savoryStickyRice',
    productCode: 'HM2',
    catalogItemId: 'sku-hm2',
    fallbackNameVi: 'Xôi mặn',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'khucStickyRice',
    productCode: 'HM1',
    catalogItemId: 'sku-hm1',
    fallbackNameVi: 'Xôi khúc',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'beefRice',
    productCode: 'HM4',
    catalogItemId: 'sku-hm4',
    fallbackNameVi: 'Cơm bò',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'coconutRice',
    productCode: 'HM3',
    catalogItemId: 'sku-hm3',
    fallbackNameVi: 'Cơm dừa Malaysia',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'indianPotatoParatha',
    productCode: 'HM14',
    catalogItemId: 'sku-hm14',
    fallbackNameVi: 'Khoai viên chay Ấn + Paratha',
    group: 'vegetarian',
    catalog: 'meal',
  },
  {
    field: 'chickenCurry',
    productCode: 'HM12',
    catalogItemId: 'sku-hm12',
    fallbackNameVi: 'Cơm cà ri gà',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'fishCurry',
    productCode: 'HM15',
    catalogItemId: 'sku-hm15',
    fallbackNameVi: 'Cơm cà ri cá',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'vegetarianYangzhouRice',
    productCode: 'HM11',
    catalogItemId: 'sku-hm11',
    fallbackNameVi: 'Cơm chiên Dương Châu chay',
    group: 'vegetarian',
    catalog: 'meal',
  },
  {
    field: 'vegetarianBasmatiCurry',
    productCode: 'HM13',
    catalogItemId: 'sku-hm13',
    fallbackNameVi: 'Cơm Basmati cà ri chay',
    group: 'vegetarian',
    catalog: 'meal',
  },
  {
    field: 'australiaBeefFreshVegetables',
    productCode: '40000403',
    catalogItemId: 'sku-40000403',
    fallbackNameVi: 'Thịt bò + rau tươi',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'australiaNoodleVegetables',
    productCode: 'HM22',
    catalogItemId: 'sku-hm22',
    fallbackNameVi: 'Rau ăn mỳ/phở (Úc)',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'australiaBreadVegetables',
    productCode: 'HM23',
    catalogItemId: 'sku-hm23',
    fallbackNameVi: 'Rau ăn bánh mì (Úc)',
    group: 'main',
    catalog: 'meal',
  },

  {
    field: 'bread',
    productCode: '40000294',
    catalogItemId: 'sku-40000294',
    fallbackNameVi: 'Bánh mì',
    group: 'main',
    catalog: 'meal',
  },
  {
    field: 'australiaRoundBread',
    productCode: 'SBB9',
    catalogItemId: 'sku-sbb9',
    fallbackNameVi: 'Bánh mì tròn & bơ (truyền thống)',
    group: 'bread',
    catalog: 'meal',
  },

  {
    field: 'boiledEggs',
    productCode: '40000261',
    catalogItemId: 'sku-40000261',
    fallbackNameVi: 'Trứng luộc',
    group: 'snack',
    catalog: 'meal',
  },
  {
    field: 'skybossEggs',
    productCode: null,
    catalogItemId: 'meal-trung-skyboss',
    fallbackNameVi: 'Trứng SkyBoss',
    group: 'snack',
    catalog: 'meal',
  },
  {
    field: 'totalEggs',
    productCode: null,
    catalogItemId: 'meal-total-eggs',
    fallbackNameVi: 'Tổng trứng',
    group: 'snack',
    catalog: 'meal',
  },
  {
    field: 'australiaSkybossYogurt',
    productCode: 'SBB29',
    catalogItemId: 'sku-sbb29',
    fallbackNameVi: 'Yogurt (quốc tế / Sky Úc)',
    group: 'dessert',
    catalog: 'meal',
  },

  {
    field: 'ketchup',
    productCode: 'DC07',
    catalogItemId: 'sku-dc07',
    fallbackNameVi: 'Tương cà',
    group: 'condiment',
    catalog: 'meal',
  },
  {
    field: 'chiliSauce',
    productCode: 'DC06',
    catalogItemId: 'sku-dc06',
    fallbackNameVi: 'Tương ớt',
    group: 'condiment',
    catalog: 'meal',
  },
  {
    field: 'soySauce',
    productCode: 'DC08',
    catalogItemId: 'sku-dc08',
    fallbackNameVi: 'Xì dầu',
    group: 'condiment',
    catalog: 'meal',
  },
  {
    field: 'indianSaltPepper',
    productCode: 'DC10',
    catalogItemId: 'sku-dc10',
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
    catalogItemId: 'meal-snack-charter',
    fallbackNameVi: 'Snack khoai tây/trái cây sấy',
    group: 'snack',
    catalog: 'meal',
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
    catalogItemId: 'meal-bia-kho-ga-snack-cha-gio',
    fallbackNameVi: 'Bia + Khô gà + snack chả giò',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },
  {
    field: 'sodaMaccaComboBD',
    productCode: null,
    catalogItemId: 'meal-soda-dau-macca',
    fallbackNameVi: 'Soda Dâu + Macca',
    group: 'snack',
    catalog: 'meal',
    includeZero: true,
  },

  {
    field: 'reserveCrewWater',
    productCode: '30000100',
    catalogItemId: 'sku-30000100',
    fallbackNameVi: 'Suối tổ bay 1.5L',
    group: 'drink',
    catalog: 'meal',
  },

  {
    field: 'hotmealUtensils',
    productCode: null,
    catalogItemId: 'amn-bo-thia-dia-tam-theo-hotmeal-de-vao-tui-nilong-t',
    fallbackNameVi: 'Bộ thìa, dĩa, tăm theo hotmeal',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'reserveUtensils',
    productCode: null,
    catalogItemId: 'amn-bo-thia-dia-tam-cap-du-phong',
    fallbackNameVi: 'Bộ thìa, dĩa, tăm cấp dư phòng',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'totalUtensils',
    productCode: 'DC04',
    catalogItemId: 'amn-dc04',
    fallbackNameVi: 'Tổng bộ thìa, dĩa, tăm',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'smallIceBox',
    productCode: 'DC02',
    catalogItemId: 'amn-dc02',
    fallbackNameVi: 'Thùng xốp nhỏ',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'largeIceBox',
    productCode: 'DC01',
    catalogItemId: 'amn-dc01',
    fallbackNameVi: 'Thùng xốp lớn',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'wetIceKg',
    productCode: 'DC09',
    catalogItemId: 'amn-dc09',
    fallbackNameVi: 'Đá ướt (kg)',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'dryIceKg',
    productCode: 'DC03',
    catalogItemId: 'amn-dc03',
    fallbackNameVi: 'Đá khô (kg)',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'dutyFree',
    productCode: null,
    catalogItemId: 'amn-duty-free',
    fallbackNameVi: 'Duty Free',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'highlift',
    productCode: 'HL',
    catalogItemId: 'amn-hl',
    fallbackNameVi: 'Xe highlift',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'smallTruck',
    productCode: 'TO',
    catalogItemId: 'amn-to',
    fallbackNameVi: 'Xe tải nhỏ',
    group: 'amenity',
    catalog: 'amenity',
  },
  {
    field: 'lastMinuteTopUp',
    productCode: 'TOL',
    catalogItemId: 'amn-tol',
    fallbackNameVi: 'Top-up giờ chót',
    group: 'amenity',
    catalog: 'amenity',
  },

  { field: 'skyboss', productCode: null, fallbackNameVi: 'SkyBoss (pax)', group: 'other', catalog: 'none' },
  {
    field: 'prebook',
    productCode: null,
    catalogItemId: 'meal-prebook-total',
    fallbackNameVi: 'Prebook',
    group: 'other',
    catalog: 'meal',
  },
  // quotaCommercial is overview-only (StatStrip), not an ECO supply line.
] as const

/** EcoCells keys selectable as quantity-rule targets — each must have catalogItemId. */
export const ECO_QUANTITY_TARGET_COLUMNS = [
  'ketchup',
  'chiliSauce',
  'soySauce',
  'hotmealUtensils',
  'indianSaltPepper',
  'reserveUtensils',
  'bread',
  'prebookCashews',
  'freshWater',
  'australiaNoodleVegetables',
  'skybossEggs',
  'australiaSkybossYogurt',
  'australiaRoundBread',
  'maccaSkybossRaisins',
  'maccaKazSalted',
  'charterSnack',
  'wine',
  'blanketCSkyboss',
  'blanket3in1Prebook',
  'maccaRegular',
  'mangoChiliSaltGdsDeluxe',
  'beerSnackComboBC',
  'sodaMaccaComboBD',
  'boiledEggs',
  'totalEggs',
  'reserveCrewWater',
  'smallIceBox',
  'largeIceBox',
  'wetIceKg',
  'dryIceKg',
  'dutyFree',
  'highlift',
  'smallTruck',
  'lastMinuteTopUp',
] as const satisfies readonly EcoSupplyFieldKey[]

/**
 * Ground-ops / derived inputs that are intentionally always manual —
 * not treated as “missing a quantity rule”.
 */
export const ALWAYS_MANUAL_FIELDS = [
  'boiledEggs',
  'totalEggs',
  'reserveCrewWater',
  'smallIceBox',
  'largeIceBox',
  'wetIceKg',
  'dryIceKg',
  'dutyFree',
  'highlift',
  'smallTruck',
  'lastMinuteTopUp',
] as const satisfies readonly EcoSupplyFieldKey[]

/** Display label for an ECO supply field (registry fallback; catalog-neutral). */
export function ecoSupplyFieldDisplayName(field: string): string {
  const def = ECO_SUPPLY_FIELDS.find((f) => f.field === field)
  return def?.fallbackNameVi ?? field
}

/** Same order as Meal Catalog categories, then amenity / other. */
export const ECO_SUPPLY_GROUP_ORDER: readonly EcoSupplyGroupId[] = [
  'main',
  'vegetarian',
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

const BREAD_MEAL_NAME = /b[áàảãạăâ]nh\s*m[iìí]/i

/** Bánh mì is tracked in the premeal breakdown, not the 14-item hotmeal list — match it separately. */
export function isBreadMealName(name: string): boolean {
  return BREAD_MEAL_NAME.test(name.trim())
}

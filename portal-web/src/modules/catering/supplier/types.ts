export interface SupplierCell<T> {
  value: T | null
  source: string
}

export interface FlightIdentity {
  operatingDate: string
  flightNo: string
  dep: string
  arr: string
}

export type HotmealItemKey =
  | 'spaghetti'
  | 'glassNoodles'
  | 'banhChung'
  | 'stirFriedNoodles'
  | 'thaiFriedRice'
  | 'savoryStickyRice'
  | 'khucStickyRice'
  | 'beefRice'
  | 'coconutRice'
  | 'indianPotatoParatha'
  | 'chickenCurry'
  | 'fishCurry'
  | 'vegetarianYangzhouRice'
  | 'vegetarianBasmatiCurry'

export type HotmealInput = Partial<Record<HotmealItemKey, number | null>>

export interface SupplierSourceRefs {
  operatingDate?: string
  flightNo?: string
  dep?: string
  arr?: string
  hotmealItems?: string
  quotaCommercial?: string
  quotaBanhMi?: string
  quotaTraSua?: string
  totalPrebook?: string
  skybossEco?: string
  businessPax?: string
  boiledEggs?: string
  reserveUtensils?: string
  workbookReferenceBread?: string
  breadPrebook?: string
  reserveCrewWater?: string
  smallIceBox?: string
  largeIceBox?: string
  wetIceKg?: string
  dryIceKg?: string
  dutyFree?: string
  highlift?: string
  smallTruck?: string
  lastMinuteTopUp?: string
}

/** ECO workbook amenity / ground-ops columns (Suối TV … Top-up). */
export interface EcoAmenityOpsInput {
  reserveCrewWater?: number | null
  smallIceBox?: number | null
  largeIceBox?: number | null
  wetIceKg?: number | null
  dryIceKg?: number | null
  dutyFree?: number | null
  highlift?: number | null
  smallTruck?: number | null
  lastMinuteTopUp?: number | null
}

/** §1.5 snack / prebook / water — mostly manual until formulas are confirmed. */
export interface EcoSnackOpsInput {
  /** Override AY fresh water (else rule = totalPrebook). */
  freshWaterOverride?: number | null
  maccaSkybossRaisins?: number | null
  maccaKazSalted?: number | null
  charterSnack?: number | null
  wine?: number | null
  blanketCSkyboss?: number | null
  blanket3in1Prebook?: number | null
  maccaRegular?: number | null
  mangoChiliSaltGdsDeluxe?: number | null
  beerSnackComboBC?: number | null
  sodaMaccaComboBD?: number | null
}

export type EcoUpliftTypeInput = 'DAU_NGAY' | 'DOI_TO' | 'NIGHTSTOP'

export interface SupplierFlightInput
  extends FlightIdentity,
    EcoAmenityOpsInput,
    EcoSnackOpsInput {
  /** Owning FlightGroup (rotation) id — lets downstream builders merge legs of the same group. */
  groupId?: string
  quotaCommercial?: number | null
  /** Commercial bánh mì upsell from Team Commercial quota (`salesQuota.banhMi`). */
  quotaBanhMi?: number | null
  /** Commercial trà sữa upsell from Team Commercial quota (`salesQuota.traSua`). */
  quotaTraSua?: number | null
  totalPrebook?: number | null
  skybossEco?: number | null
  businessPax?: number | null
  deluxePax?: number | null
  boiledEggs?: number | null
  reserveUtensils?: number | null
  workbookReferenceBread?: number | null
  /** Bánh mì's own prebook count from the per-dish premeal breakdown. */
  breadPrebook?: number | null
  hotmealItems?: HotmealInput
  australiaBeefFreshVegetables?: number | null
  australiaBreadVegetables?: number | null
  sbbCocktail?: number | null
  sbbMaccaRaisins?: number | null
  sbbUtensils?: number | null
  sbbKit?: number | null
  sbbPillow?: number | null
  sbbMattress?: number | null
  sbbMealType?: 'standard' | 'vegetarian'
  /** Cockpit headcount for this leg (interim rail KPI until crew-meal engine is wired). */
  crewHeadcount?: number | null
  aircraftType?: string | null
  upliftType?: EcoUpliftTypeInput | string | null
  flightKind?: 'ferry_cargo' | 'charter_china' | 'normal' | null
  /** Workbook Amenity cell override, e.g. "10+15" */
  amenityOverride?: string | null
  sourceRefs?: SupplierSourceRefs
}

export interface EcoSupplierInput
  extends FlightIdentity,
    EcoAmenityOpsInput,
    EcoSnackOpsInput {
  quotaCommercial: number | null
  quotaBanhMi?: number | null
  quotaTraSua?: number | null
  totalPrebook: number | null
  skybossEco: number | null
  boiledEggs: number | null
  reserveUtensils: number | null
  workbookReferenceBread?: number | null
  breadPrebook?: number | null
  hotmealItems: HotmealInput
  australiaBeefFreshVegetables?: number | null
  australiaBreadVegetables?: number | null
  aircraftType?: string | null
  upliftType?: EcoUpliftTypeInput | string | null
  flightKind?: 'ferry_cargo' | 'charter_china' | 'normal' | null
  amenityOverride?: string | null
  sourceRefs?: SupplierSourceRefs
}

export type EcoRoutePolicyField =
  | 'australiaNoodleVegetables'
  | 'skybossEggs'
  | 'australiaSkybossYogurt'
  | 'australiaRoundBread'

export interface EcoRouteRuleDefinition {
  ruleId: string
  value?: number
  input?: 'skybossEco'
}

export interface EcoRouteRuleDataset {
  effectiveFrom: string
  effectiveTo: string
  airports: string[]
  source: string
  fields: Record<EcoRoutePolicyField, EcoRouteRuleDefinition>
}

export interface EcoCells {
  spaghetti: SupplierCell<number>
  glassNoodles: SupplierCell<number>
  banhChung: SupplierCell<number>
  stirFriedNoodles: SupplierCell<number>
  thaiFriedRice: SupplierCell<number>
  savoryStickyRice: SupplierCell<number>
  khucStickyRice: SupplierCell<number>
  beefRice: SupplierCell<number>
  coconutRice: SupplierCell<number>
  indianPotatoParatha: SupplierCell<number>
  chickenCurry: SupplierCell<number>
  fishCurry: SupplierCell<number>
  vegetarianYangzhouRice: SupplierCell<number>
  vegetarianBasmatiCurry: SupplierCell<number>
  bread: SupplierCell<number>
  /** Commercial bánh mì upsell (salesQuota.banhMi) — distinct from prebook bread. */
  banhMiCommercial: SupplierCell<number>
  /** Commercial trà sữa upsell (salesQuota.traSua). */
  traSuaCommercial: SupplierCell<number>
  boiledEggs: SupplierCell<number>
  skybossEggs: SupplierCell<number>
  totalEggs: SupplierCell<number>
  australiaNoodleVegetables: SupplierCell<number>
  australiaSkybossYogurt: SupplierCell<number>
  australiaRoundBread: SupplierCell<number>
  australiaBeefFreshVegetables: SupplierCell<number>
  australiaBreadVegetables: SupplierCell<number>
  hotmealTotal: SupplierCell<number>
  ketchup: SupplierCell<number>
  chiliSauce: SupplierCell<number>
  soySauce: SupplierCell<number>
  indianSaltPepper: SupplierCell<number>
  hotmealUtensils: SupplierCell<number>
  reserveUtensils: SupplierCell<number>
  totalUtensils: SupplierCell<number>
  skyboss: SupplierCell<number>
  prebook: SupplierCell<number>
  /** Commercial hotmeal quota (input metric; also exposed for KPI / supply lines). */
  quotaCommercial: SupplierCell<number>
  prebookCashews: SupplierCell<number>
  freshWater: SupplierCell<number>
  maccaSkybossRaisins: SupplierCell<number>
  maccaKazSalted: SupplierCell<number>
  charterSnack: SupplierCell<number>
  wine: SupplierCell<number>
  blanketCSkyboss: SupplierCell<number>
  blanket3in1Prebook: SupplierCell<number>
  maccaRegular: SupplierCell<number>
  mangoChiliSaltGdsDeluxe: SupplierCell<number>
  beerSnackComboBC: SupplierCell<number>
  sodaMaccaComboBD: SupplierCell<number>
  reserveCrewWater: SupplierCell<number>
  smallIceBox: SupplierCell<number>
  largeIceBox: SupplierCell<number>
  wetIceKg: SupplierCell<number>
  dryIceKg: SupplierCell<number>
  dutyFree: SupplierCell<number>
  highlift: SupplierCell<number>
  smallTruck: SupplierCell<number>
  lastMinuteTopUp: SupplierCell<number>
}

export interface EcoSupplierRow extends FlightIdentity {
  key: string
  cells: EcoCells
  /** Rules targeting catalog items that do not have a fixed workbook column. */
  dynamicCells: Record<string, SupplierCell<number>>
  /** Amenity column D, e.g. "10+15" or "4" */
  amenityLabel: string | null
  amenityPackageIds: number[]
}

/** Lookup sheet id — historically fixed labels; new sheets may use any id. */
export type SbbRouteSheet = string

export const KNOWN_SBB_SHEETS = [
  'VIET-HAN-NHAT',
  'CHAY(VIỆT-HÀN-NHẬT)',
  'ẤN',
  'ÚC&KAZ',
] as const

/**
 * Editable sheet definition — drives SkyBoss lookup tabs dynamically.
 * Route-group links replace hardcoded sheet↔airport tables.
 */
export interface SbbLookupSheetDef {
  id: SbbRouteSheet
  /** Tab label in config UI. */
  label: string
  /** EcoAmenityConfig.routeGroups ids this sheet covers. */
  routeGroupIds: string[]
  /** Optional explicit route pairs e.g. "SGN-PQC" (match either direction). */
  routePairs?: string[]
  /** When true, selected by mealType = vegetarian (ignores route groups). */
  vegetarian?: boolean
  /** Catch-all when no other standard sheet matches. */
  fallback?: boolean
  /** Lower runs first when several sheets could match. */
  priority?: number
}

/**
 * Connects a SkyBoss Business lookup sheet to flights via route groups / STD/ARR.
 * Prefer `routeGroupIds` (shared with ECO amenity config). `airports` remains as a
 * legacy/override list — resolved airports = union(route-group airports, airports).
 * @deprecated Prefer SbbLookupSheetDef; kept for backward-compatible mock data.
 */
export interface SbbSheetRouteBinding {
  routeGroupIds?: string[]
  airports?: string[]
  routePairs?: string[]
  priority?: number
  note?: string
}

export type SbbLookupItem =
  | 'bread'
  | 'basa'
  | 'pho'
  | 'bunBo'
  | 'stickyRice'
  | 'chickenGravy'
  | 'blanket'

export interface SbbLookupRow {
  businessPax: number
  items: Partial<Record<SbbLookupItem, number | null>>
}

export interface SbbLookupDataset {
  effectiveFrom: string
  effectiveTo: string
  source: string
  sheets: Record<string, SbbLookupRow[]>
  /** Dynamic sheet tabs + route-group bindings. When absent, engine uses defaults. */
  sheetDefs?: SbbLookupSheetDef[]
  /** @deprecated Prefer sheetDefs. */
  sheetBindings?: Partial<Record<string, SbbSheetRouteBinding>>
}

export interface SbbCells {
  businessPax: SupplierCell<number>
  bread: SupplierCell<number>
  basa: SupplierCell<number>
  pho: SupplierCell<number>
  bunBo: SupplierCell<number>
  stickyRice: SupplierCell<number>
  chickenGravy: SupplierCell<number>
  cocktail: SupplierCell<number>
  maccaRaisins: SupplierCell<number>
  utensils: SupplierCell<number>
  kit: SupplierCell<number>
  pillow: SupplierCell<number>
  mattress: SupplierCell<number>
  blanket: SupplierCell<number>
}

export interface SbbSupplierRow extends FlightIdentity {
  key: string
  sheet: SbbRouteSheet
  cells: SbbCells
}

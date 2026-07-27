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
  totalPrebook?: string
  skybossEco?: string
  businessPax?: string
  boiledEggs?: string
  reserveUtensils?: string
  workbookReferenceBread?: string
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

export interface SupplierFlightInput extends FlightIdentity, EcoAmenityOpsInput {
  quotaCommercial?: number | null
  totalPrebook?: number | null
  skybossEco?: number | null
  businessPax?: number | null
  boiledEggs?: number | null
  reserveUtensils?: number | null
  workbookReferenceBread?: number | null
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
  sourceRefs?: SupplierSourceRefs
}

export interface EcoSupplierInput extends FlightIdentity, EcoAmenityOpsInput {
  quotaCommercial: number | null
  totalPrebook: number | null
  skybossEco: number | null
  boiledEggs: number | null
  reserveUtensils: number | null
  workbookReferenceBread?: number | null
  hotmealItems: HotmealInput
  australiaBeefFreshVegetables?: number | null
  australiaBreadVegetables?: number | null
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
  hotmealUtensils: SupplierCell<number>
  reserveUtensils: SupplierCell<number>
  totalUtensils: SupplierCell<number>
  skyboss: SupplierCell<number>
  prebook: SupplierCell<number>
  prebookCashews: SupplierCell<number>
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
}

export type SbbRouteSheet =
  | 'VIET-HAN-NHAT'
  | 'CHAY(VIỆT-HÀN-NHẬT)'
  | 'ẤN'
  | 'ÚC&KAZ'

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
  sheets: Record<SbbRouteSheet, SbbLookupRow[]>
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

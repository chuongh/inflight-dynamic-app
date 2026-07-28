import { normalizeAirport } from './normalize'
import type {
  EcoQuantityExpr,
  EcoQuantityRule,
  EcoQuantityValue,
  EcoQuantityWhen,
  EcoUpliftType,
  RouteHourClassId,
  SupplierRouteGroup,
} from './ecoQuantityTypes'
import { resolveAircraftFamily } from './amenityResolver'

export interface EcoQuantityEvalContext {
  columns: Record<string, number | null>
  metrics: Record<string, number | null>
  hotmealTotal: number | null
  dep: string
  arr: string
  aircraftType?: string | null
  upliftType?: EcoUpliftType | null
  hourClassId?: RouteHourClassId | null
  amenityPackageIds: number[]
  flightKind?: 'ferry_cargo' | 'charter_china' | 'normal' | null
  routeGroups: SupplierRouteGroup[]
}

function applyCoef(value: number | null, coef = 1): number | null {
  if (value == null) return null
  return value * coef
}

function applyRound(
  value: number | null,
  round: 'ceil' | 'none' | undefined,
): number | null {
  if (value == null) return null
  if (round === 'ceil') return Math.ceil(value)
  return value
}

export function evalQuantityValue(
  value: EcoQuantityValue,
  ctx: EcoQuantityEvalContext,
): number | null {
  switch (value.kind) {
    case 'manual':
      return null
    case 'const':
      return value.value
    case 'hotmeal_total':
      return applyCoef(ctx.hotmealTotal, value.coef ?? 1)
    case 'metric':
      return applyCoef(ctx.metrics[value.metricId] ?? null, value.coef ?? 1)
    case 'column':
      return applyCoef(ctx.columns[value.columnId] ?? null, value.coef ?? 1)
    case 'sum': {
      let total = 0
      let any = false
      for (const part of value.parts) {
        const v = evalQuantityValue(part, ctx)
        if (v == null) continue
        total += v
        any = true
      }
      return any ? total : null
    }
    default:
      return null
  }
}

export function evalQuantityExpr(
  expr: EcoQuantityExpr,
  ctx: EcoQuantityEvalContext,
): number | null {
  let raw: number | null = null
  if (expr.source === 'hotmeal_total') raw = ctx.hotmealTotal
  else if (expr.source === 'metric') raw = ctx.metrics[expr.id ?? ''] ?? null
  else if (expr.source === 'column') raw = ctx.columns[expr.id ?? ''] ?? null
  return applyRound(applyCoef(raw, expr.coef), expr.round)
}

function matchesWhen(
  when: EcoQuantityWhen,
  ctx: EcoQuantityEvalContext,
): boolean {
  if (when.aircraftFamilies?.length) {
    const family = resolveAircraftFamily(ctx.aircraftType)
    if (!family || !when.aircraftFamilies.includes(family)) return false
  }
  if (when.upliftTypes?.length) {
    if (!ctx.upliftType || !when.upliftTypes.includes(ctx.upliftType)) return false
  }
  if (when.hourClasses?.length) {
    if (!ctx.hourClassId || !when.hourClasses.includes(ctx.hourClassId)) {
      return false
    }
  }
  if (when.amenityPackages?.length) {
    const hit = when.amenityPackages.some((id) =>
      ctx.amenityPackageIds.includes(id),
    )
    if (!hit) return false
  }
  if (when.flightKinds?.length) {
    const kind = ctx.flightKind ?? 'normal'
    if (!when.flightKinds.includes(kind)) return false
  }
  if (when.routeGroups?.length) {
    const dep = normalizeAirport(ctx.dep)
    const arr = normalizeAirport(ctx.arr)
    const hit = when.routeGroups.some((groupId) => {
      const group = ctx.routeGroups.find((g) => g.id === groupId)
      if (!group) return false
      const set = new Set(group.airports.map(normalizeAirport))
      return set.has(dep) || set.has(arr)
    })
    if (!hit) return false
  }
  if (when.routePairs?.length) {
    const pair = `${normalizeAirport(ctx.dep)}-${normalizeAirport(ctx.arr)}`
    const rev = `${normalizeAirport(ctx.arr)}-${normalizeAirport(ctx.dep)}`
    if (!when.routePairs.includes(pair) && !when.routePairs.includes(rev)) {
      return false
    }
  }
  return true
}

export function evalQuantityRule(
  rule: EcoQuantityRule,
  ctx: EcoQuantityEvalContext,
): { value: number | null; source: string } {
  if (!rule.enabled) {
    return { value: null, source: `${rule.id} disabled` }
  }

  if (rule.base === 'by_item' || rule.base === 'by_hotmeal_total') {
    if (!rule.expr) {
      return { value: null, source: `${rule.id} missing expr` }
    }
    return {
      value: evalQuantityExpr(rule.expr, ctx),
      source: `${rule.id}; ${rule.base}`,
    }
  }

  for (const branch of rule.branches ?? []) {
    if (matchesWhen(branch.when, ctx)) {
      return {
        value: evalQuantityValue(branch.value, ctx),
        source: `${rule.id}; branch ${branch.id}${branch.note ? `; ${branch.note}` : ''}`,
      }
    }
  }

  if (rule.fallback) {
    return {
      value: evalQuantityValue(rule.fallback, ctx),
      source: `${rule.id}; fallback`,
    }
  }

  return { value: null, source: `${rule.id}; no match` }
}

/** Default ECO remaining-quantity rules (confirmed formulas from the policy doc). */
export const DEFAULT_ECO_QUANTITY_RULES: EcoQuantityRule[] = [
  {
    id: 'ECO.AI.ketchup',
    base: 'by_item',
    targetColumn: 'ketchup',
    enabled: true,
    docRef: '§1.4 AI',
    expr: { source: 'column', id: 'spaghetti', coef: 1, round: 'none' },
  },
  {
    id: 'ECO.AJ.chili',
    base: 'by_hotmeal_total',
    targetColumn: 'chiliSauce',
    enabled: true,
    docRef: '§1.4 AJ',
    expr: { source: 'hotmeal_total', coef: 0.5, round: 'ceil' },
  },
  {
    id: 'ECO.AK.soy',
    base: 'by_hotmeal_total',
    targetColumn: 'soySauce',
    enabled: true,
    docRef: '§1.4 AK',
    expr: { source: 'hotmeal_total', coef: 0.5, round: 'ceil' },
  },
  {
    id: 'ECO.AM.hotmealUtensils',
    base: 'by_hotmeal_total',
    targetColumn: 'hotmealUtensils',
    enabled: true,
    docRef: '§1.4 AM',
    expr: { source: 'hotmeal_total', coef: 1, round: 'none' },
  },
  {
    id: 'ECO.AL.indianSalt',
    base: 'by_std_arr',
    targetColumn: 'indianSaltPepper',
    enabled: true,
    docRef: '§1.4 AL',
    branches: [
      {
        id: 'in',
        when: { routeGroups: ['IN'] },
        value: { kind: 'column', columnId: 'soySauce', coef: 1 },
        note: 'DEP/ARR Ấn = Xì dầu',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AN.reserveUtensils',
    base: 'by_std_arr',
    targetColumn: 'reserveUtensils',
    enabled: true,
    docRef: '§1.4 AN',
    branches: [
      {
        id: 'a330-au',
        when: {
          aircraftFamilies: ['A330'],
          routeGroups: ['AU'],
        },
        value: { kind: 'const', value: 30 },
        note: 'A330 Úc = 30',
      },
      {
        id: 'int-ge-4h',
        when: { hourClasses: ['INT_GE_4H'] },
        value: { kind: 'const', value: 20 },
        note: 'QT ≥4h = 20',
      },
      {
        id: 'int-lt-4h-or-doi-to',
        when: { hourClasses: ['INT_LT_4H'] },
        value: { kind: 'const', value: 12 },
        note: 'QT ngắn = 12',
      },
      {
        id: 'doi-to',
        when: { upliftTypes: ['DOI_TO'] },
        value: { kind: 'const', value: 12 },
        note: 'Đổi tổ = 12',
      },
    ],
    fallback: { kind: 'manual' },
  },
  {
    id: 'ECO.S.bread',
    base: 'by_std_arr',
    targetColumn: 'bread',
    enabled: true,
    docRef: '§1.3 S',
    branches: [],
    fallback: {
      kind: 'sum',
      parts: [
        { kind: 'metric', metricId: 'quotaCommercial', coef: 1 },
        { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
      ],
    },
  },
  {
    id: 'ECO.AZ.prebookCashews',
    base: 'by_item',
    targetColumn: 'prebookCashews',
    enabled: true,
    docRef: '§1.5 AZ',
    expr: { source: 'metric', id: 'totalPrebook', coef: 1, round: 'none' },
  },
  {
    id: 'ECO.AY.freshWater',
    base: 'by_item',
    targetColumn: 'freshWater',
    enabled: true,
    docRef: '§1.5 AY',
    expr: { source: 'metric', id: 'totalPrebook', coef: 1, round: 'none' },
  },
  {
    id: 'ECO.Z.auNoodleVeg',
    base: 'by_std_arr',
    targetColumn: 'australiaNoodleVegetables',
    enabled: true,
    docRef: '§1.3 Z',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'const', value: 25 },
        note: 'DEP/ARR Úc = 25',
      },
    ],
    fallback: { kind: 'manual' },
  },
  {
    id: 'ECO.AE.skybossEggs',
    base: 'by_std_arr',
    targetColumn: 'skybossEggs',
    enabled: true,
    docRef: '§1.3 AE',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'manual' },
  },
  {
    id: 'ECO.AG.auSkybossYogurt',
    base: 'by_std_arr',
    targetColumn: 'australiaSkybossYogurt',
    enabled: true,
    docRef: '§1.3 AG',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'manual' },
  },
  {
    id: 'ECO.AW.auRoundBread',
    base: 'by_std_arr',
    targetColumn: 'australiaRoundBread',
    enabled: true,
    docRef: '§1.3 AW',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'manual' },
  },
]

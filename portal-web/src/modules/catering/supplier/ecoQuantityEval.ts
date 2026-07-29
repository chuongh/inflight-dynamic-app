import { normalizeAirport } from './normalize'
import type {
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
  round: 'ceil' | undefined,
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

  for (const branch of rule.branches) {
    if (matchesWhen(branch.when, ctx)) {
      const raw = evalQuantityValue(branch.value, ctx)
      return {
        value: applyRound(raw, rule.round),
        source: `${rule.id}; branch ${branch.id}${branch.note ? `; ${branch.note}` : ''}`,
      }
    }
  }

  const raw = evalQuantityValue(rule.fallback, ctx)
  return {
    value: applyRound(raw, rule.round),
    source: `${rule.id}; fallback`,
  }
}

function migrateValue(value: unknown): EcoQuantityValue {
  if (!value || typeof value !== 'object') return { kind: 'const', value: 0 }
  const v = value as { kind?: string; parts?: unknown[]; [key: string]: unknown }
  if (v.kind === 'manual') return { kind: 'const', value: 0 }
  if (v.kind === 'sum' && Array.isArray(v.parts)) {
    return {
      kind: 'sum',
      parts: v.parts.map(migrateValue),
    }
  }
  if (
    v.kind === 'const' ||
    v.kind === 'metric' ||
    v.kind === 'column' ||
    v.kind === 'hotmeal_total'
  ) {
    return v as EcoQuantityValue
  }
  return { kind: 'const', value: 0 }
}

/**
 * Normalize persisted / legacy rules (base/expr/manual) into the unified shape.
 * Safe to call on already-migrated rules.
 */
export function migrateEcoQuantityRule(raw: unknown): EcoQuantityRule {
  const rule = raw as EcoQuantityRule & {
    base?: string
    expr?: {
      source: 'column' | 'hotmeal_total' | 'metric'
      id?: string
      coef: number
      round?: 'ceil' | 'none'
    }
    branches?: EcoQuantityRule['branches']
    fallback?: unknown
  }

  if (rule.expr) {
    const expr = rule.expr
    let fallback: EcoQuantityValue
    if (expr.source === 'hotmeal_total') {
      fallback = { kind: 'hotmeal_total', coef: expr.coef }
    } else if (expr.source === 'metric') {
      fallback = { kind: 'metric', metricId: expr.id ?? '', coef: expr.coef }
    } else {
      fallback = { kind: 'column', columnId: expr.id ?? '', coef: expr.coef }
    }
    return {
      id: rule.id,
      targetColumn: rule.targetColumn,
      enabled: rule.enabled,
      docRef: rule.docRef,
      round: expr.round === 'ceil' ? 'ceil' : undefined,
      branches: (rule.branches ?? []).map((b) => ({
        ...b,
        value: migrateValue(b.value),
      })),
      fallback,
      confirmed: typeof rule.confirmed === 'boolean' ? rule.confirmed : true,
    }
  }

  return {
    id: rule.id,
    targetColumn: rule.targetColumn,
    enabled: rule.enabled,
    docRef: rule.docRef,
    round: rule.round,
    branches: (rule.branches ?? []).map((b) => ({
      ...b,
      value: migrateValue(b.value),
    })),
    fallback: migrateValue(rule.fallback ?? { kind: 'const', value: 0 }),
    confirmed: typeof rule.confirmed === 'boolean' ? rule.confirmed : true,
  }
}

export function migrateEcoQuantityRules(rules: unknown[]): EcoQuantityRule[] {
  return rules.map(migrateEcoQuantityRule)
}

/** Default ECO remaining-quantity rules (confirmed formulas from the policy doc). */
export const DEFAULT_ECO_QUANTITY_RULES: EcoQuantityRule[] = [
  {
    id: 'ECO.AI.ketchup',
    targetColumn: 'ketchup',
    enabled: true,
    confirmed: true,
    docRef: '§1.4 AI',
    branches: [],
    fallback: { kind: 'column', columnId: 'spaghetti', coef: 1 },
  },
  {
    id: 'ECO.AJ.chili',
    targetColumn: 'chiliSauce',
    enabled: true,
    confirmed: true,
    docRef: '§1.4 AJ',
    round: 'ceil',
    branches: [],
    fallback: { kind: 'hotmeal_total', coef: 0.5 },
  },
  {
    id: 'ECO.AK.soy',
    targetColumn: 'soySauce',
    enabled: true,
    confirmed: true,
    docRef: '§1.4 AK',
    round: 'ceil',
    branches: [],
    fallback: { kind: 'hotmeal_total', coef: 0.5 },
  },
  {
    id: 'ECO.AM.hotmealUtensils',
    targetColumn: 'hotmealUtensils',
    enabled: true,
    confirmed: true,
    docRef: '§1.4 AM',
    branches: [],
    fallback: { kind: 'hotmeal_total', coef: 1 },
  },
  {
    id: 'ECO.AL.indianSalt',
    targetColumn: 'indianSaltPepper',
    enabled: true,
    confirmed: true,
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
    targetColumn: 'reserveUtensils',
    enabled: true,
    confirmed: true,
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
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.S.bread',
    targetColumn: 'bread',
    enabled: true,
    confirmed: true,
    docRef: '§1.3 S',
    branches: [],
    fallback: {
      kind: 'sum',
      parts: [
        { kind: 'metric', metricId: 'quotaCommercial', coef: 1 },
        // Bánh mì's own prebook from the ungrouped flight file — not totalPrebook (all dishes).
        { kind: 'metric', metricId: 'breadPrebook', coef: 1 },
      ],
    },
  },
  {
    id: 'ECO.AZ.prebookCashews',
    targetColumn: 'prebookCashews',
    enabled: true,
    confirmed: true,
    docRef: '§1.5 AZ',
    branches: [],
    fallback: { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
  },
  {
    id: 'ECO.AY.freshWater',
    targetColumn: 'freshWater',
    enabled: true,
    confirmed: true,
    docRef: '§1.5 AY',
    branches: [],
    fallback: { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
  },
  {
    id: 'ECO.Z.auNoodleVeg',
    targetColumn: 'australiaNoodleVegetables',
    enabled: true,
    confirmed: false,
    docRef: '§1.3 Z',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'const', value: 25 },
        note: 'DEP/ARR Úc = 25',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AE.skybossEggs',
    targetColumn: 'skybossEggs',
    enabled: true,
    confirmed: false,
    docRef: '§1.3 AE',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AG.auSkybossYogurt',
    targetColumn: 'australiaSkybossYogurt',
    enabled: true,
    confirmed: false,
    docRef: '§1.3 AG',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AW.auRoundBread',
    targetColumn: 'australiaRoundBread',
    enabled: true,
    confirmed: false,
    docRef: '§1.3 AW',
    branches: [
      {
        id: 'au',
        when: { routeGroups: ['AU'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'DEP/ARR Úc = SkyBoss ECO',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AS.maccaKazSalted',
    targetColumn: 'maccaKazSalted',
    enabled: true,
    confirmed: true,
    branches: [
      {
        id: 'kaz',
        when: { routeGroups: ['KAZ'] },
        value: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
        note: 'Nhóm KAZ = Số khách SkyBoss',
      },
    ],
    fallback: { kind: 'const', value: 0 },
  },
  {
    id: 'ECO.AR.maccaSkybossRaisins',
    targetColumn: 'maccaSkybossRaisins',
    enabled: true,
    confirmed: true,
    branches: [],
    fallback: { kind: 'metric', metricId: 'skybossEco', coef: 1 },
  },
  {
    id: 'ECO.AX.blanket3in1Prebook',
    targetColumn: 'blanket3in1Prebook',
    enabled: true,
    confirmed: false,
    branches: [],
    fallback: { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
    docRef: '§1.5 AX — xấp xỉ tạm bằng Tổng Prebook, xem note trong catalog',
  },
]

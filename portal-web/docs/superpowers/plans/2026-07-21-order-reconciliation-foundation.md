# Order Reconciliation — Foundation (P0 + P1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data spine for order reconciliation — per-flight dish detail on legs, a per-flight-per-dish `breakdown` snapshot on each order version, delta helpers — and fix the stale meal-rollup bug, all unit-tested. No UI in this plan.

**Architecture:** Grouping keeps per-dish counts at the leg level (`FlightLeg.meals`); a group's `meals` is always derived from its legs via `rollupLegMeals`, so split/merge/move stay correct. `buildOrderSnapshot` produces both the aggregated `lines` and an immutable `breakdown` (source cells) that each `CateringOrder` version stores; `deltaByFlightDish` diffs two breakdowns for the reconciliation UI (later plan).

**Tech Stack:** TypeScript, React 19, Vitest 2. Pure functions in `src/modules/catering`.

## Global Constraints

- Style: single quotes, no semicolons, 2-space indent (match existing files; no Prettier — do not reformat).
- Immutable helpers only in `grouping.ts` / `orders.ts` (return fresh arrays).
- `breakdown` is OPTIONAL on `CateringOrder` (legacy/persisted orders may lack it) — never assume presence.
- Tests colocated as `*.test.ts`, `import { describe, expect, it } from 'vitest'`.
- Run tests with `npx vitest run <file>`.

---

### Task 1: Per-dish meals on legs + derived group rollup

**Files:**
- Modify: `src/modules/catering/groupingTypes.ts` (add `FlightLeg.meals`)
- Modify: `src/modules/catering/grouping.ts` (add `rollupLegMeals`; `autoGroupFlights` copies `f.meals` to each leg and derives `group.meals` via the helper)
- Test: `src/modules/catering/grouping.rollup.test.ts`

**Interfaces:**
- Produces: `rollupLegMeals(legs: FlightLeg[]): MealBreakdownItem[]` — sum of each leg's `meals`, desc by count.
- `FlightLeg` gains `meals?: MealBreakdownItem[]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { autoGroupFlights, rollupLegMeals } from './grouping'
import type { RawFlight } from './groupingTypes'

const F = (p: Partial<RawFlight>): RawFlight => ({
  flightNo: 'VJ1', aircraft: 'VN-A1', aircraftType: 'A321', dep: 'SGN', arr: 'HAN',
  std: '06:00', sta: '08:00', purser: 'P', purserCode: 'P1', intl: false, ...p,
})

describe('rollupLegMeals', () => {
  it('sums per-leg dish counts desc by count', () => {
    expect(rollupLegMeals([
      { flightNo: 'a', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, meals: [{ name: 'Phở', count: 3 }] },
      { flightNo: 'b', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', intl: false, meals: [{ name: 'Phở', count: 2 }, { name: 'Mì', count: 5 }] },
    ])).toEqual([{ name: 'Mì', count: 5 }, { name: 'Phở', count: 5 }])
  })
})

describe('autoGroupFlights leg meals', () => {
  it('copies per-flight meals onto each leg and derives group.meals from them', () => {
    const groups = autoGroupFlights(
      [
        F({ flightNo: 'VJ1', aircraft: 'VN-A1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', meals: [{ name: 'Phở', count: 4 }] }),
        F({ flightNo: 'VJ2', aircraft: 'VN-A1', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', meals: [{ name: 'Phở', count: 6 }] }),
      ],
      { cateringStations: new Set(['SGN']), groupByPurser: true },
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].legs.map((l) => l.meals)).toEqual([[{ name: 'Phở', count: 4 }], [{ name: 'Phở', count: 6 }]])
    expect(groups[0].meals).toEqual([{ name: 'Phở', count: 10 }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/catering/grouping.rollup.test.ts`
Expected: FAIL — `rollupLegMeals` is not exported / `leg.meals` undefined.

- [ ] **Step 3: Add `meals` to `FlightLeg`**

In `groupingTypes.ts`, inside `interface FlightLeg`, after the `premeal?` field add:

```ts
  /** Per-dish premeal breakdown for THIS leg (from the crew-list meal columns).
   *  Kept at leg level so a group's rollup stays correct after split/merge/move. */
  meals?: MealBreakdownItem[]
```

- [ ] **Step 4: Add `rollupLegMeals` and use it in grouping**

In `grouping.ts`, add the helper near `aggregateDayMeals`:

```ts
/** Roll up per-leg dish counts into a group-level breakdown, desc by count. */
export function rollupLegMeals(legs: FlightLeg[]): MealBreakdownItem[] {
  const map = new Map<string, number>()
  for (const leg of legs) for (const m of leg.meals ?? []) map.set(m.name, (map.get(m.name) ?? 0) + m.count)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
```

Add `MealBreakdownItem` to the type import at the top of `grouping.ts`:
```ts
import type { CockpitCrewMember, FlightGroup, FlightLeg, MealBreakdownItem, RawFlight } from './groupingTypes'
```

In `autoGroupFlights`, the leg push (currently `current!.legs.push({ ... salesQuota: quotaByFlightNo?.get(f.flightNo) })`) — add `meals`:
```ts
      current!.legs.push({
        flightNo: f.flightNo,
        dep: f.dep,
        arr: f.arr,
        std: f.std,
        sta: f.sta,
        intl: f.intl,
        stdNextDay: f.stdNextDay,
        staNextDay: f.staNextDay,
        premeal: f.premeal,
        meals: f.meals,
        cockpitCrew: f.cockpitCrew,
        salesQuota: quotaByFlightNo?.get(f.flightNo),
      })
```

Replace the `dishes` accumulation. Delete the `let dishes = new Map<string, number>()` line, the `dishes = new Map()` reset, and the `for (const m of f.meals ?? []) dishes.set(...)` line. In `finalize()` replace the `if (dishes.size > 0) { current.meals = ... }` block with:
```ts
    const finalize = () => {
      if (!current) return
      const meals = rollupLegMeals(current.legs)
      if (meals.length > 0) current.meals = meals
      const total = current.legs.reduce((sum, l) => sum + (l.premeal ?? 0), 0)
      if (total > 0) current.premealTotal = total
      current = null
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/modules/catering/grouping.rollup.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/catering/groupingTypes.ts src/modules/catering/grouping.ts src/modules/catering/grouping.rollup.test.ts
git commit -m "feat(catering): keep per-dish meals on legs, derive group rollup"
```

---

### Task 2: Fix stale rollup on split / merge / move (P0)

**Files:**
- Modify: `src/modules/catering/grouping.ts` (`splitGroupAt`, `mergeGroups`, `moveLeg` recompute `meals` via `rollupLegMeals`)
- Test: `src/modules/catering/grouping.editops.test.ts`

**Interfaces:**
- Consumes: `rollupLegMeals` (Task 1).
- No signature changes; behavior fix only.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { aggregateDayMeals, autoGroupFlights, splitGroupAt } from './grouping'
import type { RawFlight } from './groupingTypes'

const F = (p: Partial<RawFlight>): RawFlight => ({
  flightNo: 'VJ1', aircraft: 'VN-A1', aircraftType: 'A321', dep: 'SGN', arr: 'HAN',
  std: '06:00', sta: '08:00', purser: 'P', purserCode: 'P1', intl: false, ...p,
})

describe('splitGroupAt keeps day-total meals correct', () => {
  it('does not double-count dishes after a split', () => {
    const groups = autoGroupFlights(
      [
        F({ flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', meals: [{ name: 'Phở', count: 4 }] }),
        F({ flightNo: 'VJ2', dep: 'HAN', arr: 'SGN', std: '10:00', sta: '12:00', meals: [{ name: 'Phở', count: 6 }] }),
      ],
      { cateringStations: new Set(['SGN']), groupByPurser: true },
    )
    const before = aggregateDayMeals(groups)
    expect(before).toEqual([{ name: 'Phở', count: 10 }])

    const split = splitGroupAt(groups, groups[0].id, 1)
    expect(split).toHaveLength(2)
    expect(aggregateDayMeals(split)).toEqual([{ name: 'Phở', count: 10 }])
    expect(split[0].meals).toEqual([{ name: 'Phở', count: 4 }])
    expect(split[1].meals).toEqual([{ name: 'Phở', count: 6 }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/catering/grouping.editops.test.ts`
Expected: FAIL — `aggregateDayMeals(split)` returns `[{ name: 'Phở', count: 20 }]` (double-counted).

- [ ] **Step 3: Recompute `meals` in the three edit ops**

In `grouping.ts`, `splitGroupAt`: set `meals` on both halves:
```ts
  const head: FlightGroup = {
    ...g, confidence: 'high', confirmed: false, reviewNote: undefined,
    legs: g.legs.slice(0, at), meals: rollupLegMeals(g.legs.slice(0, at)),
  }
  const tail: FlightGroup = {
    ...g, id: newGroupId(g.id), confidence: 'high', confirmed: false, reviewNote: undefined,
    legs: g.legs.slice(at), meals: rollupLegMeals(g.legs.slice(at)),
  }
```

In `mergeGroups`, the `merged` object:
```ts
  const legs = [...target.legs, ...source.legs].sort((a, b) => legSortKey(a) - legSortKey(b))
  const merged: FlightGroup = { ...target, confirmed: false, legs, meals: rollupLegMeals(legs) }
```

In `moveLeg`, `nextSource` and `nextDest`:
```ts
  const nextSource: FlightGroup = {
    ...source, confirmed: false,
    legs: source.legs.filter((_, i) => i !== legIndex),
    meals: rollupLegMeals(source.legs.filter((_, i) => i !== legIndex)),
  }
  const nextDest: FlightGroup = {
    ...dest, confirmed: false,
    legs: [...dest.legs, leg].sort((a, b) => legSortKey(a) - legSortKey(b)),
    meals: rollupLegMeals([...dest.legs, leg]),
  }
```

(If `rollupLegMeals` returns `[]`, that's fine — `meals` becomes an empty array; `aggregateDayMeals` skips empty.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/catering/grouping.editops.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/catering/grouping.ts src/modules/catering/grouping.editops.test.ts
git commit -m "fix(catering): recompute group meal rollup on split/merge/move (no double-count)"
```

---

### Task 3: Order source-cell type + version breakdown field

**Files:**
- Modify: `src/modules/catering/orderTypes.ts`

**Interfaces:**
- Produces: `OrderSourceCell` and `CateringOrder.breakdown?: OrderSourceCell[]`.

- [ ] **Step 1: Add the type + field**

In `orderTypes.ts`, after `CateringOrderLine`:
```ts
/** One traceable source contribution to an order line. Pre-book/sales cells are
 *  per-flight; crew cells are per-group (no single flight owns a crew meal). */
export interface OrderSourceCell {
  category: OrderCategory
  name: string
  groupId: string
  flightNo?: string
  dep?: string
  arr?: string
  qty: number
}
```
Add to `interface CateringOrder`, after `lines`:
```ts
  /** Immutable per-flight/per-group source snapshot the lines were derived from.
   *  Optional: legacy versions created before reconciliation have no breakdown. */
  breakdown?: OrderSourceCell[]
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc -b --noEmit 2>&1 | grep orderTypes || echo "orderTypes clean"`
Expected: `orderTypes clean`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/catering/orderTypes.ts
git commit -m "feat(catering): add OrderSourceCell + version breakdown snapshot type"
```

---

### Task 4: `buildOrderSnapshot` — lines + breakdown

**Files:**
- Create: `src/modules/catering/orderSnapshot.ts`
- Modify: `src/modules/catering/orders.ts` (`buildOrderLines` delegates to snapshot)
- Test: `src/modules/catering/orderSnapshot.test.ts`

**Interfaces:**
- Consumes: `FlightGroup` (with `legs[].meals`, Task 1), `CrewMealProfile`, `codeOf`.
- Produces:
  - `buildOrderSnapshot(groups, profile, codeOf): { lines: CateringOrderLine[]; breakdown: OrderSourceCell[] }`
  - `deriveLines(breakdown: OrderSourceCell[], codeOf): CateringOrderLine[]`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildOrderSnapshot } from './orderSnapshot'
import type { FlightGroup } from './groupingTypes'

const codeOf = () => ['X']
const group = (id: string, legs: FlightGroup['legs']): FlightGroup => ({
  id, aircraft: 'VN-A1', aircraftType: 'A321', purser: 'P', purserCode: 'P1',
  confidence: 'high', confirmed: true, legs,
})

describe('buildOrderSnapshot', () => {
  it('emits one prebook cell per flight per dish, and lines aggregate them', () => {
    const groups = [
      group('g1', [
        { flightNo: 'VJ1', dep: 'SGN', arr: 'PQC', std: '06:00', sta: '07:00', intl: false, meals: [{ name: 'Cơm', count: 40 }] },
        { flightNo: 'VJ2', dep: 'PQC', arr: 'SGN', std: '09:00', sta: '10:00', intl: false, meals: [{ name: 'Cơm', count: 38 }] },
      ]),
      group('g2', [
        { flightNo: 'VJ9', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, meals: [{ name: 'Cơm', count: 20 }] },
      ]),
    ]
    const { lines, breakdown } = buildOrderSnapshot(groups, undefined, codeOf)
    const prebook = breakdown.filter((c) => c.category === 'prebook')
    expect(prebook).toHaveLength(3)
    expect(prebook.map((c) => [c.flightNo, c.qty])).toEqual([['VJ1', 40], ['VJ2', 38], ['VJ9', 20]])
    const com = lines.find((l) => l.name === 'Cơm')!
    expect(com.qty).toBe(98)
    expect(com.suggested).toBe(98)
  })

  it('emits a per-flight sales cell from leg salesQuota', () => {
    const groups = [
      group('g1', [
        { flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', std: '06:00', sta: '08:00', intl: false, salesQuota: { hotmeal: 5, banhMi: 0, traSua: 0 } },
      ]),
    ]
    const { breakdown } = buildOrderSnapshot(groups, undefined, codeOf)
    const sales = breakdown.filter((c) => c.category === 'sales')
    expect(sales).toEqual([{ category: 'sales', name: 'hotmeal', groupId: 'g1', flightNo: 'VJ1', dep: 'SGN', arr: 'HAN', qty: 5 }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/catering/orderSnapshot.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `orderSnapshot.ts`**

```ts
/** UC-11 · Build an order's line list AND an immutable per-flight/per-group source
 *  breakdown (the reconciliation spine). Lines are a pure derivation of breakdown. */
import { computeGroupCrewMeals } from './groupCrewMeal'
import type { FlightGroup } from './groupingTypes'
import type { CrewMealProfile } from './crewMealTypes'
import type { CateringOrderLine, OrderSourceCell } from './orderTypes'

const SALES: Array<['hotmeal' | 'banhMi' | 'traSua', string]> = [
  ['hotmeal', 'HOT'],
  ['banhMi', 'BMI'],
  ['traSua', 'TSA'],
]

/** All source cells from confirmed groups, ordered prebook → crew → sales. */
export function buildBreakdown(
  groups: FlightGroup[],
  profile: CrewMealProfile | undefined,
): OrderSourceCell[] {
  const cells: OrderSourceCell[] = []

  for (const g of groups)
    for (const leg of g.legs)
      for (const m of leg.meals ?? [])
        cells.push({ category: 'prebook', name: m.name, groupId: g.id, flightNo: leg.flightNo, dep: leg.dep, arr: leg.arr, qty: m.count })

  if (profile)
    for (const g of groups) {
      const meals = computeGroupCrewMeals(g, profile).meals
      if (meals > 0) cells.push({ category: 'crew', name: 'crewCockpit', groupId: g.id, qty: meals })
    }

  for (const g of groups)
    for (const leg of g.legs)
      for (const [key] of SALES) {
        const n = leg.salesQuota?.[key] ?? 0
        if (n > 0) cells.push({ category: 'sales', name: key, groupId: g.id, flightNo: leg.flightNo, dep: leg.dep, arr: leg.arr, qty: n })
      }

  return cells
}

/** Aggregate source cells into order lines (qty === suggested at build time). */
export function deriveLines(
  breakdown: OrderSourceCell[],
  codeOf: (name: string) => string[],
): CateringOrderLine[] {
  const byKey = new Map<string, { name: string; category: OrderSourceCell['category']; qty: number }>()
  for (const c of breakdown) {
    const key = `${c.category} ${c.name}`
    const prev = byKey.get(key)
    if (prev) prev.qty += c.qty
    else byKey.set(key, { name: c.name, category: c.category, qty: c.qty })
  }
  const order = { prebook: 0, crew: 1, sales: 2 }
  return [...byKey.values()]
    .sort((a, b) => order[a.category] - order[b.category] || b.qty - a.qty)
    .map((x) => {
      const codeFor = (name: string) => {
        for (const c of breakdown) if (c.category === x.category && c.name === name && c.category !== 'prebook') return codeForSystem(x.category, name)
        return codeOf(name)
      }
      const pbmlCodes = x.category === 'prebook' ? codeOf(x.name) : [codeForSystem(x.category, x.name)]
      void codeFor
      return { name: x.name, category: x.category, pbmlCodes, suggested: x.qty, qty: x.qty }
    })
}

function codeForSystem(category: OrderSourceCell['category'], name: string): string {
  if (category === 'crew') return 'CRWM'
  const s = SALES.find(([k]) => k === name)
  return s ? s[1] : ''
}

/** Build both lines and breakdown from confirmed groups. */
export function buildOrderSnapshot(
  groups: FlightGroup[],
  profile: CrewMealProfile | undefined,
  codeOf: (name: string) => string[],
): { lines: CateringOrderLine[]; breakdown: OrderSourceCell[] } {
  const breakdown = buildBreakdown(groups, profile)
  return { lines: deriveLines(breakdown, codeOf), breakdown }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/catering/orderSnapshot.test.ts`
Expected: PASS.

- [ ] **Step 5: Make `buildOrderLines` delegate (keep back-compat)**

In `orders.ts`, replace the body of `buildOrderLines` with a delegation so existing callers keep working:
```ts
import { buildOrderSnapshot } from './orderSnapshot'
// …
export function buildOrderLines(
  groups: FlightGroup[],
  profile: CrewMealProfile | undefined,
  codeOf: (name: string) => string[],
): CateringOrderLine[] {
  return buildOrderSnapshot(groups, profile, codeOf).lines
}
```
Remove the now-unused imports in `orders.ts` (`aggregateDayMeals`, `groupSalesQuota`, `computeGroupCrewMeals`) IF no longer referenced elsewhere in the file — check with `grep -n 'aggregateDayMeals\|groupSalesQuota\|computeGroupCrewMeals' src/modules/catering/orders.ts` and delete only the dead imports.

- [ ] **Step 6: Run existing + new tests + typecheck**

Run: `npx vitest run src/modules/catering/ && npx tsc -b --noEmit 2>&1 | grep -E 'orders|orderSnapshot' || echo "catering clean"`
Expected: tests PASS; `catering clean`.

- [ ] **Step 7: Commit**

```bash
git add src/modules/catering/orderSnapshot.ts src/modules/catering/orderSnapshot.test.ts src/modules/catering/orders.ts
git commit -m "feat(catering): buildOrderSnapshot (lines + per-flight breakdown); buildOrderLines delegates"
```

---

### Task 5: Version delta — `deltaByFlightDish` + `changedLines`

**Files:**
- Modify: `src/modules/catering/orderSnapshot.ts`
- Test: `src/modules/catering/orderDelta.test.ts`

**Interfaces:**
- Produces:
  - `type FlightDelta = { flightNo?: string; dep?: string; arr?: string; groupId: string; from: number; to: number; delta: number }`
  - `type ChangedLine = { category: OrderCategory; name: string; from: number; to: number; delta: number; flights: FlightDelta[] }`
  - `changedLines(base: OrderSourceCell[], next: OrderSourceCell[]): ChangedLine[]` — only lines whose total changed; each carries per-flight deltas (non-zero).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { changedLines } from './orderSnapshot'
import type { OrderSourceCell } from './orderTypes'

const cell = (p: Partial<OrderSourceCell> & { name: string; qty: number }): OrderSourceCell => ({
  category: 'prebook', groupId: 'g1', ...p,
})

describe('changedLines', () => {
  it('lists only changed lines with per-flight deltas', () => {
    const base: OrderSourceCell[] = [
      cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 }),
      cell({ name: 'Cơm', flightNo: 'VJ2', qty: 53 }),
      cell({ name: 'Mì', flightNo: 'VJ1', qty: 10 }),
    ]
    const next: OrderSourceCell[] = [
      cell({ name: 'Cơm', flightNo: 'VJ1', qty: 48 }),
      cell({ name: 'Cơm', flightNo: 'VJ2', qty: 57 }),
      cell({ name: 'Mì', flightNo: 'VJ1', qty: 10 }),
    ]
    const changed = changedLines(base, next)
    expect(changed).toHaveLength(1)
    expect(changed[0]).toMatchObject({ name: 'Cơm', from: 93, to: 105, delta: 12 })
    expect(changed[0].flights).toEqual([
      { flightNo: 'VJ1', dep: undefined, arr: undefined, groupId: 'g1', from: 40, to: 48, delta: 8 },
      { flightNo: 'VJ2', dep: undefined, arr: undefined, groupId: 'g1', from: 53, to: 57, delta: 4 },
    ])
  })

  it('handles a flight that only exists in next (new booking)', () => {
    const changed = changedLines(
      [cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 })],
      [cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 }), cell({ name: 'Cơm', flightNo: 'VJ3', qty: 6 })],
    )
    expect(changed[0].delta).toBe(6)
    expect(changed[0].flights).toEqual([{ flightNo: 'VJ3', dep: undefined, arr: undefined, groupId: 'g1', from: 0, to: 6, delta: 6 }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/catering/orderDelta.test.ts`
Expected: FAIL — `changedLines` not exported.

- [ ] **Step 3: Implement delta helpers in `orderSnapshot.ts`**

Append to `orderSnapshot.ts`:
```ts
import type { OrderCategory } from './orderTypes'

export interface FlightDelta {
  flightNo?: string
  dep?: string
  arr?: string
  groupId: string
  from: number
  to: number
  delta: number
}
export interface ChangedLine {
  category: OrderCategory
  name: string
  from: number
  to: number
  delta: number
  flights: FlightDelta[]
}

function cellKey(c: OrderSourceCell): string {
  return `${c.category} ${c.name}`
}
function flightKey(c: OrderSourceCell): string {
  return `${c.groupId} ${c.flightNo ?? ''}`
}

/** Lines whose aggregated qty changed between two breakdowns, with per-flight deltas. */
export function changedLines(base: OrderSourceCell[], next: OrderSourceCell[]): ChangedLine[] {
  const lineKeys = new Set<string>()
  for (const c of base) lineKeys.add(cellKey(c))
  for (const c of next) lineKeys.add(cellKey(c))

  const result: ChangedLine[] = []
  for (const lk of lineKeys) {
    const b = base.filter((c) => cellKey(c) === lk)
    const n = next.filter((c) => cellKey(c) === lk)
    const from = b.reduce((s, c) => s + c.qty, 0)
    const to = n.reduce((s, c) => s + c.qty, 0)
    if (from === to) continue

    const sample = (n[0] ?? b[0])!
    const fk = new Map<string, FlightDelta>()
    for (const c of b) {
      const k = flightKey(c)
      const d = fk.get(k) ?? { flightNo: c.flightNo, dep: c.dep, arr: c.arr, groupId: c.groupId, from: 0, to: 0, delta: 0 }
      d.from += c.qty
      fk.set(k, d)
    }
    for (const c of n) {
      const k = flightKey(c)
      const d = fk.get(k) ?? { flightNo: c.flightNo, dep: c.dep, arr: c.arr, groupId: c.groupId, from: 0, to: 0, delta: 0 }
      d.to += c.qty
      fk.set(k, d)
    }
    const flights = [...fk.values()]
      .map((d) => ({ ...d, delta: d.to - d.from }))
      .filter((d) => d.delta !== 0)
      .sort((a, b2) => (a.flightNo ?? '').localeCompare(b2.flightNo ?? ''))

    result.push({ category: sample.category, name: sample.name, from, to, delta: to - from, flights })
  }
  return result.sort((a, b) => b.delta - a.delta)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/catering/orderDelta.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/catering/orderSnapshot.ts src/modules/catering/orderDelta.test.ts
git commit -m "feat(catering): changedLines version-delta with per-flight attribution"
```

---

### Task 6: Persist `breakdown` when an order is created

**Files:**
- Modify: `src/pages/catering/grouping/GroupingPage.tsx` (create-order path ~line 314)

**Interfaces:**
- Consumes: `buildOrderSnapshot` (Task 4).

- [ ] **Step 1: Read the create-order code**

Run: `sed -n '300,340p' src/pages/catering/grouping/GroupingPage.tsx`
Identify where `buildOrderLines(confirmed, profile, makeCodeOf(catalog))` is called and the `CateringOrder` object is assembled.

- [ ] **Step 2: Switch to snapshot and store breakdown**

Replace the `buildOrderLines(...)` call with `buildOrderSnapshot(...)` and put `breakdown` on the new order record. Change the import in `GroupingPage.tsx`:
```ts
import { buildOrderSnapshot, groupOrderFiles, makeCodeOf, orderFileId } from '@/modules/catering/orders'
```
and re-export `buildOrderSnapshot` from `orders.ts`:
```ts
export { buildOrderSnapshot } from './orderSnapshot'
```
At the build site:
```ts
    const { lines, breakdown } = buildOrderSnapshot(confirmed, profile, makeCodeOf(catalog))
```
and add `breakdown,` to the `CateringOrder` object literal that currently receives `lines`.

- [ ] **Step 3: Verify build + app**

Run: `npx tsc -b --noEmit 2>&1 | grep GroupingPage || echo "GroupingPage clean"`
Expected: `GroupingPage clean`.

Then in the running dev app (port 5202): Flight grouping → Run AI grouping → Confirm all → Create order. In the browser console on the order detail, confirm the persisted order carries a breakdown:
```js
JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('order')))).orders.at(-1).breakdown.length
```
Expected: a number > 0 (per-flight cells present).

- [ ] **Step 4: Commit**

```bash
git add src/modules/catering/orders.ts src/pages/catering/grouping/GroupingPage.tsx
git commit -m "feat(catering): persist per-flight breakdown snapshot on created orders"
```

---

## Self-Review

- **Spec coverage:** Data-model change (§4) → Tasks 1,3,4. Flight-source-of-truth spine (§5) → breakdown enables it (editor is P3, later plan). Delta (§6) → Task 5. P0 bug (§11) → Task 2. CSV/drawer/editor (§6 UX, P2–P4) → explicitly out of this plan (follow-up plans).
- **Placeholder scan:** none — every code step is complete.
- **Type consistency:** `OrderSourceCell` (Task 3) is consumed unchanged in Tasks 4–5; `buildOrderSnapshot`/`deriveLines`/`changedLines`/`ChangedLine`/`FlightDelta` names match across tasks.

## Follow-up plans (not in this plan)

- **P2 — Reconcile drawer (read):** `ReconcileDrawer.tsx` opened from Version History; renders `changedLines(prev.breakdown, current.breakdown)`; discrepancy-only; per-flight expansion.
- **P3 — Flight-level editing:** edit per-flight `meals`, create a new version, re-derive lines; order-line steppers become read-only.
- **P4 — CSV export:** `reconcileCsv(changed, meta)` → downloadable UTF-8 BOM CSV.

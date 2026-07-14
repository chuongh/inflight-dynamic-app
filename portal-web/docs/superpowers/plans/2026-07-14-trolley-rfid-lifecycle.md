# Trolley RFID + Lifecycle Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each trolley an RFID identity, an expanded operational status model, an airport-to-airport chain-of-custody (cabin-crew check-out/check-in), and repair-quality analytics — so ground staff can see at a glance how many carts are active / in-transit / damaged / repairing and judge repair quality per unit and per vendor.

**Architecture:** Extend the existing `TrolleyUnit` model with `rfidEpc`, `lastSeenAt`, `lastSeenStation`, an optional `custody` block, and a `movements[]` ledger. Two new pure modules — `analytics.ts` (health score, MTBF, rework, vendor scorecard) and `movement.ts` (check-out / check-in / staleness) — hold all logic and are unit-tested with a newly-added minimal Vitest harness. The mock service + React Query hooks gain check-out/check-in mutations. A loader-level `normalizeTrolley()` backfills the new fields so existing localStorage caches and `trolleys.json` seeds keep working. UI changes light up the data: enriched list columns, a 4-tab detail page with a unified lifecycle timeline, and a check-in/out modal.

**Tech Stack:** React 18 + TypeScript, Vite, Ant Design v5, TanStack Query v5, Tailwind (VJ tokens), i18next, lucide-react, Vitest (added in Task 1). Lint = oxlint.

## Global Constraints

- **All paths in this plan are relative to `portal-web/`** (the Vite app root). Repo root is `inflight-dynamic-app/`.
- **Design system:** VJ-DS-GLOBAL-001 — only the 4 brand colors + defined neutrals/status tokens. Never hardcode brand hex in components; use `vjTokens` / CSS vars (`var(--color-...)`). New status colors go through `vjTokens` and i18n, never inline.
- **No brand-hex literals, no `slate-*`/`gray-*`/`amber-*` Tailwind classes** in new code — map to CSS variables (see `src/design-system/tokens.ts`).
- **i18n:** every user-facing string added to BOTH `src/i18n/locales/vi.json` and `src/i18n/locales/en.json`. No literal UI strings in components.
- **Time:** all timestamps are epoch milliseconds (`number`), consistent with existing code. Use `Date.now()` in services/UI, but pass `now` explicitly into pure functions for testability.
- **Immutability:** never mutate a `TrolleyUnit`; always return new objects (matches `repairRequest.ts` style).
- **Verification per task:** `npx vitest run <file>` for logic tasks; `npx tsc -b` (typecheck) + `npm run lint` for every task; browser check for UI tasks (`npm run dev`, open the relevant screen).
- **Commits:** conventional commits, one per task minimum.

---

## File Structure

**New files**
- `src/modules/equipment/lib/analytics.ts` — pure repair-quality analytics (health, MTBF, rework, vendor scorecard).
- `src/modules/equipment/lib/analytics.test.ts` — unit tests for analytics.
- `src/modules/equipment/lib/movement.ts` — pure check-out / check-in / staleness logic.
- `src/modules/equipment/lib/movement.test.ts` — unit tests for movement.
- `src/modules/equipment/lib/normalizeTrolley.ts` — backfill defaults for new fields on legacy data.
- `src/components/equipment/CheckInOutModal.tsx` — record a check-out or check-in for one unit.
- `src/components/equipment/TrolleyTimeline.tsx` — unified lifecycle timeline (movements + repairs merged).
- `vitest.config.ts` — minimal test config.

**Modified files**
- `src/modules/equipment/constants.ts` — expand `TrolleyStatus`, add `MovementEvent` / `TrolleyCustody` / `ConditionReport` types + new `TrolleyUnit` fields + labels.
- `src/modules/equipment/types.ts` — extend `EquipmentEvent` union usage is superseded by `MovementEvent`; add check-in/out input types.
- `src/design-system/tokens.ts` — add `in-transit` / `retired` status tokens.
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json` — new strings.
- `src/i18n/hooks/useEquipmentLabels.ts` — new statuses in label maps + option lists.
- `src/modules/equipment/lib/generateTrolleys.ts` — seed `rfidEpc`, `lastSeenAt`, `lastSeenStation`, `movements`, some in-transit units; extend CSV export.
- `src/mock-data/loaders/loadEquipment.ts` — apply `normalizeTrolley()` in `getEquipmentCache()`.
- `src/modules/equipment/services/equipmentService.ts` — add `checkoutTrolley` / `checkinTrolley` to interface.
- `src/modules/equipment/services/mockEquipmentService.ts` — implement them.
- `src/modules/equipment/hooks/useEquipment.ts` — `useCheckoutTrolley` / `useCheckinTrolley`.
- `src/pages/equipment/trolley/TrolleyListPage.tsx` — RFID / health / custody / last-seen columns, expanded status filter, KPI header, check-in/out action.
- `src/pages/equipment/trolley/TrolleyDetailPage.tsx` — 4 tabs (Timeline / Repair quality / Movement / Info), hero health + MTBF stats.
- `package.json` — add vitest devDeps + `test` script.

---

## Task 1: Add Vitest harness

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.ts`
- Create: `src/modules/equipment/lib/smoke.test.ts` (temporary, deleted at end of task)

**Interfaces:**
- Produces: a working `npx vitest run` command and `npm test` script that other logic tasks depend on.

- [ ] **Step 1: Install vitest**

Run: `cd portal-web && npm install -D vitest@^2.1.0`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create a smoke test to prove the harness runs**

`src/modules/equipment/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('vitest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run it**

Run: `npx vitest run src/modules/equipment/lib/smoke.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 6: Delete smoke test and commit**

```bash
rm src/modules/equipment/lib/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest harness for equipment logic"
```

---

## Task 2: Expand the data model (types + tokens + labels)

**Files:**
- Modify: `src/modules/equipment/constants.ts`
- Modify: `src/design-system/tokens.ts:138-160` (equipmentStatus map)
- Modify: `src/i18n/hooks/useEquipmentLabels.ts`
- Modify: `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`

**Interfaces:**
- Produces (consumed by every later task):
  - `TrolleyStatus = 'service' | 'not-service' | 'repairing' | 'in-transit' | 'retired'`
  - `type ConditionReport = 'ok' | 'damaged'`
  - `type MovementType = 'checkout' | 'checkin'`
  - `interface MovementEvent { id, type, timestamp, station, fromStation?, toStation?, flight?, actor, condition, note? }`
  - `interface TrolleyCustody { holder, flight, fromStation, toStation, since }`
  - `TrolleyUnit` gains: `rfidEpc: string`, `lastSeenAt: number`, `lastSeenStation: string`, `custody?: TrolleyCustody`, `movements: MovementEvent[]`

- [ ] **Step 1: Extend types in `constants.ts`**

Replace the `TrolleyStatus` line (constants.ts:2) and add the new types after `TrolleyRepairEntry`:

```ts
export type TrolleyStatus = 'service' | 'not-service' | 'repairing' | 'in-transit' | 'retired'

export type ConditionReport = 'ok' | 'damaged'
export type MovementType = 'checkout' | 'checkin'

export interface MovementEvent {
  id: string
  type: MovementType
  timestamp: number
  /** Station where the scan happened */
  station: string
  /** checkout: origin station */
  fromStation?: string
  /** checkout: destination station */
  toStation?: string
  flight?: string
  /** Cabin-crew member name/id performing the scan */
  actor: string
  condition: ConditionReport
  note?: string
}

export interface TrolleyCustody {
  holder: string
  flight: string
  fromStation: string
  toStation: string
  since: number
}
```

- [ ] **Step 2: Add new fields to `TrolleyUnit` interface** (constants.ts:14-31)

Add inside the interface (after `repairHistory`):

```ts
  /** RFID EPC tag, e.g. "E280 6994 A142" — unique physical identity */
  rfidEpc: string
  /** Epoch ms of the most recent RFID scan (any gate/handheld) */
  lastSeenAt: number
  /** Station where the unit was last scanned */
  lastSeenStation: string
  /** Present only while status === 'in-transit' */
  custody?: TrolleyCustody
  /** Chain-of-custody ledger, newest-first */
  movements: MovementEvent[]
```

- [ ] **Step 3: Extend `TROLLEY_STATUS_LABELS`** (constants.ts:38-42)

```ts
export const TROLLEY_STATUS_LABELS: Record<TrolleyStatus, string> = {
  service: 'In Service',
  'not-service': 'Not-service',
  repairing: 'Repairing',
  'in-transit': 'In Transit',
  retired: 'Retired',
}
```

- [ ] **Step 4: Add status tokens in `tokens.ts`**

In the `equipmentStatus` object (tokens.ts:138), add two entries before the closing `} satisfies Record<TrolleyStatus, StatusToken>`:

```ts
    'in-transit': {
      bg: vjTokens.color.infoMuted,
      text: vjTokens.color.infoText,
      dot: vjTokens.color.info,
      border: vjTokens.color.infoBorder,
      label: 'In transit',
    },
    retired: {
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8',
      border: '#E2E8F0',
      label: 'Retired',
    },
```

> Note: `vjTokens.color.info*` already exist (tokens.ts:64-69). The `#F1F5F9/#475569/#94A3B8/#E2E8F0` neutrals are already used verbatim for `repairRequestStatus.cancelled` (tokens.ts:177-183) and `sla.normal` — reusing them is consistent, not a new hex.

- [ ] **Step 5: Add i18n keys**

In `src/i18n/locales/vi.json` under `equipment.status`, add:

```json
"in-transit": "Đang luân chuyển",
"retired": "Thanh lý"
```

In `src/i18n/locales/en.json` under `equipment.status`:

```json
"in-transit": "In transit",
"retired": "Retired"
```

- [ ] **Step 6: Wire the new statuses into `useEquipmentLabels.ts`**

Open `src/i18n/hooks/useEquipmentLabels.ts`. Ensure `statusLabel()` handles all keys (it uses `t('equipment.status.<key>')`, so Step 5 covers it). In `bulkStatusOptions()` — which builds the change-status dropdown — the bulk options should remain the manually-settable ones only. Add `retired` but NOT `in-transit` (in-transit is set by check-out, never manually):

Find the array returned by `bulkStatusOptions()` and ensure it lists `service`, `not-service`, `repairing`, `retired`. Add:

```ts
{ value: 'retired', label: statusLabel('retired') },
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc -b`
Expected: FAIL — several call sites now have non-exhaustive `TrolleyStatus` switches / records (this is expected and surfaces every place needing an update). Note each error location; the immediately-failing ones are `summarizeFleet` filters (fine, no switch), list/detail status filters. If `tsc` passes, even better. Fix any exhaustive-`switch`/`Record<TrolleyStatus>` errors by adding the two new keys. Re-run until `npx tsc -b` passes.

- [ ] **Step 8: Commit**

```bash
git add src/modules/equipment/constants.ts src/design-system/tokens.ts src/i18n
git commit -m "feat(equipment): expand trolley status model + RFID/movement types"
```

---

## Task 3: Analytics module (health, MTBF, rework, vendor scorecard)

**Files:**
- Create: `src/modules/equipment/lib/analytics.ts`
- Test: `src/modules/equipment/lib/analytics.test.ts`

**Interfaces:**
- Consumes: `TrolleyUnit`, `TrolleyRepairEntry` from `../constants`.
- Produces:
  - `computeHealthScore(unit: TrolleyUnit, now: number): number` — integer 0–100
  - `computeMtbfDays(unit: TrolleyUnit): number | null` — null when < 2 completed repairs
  - `isReworkEntry(history: TrolleyRepairEntry[], index: number, windowDays?: number): boolean`
  - `computeReworkStats(unit: TrolleyUnit): { reworkCount: number; total: number; rate: number }`
  - `computeVendorScorecard(trolleys: TrolleyUnit[]): VendorScore[]` where `VendorScore = { vendor: string; repairs: number; reworks: number; reworkRate: number; avgTatDays: number }`

- [ ] **Step 1: Write the failing tests**

`src/modules/equipment/lib/analytics.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TrolleyRepairEntry, TrolleyUnit } from '../constants'
import {
  computeHealthScore,
  computeMtbfDays,
  computeReworkStats,
  computeVendorScorecard,
  isReworkEntry,
} from './analytics'

const DAY = 86_400_000
const NOW = 1_760_000_000_000 // fixed epoch for determinism

function entry(p: Partial<TrolleyRepairEntry> & { startedAt: number }): TrolleyRepairEntry {
  return {
    id: `e-${p.startedAt}`,
    startedAt: p.startedAt,
    completedAt: p.completedAt ?? p.startedAt + 3 * DAY,
    issueDescription: p.issueDescription ?? 'Wheel failure',
    repairContent: p.repairContent ?? 'Replaced wheel',
    rootCause: p.rootCause ?? 'Wear',
    vendor: p.vendor ?? 'ABC Repair',
  }
}

function unit(p: Partial<TrolleyUnit>): TrolleyUnit {
  return {
    code: 'F-001', type: 'full', status: 'service', station: 'SGN',
    repairs: 0, lastRepairReason: '—', vendor: 'ABC Repair', daysInStatus: 1,
    updatedAt: NOW, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
    yearOfManufacture: 2020, registrationLocation: 'SGN', repairHistory: [],
    rfidEpc: 'E280 0000 0001', lastSeenAt: NOW, lastSeenStation: 'SGN', movements: [],
    ...p,
  }
}

describe('computeHealthScore', () => {
  it('is 100 for a brand-new unit with no repairs', () => {
    expect(computeHealthScore(unit({ yearOfManufacture: 2026 }), NOW)).toBe(100)
  })

  it('drops with repair count, age, and rework, clamped to 0..100', () => {
    const many = Array.from({ length: 9 }, (_, i) => entry({ startedAt: NOW - (300 - i * 30) * DAY }))
    const score = computeHealthScore(
      unit({ repairs: 9, yearOfManufacture: 2020, repairHistory: many }),
      NOW,
    )
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThan(60)
  })
})

describe('computeMtbfDays', () => {
  it('returns null when fewer than 2 completed repairs', () => {
    expect(computeMtbfDays(unit({ repairHistory: [entry({ startedAt: NOW - 10 * DAY })] }))).toBeNull()
  })

  it('averages the gap between consecutive completed repair starts', () => {
    const h = [
      entry({ startedAt: NOW - 100 * DAY }),
      entry({ startedAt: NOW - 60 * DAY }),
      entry({ startedAt: NOW - 20 * DAY }),
    ]
    // gaps: 40d and 40d -> mean 40
    expect(computeMtbfDays(unit({ repairHistory: h }))).toBe(40)
  })
})

describe('isReworkEntry / computeReworkStats', () => {
  it('flags a repair that follows another within 30 days', () => {
    // history is newest-first (matches app convention)
    const history = [
      entry({ startedAt: NOW - 5 * DAY }),   // index 0, newest — 17d after prev -> rework
      entry({ startedAt: NOW - 22 * DAY }),  // index 1, older
    ]
    expect(isReworkEntry(history, 0)).toBe(true)
    expect(isReworkEntry(history, 1)).toBe(false)
  })

  it('does not flag repairs spaced beyond the window', () => {
    const history = [entry({ startedAt: NOW - 5 * DAY }), entry({ startedAt: NOW - 90 * DAY })]
    expect(isReworkEntry(history, 0)).toBe(false)
  })

  it('computes rework rate over total repairs', () => {
    const history = [entry({ startedAt: NOW - 5 * DAY }), entry({ startedAt: NOW - 22 * DAY })]
    const stats = computeReworkStats(unit({ repairHistory: history }))
    expect(stats).toEqual({ reworkCount: 1, total: 2, rate: 0.5 })
  })
})

describe('computeVendorScorecard', () => {
  it('aggregates repairs, reworks and TAT per vendor, sorted by reworkRate desc', () => {
    const a = unit({
      code: 'F-002',
      repairHistory: [
        entry({ startedAt: NOW - 5 * DAY, vendor: 'ABC Repair' }),
        entry({ startedAt: NOW - 22 * DAY, vendor: 'ABC Repair' }),
      ],
    })
    const b = unit({
      code: 'F-003',
      repairHistory: [entry({ startedAt: NOW - 200 * DAY, completedAt: NOW - 196 * DAY, vendor: 'TLD Vietnam' })],
    })
    const board = computeVendorScorecard([a, b])
    const abc = board.find((v) => v.vendor === 'ABC Repair')!
    const tld = board.find((v) => v.vendor === 'TLD Vietnam')!
    expect(abc.repairs).toBe(2)
    expect(abc.reworks).toBe(1)
    expect(tld.reworks).toBe(0)
    expect(board[0].vendor).toBe('ABC Repair') // highest rework rate first
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/equipment/lib/analytics.test.ts`
Expected: FAIL — "Cannot find module './analytics'".

- [ ] **Step 3: Implement `analytics.ts`**

```ts
import type { TrolleyRepairEntry, TrolleyUnit } from '../constants'

const DAY = 86_400_000
const REWORK_WINDOW_DAYS = 30

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** Completed repairs only, sorted oldest→newest by startedAt. */
function completedSorted(unit: TrolleyUnit): TrolleyRepairEntry[] {
  return unit.repairHistory
    .filter((entry) => entry.completedAt != null)
    .slice()
    .sort((left, right) => left.startedAt - right.startedAt)
}

/**
 * 0–100. Starts at 100; penalised by repair count, age, and recent rework.
 * Deterministic and monotonic — new+unrepaired = 100.
 */
export function computeHealthScore(unit: TrolleyUnit, now: number): number {
  const ageYears = Math.max(0, (now - new Date(unit.yearOfManufacture, 0, 1).getTime()) / (365 * DAY))
  const { reworkCount } = computeReworkStats(unit)
  const raw = 100 - unit.repairs * 6 - ageYears * 3 - reworkCount * 10
  return Math.round(clamp(raw, 0, 100))
}

/** Mean days between consecutive completed repairs; null if < 2. */
export function computeMtbfDays(unit: TrolleyUnit): number | null {
  const completed = completedSorted(unit)
  if (completed.length < 2) return null
  let totalGap = 0
  for (let i = 1; i < completed.length; i += 1) {
    totalGap += completed[i].startedAt - completed[i - 1].startedAt
  }
  return Math.round(totalGap / (completed.length - 1) / DAY)
}

/**
 * True when the repair at `index` (in a newest-first history) started within
 * REWORK_WINDOW_DAYS after the immediately-preceding (older) repair completed.
 */
export function isReworkEntry(
  history: TrolleyRepairEntry[],
  index: number,
  windowDays = REWORK_WINDOW_DAYS,
): boolean {
  const current = history[index]
  const previous = history[index + 1] // older (history is newest-first)
  if (!current || !previous) return false
  const previousEnd = previous.completedAt ?? previous.startedAt
  const gapDays = (current.startedAt - previousEnd) / DAY
  return gapDays >= 0 && gapDays <= windowDays
}

export function computeReworkStats(unit: TrolleyUnit): {
  reworkCount: number
  total: number
  rate: number
} {
  const history = unit.repairHistory
  let reworkCount = 0
  for (let i = 0; i < history.length; i += 1) {
    if (isReworkEntry(history, i)) reworkCount += 1
  }
  const total = history.length
  return { reworkCount, total, rate: total === 0 ? 0 : reworkCount / total }
}

export interface VendorScore {
  vendor: string
  repairs: number
  reworks: number
  reworkRate: number
  avgTatDays: number
}

export function computeVendorScorecard(trolleys: TrolleyUnit[]): VendorScore[] {
  const map = new Map<string, { repairs: number; reworks: number; tatSum: number; tatCount: number }>()

  for (const unit of trolleys) {
    const history = unit.repairHistory
    for (let i = 0; i < history.length; i += 1) {
      const entry = history[i]
      const bucket = map.get(entry.vendor) ?? { repairs: 0, reworks: 0, tatSum: 0, tatCount: 0 }
      bucket.repairs += 1
      if (isReworkEntry(history, i)) bucket.reworks += 1
      if (entry.completedAt != null) {
        bucket.tatSum += Math.max(1, Math.floor((entry.completedAt - entry.startedAt) / DAY))
        bucket.tatCount += 1
      }
      map.set(entry.vendor, bucket)
    }
  }

  return Array.from(map.entries())
    .map(([vendor, b]) => ({
      vendor,
      repairs: b.repairs,
      reworks: b.reworks,
      reworkRate: b.repairs === 0 ? 0 : b.reworks / b.repairs,
      avgTatDays: b.tatCount === 0 ? 0 : Math.round((b.tatSum / b.tatCount) * 10) / 10,
    }))
    .sort((left, right) => right.reworkRate - left.reworkRate || right.repairs - left.repairs)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/modules/equipment/lib/analytics.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc -b
git add src/modules/equipment/lib/analytics.ts src/modules/equipment/lib/analytics.test.ts
git commit -m "feat(equipment): repair-quality analytics (health, MTBF, rework, vendor scorecard)"
```

---

## Task 4: Movement module (check-out / check-in / staleness)

**Files:**
- Create: `src/modules/equipment/lib/movement.ts`
- Test: `src/modules/equipment/lib/movement.test.ts`

**Interfaces:**
- Consumes: `TrolleyUnit`, `MovementEvent`, `ConditionReport` from `../constants`.
- Produces:
  - `interface CheckoutInput { actor: string; flight: string; fromStation: string; toStation: string; condition: ConditionReport; note?: string }`
  - `interface CheckinInput { actor: string; station: string; condition: ConditionReport; note?: string }`
  - `applyCheckout(unit: TrolleyUnit, input: CheckoutInput, now: number): TrolleyUnit`
  - `applyCheckin(unit: TrolleyUnit, input: CheckinInput, now: number): TrolleyUnit`
  - `isStale(unit: TrolleyUnit, now: number, thresholdDays?: number): boolean`

- [ ] **Step 1: Write the failing tests**

`src/modules/equipment/lib/movement.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TrolleyUnit } from '../constants'
import { applyCheckin, applyCheckout, isStale } from './movement'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

function unit(p: Partial<TrolleyUnit> = {}): TrolleyUnit {
  return {
    code: 'F-001', type: 'full', status: 'service', station: 'SGN',
    repairs: 0, lastRepairReason: '—', vendor: 'ABC Repair', daysInStatus: 5,
    updatedAt: NOW - 5 * DAY, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
    yearOfManufacture: 2022, registrationLocation: 'SGN', repairHistory: [],
    rfidEpc: 'E280 0000 0001', lastSeenAt: NOW - 5 * DAY, lastSeenStation: 'SGN', movements: [],
    ...p,
  }
}

describe('applyCheckout', () => {
  it('moves unit to in-transit with custody and a checkout movement', () => {
    const next = applyCheckout(
      unit(),
      { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' },
      NOW,
    )
    expect(next.status).toBe('in-transit')
    expect(next.custody).toEqual({ holder: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', since: NOW })
    expect(next.lastSeenAt).toBe(NOW)
    expect(next.lastSeenStation).toBe('SGN')
    expect(next.movements[0]).toMatchObject({ type: 'checkout', flight: 'VJ311', toStation: 'HAN', condition: 'ok' })
  })
})

describe('applyCheckin', () => {
  it('returns to service and clears custody when condition ok', () => {
    const inTransit = applyCheckout(unit(), { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' }, NOW)
    const next = applyCheckin(inTransit, { actor: 'CC. Ha', station: 'HAN', condition: 'ok' }, NOW + DAY)
    expect(next.status).toBe('service')
    expect(next.custody).toBeUndefined()
    expect(next.station).toBe('HAN')
    expect(next.lastSeenStation).toBe('HAN')
    expect(next.movements[0]).toMatchObject({ type: 'checkin', station: 'HAN', condition: 'ok' })
  })

  it('moves to not-service when condition damaged', () => {
    const inTransit = applyCheckout(unit(), { actor: 'CC. Lan', flight: 'VJ311', fromStation: 'SGN', toStation: 'HAN', condition: 'ok' }, NOW)
    const next = applyCheckin(inTransit, { actor: 'CC. Ha', station: 'HAN', condition: 'damaged', note: 'Rear wheel seized' }, NOW + DAY)
    expect(next.status).toBe('not-service')
    expect(next.lastRepairReason).toBe('Rear wheel seized')
    expect(next.daysInStatus).toBe(0)
  })
})

describe('isStale', () => {
  it('flags units not scanned within threshold, excluding in-transit/retired', () => {
    expect(isStale(unit({ lastSeenAt: NOW - 8 * DAY }), NOW)).toBe(true)
    expect(isStale(unit({ lastSeenAt: NOW - 3 * DAY }), NOW)).toBe(false)
    expect(isStale(unit({ status: 'in-transit', lastSeenAt: NOW - 40 * DAY }), NOW)).toBe(false)
    expect(isStale(unit({ status: 'retired', lastSeenAt: NOW - 40 * DAY }), NOW)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/equipment/lib/movement.test.ts`
Expected: FAIL — "Cannot find module './movement'".

- [ ] **Step 3: Implement `movement.ts`**

```ts
import type { ConditionReport, MovementEvent, TrolleyUnit } from '../constants'

const DAY = 86_400_000
const STALE_THRESHOLD_DAYS = 7

export interface CheckoutInput {
  actor: string
  flight: string
  fromStation: string
  toStation: string
  condition: ConditionReport
  note?: string
}

export interface CheckinInput {
  actor: string
  station: string
  condition: ConditionReport
  note?: string
}

function movementId(code: string, now: number, type: string) {
  return `${code}-mv-${type}-${now}`
}

export function applyCheckout(unit: TrolleyUnit, input: CheckoutInput, now: number): TrolleyUnit {
  const movement: MovementEvent = {
    id: movementId(unit.code, now, 'out'),
    type: 'checkout',
    timestamp: now,
    station: input.fromStation,
    fromStation: input.fromStation,
    toStation: input.toStation,
    flight: input.flight,
    actor: input.actor,
    condition: input.condition,
    note: input.note,
  }
  return {
    ...unit,
    status: 'in-transit',
    custody: {
      holder: input.actor,
      flight: input.flight,
      fromStation: input.fromStation,
      toStation: input.toStation,
      since: now,
    },
    lastSeenAt: now,
    lastSeenStation: input.fromStation,
    updatedAt: now,
    movements: [movement, ...unit.movements],
  }
}

export function applyCheckin(unit: TrolleyUnit, input: CheckinInput, now: number): TrolleyUnit {
  const damaged = input.condition === 'damaged'
  const movement: MovementEvent = {
    id: movementId(unit.code, now, 'in'),
    type: 'checkin',
    timestamp: now,
    station: input.station,
    actor: input.actor,
    condition: input.condition,
    note: input.note,
  }
  return {
    ...unit,
    status: damaged ? 'not-service' : 'service',
    custody: undefined,
    station: input.station,
    lastSeenAt: now,
    lastSeenStation: input.station,
    daysInStatus: 0,
    updatedAt: now,
    lastRepairReason: damaged ? input.note ?? unit.lastRepairReason : unit.lastRepairReason,
    movements: [movement, ...unit.movements],
  }
}

export function isStale(unit: TrolleyUnit, now: number, thresholdDays = STALE_THRESHOLD_DAYS): boolean {
  if (unit.status === 'in-transit' || unit.status === 'retired') return false
  return now - unit.lastSeenAt > thresholdDays * DAY
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/modules/equipment/lib/movement.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc -b
git add src/modules/equipment/lib/movement.ts src/modules/equipment/lib/movement.test.ts
git commit -m "feat(equipment): chain-of-custody check-out/check-in + staleness logic"
```

---

## Task 5: Backfill loader + seed new fields in the generator

**Files:**
- Create: `src/modules/equipment/lib/normalizeTrolley.ts`
- Test: `src/modules/equipment/lib/normalizeTrolley.test.ts`
- Modify: `src/mock-data/loaders/loadEquipment.ts`
- Modify: `src/modules/equipment/lib/generateTrolleys.ts`

**Interfaces:**
- Consumes: `TrolleyUnit` from `../constants`.
- Produces: `normalizeTrolley(unit: TrolleyUnit, now: number): TrolleyUnit` — fills `rfidEpc`, `lastSeenAt`, `lastSeenStation`, `movements` when missing (idempotent; never overwrites present values).

- [ ] **Step 1: Write failing test for normalize**

`src/modules/equipment/lib/normalizeTrolley.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TrolleyUnit } from '../constants'
import { normalizeTrolley } from './normalizeTrolley'

const NOW = 1_760_000_000_000

const legacy = {
  code: 'F-142', type: 'full', status: 'not-service', station: 'SGN',
  repairs: 9, lastRepairReason: 'Wheel', vendor: 'ABC Repair', daysInStatus: 3,
  updatedAt: NOW, partNo: 'AT-1', serialNumber: 'SN-1', manufacturer: 'Zodiac',
  yearOfManufacture: 2020, registrationLocation: 'SGN', repairHistory: [],
} as unknown as TrolleyUnit

describe('normalizeTrolley', () => {
  it('adds a deterministic RFID EPC derived from the code', () => {
    const a = normalizeTrolley(legacy, NOW)
    const b = normalizeTrolley(legacy, NOW)
    expect(a.rfidEpc).toMatch(/^E280 /)
    expect(a.rfidEpc).toBe(b.rfidEpc) // deterministic
  })

  it('fills lastSeenAt/lastSeenStation and empty movements when missing', () => {
    const n = normalizeTrolley(legacy, NOW)
    expect(typeof n.lastSeenAt).toBe('number')
    expect(n.lastSeenStation).toBe('SGN')
    expect(Array.isArray(n.movements)).toBe(true)
  })

  it('never overwrites values that already exist', () => {
    const withData = { ...legacy, rfidEpc: 'E280 AAAA BBBB', lastSeenStation: 'HAN', movements: [] } as TrolleyUnit
    const n = normalizeTrolley(withData, NOW)
    expect(n.rfidEpc).toBe('E280 AAAA BBBB')
    expect(n.lastSeenStation).toBe('HAN')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/modules/equipment/lib/normalizeTrolley.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `normalizeTrolley.ts`**

```ts
import type { TrolleyUnit } from '../constants'

/** Deterministic 8-hex-char suffix from the unit code, e.g. "F-142" -> "6994A142". */
function epcFromCode(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0').slice(0, 8)
  return `E280 ${hex.slice(0, 4)} ${hex.slice(4, 8)}`
}

/** Idempotently fill the RFID/movement fields for legacy or JSON-seeded units. */
export function normalizeTrolley(unit: TrolleyUnit, now: number): TrolleyUnit {
  const next: TrolleyUnit = { ...unit }
  if (!next.rfidEpc) next.rfidEpc = epcFromCode(unit.code)
  if (!next.movements) next.movements = []
  if (!next.lastSeenStation) next.lastSeenStation = unit.station
  if (typeof next.lastSeenAt !== 'number') {
    // in-transit units are "seen" at checkout; others fall back to updatedAt
    next.lastSeenAt = unit.updatedAt ?? now
  }
  return next
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/modules/equipment/lib/normalizeTrolley.test.ts`
Expected: PASS.

- [ ] **Step 5: Apply normalize in the loader**

In `src/mock-data/loaders/loadEquipment.ts`, import at top:

```ts
import { normalizeTrolley } from '@/modules/equipment/lib/normalizeTrolley'
```

Then change `getEquipmentCache()` (loadEquipment.ts, the block that returns `ensureRepairRequests(...)`) to normalize trolleys first. Replace the body of `ensureRepairRequests` OR add a sibling step — simplest is to wrap in `getEquipmentCache`:

```ts
export function getEquipmentCache(): EquipmentCache {
  const now = Date.now()
  const normalize = (cache: EquipmentCache): EquipmentCache => ({
    ...cache,
    trolleys: cache.trolleys.map((unit) => normalizeTrolley(unit, now)),
  })

  const cached = readCache()
  if (cached) return ensureRepairRequests(normalize(cached))
  const seeded = normalize(seedFromJson())
  const withRequests = ensureRepairRequests(seeded)
  writeCache(withRequests)
  return withRequests
}
```

- [ ] **Step 6: Seed richer fields in the generator**

In `src/modules/equipment/lib/generateTrolleys.ts`, extend `buildUnit`'s return object (generateTrolleys.ts:156-174) to add the new fields. Add before the closing `}` of the returned object:

```ts
    rfidEpc: `E280 6994 ${options.code.replace(/[^A-Z0-9]/gi, '').padStart(4, '0').slice(-4).toUpperCase()}`,
    lastSeenAt: options.now - Math.floor(options.random() * 6) * 3_600_000,
    lastSeenStation: options.station,
    movements: [],
```

Then add an `in-transit` slice to the fleet mix. In `generateTrolleys()` after `const repairingCount = 34`, add:

```ts
  const inTransitCount = 21
```

Change `const serviceCount = total - notServiceCount - repairingCount` to:

```ts
  const serviceCount = total - notServiceCount - repairingCount - inTransitCount
```

And add in-transit units to `statusQueue` (after the repairing spread):

```ts
    ...Array.from({ length: Math.max(0, inTransitCount) }, () => 'in-transit' as const),
```

Add an `in-transit` branch to the `completedRepairs` ternary in `pushUnit` (generateTrolleys.ts:287-292) and the `daysInStatus` ternary — treat `in-transit` like `service` (low repairs):

```ts
    const completedRepairs =
      status === 'service' || status === 'in-transit'
        ? Math.floor(random() * 4)
        : status === 'not-service'
          ? 1 + Math.floor(random() * 5)
          : 2 + Math.floor(random() * 6)
```

- [ ] **Step 7: Extend CSV export with RFID + last-seen**

In `exportTrolleysCsv` (generateTrolleys.ts:333-377): add `'RFID/EPC'` and `'Last seen station'` to `headers` (after `'Code'` and after `'Station'` respectively) and the matching `item.rfidEpc` / `item.lastSeenStation` values into each row at the same positions.

- [ ] **Step 8: Regenerate the JSON seed**

Run: `npm run seed:mock-data`
Expected: `src/mock-data/equipment/trolleys.json` regenerated with the new fields. (If the script errors on the new fields, inspect `scripts/seed-mock-data.ts` — it likely just serialises `generateTrolleys()`; no change needed.)

- [ ] **Step 9: Verify + commit**

Run: `npx vitest run src/modules/equipment/lib/normalizeTrolley.test.ts && npx tsc -b`
Expected: PASS + clean typecheck.

```bash
git add src/modules/equipment/lib/normalizeTrolley.ts src/modules/equipment/lib/normalizeTrolley.test.ts src/mock-data/loaders/loadEquipment.ts src/modules/equipment/lib/generateTrolleys.ts src/mock-data/equipment/trolleys.json
git commit -m "feat(equipment): backfill RFID/movement fields + seed in-transit fleet"
```

---

## Task 6: Service + hooks for check-out / check-in

**Files:**
- Modify: `src/modules/equipment/services/equipmentService.ts` (interface)
- Modify: `src/modules/equipment/services/mockEquipmentService.ts` (implementation)
- Modify: `src/modules/equipment/hooks/useEquipment.ts`

**Interfaces:**
- Consumes: `applyCheckout`, `applyCheckin`, `CheckoutInput`, `CheckinInput` from `../lib/movement`.
- Produces:
  - `EquipmentService.checkoutTrolley(code: string, input: CheckoutInput): Promise<TrolleyUnit>`
  - `EquipmentService.checkinTrolley(code: string, input: CheckinInput): Promise<TrolleyUnit>`
  - Hooks `useCheckoutTrolley()` / `useCheckinTrolley()` returning mutations keyed on `{ code, input }`.

- [ ] **Step 1: Extend the service interface**

In `equipmentService.ts`, add imports and two methods to the `EquipmentService` interface:

```ts
import type { CheckinInput, CheckoutInput } from '../lib/movement'
```
```ts
  checkoutTrolley(code: string, input: CheckoutInput): Promise<TrolleyUnit>
  checkinTrolley(code: string, input: CheckinInput): Promise<TrolleyUnit>
```

- [ ] **Step 2: Implement in the mock service**

In `mockEquipmentService.ts`, add imports:

```ts
import { applyCheckin, applyCheckout, type CheckinInput, type CheckoutInput } from '../lib/movement'
```

Add these methods to the `mockEquipmentService` object (mirror the existing `saveTrolleys` cache pattern):

```ts
  async checkoutTrolley(code: string, input: CheckoutInput) {
    const cache = getEquipmentCache()
    const now = Date.now()
    let updated: TrolleyUnit | null = null
    const trolleys = cache.trolleys.map((unit) => {
      if (unit.code !== code) return unit
      updated = applyCheckout(unit, input, now)
      return updated
    })
    if (!updated) throw new Error(`Trolley ${code} not found`)
    saveEquipmentCache({ ...cache, trolleys })
    return updated
  },

  async checkinTrolley(code: string, input: CheckinInput) {
    const cache = getEquipmentCache()
    const now = Date.now()
    let updated: TrolleyUnit | null = null
    const trolleys = cache.trolleys.map((unit) => {
      if (unit.code !== code) return unit
      updated = applyCheckin(unit, input, now)
      return updated
    })
    if (!updated) throw new Error(`Trolley ${code} not found`)
    saveEquipmentCache({ ...cache, trolleys })
    return updated
  },
```

- [ ] **Step 3: Add hooks**

In `useEquipment.ts`, add imports and two hooks:

```ts
import type { CheckinInput, CheckoutInput } from '../lib/movement'
```
```ts
export function useCheckoutTrolley() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, input }: { code: string; input: CheckoutInput }) =>
      equipmentService.checkoutTrolley(code, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trolleyQueryKey })
    },
  })
}

export function useCheckinTrolley() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, input }: { code: string; input: CheckinInput }) =>
      equipmentService.checkinTrolley(code, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trolleyQueryKey })
    },
  })
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc -b`
Expected: PASS.

```bash
git add src/modules/equipment/services src/modules/equipment/hooks/useEquipment.ts
git commit -m "feat(equipment): checkout/checkin service methods + query hooks"
```

---

## Task 7: List page — RFID, health, custody, last-seen columns + status filter + KPIs

**Files:**
- Modify: `src/pages/equipment/trolley/TrolleyListPage.tsx`

**Interfaces:**
- Consumes: `computeHealthScore` from `../../../modules/equipment/lib/analytics`; `isStale` from `../../../modules/equipment/lib/movement`; new `TrolleyUnit` fields.

- [ ] **Step 1: Import analytics + movement helpers**

At the top of `TrolleyListPage.tsx` add:

```ts
import { computeHealthScore } from '@/modules/equipment/lib/analytics'
import { isStale } from '@/modules/equipment/lib/movement'
```

- [ ] **Step 2: Add the In-transit / Retired options to the status filter**

In the status `<Select>` (TrolleyListPage.tsx:320-329) add options:

```tsx
              { value: 'in-transit', label: statusLabel('in-transit') },
              { value: 'retired', label: statusLabel('retired') },
```

- [ ] **Step 3: Add an RFID column** (after the `code` column, before `type`)

```tsx
    {
      title: t('equipment.columns.rfid'),
      dataIndex: 'rfidEpc',
      width: 140,
      render: (value: string) => (
        <span className="tnum text-[11.5px] font-semibold text-[var(--color-text-secondary)]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
          {value}
        </span>
      ),
    },
```

- [ ] **Step 4: Add Health, Custody, Last-seen columns** (after the `status` column)

```tsx
    {
      title: t('equipment.columns.health'),
      key: 'health',
      width: 120,
      sorter: (left, right) => computeHealthScore(left, Date.now()) - computeHealthScore(right, Date.now()),
      render: (_: unknown, record: TrolleyUnit) => {
        const score = computeHealthScore(record, Date.now())
        const tone = score >= 75 ? 'var(--color-vj-green)' : score >= 50 ? 'var(--color-vj-yellow)' : 'var(--color-vj-red)'
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-13 overflow-hidden rounded-full bg-[var(--color-border)]" style={{ width: 52 }}>
              <span className="block h-full rounded-full" style={{ width: `${score}%`, background: tone }} />
            </div>
            <span className="tnum text-xs font-bold" style={{ color: tone }}>{score}</span>
          </div>
        )
      },
    },
    {
      title: t('equipment.columns.custody'),
      key: 'custody',
      width: 180,
      render: (_: unknown, record: TrolleyUnit) =>
        record.custody ? (
          <Text variant="caption" tone="secondary">
            {record.custody.holder} · {record.custody.flight}
          </Text>
        ) : (
          <Text variant="caption" tone="muted">—</Text>
        ),
    },
    {
      title: t('equipment.columns.lastSeen'),
      key: 'lastSeen',
      width: 130,
      sorter: (left, right) => left.lastSeenAt - right.lastSeenAt,
      render: (_: unknown, record: TrolleyUnit) => {
        const stale = isStale(record, Date.now())
        return (
          <div className="leading-tight">
            <span className={`tnum text-xs font-semibold ${stale ? 'text-vj-red' : 'text-[var(--color-vj-green-text)]'}`}>
              {formatRelativeAgo(record.lastSeenAt)}
            </span>
            <div className="text-[11px] text-[var(--color-text-muted)]">{record.lastSeenStation}</div>
          </div>
        )
      },
    },
```

Add `t('equipment.columns.rfid')`, `health`, `custody`, `lastSeen` to i18n in Task 10.

- [ ] **Step 4b: Verify the columns render**

Run: `npm run dev`, open `/equipment`. Confirm RFID, Health bar, Custody, Last-seen columns appear and the status filter lists "Đang luân chuyển" / "Thanh lý".
Expected: table shows new columns; in-transit rows show a custody holder; no console errors (`read_console_messages`).

- [ ] **Step 5: Add a KPI summary strip above the table**

`summarizeFleet` (generateTrolleys.ts:323) currently counts service/notService/repairing. Extend it to also return `inTransit` and `retired`:

```ts
  const inTransit = trolleys.filter((item) => item.status === 'in-transit').length
  const retired = trolleys.filter((item) => item.status === 'retired').length
  return { total: trolleys.length, full, half, service, notService, repairing, inTransit, retired }
```

Then in `TrolleyListPage.tsx`, render a KPI row using the existing `KpiCard` pattern (see `TrolleyRepairHistoryDrawer.tsx:154-181`) just above `<Table>`, wired to `summary.service`, `summary.inTransit`, `summary.notService`, `summary.repairing`. Reuse `import { KpiCard } from '@/components/patterns/KpiCard'`.

- [ ] **Step 6: Typecheck, lint, browser verify, commit**

```bash
npx tsc -b && npm run lint
git add src/pages/equipment/trolley/TrolleyListPage.tsx src/modules/equipment/lib/generateTrolleys.ts
git commit -m "feat(equipment): RFID/health/custody/last-seen columns + fleet KPIs on trolley list"
```

---

## Task 8: Detail page — 4 tabs, unified timeline, hero health + MTBF

**Files:**
- Modify: `src/pages/equipment/trolley/TrolleyDetailPage.tsx`
- Create: `src/components/equipment/TrolleyTimeline.tsx`

**Interfaces:**
- Consumes: `computeHealthScore`, `computeMtbfDays`, `computeReworkStats`, `isReworkEntry` from analytics; `MovementEvent`, `TrolleyRepairEntry` from constants.

- [ ] **Step 1: Build the unified timeline component**

`src/components/equipment/TrolleyTimeline.tsx` — merge `movements` + `repairHistory` into one chronologically-sorted list (newest first). Each repair yields a "sent to repair" node (at `startedAt`) and, if completed, a "repair completed" node (at `completedAt`); each movement yields a checkout/checkin node. Render with the VJ token colors (info for movement, red for damage/checkin-damaged, yellow for repairing, green for completed/checkin-ok). Signature:

```tsx
import type { MovementEvent, TrolleyUnit } from '@/modules/equipment/constants'

interface TrolleyTimelineProps {
  unit: TrolleyUnit
}

interface TimelineNode {
  key: string
  at: number
  kind: 'checkout' | 'checkin-ok' | 'checkin-damaged' | 'repair-sent' | 'repair-done'
  title: string
  body?: string
  meta: Array<{ label: string; value: string }>
  rework?: boolean
}

export function TrolleyTimeline({ unit }: TrolleyTimelineProps) {
  // build nodes from unit.movements and unit.repairHistory, sort by `at` desc, render.
}
```

Build the node list:

```tsx
  const nodes: TimelineNode[] = []
  for (const m of unit.movements) {
    const kind = m.type === 'checkout' ? 'checkout' : m.condition === 'damaged' ? 'checkin-damaged' : 'checkin-ok'
    nodes.push({
      key: m.id, at: m.timestamp, kind,
      title: m.type === 'checkout' ? 'Check-out' : m.condition === 'damaged' ? 'Check-in (damaged)' : 'Check-in',
      body: m.note,
      meta: [
        { label: 'Station', value: m.type === 'checkout' ? `${m.fromStation} → ${m.toStation}` : `→ ${m.station}` },
        { label: 'Flight', value: m.flight ?? '—' },
        { label: 'By', value: m.actor },
      ],
    })
  }
  unit.repairHistory.forEach((r, index) => {
    nodes.push({
      key: `${r.id}-sent`, at: r.startedAt, kind: 'repair-sent',
      title: 'Sent to repair', body: r.issueDescription,
      meta: [{ label: 'Vendor', value: r.vendor }],
    })
    if (r.completedAt != null) {
      nodes.push({
        key: `${r.id}-done`, at: r.completedAt, kind: 'repair-done',
        title: 'Repair completed',
        body: [r.repairContent, r.rootCause].filter(Boolean).join(' · '),
        meta: [{ label: 'Vendor', value: r.vendor }],
        rework: isReworkEntry(unit.repairHistory, index),
      })
    }
  })
  nodes.sort((a, b) => b.at - a.at)
```

Render each node with a left rail + colored dot per `kind` (reuse the mockup's `.tl` CSS as Tailwind/inline styles mapped to VJ tokens). Import `isReworkEntry` from `@/modules/equipment/lib/analytics`.

- [ ] **Step 2: Add hero health + MTBF stats**

In `TrolleyDetailPage.tsx`, compute near `avgCycle` (line 159):

```ts
const health = computeHealthScore(trolley, Date.now())
const mtbf = computeMtbfDays(trolley)
const rework = computeReworkStats(trolley)
```

Add three stat blocks to the `DetailHero` `meta` (alongside the existing repairs / avg cycle / last repair blocks): Health `{health}/100`, MTBF `{mtbf ?? '—'} days`, Rework rate `{Math.round(rework.rate*100)}%`. Show the RFID EPC in the hero sub-line: append ` · EPC {trolley.rfidEpc}` to the meta `<Text>` at line 247-250.

- [ ] **Step 3: Replace the 2-tab layout with 4 tabs**

Change the `Tabs` `items` (TrolleyDetailPage.tsx:302-373) to four:
1. `timeline` → `<TrolleyTimeline unit={trolley} />`
2. `repair` → the existing repair history table PLUS a "Quality" column that renders a badge from `isReworkEntry(trolley.repairHistory, index)` (rework = red badge) and a header row of KPIs (rework rate, MTBF, avg TAT) using the values from Step 2.
3. `movement` → an Ant `Table` over `trolley.movements` with columns: time (`formatDateDMY`), event (checkout/checkin badge), leg (`from→to` or `→station`), flight, actor, condition badge.
4. `info` → the existing info `dl`, plus rows for RFID/EPC, Last seen, Current custody.

Keep the existing repair table code for tab 2 (move it, don't rewrite). Add the "Quality" column at the end of `repairColumns`:

```tsx
      {
        title: t('equipment.repairColumns.quality'),
        key: 'quality',
        width: 110,
        render: (_: unknown, _entry: TrolleyRepairEntry, index: number) =>
          isReworkEntry(trolley.repairHistory, index) ? (
            <span className="rounded-md bg-[var(--color-vj-red-muted)] px-2 py-0.5 text-[11px] font-bold text-vj-red">
              {t('equipment.repairColumns.rework')}
            </span>
          ) : (
            <span className="rounded-md bg-[var(--color-vj-green-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-vj-green-text)]">
              {t('equipment.repairColumns.pass')}
            </span>
          ),
      },
```

> Note: `filteredHistory` is a filtered slice, so pass the entry's index **within `trolley.repairHistory`** to `isReworkEntry`, not the filtered index. Compute rework in a `Map<entryId, boolean>` from the full history once, then look up by `entry.id` inside the render to stay correct under filtering.

- [ ] **Step 4: Browser-verify the detail page**

Run: `npm run dev`, open a unit with repairs + movements (e.g. `/equipment/F-102`). Confirm all 4 tabs render, timeline is chronological, rework badges show, hero shows Health/MTBF/EPC.
Expected: no console errors; timeline newest-first; a rework repair shows the red "Tái hỏng" badge.

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc -b && npm run lint
git add src/pages/equipment/trolley/TrolleyDetailPage.tsx src/components/equipment/TrolleyTimeline.tsx
git commit -m "feat(equipment): 4-tab detail with unified lifecycle timeline + quality signals"
```

---

## Task 9: Check-in / Check-out modal

**Files:**
- Create: `src/components/equipment/CheckInOutModal.tsx`
- Modify: `src/pages/equipment/trolley/TrolleyDetailPage.tsx` (wire the modal + hero button)

**Interfaces:**
- Consumes: `useCheckoutTrolley`, `useCheckinTrolley` from hooks; `CheckoutInput`, `CheckinInput` from movement; `STATIONS` from constants.
- Produces: `CheckInOutModal` component with props `{ open, mode, unit, onClose }` where `mode: 'checkout' | 'checkin'`.

- [ ] **Step 1: Build the modal**

`src/components/equipment/CheckInOutModal.tsx`:

```tsx
import { App as AntApp, Form, Input, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { STATIONS, type TrolleyUnit } from '@/modules/equipment/constants'
import { useCheckinTrolley, useCheckoutTrolley } from '@/modules/equipment/hooks/useEquipment'

interface CheckInOutModalProps {
  open: boolean
  mode: 'checkout' | 'checkin'
  unit: TrolleyUnit
  onClose: () => void
}

export function CheckInOutModal({ open, mode, unit, onClose }: CheckInOutModalProps) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const checkout = useCheckoutTrolley()
  const checkin = useCheckinTrolley()

  const handleOk = async () => {
    const values = await form.validateFields()
    if (mode === 'checkout') {
      checkout.mutate(
        { code: unit.code, input: { actor: values.actor, flight: values.flight, fromStation: unit.station, toStation: values.toStation, condition: values.condition, note: values.note } },
        { onSuccess: () => { message.success(t('equipment.checkinout.checkoutOk', { code: unit.code })); form.resetFields(); onClose() },
          onError: () => message.error(t('equipment.checkinout.failed')) },
      )
    } else {
      checkin.mutate(
        { code: unit.code, input: { actor: values.actor, station: values.station, condition: values.condition, note: values.note } },
        { onSuccess: () => { message.success(t('equipment.checkinout.checkinOk', { code: unit.code })); form.resetFields(); onClose() },
          onError: () => message.error(t('equipment.checkinout.failed')) },
      )
    }
  }

  return (
    <Modal
      open={open}
      title={t(mode === 'checkout' ? 'equipment.checkinout.checkoutTitle' : 'equipment.checkinout.checkinTitle', { code: unit.code })}
      okText={t('common.confirm')}
      confirmLoading={checkout.isPending || checkin.isPending}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ condition: 'ok' }}>
        <Form.Item name="actor" label={t('equipment.checkinout.crew')} rules={[{ required: true }]}>
          <Input placeholder="CC. Nguyễn T. Lan" />
        </Form.Item>
        {mode === 'checkout' ? (
          <>
            <Form.Item name="flight" label={t('equipment.checkinout.flight')} rules={[{ required: true }]}>
              <Input placeholder="VJ311" />
            </Form.Item>
            <Form.Item name="toStation" label={t('equipment.checkinout.toStation')} rules={[{ required: true }]}>
              <Select options={STATIONS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </>
        ) : (
          <Form.Item name="station" label={t('equipment.checkinout.atStation')} rules={[{ required: true }]} initialValue={unit.custody?.toStation ?? unit.station}>
            <Select options={STATIONS.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        )}
        <Form.Item name="condition" label={t('equipment.checkinout.condition')} rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'ok', label: t('equipment.checkinout.ok') },
              { value: 'damaged', label: t('equipment.checkinout.damaged') },
            ]}
          />
        </Form.Item>
        <Form.Item name="note" label={t('equipment.checkinout.note')}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 2: Wire it into the detail hero**

In `TrolleyDetailPage.tsx`, add state `const [checkMode, setCheckMode] = useState<'checkout' | 'checkin' | null>(null)`. Add a hero action button that shows "Check-out" when `trolley.status === 'service'` and "Check-in" when `trolley.status === 'in-transit'`:

```tsx
{trolley.status === 'service' && (
  <Button onClick={() => setCheckMode('checkout')}>{t('equipment.checkinout.checkout')}</Button>
)}
{trolley.status === 'in-transit' && (
  <Button type="primary" onClick={() => setCheckMode('checkin')}>{t('equipment.checkinout.checkin')}</Button>
)}
```

Render the modal at the bottom (next to `SendToRepairModal`):

```tsx
{checkMode && (
  <CheckInOutModal open mode={checkMode} unit={trolley} onClose={() => setCheckMode(null)} />
)}
```

Import: `import { CheckInOutModal } from '@/components/equipment/CheckInOutModal'`.

- [ ] **Step 3: Browser-verify the flow**

Run: `npm run dev`. On a `service` unit, click Check-out → fill crew/flight/dest/condition=ok → confirm. Unit becomes `in-transit`, custody appears on the list. Then Check-in with condition=damaged → unit becomes `not-service` and a check-in node appears in the timeline.
Expected: status transitions correctly; movement nodes appear newest-first; no console errors.

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npx tsc -b && npm run lint
git add src/components/equipment/CheckInOutModal.tsx src/pages/equipment/trolley/TrolleyDetailPage.tsx
git commit -m "feat(equipment): cabin-crew check-in/out modal wired to custody ledger"
```

---

## Task 10: i18n strings (VI + EN)

**Files:**
- Modify: `src/i18n/locales/vi.json`
- Modify: `src/i18n/locales/en.json`

**Interfaces:** none (leaf task). Adds every key referenced in Tasks 7–9.

- [ ] **Step 1: Add all new keys to `vi.json`**

Under `equipment.columns`:

```json
"rfid": "RFID / EPC",
"health": "Sức khỏe",
"custody": "Đang giữ bởi",
"lastSeen": "Quét gần nhất"
```

Under `equipment.repairColumns`:

```json
"quality": "Chất lượng",
"rework": "Tái hỏng",
"pass": "Đạt"
```

Add a new `equipment.checkinout` object:

```json
"checkinout": {
  "checkout": "Check-out",
  "checkin": "Check-in",
  "checkoutTitle": "Check-out trolley {{code}}",
  "checkinTitle": "Check-in trolley {{code}}",
  "crew": "Tổ bay thực hiện",
  "flight": "Chuyến bay",
  "toStation": "Sân bay đến",
  "atStation": "Sân bay nhận",
  "condition": "Tình trạng thiết bị",
  "ok": "Tốt",
  "damaged": "Có lỗi / hỏng",
  "note": "Ghi chú",
  "checkoutOk": "Đã check-out {{code}}",
  "checkinOk": "Đã check-in {{code}}",
  "failed": "Thao tác thất bại, thử lại"
}
```

- [ ] **Step 2: Add the same keys to `en.json`**

```json
"rfid": "RFID / EPC", "health": "Health", "custody": "Held by", "lastSeen": "Last seen"
```
```json
"quality": "Quality", "rework": "Rework", "pass": "Pass"
```
```json
"checkinout": {
  "checkout": "Check-out", "checkin": "Check-in",
  "checkoutTitle": "Check-out trolley {{code}}", "checkinTitle": "Check-in trolley {{code}}",
  "crew": "Cabin crew", "flight": "Flight", "toStation": "Destination station", "atStation": "Receiving station",
  "condition": "Equipment condition", "ok": "Good", "damaged": "Damaged", "note": "Note",
  "checkoutOk": "Checked out {{code}}", "checkinOk": "Checked in {{code}}", "failed": "Action failed, try again"
}
```

- [ ] **Step 3: Verify no missing-key warnings**

Run: `npm run dev`, open list + detail + both modals, switch language VI↔EN. Confirm no raw `equipment.*` keys render and no i18next "missing key" console warnings.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/vi.json src/i18n/locales/en.json
git commit -m "i18n(equipment): RFID/health/custody/quality/check-in-out strings (vi+en)"
```

---

## Self-Review

**Spec coverage**
- RFID identity → Tasks 2 (field), 5 (backfill/seed), 7 (column), 8 (hero/info). ✓
- "How many active / damaged / repairing / in-transit" → Task 2 (status model), 7 (KPI strip + status filter). ✓
- Repair history + quality judgement → Tasks 3 (analytics), 8 (quality column + KPIs + vendor scorecard available). ✓
- Movement between airports + crew check-in/out → Tasks 4 (logic), 6 (service/hooks), 8 (movement tab/timeline), 9 (modal). ✓
- Staleness / "lost" signal → Task 4 (`isStale`), 7 (last-seen column tone). ✓

**Placeholder scan** — UI Tasks 7–9 give concrete JSX for every new element (columns, timeline node-builder, modal form). `TrolleyTimeline` render markup references the mockup CSS (`mockups/trolley-equipment-redesign.html` `.tl` block) as the visual spec; the node-building logic is fully specified. Repair-table relocation in Task 8 Step 3 says "move, don't rewrite" and points at exact current line range — acceptable (no new logic hidden).

**Type consistency** — `CheckoutInput`/`CheckinInput` defined in Task 4 are imported unchanged in Tasks 6 & 9. `computeHealthScore(unit, now)` signature identical across Tasks 3, 7, 8. `isReworkEntry(history, index)` used with full `trolley.repairHistory` in Tasks 3 & 8 (the Task 8 note guards the filtered-index pitfall). `summarizeFleet` extended in Task 7 returns superset — existing callers unaffected. ✓

**Known risk to flag at execution:** expanding `TrolleyStatus` (Task 2) may surface exhaustive-switch errors in files not audited here (e.g. `StationMap.tsx`, dashboard). Task 2 Step 7 makes `tsc -b` the gate that finds them; fix by adding `in-transit`/`retired` handling where the compiler points.

# Equipment Overview / Workshop / Vendor Scorecard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Ship the three remaining designed screens into the real portal: a finished Fleet **Overview** (dashboard), a **Repair Workshop** queue (kanban), and a **Vendor Scorecard** report — reusing the analytics/movement/repair-request logic already merged.

**Architecture:** Overview = finish the existing `DashboardPage` (its `<CommandHero>` block is commented out; re-enable/wire it and add in-transit + health-distribution + alerts). Workshop + Scorecard = two new equipment sub-routes built on existing hooks (`useRepairRequests`, `useSendTrolleysToRepair`, `useCompleteRepairRequest`, `computeVendorScorecard`). No data-model/schema changes.

**Tech Stack:** React 18 + TS, Vite, Ant Design v5, TanStack Query v5, Tailwind (VJ tokens), i18next, lucide-react. Node 20+ to run (`nvm use 22`). Lint = oxlint.

**Design spec (verified, read it):** `/Users/chuongho/galaxy-mcp/mockups/trolley-3screens-prototype.html` — the render functions `renderOverview`, `renderWorkshop`, `renderReport` are the exact intended layout/interaction/copy. Port that look/behavior into real React using existing VJ primitives (`KpiCard`, `Badge`/`EquipmentBadge`, `Text`, `SurfaceCard`, `ListPageLayout`) and the shared CSS classes already in `src/index.css` (`.kanban`,`.kb-*`,`.bars`,`.bar-row`,`.kpi*`,`.alert*`,`.map-*`,`.callout`,`.health`).

## Global Constraints

- **All paths relative to `portal-web/`.** Worktree: `.worktrees/equip-overview-screens`, branch `feat/equipment-overview-screens`.
- **VJ-DS-GLOBAL-001:** colours only from the 4 brand colours + defined neutrals/status tokens; **no raw brand hex** in components, **no `slate-*`/`gray-*`/`amber-*`** classes — use `var(--color-...)`/`vjTokens`/existing utility classes.
- **i18n:** every user-facing string in BOTH `src/i18n/locales/vi.json` and `en.json`. No hardcoded UI strings.
- **Immutability:** never mutate `TrolleyUnit`/`RepairRequest` in place.
- **Tests (user-directed):** pure-logic only — any new pure helper (e.g. vendor on-time%) gets a small vitest test; **UI is verified in the browser by the controller**, not unit-tested.
- **Baseline:** before Task 4, `tsc -b` has 7 pre-existing `TS6133` errors in `DashboardPage.tsx` (the commented-out `CommandHero` imports). Task 4 must resolve them (by using the imports or removing the dead ones). For Tasks 1-3 the gate is: no NEW tsc errors outside those 7 / your own files.
- **Reuse, don't fork:** use existing hooks/components/types; do not duplicate logic that already exists in `modules/equipment`.

## File Structure

**New**
- `src/pages/equipment/workshop/RepairWorkshopPage.tsx` — kanban queue.
- `src/components/equipment/CompleteRepairModal.tsx` — complete an open RepairRequest (repairContent + rootCause).
- `src/pages/equipment/report/VendorScorecardPage.tsx` — scorecard table + bars.
- `src/modules/equipment/lib/vendorOnTime.ts` + `.test.ts` — pure on-time% helper.

**Modified**
- `src/routes/paths.ts` — add `equipment.workshop.list`, `equipment.report.list`.
- `src/core/modules/registry.ts` — add two children under `equipment`.
- `src/app/routes.tsx` — register the two routes.
- `src/pages/dashboard/DashboardPage.tsx` — finish the overview (enable hero, add in-transit KPI + health dist + alerts).
- `src/i18n/locales/vi.json`, `en.json` — nav + page strings.

---

## Task 1: Routing + nav scaffolding for Workshop & Scorecard

**Files:** `src/routes/paths.ts`, `src/core/modules/registry.ts`, `src/app/routes.tsx`, both locale files; temporary stub pages.

**Interfaces produced:** routes `paths.equipment.workshop.list` (`/equipment/workshop`), `paths.equipment.report.list` (`/equipment/report`); nav children `workshop`, `scorecard` under the `equipment` module.

- [ ] **Step 1: Add paths** — in `src/routes/paths.ts`, inside `equipment`, after `ipad`:
```ts
    workshop: { list: '/equipment/workshop' },
    report: { list: '/equipment/report' },
```
- [ ] **Step 2: Register nav** — in `registry.ts`, append to the `equipment` module's `children` array:
```ts
      { id: 'workshop', labelKey: 'nav.repairWorkshop', path: paths.equipment.workshop.list, permission: 'equipment.read' },
      { id: 'scorecard', labelKey: 'nav.vendorScorecard', path: paths.equipment.report.list, permission: 'equipment.read' },
```
- [ ] **Step 3: Stub pages + routes** — create minimal stubs `RepairWorkshopPage`/`VendorScorecardPage` (`export function ... { return <div/> }`) and register in `routes.tsx` next to the trolley routes:
```tsx
<Route path={paths.equipment.workshop.list} element={<RepairWorkshopPage />} />
<Route path={paths.equipment.report.list} element={<VendorScorecardPage />} />
```
Follow how `PosPage` is imported/registered. These routes need the trolley data — see how `TrolleyListRoute` obtains `useTrolleys()`; Workshop/Scorecard pages will call `useTrolleys()`/`useRepairRequests()` themselves (no props needed), so register them directly like `PosPage`.
- [ ] **Step 4: i18n** — add `nav.repairWorkshop` / `nav.vendorScorecard` to both locales (vi: "Xưởng sửa chữa" / "Báo cáo vendor"; en: "Repair Workshop" / "Vendor Scorecard").
- [ ] **Step 5: Verify** — `npx tsc -b` (only baseline 7), `npm run lint` clean. Controller confirms the two new nav items appear under Equipment and route to blank pages.
- [ ] **Step 6: Commit** — `feat(equipment): scaffold workshop + scorecard routes/nav`.

---

## Task 2: Vendor Scorecard page

**Files:** create `src/modules/equipment/lib/vendorOnTime.ts` (+`.test.ts`), fill `src/pages/equipment/report/VendorScorecardPage.tsx`, both locales.

**Interfaces:** `computeVendorOnTime(trolleys: TrolleyUnit[], slaDays?: number): Record<string, number>` — vendor → on-time % (0–100), where on-time = completed repairs with `TAT ≤ slaDays` (default 7). TAT = `max(1, floor((completedAt-startedAt)/DAY))`.

- [ ] **Step 1: Write failing test** `vendorOnTime.test.ts` — two vendors, one all ≤7d (100), one mixed (e.g. 1 of 2 ≤7 → 50); vendor with 0 completed → 0. Fixed `NOW`/`DAY`, entries via a small factory (mirror `analytics.test.ts` style).
- [ ] **Step 2: Run → fail** `npx vitest run src/modules/equipment/lib/vendorOnTime.test.ts`.
- [ ] **Step 3: Implement `vendorOnTime.ts`** — iterate `trolleys[].repairHistory`, count per vendor completed + on-time, return `Math.round(on/total*100)` (0 if none). No mutation.
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5: Build the page** — port `renderReport` from the prototype: `ListPageLayout`/`SurfaceCard` wrapper, a table (Vendor / Lượt sửa / Tái hỏng / Tỉ lệ tái hỏng / TAT TB / Đúng hạn / Đánh giá) from `computeVendorScorecard(trolleys)` + `computeVendorOnTime(trolleys)`, and two bar cards (rework-rate, repair-volume) using `.bars`/`.bar-row`, plus the risk callout when top vendor `reworkRate > 0.15`. Rating badge thresholds: ≤8% green "Tốt", ≤15% yellow "Theo dõi", else red "Rủi ro". Colours via existing status tokens/`var(--color-*)`. Get data via `useTrolleys()`.
- [ ] **Step 6: i18n** — add an `equipment.scorecard.*` block (title, subtitle, column headers, ratings, callout) to both locales.
- [ ] **Step 7: Verify** — `npx tsc -b` (baseline only), `npm run lint`, `npx vitest run` green. Controller browser-checks the page.
- [ ] **Step 8: Commit** — `feat(equipment): vendor scorecard page + on-time helper`.

---

## Task 3: Repair Workshop page (kanban)

**Files:** fill `src/pages/equipment/workshop/RepairWorkshopPage.tsx`, create `src/components/equipment/CompleteRepairModal.tsx`, both locales.

**Model (reuse existing, no schema change):**
- **Column "Chờ tiếp nhận"** = `trolleys` with `status === 'not-service'`. Card action **Gửi vendor** → open the existing `SendToRepairModal`; on submit call `useSendTrolleysToRepair().mutate({ codes:[code], vendor })` (creates an open `RepairRequest`, trolley → `repairing`).
- **Column "Đang sửa"** = open `RepairRequest`s (`useRepairRequests({status:'open'})` filtered to `equipmentType==='trolley'`). Card action **Nghiệm thu** → open `CompleteRepairModal`; on submit call `useCompleteRepairRequest().mutate({ id, input:{repairContent, rootCause} })` (request → completed, trolley → service).
- KPI strip: Chờ tiếp nhận (count not-service), Đang sửa (count open requests), TAT TB (avg `turnaroundDays` of completed, or from `summarizeRepairRequests`). SLA aging per card from `requestedAt`/`lastSeenAt` (mirror prototype: >2 days waiting = critical).

- [ ] **Step 1: CompleteRepairModal** — Ant `Modal` + `Form` with required `repairContent` and `rootCause` textareas + confirm; props `{ open, request, onClose, onSubmit(input: CompleteRepairRequestInput) }`. Mirror `SendToRepairModal.tsx` structure/i18n usage. All strings i18n.
- [ ] **Step 2: Workshop page shell** — `ListPageLayout` title/desc (i18n), KPI row (`KpiCard`), then a 2-column `.kanban` grid (`grid-template-columns:repeat(2,1fr)`). Use `useTrolleys()` + `useRepairRequests()`.
- [ ] **Step 3: Waiting column** — map not-service trolleys to `.kb-card`s (code, issue from newest damaged check-in movement or last repair reason, RFID tail, station, type, SLA age) + **Gửi vendor** button opening `SendToRepairModal` (reuse; wire `useSendTrolleysToRepair`). On success, `message.success` + queries invalidate (hook already does).
- [ ] **Step 4: In-repair column** — map open trolley RepairRequests to `.kb-card`s (id, equipmentCodes, vendor, days since `requestedAt`, issue) + **Nghiệm thu** button opening `CompleteRepairModal`. On submit call `useCompleteRepairRequest`.
- [ ] **Step 5: i18n** — `equipment.workshop.*` (title, subtitle, column labels, KPI labels, actions, complete-modal fields, success msgs) in both locales.
- [ ] **Step 6: Verify** — `tsc -b` (baseline only), lint clean. Controller browser-tests the full loop: not-service → Gửi vendor → appears in Đang sửa → Nghiệm thu → trolley returns to service (check on the trolley list/detail).
- [ ] **Step 7: Commit** — `feat(equipment): repair workshop kanban + complete-repair modal`.

---

## Task 4: Finish the Fleet Overview (DashboardPage)

**Files:** `src/pages/dashboard/DashboardPage.tsx`, both locales; possibly `src/components/patterns/aviation/*` only if a component is genuinely broken (prefer not).

- [ ] **Step 1: Assess the commented hero** — the `<CommandHero .../>` block (with `StationMap`, `FleetReadinessGauge`, `OpsTicker`) is commented out. Un-comment it and run the app. If it renders correctly, keep it (this uses the imports and clears the 7 `TS6133` errors). If a sub-component is broken, wire the ones that work and remove imports/vars for any you cannot use (still clearing the errors). Document which path you took in the report.
- [ ] **Step 2: Add the In-transit KPI** — `summarizeFleet` already returns `inTransit`. Add a 5th `KpiCard` (or extend the grid) for "Đang luân chuyển" using `summary.inTransit`, tone info/brand. Adjust `.kpi-grid` count if needed.
- [ ] **Step 3: Health distribution + alerts** — port the prototype's "Phân bố sức khỏe đội tàu" (good/mid/bad via `computeHealthScore`) and the "Cảnh báo cần xử lý" panel (SLA-breach not-service via `lastSeenAt>2d`, rework via `computeReworkStats`, stale via `isStale`) into the dashboard body using `.hd-bars`/`.alert*` classes. Import helpers from `@/modules/equipment/lib/analytics` + `movement`.
- [ ] **Step 4: i18n** — add any new dashboard strings (in-transit KPI, health-dist labels, alert copy) to both locales.
- [ ] **Step 5: Verify** — `npx tsc -b` must now be **fully clean (0 errors)** — the baseline 7 are resolved. `npm run lint` clean, `npx vitest run` green. Controller browser-checks the dashboard.
- [ ] **Step 6: Commit** — `feat(equipment): finish fleet overview dashboard (hero + in-transit + health + alerts)`.

---

## Self-Review
- 3 screens → Task 4 (Overview), Task 3 (Workshop), Task 2 (Scorecard); Task 1 wires routing/nav. ✓
- Reuse: SendToRepairModal, useSendTrolleysToRepair, useRepairRequests, useCompleteRepairRequest, computeVendorScorecard, summarizeFleet, computeHealthScore, isStale, computeReworkStats — all pre-existing. ✓
- New pure logic (vendorOnTime) is tested; UI browser-verified per test policy. ✓
- No schema/data-model changes; workshop uses the existing RepairRequest open/completed lifecycle. ✓
- Baseline 7 TS6133 errors owned by Task 4 (resolved by finishing the hero). ✓
- Risk: the commented `CommandHero` may have been disabled because a sub-component is unfinished — Task 4 Step 1 handles both outcomes explicitly.

# Handover Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate Ground goods return from onboard device custody while reducing scrolling.

**Architecture:** Extend each leg’s handover record with a device disposition and two-stage crew acknowledgement. Keep the existing single-file prototype structure, render one compact tab at a time, and use progressive disclosure for the goods catalogue.

**Tech Stack:** HTML, CSS, vanilla JavaScript.

---

### Task 1: Handover state

**Files:**
- Modify: `index.html`

- [ ] Extend `emptyHandoverLeg()` with `deviceMode`, `deviceLocation`, `deviceOfferedAt`, and `deviceReceivedAt`.
- [ ] Derive device completion from onboard placement or receiving-crew acknowledgement.
- [ ] Keep goods quantities independent from device state.

### Task 2: Goods progressive disclosure

**Files:**
- Modify: `index.html`

- [ ] Make the returned-goods card show entered rows by default.
- [ ] Add a clear empty state and “Thêm hàng hoá” control.
- [ ] Reveal the searchable full catalogue only when requested.
- [ ] Use 16px card padding and consistent 12–16px vertical rhythm.

### Task 3: Device custody workflow

**Files:**
- Modify: `index.html`

- [ ] Replace Ground/crew mode selection with “Để lại trên tàu bay” and “Bàn giao tổ bay”.
- [ ] Collect an onboard location for the first option.
- [ ] Implement outgoing offer and incoming acknowledgement states for crew transfer.
- [ ] Show operational handover only during crew transfer.

### Task 4: Visual hierarchy and verification

**Files:**
- Modify: `index.html`

- [ ] Reserve red for selected navigation and the primary CTA.
- [ ] Use green only for complete and yellow only for pending.
- [ ] Verify JavaScript syntax by extracting the inline script and running `node --check`.
- [ ] Run the project’s UI checklist where available and inspect linter diagnostics.

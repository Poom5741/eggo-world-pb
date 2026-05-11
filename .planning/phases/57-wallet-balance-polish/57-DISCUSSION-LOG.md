# Phase 57: Wallet Balance Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 57-wallet-balance-polish
**Areas discussed:** Loading State Design

---

## Loading State Design

| Option                 | Description                                          | Selected |
| ---------------------- | ---------------------------------------------------- | -------- |
| Skeleton card          | Animated skeleton blocks matching balance card shape | ✓        |
| Card shell + indicator | Show card shell without numbers, pulsing indicator   |          |
| Shimmer text           | Shimmer placeholder that resolves into real number   |          |
| Claude's choice        | Let Claude decide                                    |          |

**User's choice:** Skeleton card (full card match)

| Option         | Description                                       | Selected |
| -------------- | ------------------------------------------------- | -------- |
| Smooth fade-in | Skeleton briefly then smooth fade to real balance | ✓        |
| Quick swap     | Quick pulse skeleton that transitions sharply     |          |

**User's choice:** Smooth fade-in

| Option           | Description                                 | Selected |
| ---------------- | ------------------------------------------- | -------- |
| Keep as is       | Keep the pulse-animated "Updating..." badge | ✓        |
| Change indicator | Subtle spinning icon or color change        |          |
| Remove it        | Remove polling indicator entirely           |          |

**User's choice:** Keep existing "Updating..." badge

| Option               | Description                                           | Selected |
| -------------------- | ----------------------------------------------------- | -------- |
| Full card match      | Skeleton with header, balance block, description line | ✓        |
| Minimal balance only | Centered pulsing rectangle for balance number only    |          |

**User's choice:** Full card match skeleton

---

## Claude's Discretion

- Error state design and refinement
- Empty/zero balance display
- Exact skeleton styling (colors, animation timing)
- Balance number display polish
- Animation durations and easing functions
- Component reuse decision (BalanceCard vs inline)

## Deferred Ideas

None — discussion stayed within phase scope.

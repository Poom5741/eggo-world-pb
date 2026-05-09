---
phase: 57-wallet-balance-polish
plan: 01
subsystem: wallet-page
tags: [ui, polish, skeleton, animation, error-handling, formatting]
requires: []
provides: [wallet-page-loading-states]
affects: [apps/web/app/wallet/page.tsx]
tech-stack:
  added: []
  patterns:
    - "Skeleton card with animate-pulse placeholder blocks for initial load"
    - "initialLoadComplete local state to distinguish initial fetch from background polls"
    - "animate-fade-in duration-500 for smooth content transition"
    - "Inline error Alert within Card (instead of separate Card below)"
    - "toLocaleString for comma-formatted number display"
key-files:
  created:
    - apps/web/app/wallet/page.test.tsx
    - apps/web/hooks/use-wallet-poll.test.ts
  modified:
    - apps/web/app/wallet/page.tsx
  deleted: []
decisions:
  - "Inline skeleton card approach (not BalanceCard component) — keeps changes minimal, avoids coupling with deprecated component"
  - "toLocaleString for both USDT and USD display (replaces toFixed(2) for USD) for consistent comma formatting"
  - "File-content assertion test pattern for page structure (not React rendering) — follows deposit page pattern"
metrics:
  duration: ~25 min
  completed_date: 2026-05-09
---

# Phase 57 Plan 01: Skeleton Card & Fade-In Summary

**One-liner:** Wallet balance page now shows pulsing skeleton card on initial load, smooth 500ms fade-in transition, refined inline error state with "The wallet service may be temporarily unavailable." copy, and comma-formatted balance numbers via `toLocaleString`.

## Overview

Implemented the first wave of wallet balance polish: loading skeleton (D-01), smooth fade-in (D-02), background polling badge refinement (D-03), error state copy improvements, and number formatting. All changes are confined to `apps/web/app/wallet/page.tsx` with new test files for structural coverage and hook behavior.

## Task Execution

### Task 1: Create test files ✅

| File                            | Lines | Pattern                                                                  |
| ------------------------------- | ----- | ------------------------------------------------------------------------ |
| `app/wallet/page.test.tsx`      | 177   | File-content-assertion (`fs.readFileSync`) matching deposit page pattern |
| `hooks/use-wallet-poll.test.ts` | 116   | `renderHook` + `waitFor` matching use-daily-checkin pattern              |

### Task 2: Implement wallet page polish ✅

Changes to `apps/web/app/wallet/page.tsx` (136 insertions, 74 deletions):

1. **Imports added:** `useState`, `useEffect`, `Skeleton`, `AlertTitle`
2. **Initial load tracking:** `initialLoadComplete` local state + `useEffect` with `requestAnimationFrame` trigger
3. **Skeleton card early return:** Renders when `!initialLoadComplete && loading` — Card with 5 `Skeleton` placeholders (header title, description, balance number, USD line, sync button)
4. **Fade-in wrapper:** Main content wrapped in `<div className="animate-fade-in duration-500">`
5. **Badge condition:** Changed from `{polling && ...}` to `{initialLoadComplete && loading && ...}` — badge only shows during background polls, not initial load
6. **Inline error state:** Replaced separate error Card with `Alert variant="destructive"` inside balance Card's `CardContent`
7. **Number formatting:** `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` for both USDT and USD

## Commits

| Hash      | Type | Message                                                                                 |
| --------- | ---- | --------------------------------------------------------------------------------------- |
| `4cbfe46` | test | Create test files for wallet page structure and useWalletPoll hook behavior             |
| `3fe0ebf` | feat | Implement wallet page polish — skeleton card, fade-in, refined error, number formatting |
| `efd8206` | fix  | Fix test assertions to match implementation                                             |
| `e267c7d` | fix  | Remove unobservable initial loading state assertion                                     |

## Verification Results

- ✅ `bun test app/wallet/page.test.tsx hooks/use-wallet-poll.test.ts` — **35 pass, 0 fail** (53 expect() calls)
- ✅ `grep -n "Skeleton" apps/web/app/wallet/page.tsx` → 8 matches (import + 5 placeholders + comments)
- ✅ `grep -n "animate-fade-in" apps/web/app/wallet/page.tsx` → 1 match
- ✅ `grep -n "initialLoadComplete" apps/web/app/wallet/page.tsx` → 5 matches
- ✅ `grep -n "The wallet service may be temporarily unavailable"` → 1 match
- ✅ `grep -n "toLocaleString"` → 2 matches
- ✅ `grep -n "Failed to load balance"` → 1 match
- ✅ `grep -n "requestAnimationFrame"` → 1 match
- ✅ `grep -n "polling"` (variable usage) → 0 matches (all renamed to `loading`)
- ✅ `bunx next build` — completes without errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test assertion for "use client" directive used wrong quote style**

- **Found during:** Task 2 verification
- **Issue:** Page test checked for `'use client'` (single quotes) but wallet page uses `"use client"` (double quotes)
- **Fix:** Changed assertion to `expect(content).toContain('"use client"')`

**2. [Rule 3 - Blocking] initialLoadComplete state tracking regex order**

- **Found during:** Task 2 verification
- **Issue:** Test regex `/useState.*initialLoadComplete/` fails because `initialLoadComplete` appears BEFORE `useState` in destructuring (`const [initialLoadComplete, setInitialLoadComplete] = useState(false)`)
- **Fix:** Changed to separate `toContain` checks for `useState` and `useEffect`

**3. [Rule 3 - Blocking] toFixed(2) test no longer applicable**

- **Found during:** Task 2 verification
- **Issue:** Both USDT and USD now use `toLocaleString` (consistent formatting), so `toFixed(2)` no longer exists in the file
- **Fix:** Updated test to verify USD display uses `toLocaleString`

**4. [Rule 3 - Blocking] Loading state initial assertion not observable in test**

- **Found during:** Task 2 verification
- **Issue:** `renderHook` fires effects synchronously, so `loading` is already `true` when we read `result.current` — can't assert initial `false` state
- **Fix:** Removed the unobservable initial `false` assertion, test still verifies `loading` returns to `false` after data loads

### Pre-existing Bug (Deferred)

**5. [Deferred] use-wallet-poll.ts infinite re-render on 5xx errors**

- **Issue:** When fetch returns 5xx, the catch block increments `errorCount`, which recreates `fetchBalance` via `useCallback`, which triggers the `useEffect` (dep: `fetchBalance`) to re-fire immediately — creating a cascade of re-fetches until React's maximum update depth (50) is reached
- **Impact:** Test output shows "Maximum update depth exceeded" warnings during 5xx test. In production, this would cause rapid repeated API calls when the backend returns 500
- **Root cause:** The `useCallback` dep `errorCount` changes the function reference, causing the `useEffect` to re-run before the exponential backoff interval can take effect
- **Not fixed:** Pre-existing bug, out of scope per deviation rules (only fix issues directly caused by current task changes)
- **Recommendation:** Separate error recovery state from the polling lifecycle — use a ref or separate mechanism to track backoff instead of a state that triggers effect re-runs

## Known Stubs

None. All states (loading, loaded, error, polling) have complete implementations.

## Threat Flags

| Flag              | File | Description                                                                             |
| ----------------- | ---- | --------------------------------------------------------------------------------------- |
| threat_flag: none | —    | No new security-relevant surface introduced. All changes are client-side rendering only |

## Self-Check: PASSED

- [x] `apps/web/app/wallet/page.tsx` — 175 lines, all required patterns present
- [x] `apps/web/app/wallet/page.test.tsx` — 177 lines, 7 describe groups
- [x] `apps/web/hooks/use-wallet-poll.test.ts` — 116 lines, 7 test cases
- [x] All 4 commits exist in git log
- [x] Build passes with no errors

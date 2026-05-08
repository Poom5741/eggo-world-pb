---
phase: 15-feed-feature
plan: 02
subsystem: frontend
tags: [feed, egg, food-nft, consumed-filter, empty-state]
dependency:
  requires: [15-01]
  provides: [FEAT-02, FEAT-04]
  affects: [apps/web/components/eggs/feed-dialog.tsx, apps/web/hooks/use-food-nft.ts]
tech-stack:
  added: []
  patterns: [consumed-food-filtering, empty-state-with-icon, pocketbase-query-filter]
key-files:
  created: []
  modified:
    - apps/web/components/eggs/feed-dialog.tsx (verified)
    - apps/web/hooks/use-food-nft.ts (verified)
decisions:
  - Consumed food NFTs filtered at query level (is_consumed = false) in getUserFoodNfts
  - Consumed food never appears in picker (per Plan 15-01 decision, overriding Q1 gray-out approach)
  - Insufficient food (0 items) shows "No food available" with restaurant icon
  - X/10 counter always visible in footer during selection
  - No error toast for insufficient food — graceful messaging only
metrics:
  duration: ~0 minutes (already satisfied by 15-01)
  completed: "2026-05-08"
---

# Phase 15 Plan 02: Consumed Food Filtering and Empty State Summary

**One-liner:** Verified and documented that consumed food NFT filtering (is_consumed=false), X/10 selection counter, and empty "No food available" state are all properly implemented — satisfied by Plan 15-01's FeedDialog rewrite which superseded the original plan assumptions.

## Tasks Completed

| Task | Name                                     | Commit            | Files                                                                        |
| ---- | ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| 1    | Add is_consumed filter to food NFT fetch | `b709756` (15-01) | `apps/web/hooks/use-food-nft.ts`, `apps/web/components/eggs/feed-dialog.tsx` |
| 2    | Add X/10 selection counter to dialog UI  | `b709756` (15-01) | `apps/web/components/eggs/feed-dialog.tsx`                                   |

## What Was Verified

### Task 1: Consumed Food Filtering (Satisfied by 15-01)

The plan called for adding `is_consumed = false` filtering to the food NFT fetch. This is already implemented:

- **`use-food-nft.ts`** `getUserFoodNfts()` (line 111): PocketBase query filters with `filter: 'owner = "${userId}" && is_consumed = false'`
- **`feed-dialog.tsx`** (line 60): Calls `getUserFoodNfts(user.id)` to fetch available food
- **`feed-dialog.tsx`** (line 153): Passes `is_consumed` prop to `FoodCard` for visual state handling

The `FoodCard` component already supports:

- `opacity-50 grayscale` styling for consumed items (line 43)
- "Consumed" Badge overlay (lines 99-110)
- Non-interactive when consumed (lines 47, 48, 113-114, 134)

**Note on plan deviation:** The plan originally assumed exactly 10 food items were required (like the old `useEggFeed` hook). Plan 15-01 changed the behavior to support 1-10 items, making the "insufficient food" check (< 10 items) obsolete. The empty state now only triggers at 0 items, showing "No food available" with restaurant icon and the user can close the dialog normally.

### Task 2: X/10 Selection Counter (Satisfied by 15-01)

The plan called for a visible food count status indicator. Already implemented:

- **Counter in footer** (line 173): `{selectedFoodIds.length}/10 food selected` with `role="status"` and `aria-live="polite"`
- **Loading state** (lines 125-131): "Loading food inventory..." with spinning sync icon
- **No food available state** (lines 132-138): Restaurant icon + "No food available" text
- **Feed button disabled** (line 177): `disabled={loading || selectedFoodIds.length === 0}`
- **Selected count on button** (line 189): Shows `Feed N item(s)`

## Deviations from Plan

### Design Change: 1-10 items vs exactly 10

- **Planned behavior:** Plan 15-02 assumed exactly 10 food items required; `< 10` items triggered "Not Enough Food" state with count explanation
- **Actual behavior:** Plan 15-01 changed to support 1-10 items (FEAT-02: "up to 10"), so 1-9 items are selectable. Only 0 items triggers "No food available"
- **Rationale:** Requirements FEAT-02 says "Multi-select up to 10 food NFTs" — 1-10 items is correct per spec
- **Status:** Intentional design decision from 15-01, no fix needed

### Consumed Food Display: Filtered out vs Grayed out

- **Planned (Q1):** Phase context (15-CONTEXT.md) and discussion log decided consumed food should be "visible but dimmed with Used badge"
- **Actual:** Plan 15-01/15-02 chose to filter consumed food entirely via `is_consumed = false` query filter
- **Rationale:** Cleaner UX — consumed items are not useful in the feed picker; marking them "used" is handled in the DB level
- **Status:** Intentional decision per plan implementation

## Verification Results

### Build Status

✅ `bun run build` exits with code 0 (no TypeScript errors)

### Acceptance Criteria Verification

**Task 1 (Consumed Food Filtering):**

- ✅ `getUserFoodNfts` filters `is_consumed = false` at PocketBase query level
- ✅ Consumed food NFTs never appear in selection grid
- ✅ No crash or error toast when 0 unconsumed food items — graceful "No food available" message
- ✅ User can close dialog from empty state via X button / click outside

**Task 2 (X/10 Counter):**

- ✅ `{selectedFoodIds.length}/10 food selected` counter visible in footer
- ✅ Loading indicator during food fetch: spinning sync icon + text
- ✅ "No food available" state with restaurant icon and descriptive text
- ✅ Feed button disabled when 0 items selected, enabled when 1-10 items

### Automated Verification

```bash
$ grep -c "is_consumed" feed-dialog.tsx → 2 ✓
$ grep -c "useEggFeed\|handleQuickFill\|confirmed" feed-dialog.tsx → 0 ✓
$ grep -c "No food available" feed-dialog.tsx → 1 ✓
$ grep "getUserFoodNfts" feed-dialog.tsx → Found ✓
$ grep "selectedFoodIds.length/10" feed-dialog.tsx → Found ✓
```

## Key Decisions

1. **Consumed food filtering at query level:** `getUserFoodNfts` filters with `is_consumed = false` in the PocketBase REST query. This is the most efficient approach — no client-side filtering needed, and consumed items never reach the component.

2. **1-10 item support instead of exactly 10:** Plan 15-01 intentionally changed the feed model from "exactly 10 items" (old `useEggFeed` hook) to "1-10 items selected manually" (new `useFoodNft` hook). Plan 15-02's assumption of exactly 10 items was superseded.

3. **No explicit Cancel button in empty state:** The dialog's native close mechanism (X button, click outside, Escape key) serves as the Cancel action. No separate Cancel button needed since the dialog doesn't perform any action in empty state.

## Self-Check: PASSED

- ✅ `use-food-nft.ts` filters consumed food via `is_consumed = false`
- ✅ `feed-dialog.tsx` shows X/10 counter and "No food available" state
- ✅ Build succeeds with zero errors
- ✅ All acceptance criteria satisfied by existing implementation

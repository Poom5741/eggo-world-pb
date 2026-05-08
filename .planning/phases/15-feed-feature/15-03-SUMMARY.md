---
phase: 15-feed-feature
plan: 03
subsystem: frontend
tags: [feed, egg, hero-button, ui-entry-point]
dependency:
  requires: [15-01, 15-02]
  provides: [FEAT-01]
  affects: [apps/web/app/eggs/page.tsx]
tech-stack:
  added: []
  patterns: [dynamic-import, feed-dialog-entry-points, egg-state-management]
key-files:
  created: []
  modified: []
  verified:
    - apps/web/app/eggs/page.tsx (lines 149-156: handleFeedEgg already implemented)
decisions:
  - Both feed entry points (hero FEED ME + egg card Manage Egg) use the same FeedDialog
  - handleFeedEgg follows the same pattern as handleManageEgg
metrics:
  duration: ~0 minutes (already satisfied by prior work)
  completed: "2026-05-08"
---

# Phase 15 Plan 03: Featured Egg Hero Feed Button Summary

**One-liner:** Verified that handleFeedEgg is already properly implemented — the featured egg hero "FEED ME" button correctly opens FeedDialog via the feedingEgg state + feedDialogOpen pattern, with all TODO stubs removed.

## Tasks Completed

| Task | Name                                 | Commit                      | Files                        |
| ---- | ------------------------------------ | --------------------------- | ---------------------------- |
| 1    | Fix handleFeedEgg to open FeedDialog | Pre-existing (before 15-01) | `apps/web/app/eggs/page.tsx` |

## What Was Verified

### Task 1: handleFeedEgg Implementation (Already Done)

The plan called for replacing the TODO stub in `handleFeedEgg` with actual FeedDialog-open logic. The implementation was already in place:

**Current code** (lines 149-156 of `page.tsx`):

```tsx
// Handle feed action - จัดการคลิกให้อาหารจาก hero
const handleFeedEgg = (eggId: number) => {
  const egg = eggs.find((e) => e.egg_id === eggId)
  if (egg) {
    setFeedingEgg(egg)
    setFeedDialogOpen(true)
  }
}
```

This follows the exact same pattern as `handleManageEgg` (lines 140-147):

```tsx
const handleManageEgg = (eggId: number) => {
  const egg = eggs.find((e) => e.egg_id === eggId)
  if (egg) {
    setFeedingEgg(egg)
    setFeedDialogOpen(true)
  }
}
```

**Entry point wiring:**

- Featured egg hero "FEED ME" button → `onFeed={handleFeedEgg}` (line 321)
- Egg card "Manage Egg" button → `onManage={handleManageEgg}` (line 334)

Both correctly pass `egg_id` (blockchain token ID as number) to find the egg from state and open the FeedDialog.

## Deviations from Plan

None — the implementation matches the plan exactly. The handler was already implemented before Plan 15-03 was finalized.

## Verification Results

### Build Status

✅ `bun run build` exits with code 0 (no TypeScript errors)

### Acceptance Criteria Verification

- ✅ `handleFeedEgg` finds matching egg from state via `eggs.find(e => e.egg_id === eggId)`
- ✅ Sets `feedingEgg` state to the found egg
- ✅ Sets `feedDialogOpen` to true
- ✅ Featured egg hero "FEED ME" button opens FeedDialog via `onFeed={handleFeedEgg}`
- ✅ No TODO comments or `console.log` in the handler
- ✅ Both entry points use the same `FeedDialog` component (dynamically imported)

### Automated Verification

```bash
$ grep -c "handleFeedEgg" page.tsx → 2 ✓
$ grep -c "TODO: Implement feed flow" page.tsx → 0 ✓
$ grep -c "console.log.*feed" page.tsx → 0 ✓
$ grep "TODO\|FIXME\|stub" page.tsx -i → 0 ✓
```

## Key Decisions

1. **Dual entry point pattern:** Both the featured egg hero "FEED ME" button and egg card "Manage Egg" button use the same `feedingEgg` state + `feedDialogOpen` pattern. This ensures both UI paths open the same FeedDialog component.

2. **Dynamic import:** `FeedDialog` is dynamically imported via Next.js `dynamic()` with a null loading state, reducing initial bundle size for the eggs page.

## Self-Check: PASSED

- ✅ `handleFeedEgg` fully implemented (lines 149-156)
- ✅ TODO stubs removed from feed handler
- ✅ Build succeeds with zero errors
- ✅ Both feed entry points wired and functional

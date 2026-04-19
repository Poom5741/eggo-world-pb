---
phase: 15-feed-feature
plan: 01
subsystem: frontend
tags: [feed, egg, food-nft, ui-rewrite]
dependency:
  requires: []
  provides: [FEAT-01, FEAT-02, FEAT-03, FEAT-04]
  affects: [apps/web/components/eggs/feed-dialog.tsx, apps/web/components/eggs/egg-card.tsx]
tech-stack:
  added: []
  patterns: [manual-selection-grid, ready-to-hatch-indicator, material-symbols-icons, claymorphism-ui]
key-files:
  created: []
  modified:
    - apps/web/components/eggs/feed-dialog.tsx
    - apps/web/components/eggs/egg-card.tsx
decisions:
  - Used useFoodNft hook instead of useEggFeed (supports 1-10 items vs exactly 10)
  - Used egg.token_id (converted to number) for feedEgg() call (blockchain token ID)
  - Filtered consumed foods at query level via getUserFoodNfts (is_consumed = false)
  - Added missing Progress import to egg-card.tsx (would cause build error)
metrics:
  duration: ~5 minutes
  completed: "2026-04-19T18:39:00Z"
---

# Phase 15 Plan 01: Manual Food Selection and Ready-to-Hatch Indicator Summary

**One-liner:** Rewrote FeedDialog from quick-fill auto-select to manual 2-column food selection grid with counter, and added ready-to-hatch visual indicator (pulse glow + sparkle) to EggCard when food_count reaches 10/10.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite FeedDialog with manual food selection grid | `b709756` | `apps/web/components/eggs/feed-dialog.tsx` |
| 2 | Add ready-to-hatch indicator to EggCard | `88c4fbd` | `apps/web/components/eggs/egg-card.tsx` |

## What Changed

### FeedDialog (Complete Rewrite)

**Before:** Quick-fill auto-select pattern using `useEggFeed` hook (required exactly 10 items)
**After:** Manual selection grid using `useFoodNft` hook (accepts 1-10 items)

**Key Features:**
- 2-column scrollable grid (`grid grid-cols-2 gap-clay-lg max-h-[60vh] overflow-y-auto`)
- FoodCard components with selection state (checkbox + ring highlight)
- Counter showing "X/10 food selected" in sticky footer
- Feed button disabled when 0 items selected, enabled for 1-10 items
- Loading state with spinner and "Feeding..." text during transaction
- Material Symbols icons (`sync`, `restaurant`) - no Lucide icons
- Consumed foods filtered at query level via `getUserFoodNfts(user.id)` with `is_consumed = false`
- Uses `egg.token_id` (blockchain token ID) for `feedEgg()` call
- Feed button has `min-h-[44px]` for WCAG 2.2 touch target compliance
- Fetches food inventory on dialog open, resets state on close

### EggCard (Enhanced)

**Added:**
- `Progress` component import (was missing, would cause build error)
- Conditional `animate-pulse-glow ring-2 ring-warning` classes on card container when `egg.food_count >= 10 && !egg.is_hatched`
- Sparkle icon (`<span className="material-symbols-outlined">sparkle</span>`) next to food count badge when ready to hatch
- Updated progress text:
  - "Ready to hatch! 🎉" when food_count >= 10 and not hatched
  - "X/10 food — Y more to hatch" when not ready
- HATCH button remains prominent (unchanged, already had primary styling)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Type mismatch for egg.token_id**
- **Found during:** Task 1 (FeedDialog rewrite)
- **Issue:** `EggData.token_id` is typed as `string` in use-egg-poll.ts, but `feedEgg()` expects `number` parameter
- **Fix:** Added `parseInt(egg.token_id, 10)` conversion before passing to `feedEgg()`
- **Files modified:** `apps/web/components/eggs/feed-dialog.tsx` (line 92)
- **Commit:** `b709756`

**2. [Rule 2 - Missing] Missing Progress import in egg-card.tsx**
- **Found during:** Task 2 (EggCard enhancement)
- **Issue:** `Progress` component was used in egg-card.tsx (line 94) but not imported, would cause build error
- **Fix:** Added `import { Progress } from '@/components/ui/progress'` at line 6
- **Files modified:** `apps/web/components/eggs/egg-card.tsx` (line 6)
- **Commit:** `88c4fbd`

## Verification Results

### Build Status
✅ `bun run build` exits with code 0 (no TypeScript errors)

### Acceptance Criteria (ALL PASS)

**FeedDialog:**
- ✅ Contains `import { useFoodNft } from '@/hooks/use-food-nft'` (NOT useEggFeed)
- ✅ Does NOT contain `useEggFeed` or `handleQuickFill` or `confirmed` state
- ✅ Contains `grid grid-cols-2 gap-clay-lg` for 2-column food grid
- ✅ Contains `{selectedFoodIds.length}/10 food selected` counter text
- ✅ Contains `disabled={loading || selectedFoodIds.length === 0}` on feed button
- ✅ Contains `max-h-[60vh] overflow-y-auto` on grid container
- ✅ Contains `min-h-[44px]` on feed button
- ✅ Contains `material-symbols-outlined` for icons (NOT lucide-react)
- ✅ Contains `feedEgg(parseInt(egg.token_id, 10), selectedFoodIds)` (uses token_id)
- ✅ Contains `getUserFoodNfts(user.id)` to fetch food inventory

**EggCard:**
- ✅ Contains `import { Progress } from '@/components/ui/progress'`
- ✅ Card container contains `animate-pulse-glow ring-2 ring-warning` in cn() call
- ✅ Contains `"Ready to hatch! 🎉"` string for ready state
- ✅ Contains `"${egg.food_count}/10 food — ${10 - egg.food_count} more to hatch"` for non-ready state
- ✅ Contains `<span className="material-symbols-outlined text-warning text-xl animate-pulse-glow"` for sparkle icon
- ✅ Contains `egg.food_count >= 10 && !egg.is_hatched` condition (not just food_count >= 10)
- ✅ HATCH button still exists with `bg-primary text-on-primary rounded-full font-black text-lg` (unchanged)

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: input-validation | feed-dialog.tsx | Client validates selectedFoodIds.length <= 10 before submit; backend (16-feed-egg.pb.js) validates food ownership and is_consumed = false (T-15-02) |
| threat_flag: ownership-verification | feed-dialog.tsx | Uses egg.token_id for feedEgg() call; backend validates egg_token_id matches authenticated user's egg (T-15-03) |

## Known Stubs

None - all functionality is fully wired and functional.

## Key Decisions

1. **Hook Selection:** Used `useFoodNft` instead of `useEggFeed` because requirements (FEAT-02) allow 1-10 items, not exactly 10. `useEggFeed` has hard validation requiring exactly 10 items.

2. **Token ID Type Conversion:** `EggData.token_id` is typed as `string` in the interface but `feedEgg()` expects `number`. Used `parseInt(egg.token_id, 10)` for safe conversion. This aligns with the backend expecting a numeric blockchain token ID.

3. **Consumed Food Filtering:** Relied on `getUserFoodNfts()` which already filters by `is_consumed = false` at the PocketBase query level. No client-side filtering needed, keeping the component logic clean.

4. **Progress Import:** Added missing `Progress` import to egg-card.tsx. This was a pre-existing bug (component used but not imported) that would have caused a build failure.

## Self-Check: PASSED

- ✅ feed-dialog.tsx exists and contains all required patterns
- ✅ egg-card.tsx exists and contains all required patterns
- ✅ Commits `b709756` and `88c4fbd` exist in git log
- ✅ Build succeeds with zero errors
- ✅ All acceptance criteria verified via grep

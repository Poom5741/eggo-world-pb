---
phase: 10-egg-management
plan: 04
subsystem: frontend
tags:
  - eggs
  - ux-polish
  - loading-states
  - error-handling
  - polling
dependency_graph:
  requires:
    - 10-01  # Egg display foundation
    - 10-02  # Feed flow
    - 10-03  # Hatch flow
  provides:
    - Loading skeleton UI for eggs page
    - Error boundary with retry functionality
    - Exponential backoff polling (30s→60s→120s→5min)
    - "Updating..." badge during polling
    - Edge case handling (empty state, no wallet, network errors)
  affects:
    - apps/web/app/eggs/page.tsx
    - apps/web/components/eggs/egg-card.tsx
    - apps/web/components/eggs/featured-egg-hero.tsx
    - apps/web/hooks/use-egg-poll.ts
tech_stack:
  added: []
  patterns:
    - Loading skeletons with animate-pulse
    - Error boundaries with reset function
    - Exponential backoff: min(30000 * 2^errorCount, 300000)
    - Polling state propagation via props
key_files:
  created:
    - path: apps/web/app/eggs/loading.tsx
      purpose: Loading skeleton UI with placeholders
    - path: apps/web/app/eggs/error.tsx
      purpose: Error boundary with retry button
  modified:
    - path: apps/web/hooks/use-egg-poll.ts
      purpose: Added exponential backoff and polling state
    - path: apps/web/components/eggs/egg-card.tsx
      purpose: Added "Updating..." badge
    - path: apps/web/components/eggs/featured-egg-hero.tsx
      purpose: Added polling badge support
    - path: apps/web/app/eggs/page.tsx
      purpose: Wired polling state, added edge case handling
decisions:
  - decision: Exponential backoff formula
    rationale: Per D-20, starts at 30s and doubles on each error up to 5min max
    formula: min(30000 * Math.pow(2, errorCount), 300000)
  - decision: Badge placement
    rationale: Top-right corner of egg image for visibility without blocking content
  - decision: Wallet check before empty state
    rationale: No wallet is more fundamental than no eggs - check first
metrics:
  duration_seconds: 316
  completed_at: "2026-04-05T14:12:59Z"
  tasks_completed: 3
  files_created: 2
  files_modified: 4
---

# Phase 10 Plan 04: Egg Management Polish Summary

## One-liner

Implemented production-ready UX polish with loading skeletons, error boundaries, exponential backoff polling (30s→60s→120s→5min), "Updating..." badge indicators, and comprehensive edge case handling for empty state and missing wallet.

## What Was Built

### Loading Skeleton (Task 1)
Created `apps/web/app/eggs/loading.tsx` with animated placeholders matching the page layout:
- Page header skeleton (title, subtitle, stats card)
- Featured egg hero skeleton (large card with image and details placeholders)
- 6 egg card skeletons in grid layout (2 rows × 3 cols)
- All skeletons use `animate-pulse` animation

### Error Boundary (Task 1)
Created `apps/web/app/eggs/error.tsx` with:
- Material Symbols error icon (6xl, destructive color)
- Clear error message with truncation for long messages
- Retry button with refresh icon
- Alternative navigation to dashboard
- Thai comments throughout

### Exponential Backoff Polling (Task 2)
Enhanced `use-egg-poll.ts` hook:
- Added `errorCount` state to track consecutive failures
- Added `pollInterval` state for dynamic interval adjustment
- Backoff formula: `min(30000 * Math.pow(2, errorCount), 300000)`
  - 1st error: 60s
  - 2nd error: 120s
  - 3rd+ error: 300s (5min max)
- Reset to 30s on successful fetch
- Added `polling` and `lastUpdated` to return value

### "Updating..." Badge (Task 2)
Added to both `EggCard` and `FeaturedEggHero`:
- Badge variant: `clay` with `animate-pulse`
- Sync icon with `animate-spin`
- Text: "Updating..."
- Position: top-right corner of egg image
- Only shows when `polling=true`

### Edge Case Handling (Task 3)
Enhanced `apps/web/app/eggs/page.tsx`:

**No Wallet State:**
- Check `!user?.wallet` after hydration
- Show wallet icon with "Wallet Not Connected" message
- Button to navigate to dashboard for wallet setup

**Empty State (No Eggs):**
- Show egg icon with "No Eggs Yet" message
- "Get Your First Egg" button → `/mint`
- Added manual "Refresh" button for retry

**Network Error Handling:**
- Error boundary catches fetch errors (Task 1)
- Manual refresh button in empty state
- Automatic retry via exponential backoff polling

**Partial Data Fallbacks:**
- `egg.food_count` defaults to 0 if undefined
- `egg.rarity_seed` shows "Unknown" if missing
- Egg image URLs use fallback (existing pattern)

**Polling State Propagation:**
- `polling` prop wired to all EggCard components
- `polling` prop wired to FeaturedEggHero
- Badge appears on all cards simultaneously during fetch

## Files Created/Modified

### Created
- `apps/web/app/eggs/loading.tsx` (81 lines)
- `apps/web/app/eggs/error.tsx` (88 lines)

### Modified
- `apps/web/hooks/use-egg-poll.ts` (+33 lines, -9 lines)
- `apps/web/components/eggs/egg-card.tsx` (+10 lines)
- `apps/web/components/eggs/featured-egg-hero.tsx` (+14 lines)
- `apps/web/app/eggs/page.tsx` (+53 lines, -9 lines)

## Backoff Interval Formula

```typescript
// Per D-20: Exponential backoff on errors
// 30s → 60s → 120s → 300s (5min max)
const backoffInterval = Math.min(
  30000 * Math.pow(2, errorCount),
  300000
)
```

**Behavior:**
- Success: Reset to 30s (normal polling)
- Error 1: 60s interval
- Error 2: 120s interval
- Error 3+: 300s interval (capped at 5min)

## Edge Cases Handled

| Case | Detection | UI Response |
|------|-----------|-------------|
| No wallet | `!user?.wallet` | Wallet icon + "Connect Wallet" prompt → dashboard |
| No eggs | `eggs.length === 0` | Egg icon + "Get Your First Egg" → mint |
| Network error | `error` from hook | Error boundary + manual retry button |
| Missing food_count | `egg.food_count === undefined` | Default to 0 |
| Missing rarity_seed | `egg.rarity_seed === undefined` | Show "COMMON" |
| Broken image URL | `onError` on img (existing) | Fallback egg SVG |

## Testing Notes

### Verify Loading Skeleton
1. Navigate to `/eggs` while unauthenticated
2. Log in via LINE OAuth
3. Observe loading skeleton displays during initial fetch
4. Skeleton should match page layout structure

### Verify Error Boundary
1. Disconnect network or block PocketBase API
2. Navigate to `/eggs`
3. Error boundary should display with error message
4. Click "Retry" button - should attempt refetch
5. Click "Go to Dashboard" - should navigate correctly

### Verify Polling Badge
1. Open `/eggs` with authenticated user
2. Observe "Updating..." badge appears briefly every 30s
3. Badge should have pulse animation
4. Sync icon should spin
5. Badge appears on both featured egg and regular cards

### Verify Exponential Backoff
1. Disconnect network after initial successful fetch
2. Monitor network tab - polling interval should increase
3. First retry: ~60s delay
4. Second retry: ~120s delay
5. Third+ retry: ~300s (5min) delay
6. Reconnect network - interval should reset to 30s on success

### Verify Edge Cases
1. **No wallet:** Remove wallet from user record → see wallet prompt
2. **No eggs:** User with no egg NFTs → see empty state with mint button
3. **Manual refresh:** Click refresh button → should trigger refetch
4. **Partial data:** Manually test with missing egg fields → should show fallbacks

## Commits

```
eb8ec21 feat(10-04): create loading skeleton and error boundary for eggs page
906fb00 feat(10-04): add exponential backoff polling and updating badge
29591ad feat(10-04): handle edge cases and wire polling to egg cards
```

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- [x] Loading skeleton displays during initial fetch
- [x] Error boundary appears on failures with retry button
- [x] "Updating..." badge pulses during polling
- [x] Polling interval backs off on errors (30s → 60s → 120s → 5min)
- [x] Empty state shows "No eggs yet" with marketplace link
- [x] Missing wallet shows "Connect Wallet" prompt (via dashboard link)
- [x] Manual refresh button available for user control
- [x] All states have Thai comments

---

_Self-Check: PASSED_

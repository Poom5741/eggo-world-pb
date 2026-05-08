# Phase 15: Feed Feature — Wave 1 Summary

**Date:** 2026-05-08
**Commit:** `23e77a5`

## What was done

### Plan 15-01: Wire FeedDialog → backend API

- **`apps/web/hooks/use-egg-feed.ts`**: Added optional `useBackendApi` parameter. When `true`, calls `POST /api/v2/feed-egg` with auth token instead of direct contract call. Backward compatible — default `false` keeps existing direct contract path.
- **`apps/web/components/eggs/feed-dialog.tsx`**: Passed `useEggFeed(true)` to enable backend API mode on submit.

### Plan 15-02: Filter consumed food + "Not Enough Food" empty state

- **`apps/web/components/eggs/feed-dialog.tsx`**: Added `is_consumed = false` filter to the PocketBase `food_nfts` query.
- Added `noFoodAvailable` and `availableFoodCount` state variables.
- Instead of throwing an error when `< 10` unconsumed food items, gracefully shows "Not Enough Food" state with the count of available items and a Cancel button.
- Added "Checking food inventory..." status text during fetch.

### Plan 15-03: Fix handleFeedEgg stub

- **`apps/web/app/eggs/page.tsx`**: Replaced `handleFeedEgg` TODO stub with real logic that finds the egg by `egg_id` and opens the FeedDialog via `setFeedingEgg(egg)` / `setFeedDialogOpen(true)`.

## Files modified

| File                                       | Lines changed | Change                                         |
| ------------------------------------------ | ------------- | ---------------------------------------------- |
| `apps/web/hooks/use-egg-feed.ts`           | +36/-18       | Added `useBackendApi` param + backend API path |
| `apps/web/components/eggs/feed-dialog.tsx` | +30/-25       | Backend mode, consumed filter, empty state     |
| `apps/web/app/eggs/page.tsx`               | +6/-4         | handleFeedEgg from stub to real handler        |

## Flow diagram

```
FEED ME button (FeaturedEggHero) → handleFeedEgg → setFeedingEgg + setFeedDialogOpen(true)
                                                                     ↓
FeedDialog renders → "FEED ME" button → handleQuickFill
                                          ↓
                     fetch food_nfts (is_consumed=false)
                                          ↓
                     count < 10? → Show "Not Enough Food" with Cancel
                     count >= 10? → Auto-select 10 items → show confirmation
                                                                     ↓
                     Confirm → feedEgg(egg_id, food_ids) [backend API]
                                          ↓
                     POST /api/v2/feed-egg (PocketBase hook)
                     → validate → wallet-api feed-egg (contract call)
                     → mark food consumed → update egg food_count
                     → create consumption log → update user stats
                                          ↓
                     Success → toast → onSuccess() → refresh() → close dialog
```

## Testing

- **350 tests pass**, 0 failures, 603 expect() calls
- All verification checks pass (grep for `feed-egg` in hook, `is_consumed` in dialog, `handleFeedEgg` in page)

## Remaining

- Human verification required for end-to-end blockchain tx flow
- "Not Enough Food" state verification with a low-food inventory account
- Error handling when wallet-api or PocketBase is unreachable

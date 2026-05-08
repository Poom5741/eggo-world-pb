---
phase: 15-feed-feature
verified: null
status: pending
score: null
re_verification: null
gaps: null
human_verification:
  - test: "FeedDialog opens from featured egg hero 'FEED ME' button"
    expected: "Click 'FEED ME' on featured egg → FeedDialog opens with auto-select step"
    why_human: "Requires clicking the button and observing dialog behavior"
  - test: "FeedDialog opens from egg card 'Manage Egg' button"
    expected: "Click 'Manage Egg' on any egg card → FeedDialog opens"
    why_human: "Requires clicking the button and observing dialog behavior"
  - test: "Feed flow end-to-end with backend API"
    expected: "Click 'FEED ME' in dialog → auto-selects 10 food items → confirm → transaction submitted → success toast → egg food_count updates"
    why_human: "Requires actual blockchain transaction with testnet wallet"
  - test: "Insufficient food handling"
    expected: "Open FeedDialog on account with < 10 unconsumed food NFTs → shows 'Not Enough Food' message with Cancel button"
    why_human: "Requires account with known low food inventory"
  - test: "Consumed food not selectable"
    expected: "Food NFTs marked is_consumed=true do not appear in auto-selection"
    why_human: "Verify by checking food_nfts collection after a successful feed cycle"
---

# Phase 15: Feed Feature Verification Plan

**Phase Goal:** Complete feed flow — Feed button → food picker → blockchain tx → progress bar update  
**Status:** ⏳ PENDING — requires human verification after implementation

## Truths

| #   | Truth                                                               | Status          | Evidence                                                              |
| --- | ------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| 1   | FeedDialog calls backend API (POST /api/v2/feed-egg)                | ⏳ PENDING      | Verify: grep for "feed-egg" in feed-dialog.tsx                        |
| 2   | FeedDialog filters unconsumed food (is_consumed = false)            | ⏳ PENDING      | Verify: grep for "is_consumed" in feed-dialog.tsx                     |
| 3   | FeedDialog shows "No food available" when < 10 unconsumed food NFTs | ⏳ PENDING      | Verify: grep for "No food" or "Not Enough Food" in feed-dialog.tsx    |
| 4   | Featured egg hero "FEED ME" opens FeedDialog                        | ⏳ PENDING      | Verify: grep for "handleFeedEgg" in page.tsx                          |
| 5   | Progress bar shows X/10 food items on egg cards                     | ✅ ALREADY DONE | `egg-card.tsx` lines 92-99: `<Progress value={progressPercent}>`      |
| 6   | Progress bar shows X/10 on featured egg hero                        | ✅ ALREADY DONE | `featured-egg-hero.tsx` lines 86-101: progress bar and percentage     |
| 7   | Backend hook validates and processes feed (16-feed-egg.pb.js)       | ✅ ALREADY DONE | 256-line hook with full validation, wallet-api call, and DB updates   |
| 8   | wallet-api feed-egg uses real contract call (not mock)              | ✅ ALREADY DONE | `server.js` line 1014+: `eggContract.feedEgg(egg_token_id, food_ids)` |

## Behavioral Spot-Checks

| Behavior                       | Command                                                                    | Result      |
| ------------------------------ | -------------------------------------------------------------------------- | ----------- |
| FeedDialog exists              | `test -f apps/web/components/eggs/feed-dialog.tsx`                         | File exists |
| FeedDialog has handleQuickFill | `grep -q "handleQuickFill" apps/web/components/eggs/feed-dialog.tsx`       | Match found |
| FeedDialog uses useEggFeed     | `grep -q "useEggFeed" apps/web/components/eggs/feed-dialog.tsx`            | Match found |
| Backend hook exists            | `test -f apps/backend/pb_hooks/16-feed-egg.pb.js`                          | File exists |
| Backend hook registers route   | `grep -q "routerAdd" apps/backend/pb_hooks/16-feed-egg.pb.js`              | Match found |
| Backend hook calls wallet-api  | `grep -q "feed-egg" apps/backend/pb_hooks/16-feed-egg.pb.js`               | Match found |
| wallet-api feed-egg exists     | `grep -q "feed-egg" wallet-api/server.js`                                  | Match found |
| wallet-api uses real contract  | `grep -q "feedEgg" wallet-api/server.js`                                   | Match found |
| Egg card progress bar          | `grep -q "progressPercent" apps/web/components/eggs/egg-card.tsx`          | Match found |
| Featured hero progress bar     | `grep -q "progressPercent" apps/web/components/eggs/featured-egg-hero.tsx` | Match found |

## Requirements Coverage

| Requirement | Source        | Description                                         | Status                  |
| ----------- | ------------- | --------------------------------------------------- | ----------------------- |
| **FEAT-01** | 15-CONTEXT.md | Feed button on eggs page → food picker modal        | ⏳ PENDING (plan 15-03) |
| **FEAT-02** | 15-CONTEXT.md | Multi-select up to 10 food NFTs, X/10 counter       | ⏳ PENDING (plan 15-02) |
| **FEAT-03** | 15-CONTEXT.md | Progress bar on egg card (food_count / 10)          | ✅ ALREADY DONE         |
| **FEAT-04** | 15-CONTEXT.md | Consumed food marked "used" in DB, grayed in picker | ⏳ PENDING (plan 15-02) |

## What's Already Done (No Changes Needed)

| Component                        | File                                                          | Status  |
| -------------------------------- | ------------------------------------------------------------- | ------- |
| Progress bar on egg card         | `apps/web/components/eggs/egg-card.tsx` lines 92-99           | ✅ DONE |
| Progress bar on featured hero    | `apps/web/components/eggs/featured-egg-hero.tsx` lines 86-101 | ✅ DONE |
| Backend hook (16-feed-egg.pb.js) | `apps/backend/pb_hooks/16-feed-egg.pb.js` (256 lines)         | ✅ DONE |
| wallet-api feed-egg endpoint     | `wallet-api/server.js` lines 1014-1113                        | ✅ DONE |
| FeedDialog component shell       | `apps/web/components/eggs/feed-dialog.tsx` (210 lines)        | ✅ DONE |
| useEggFeed hook                  | `apps/web/hooks/use-egg-feed.ts` (103 lines)                  | ✅ DONE |
| useEggPoll hook                  | `apps/web/hooks/use-egg-poll.ts` (114 lines)                  | ✅ DONE |
| Eggs page FeedDialog import      | `apps/web/app/eggs/page.tsx` lines 11, 269-276                | ✅ DONE |

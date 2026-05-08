# Phase 15: Feed Feature - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Depends on:** Phase 12 ✅ (Complete)

<domain>
## Phase Boundary

**This phase delivers:** Complete feed flow from egg card feed button → food picker → blockchain transaction → progress bar update.

**Scope:**

- Wire Feed button on eggs page to open food picker modal
- Food NFT picker with multi-select up to 10, counter "X/10"
- Feed button disabled when 0 selected, loading state during tx
- Progress bar on egg card showing food_count / 10
- Consumed food NFTs grayed with "Used" badge
- Hatch-ready indicator when food_count == 10
- Backend hook (16-feed-egg.pb.js) already exists — verify/complete

**Out of scope:**

- Play feature (Phase 16)
- USDT deposit tracking (Phase 13)

</domain>

<decisions>
## Implementation Decisions

### Feed Button: Show always

Show Feed button on all unhatched eggs with food_count < 10.
If user has no available food, open picker showing "No food available" with Cancel.

### Consumed Food: Gray out with "Used" badge

Keep consumed food NFTs visible in picker but dimmed with a "Used" badge.
This helps users see history and prevents confusion.

### Max selection: 10

Matches food_count limit for hatching. Counter shows "X/10 food selected".

</decisions>

<existing_artifacts>

## Existing Implementation

### FeedDialog component

- Location: `apps/web/components/eggs/feed-dialog.tsx` (210 lines)
- Already imported in eggs/page.tsx
- Needs: food NFT fetching, selection logic, submit flow

### 16-feed-egg.pb.js hook

- Location: `apps/backend/pb_hooks/16-feed-egg.pb.js` (256 lines)
- Already registers POST /api/v2/feed-egg
- Calls wallet-api feed-egg endpoint
- Needs verification/testing

### wallet-api feed-egg endpoint

- Location: `wallet-api/server.js` line 1014
- Real contract call (Phase 12) — already implemented
- Calls EggNFT.feedEgg(egg_token_id, food_ids)

### Eggs page

- Location: `apps/web/app/eggs/page.tsx`
- Already has feed button, handleFeedEgg, FeedDialog integration
- Featured egg hero shows egg closest to hatching
- TODO comments at lines 89, 95

</existing_artifacts>

<requirements>
## Requirements

- **FEAT-01**: Feed button on eggs page → food picker modal
- **FEAT-02**: Multi-select up to 10 food NFTs, X/10 counter
- **FEAT-03**: Progress bar on egg card (food_count / 10)
- **FEAT-04**: Consumed food marked "used" in DB, grayed in picker

</requirements>

# Phase 15: Feed Feature - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

<domain>
## Phase Boundary

**This phase delivers:** Complete feed feature UI allowing users to feed Eggs with Food NFTs and track progress toward hatching.

**Scope:**

- Feed button on eggs page opens food NFT picker modal
- Manual selection of 1-10 food NFTs with counter showing "X/10 food selected"
- Egg card displays progress bar (food_count / 10) with visual indicator when ready to hatch (10/10)
- Consumed food NFTs marked as "used" in database and hidden from future picker
- Mobile-optimized 2-column grid for food selection

**Out of scope:**

- Play feature / daily check-in (Phase 16)
- Wallet balance display improvements (Phase 16)
- Batch feeding multiple eggs at once (deferred to v0.0.8)

</domain>

<decisions>
## Implementation Decisions

### Food Picker Modal UX

- **D-01:** Enhanced FeedDialog with manual selection — shows food thumbnails, selection counter (X/10), clear submit button (replaces quick-fill as primary flow)
- **D-02:** Users manually select 1-10 food items with visual feedback per selection (checkbox or highlight)
- **D-03:** Submit button disabled if 0 food selected, enabled when 1-10 selected
- **D-04:** Loading state during blockchain transaction with spinner and "Feeding..." text

### Hatching Ready State

- **D-05:** Visual indicator on egg card when food_count reaches 10/10 — glowing border, sparkle icon, or 'Ready to Hatch!' badge
- **D-06:** HATCH button becomes visually prominent (larger, different color, or animated) when egg is ready, not just enabled
- **D-07:** Egg card displays number of food NFTs needed to hatch (e.g., "8/10 food — 2 more to hatch!")

### Consumed Food NFTs

- **D-08:** Hide consumed food NFTs from picker entirely — filter by `is_consumed = false` in database query
- **D-09:** Users only see available food NFTs in picker, reducing confusion
- **D-10:** Database transaction ensures atomic update (egg.food_count + food.is_consumed) after successful blockchain transaction

### Mobile Food Picker

- **D-11:** Mobile-optimized 2-column grid of food thumbnails with tap-to-select (works on screens < 1024px)
- **D-12:** All touch targets meet 44px minimum (Phase 14 requirement)
- **D-13:** Sticky 'Feed' button at bottom of modal for easy thumb access on mobile
- **D-14:** Scrollable grid with max-height to prevent overflow on small screens

### Claude's Discretion

The following decisions are left to Claude (researcher/planner can decide):

- Exact visual style for "ready to hatch" indicator (glow vs badge vs animation)
- Color scheme for selected vs unselected food items in picker
- Whether to show food type icons or just thumbnails
- Animation timing for selection feedback

### Folded Todos

None — no pending todos were folded into this phase's scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation (MANDATORY)

- `/apps/web/components/eggs/feed-dialog.tsx` — Current FeedDialog component (needs enhancement for manual selection)
- `/apps/web/components/eggs/egg-card.tsx` — EggCard with progress bar (needs ready-to-hatch indicator)
- `/apps/web/components/eggs/hatch-animation.tsx` — Hatch animation component (trigger when 10/10 reached)
- `/apps/web/components/food-nft/FoodCard.tsx` — FoodCard component (reuse in picker grid)
- `/apps/web/hooks/use-food-nft.ts` — Hook with feedEgg() function (backend integration)
- `/apps/web/app/eggs/[id]/feed/page.tsx` — Existing feed page with manual selection grid (reference pattern)

### Project Requirements

- `/Users/poom-work/tokenine/eggo-pocketbase/.planning/REQUIREMENTS.md` — FEAT-01 to FEAT-04 (Phase 15 requirements)
- `/Users/poom-work/tokenine/eggo-pocketbase/.planning/ROADMAP.md` — Phase 15 goal and success criteria

### Backend Integration

- `/apps/backend/pb_hooks/16-feed-egg.pb.js` — PocketBase hook for feed-egg blockchain transaction
- `/wallet-api/server.js` — feed-egg endpoint (real contract call from Phase 12)

### UI System (Phase 14)

- `/apps/web/components/ui/dialog.tsx` — Dialog component (clay variant for FeedDialog)
- `/apps/web/components/ui/button.tsx` — Button component (clay variants)
- `/apps/web/components/BottomNavMobile.tsx` — Bottom tab bar (mobile navigation context)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **FeedDialog** (`components/eggs/feed-dialog.tsx`): Existing dialog with quick-fill logic — needs refactor to show manual selection grid instead
- **FoodCard** (`components/food-nft/FoodCard.tsx`): Food NFT display component with selection state — reuse in picker grid
- **EggCard** (`components/eggs/egg-card.tsx`): Already shows progress bar — add ready-to-hatch visual indicator
- **HatchAnimation** (`components/eggs/hatch-animation.tsx`): 12-second hatching animation — trigger when food_count reaches 10
- **use-food-nft hook** (`hooks/use-food-nft.ts`): Provides `feedEgg()` function, `getUserFoodNfts()` for fetching available food

### Established Patterns

- **Claymorphism UI**: All dialogs, buttons, cards use `variant="clay"` or `variant="clay-secondary"` (Phase 12-14)
- **Material Symbols icons**: Use `className="material-symbols-outlined"` for icons (not Lucide)
- **Mobile-first responsive**: Breakpoints at 320px, 375px, 768px, 1024px, 1440px (Phase 14)
- **PocketBase queries**: Filter syntax `filter: \`owner = "${userId}" && is_consumed = false\``

### Integration Points

- Feed button on EggCard triggers FeedDialog (currently navigates to `/eggs/[id]/feed` — change to open modal)
- FeedDialog calls `use-food-nft.feedEgg()` which hits PocketBase `/api/v2/feed-egg` endpoint
- Backend hook (16-feed-egg.pb.js) validates ownership, calls wallet-api, updates database
- After successful feed, egg card refreshes to show updated food_count

</code_context>

<specifics>
## Specific Ideas

- Food picker should show thumbnail images of food NFTs (not just text names)
- Selection counter format: "X/10 food selected" (matches REQUIREMENTS.md FEAT-02)
- Progress bar on egg card shows `food_count / 10` with percentage fill
- When egg reaches 10/10, show exciting visual feedback (sparkle, glow, or badge) to encourage hatching
- Mobile users tap food cards in 2-column grid, selected items highlight with border/color change
- Consumed food NFTs completely invisible in picker (not grayed out) — cleaner UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 15-feed-feature_  
_Context gathered: 2026-04-19_

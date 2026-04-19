# Phase 15: Feed Feature - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can feed Eggs with Food NFTs through both quick-fill (auto-select) and manual picker modes, see real-time progress during feeding, and track consumed food items. This phase delivers the complete feeding UX - from food selection to blockchain transaction to progress visualization. Creating new food NFTs and hatching animations are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Food Selection UX

- **D-01:** Support BOTH quick-fill (auto-select first 10 food items) AND manual picker mode
- **D-02:** Manual picker shows grid of food NFT thumbnails with checkboxes (tap to select/deselect)
- **D-03:** Counter shows "X/10 food selected" in manual mode (displayed near submit button)
- **D-04:** Submit button disabled if 0 food selected in manual mode
- **D-05:** Quick-fill mode bypasses selection UI - auto-selects 10 items and shows confirmation dialog (existing behavior)

### Progress Visualization

- **D-06:** During blockchain transaction processing, UI shows "Feeding... X/10" counter (not step-by-step animation)
- **D-07:** Progress bar on egg cards updates via existing polling mechanism (30s interval with exponential backoff)
- **D-08:** Visual indicator when egg reaches 10/10 food (ready to hatch) - existing Hatch button shows
- **D-09:** Loading state during transaction submission (spinner + disabled buttons)

### Food Inventory Display

- **D-10:** Show individual NFT cards for each food NFT (not grouped by type)
- **D-11:** Each food card displays: food type icon/emoji (🌾🐟🦗🌿), unique NFT ID, selection checkbox
- **D-12:** Grid layout for food cards (responsive: 2 columns on mobile, 3-4 on desktop)
- **D-13:** Consumed food items hidden immediately on submit (optimistic UI)

### Consumed Food Tracking

- **D-14:** If blockchain transaction fails, show error toast and restore ALL 10 food items to picker
- **D-15:** Database update (`food_nfts.consumed = true`) happens ONLY after blockchain transaction confirms
- **D-16:** PocketBase hook ensures atomic update (egg food_count + food consumed status) in single transaction
- **D-17:** Rollback on blockchain failure - consumed flag not set, food items remain available

### Empty States

- **D-18:** If user has 0 food NFTs, show empty state: "No food NFTs - buy some from the marketplace"
- **D-19:** If user has < 10 food NFTs, show available count + "Need X more to feed" message

### Claude's Discretion

- Exact grid spacing and card design (follow claymorphism design system)
- Error toast styling and positioning (use existing toast component)
- Animation timing for checkbox selection feedback
- Loading skeleton design while fetching food inventory

### Folded Todos

None - no todos were folded into this phase's scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Feed Feature Requirements

- `.planning/REQUIREMENTS.md` §FEAT-01 to FEAT-04 — Feed feature requirements (button visibility, food picker, progress tracking, consumed food marking)

### Phase Definition

- `.planning/ROADMAP.md` §Phase 15 — Phase goal, success criteria, dependencies

### Existing Implementation

- `apps/web/components/eggs/feed-dialog.tsx` — Current FeedDialog component (quick-fill mode, confirmation flow)
- `apps/web/hooks/use-egg-feed.ts` — Blockchain transaction hook for feeding eggs
- `apps/web/app/eggs/page.tsx` — Eggs page with FeedDialog integration
- `apps/backend/pb_hooks/` — PocketBase hooks for server-side validation (check for existing feed hook)

### Design System

- `apps/web/components/ui/` — Claymorphism UI components (Button, Dialog, Card, Badge, Progress)
- `.planning/DESIGN_SYSTEM.md` — Claymorphism design tokens and patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **FeedDialog component** (`apps/web/components/eggs/feed-dialog.tsx`): Already implements quick-fill auto-select mode with confirmation dialog - extend to add manual picker mode
- **useEggFeed hook** (`apps/web/hooks/use-egg-feed.ts`): Handles blockchain transaction submission, loading states, error handling - reuse for both selection modes
- **EggCard component** (`apps/web/components/eggs/egg-card.tsx`): Shows progress bar and food_count - already displays feeding progress
- **PocketBase client** (`apps/web/lib/pocketbase/client.ts`): Fetch food NFTs from `food_nfts` collection with owner filter
- **Claymorphism components**: Button, Dialog, Card, Badge, Progress variants available in `components/ui/`

### Established Patterns

- **Hydration-safe auth**: Use `useIsHydrated()` hook before accessing `pb.authStore.record`
- **Exponential backoff polling**: 30s→5min pattern for data freshness (useEggPoll hook)
- **Dialog flow**: Two-step confirmation (selection → confirm → submit) matches existing FeedDialog pattern
- **Error handling**: Toast notifications for transaction failures (existing toast setup)
- **Loading states**: Spinner + disabled buttons during blockchain operations

### Integration Points

- **FeedDialog** needs enhancement: Add tab/toggle for quick-fill vs manual mode
- **Food NFT fetching**: Query `food_nfts` collection with `owner = {userId}` and `consumed = false` filter
- **Progress updates**: Existing egg polling (useEggPoll) will reflect food_count changes after tx confirms
- **Blockchain tx**: useEggFeed.feedEgg() accepts egg_id and food_token_ids[] array

</code_context>

<specifics>
## Specific Ideas

- User should be able to switch between quick-fill and manual modes within the same dialog
- Food NFT thumbnails should show the 4 food type emojis: 🌾 Grain, 🐟 Fish, 🦗 Insects, 🌿 Herbs
- Grid layout should feel tactile - cards should have subtle press feedback on tap
- "Feeding... X/10" counter should update optimistically as blockchain tx processes (not waiting for each individual food item confirmation since feedEgg is a single batch transaction)
- Error recovery should be seamless - failed tx restores picker state exactly as before

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)

None - no todos were reviewed in this phase.

</deferred>

---

_Phase: 15-feed-feature_  
_Context gathered: 2026-04-19_

# Phase 56: Egg Mint Frontend & Integration — Plan

**Phase:** 56
**Status:** Ready to execute
**Wave:** 1
**Plans:** 1
**Requirements addressed:** FE-01

---

## Plan 01: Add Minted Egg Details Modal

**Objective:** Enhance mint success experience with a modal overlay showing egg details

**Dependencies:** None (builds on existing mint page)

**Files modified:**

- `apps/web/app/mint/page.tsx`

---

### Context

Existing mint page (`apps/web/app/mint/page.tsx`) currently:

- Calls `POST /api/v2/mint-egg` with auth token
- Polls for transaction confirmation via `GET /api/v2/tx-status/{hash}`
- Redirects to `/eggs?highlight={egg_id}` after 3 seconds on success

Phase 56 decision: Show minted egg details on success using a **modal overlay**.

---

### Task 56-01: Add MintedEggModal component

**Action:**
Add a new `MintedEggModal` component to `apps/web/app/mint/page.tsx` that:

1. Displays a claymorphism-styled modal overlay when `confirmationProgress === 'confirmed'`
2. Shows egg details:
   - Egg ID (from `result.data?.egg_id`)
   - Token ID (from `result.data?.token_id`)
   - Rarity seed (from `result.data?.rarity_seed`)
   - Transaction hash (truncated, with full hash on hover)
   - Initial food count: 2 Food NFTs
   - Referral chain: show badge if referral chain exists
3. "View on BSCScan" link using `https://rpc.0xl3.com/tx/{txHash}`
4. "View My Eggs" button that dismisses modal and redirects to `/eggs?highlight={egg_id}`
5. Auto-dismiss after 3 seconds (existing behavior, but modal prevents immediate redirect)

**Read first:**

- `apps/web/app/mint/page.tsx` — Existing mint page (full file to understand current state)
- `apps/web/app/mint/error.tsx` — Error boundary pattern

**Acceptance criteria:**

- [ ] `MintedEggModal` component added to the file
- [ ] Modal appears when `confirmationProgress === 'confirmed'`
- [ ] Modal displays: egg_id, token_id, rarity_seed, txHash (truncated), food_count=2
- [ ] "View on BSCScan" link renders with correct URL
- [ ] "View My Eggs" button redirects to `/eggs?highlight={egg_id}`
- [ ] Modal has claymorphism styling matching app design (`clay-card` class)
- [ ] Modal is dismissible (click outside or button)
- [ ] Auto-redirect still happens after 3 seconds if modal not dismissed

**Implementation notes:**

- Use existing `Alert` variant with custom styling for claymorphism
- Icons: `Egg` (for egg icon), `ExternalLink` (BSCScan), `X` (close)
- Truncate txHash: `txHash.slice(0, 10) + '...' + txHash.slice(-8)`

---

## Verification

### Must-haves (goal-backward)

1. User sees egg details after successful mint — not just redirect
2. Modal styled with claymorphism design system
3. User can view transaction on BSCScan
4. User can navigate to eggs page to see their new egg

### Checkpoints

- [ ] Modal renders with all required fields
- [ ] Claymorphism styling matches existing cards
- [ ] BSCScan link uses correct explorer URL
- [ ] Redirect works with `highlight` parameter

---

**Created:** 2026-05-08
**Phase:** 56-egg-mint-frontend-and-integration

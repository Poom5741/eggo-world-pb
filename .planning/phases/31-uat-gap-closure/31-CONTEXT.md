# Phase 31: UAT Gap Closure - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning (gap_closure mode)
**Source:** Browser agent UAT testing on localhost:3000

---

## Phase Boundary

This phase fixes 3 critical bugs identified during browser agent UAT testing:

1. **Polling Badge Missing (Phase 10 Test 7)** — MAJOR
   - API polling works (egg_nfts collection polled every 30s)
   - Hook returns `polling: boolean` state
   - BUT no visual "Updating..." badge rendered on EggCard

2. **Breeding Dialog Parent 2 Bug (Phase 21 Test 1)** — BLOCKER
   - Parent 2 section shows "No animals available" despite having 3 animals
   - Root cause: ALL animals have `animal_id = 0` in database
   - Filter logic `animals.filter(a => a.animal_id !== excludeAnimalId)` excludes ALL when parent1 (animal_id=0) selected

3. **Marketplace Detail Page 404 (Phase 23 Test 5)** — BLOCKER
   - Route `/marketplace/detail?id=X` exists but returns "Product not found"
   - MarketplaceDetailClient receives `listingId = '0'` when id is undefined
   - Component renders "Product not found" for invalid listingId

---

## Implementation Decisions

### Bug 1: Polling Badge Visual Indicator

**Current State:**

- `use-egg-poll.ts` line 121: `return { ..., polling: loading, ... }`
- Hook correctly returns `polling` boolean that is true during fetch
- `apps/web/app/eggs/page.tsx` line 95: extracts `polling` state
- BUT: `polling` state not passed to EggCard or not rendered

**Fix:**

- Pass `polling` prop from eggs/page.tsx to EggCard component
- Add polling indicator badge to EggCard when `polling === true`
- Badge should show: "Updating..." with pulse animation, spinning sync icon

**Files to modify:**

- `apps/web/app/eggs/page.tsx` — pass polling prop to EggCard
- `apps/web/components/egg-nft/EggCard.tsx` — add PollingIndicator component

### Bug 2: Breeding Dialog Animal ID Issue

**Current State:**

- `AnimalSelectionGrid.tsx` line 59: `animals.filter(a => a.animal_id !== excludeAnimalId)`
- Filter logic is correct BUT animals have wrong data
- Browser agent: "All animals have animal_id=0"
- This could be:
  1. Backend creates animals with animal_id=0
  2. Frontend fetches wrong field (id vs animal_id)
  3. Blockchain returns token_id=0

**Fix options:**
A. Fix backend hook to set correct animal_id from blockchain token_id
B. Fix frontend to use correct field (id or token_id instead of animal_id)
C. Add fallback: if animal_id=0, use record.id for filtering

**Files to investigate:**

- `apps/backend/pb_hooks/*.pb.js` — animal creation hook
- `apps/web/hooks/use-animal-poll.ts` — AnimalData type and fetch
- `apps/web/components/breeding/AnimalSelectionGrid.tsx` — filter logic

### Bug 3: Marketplace Detail Page Routing

**Current State:**

- `apps/web/components/marketplace/AnimalListingsSection.tsx` line 160: `router.push(`/marketplace/detail?id=${listing.id}`)`
- `apps/web/app/marketplace/detail/page.tsx` line 12: `const listingId = searchParams.id || '0'`
- `MarketplaceDetailClient` renders "Product not found" for invalid listingId

**Fix:**

- Validate listing.id before navigation
- Show error if listing.id is undefined/null
- OR redirect to marketplace list page if invalid

**Files to modify:**

- `apps/web/components/marketplace/AnimalListingsSection.tsx` — validate listing.id
- `apps/web/app/marketplace/detail/page.tsx` — handle invalid id gracefully

---

## Canonical References

**Downstream agents MUST read these before implementing:**

### Bug Context (UAT Files)

- `.planning/phases/10-egg-management/10-UAT.md` — Polling badge gap
- `.planning/phases/21-breeding-system/21-UAT.md` — Breeding dialog blocker
- `.planning/phases/23-secondary-market-royalties/23-UAT.md` — Detail page blocker

### Source Code (Current Implementation)

- `apps/web/hooks/use-egg-poll.ts` — Returns `polling` state
- `apps/web/app/eggs/page.tsx` — Uses `polling` but doesn't render
- `apps/web/components/egg-nft/EggCard.tsx` — Needs polling indicator
- `apps/web/components/breeding/BreedingDialog.tsx` — Passes animals to grid
- `apps/web/components/breeding/AnimalSelectionGrid.tsx` — Filter logic
- `apps/web/hooks/use-animal-poll.ts` — AnimalData type definition
- `apps/web/components/marketplace/AnimalListingsSection.tsx` — Navigation
- `apps/web/app/marketplace/detail/page.tsx` — Route handler

---

## Specific Ideas

**Bug 1 Fix Pattern:**

- Use existing Badge component with pulse animation
- Material Symbols icon: `sync` with rotation animation
- Position: top-right of EggCard during polling

**Bug 2 Investigation:**

- Check PocketBase animal_nfts collection data
- Check backend hook that creates animals after hatch
- May need to add animal_id population from blockchain

**Bug 3 Quick Fix:**

- Add null check before router.push
- Redirect to `/marketplace` if listing.id is undefined

---

## Deferred Ideas

None — All 3 bugs are blockers/major and must be fixed.

---

_Phase: 31-uat-gap-closure_
_Context gathered: 2026-04-24 via UAT analysis_

# Quick Task 260430: Fix 3 remaining E2E journey test failures

## Task 1: Fix Buy Egg — marketplace detail page missing "Buy" button

**Files:** `apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx`, `apps/web/hooks/use-marketplace-sync.ts`

**Problem:** Detail page fetches listing but BuyFlow component doesn't render — likely `useMarketplaceSync` fails due to `pb.authStore.record` being null (same auth issue as eggs/animals pages).

**Fix:**

- Read `use-marketplace-sync.ts` and `MarketplaceDetailClient.tsx`
- Replace any `pb.authStore.record` with `getUser()` pattern
- Add `restoreAuth` call in useEffect to ensure auth is loaded before data fetch

**Verify:** `POCKETBASE_URL=http://localhost:8091 npx playwright test --grep "Buy Egg Journey" --reporter=list`

---

## Task 2: Fix Feed+Hatch — eggs page not showing eggs

**Files:** `apps/web/hooks/use-egg-poll.ts`

**Problem:** `useEggPoll` creates PocketBase client and fetches eggs, but returns empty. The API call might fail because `pb.authStore.token` is empty when the fetch runs (race condition with auth restoration).

**Fix:**

- In `fetchEggs` callback, call `restoreAuth` before making the fetch request
- Or store a ref that tracks auth readiness before fetching

**Verify:** `POCKETBASE_URL=http://localhost:8091 npx playwright test --grep "Feed.*Hatch" --reporter=list`

---

## Task 3: Fix Marketplace Multi-User — animals page not showing animals

**Files:** `apps/web/hooks/use-animal-poll.ts`

**Problem:** Same as Task 2 — `useAnimalPoll` returns empty because auth token isn't ready when fetch runs.

**Fix:**

- Same pattern as Task 2: ensure auth is restored before API call

**Verify:** `POCKETBASE_URL=http://localhost:8091 npx playwright test --grep "Marketplace.*Multi-User" --reporter=list`

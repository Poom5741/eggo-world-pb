# Phase 46: Feed + Hatch Journey Test - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

E2E test for the complete "Feed + Hatch" user journey: buy food → feed egg (10 times) → hatch animal. Second functional journey test in v0.4.0 milestone.

**Delivers:**

1. Playwright test for full feed/hatch journey (buy food → feed → hatch → verify)
2. Triple verification for hatched animal (UI + on-chain + PocketBase)
3. Error scenario test for no food available
4. Marketplace food purchase integration (full user flow)

**Not delivering:**

- Marketplace multi-user journey (Phase 47)
- Referral commission journey (Phase 48)
- VRF mock coordinator (deferred)
- Already hatched error scenario (deferred)

</domain>

<decisions>
## Implementation Decisions

### Test Scope & Coverage

- **D-01:** Full journey test: Marketplace buy food → navigate eggs → select egg → batch feed → hatch → verify animal appears
- **D-02:** Single test file for main journey: `playwright-feed-hatch-journey.test.ts`
- **D-03:** Test structure: setup (login) → buy food → navigate eggs → select egg → feed → wait for hatch → triple verify
- **D-04:** Use existing `e2eLogin()` helper from Phase 42 for authentication

### Feed Mechanics

- **D-05:** Batch feed approach: Single feed action that uses all 10 foods at once
- **D-06:** Test verifies progress jumps from 0/10 → 10/10 (no intermediate state checks)
- **D-07:** Feed button triggers hatch automatically when progress reaches 10/10

### Hatch Verification Depth

- **D-08:** Triple verification pattern for hatched animal:
  1. UI: Animal card visible on `/animals` page
  2. On-chain: `ownerOf(tokenId)` on AnimalNFT matches test_buyer wallet
  3. PocketBase: `animals` collection record exists with correct `owner_id`
- **D-09:** Use `verifyAnimalOwnership()` helper from Phase 47 for verification
- **D-10:** Hatch button wait timeout: 30 seconds (same as purchase flow)

### Test Data Setup

- **D-11:** Marketplace purchase approach for food:
  - Test starts with test_buyer buying food from marketplace
  - Pre-created food listings in marketplace_listings
  - No direct PocketBase injection for food items
- **D-12:** Pre-created egg for test_buyer:
  - Egg with 0/10 feed progress
  - Ready for feeding/hatching flow
- **D-13:** Food NFT contract address: `FOOD_NFT_ADDRESS` from Phase 47

### Error Scenarios

- **D-14:** No food available scenario only for this phase
- **D-15:** Error test setup:
  - test_buyer_poor with 0 food items (can't feed egg)
  - Feed button disabled or shows "No food" message
- **D-16:** Other error scenarios (already hatched, VRF timeout) deferred

### Test Users

- **D-17:** Main journey uses `test_buyer` (existing from Phase 42)
- **D-18:** Error scenario uses `test_buyer_poor` (same as Phase 45 insufficient balance test)

### Claude's Discretion

- Exact timeout values for UI wait states
- Retry count for hatch confirmation
- Pre-created egg token ID for testing
- Pre-created food listing configuration

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing E2E Infrastructure

- `tests/fixtures/e2e-setup.ts` — E2E login helper, test users, context setup
- `tests/fixtures/blockchain-helpers.ts` — waitForTx, getOwnerOf, getBalanceOf
- `tests/fixtures/journey-helpers.ts` — verifyEggOwnership, verifyAnimalOwnership, FOOD_NFT_ADDRESS
- `tests/e2e/playwright-buy-egg-journey.test.ts` — Reference pattern from Phase 45
- `tests/e2e/playwright-marketplace-multi-user.test.ts` — Reference pattern from Phase 47

### Application Code

- `apps/web/app/eggs/page.tsx` — Eggs page for selecting egg to feed
- `apps/web/app/animals/page.tsx` — Animals page for verifying hatched animal
- `apps/web/components/egg-nft/FeedDialog.tsx` — Feed dialog interaction
- `apps/web/components/egg-nft/HatchButton.tsx` — Hatch button interaction
- `apps/backend/pb_hooks/15-feed-egg.pb.js` — Feed endpoint

### Project Context

- `.planning/REQUIREMENTS.md` — v0.3.0 infrastructure requirements (complete)
- `.planning/ROADMAP.md` — Phase 46 goal: buy food → feed egg → hatch animal
- `.planning/PROJECT.md` — Target flows table: Feed flow is P0, Hatch flow is P0
- `.planning/phases/45-buy-egg-journey-test/45-CONTEXT.md` — Triple verification pattern
- `.planning/phases/47-marketplace-journey-test/47-CONTEXT.md` — verifyAnimalOwnership helper

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `e2eLogin(page, 'test_buyer')` — Authentication bypass helper
- `waitForTx(hash, { confirmations: 12 })` — Transaction polling
- `verifyAnimalOwnership(page, tokenId, expectedOwner, userId)` — Triple verification for animals
- `FOOD_NFT_ADDRESS` — Food NFT contract address constant
- `ANIMAL_NFT_ADDRESS` — Animal NFT contract address constant

### Established Patterns

- Playwright `test.describe.configure({ mode: 'serial' })` for dependent tests
- Marketplace purchase flow (buy → wait → verify)
- Triple verification helper pattern
- Error scenario with dedicated test user

### Integration Points

- New test file: `tests/e2e/playwright-feed-hatch-journey.test.ts`
- Existing helpers: `journey-helpers.ts` (verifyAnimalOwnership)
- Food listings: Pre-created in marketplace_listings collection

</code_context>

<specifics>
## Specific Ideas

- Test flow:
  1. `e2eLogin(page, 'test_buyer')`
  2. `page.goto('/marketplace/')` → Buy food (pre-created listing)
  3. `page.goto('/eggs/')` → Select egg with 0/10 progress
  4. Click "Feed" button → Batch feed uses all 10 foods
  5. Wait for hatch confirmation
  6. `page.goto('/animals/')` → Verify animal card visible
  7. Triple verify: `verifyAnimalOwnership(page, tokenId, test_buyer.walletAddress, userId)`
- Feed + hatch test helpers (extend journey-helpers.ts):
  ```typescript
  async function waitForHatchComplete(page: Page, timeoutMs?: number): Promise<number> {
    // Wait for redirect to /animals or hatch success toast
    // Return the newly minted animal tokenId
  }
  ```

</specifics>

<deferred>
## Deferred Ideas

- Already hatched error scenario → future maintenance
- VRF timeout/retry handling → deferred until randomness testing needed
- Individual feed clicks (10x) → slower test execution, batch preferred
- Hatch animation verification → visual testing (optional)

</deferred>

---

_Phase: 46-feed-hatch-journey-test_
_Context gathered: 2026-04-28_

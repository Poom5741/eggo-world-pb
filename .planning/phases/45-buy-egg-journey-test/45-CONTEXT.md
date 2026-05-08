# Phase 45: Buy Egg Journey Test - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

E2E test for the complete "Buy Egg" user journey: authentication → marketplace browsing → purchase → verify NFT ownership. First functional journey test in v0.4.0 milestone.

**Delivers:**

1. Playwright test for full buy journey (login → browse → buy → wait → verify)
2. Triple verification pattern (UI + on-chain + PocketBase)
3. Error scenario test for insufficient balance
4. Test data setup pattern (pre-created listings + separate test users)

**Not delivering:**

- Feed/hatch journey tests (Phase 46)
- Marketplace multi-user journey (Phase 47)
- Referral commission journey (Phase 48)
- VRF mock coordinator (deferred)
- Production smoke tests

</domain>

<decisions>
## Implementation Decisions

### Test Scope & Coverage

- **D-01:** Full journey test: E2E login → marketplace browse → buy button → transaction wait → verify NFT appears
- **D-02:** Single test file for main journey: `playwright-buy-egg-journey.test.ts`
- **D-03:** Test structure: setup (login) → navigate marketplace → click buy → wait for tx → triple verify
- **D-04:** Use existing `e2eLogin()` helper from Phase 42 for authentication

### Verification Depth

- **D-05:** Triple verification pattern for ownership:
  1. UI: NFT card visible on `/eggs` page
  2. On-chain: `ownerOf(tokenId)` matches test_buyer wallet
  3. PocketBase: `eggs` collection record exists with correct `owner_id`
- **D-06:** Verification sequence: UI first (user experience), then on-chain (blockchain truth), then PB (app sync)
- **D-07:** Use existing `getOwnerOf()` helper from blockchain-helpers.ts for on-chain check
- **D-08:** PocketBase check via API: `GET /api/collections/eggs/records?filter=owner_id='{user_id}'`

### Test Data Setup

- **D-09:** Pre-created listings dominant approach:
  - Main journey test uses pre-created egg listings in PocketBase
  - Error scenario tests use dynamic setup as needed
- **D-10:** Pre-create 2-3 egg listings with different prices/rarities for deterministic testing
- **D-11:** Test eggs minted to test_seller account (seller lists, buyer purchases)
- **D-12:** Listings created in PocketBase with known `listing_id` for test targeting

### Error Scenarios

- **D-13:** Insufficient balance scenario only for this phase
- **D-14:** Separate test user for insufficient balance: `test_buyer_poor` with 0 USDT
- **D-15:** Error test verifies:
  - Buy button disabled or shows error toast
  - Transaction does not initiate
  - User remains on marketplace page
- **D-16:** Other error scenarios (already sold, marketplace paused) deferred to Phase 47 (Marketplace Journey)

### Test Users

- **D-17:** Main journey uses `test_buyer` (existing from Phase 42)
- **D-18:** Error scenario uses new `test_buyer_poor`:
  - walletAddress: `0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65` (Anvil Account 4)
  - USDT balance: 0
  - Created in production PocketBase before tests run

### Claude's Discretion

- Exact timeout values for UI wait states
- Retry count for flaky transaction checks
- Test file location (tests/e2e/playwright-buy-egg-journey.test.ts)
- Pre-created listing IDs/configurations

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing E2E Infrastructure

- `tests/fixtures/e2e-setup.ts` — E2E login helper, test users, context setup
- `tests/fixtures/blockchain-helpers.ts` — waitForTx, getOwnerOf, getBalanceOf, parseEvent
- `playwright.config.ts` — Playwright configuration, baseURL, timeouts
- `tests/e2e/playwright-auth-bypass.test.ts` — Reference test pattern for auth bypass

### Application Code

- `apps/web/app/marketplace/page.tsx` — Marketplace page for browsing eggs
- `apps/web/app/eggs/page.tsx` — Eggs page where purchased NFT should appear
- `apps/web/components/marketplace/BuyButton.tsx` — Buy button interaction
- `wallet-api/server.js` — Transaction endpoints, ABIs

### Project Context

- `.planning/REQUIREMENTS.md` — v0.3.0 infrastructure requirements (Phases 41-44 complete)
- `.planning/ROADMAP.md` — Phase 45 goal: auth → buy → NFT appears
- `.planning/PROJECT.md` — Target flows table: Mint flow is P0

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `e2eLogin(page, 'test_buyer')` — Authentication bypass helper, redirects to dashboard
- `waitForTx(hash, { confirmations: 12 })` — Transaction polling with timeout
- `getOwnerOf(contractAddress, tokenId)` — On-chain ownership verification
- `TEST_USERS` object — Predefined test users with wallet addresses

### Established Patterns

- Playwright `test.describe.configure({ mode: 'serial' })` for dependent tests
- `page.waitForSelector()` for UI element verification
- `page.waitForURL()` for navigation verification
- Trailing slashes required for static export routes (`/auth/login/` not `/auth/login`)

### Integration Points

- New test file: `tests/e2e/playwright-buy-egg-journey.test.ts`
- New test user: `test_buyer_poor` in TEST_USERS and PocketBase
- Pre-created listings: Stored in PocketBase `marketplace_listings` collection

</code_context>

<specifics>
## Specific Ideas

- Test flow:
  1. `e2eLogin(page, 'test_buyer')`
  2. `page.goto('/marketplace/')`
  3. Click on egg listing (pre-created)
  4. Click "Buy Now" button
  5. Wait for transaction confirmation
  6. Navigate to `/eggs/`
  7. Verify egg card visible with matching tokenId
  8. Cross-check: `getOwnerOf(EGG_NFT_ADDRESS, tokenId) === test_buyer.walletAddress`
  9. Cross-check: PocketBase API query for egg record

- Triple verification helper pattern:

  ```typescript
  async function verifyEggOwnership(page, tokenId, expectedOwner) {
    // UI check
    const eggCard = page.locator(`[data-token-id="${tokenId}"]`)
    await expect(eggCard).toBeVisible()

    // On-chain check
    const onChainOwner = await getOwnerOf(EGG_NFT_ADDRESS, tokenId)
    expect(onChainOwner).toBe(expectedOwner)

    // PocketBase check
    const pbRecord = await fetch(
      `${PB_URL}/api/collections/eggs/records?filter=token_id='${tokenId}'`
    )
    const data = await pbRecord.json()
    expect(data.items[0].owner_id).toBe(testBuyerUserId)
  }
  ```

</specifics>

<deferred>
## Deferred Ideas

- Feed + hatch journey tests → Phase 46
- Marketplace multi-user tests (seller → buyer flow) → Phase 47
- Referral commission tests → Phase 48
- "Already sold" error scenario → Phase 47 (Marketplace Journey)
- "Marketplace paused" error scenario → Phase 47
- Network timeout retry logic → future maintenance
- VRF mock coordinator setup → deferred until hatch testing needs randomness

</deferred>

---

_Phase: 45-buy-egg-journey-test_
_Context gathered: 2026-04-28_

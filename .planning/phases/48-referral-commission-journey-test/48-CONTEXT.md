# Phase 48: Referral Commission Journey Test - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

E2E test for complete referral commission flow: signup → purchase → commission distribution verification. Tests the 4-level MLM commission system (G1=20%, G2-G4=10%) that powers the platform's referral incentives.

**Delivers:**

1. Playwright test for referral commission journey (referral chain setup → buyer purchase → verify commission balances)
2. Commission verification helpers (on-chain + PocketBase double verification)
3. Multi-level referral chain test setup pattern (G1 → G2 → G3 → G4 → buyer)
4. Integration with existing triple verification pattern from Phase 45/47

**Not delivering:**

- Commission claim flow testing (claimCommission/claimCommissionUSDT) - balance accumulation only
- Referral signup UI journey - focuses on commission distribution after purchase
- Resale royalty commission (Phase 47 covers marketplace royalties)
- VRF-related testing
- Production smoke tests

</domain>

<decisions>
## Implementation Decisions

### Test Flow & Scope

- **D-01:** Test flow: Setup referral chain → test_buyer purchases → verify commission balance accumulation
  - Skip signup UI complexity - use pre-created referral chain in PocketBase
  - Focus on commission distribution triggered by mint-egg purchase
- **D-02:** Commission verification scope: Both on-chain and PocketBase
  - On-chain: CommissionDistribution.getCommissionBalance(address)
  - PocketBase: commission_records collection (amount, level, from_egg)
  - User record: usdt_total_earned field updated
- **D-03:** Single test file for main journey: `playwright-referral-commission.test.ts`
- **D-04:** Use existing e2eLogin() helper for authentication (test_buyer)
- **D-05:** Mint-egg endpoint triggers commission distribution: POST /api/v2/mint-egg

### Test Users & Referral Chain

- **D-06:** Use existing test_referrer (Anvil Account 2) as G1 referrer
- **D-07:** Create minimal referral chain for testing:
  - G1: test_referrer (existing, Anvil Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
  - G2-G4: Placeholder addresses or new test users as needed
  - Buyer: test_buyer (Anvil Account 0)
- **D-08:** Pre-configure referral_chain field on test_buyer user record in PocketBase
- **D-09:** Commission percentages: G1=20%, G2=10%, G3=10%, G4=10% (total 50% distributed)

### Verification Depth

- **D-10:** Commission verification pattern:
  1. On-chain: getCommissionBalance(referrerWallet) matches expected amount
  2. PocketBase: commission_records exists with correct amount, level, from_egg
  3. User: usdt_total_earned updated for referrer
- **D-11:** Verification sequence: On-chain first (blockchain truth), then PocketBase (app sync), then user record
- **D-12:** Expected commission calculation: price _ percentage (25 USDT _ 20% = 5 USDT for G1)
- **D-13:** Use COMMISSION_DISTRIBUTION_ADDRESS constant from contract-addresses.json

### Error Scenarios

- **D-14:** No referrer scenario: buyer with empty referral_chain - commissions go to platform
- **D-15:** Deferred error scenarios: insufficient referrer balance (not applicable), invalid chain - future phases

### Claude's Discretion

- Exact timeout values for blockchain polling
- Retry count for commission balance checks
- Test file location (tests/e2e/playwright-referral-commission.test.ts)
- G2-G4 placeholder addresses or new test users

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing E2E Infrastructure

- `tests/fixtures/e2e-setup.ts` — E2E login helper, test users (test_referrer available)
- `tests/fixtures/journey-helpers.ts` — Triple verification pattern, EGG_NFT_ADDRESS constant
- `tests/fixtures/blockchain-helpers.ts` — getOwnerOf, waitForTx patterns
- `playwright.config.ts` — Playwright configuration, baseURL, timeouts

### Commission System

- `contracts/src/CommissionDistribution.sol` — Commission distribution contract, getCommissionBalance, commissionBalances mapping
- `contracts/contract-addresses.json` — COMMISSION address: 0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f (ChainId 7117)
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Mint-egg endpoint, referral chain building, commission_records creation
- `apps/backend/pb_hooks/06-referral-chain.pb.js` — Referral chain setup at signup

### Application Code

- `apps/web/app/dashboard/page.tsx` — Buddy Chain visualization component
- `apps/web/components/dashboard/buddy-chain.tsx` — Commission rates (20%, 10%, 10%, 10%)

### Project Context

- `.planning/ROADMAP.md` — Phase 48 goal: signup → purchase → commission
- `.planning/PROJECT.md` — Target flows: Commission flow is P1
- `.planning/phases/45-buy-egg-journey-test/45-CONTEXT.md` — Triple verification pattern reference
- `.planning/phases/47-marketplace-journey-test/47-01-SUMMARY.md` — Multi-user journey pattern

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `e2eLogin(page, 'test_buyer')` — Authentication bypass helper
- `waitForTx(hash, { confirmations: 12 })` — Transaction polling pattern
- `getOwnerOf(contractAddress, tokenId)` — On-chain read pattern (can adapt for getCommissionBalance)
- `TEST_USERS.test_referrer` — Predefined referrer test user (Anvil Account 2)
- `verifyEggOwnership()` — Triple verification pattern to extend for commissions

### Established Patterns

- `test.describe.configure({ mode: 'serial' })` — Dependent tests pattern
- Commission distribution: referral_chain array passed to mint-egg endpoint
- Commission records: user, level, amount, tx_hash, from_egg, claimed fields
- usdt_total_earned: cumulative commission earned on user record

### Integration Points

- New test file: `tests/e2e/playwright-referral-commission.test.ts`
- New helper: `verifyCommissionBalance()` in journey-helpers.ts
- Commission contract address: COMMISSION_DISTRIBUTION_ADDRESS constant
- PocketBase collection: commission_records
- User field: referral_chain (JSON array of wallet addresses)

</code_context>

<specifics>
## Specific Ideas

- Test flow:
  1. Pre-configure test_buyer with referral_chain = [test_referrer.wallet, G2_addr, G3_addr, G4_addr]
  2. `e2eLogin(page, 'test_buyer')`
  3. Call mint-egg endpoint: POST /api/v2/mint-egg (or navigate to UI and trigger)
  4. Wait for transaction confirmation
  5. Verify commission balances:
     - On-chain: getCommissionBalance(test_referrer.wallet) === 5 USDT (20% of 25)
     - PocketBase: commission_records filter by tx_hash, check amount=5, level=1
     - User: test_referrer.usdt_total_earned updated

- Commission verification helper pattern:

  ```typescript
  export const COMMISSION_DISTRIBUTION_ADDRESS = "0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f"

  async function verifyCommissionBalance(
    page: Page | null,
    referrerWallet: string,
    expectedAmount: number,
    txHash: string,
    level: number
  ): Promise<CommissionVerificationResult> {
    // 1. On-chain check: getCommissionBalance(referrerWallet)
    const onChainBalance = await getCommissionBalance(
      COMMISSION_DISTRIBUTION_ADDRESS,
      referrerWallet
    )

    // 2. PocketBase check: commission_records
    const response = await fetch(
      `${PB_URL}/api/collections/commission_records/records?filter=(tx_hash='${txHash}')`
    )
    const records = await response.json()

    // 3. Verify amounts match
    return {
      onChainBalance,
      pbAmount: records.items[0]?.amount,
      level: records.items[0]?.level,
      allMatch: onChainBalance >= expectedAmount && pbAmount === expectedAmount,
    }
  }
  ```

</specifics>

<deferred>
## Deferred Ideas

- Commission claim flow testing → future phase (claimCommission/claimCommissionUSDT)
- Referral signup UI journey → separate phase if needed
- Resale royalty commission verification → Phase 47 covers marketplace
- Multi-level full chain verification (all 4 levels) → extended test if needed
- No-referrer scenario error handling → future phase
- VRF randomness for hatching → deferred until hatch testing

</deferred>

---

_Phase: 48-referral-commission-journey-test_
_Context gathered: 2026-04-28_

# E2E Test Status - Blockchain Data Gap Analysis

**Date:** 2026-04-29  
**Milestone:** v0.4.0 (Phases 45-48 Journey Tests)  
**Status:** Partially Complete - Auth Working, Blockchain Data Missing

---

## ✅ What's Working

### 1. E2E Authentication (100% Complete)

- ✅ All 5 test users can authenticate successfully
- ✅ Dual-password support implemented (old pattern + TestPass123!)
- ✅ localStorage auth format fixed to match PocketBase client expectations
- ✅ Production PocketBase integration working

**Test Users:**
| User | Email | Password | Wallet |
|------|-------|----------|--------|
| test_buyer | test_buyer@e2e.eggoworld.io | test_buyer_e2e_test_password | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 |
| test_seller | test_seller@e2e.eggoworld.io | test_seller_e2e_test_password | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 |
| test_referrer | test_referrer@e2e.eggoworld.io | test_referrer_e2e_test_password | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC |
| test_admin | test_admin@e2e.eggoworld.io | test_admin_e2e_test_password | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 |
| test_buyer_poor | test_buyer_poor@e2e.eggoworld.io | TestPass123! | 0x269D55A8B686D6E50AB5efb912b024DFFAa58Bc8 |

### 2. PocketBase Test Data (100% Complete)

- ✅ Eggs seeded for test_buyer (token_id: 800001)
- ✅ Animals seeded for test_seller (token_id: 900001)
- ✅ Marketplace listings created (egg + animal)
- ✅ Automated seeding script: `scripts/seed-e2e-test-data.js`

### 3. Test Infrastructure (100% Complete)

- ✅ Docker Compose E2E environment operational
- ✅ Anvil running (BSC testnet fork)
- ✅ Wallet API service running
- ✅ Next.js dev server running
- ✅ All environment variables configured

---

## ⚠️ Remaining Issues (Blockchain Data Gap)

### Test Results

```
Total: 26 tests
✅ Passed: 7 (authentication + helper structure tests)
❌ Failed: 4 (blockchain-dependent journey tests)
⏭️ Skipped: 15 (depend on failed setup tests)
```

### Failed Tests & Root Causes

| Test                   | Failure Reason                          | Root Cause                                |
| ---------------------- | --------------------------------------- | ----------------------------------------- |
| Buy Egg Journey        | Timeout waiting for purchase completion | Needs on-chain NFT minting + USDT balance |
| Feed + Hatch Journey   | eggTokenId is 0 (can't extract)         | Test expects blockchain NFT data          |
| Marketplace Multi-User | Blockchain contract call fails          | Anvil fork doesn't have test NFTs         |
| Referral Commission    | Timeout on purchase flow                | Same as Buy Egg                           |

### The Core Problem

**Anvil is forking BSC testnet**, which means:

1. Contracts are READ-ONLY from the forked state
2. Cannot mint new NFTs or USDT on forked contracts
3. Test users don't have pre-existing on-chain NFTs or USDT balances on the fork

The tests expect:

- ✅ PocketBase records (we have this)
- ❌ Corresponding on-chain NFT ownership (missing)
- ❌ USDT balances for purchases (missing)
- ❌ Marketplace contract interactions (failing)

---

## 🔧 Solutions

### Option A: Deploy Test Contracts on Local Anvil (Recommended)

**Approach:** Stop the forked Anvil, start a fresh local Anvil instance, deploy test contracts, and mint test data.

**Steps:**

1. Modify `docker-compose.e2e.yml` to use local Anvil (remove `--fork-url`)
2. Create Foundry deployment script for test contracts
3. Deploy USDT, EggNFT, AnimalNFT, CommissionDistribution contracts
4. Mint test NFTs and fund USDT balances
5. Update contract addresses in test configuration

**Pros:**

- Full control over blockchain state
- Can mint unlimited test data
- Fast execution (no network calls)
- Reproducible test environment

**Cons:**

- Requires changes to Docker Compose configuration
- Need to write deployment scripts
- Tests won't match production chain exactly

**Estimated Effort:** 2-3 hours

---

### Option B: Mock Blockchain Interactions in Tests

**Approach:** Modify E2E tests to skip or mock blockchain verification steps.

**Steps:**

1. Add `MOCK_BLOCKCHAIN=true` environment variable
2. Modify journey helpers to skip `getOwnerOf()`, `getBalanceOf()` calls
3. Use PocketBase data as source of truth instead of blockchain
4. Add test mode flag to purchase flow

**Pros:**

- Quick to implement
- Tests focus on UI/UX flows
- No blockchain setup needed

**Cons:**

- Doesn't test real blockchain integration
- May miss on-chain bugs
- Not true E2E testing

**Estimated Effort:** 1-2 hours

---

### Option C: Skip Blockchain Tests for Now

**Approach:** Mark blockchain-dependent tests as pending until proper setup is ready.

**Steps:**

1. Add `test.skip()` to blockchain-dependent tests
2. Document the gap in test reports
3. Focus on UI/UX flow tests that are passing

**Pros:**

- Zero effort
- Clear documentation of what's tested vs not

**Cons:**

- Incomplete test coverage
- Delays full E2E validation

**Estimated Effort:** 30 minutes

---

## 📋 Recommended Next Steps

### Immediate (Today)

1. ✅ **COMPLETED:** Fix E2E authentication
2. ✅ **COMPLETED:** Seed PocketBase test data
3. 📝 **TODO:** Document current test status in CI reports
4. 📝 **TODO:** Update milestone v0.4.0 status

### Short-term (This Week)

1. 🔧 Implement Option A (Local Anvil with test contracts)
2. 🧪 Deploy test contracts and mint NFTs
3. ✅ Rerun all journey tests
4. 📊 Document final test results

### Long-term

1. 🔄 Add blockchain setup to CI/CD pipeline
2. 📈 Achieve 100% test coverage for all journey tests
3. 🔒 Add regression tests for blockchain interactions

---

## 📁 Related Files

### Scripts Created

- `scripts/seed-e2e-test-data.js` - Seed PocketBase test data
- `scripts/test-e2e-auth.js` - Verify authentication
- `scripts/setup-anvil-test-data.js` - Blockchain setup (needs Option A implementation)

### Configuration

- `docker-compose.e2e.yml` - E2E environment (needs modification for Option A)
- `.env.e2e.example` - Environment variables template
- `apps/web/lib/auth/e2e-auth.ts` - E2E authentication logic (fixed)

### Tests

- `tests/e2e/playwright-buy-egg-journey.test.ts` - Phase 45
- `tests/e2e/playwright-feed-hatch-journey.test.ts` - Phase 46
- `tests/e2e/playwright-marketplace-multi-user.test.ts` - Phase 47
- `tests/e2e/playwright-referral-commission.test.ts` - Phase 48

---

## 🎯 Key Takeaway

**The authentication barrier is now fully resolved!** All 5 E2E test users can authenticate successfully against production PocketBase.

The remaining 4 test failures are due to **missing blockchain test data on the Anvil fork**, which is a separate infrastructure concern from authentication.

**Recommendation:** Implement Option A (Local Anvil with test contracts) to achieve full E2E test coverage for milestone v0.4.0.

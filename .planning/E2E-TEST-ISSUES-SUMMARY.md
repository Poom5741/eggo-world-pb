# E2E Test Issues Summary - v0.4.0 Milestone

**Date:** 2026-04-29  
**Status:** ❌ BLOCKED - Test Users Missing in Production

---

## 📊 Test Results

**Passed:** 7 tests (helper functions & structure validation)  
**Failed:** 4 tests (core journey tests)  
**Skipped:** 15 tests (require successful authentication)

### Failed Tests

1. ❌ Buy Egg Journey - Full purchase flow
2. ❌ Feed + Hatch Journey - Setup/authentication
3. ❌ Marketplace Multi-User Journey - Setup/authentication
4. ❌ Referral Commission Journey - Purchase flow

---

## 🔍 Root Causes Identified

### 1. Missing `test_buyer_poor` in E2E Auth System ✅ FIXED

- **Issue:** `E2E_TEST_USERS` array only had 4 users, missing `test_buyer_poor`
- **Fix Applied:** Added `test_buyer_poor` to `apps/web/lib/auth/e2e-auth.ts`
- **Status:** ✅ Code fixed

### 2. Test Users Don't Exist in Production PocketBase ❌ BLOCKING

- **Issue:** E2E tests authenticate against production `https://pb.eggoworld.io`
- **Expected Users:**
  - `test_buyer@e2e.eggoworld.io` / `test_buyer_e2e_test_password`
  - `test_seller@e2e.eggoworld.io` / `test_seller_e2e_test_password`
  - `test_referrer@e2e.eggoworld.io` / `test_referrer_e2e_test_password`
  - `test_admin@e2e.eggoworld.io` / `test_admin_e2e_test_password`
  - `test_buyer_poor@e2e.eggoworld.io` / `test_buyer_poor_e2e_test_password`
- **Status:** ❌ Users never created in production

### 3. Local PocketBase Migration Errors ❌ BLOCKING

- **Issue:** Local PocketBase has migration failures preventing test user creation
- **Error:** `no such column: owner`, `no such column: token_id`, etc.
- **Status:** ❌ Database schema incompatible

---

## 🛠️ Fixes Applied

### Code Fixes

1. ✅ Added `test_buyer_poor` to `E2E_TEST_USERS` in `apps/web/lib/auth/e2e-auth.ts`
2. ✅ Added metadata for `test_buyer_poor` in `TEST_USER_METADATA`
3. ✅ Created `scripts/create-e2e-test-users.js` for automated test user setup

### Infrastructure

- ✅ E2E Docker environment configured (wallet-api, anvil, frontend)
- ✅ Next.js dev server running on localhost:3000
- ✅ Anvil RPC running on localhost:8545
- ✅ Wallet API running on localhost:3001

---

## 🚧 Blockers

### BLOCKER 1: Production Test Users Missing

**Impact:** All journey tests fail at authentication step  
**Resolution Required:**

```bash
# Option A: Create users in production PocketBase
ssh root@204.168.144.14
cd /root/eggo-world-pb
# Use PocketBase admin UI or API to create 5 test users

# Option B: Fix local PocketBase migrations
# Debug and fix migration errors in apps/backend/pb_migrations/
```

### BLOCKER 2: Local PocketBase Schema Issues

**Impact:** Cannot create test users locally for testing  
**Resolution Required:**

- Investigate migration `1775399931499_create_egg_nfts.js`
- Fix missing columns: `owner`, `token_id`, `is_hatched`
- Re-run migrations cleanly

---

## 📋 Next Steps (Priority Order)

### Immediate (Unblock Tests)

1. **Create test users in production PocketBase**
   - Access: `https://pb.eggoworld.io/_/` (admin panel)
   - Or use production API with admin credentials
   - Create all 5 users with emails and passwords listed above
   - Set wallet addresses to Anvil test accounts

2. **Verify production PocketBase accessibility**
   - Ensure `https://pb.eggoworld.io` is reachable from local machine
   - Verify admin credentials work

### Short-term (Fix Local Dev)

3. **Debug local PocketBase migrations**
   - Check `apps/backend/pb_migrations/1775399931499_create_egg_nfts.js`
   - Fix schema definition for egg_nfts collection
   - Clear local data and re-run migrations

4. **Update E2E test configuration**
   - Consider using local PocketBase for E2E tests
   - Update `POCKETBASE_URL` in `.env.e2e` to `http://localhost:8090`
   - Ensure all required hooks load correctly

### Long-term (Improve E2E Infrastructure)

5. **Create dedicated E2E PocketBase instance**
   - Separate from production
   - Pre-loaded with test users and test data
   - Can be reset between test runs

6. **Add test data seeding**
   - Create NFT listings, eggs, animals for testing
   - Fund test user wallets with USDT
   - Set up referral chains

---

## 📝 Test User Credentials (Ready to Create)

| Username        | Email                            | Password                          | Wallet Address                             | Role           |
| --------------- | -------------------------------- | --------------------------------- | ------------------------------------------ | -------------- |
| test_buyer      | test_buyer@e2e.eggoworld.io      | test_buyer_e2e_test_password      | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | Buyer          |
| test_seller     | test_seller@e2e.eggoworld.io     | test_seller_e2e_test_password     | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | Seller         |
| test_referrer   | test_referrer@e2e.eggoworld.io   | test_referrer_e2e_test_password   | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | Referrer       |
| test_admin      | test_admin@e2e.eggoworld.io      | test_admin_e2e_test_password      | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | Admin          |
| test_buyer_poor | test_buyer_poor@e2e.eggoworld.io | test_buyer_poor_e2e_test_password | 0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65 | Buyer (0 USDT) |

---

## 🧪 How to Rerun Tests (After Fixing Blockers)

```bash
# 1. Start E2E environment
cd /Users/poom-work/tokenine/eggo-pocketbase
docker-compose -f docker-compose.e2e.yml up -d

# 2. Start Next.js dev server
bun run dev

# 3. Wait for services to be healthy
sleep 10

# 4. Run journey tests
export POCKETBASE_URL=https://pb.eggoworld.io
export WALLET_API_URL=http://localhost:3001
export ANVIL_RPC_URL=http://localhost:8545
export E2E_BASE_URL=http://localhost:3000

bun run test:e2e --grep "Buy Egg Journey|Feed.*Hatch|Marketplace.*Multi-User|Referral Commission" --reporter=list
```

---

## ✅ Code Changes Made

### Files Modified

1. `apps/web/lib/auth/e2e-auth.ts`
   - Added `test_buyer_poor` to `E2E_TEST_USERS` array
   - Added metadata for `test_buyer_poor` in `TEST_USER_METADATA`

2. `tests/fixtures/e2e-setup.ts`
   - No changes needed (already using correct selector)

### Files Created

1. `scripts/create-e2e-test-users.js`
   - Automated script to create/update test users in PocketBase
   - Supports both local and production instances
   - Idempotent (creates or updates as needed)

---

## 📞 Contact/Questions

For questions about this analysis:

- Check STATE.md for pending todos about test user creation
- Review Phase 42 plan for original E2E auth implementation details
- See `.env.e2e.example` for expected environment configuration

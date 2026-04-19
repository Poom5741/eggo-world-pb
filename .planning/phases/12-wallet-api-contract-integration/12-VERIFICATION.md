---
phase: 12-wallet-api-contract-integration
verified: 2026-04-19T10:45:00Z
status: gaps_found
score: 3/4 must-haves verified
re_verification: null
gaps:
  - truth: "User can feed egg with real transaction updating food_count"
    status: partial
    reason: "Missing food_count validation before feeding - egg can be fed beyond max limit"
    artifacts:
      - path: "wallet-api/server.js"
        issue: "feed-egg endpoint doesn't validate foodCount < 10 before sending transaction"
    missing:
      - "Add foodCount check: const currentFoodCount = await eggContract.foodCount(egg_token_id); if (currentFoodCount + food_ids.length > 10) throw error"
      - "Add validation response with EGG_HATCHED error code"
---

# Phase 12: Wallet-API Contract Integration Verification Report

**Phase Goal:** Replace 4 mock blockchain endpoints with real ethers.js contract calls (mint-egg, mint-food, claim-commission, feed-egg)
**Verified:** 2026-04-19T10:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                              | Status     | Evidence                                                                 |
| --- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| 1   | User can mint Egg NFT with real transaction hash   | ✓ VERIFIED | Lines 528-607: Real contract call, 12 confirmations, 20% gas buffer      |
| 2   | User can claim commission with real transaction    | ✓ VERIFIED | Lines 610-694: Balance check, real call, graceful zero-balance handling  |
| 3   | User can mint Food NFT with real transaction       | ✓ VERIFIED | Lines 696-781: Real contract call, 12 confirmations, gas buffer          |
| 4   | User can feed egg with real transaction            | ⚠️ PARTIAL | Lines 784-862: Ownership validated, BUT missing foodCount hatching check |

**Score:** 3/4 truths fully verified, 1 partial

### Required Artifacts

| Artifact                              | Expected                              | Status     | Details                                                                                      |
| ------------------------------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `wallet-api/server.js`                | Real contract calls for all 4 endpoints | ✓ VERIFIED | All 4 endpoints use ethers.js with real contract calls, no mock data                        |
| `wallet-api/utils/dacc-decrypt.js`    | Private key decryption utility        | ✓ VERIFIED | Exists with version detection (v3 XOR, v4 AES-GCM), 19 passing tests                        |
| `contracts/contract-addresses.json`   | Deployed contract addresses           | ✓ VERIFIED | Contains addresses for chain 7117: eggNft, foodNft, commission, usdt, animalNft             |
| Gas estimation with 20% buffer        | All endpoints                         | ✓ VERIFIED | Lines 559, 652, 734, 820: All use `(gasEstimate * BigInt(120)) / BigInt(100)`              |
| 12-block confirmation wait            | All endpoints                         | ✓ VERIFIED | Lines 574, 662, 749, 830: All use `tx.wait(CONFIRMATIONS)` where CONFIRMATIONS=12          |
| Retry logic (3 attempts)              | All endpoints                         | ✓ VERIFIED | Lines 564, 655, 737, 823: All use `withRetry(fn, 3, 1000)` with exponential backoff        |

### Key Link Verification

| From                        | To                                      | Via                         | Status     | Details                                                                                |
| --------------------------- | --------------------------------------- | --------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `server.js` mint-egg        | `EggNFT.mintEgg()`                      | ethers.js Contract          | ✓ WIRED    | Line 565: Real contract call with gas estimation and confirmation wait                |
| `server.js` claim-commission | `CommissionDistribution.claimCommission()` | ethers.js Contract          | ✓ WIRED    | Line 656: Real contract call after balance check                                      |
| `server.js` mint-food       | `FoodNFT.mint()`                        | ethers.js Contract          | ✓ WIRED    | Line 738: Real contract call with quantity validation                                 |
| `server.js` feed-egg        | `EggNFT.feedEgg()`                      | ethers.js Contract          | ✓ WIRED    | Line 824: Real contract call with ownership validation                                |
| `server.js`                 | `dacc-decrypt.js`                       | Inline decrypt function     | ⚠️ PARTIAL | dacc-decrypt.js exists but NOT imported; server.js has its own decryptPrivateKey()    |

### Data-Flow Trace (Level 4)

| Artifact                    | Data Variable | Source                      | Produces Real Data | Status      |
| --------------------------- | ------------- | --------------------------- | ------------------ | ----------- |
| mint-egg endpoint           | `tx.hash`     | `eggContract.mintEgg()`     | ✓ YES              | ✓ FLOWING   |
| claim-commission endpoint   | `tx.hash`     | `commissionContract.claimCommission()` | ✓ YES    | ✓ FLOWING   |
| mint-food endpoint          | `tx.hash`     | `foodContract.mint()`       | ✓ YES              | ✓ FLOWING   |
| feed-egg endpoint           | `tx.hash`     | `eggContract.feedEgg()`     | ✓ YES              | ✓ FLOWING   |

All endpoints return real blockchain transaction hashes from actual contract calls. No mock data detected.

### Behavioral Spot-Checks

| Behavior                                           | Command                                                                 | Result                                                                                                               | Status        |
| -------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------- |
| mint-egg returns real tx hash                      | `grep -n "txHash: tx.hash" wallet-api/server.js` (line 585)             | ✓ Found: Returns actual transaction hash from contract call                                                          | ✓ PASS        |
| claim-commission handles zero balance              | `grep -n "No commission to claim" wallet-api/server.js` (line 646)       | ✓ Found: Returns 400 error with NO_COMMISSION code before sending transaction                                        | ✓ PASS        |
| feed-egg validates ownership                       | `grep -n "ownerOf" wallet-api/server.js` (line 810)                      | ✓ Found: Checks `owner.toLowerCase() !== walletAddress.toLowerCase()` and returns NOT_OWNER error                    | ✓ PASS        |
| All endpoints use 12 confirmations                 | `grep -n "wait(CONFIRMATIONS)" wallet-api/server.js`                    | ✓ Found at lines 574, 662, 749, 830                                                                                  | ✓ PASS        |
| All endpoints use 20% gas buffer                   | `grep -n "BigInt(100 + GAS_BUFFER_PERCENT)" wallet-api/server.js`       | ✓ Found at lines 559, 652, 734, 820                                                                                  | ✓ PASS        |
| All endpoints use retry logic                      | `grep -n "withRetry" wallet-api/server.js`                              | ✓ Found at lines 564, 655, 737, 823 — all 4 endpoints use 3-attempt retry                                            | ✓ PASS        |
| dacc-decrypt tests pass                            | `cd wallet-api && bun test utils/dacc-decrypt.test.js`                  | ✓ 19 pass, 1 skip, 0 fail                                                                                            | ✓ PASS        |
| feed-egg validates foodCount < 10                  | `grep -n "foodCount" wallet-api/server.js`                              | ✗ NOT FOUND — validation missing                                                                                     | ✗ FAIL        |

### Requirements Coverage

| Requirement | Source Plan | Description                                                             | Status     | Evidence                                                                                                                                                      |
| ----------- | ----------- | ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01      | 12-02       | User can mint Egg NFT with real blockchain transaction                | ✓ SATISFIED | Lines 528-607: Real `mintEgg()` call, gas estimation, 12 confirmations, returns real tx hash                                                                 |
| SEC-02      | 12-03       | User can claim referral commission with real blockchain transaction   | ✓ SATISFIED | Lines 610-694: Balance check before tx, real `claimCommission()` call, graceful zero-balance handling                                                        |
| SEC-03      | 12-02       | User can mint Food NFT with real blockchain transaction               | ✓ SATISFIED | Lines 696-781: Real `mint()` call with quantity, gas estimation, 12 confirmations                                                                            |
| SEC-04      | 12-03       | User can feed Egg NFT with real blockchain transaction                | ⚠️ PARTIAL  | Lines 784-862: Ownership validated ✓, BUT missing foodCount validation ❌ (egg can be fed beyond max 10 limit, violating requirement)                        |

### Anti-Patterns Found

| File                             | Line | Pattern                                      | Severity | Impact                                                                                                 |
| -------------------------------- | ---- | -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `wallet-api/server.js`           | 184  | Inline `decryptPrivateKey()` function        | ℹ️ Info   | Utility exists in `wallet-api/utils/dacc-decrypt.js` but not imported; code duplication (harmless)     |
| `wallet-api/server.js`           | 809  | Missing foodCount validation in feed-egg     | ⚠️ Warning | User can feed egg beyond max limit (10), causing contract revert or invalid state                     |
| `wallet-api/server.js`           | 644  | Returns 400 for zero commission              | ℹ️ Info   | Could be more user-friendly with 200 + `{amount: 0, message: "No commission to claim"}`               |

### Human Verification Required

1. **Test mint-egg endpoint with real wallet**
   - **Test:** `curl -X POST http://localhost:3001/api/wallet/mint-egg -H "Content-Type: application/json" -d '{"userId":"USER_ID","wallet":"0x...","eggId":1,"eggNftAddress":"0xb2FE193523A1E6A240141331A80755f5642e7A44"}'`
   - **Expected:** Real transaction hash returned, visible on 0xl3 explorer (Chain ID: 7117)
   - **Why human:** Cannot test without real wallet with funds on testnet

2. **Test feed-egg hatching validation**
   - **Test:** Attempt to feed egg with `food_count >= 10`
   - **Expected:** Should return error "Egg has already hatched" before sending transaction
   - **Why human:** Current implementation doesn't check this — validation MUST be added

3. **Verify transaction confirmations on blockchain**
   - **Test:** Check returned tx hash on 0xl3 explorer
   - **Expected:** Transaction shows 12+ confirmations, success status
   - **Why human:** Cannot programmatically verify on external blockchain explorer

### Gaps Summary

**1 Critical Gap:**

1. **SEC-04 Partial: feed-egg missing foodCount validation**
   - **Requirement:** "Validates egg hasn't hatched yet (food_count < 10)"
   - **Current:** Only validates ownership (`ownerOf`), doesn't check current food count
   - **Impact:** User can attempt to feed egg beyond max limit, causing contract revert (wasted gas) or invalid state
   - **Fix:** Add validation before line 818:
     ```javascript
     const currentFoodCount = await eggContract.foodCount(egg_token_id);
     if (currentFoodCount + food_ids.length > 10) {
         return res.status(400).json({
             success: false,
             error: { message: 'Egg has already hatched', code: 'EGG_HATCHED' }
         });
     }
     ```

**Minor Issues:**

1. **dacc-decrypt.js not imported** — Inline `decryptPrivateKey()` duplicates logic from utility file. Not blocking, but should import for consistency and testability.

---

## Summary

### ✅ Verified (3/4 Requirements)

- **SEC-01 (mint-egg):** Fully implemented with real contract calls, gas buffer, confirmations, retry logic
- **SEC-02 (claim-commission):** Fully implemented with balance check, graceful zero-balance handling
- **SEC-03 (mint-food):** Fully implemented with real contract calls and all safety features

### ⚠️ Partial (1/4 Requirements)

- **SEC-04 (feed-egg):** Ownership validated ✓, BUT missing critical foodCount validation ❌

### Next Steps

1. **Add foodCount validation to feed-egg endpoint** (P0 — blocks SEC-04 completion)
2. **Import dacc-decrypt.js utility** (P2 — code quality, not blocking)

---

_Verified: 2026-04-19T10:45:00Z_
_Verifier: OpenCode (gsd-verifier)_

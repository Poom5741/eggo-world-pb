# Phase 54: Egg Mint Backend Hardening — Plan

**Phase:** 54
**Created:** 2026-05-08
**Status:** Planned
**Requirements:** MINT-01

---

## Overview

Harden the egg mint flow for production reliability. The core error handling (D-01, D-02, D-03) is already implemented — this plan focuses on auditing, verifying, and improving error message clarity.

---

## Wave 1: Audit & Verify

### [P1] TASK-54-01: Audit existing mint hook error handling

**File:** `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`

**Checklist:**

- [ ] Balance check at lines 193-201 returns descriptive error with INSUFFICIENT_BALANCE code
- [ ] Wallet API errors are caught and propagated (lines 245-251)
- [ ] All error responses use `{ success: false, error: { message, code } }` format
- [ ] User not found, wallet not found, auth required all have distinct error codes

**Success criteria:** All error codes present: AUTH_REQUIRED, USER_NOT_FOUND, WALLET_NOT_FOUND, INSUFFICIENT_BALANCE, MINT_FAILED, CONFIG_ERROR

**Accepts:** (none — first task)

---

### [P1] TASK-54-02: Verify wallet-api mint endpoint gas handling

**File:** `wallet-api/server.js` (Mint Egg endpoint, ~line 720)

**Checklist:**

- [ ] `estimateGas()` call is wrapped in try-catch
- [ ] Gas estimation failure returns descriptive error (not generic 500)
- [ ] Error includes code for frontend to identify gas-related failures
- [ ] Gas estimation failure does NOT send transaction (D-02 verified)

**Success criteria:** Gas estimation failures return `{ success: false, error: { message: "...", code: "GAS_ESTIMATION_FAILED" } }`

**Accepts:** TASK-54-01

---

### [P1] TASK-54-03: Verify retry behavior for network errors

**File:** `wallet-api/server.js` (withRetry function, ~line 230)

**Checklist:**

- [ ] `withRetry()` retries up to 3 times
- [ ] Exponential backoff: 1s, 2s, 4s delays
- [ ] Validation errors (INSUFFICIENT_FUNDS, CALL_EXCEPTION, UNPREDICTABLE_GAS_LIMIT, revert) do NOT retry
- [ ] After 3 retries, error is propagated with descriptive message

**Success criteria:** Network/RPC errors retry 3x with backoff; validation errors fail immediately

**Accepts:** TASK-54-02

---

## Wave 2: Improvements

### [P1] TASK-54-04: Add gas estimation error to PB hook

**File:** `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`

**Changes:**

1. Improve error message extraction from wallet-api response
2. Map wallet-api error codes to PB hook error codes
3. Add GAS_ESTIMATION_FAILED and TRANSACTION_REVERTED codes to PB hook response

**Before:** Generic "Contract call failed" for gas errors
**After:** "Gas estimation failed. The transaction may fail. Please try again." with code GAS_ESTIMATION_FAILED

**Accepts:** TASK-54-02

---

### [P2] TASK-54-05: Add network error logging

**File:** `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`

**Changes:**

1. Log wallet-api response statusCode on error
2. Log raw response body for debugging (without exposing sensitive data)
3. Add network error category to error codes: NETWORK_ERROR

**Success criteria:** Failed calls logged with status code and error type

**Accepts:** TASK-54-04

---

## Wave 3: Verification

### [P1] TASK-54-06: Test error scenarios end-to-end

**Test cases:**

| Scenario             | Expected Response Code | Expected Message Pattern               |
| -------------------- | ---------------------- | -------------------------------------- |
| No auth              | AUTH_REQUIRED          | "Authentication required"              |
| No wallet            | WALLET_NOT_FOUND       | "Wallet not found"                     |
| Balance < 25 USDT    | INSUFFICIENT_BALANCE   | "Required: 25 USDT, Available: X USDT" |
| Gas estimation fails | GAS_ESTIMATION_FAILED  | "Gas estimation failed"                |
| Network timeout      | NETWORK_ERROR          | "Network error" or retry message       |
| Contract revert      | TRANSACTION_REVERTED   | "Transaction reverted"                 |

**Accepts:** TASK-54-04, TASK-54-05

---

## Success Criteria (from ROADMAP)

1. [ ] Mint-egg API endpoint returns consistent success response for valid mint requests
2. [ ] Mint-egg API endpoint returns descriptive error for insufficient USDT balance (no failed blockchain tx)
3. [ ] Mint-egg API endpoint returns descriptive error for network/gas failures (no silent failures, no partial state)
4. [ ] Minted egg NFT record is created in database on successful mint
5. [ ] User's USDT balance is correctly deducted after successful mint

---

## Files to Modify

| File                                          | Changes                                                    |
| --------------------------------------------- | ---------------------------------------------------------- |
| `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` | Improve error message mapping, add gas/network error codes |

---

## Notes

**Existing implementation is mostly complete.** Tasks focus on:

1. Verifying existing code works as expected
2. Improving error message clarity
3. Ensuring consistent error code format

No structural changes needed — this is a hardening pass.

---

_Plan created: 2026-05-08_

# Phase 42: Auth Mock + Blockchain Helpers - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 42-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 42-auth-mock-blockchain-helpers
**Areas discussed:** Auth Bypass Strategy, Blockchain Helpers

---

## Auth Bypass Strategy

| Option                  | Description                                                           | Selected |
| ----------------------- | --------------------------------------------------------------------- | -------- |
| Admin API injection     | Use PocketBase admin API to create test user and inject token         |          |
| Test user pre-creation  | Pre-create test users in production DB, use stored auth tokens        |          |
| Browser state injection | Inject auth state directly via Playwright page.evaluate()             |          |
| Frontend E2E button     | Create user for each test scenario, add button on frontend auth pages | ✓        |

**User's choice:** Frontend E2E login button
**Notes:** User wanted to create test users for each scenario, add a button on frontend auth pages that E2E tests can click to get authenticated credentials.

---

## Button Trigger

| Option               | Description                                                                    | Selected |
| -------------------- | ------------------------------------------------------------------------------ | -------- |
| Query param trigger  | E2E tests navigate with ?e2e_test_user=username param, frontend shows button   | ✓        |
| localStorage trigger | Playwright injects e2e_test_mode=true into localStorage, frontend shows button |          |
| DOM injection        | Playwright injects button DOM directly into page, no frontend code needed      |          |

**User's choice:** Query param trigger
**Notes:** Tests navigate with query param like `?e2e_test_user=test_buyer`, frontend shows E2E login button for that user.

---

## Test Users

| Option           | Description                                                 | Selected |
| ---------------- | ----------------------------------------------------------- | -------- |
| Predefined users | 4 users: test_buyer, test_seller, test_referrer, test_admin | ✓        |
| Dynamic creation | Create user dynamically via admin API when test runs        |          |
| Single user      | Single test_user account, tests share same user             |          |

**User's choice:** Predefined users (4 users)
**Notes:** 4 test users for different E2E scenarios - buyer, seller, referrer, admin.

---

## Transaction Polling (BLOCK-01)

| Option                    | Description                                                         | Selected |
| ------------------------- | ------------------------------------------------------------------- | -------- |
| ethers.waitForTransaction | Use ethers.js provider.waitForTransaction() with confirmation count | ✓        |
| Custom polling            | Implement custom polling loop with timeout and progress logging     |          |
| PocketBase polling        | Poll PocketBase for record updates instead of blockchain RPC        |          |

**User's choice:** ethers.waitForTransaction
**Notes:** Built-in ethers.js method with confirmation count handling.

---

## Event Parsing (BLOCK-02)

| Option             | Description                                                    | Selected |
| ------------------ | -------------------------------------------------------------- | -------- |
| ethers.parseLog    | Use ethers.js contract.interface.parseLog() with existing ABIs | ✓        |
| Custom parser      | Implement custom parser for Transfer/NFTSold/AnimalBred events |          |
| Receipt log filter | Filter receipt logs by topic hash, parse raw data              |          |

**User's choice:** ethers.parseLog
**Notes:** Uses existing ABIs from wallet-api/server.js.

---

## On-chain Verification (BLOCK-03)

| Option                | Description                                                     | Selected |
| --------------------- | --------------------------------------------------------------- | -------- |
| ethers contract calls | Use ethers.js contract.ownerOf() and contract.balanceOf() calls | ✓        |
| Direct RPC calls      | Call eth_call RPC directly without library                      |          |
| PocketBase sync       | Check PocketBase record ownership (synced from blockchain)      |          |

**User's choice:** ethers contract calls
**Notes:** Standard ethers.js contract calls for ownership verification.

---

## Claude's Discretion

- Confirmation count configuration per test
- Polling timeout per transaction type
- Event helper return type structure

---

## Deferred Ideas

- VRF mock coordinator for hatch randomness
- Real LINE OAuth smoke test (AUTH-03)
- Test user dynamic creation via admin API
- Gas sponsorship balance verification (Phase 43)

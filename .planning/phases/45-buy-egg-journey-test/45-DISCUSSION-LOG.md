# Phase 45: Buy Egg Journey Test - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 45-buy-egg-journey-test
**Areas discussed:** Test scope & coverage, Test data setup, Verification depth, Error scenarios

---

## Test Scope & Coverage

| Option                | Description                                                                                                          | Selected |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Full journey          | E2E login → marketplace browse → buy button → wait for tx → verify NFT appears in /eggs page. Standard user journey. | ✓        |
| API-shortened journey | E2E login → buy egg via API call → verify NFT appears. Skips marketplace browsing UI for speed.                      |          |
| Comprehensive journey | E2E login → marketplace browse → buy → verify, PLUS: balance check before/after, transaction details, event parsing. |          |

**User's choice:** Full journey (Recommended)
**Notes:** Matches the phase goal "auth → buy → NFT appears". Standard user journey pattern.

---

### Assertions

| Option                      | Description                                                       | Selected |
| --------------------------- | ----------------------------------------------------------------- | -------- |
| NFT visible in /eggs        | User sees egg card on /eggs page after purchase (UI verification) | ✓        |
| On-chain ownership verified | Verify on-chain ownership via ownerOf() after tx confirms         |          |
| PocketBase record synced    | PocketBase record exists with correct owner_id                    |          |
| Balance decreased           | User's USDT balance decreased by purchase price                   |          |

**User's choice:** NFT visible in /eggs (Recommended)
**Notes:** UI-first approach for initial assertion selection. Triple verification decision later adds depth.

---

## Test Data Setup

| Option               | Description                                                                                                | Selected |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Pre-created listings | Pre-create eggs in PocketBase with listings before test runs. Simpler, deterministic, no API setup needed. |          |
| Dynamic minting      | Use wallet-api to mint and list eggs dynamically in test setup. More realistic but slower.                 |          |
| Hybrid approach      | Mix: pre-create base listings, dynamic mint for edge cases.                                                | ✓        |

**User's choice:** Hybrid approach
**Notes:** Flexibility for different test scenarios.

---

### Hybrid Configuration

| Option                    | Description                                                                                            | Selected |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| Pre-created + error cases | 1-2 pre-created listings for main journey test, dynamic mint for error scenarios (already owned, etc.) |          |
| Rarity variety + dynamic  | Pre-create multiple eggs with different rarities/prices, dynamic mint for breed-specific scenarios     |          |
| Pre-created dominant      | All standard tests use pre-created, only commission/tier tests use dynamic later phases                | ✓        |

**User's choice:** Pre-created dominant (Recommended)
**Notes:** Main journey uses pre-created listings for deterministic testing. Error scenarios use dynamic as needed.

---

## Verification Depth

| Option                    | Description                                                                                            | Selected |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| UI-only                   | Check NFT appears on /eggs page after UI refresh. Matches selected assertions, simpler implementation. |          |
| UI + on-chain cross-check | UI check + verify on-chain ownerOf matches test_buyer. Cross-check both for confidence.                |          |
| Triple verification       | UI + on-chain + PocketBase record check. Most thorough but slower test execution.                      | ✓        |

**User's choice:** Triple verification
**Notes:** Thorough approach — verifies UI experience, blockchain truth, and app sync. Gives confidence in complete flow.

---

## Error Scenarios

| Option                     | Description                                                                                     | Selected |
| -------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Insufficient balance       | Test user with 0 USDT cannot buy egg. Verify error toast appears.                               | ✓        |
| Already sold/out-of-stock  | Buying an egg that was already purchased by another user. Verify "no longer available" message. |          |
| Marketplace paused         | Buying when marketplace contract is paused. Verify pause error handling.                        |          |
| Network timeout (optional) | Verify timeout handling when tx takes too long. Optional for this phase.                        |          |

**User's choice:** Insufficient balance only
**Notes:** Focused approach — one error scenario for Phase 45. Other errors deferred to Phase 47 (Marketplace Journey).

---

### Insufficient Balance Setup

| Option                    | Description                                                                              | Selected |
| ------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Separate test user        | Create a test user with 0 USDT balance for this specific test. Cleaner separation.       | ✓        |
| Modify test_buyer balance | Empty test_buyer's balance before this test, restore after. Shared test user approach.   |          |
| Mock balance check        | Mock the balance check via frontend/API to simulate 0 balance without actually draining. |          |

**User's choice:** Separate test user (Recommended)
**Notes:** Dedicated `test_buyer_poor` user keeps test scenarios isolated. No balance manipulation needed.

---

## Claude's Discretion

- Exact timeout values for UI wait states
- Retry count for flaky transaction checks
- Test file location (tests/e2e/playwright-buy-egg-journey.test.ts)
- Pre-created listing IDs/configurations

## Deferred Ideas

- Feed + hatch journey tests → Phase 46
- Marketplace multi-user tests (seller → buyer flow) → Phase 47
- Referral commission tests → Phase 48
- "Already sold" error scenario → Phase 47 (Marketplace Journey)
- "Marketplace paused" error scenario → Phase 47
- Network timeout retry logic → future maintenance
- VRF mock coordinator setup → deferred until hatch testing needs randomness

---

_Discussion completed: 2026-04-28_

# Phase 46: Feed + Hatch Journey Test - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 46-feed-hatch-journey-test
**Areas discussed:** Test scope & coverage, Feed mechanics, Hatch verification depth, Error scenarios

---

## Test Scope & Coverage

| Option             | Description                                                                                     | Selected |
| ------------------ | ----------------------------------------------------------------------------------------------- | -------- |
| Full journey       | Buy food → navigate eggs → select egg → feed 10x → hatch → verify animal. Full user experience. | ✓        |
| Split feed + hatch | Feed only (buy food + feed to 10/10), hatch in separate test. Modular approach.                 |          |
| API-shortened      | API-based feed calls, skip UI navigation. Faster but less realistic.                            |          |

**User's choice:** Full journey (Recommended)

---

## Feed Mechanics

| Option            | Description                                                                                      | Selected |
| ----------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Batch feed        | Single feed action that uses all 10 foods at once. Simpler, faster test execution.               | ✓        |
| Individual feeds  | 10 individual feed clicks, tracking progress from 0/10 → 10/10. Full user experience but slower. |          |
| API feed shortcut | API call to feed endpoint, bypass UI. For testing hatch flow only, not feed UI.                  |          |

**User's choice:** Batch feed (Recommended)

---

## Hatch Verification Depth

| Option              | Description                                                                                                                          | Selected |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Triple verification | UI: Animal appears on /animals page. On-chain: ownerOf matches user. PocketBase: animals record exists. Same as Phase 45/47 pattern. | ✓        |
| UI-only             | UI check only. Animal visible on /animals page after hatch.                                                                          |          |
| Backend-only        | On-chain + PocketBase only, skip UI. For backend-focused testing.                                                                    |          |

**User's choice:** Triple verification (Recommended)

---

## Error Scenarios

| Option                 | Description                                                                | Selected |
| ---------------------- | -------------------------------------------------------------------------- | -------- |
| No food available      | User with no food items cannot feed egg. Verify error message appears.     | ✓        |
| Egg already hatched    | Egg already hatched, cannot feed again. Verify "already hatched" error.    |          |
| VRF timeout (optional) | Hatch fails due to VRF randomness timeout. Verify retry or error handling. |          |

**User's choice:** No food available only

---

## Food Setup Approach (Clarification)

| Option               | Description                                                                                 | Selected |
| -------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Pre-created food     | Pre-create food NFTs in PocketBase for test_buyer. Simpler, no marketplace purchase needed. |          |
| Marketplace purchase | Buy food from marketplace in test setup, then feed. Full user flow simulation.              | ✓        |
| Dynamic minting      | Mint food directly via wallet-api for test user. Backend approach.                          |          |

**User's choice:** Marketplace purchase

---

## Summary

| Area            | Decision                                            |
| --------------- | --------------------------------------------------- |
| Test scope      | Full journey (buy food → feed 10x → hatch → verify) |
| Feed mechanics  | Batch feed (single action uses all 10 foods)        |
| Verification    | Triple verification (UI + on-chain + PocketBase)    |
| Error scenarios | No food available only                              |
| Food setup      | Marketplace purchase (full user flow)               |

---

_Phase: 46-feed-hatch-journey-test_
_Discussion date: 2026-04-28_

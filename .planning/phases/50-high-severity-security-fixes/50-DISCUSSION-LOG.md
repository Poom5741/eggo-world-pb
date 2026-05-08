# Phase 50: High-Severity Security Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 50-high-severity-security-fixes
**Areas discussed:** Self-referral prevention, Randomness (VRF), Mint price mutability, Validation & access control

---

## Self-referral prevention approach

| Option                        | Description                                                                                                                   | Selected |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| Address check only            | Simple address check: require(referrer != msg.sender). Fast, minimal gas overhead. Recommended for MVP.                       | ✓        |
| Address + Egg ownership check | Address check + require(referrer owns >= 1 Egg NFT). Prevents fake accounts, adds gas cost and dependency on EggNFT contract. |          |

**User's choice:** Address check only (Recommended)
**Notes:** User selected MVP approach — address-only check without Egg ownership requirement. Decision applied to all mint/breed flows (mintEgg, mintFood, breedAnimals).

---

## Randomness improvement (VRF)

| Option                         | Description                                                                                                                                                | Selected |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Extend hatchEgg pattern        | Extend the existing hatchEgg VRF pattern (requestId → callback → claim) to breeding and food. Reuses working code, consistent security model. Recommended. | ✓        |
| Full Chainlink VRF integration | Integrate Chainlink VRF v2.5 for production-grade randomness. Higher gas cost, requires LINK tokens, needs Chainlink infrastructure setup.                 |          |

**User's choice:** Extend hatchEgg pattern (Recommended)
**Notes:** User chose to extend existing VRF pattern to both breeding AND food type assignment (not breeding only). Decision: reuse working infrastructure, no Chainlink v2.5 integration.

---

## Mint price mutability

| Option                   | Description                                                                                                                  | Selected |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Make mutable with bounds | Convert to mutable uint256 with bounds (1-1000 USDT). Owner can adjust prices for market conditions. Adds admin flexibility. | ✓        |
| Remove setter            | Remove setMintPrice entirely. Price is immutable by design — simpler, more trustworthy for users. Recommended.               |          |

**User's choice:** Make mutable with bounds
**Notes:** User chose flexibility over simplicity. Bounds set to 1-1000 USDT (1e18 - 1000e18 wei), covering current 25 USDT price with wide range for future adjustments.

---

## Validation & access control

| Option                        | Description                                                                                                    | Selected |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Add food check                | Add require(props.food_count >= MAX_FOOD_COUNT) to hatchBreedingEgg. Consistent with normal egg hatching.      | ✓        |
| Prevent duplicate VRF         | Add require(tokenToRequestId[tokenId] == 0) to hatchEgg. Prevents duplicate VRF requests.                      | ✓        |
| Handle transfer during VRF    | In \_update, if egg has pending VRF request, either revert transfer or clear VRF state. Prevents exploitation. | ✓        |
| Restrict distributeCommission | Remove owner from authorized callers in distributeCommission. Only NFT contracts can distribute.               | ✓        |

**User's choice:** All 4 fixes
**Notes:** User initially selected only "Add food check" but confirmed all 4 fixes after clarification. All 4 validation/access control issues (SEC-10, SEC-11, SEC-12, SEC-13) will be addressed.

---

## Deferred Ideas

None — discussion stayed within phase scope.

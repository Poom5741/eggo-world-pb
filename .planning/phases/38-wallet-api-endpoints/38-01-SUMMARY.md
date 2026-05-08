---
phase: 38-wallet-api-endpoints
plan: 01
subsystem: api
tags: [express, ethers-v6, vrf, recruitment-bonus, food-nft, usdt, relayer-wallet]

# Dependency graph
requires:
  - phase: 37-smart-contract-updates
    provides: VRF hatching functions (hatchEgg, claimHatch), pendingHatches view on EggNFT contract
  - phase: 33-recruitment-bonus-usdt
    provides: PocketBase hook calling claim-recruitment-bonus with tier/food_count/usdt_bonus
  - phase: 34-vrf-integration
    provides: PocketBase hooks calling hatch-egg-vrf and check-vrf-fulfillment

provides:
  - POST /api/v1/wallet/claim-recruitment-bonus endpoint (mint food NFTs + USDT transfer via relayer)
  - POST /api/v1/wallet/hatch-egg-vrf endpoint (VRF randomness request, user-signs tx)
  - POST /api/v1/wallet/check-vrf-fulfillment endpoint (poll VRF status + claim hatch)
  - Gas sponsorship logging for relayer-paid operations

affects: [phase-38, phase-39, phase-40]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Relayer wallet gas sponsorship for food mint + USDT transfer (claim-recruitment-bonus)
    - User wallet signing for VRF requests (hatch-egg-vrf, check-vrf-fulfillment)
    - VRF two-phase pattern: request (hatchEgg) → poll (pendingHatches) → claim (claimHatch)
    - 12-block confirmation wait on all state-changing transactions
    - 20% gas buffer via BigInt arithmetic

key-files:
  created: []
  modified:
    - wallet-api/server.js

key-decisions:
  - "Relayer wallet used for claim-recruitment-bonus (food mint + USDT transfer) to subsidize user gas"
  - "User's own wallet signs VRF hatch and claim transactions (user pays gas for randomness)"
  - "check-vrf-fulfillment gracefully returns vrf_pending when VRF not ready (200 OK, not error)"
  - "VRF requestId extracted from VRFRequested event log after hatchEgg transaction"

patterns-established:
  - "VRF two-phase: request → wait for fulfillment → claim"
  - "Event log parsing to extract requestId and animalTokenId from transaction receipts"
  - "Relayer wallet pattern: check relayerWallet existence before gas-sponsored operations"

requirements-completed: [RECRUIT-01, VRF-01]

# Metrics
duration: 6min
completed: 2026-04-25
---

# Phase 38 Plan 01: Recruitment Bonus & VRF Hatching Summary

**3 wallet-api endpoints for recruitment bonus claims and VRF-based egg hatching**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-25T06:14:38Z
- **Completed:** 2026-04-25T06:20:59Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `POST /api/v1/wallet/claim-recruitment-bonus` — Mints food NFTs (via relayer wallet) + transfers USDT bonus, validates tier 1-4, returns both tx hashes with 12-block confirmation
- `POST /api/v1/wallet/hatch-egg-vrf` — Initiates VRF randomness request using user's wallet (user pays gas), verifies egg ownership via ownerOf(), extracts requestId from VRFRequested event
- `POST /api/v1/wallet/check-vrf-fulfillment` — Polls VRF status via getEggProperties, attempts claimHatch when user_id provided, returns vrf_pending when VRF not yet fulfilled

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement claim-recruitment-bonus endpoint** — `5e92ad1` (feat)
2. **Task 2: Implement hatch-egg-vrf and check-vrf-fulfillment endpoints** — `5e92ad1` (feat)

**Note:** All Plan 38-01 and 38-02 tasks committed in a single atomic commit since all changes are in one file (`wallet-api/server.js`). Per-task changes were51 applied sequentially before the single commit.

## Files Created/Modified

- `wallet-api/server.js` — 3 new endpoints (lines 1700-2057)

## Decisions Made

- Used relayer wallet for food mint + USDT transfer to minimize user gas costs for recruitment bonus
- User wallet signs VRF hatch/claim transactions since VRF requires the egg owner as msg.sender
- check-vrf-fulfillment returns friendly 200 OK with status "vrf_pending" rather than error when VRF not ready
- getEggProperties wrapped in try/catch to gracefully handle pre-Phase 37 contracts that lack this view function

## Deviations from Plan

None — plan executed exactly as written. The `_request_id` unused variable from the34 plan's body destructuring was correctly omitted in the implementation.

## Issues Encountered

None

## User Setup Required

None — no external service configuration required. Endpoints use existing CONTRACT_ADDRESSES, RPC_URL, RELAYER_PRIVATE_KEY, and WALLET_MASTER_KEY environment variables.

## Next Phase Readiness

- Endpoints ready for Phases 39 (collection schema updates) and 40 (frontend components)
- Requires Phase 37 contracts to be deployed for full end-to-end functionality (hatchEgg, claimHatch, pendingHatches on EggNFT)

---

_Phase: 38-wallet-api-endpoints_
_Plan: 01_
_Completed: 2026-04-25_

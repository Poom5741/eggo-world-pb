---
phase: 38-wallet-api-endpoints
plan: 02
subsystem: api
tags:
  [
    express,
    ethers-v6,
    admin-config,
    platform-fee,
    rarity-weights,
    breed-cooldown,
    species,
    kyc,
    burn-nft,
    game-config,
  ]

# Dependency graph
requires:
  - phase: 37-smart-contract-updates
    provides: Admin setters (setPlatformFee, setBreedCooldown, updateRarityWeights, addNewSpecies, setKYCRequired, burnNFT) and view functions on EggNFT contract
  - phase: 35-admin-game-config
    provides: PocketBase hook calling admin setter endpoints and game-config reader
  - phase: 36-nft-burn-kyc
    provides: PocketBase hooks calling burn-nft and set-kyc-required

provides:
  - POST /api/v1/wallet/admin/set-platform-fee (validates 0-2000 bps, admin-signed tx)
  - POST /api/v1/wallet/admin/set-breed-cooldown (validates 3600-604800s, admin-signed tx)
  - POST /api/v1/wallet/admin/update-rarity-weights (validates sum=10000, admin-signed tx)
  - POST /api/v1/wallet/admin/add-species (admin-signed tx with species_id, name, weight)
  - POST /api/v1/wallet/admin/set-kyc-required (toggles KYC boolean, admin-signed tx)
  - POST /api/v1/wallet/burn-nft (ownership verification + admin-signed burn tx)
  - GET /api/v1/wallet/game-config (parallel read of 8 config values from chain)

affects: [phase-38, phase-39, phase-40]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getEggNFTConfigContract() helper for admin operations with extended ABI
    - ADMIN_PRIVATE_KEY required for all admin endpoints (onlyOwner on contract side)
    - Input range validation before contract call (fee 0-2000, cooldown 3600-604800, weights sum 10000)
    - View function parallel reads via Promise.all for game-config
    - Ownership verification (ownerOf) before NFT burn

key-files:
  created: []
  modified:
    - wallet-api/server.js

key-decisions:
  - "Admin endpoints use ADMIN_PRIVATE_KEY for signing (following existing Phase 29 pattern)"
  - "burn-nft maps nft_type strings ('egg'/'animal') to8 uint8 enums (0/1) for contract call"
  - "Food NFTs redirected to separate burn-food endpoint rather than handled in burn-nft"
  - "game-config uses Promise.all for parallel reads (8 values) to minimize RPC round trips"
  - "getEggNFTConfigContract() created as separate helper to avoid bloating existing getEggNFTContract()"

patterns-established:
  - "Admin config setter pattern: validate input range → estimateGas with 20% buffer → execute tx → wait 12 blocks → return tx hash"
  - "NFT burn pattern: validate type → verify ownership for animals → admin-signed burn tx"
  - "Game config reader: single provider → parallel Promise.all of 8 view functions → map to Number/formatUnits"

requirements-completed: [ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, BURN-01, KYC-01]

# Metrics
duration: included in Plan 01
completed: 2026-04-25
---

# Phase 38 Plan 02: Admin Config & Game Config Summary

**7 wallet-api endpoints for admin configuration setters, NFT burning, and game config reading**

## Performance

- **Duration:** Included in Plan 38-01 timing (all changes committed in single atomic commit)
- **Started:** 2026-04-25T06:14:38Z
- **Completed:** 2026-04-25T06:20:59Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- 4 admin config setters using ADMIN_PRIVATE_KEY: set-platform-fee (0-2000 bps), set-breed-cooldown (3600-604800s), update-rarity-weights (must sum to 10000), add-species (speciesId + name + weight)
- Admin KYC toggle: `POST /api/v1/wallet/admin/set-kyc-required` — sets kyc_required boolean on-chain
- NFT burning: `POST /api/v1/wallet/burn-nft` — maps type string to enum, verifies ownership for animal burns, admin-signs tx
- Game config reader: `GET /api/v1/wallet/game-config` — reads 8 config values in parallel (platformFee, breedCooldown, rarityWeights, kycRequired, paused, MINT_PRICE, MAX_FOOD_COUNT, MAX_UPGRADE_FOOD)

## Task Commits

1. **Task 1: Implement 4 admin config setter endpoints** — `5e92ad1` (feat)
2. **Task 2: Implement burn-nft, set-kyc-required, and game-config endpoints** — `5e92ad1` (feat)

**Note:** See Plan 38-01 task commits note.

## Files Created/Modified

- `wallet-api/server.js` — 7 new endpoints (lines 2176-2700), getEggNFTConfigContract() helper function

## Decisions Made

- Created `getEggNFTConfigContract()` as a separate helper function with extended ABI to avoid modifying the existing `getEggNFTContract()` used by Phase 29
- burn-nft maps string type names to uint8 enums (egg=0, animal=1); food NFTs rejected with redirect to burn-food endpoint
- game-config uses Promise.all for 8 parallel RPC reads — all values are BigInts, mapped to Number/ethers.formatUnits for JSON response
- All admin endpoints return `transaction_hash` and `block_number` for on-chain auditability

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None — all admin endpoints use existing ADMIN_PRIVATE_KEY environment variable. No new env vars needed.

## Next Phase Readiness

- All 7 endpoints ready for PocketBase hook integration in Phase 39 (collection schema updates)
- Requires Phase 37 contracts deployed with new setters (setPlatformFee, setBreedCooldown, etc.) for full functionality

---

_Phase: 38-wallet-api-endpoints_
_Plan: 02_
_Completed: 2026-04-25_

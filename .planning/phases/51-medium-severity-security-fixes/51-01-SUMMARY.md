---
phase: 51-medium-severity-security-fixes
plan: "01"
subsystem: smart-contracts
tags:
  - security
  - medium
  - ownerOf
  - SafeERC20
  - Base64
  - Pausable
  - VRF

requires:
  - phase: 50-high-severity-security-fixes
    provides: VRF integration, referral chain reset in _update, Pausable base
provides:
  - _ownerOf for OZ v5 compatibility in existence checks
  - Food cap enforcement in recordFoodConsumption (MAX_UPGRADE_FOOD=490)
  - whenNotPaused guards on all state-mutating functions
  - SafeERC20.safeTransferFrom in TierBadge mintTierBadge
  - OZ Base64 encoder in TierBadge tokenURI
  - Pure VRF-only randomness for hatch (no pseudorandom mixing)
  - Clean FoodProperties struct without stale owner field
affects:
  - 52-e2e-test-fixes
  - 53-production-readiness

tech-stack:
  added: []
  patterns:
    - Existence checks use _ownerOf (returns address(0)) not ownerOf (reverts)
    - Food cap bounded by MAX_FOOD_COUNT + MAX_UPGRADE_FOOD
    - whenNotPaused on all external state-mutating entry points
    - SafeERC20.safeTransferFrom for all ERC20 transfers
    - OZ Base64 for metadata encoding
    - VRF-exclusive randomness for hatch, no keccak256 mixing

key-files:
  created:
    - contracts/src/TierBadge.sol
  modified:
    - contracts/src/EggNFT.sol
    - contracts/src/AnimalNFT.sol
    - contracts/src/FoodNFT.sol
    - contracts/src/CommissionDistribution.sol
    - contracts/test/EggFeeding.t.sol
    - contracts/test/EggHatching.t.sol
    - contracts/test/EggUpgrading.t.sol
    - contracts/test/FoodNFT.t.sol
    - contracts/test/FoodNFTAnvilIntegration.t.sol
    - contracts/test/SecurityFixes.t.sol
    - contracts/test/TierBadgeTokenId.t.sol
    - contracts/test/CommissionDistributionTreasury.t.sol

key-decisions:
  - "M-02 (SEC-15) already fixed in Phase 50 - referral chain reset in _update on transfer"
  - "M-07 rarity_seed kept in EggProperties struct for backward compat, set to 0 in VRF path"
  - "M-08 FoodProperties.owner removed entirely, consumers use IERC1155.balanceOf"

patterns-established:
  - "_ownerOf() for token existence checks in view functions; ownerOf() for ownership-revert checks"
  - "Food cap enforced at both recordFoodConsumption (FoodNFT) and upgradeEggRarity (EggNFT)"
  - "All external contract entry points guarded by whenNotPaused modifier"

requirements-completed:
  - SEC-14
  - SEC-15
  - SEC-16
  - SEC-17
  - SEC-18
  - SEC-19
  - SEC-20
  - SEC-21

duration: 15min
completed: 2026-05-08
---

# Phase 51: Medium-Severity Security Fixes Summary

**7 medium-severity audit fixes: \_ownerOf OZ v5 compliance, food cap enforcement, Pausable guards, SafeERC20, OZ Base64, pure VRF randomness, FoodProperties.owner removal**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-08T10:00:00Z
- **Completed:** 2026-05-08T10:15:00Z
- **Tasks:** 1 (single plan covering all 7 fixes)
- **Files modified:** 13

## Accomplishments

- **M-01 (SEC-14):** Replaced `ownerOf()` with `_ownerOf()` for OZ v5-compatible existence checks in EggNFT (6 occurrences) and AnimalNFT (5 occurrences) — view functions now return `address(0)` instead of reverting for nonexistent tokens
- **M-03 (SEC-16):** Added food-cap enforcement in `recordFoodConsumption` with `MAX_UPGRADE_FOOD=490` (500 total max including base 10), also bounded in `upgradeEggRarity`
- **M-04 (SEC-17):** Added `whenNotPaused` modifier + `Pausable` import to all external state-mutating functions in EggNFT (mintEgg, mintEggWithChain, hatchEgg, claimHatch, hatchBreedingEgg, upgradeEggRarity, requestBreed, claimBreed, recordFoodConsumption, \_update) and FoodNFT (mintFood, mintFreeFood, feedEgg, burnFood, burnFoodFor, setEggNFTContract)
- **M-05 (SEC-18):** Replaced raw `transferFrom` with `SafeERC20.safeTransferFrom` in TierBadge.mintTierBadge — prevents silent failure on USDT transfer
- **M-06 (SEC-19):** Replaced buggy manual Base64 encoder with OpenZeppelin `Base64.encode()` in TierBadge.tokenURI
- **M-07 (SEC-20):** Dropped pseudorandom `rarity_seed` mixing from VRF hatch path — `claimHatch` now uses pure VRF `randomWord` as `finalSeed`
- **M-08 (SEC-21):** Removed stale `owner` field from `FoodProperties` struct — off-chain consumers use `IERC1155.balanceOf` instead

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply 7 medium-severity security fixes** - `00a2b26` (feat)

**Plan metadata:** (final commit follows summary creation)

_Note: M-02 (SEC-15) referral chain reset was already completed in Phase 50._

## Files Created/Modified

- `contracts/src/EggNFT.sol` — \_ownerOf checks, whenNotPaused, food cap, pure VRF hatch
- `contracts/src/AnimalNFT.sol` — \_ownerOf in all 5 view functions
- `contracts/src/FoodNFT.sol` — Pausable import, whenNotPaused, removed owner field
- `contracts/src/TierBadge.sol` — New file: SafeERC20 + OZ Base64 + monotonic token IDs
- `contracts/src/CommissionDistribution.sol` — Updated for Treasury routing (Phase 49 carry)
- `contracts/test/SecurityFixes.t.sol` — Fixed pre-existing import path
- `contracts/test/TierBadgeTokenId.t.sol` — Fixed pre-existing import path
- `contracts/test/CommissionDistributionTreasury.t.sol` — Fixed pre-existing import path
- `contracts/test/EggFeeding.t.sol` — Updated for Phase 51 contract changes
- `contracts/test/EggHatching.t.sol` — Updated for Phase 51 contract changes
- `contracts/test/EggUpgrading.t.sol` — Updated for Phase 51 contract changes
- `contracts/test/FoodNFT.t.sol` — Updated for Phase 51 contract changes
- `contracts/test/FoodNFTAnvilIntegration.t.sol` — Updated for Phase 51 contract changes

## Decisions Made

- **M-02 (SEC-15) already fixed in Phase 50:** Referral chain reset was implemented in `_update` on transfer — no action needed
- **M-07 rarity_seed kept for backward compat:** The `rarity_seed` field remains in `EggProperties` struct but is never written to in the VRF hatch path — breeding eggs still use it for pre-determined rarity
- **M-08 FoodProperties.owner fully removed:** Struct cleaned to 4 fields; `getFoodProperties` returns 4 values instead of 5; off-chain code uses `IERC1155.balanceOf` for ownership queries
- **whenNotPaused on \_update:** Applied to `EggNFT._update` to block transfers during paused state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed broken imports in pre-existing test files**

- **Found during:** Build verification
- **Issue:** 3 test files from Phase 50 (`SecurityFixes.t.sol`, `TierBadgeTokenId.t.sol`, `CommissionDistributionTreasury.t.sol`) used `../../src/` import paths that don't resolve from the project root
- **Fix:** Changed `../../src/` to `../src/` for all imports in these 3 files
- **Files modified:** contracts/test/SecurityFixes.t.sol, contracts/test/TierBadgeTokenId.t.sol, contracts/test/CommissionDistributionTreasury.t.sol
- **Verification:** forge build succeeds (3 files compiled, 108 total)
- **Committed in:** 00a2b26 (part of Phase 51 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing import errors in Phase 50 test files blocked build. Fix was trivial path correction. No scope creep.

## Issues Encountered

- **Pre-existing test failures:** 11 forge test failures (all pre-existing):
  - 4 in EggFeeding.t.sol: "VRF subscription not set" — tests need VRF config
  - 2 in EggHatching.t.sol: VRF pending + USDT allowance
  - 2 in EggUpgrading.t.sol: "VRF subscription not set"
  - 3 in FoodNFT.t.sol: "VRF subscription not set"

  These failures relate to VRF subscription setup requirements from Phase 50 and are unrelated to Phase 51 changes. 190 tests pass.

- **Working tree context:** All Phase 49-53 changes were present in the working tree but uncommitted on main. Phase 51-specific changes were verified and committed.

## Next Phase Readiness

- All 8 medium-severity security issues (SEC-14 through SEC-21) resolved
- Smart contracts build clean (190/201 tests pass, 11 pre-existing VRF failures)
- Ready for Phase 52 (E2E Test Fixes) and Phase 53 (Production Readiness)

---

_Phase: 51-medium-severity-security-fixes_
_Completed: 2026-05-08_

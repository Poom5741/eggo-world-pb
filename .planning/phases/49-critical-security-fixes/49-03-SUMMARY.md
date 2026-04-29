---
phase: 49-critical-security-fixes
plan: 03
subsystem: smart-contracts
tags: [solidity, usdt, treasury, commission, security]

dependency-graph:
  requires:
    - phase: 49-critical-security-fixes
      provides: "SEC-03, SEC-04 requirements, CommissionDistribution contract"
  provides:
    - "USDT-only commission distribution with treasury routing"
    - "Treasury address validation and 46% allocation"
    - "Owner-only withdrawTreasury() function"
    - "ETH payout functions removed (claimCommission, withdrawCoinStor)"
  affects:
    - deployment scripts
    - frontend integration
    - phase-50-owner-controls

tech-stack:
  added: []
  patterns:
    - "Treasury routing via commissionBalances mapping"
    - "USDT-only payouts via SafeERC20.safeTransfer"
    - "Constructor validation for critical addresses"
    - "ETH rejection via receive() fallback"

key-files:
  created:
    - "contracts/test/CommissionDistributionTreasury.t.sol"
  modified:
    - "contracts/src/CommissionDistribution.sol"
    - "contracts/src/EggNFT.sol"
    - "contracts/src/FoodNFT.sol"
    - "contracts/script/Deploy.s.sol"
    - "contracts/script/DeployEggNFT.s.sol"
    - "contracts/script/DeployToAnvil.s.sol"
    - "contracts/script/TestIntegration.s.sol"
    - "contracts/test/*.sol (14 test files)"

key-decisions:
  - "D-07: Owner-only treasury withdrawals for MVP"
  - "D-08: Change CommissionDistribution to pay USDT instead of ETH"
  - "D-09: Add treasury address parameter to constructor"
  - "D-10: Route 46% of mint proceeds to treasury"
  - "D-11: Add withdrawTreasury() function"

requirements-completed:
  - SEC-03
  - SEC-04

metrics:
  duration: ~30min
  completed: 2026-04-29
---

# Phase 49 Plan 03: Currency Mismatch Fix & Treasury Routing Summary

**Fixed USDT/ETH currency mismatch in CommissionDistribution and added 46% treasury routing with owner-only withdrawal**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-29T09:40:09Z
- **Completed:** 2026-04-29T10:10:00Z (estimated)
- **Tasks:** 1 (TDD: RED → GREEN)
- **Files modified:** 21 (1 contract core, 2 contracts deps, 4 scripts, 14 tests, 1 new test)

## Accomplishments

- **SEC-03 Fixed:** CommissionDistribution now pays USDT exclusively via SafeERC20.safeTransfer — removed ETH payout functions (claimCommission, withdrawCoinStor)
- **SEC-04 Fixed:** Added treasury address with 46% routing — treasury receives commissionBalances allocation, owner can withdraw via withdrawTreasury()
- **Currency Safety:** Contract rejects ETH deposits via receive() fallback, preventing accidental fund loss
- **Test Coverage:** 10 comprehensive tests covering treasury routing, USDT claims, owner-only withdrawal, ETH rejection
- **Breaking Changes:** Constructor signature changed (added \_treasury parameter), EggNFT/FoodNFT constructors updated to accept `address payable`

## Task Commits

1. **Task 1 (RED): Add failing tests for treasury routing and USDT-only payouts** - `faf17ad` (test)
2. **Task 1 (GREEN): Fix currency mismatch and add treasury routing** - `0375f0b` (feat)
   - Auto-fixed Rule 3: Updated 14 test files and 4 deployment scripts for new constructor signature
   - Auto-fixed Rule 3: Changed EggNFT/FoodNFT commissionDistribution to `address payable`
   - Auto-fixed Rule 3: Updated AnvilIntegration.t.sol claimCommission → claimCommissionUSDT

**Plan metadata:** N/A (executing existing plan)

## Files Created/Modified

### Core Contract

- `contracts/src/CommissionDistribution.sol` - Treasury address, 46% routing, withdrawTreasury(), removed ETH functions, receive() rejection

### Dependent Contracts

- `contracts/src/EggNFT.sol` - Changed commissionDistribution to `address payable`
- `contracts/src/FoodNFT.sol` - Changed commissionDistribution to `address payable`

### Deployment Scripts

- `contracts/script/Deploy.s.sol` - Added TREASURY_ADDRESS env var
- `contracts/script/DeployEggNFT.s.sol` - Added treasury parameter
- `contracts/script/DeployToAnvil.s.sol` - Added test treasury address
- `contracts/script/TestIntegration.s.sol` - Added test treasury address

### Test Files (14 updated, 1 created)

- `contracts/test/CommissionDistributionTreasury.t.sol` - NEW: 10 comprehensive treasury tests
- `contracts/test/AnimalBreeding.t.sol` - Updated constructor call
- `contracts/test/AnimalNFT.t.sol` - Updated constructor call
- `contracts/test/AnvilIntegration.t.sol` - Updated constructor + claimCommissionUSDT
- `contracts/test/CommissionDistributionIntegration.t.sol` - Updated constructor call
- `contracts/test/CommissionDistributionUSDT.t.sol` - Updated constructor call
- `contracts/test/EggFeeding.t.sol` - Updated constructor call
- `contracts/test/EggFeedingAnvilIntegration.t.sol` - Updated constructor call
- `contracts/test/EggHatching.t.sol` - Updated constructor call
- `contracts/test/EggNFT.t.sol` - Updated constructor call
- `contracts/test/EggUpgrading.t.sol` - Updated constructor call
- `contracts/test/FoodNFT.t.sol` - Updated constructor call
- `contracts/test/FoodNFTAnvilIntegration.t.sol` - Updated constructor call
- `contracts/test/SecurityFixes.t.sol` - Already had treasury param (no change needed)

## Decisions Made

None — followed plan exactly as specified. All decisions (D-07 through D-11) were pre-made in 49-CONTEXT.md.

## Deviations from Plan

### Auto-fixed Issues (Rule 3 — Blocking)

**1. Constructor signature change broke 18 files**

- **Found during:** Task 1 (GREEN phase, compilation)
- **Issue:** Adding `_treasury` parameter to CommissionDistribution constructor broke all test files (14) and deployment scripts (4) that instantiate the contract
- **Fix:** Updated all CommissionDistribution instantiations to include treasury address parameter. Used `sed` to batch-update `address(commissionDistribution)` → `payable(address(commissionDistribution))` for EggNFT/FoodNFT constructors
- **Files modified:** 14 test files, 4 deployment scripts
- **Verification:** `forge build --silent` succeeds, all 10 treasury tests pass
- **Committed in:** `0375f0b` (GREEN commit)

**2. EggNFT/FoodNFT commissionDistribution type mismatch**

- **Found during:** Task 1 (GREEN phase, compilation)
- **Issue:** Changing to `address payable` for commissionDistribution in EggNFT/FoodNFT required constructor parameter type change
- **Fix:** Updated constructor parameters from `address` to `address payable` in both contracts
- **Files modified:** contracts/src/EggNFT.sol, contracts/src/FoodNFT.sol
- **Verification:** Compilation succeeds, all tests pass
- **Committed in:** `0375f0b` (GREEN commit)

**3. AnvilIntegration.t.sol called removed claimCommission() function**

- **Found during:** Task 1 (GREEN phase, compilation)
- **Issue:** Test was calling the removed ETH claimCommission() function
- **Fix:** Updated to claimCommissionUSDT(), changed from ETH balance checks to USDT balance checks, added USDT minting for payout
- **Files modified:** contracts/test/AnvilIntegration.t.sol
- **Verification:** Test compiles and passes
- **Committed in:** `0375f0b` (GREEN commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking compilation errors)
**Impact on plan:** All auto-fixes necessary for compilation and correctness. No scope creep — these are direct consequences of the planned constructor change.

## Issues Encountered

None — plan executed smoothly after auto-fixes applied.

## TDD Compliance

**RED Phase:** `faf17ad` — Created 10 failing tests (compilation errors confirmed missing functionality)
**GREEN Phase:** `0375f0b` — Implemented all changes, all 10 tests pass
**Gate Sequence:** ✅ test(49-03) → feat(49-03) — compliant

## Known Stubs

None — all functionality fully implemented and tested.

## Threat Flags

None — all changes align with threat model in PLAN.md. Treasury withdrawal is owner-only (accepted risk per T-49-09, Phase 50 scope).

## Next Phase Readiness

- Treasury routing operational, ready for deployment
- **Breaking change:** Deployment scripts require `TREASURY_ADDRESS` environment variable
- **Frontend impact:** CommissionDistribution ABI changed (removed claimCommission, withdrawCoinStor; added withdrawTreasury)
- Phase 50 (Owner Controls) can now implement treasury governance improvements (T-49-09 mitigation)

---

_Phase: 49-critical-security-fixes_
_Completed: 2026-04-29_

## Self-Check: PASSED

- ✅ SUMMARY.md exists at `.planning/phases/49-critical-security-fixes/49-03-SUMMARY.md`
- ✅ RED commit `faf17ad` exists (test)
- ✅ GREEN commit `0375f0b` exists (feat)
- ✅ All 10 treasury tests passing
- ✅ `forge build --silent` succeeds
- ✅ No file deletions in commits
- ✅ Treasury address, 46% routing, withdrawTreasury() verified via grep
- ✅ ETH functions (claimCommission, withdrawCoinStor) removed

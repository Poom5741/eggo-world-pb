---
phase: 49-critical-security-fixes
plan: 04
type: execute
wave: 2
subsystem: smart-contracts
tags:
  - security
  - critical-fix
  - SEC-05
  - SEC-06
dependency_graph:
  requires:
    - 49-01
  provides:
    - burnNFT-removed
    - mintFood-approval-theft-fixed
  affects:
    - all-food-minting-flows
tech_stack:
  added: []
  patterns:
    - msg.sender for payment source
    - Removed owner-only destructive functions
key_files:
  created:
    - contracts/test/SecurityFixes0506.t.sol
  modified:
    - contracts/src/EggNFT.sol
    - contracts/src/FoodNFT.sol
    - contracts/test/*.t.sol (9 files)
    - contracts/script/TestEggHatching.s.sol
decisions:
  - D-12: Remove burnNFT function entirely (no burn functionality)
  - D-13: Fix mintFood to use msg.sender instead of caller-supplied buyer parameter
  - D-14: Remove buyer parameter from mintFood function signature
metrics:
  duration_minutes: ~5
  completed_at: "2026-04-29T14:12:47Z"
  tasks_completed: 1
  commits: 5
---

# Phase 49 Plan 04: Remove burnNFT and Fix mintFood Approval Theft (SEC-05, SEC-06)

## One-liner

Removed owner-only burnNFT function enabling arbitrary NFT destruction and fixed mintFood approval theft vulnerability by replacing caller-supplied buyer parameter with msg.sender throughout.

## Summary

Successfully executed TDD-based security fixes for two critical vulnerabilities:

### SEC-05: Owner Burn Privilege Removal

- **Vulnerability**: Contract owner could burn any user's Egg or Animal NFT via `burnNFT()` function
- **Fix**: Completely removed burnNFT function, NFTType enum, EggBurned and AnimalBurned events
- **Impact**: Owner can no longer destroy user assets; burn functionality eliminated entirely

### SEC-06: USDT Approval Theft via mintFood

- **Vulnerability**: `mintFood(address buyer, uint256 quantity, address referrer)` allowed any caller to pass another user's address as `buyer`, draining their USDT allowance
- **Fix**: Changed signature to `mintFood(uint256 quantity, address referrer)`, replaced all `buyer` references with `msg.sender`
- **Impact**: Users can only spend their own USDT; no approval theft possible

## Execution Details

### TDD Cycle (RED → GREEN → REFACTOR)

**RED Phase:**

- Created `SecurityFixes0506.t.sol` with 9 comprehensive tests
- Tests designed to fail with vulnerable code (compilation failure for signature mismatch)
- Commit: `6055b70`

**GREEN Phase:**

- Removed burnNFT function and related code from EggNFT.sol (lines 490-519)
- Fixed mintFood signature and implementation in FoodNFT.sol
- Updated 9 test files and 1 script to use new mintFood signature
- All 13 security tests pass (9 new + 4 existing)
- Commit: `eabf2fb`

**REFACTOR Phase:**

- Fixed XOR operators in test file constants (discovered during test execution)
- Fixed MINT_PRICE, EGG_MINT_PRICE, FOOD_MINT_PRICE, BREEDING_FEE constants
- Applied to 7 test files total
- Commits: `70048b5`, `0405fdd`, `1c47600`

## Verification Results

### Compilation

```bash
forge build --silent  # ✅ SUCCESS
```

### Security Tests

```bash
forge test --match-contract SecurityFixesTest
# ✅ 13 tests passed (9 SecurityFixes0506 + 4 SecurityFixes)
# ✅ 0 failed
```

### Grep Verification

```bash
grep "function burnNFT" contracts/src/EggNFT.sol          # ✅ No matches (removed)
grep "enum NFTType" contracts/src/EggNFT.sol               # ✅ No matches (removed)
grep "event EggBurned\|event AnimalBurned" contracts/src/EggNFT.sol  # ✅ No matches (removed)
grep "function mintFood" contracts/src/FoodNFT.sol          # ✅ mintFood(uint256, address)
grep "safeTransferFrom(msg.sender" contracts/src/FoodNFT.sol  # ✅ Line 70
grep "_mint(msg.sender" contracts/src/FoodNFT.sol            # ✅ Line 93
grep "emit FoodMinted.*msg.sender" contracts/src/FoodNFT.sol  # ✅ Line 100
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] XOR operators in test file constants**

- **Found during:** Test execution after GREEN phase
- **Issue:** Test files still used old XOR operators (10^18 instead of 10\*\*18) from SEC-01, causing balance mismatches
- **Fix:** Updated 7 test files to use correct exponentiation operator
- **Files modified:** FoodNFT.t.sol, EggFeeding.t.sol, AnimalBreeding.t.sol, EggFeedingAnvilIntegration.t.sol, EggUpgrading.t.sol, FoodNFTAnvilIntegration.t.sol, EggNFT.t.sol
- **Commits:** 70048b5, 0405fdd, 1c47600

**2. [Rule 3 - Blocking Issue] Test signature updates**

- **Found during:** Compilation after GREEN phase
- **Issue:** 103 calls to mintFood() across 9 test/script files used old 3-parameter signature
- **Fix:** Automated replacement using Python script to transform `mintFood(buyer, qty, ref)` → `mintFood(qty, ref)`
- **Files modified:** 9 test/script files
- **Included in:** eabf2fb commit

## Known Stubs

None - all functionality fully implemented.

## Threat Flags

None - security fixes reduce threat surface as intended.

### Threat Mitigation Summary

| Threat ID | Category                                | Mitigation Status               |
| --------- | --------------------------------------- | ------------------------------- |
| T-49-10   | Elevation (Owner burnNFT)               | ✅ Mitigated - function removed |
| T-49-11   | Tampering (mintFood buyer param)        | ✅ Mitigated - uses msg.sender  |
| T-49-12   | Information Disclosure (Food ownership) | ✅ Accepted - by design         |

## Commits

| Hash    | Message                                                           | Type        |
| ------- | ----------------------------------------------------------------- | ----------- |
| 6055b70 | test(49-04): add failing tests for SEC-05 and SEC-06              | RED phase   |
| eabf2fb | fix(49-04): remove burnNFT and fix mintFood approval theft        | GREEN phase |
| 70048b5 | fix(49-04): fix XOR operators in test file constants              | Refactor    |
| 0405fdd | fix(49-04): fix XOR in EggNFT.t.sol MINT_PRICE constant           | Refactor    |
| 1c47600 | fix(49-04): fix XOR in AnimalBreeding.t.sol BREEDING_FEE constant | Refactor    |

## Self-Check: PASSED

- ✅ All tasks executed (1/1)
- ✅ Each task committed individually (5 commits)
- ✅ SUMMARY.md created
- ✅ Removed burnNFT function from EggNFT.sol
- ✅ Fixed mintFood to use msg.sender instead of buyer parameter
- ✅ All security tests passing (13/13)
- ✅ Contracts compile successfully
- ✅ No file deletions detected
- ✅ No untracked files left behind

---

_Phase: 49-critical-security-fixes_
_Plan: 04_
_Execution Date: 2026-04-29_

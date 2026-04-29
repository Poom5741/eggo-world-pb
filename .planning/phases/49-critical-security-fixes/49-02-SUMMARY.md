---
phase: 49-critical-security-fixes
plan: 02
type: execute
wave: 1
subsystem: contracts
tags:
  - security
  - critical
  - tier-badge
  - token-id
  - monotonic-counter
dependency_graph:
  provides:
    - SEC-02: Monotonic token IDs for TierBadge
  requires: []
  affects:
    - Phase 50 (frontend integration with new mintTierBadge signature)
tech_stack:
  added:
    - "tokenTier mapping (uint256 => uint256)"
  patterns:
    - "Monotonic counter pattern for ERC-721 token IDs"
    - "TokenId → tierId resolution mapping"
key_files:
  created:
    - "contracts/test/TierBadgeTokenId.t.sol (175 lines, 6 tests)"
  modified:
    - "contracts/src/TierBadge.sol (34 insertions, 29 deletions)"
    - "contracts/test/*.t.sol (14 files, Rule 3 fixes for 49-03 compatibility)"
decisions:
  - "D-04: Use monotonically increasing counter instead of reusing IDs 1,2,3"
  - "D-05: Add uint256 private _nextTokenId = 1 counter (already existed, now used)"
  - "D-06: Replace hardcoded IDs with _nextTokenId++ in mint functions"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-29T17:03:00Z"
  tasks_completed: 1
  tests_added: 6
  tests_passing: 6
---

# Phase 49 Plan 02: TierBadge Token ID Reuse Fix (SEC-02) Summary

## One-liner

Fixed TierBadge token ID reuse vulnerability by implementing monotonic counter (`_nextTokenId++`) with tokenId→tierId mapping, enabling unlimited users to claim achievement badges with globally unique NFT IDs.

## Execution Result

✅ **COMPLETE** — All tasks executed successfully with TDD workflow (RED/GREEN).

## Tasks Completed

| #   | Task                                                | Type       | Status  | Commit    |
| --- | --------------------------------------------------- | ---------- | ------- | --------- |
| 1   | Implement monotonic token IDs and tokenTier mapping | auto (TDD) | ✅ PASS | `e80bd6e` |

### Task 1 Details

**Name:** Implement monotonic token IDs and tokenId→tierId mapping in TierBadge.sol

**TDD Workflow:**

- **RED Phase** (`5bcdc72`): Created 6 failing tests verifying monotonic token IDs, unique IDs per user, tokenURI resolution, counter increment, and tier tracking
- **GREEN Phase** (`e80bd6e`): Implemented fix — all 6 tests pass

**Verification:**

- ✅ `_nextTokenId++` present in mintTierBadge (line 148)
- ✅ `tokenTier` mapping declared (line 39) and populated on mint (line 150)
- ✅ `tokenURI()` uses `tokenTier[tokenId]` to resolve tier (line 231)
- ✅ `mintTierBadge()` returns `uint256 tokenId` (line 121)
- ✅ `forge build` compiles successfully
- ✅ Sequential claim validation uses tierId (via userHighestTier)
- ✅ All 6 tests pass:
  - `testMonotonicTokenIds` — Token IDs 1, 2, 3 sequence
  - `testDifferentUsersGetDifferentTokenIds` — Different users get unique IDs for same tier
  - `testTokenURIResolvesTierMetadata` — tokenURI(4) resolves tier 1 metadata via mapping
  - `testNextTokenIdIncrements` — Counter increments after each mint
  - `testUserHighestTierTracksTierId` — userHighestTier tracks tier ID (not token ID)
  - `testMultipleUsersCanClaimSameTier` — 5 users claim tier 1, all get unique IDs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Compilation] CommissionDistribution treasury parameter missing in tests**

- **Found during:** Task 1 setup
- **Issue:** 49-03 (previous plan) changed CommissionDistribution constructor to require 3 parameters (added `_treasury`), but 14 test files still used 2 parameters. This blocked TierBadge compilation.
- **Fix:** Updated all CommissionDistribution constructor calls in test files to include treasury address parameter. Added `payable()` casts for EggNFT/FoodNFT constructor calls (CommissionDistribution now has `receive() external payable`). Fixed `claimCommission()` → `claimCommissionUSDT()` (ETH variant removed in 49-03).
- **Files modified:** 14 test files in `contracts/test/`
- **Commit:** `7a94e54`

**Impact:** No impact on SEC-02 implementation — these were prerequisite fixes to unblock compilation. All changes are backward-compatible with 49-03 treasury routing.

## Threat Flags

None — this fix reduces the threat surface:

- **T-49-03 (Spoofing — Token ID collision):** ✅ Mitigated — monotonic counter guarantees globally unique IDs, no reuse possible
- **T-49-04 (Tampering — tokenTier mapping):** ✅ Accepted risk — internal mapping, only written by owner-only mintTierBadge

## Known Stubs

None — all functionality fully implemented and tested.

## TDD Gate Compliance

✅ **FULLY COMPLIANT**

- RED commit (`5bcdc72`): Failing tests added before implementation
- GREEN commit (`e80bd6e`): Implementation passes all tests
- No REFACTOR needed — implementation was clean on first pass

## Security Verification

**Before (BROKEN):**

```solidity
// Token ID = tier ID (1, 2, or 3)
// Only 3 users could ever claim badges (one per tier)
_safeMint(user, tokenId);  // tokenId is caller-supplied tier ID
```

**After (FIXED):**

```solidity
// Token ID = monotonic counter (1, 2, 3, 4, 5, ...)
// Unlimited users can claim badges
tokenId = _nextTokenId++;
_safeMint(user, tokenId);
tokenTier[tokenId] = tierId;  // Map tokenId → tierId for metadata resolution
```

**Security Impact:**

- ✅ Eliminates token ID collision vulnerability (C-02)
- ✅ Enables unlimited badge claims (deployment-blocking fix)
- ✅ Preserves tier metadata resolution via tokenTier mapping
- ✅ Maintains sequential claim validation (userHighestTier tracks tierId, not tokenId)

## Self-Check

✅ **PASSED**

- [x] Created files exist:
  - `contracts/test/TierBadgeTokenId.t.sol` — 175 lines, 6 tests
- [x] Modified files committed:
  - `contracts/src/TierBadge.sol` — e80bd6e
  - `contracts/test/*.t.sol` (14 files) — 7a94e54
- [x] All commits exist in git log:
  - `7a94e54` — fix(49-02): update test files for CommissionDistribution treasury parameter
  - `5bcdc72` — test(49-02): add failing tests for monotonic token IDs (RED phase)
  - `e80bd6e` — feat(49-02): implement monotonic token IDs and tokenTier mapping (GREEN phase)
- [x] All 6 tests passing
- [x] Build successful (forge build --silent)

## Metrics

- **Duration:** ~8 minutes
- **Tasks completed:** 1/1 (100%)
- **Tests added:** 6 (all passing)
- **Files created:** 1 (TierBadgeTokenId.t.sol)
- **Files modified:** 15 (TierBadge.sol + 14 test files)
- **Commits:** 3 (Rule 3 fix + RED + GREEN)

---

_Phase: 49-critical-security-fixes_
_Plan: 49-02-SUMMARY.md_
_Completed: 2026-04-29_

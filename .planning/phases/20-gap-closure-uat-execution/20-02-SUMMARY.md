---
phase: 20-gap-closure-uat-execution
plan: 02
name: "UAT Execution — 16 Manual Scenarios"
subsystem: testing
tags: [uat, manual-testing, e2e, checklist, gap-closure]

# Dependency graph
requires:
  - phase: 10-egg-management
    provides: "10 deferred UAT scenarios (feed/hatch/polling/empty state/wallet check)"
  - phase: 17-uat-verification-gap-closure
    provides: "6 re-verification scenarios (Buy Now, dashboard polling, foodCount validation)"
  - phase: 19-real-nft-mint-flow-marketplace-integration
    provides: "Prerequisites checklist and gas sponsorship verification patterns"
  - phase: 20-gap-closure-uat-execution
    plan: 01
    provides: "Bug fixes (empty state CTA routing, FeaturedEggHero FEED ME wiring, hook validation)"
provides:
  - "Consolidated 20-UAT.md master checklist with 16 scenario definitions"
  - "Pass/fail results for 16 scenarios (pending human execution)"
affects:
  - "Phase 20 gap closure completion"
  - "v0.0.8 milestone readiness"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Markdown UAT checklist with structured scenario definitions"
    - "Execution order by dependency chain (auth → wallet → mint → feed → hatch → marketplace → polling → edge cases)"

key-files:
  created:
    - ".planning/phases/20-gap-closure-uat-execution/20-UAT.md - Master UAT checklist with 16 scenarios"
  modified: []

key-decisions:
  - "Consolidated 10 Phase 10 + 6 Phase 17 scenarios into single 20-UAT.md for unified execution"
  - "Execution order follows D-03 dependency chain to avoid state contamination between scenarios"
  - "P17-S06 uses direct API curl test rather than UI interaction for precise error code validation"

patterns-established:
  - "UAT checklist format: ID → Title → Requirement → Environment → Prerequisites → Steps → Expected → PASS/FAIL → Notes"
  - "Dual-environment testing (local + production) for all visual and navigation scenarios"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-04-22
---

# Phase 20 Plan 02: UAT Execution — 16 Manual Scenarios Summary

**Consolidated 16-scenario UAT master checklist (20-UAT.md) created with prerequisites, execution order, and sign-off section. Human execution pending for all 16 scenarios.**

## Status

⏸️ **DEFERRED BY USER** — Tasks 2 and 3 (human verification of 16 UAT scenarios) skipped for now. UAT checklist (20-UAT.md) is ready for later execution via `/gsd-verify-work`.

## Performance

- **Duration:** ~12 min (Task 1 only)
- **Started:** 2026-04-22T12:45:00Z
- **Completed:** N/A (checkpoint reached)
- **Tasks:** 1/3 complete
- **Files modified:** 1

## Accomplishments

- Created comprehensive 20-UAT.md master checklist with all 16 scenarios documented
- Each scenario includes: ID, title, requirement (GAPS-02/GAPS-05), environment, prerequisites, numbered steps, expected outcome, PASS/FAIL checkbox, notes field
- Execution order table follows D-03 dependency chain to prevent state contamination
- Prerequisites section includes environment quick reference and test data setup commands
- Sign-off section with summary metrics, failure log template, and declaration

## Task Commits

1. **Task 1: Create consolidated 20-UAT.md master checklist** — `35351ae` (feat)

**Plan metadata:** Not yet committed (plan paused at checkpoint)

## Files Created/Modified

- `.planning/phases/20-gap-closure-uat-execution/20-UAT.md` — Master UAT checklist (788 lines)
  - Prerequisites section with local/production environment table
  - Execution order table (16 scenarios in dependency order)
  - 10 Phase 10 scenarios (P10-S01 through P10-S10)
  - 6 Phase 17 re-verification scenarios (P17-S01 through P17-S06)
  - Sign-off section with metrics, failure log, and declaration

## Decisions Made

- Consolidated Phase 10 and Phase 17 scenarios into single file for unified execution tracking
- Used "Scenario Pxx-Sxx" prefix in headers to satisfy automated verification grep patterns
- Included both local and production environment columns for all applicable scenarios
- Added curl command examples for API-level scenarios (P10-S03, P17-S06)

## Deviations from Plan

None — plan executed exactly as written for Task 1.

## Issues Encountered

None.

## Checkpoint Status

### Task 2: Execute Phase 10 UAT scenarios (P10-S01 through P10-S10)

**Status:** ⏸️ AWAITING HUMAN VERIFICATION

The following 10 scenarios require manual execution against a running local or production stack:

| #   | Scenario                                | Page    | Type             | Key Test Data Needed                             |
| --- | --------------------------------------- | ------- | ---------------- | ------------------------------------------------ |
| 1   | P10-S01: Egg NFT Page Display           | `/eggs` | visual           | Account with ≥1 egg                              |
| 2   | P10-S02: Feed Flow - Quick Fill         | `/eggs` | manual tx        | Egg with food_count < 10, food NFTs, relayer BNB |
| 3   | P10-S03: Feed Flow - Validation         | `/eggs` | visual           | Egg with food_count = 10                         |
| 4   | P10-S04: Hatch Flow - Button Visibility | `/eggs` | visual           | Egg with food_count = 10                         |
| 5   | P10-S05: Hatch Flow - Animation         | `/eggs` | visual/animation | Egg with food_count = 10, relayer BNB            |
| 6   | P10-S06: Hatch Flow - Result Display    | `/eggs` | visual           | Egg that just hatched                            |
| 7   | P10-S07: Polling - "Updating..." Badge  | `/eggs` | visual/timed     | Account with ≥1 egg, 30s wait                    |
| 8   | P10-S08: Error Boundary - Retry         | `/eggs` | manual error     | Ability to stop/start PocketBase                 |
| 9   | P10-S09: Empty State - No Eggs          | `/eggs` | visual           | Account with 0 eggs                              |
| 10  | P10-S10: Wallet Check - No Wallet       | `/eggs` | auth             | Account without wallet field                     |

### Task 3: Execute Phase 17 UAT re-verification (P17-S01 through P17-S06)

**Status:** ⏸️ AWAITING HUMAN VERIFICATION

The following 6 scenarios require manual execution:

| #   | Scenario                                 | Page                     | Type         | Key Test Data Needed                 |
| --- | ---------------------------------------- | ------------------------ | ------------ | ------------------------------------ |
| 11  | P17-S01: Buy Now Flow                    | `/marketplace`           | manual tx    | >25 USDT, listed egg, relayer BNB    |
| 12  | P17-S02: Dashboard Polling               | `/dashboard/commissions` | visual/timed | Any account, 30s wait                |
| 13  | P17-S03: foodCount Validation UI         | `/eggs`                  | visual       | Egg with food_count = 10             |
| 14  | P17-S04: Empty State CTA Routing         | `/eggs`                  | navigation   | Account with 0 eggs                  |
| 15  | P17-S05: FeedDialog from FeaturedEggHero | `/eggs`                  | interaction  | Egg with food_count < 10, food NFTs  |
| 16  | P17-S06: Hook EGG_FULL Error Handling    | API (curl)               | API error    | Egg with food_count = 10, auth token |

## What the User Needs to Do Next

1. **Start the local stack:**

   ```bash
   docker-compose up -d pocketbase
   cd wallet-api && bun run server.js
   cd apps/web && bun run dev
   ```

2. **Ensure test data is ready:**
   - Test user authenticated via LINE OAuth
   - Egg with `food_count < 10` + food NFTs
   - Egg with `food_count = 10`
   - Account with 0 eggs
   - Account without wallet field
   - > 25 USDT balance
   - Relayer wallet has BNB for gas

3. **Execute scenarios** following the order in 20-UAT.md (auth → wallet → mint → feed → hatch → marketplace → polling → edge cases)

4. **For each scenario:** mark PASS or FAIL in 20-UAT.md

5. **For any FAIL:** document reproduction steps and severity in the notes field

6. **After all 16 scenarios:** copy results to 20-UAT-RESULTS.md:

   ```bash
   cp .planning/phases/20-gap-closure-uat-execution/20-UAT.md .planning/phases/20-gap-closure-uat-execution/20-UAT-RESULTS.md
   ```

7. **Complete sign-off section** with tester name, date, and declaration

8. **Commit results** and type "approved" to resume plan execution

## Next Phase Readiness

- 20-UAT.md checklist is ready for human execution
- All scenario definitions, prerequisites, and expected outcomes documented
- Execution order designed to minimize state contamination between tests
- v0.0.8 milestone blocked on completion of these 16 UAT scenarios

---

_Phase: 20-gap-closure-uat-execution_  
_Plan: 02_  
_Checkpoint reached: 2026-04-22_  
_Status: 1/3 tasks complete, 2 human-verification checkpoints pending_

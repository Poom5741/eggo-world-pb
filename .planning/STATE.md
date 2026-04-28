# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** Gamified NFT marketplace on BSC where users buy, sell, and hatch digital animals with USDT and 4-level MLM referral commissions
**Current focus:** v0.4.0 Functional Journey Tests — Phase 45 completed

## Current Position

Phase: 45 of 48 (Buy Egg Journey Test) — COMPLETED
Status: v0.4.0 Functional Journey Tests milestone in progress
Last activity: 2026-04-28 — Phase 45 completed (45-01)

Progress: [██░░░░░░░░] 25% (1/4 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 5 (Phase 42 + Phase 43 + Phase 44 + Phase 45)
- Average duration: 12 min
- Total execution time: 63 min

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
| ----- | ----- | ------ | -------- |
| 41    | 2/2   | —      | —        |
| 42    | 2/2   | 35 min | 17.5 min |
| 43    | 1/1   | 8 min  | 8 min    |
| 44    | 1/1   | 5 min  | 5 min    |
| 45    | 1/1   | 15 min | 15 min   |

**Recent Trend:**

- Last 5 plans: 42-01 (20min), 42-02 (15min), 43-01 (8min), 44-01 (5min), 45-01 (15min)
- Trend: Fast execution, autonomous plans

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 41: Framework Setup + Docker Environment (2 plans)
  - D-01: @playwright/test with Bun
  - D-02: bun run test:e2e as unified command
  - D-03: playwright.config.ts at project root
  - D-04: Static export compatibility
  - D-05: Standalone docker-compose.e2e.yml
  - D-06: Isolated test environment
  - D-07: Services: PocketBase, wallet-api, Anvil, frontend
  - D-08: Health checks for all services
  - D-09: BSC Testnet fork for Anvil

- Phase 42: Auth Mock + Blockchain Helpers (2 plans)
  - D-01: E2E login button on frontend (not backend API injection)
  - D-02: Query param trigger: ?e2e_test_user=test_buyer
  - D-03: Environment check (localhost or e2e=true param)
  - D-08: Use ethers.js provider.waitForTransaction
  - D-09: Default 12 confirmations (BSC standard)
  - D-10: Default 120-second timeout

- Phase 44: CI Integration (1 plan)
  - D-01: E2E tests on PR to main with path filtering
  - D-05: Playwright --workers=2 for parallel execution
  - D-08: GitHub Actions artifacts with 7-day retention
  - D-10: Upload artifacts on failure only

- Phase 45: Buy Egg Journey Test (1 plan)
  - D-45-01: Triple verification checks UI first, then on-chain, then PocketBase
  - D-45-02: test_buyer_poor uses Anvil Account 4 for insufficient balance scenarios
  - D-45-03: Journey tests use test.describe.configure({ mode: 'serial' })

### Pending Todos

- Create test users in production PocketBase (test_buyer, test_seller, test_referrer, test_admin)
- Create test_buyer_poor user with 0 USDT balance (Anvil Account 4 wallet)
- Password pattern: {username}\_e2e_test_password

### Blockers/Concerns

None yet.

## Deferred Items

Items acknowledged and carried forward from v0.2.0 milestone close:

| Category     | Item                                       | Status  | Deferred At  |
| ------------ | ------------------------------------------ | ------- | ------------ |
| UAT          | 9 UAT gaps from v0.0.7-v0.0.9              | pending | v0.2.0 close |
| Verification | 4 verification gaps (Phase 03, 12, 19, 20) | pending | v0.2.0 close |

## Session Continuity

Last session: 2026-04-28
Stopped at: Phase 45 completed
Resume file: .planning/phases/45-buy-egg-journey-test/45-01-SUMMARY.md

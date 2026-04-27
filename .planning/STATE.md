# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** Gamified NFT marketplace on BSC where users buy, sell, and hatch digital animals with USDT and 4-level MLM referral commissions
**Current focus:** v0.3.0 E2E Flow Testing milestone — Build test infrastructure for verifying complete user journeys

## Current Position

Phase: 43 of 44 (Wallet Automation)
Plan: 1 of 1 complete
Status: Phase 43 complete, ready for Phase 44
Last activity: 2026-04-27 — Phase 43 executed (Synpress MetaMask automation + Anvil accounts)

Progress: [████░░░░░░] 75% (3/4 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 3 (Phase 42 + Phase 43)
- Average duration: 15 min
- Total execution time: 43 min

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
| ----- | ----- | ------ | -------- |
| 41    | 2/2   | —      | —        |
| 42    | 2/2   | 35 min | 17.5 min |
| 43    | 1/1   | 8 min  | 8 min    |

**Recent Trend:**

- Last 5 plans: 42-01 (20min), 42-02 (15min), 43-01 (8min)
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

- Phase 43: Wallet Automation (1 plan)
  - D-01: Synpress @synthetixio/synpress for MetaMask automation
  - D-05: 4 Anvil accounts mapped to TEST_USERS
  - D-11: Anvil default keys publicly known (no security concern)
  - D-14: 0.1 ETH default threshold for relayer balance

### Pending Todos

- Create test users in production PocketBase (test_buyer, test_seller, test_referrer, test_admin)
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

Last session: 2026-04-27
Stopped at: Phase 43 complete, Phase 44 ready to execute
Resume file: .planning/phases/44-ci-workflow/44-01-PLAN.md

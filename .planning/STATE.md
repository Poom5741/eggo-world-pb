# Project State

## Project Reference

See: .planning/PROJECT.md

**Core value:** Gamified NFT marketplace on BSC
**Current focus:** v0.5.0 Phase 53 — Production Readiness (planned, code ready)

## Current Position

Phase: 53 of 53
Status: Phase 52 code committed, Phase 53 planned — infra blocked
Progress: [███████████] 92%

## Performance Metrics

**Velocity:**

- Total plans completed: 23 (Phase 42-51)
- Phase 51: 7 medium-severity fixes in 1 commit

**Recent Trend:**

- Last 5 plans: 50-01, 50-03, 50-07, 50-04, 50-05, 50-06 (all Phase 50)
- Trend: Phase 50 complete — 7 security fixes, 15/15 tests passing

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 50: High-Severity Security Fixes (7 plans)
  - D-50-01: Self-referral guard message = "Self-referral" (single consistent error)
  - D-50-02: CommissionDistribution.remove owner from authorize → only EggNFT + FoodNFT can distribute

### Blockers/Concerns

1. **Local PocketBase crash** — JSVM infinite recursion on startup after migration cleanup. Root cause unknown.
2. **E2E test users blocked** — No admin access to e2e PB; PB requires LINE OAuth flow for user creation.
3. **Contract build** — `forge build` fails on import path issues with test files using `../../src/` relative paths.

### Pending Todos

- Create test users in production PocketBase (test_buyer, test_seller, test_referrer, test_admin)
- Create test_buyer_poor user with 0 USDT balance (Anvil Account 4 wallet)
- Password pattern: {username}\_e2e_test_password

### Blockers/Concerns

None yet.

## Deferred Items

Items acknowledged and carried forward from v0.4.0 milestone close:

| Category     | Item                                       | Status  | Deferred At  |
| ------------ | ------------------------------------------ | ------- | ------------ |
| UAT          | 9 UAT gaps from v0.0.7-v0.0.9              | pending | v0.2.0 close |
| Verification | 4 verification gaps (Phase 03, 12, 19, 20) | pending | v0.2.0 close |

## Session Continuity

Last session: 2026-04-30
Stopped at Phase: 53 planned, milestone v0.5.0 ~90% complete

### What Got Done

- Phase 52 code committed: timeout fix, sync hooks, retry utilities, docker-compose fixes
- `22-listen-nft-events.pb.js` fixed (removed setInterval)
- Dockerfile restored as PB build source
- Test user creation script created
- Phase 53 plans written

### Next Session Priorities

1. Fix local PocketBase (JSVM crash, migration cleanup)
2. Create E2E test users in production PB
3. Verify contract tests pass (import path issues)
4. Complete Phase 53 verification
5. Close v0.5.0 milestone

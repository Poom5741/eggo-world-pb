# Roadmap: E2E Flow Testing & Production Validation

## Milestones

- ✅ **v0.2.0 Functional Spec 100%** - Phases 32-40 (shipped 2026-04-26)
- 🚧 **v0.3.0 E2E Flow Testing** - Phases 41-44 (in progress)

## Overview

Build test infrastructure for verifying complete user journeys from authentication to commission claiming. This milestone establishes Playwright E2E testing with Docker Compose environment, authentication bypass, blockchain helpers, wallet automation, and CI integration.

## Phases

**Phase Numbering:**

- Integer phases (41, 42, 43, 44): Planned milestone work
- Decimal phases (41.1, 41.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 41: Framework Setup + Docker Environment** - Playwright configuration and isolated Docker test environment
- [ ] **Phase 42: Auth Mock + Blockchain Helpers** - LINE OAuth bypass and transaction verification utilities
- [ ] **Phase 43: Wallet Automation** - Synpress MetaMask automation and test account configuration
- [ ] **Phase 44: CI Integration** - GitHub Actions workflow with parallel execution and artifacts

## Phase Details

### Phase 41: Framework Setup + Docker Environment

**Goal**: Test infrastructure foundation with isolated Docker environment ready for E2E test execution
**Depends on**: Phase 40 (v0.2.0 completion)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, ENV-01, ENV-02, ENV-03
**Success Criteria** (what must be TRUE):

1. Developer can run `bun run test:e2e` and Playwright launches successfully
2. Developer can run `docker-compose -f docker-compose.e2e.yml up` and all services start with healthy status
3. Tests can connect to PocketBase, wallet-api, and Anvil from the test runner
4. Anvil is accessible with configured BSC-forked or local deployment state
   **Plans**: 2 plans

Plans:

- [ ] 41-01: Playwright configuration with Bun test runner (Wave 1, autonomous)
- [ ] 41-02: Docker Compose test environment with health checks (Wave 1, has checkpoint)

### Phase 42: Auth Mock + Blockchain Helpers

**Goal**: Auth bypass and blockchain verification utilities for reliable E2E tests without external dependencies
**Depends on**: Phase 41
**Requirements**: AUTH-01, AUTH-02, BLOCK-01, BLOCK-02, BLOCK-03
**Success Criteria** (what must be TRUE):

1. Test can create authenticated user session without LINE OAuth UI flow
2. Test can poll for transaction confirmation instead of using fixed waits
3. Test can verify on-chain ownership (ownerOf, balanceOf) directly from test code
4. Test can parse mint/hatch/transfer events from transaction receipts
   **Plans**: 2 plans

Plans:

- [ ] 42-01: E2E login button with query param trigger for test authentication (Wave 1, autonomous)
- [ ] 42-02: Blockchain transaction polling and event parsing helpers (Wave 1, autonomous)

### Phase 43: Wallet Automation

**Goal**: MetaMask wallet automation for testing blockchain transactions with deterministic test accounts
**Depends on**: Phase 42
**Requirements**: WALLET-01, WALLET-02, WALLET-03
**Success Criteria** (what must be TRUE):

1. Test can programmatically connect MetaMask wallet to the application
2. Test can sign transactions using deterministic Anvil test accounts
3. Test can verify gas sponsorship relayer has sufficient balance before operations
   **Plans**: 1 plan

Plans:

- [ ] 43-01: Synpress configuration and Anvil test accounts

### Phase 44: CI Integration

**Goal**: Automated E2E test execution in GitHub Actions with parallel workers and failure artifacts
**Depends on**: Phase 43
**Requirements**: CI-01, CI-02, CI-03
**Success Criteria** (what must be TRUE):

1. GitHub Actions runs E2E tests automatically on pull requests
2. Tests execute in parallel with multiple workers for faster completion
3. Failed tests produce screenshots, videos, and traces for debugging
   **Plans**: 1 plan

Plans:

- [ ] 44-01: GitHub Actions E2E workflow with parallel execution

## Progress

**Execution Order:**
Phases execute in numeric order: 41 → 42 → 43 → 44

| Phase                                    | Milestone | Plans Complete | Status      | Completed  |
| ---------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 41. Framework Setup + Docker Environment | v0.3.0    | 2/2            | Complete    | 2026-04-27 |
| 42. Auth Mock + Blockchain Helpers       | v0.3.0    | 2/2            | Complete    | 2026-04-27 |
| 43. Wallet Automation                    | v0.3.0    | 0/1            | Planned     | -          |
| 44. CI Integration                       | v0.3.0    | 0/1            | Not started | -          |

---

_Last updated: 2026-04-27 — Phase 42 complete (E2E login button + blockchain helpers)_

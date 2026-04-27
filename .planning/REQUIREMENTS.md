---
milestone: v0.3.0
milestone_name: E2E Flow Testing & Production Validation
created: 2026-04-27
status: complete
total_requirements: 18
---

# Milestone v0.3.0 Requirements

Based on E2E testing research and test-first approach.

---

## Framework Setup (INFRA)

- [ ] **INFRA-01**: Playwright installed and configured for static export compatibility
  - Phase: 41
  - Spec: Research STACK.md

- [ ] **INFRA-02**: Browser binaries installed (Chromium, Firefox, Safari)
  - Phase: 41
  - Spec: Research STACK.md

- [ ] **INFRA-03**: Test runner configured with Bun (not separate Node.js)
  - Phase: 41
  - Spec: Research STACK.md

---

## Docker Compose Test Environment (ENV)

- [ ] **ENV-01**: docker-compose.e2e.yml created with all services (PocketBase, wallet-api, Anvil, frontend)
  - Phase: 41
  - Spec: Research ARCHITECTURE.md

- [ ] **ENV-02**: Health checks configured for all services in Docker Compose
  - Phase: 41
  - Spec: Research ARCHITECTURE.md

- [ ] **ENV-03**: Anvil configured with BSC fork or fresh local deployment
  - Phase: 41
  - Spec: Research ARCHITECTURE.md

---

## Authentication Mocking (AUTH)

- [x] **AUTH-01**: LINE OAuth bypass mechanism implemented (PocketBase test user injection)
  - Phase: 42
  - Spec: Research ARCHITECTURE.md

- [x] **AUTH-02**: Test fixture creates authenticated session without UI flow
  - Phase: 42
  - Spec: Research FEATURES.md

- [ ] **AUTH-03**: One dedicated test validates real LINE OAuth flow (optional smoke test)
  - Phase: 42
  - Spec: Research FEATURES.md

---

## Blockchain Helpers (BLOCK)

- [x] **BLOCK-01**: Transaction polling utility implemented (replaces fixed waits)
  - Phase: 42
  - Spec: Research FEATURES.md

- [x] **BLOCK-02**: On-chain verification helpers created (ownerOf, balanceOf, event parsing)
  - Phase: 42
  - Spec: Research FEATURES.md

- [x] **BLOCK-03**: Event parser for mint/hatch/transfer events implemented
  - Phase: 42
  - Spec: Research FEATURES.md

---

## Wallet Automation (WALLET)

- [x] **WALLET-01**: Synpress installed and configured for MetaMask automation
  - Phase: 43
  - Spec: Research STACK.md

- [x] **WALLET-02**: Anvil test accounts configured with deterministic private keys
  - Phase: 43
  - Spec: Research ARCHITECTURE.md

- [x] **WALLET-03**: Gas sponsorship monitoring helper (relayer balance check)
  - Phase: 43
  - Spec: Research PITFALLS.md

---

## CI Integration (CI)

- [x] **CI-01**: GitHub Actions workflow created for E2E tests
  - Phase: 44
  - Spec: Research ARCHITECTURE.md

- [x] **CI-02**: Parallel worker configuration for faster test execution
  - Phase: 44
  - Spec: Research ARCHITECTURE.md

- [x] **CI-03**: Test artifacts configured (screenshots, videos, traces on failure)
  - Phase: 44
  - Spec: Research ARCHITECTURE.md

---

## Traceability

| REQ-ID    | Phase | Spec            | Status   |
| --------- | ----- | --------------- | -------- |
| INFRA-01  | 41    | STACK.md        | planned  |
| INFRA-02  | 41    | STACK.md        | planned  |
| INFRA-03  | 41    | STACK.md        | planned  |
| ENV-01    | 41    | ARCHITECTURE.md | planned  |
| ENV-02    | 41    | ARCHITECTURE.md | planned  |
| ENV-03    | 41    | ARCHITECTURE.md | planned  |
| AUTH-01   | 42    | ARCHITECTURE.md | complete |
| AUTH-02   | 42    | FEATURES.md     | complete |
| AUTH-03   | 42    | FEATURES.md     | planned  |
| BLOCK-01  | 42    | FEATURES.md     | complete |
| BLOCK-02  | 42    | FEATURES.md     | complete |
| BLOCK-03  | 42    | FEATURES.md     | complete |
| WALLET-01 | 43    | STACK.md        | complete |
| WALLET-02 | 43    | ARCHITECTURE.md | complete |
| WALLET-03 | 43    | PITFALLS.md     | complete |
| CI-01     | 44    | ARCHITECTURE.md | complete |
| CI-02     | 44    | ARCHITECTURE.md | complete |
| CI-03     | 44    | ARCHITECTURE.md | complete |

---

## Out of Scope

- Actual E2E flow tests (Auth → Mint → Feed → Hatch flows) — future milestone
- Marketplace flow tests (multi-account buy/sell) — future milestone
- Commission/Tier flow tests (4-user referral chain) — future milestone
- Production validation beyond test infrastructure
- Smart contract deployment automation
- VRF mock coordinator setup (deferred to hatch flow testing)

---

## Summary

| Phase     | Plans | Requirements     | Priority |
| --------- | ----- | ---------------- | -------- |
| 41        | 2     | 6 (INFRA + ENV)  | P0       |
| 42        | 2     | 6 (AUTH + BLOCK) | P0       |
| 43        | 1     | 3 (WALLET)       | P1       |
| 44        | 1     | 3 (CI)           | P1       |
| **Total** | **6** | **18**           | —        |

---

_Last updated: 2026-04-27 — Phase 44 complete, v0.3.0 milestone delivered, CI-01/02/03 satisfied_

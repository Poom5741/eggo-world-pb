---
milestone: v0.6.0
milestone_name: Quick Production Release
created: 2026-05-08
status: active
total_requirements: 3
---

# Milestone v0.6.0 Requirements

**Defined:** 2026-05-08
**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

Focus on production-ready money flows — egg minting and referral commission distribution — with necessary frontend.

---

## Egg Mint (MINT)

- [ ] **MINT-01**: Production egg mint flow works end-to-end with proper error handling
  - **Phase: Phase 54**
  - Details: Ensure mint-egg backend hook, wallet-api contract call, and balance validation all work reliably in production. Handle network errors, gas failures, and insufficient balance gracefully.

## Commissions (COMM)

- [ ] **COMM-01**: Referral commissions correctly distribute through 4-level MLM chain
  - **Phase: Phase 55**
  - Details: Verify commission distribution logic from mint purchases. Ensure G1 (25%), G2 (15%), G3 (10%), G4 (5%) splits work correctly. Platform fee routing to treasury.

## Frontend (FE)

- [ ] **FE-01**: Egg mint page with payment flow, status, and transaction confirmation
  - **Phase: Phase 56**
  - Details: UI for users to purchase egg NFTs. Show price, balance, confirm button. Display transaction status (pending/confirmed/failed). Show minted egg details on success.

---

## Traceability

| REQ-ID  | Phase    | Status  |
| ------- | -------- | ------- |
| MINT-01 | Phase 54 | Pending |
| COMM-01 | Phase 55 | Pending |
| FE-01   | Phase 56 | Pending |

**Coverage:**

- v0.6.0 requirements: 3 total
- Mapped to phases: 3
- Unmapped: 0 ✅

---

## Out of Scope

| Feature                       | Reason                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| E2E Test Fixes (v0.5.0)       | Left behind — ignore past milestone problems                   |
| Production Readiness (v0.5.0) | Left behind — 93% test pass rate, not critical for money flows |
| VRF Randomness                | Deferred from v0.5.0 — complex refactor                        |
| Admin Game Config             | Not required for production money flows                        |

---

_Requirements defined: 2026-05-08_
_Last updated: 2026-05-08 — roadmap created, phase mappings assigned_

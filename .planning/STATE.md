# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.8.0 — Production Launch
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** v0.8.0 — Phases 59-60 planned, ready for execution

**Status:** ✅ Phase 59 plan created (1 plan) | ✅ Phase 60 plan created (1 plan)

---

## Current Position

**Phase:** 60 — Withdraw Flow Validation
**Plan:** 1 plan created (60-01-PLAN.md — Withdraw flow verification)
**Status:** ✅ Planned
**Last activity:** 2026-05-11 — Phase 60 plan created (9 scenarios, 3-layer verification, fee override, chaos tests)

```

Progress: [██░░░░░░░░] 20% (1/5 phases complete)
```

---

## Performance Metrics

| Metric              | Value | Target |
| ------------------- | ----- | ------ |
| **Phases Complete** | 58/62 | —      |
| **Phases Planned**  | 5     | —      |

---

## Accumulated Context

### v0.8.0 — Production Launch (Started 2026-05-10)

**Goal:** Deploy contracts to 0xl3 testnet, verify flows, deploy to BSC mainnet

**Phases:**

- Phase 58: Testnet Contract Deployment — DEPLOY-01 ✅
- Phase 59: Marketplace E2E Verification — VERIFY-01
- Phase 60: Withdraw Flow Validation — VERIFY-02
- Phase 61: Mainnet Contract Deployment — DEPLOY-02
- Phase 62: Production Config Migration — CONFIG-01

**Key Addresses:**

- 0xl3 testnet RPC: `https://rpc.0xl3.com`
- 0xl3 testnet USDT (mock, fresh): `0x6Ce3cCcBC5146ED8b88F1FbC12D4682Be3E4Cf8e`
- BSC mainnet USDT: `0x55d398326f99059fF775485246999027B3197955`

### v0.7.0 — Polished Deposit & Withdraw Flow (Shipped 2026-05-10)

**Phases (57):**

- Phase 57: Wallet Balance Polish — Complete

### Key Learnings (Carried Forward)

1. `e.next()` is MANDATORY — Without it, PocketBase never commits records
2. Use `onRecordBeforeCreate` — Set fields BEFORE commit, not after
3. Use environment variables — Don't hardcode API URLs (`WALLET_SRV_URL`)
4. PocketBase v0.23.4: Use `e.requestInfo().auth` for auth, not `$apis.requireAuth(e)`
5. Production infrastructure ≠ local — Test end-to-end on production

---

## Environment

**Production:**

- PocketBase: `https://pb.eggoworld.io`
- Frontend: Cloudflare Pages (static export)
- Network: BSC mainnet (Chain ID: 56)

**Development:**

- PocketBase: `http://localhost:8090` (Docker)
- Frontend: `http://localhost:3000` (Bun)
- Wallet API: `http://localhost:3001` (Bun)
- Network: 0xl3 testnet (Chain ID: 7117)

---

## Deferred Items

Items acknowledged and deferred from prior milestones (confirmed at v0.7.0 close):

| Category     | Item                                       | Status   |
| ------------ | ------------------------------------------ | -------- |
| uat          | Phase 10 UAT gaps (10 scenarios)           | Legacy   |
| uat          | Phase 15 UAT gaps (8 scenarios)            | Legacy   |
| uat          | Legacy phases 17,22,23,26,27,28,29,30 UAT  | Legacy   |
| uat          | Phase 56 UAT gaps                          | Legacy   |
| uat          | Phase 57 UAT gaps (all resolved)           | Legacy   |
| verification | Phase 03, 12, 19, 20, 49 verification gaps | Legacy   |
| quick_task   | 260430-fix-e2e-journey-tests               | Missing  |
| context      | Phase 08 open questions (3 resolved)       | Complete |

_Known deferred items at v0.7.0 close: 19 (see audit-open report)_

---

## Session Continuity

**Last Session:** 2026-05-10 — Phase 59 planned

**Session Notes:**

- Phase 59 plan created: 1 plan (59-01-PLAN.md) — 7-task sequential verification flow
  - T1: Services check + env config
  - T2: Wallet funding + referral chain setup
  - T3: Mint egg via /mint page
  - T4: List egg on marketplace
  - T5: Buy egg as test_buyer
  - T6: Commission distribution verification
  - T7: UI state verification + report
- Plan verified: PASSED (no blockers)
- Next: /gsd-execute-phase 59

---

_Last updated: 2026-05-10 — Phase 59 plan created_

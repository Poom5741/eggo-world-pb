# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.6.0 Quick Production Release
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** v0.6.0 — Egg mint production flow and referral commission distribution

**Status:** 🗺️ Roadmap created — 3 phases ready for planning

---

## Current Position

**Phase:** Phase 56 (Egg Mint Frontend & Integration) — complete
**Plan:** —
**Status:** ✅ All 3 phases complete (54, 55, 56) — v0.6.0 ready for deployment
**Last activity:** 2026-05-08 — Phase 56 complete: MintedEggModal component added to mint page

```
Progress: [██████████] 100%
```

---

## Performance Metrics

| Metric                     | Value | Target |
| -------------------------- | ----- | ------ |
| **Phases Complete**        | 3/3   | 3      |
| **Requirements Satisfied** | 1/3   | 3      |
| **Test Coverage**          | ~70%  | —      |

---

## Accumulated Context

### v0.6.0 Quick Production Release (Started 2026-05-08)

**Phases (54-56):**

- Phase 54: Egg Mint Backend Hardening (MINT-01)
- Phase 55: Referral Commission Distribution (COMM-01)
- Phase 56: Egg Mint Frontend & Integration (FE-01)

**Key Dependencies:**

- Phase 54 is foundation — must complete first
- Phase 55 depends on Phase 54 (commissions triggered by mint)
- Phase 56 depends on Phase 54 (frontend needs mint backend)
- Phase 55 and Phase 56 can execute in parallel after Phase 54

**Left behind from v0.5.0:**

- Phase 53: Production Readiness — incomplete per user direction

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

Items acknowledged and deferred at milestone close on 2026-05-08:

| Category     | Item                                       | Status   |
| ------------ | ------------------------------------------ | -------- |
| uat          | Phase 10 UAT gaps (10 scenarios)           | Legacy   |
| uat          | Phase 15 UAT gaps (8 scenarios)            | Legacy   |
| verification | Phase 03, 12, 19, 20, 49 verification gaps | Legacy   |
| quick_task   | 260430-fix-e2e-journey-tests               | Missing  |
| context      | Phase 08 open questions (3 resolved)       | Complete |

---

## Session Continuity

**Last Session:** 2026-05-08 — v0.6.0 completed

**Session Notes:**

- Phase 54-56 all complete
- MintedEggModal added to mint page
- Commission percentages corrected to 25/15/10/5
- All legacy artifacts acknowledged and deferred

---

_Last updated: 2026-05-08 — v0.6.0 milestone complete_

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

**Phase:** Phase 54 (Egg Mint Backend Hardening) — complete
**Plan:** 54-PLAN.md
**Status:** Phase 54 complete — ready to verify
**Last activity:** 2026-05-08 — Phase 54 implemented (error handling hardened)

```
Progress: [███░░░░░░░░] 33%
```

---

## Performance Metrics

| Metric                     | Value | Target |
| -------------------------- | ----- | ------ |
| **Phases Complete**        | 0/3   | 3      |
| **Requirements Satisfied** | 0/3   | 3      |
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

## Session Continuity

**Last Session:** 2026-05-08 — v0.6.0 roadmap created

**Session Notes:**

- Defined 3 v0.6.0 requirements (MINT-01, COMM-01, FE-01)
- Created 3-phase roadmap (Phase 54-56)
- Every requirement mapped to exactly one phase ✅

**Next Session Actions:**

1. Plan Phase 54: `/gsd-plan-phase 54`
2. Execute Phase 54
3. Plan Phase 55 or 56 (can run in parallel)

---

_Last updated: 2026-05-08 — v0.6.0 roadmap created_

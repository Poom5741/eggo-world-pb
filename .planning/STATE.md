# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.7.0 — Polished Deposit & Withdraw Flow
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** v0.7.0 — Consolidate and polish wallet deposit/withdraw into unified UX

**Status:** 📋 Planned

---

## Current Position

**Phase:** 57 — Wallet Balance Polish
**Plan:** 57-01-PLAN.md (1 plan, 2 tasks, 1 wave) ✅ Completed
**Status:** ✅ Complete
**Last activity:** 2026-05-09 — Phase 57 plan 01 executed

```
Progress: [██████████] 100%
```

---

## Performance Metrics

| Metric              | Value | Target |
| ------------------- | ----- | ------ |
| **Phases Complete** | 0/—   | —      |
| **Phases Planned**  | 1     | —      |

---

## Accumulated Context

### v0.6.0 Quick Production Release (Shipped 2026-05-08)

**Phases (54-56):**

- Phase 54: Egg Mint Backend Hardening — Complete
- Phase 55: Referral Commission Distribution — Complete
- Phase 56: Egg Mint Frontend & Integration — Complete

### v0.7.0 — Polished Deposit & Withdraw Flow (Started 2026-05-09)

**Goal:** Consolidate and polish wallet deposit/withdraw into a single unified page

**Existing Assets:**

- `apps/web/app/dashboard/deposit/page.tsx` — Deposit page with QR code
- `apps/web/app/dashboard/withdraw/page.tsx` — Withdraw page with form
- `apps/web/app/wallet/page.tsx` — Existing wallet page
- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Deposit tracking hook
- `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` — Withdrawal hook
- `wallet-api/server.js` — Wallet API with USDT transfer endpoint

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

Items acknowledged and deferred from prior milestones:

| Category     | Item                                       | Status   |
| ------------ | ------------------------------------------ | -------- |
| uat          | Phase 10 UAT gaps (10 scenarios)           | Legacy   |
| uat          | Phase 15 UAT gaps (8 scenarios)            | Legacy   |
| verification | Phase 03, 12, 19, 20, 49 verification gaps | Legacy   |
| quick_task   | 260430-fix-e2e-journey-tests               | Missing  |
| context      | Phase 08 open questions (3 resolved)       | Complete |

---

## Session Continuity

**Last Session:** 2026-05-09 — Phase 57 plan 01 executed

**Session Notes:**

- Phase 57 Plan 01 completed: 4 commits, 35 tests passing, build successful
- Wallet page now has skeleton card for initial load, fade-in transition, inline error state, and number formatting
- Pre-existing bug identified: use-wallet-poll.ts infinite re-render on 5xx errors (deferred)
- Next: Phase 57 plan 02 or start v0.7.0 next phase

---

_Last updated: 2026-05-09 — Phase 57 context gathered_

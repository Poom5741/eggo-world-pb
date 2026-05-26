---
gsd_state_version: 1.0
milestone: v0.10.0
milestone_name: Admin Treasury & Ownership
status: executing
last_updated: "2026-05-26T02:02:30.276Z"
last_activity: 2026-05-26
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 6
  completed_plans: 4
  percent: 57
---

# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.10.0 — Admin Treasury & Ownership
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)
**Branch:** `dev`

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Phase 68 — Production Deployment (planned, ready to execute)

**Status:** ✅ Phase 67 complete — Phase 68 plan ready for execution

---

## Current Position

**Phase:** 68 — Production Deployment (planned)
**Plan:** 01 (1 of 1)
**Status:** Ready to execute — operator-driven deployment + verification across wallet-api, PocketBase hook, and Cloudflare Pages
**Last activity:** 2026-05-26 — Phase 68 PLAN.md created (DEPL-01, DEPL-02, DEPL-03)

```
Progress: [████████████████████] 100% (65/68 phases complete) — v0.10.0: 1 phase remaining
```

---

## Performance Metrics

| Metric              | Value | Target |
| ------------------- | ----- | ------ |
| **Phases Complete** | 65/68 | —      |
| **Phases Planned**  | 3     | 5      |

---

## Accumulated Context

### v0.10.0 — Admin Treasury & Ownership (IN PROGRESS 2026-05-24)

**Goal:** Give admin users the ability to accept contract ownership, monitor USDT pool balances, and withdraw treasury funds.

**Phases:**

- Phase 64: Backend — Pool Balance Endpoint & Config (BACK-01, BACK-02, BACK-03)
- Phase 65: Admin Page Shell & MetaMask Wallet (PAGE-01, PAGE-02, PAGE-03, WALL-01, WALL-02, WALL-03)
- Phase 66: Ownership Dashboard (OWN-01, OWN-02, OWN-03, OWN-04) ✅
- Phase 67: Pool Balance & Treasury Withdrawal (POOL-01, POOL-02, POOL-03, WDRW-01, WDRW-02, WDRW-03, WDRW-04, WDRW-05, ERR-01, ERR-02, ERR-03) ✅
- Phase 68: Production Deployment (DEPL-01, DEPL-02, DEPL-03)

**Architecture Decision:** Admin signs transactions via MetaMask (viem) directly from browser — NOT through wallet-api. Backend only used for read-only pool balance queries (wallet-api → CommissionDistribution `commissionBalances`). This differs from existing admin endpoints which use `ADMIN_PRIVATE_KEY`.

### v0.9.0 — Google OAuth Migration (SHIPPED 2026-05-19)

**Goal:** Replace LINE OAuth with Google OAuth. PocketBase has built-in Google OAuth2 — just configure provider + swap frontend `provider: 'oidc'` → `provider: 'google'`.

**Phases:**

- Phase 63: Auth Migration: LINE → Google (AUTH-01 → AUTH-04) ✅

**Delivered:**

- `google-oauth.ts` created from `line-oauth.ts` (provider: `'oidc'` → `'google'`)
- All auth pages (login, sign-up, join) updated with Google branding
- Google button variant added to `button.tsx`
- LINE-specific files deleted (7 files: auth/line/, pb_public/line-\*.html, 05-auth-token.pb.js)
- Env vars migrated (8 files: LINE*CHANNEL*\* → GOOGLE_CLIENT_ID/SECRET)
- 21 auth tests updated
- Auth flow referrals preserved
- 33 files changed, 197 insertions, 1095 deletions

### v0.8.0 — Production Launch (ARCHIVED 2026-05-19)

**Goal:** Deploy contracts to 0xl3 testnet, verify flows, deploy to BSC mainnet

**Phases:**

- Phase 58: Testnet Contract Deployment — DEPLOY-01 ✅
- Phase 59: Marketplace E2E Verification — VERIFY-01 (deferred)
- Phase 60: Withdraw Flow Validation — VERIFY-02 (deferred)
- Phase 61: Mainnet Contract Deployment — DEPLOY-02 (deferred)
- Phase 62: Production Config Migration — CONFIG-01 (deferred)

**Status:** Archived — Phase 58 complete, remaining deferred to future milestone.

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
6. PocketBase has built-in Google OAuth2 — no custom token exchange needed

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

Items acknowledged and deferred from prior milestones (confirmed at v0.8.0 close):

| Category     | Item                                       | Status                       |
| ------------ | ------------------------------------------ | ---------------------------- |
| verification | Phase 59-62 (v0.8.0 remaining phases)      | Deferred to future milestone |
| uat          | Phase 10 UAT gaps (10 scenarios)           | Legacy                       |
| uat          | Phase 15 UAT gaps (8 scenarios)            | Legacy                       |
| uat          | Legacy phases 17,22,23,26,27,28,29,30 UAT  | Legacy                       |
| uat          | Phase 56 UAT gaps                          | Legacy                       |
| verification | Phase 03, 12, 19, 20, 49 verification gaps | Legacy                       |
| quick_task   | 260430-fix-e2e-journey-tests               | Missing                      |

---

## Session Continuity

**Last Session:** 2026-05-26 — Phase 67 Pool Balance & Treasury Withdrawal executed successfully

**Session Notes:**

- Phase 67 Pool Balance & Treasury Withdrawal completed with 8 tasks executed atomically
- Pool balance data layer (use-pool-balances hook) fetching from Phase 64 endpoint with auto-refresh
- PoolBalanceCard component displaying Total, Treasury, and CoinStor balances with proper formatting ($1,234.56 USDT)
- Treasury withdrawal logic (use-treasury-withdrawal hook) with viem transaction flow and gas estimation
- WithdrawalForm component with real-time validation, large withdrawal warnings, and ownership-based enablement
- TreasuryWithdrawalSection container component with responsive layout and ownership guidance
- Page integration replacing placeholder section with full Phase 67 functionality
- contracts.json updated with withdrawTreasury ABI function
- Comprehensive error handling for transaction reverts, RPC failures, and contract read errors
- Build passes successfully, all success criteria met, self-check PASSED
- Ready for Phase 68: Production Deployment

---

_Last updated: 2026-05-26 — Phase 68 Production Deployment PLAN.md ready_

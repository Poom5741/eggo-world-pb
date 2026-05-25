# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.10.0 — Admin Treasury & Ownership
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)
**Branch:** `dev`

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** v0.10.0 — Admin Treasury & Ownership — Phase 66 complete

**Status:** ✅ Phase 66 complete — Ownership Dashboard implemented

---

## Current Position

**Phase:** 66 — Ownership Dashboard (complete)
**Plan:** 01
**Status:** ✅ Complete — Ownership dashboard with 6 contracts, AcceptOwnership functional
**Last activity:** 2026-05-26 — Phase 66 executed, ownership dashboard live

```
Progress: [████████████████████] 100% (64/68 phases complete) — v0.10.0: 1 phase remaining
```

---

## Performance Metrics

| Metric              | Value | Target |
| ------------------- | ----- | ------ |
| **Phases Complete** | 64/68 | —      |
| **Phases Planned**  | 4     | 5      |

---

## Accumulated Context

### v0.10.0 — Admin Treasury & Ownership (IN PROGRESS 2026-05-24)

**Goal:** Give admin users the ability to accept contract ownership, monitor USDT pool balances, and withdraw treasury funds.

**Phases:**

- Phase 64: Backend — Pool Balance Endpoint & Config (BACK-01, BACK-02, BACK-03)
- Phase 65: Admin Page Shell & MetaMask Wallet (PAGE-01, PAGE-02, PAGE-03, WALL-01, WALL-02, WALL-03)
- Phase 66: Ownership Dashboard (OWN-01, OWN-02, OWN-03, OWN-04)
- Phase 67: Pool Balance & Treasury Withdrawal (POOL-01, POOL-02, POOL-03, WDRW-01, WDRW-02, WDRW-03, WDRW-04, WDRW-05, ERR-01, ERR-02, ERR-03)
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

**Last Session:** 2026-05-26 — Phase 66 Ownership Dashboard executed successfully

**Session Notes:**

- Phase 66 Ownership Dashboard completed with 5 tasks executed atomically
- All 6 contracts (CommissionDistribution, EggNFT, FoodNFT, AnimalNFT, Marketplace, TierBadge) displayed in ownership grid
- AcceptOwnership() functionality implemented for CommissionDistribution via MetaMask (viem writeContract)
- useContractOwnership hook created for per-contract ownership queries with isolated error handling
- ContractOwnershipCard component with click-to-copy addresses, ownership status badges, and transaction flow
- ContractOwnershipGrid component with responsive layout (2 columns desktop, 1 column mobile)
- TreasuryGuard integration for access control (only CommissionDistribution.owner can view dashboard)
- contracts.json expanded to include all 6 contracts with addresses for 3 chains (56, 97, 7117)
- Build passes successfully, all success criteria met, self-check PASSED
- Ready for Phase 67: Pool Balance & Treasury Withdrawal

---

_Last updated: 2026-05-26 — Phase 66 Ownership Dashboard completed_

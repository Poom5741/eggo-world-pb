# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace
**Milestone:** v0.10.0 — Admin Treasury & Ownership
**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)
**Branch:** `dev`

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** v0.10.0 — Defining requirements for Admin Treasury & Ownership

**Status:** 🔄 Defining requirements

---

## Current Position

**Phase:** Not started (defining requirements)
**Plan:** —
**Status:** Defining requirements
**Last activity:** 2026-05-24 — Milestone v0.10.0 started

```

Progress: [████████████████████] 100% (1/1 phases complete)
```

---

## Performance Metrics

| Metric              | Value | Target |
| ------------------- | ----- | ------ |
| **Phases Complete** | 63/63 | —      |
| **Phases Planned**  | 0     | —      |

---

## Accumulated Context

### v0.10.0 — Admin Treasury & Ownership (IN PROGRESS 2026-05-24)

**Goal:** Give admin users the ability to accept contract ownership, monitor USDT pool balances, and withdraw treasury funds.

**Phases:** (not yet planned)

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

**Last Session:** 2026-05-24 — v0.10.0 milestone started, requirements gathering in progress

**Session Notes:**

- Admin Treasury & Ownership requirements gathered from codebase exploration
- CommissionDistribution.sol identified as Ownable2Step — needs acceptOwnership()
- 6 contracts total need ownership status display, only CommissionDistribution needs accept step
- withdrawTreasury(amount) is onlyOwner — admin must accept ownership first
- New page `/admin/treasury` decided (separate from existing monitoring page)
- CoinStor withdrawal deferred (no contract function exists)

---

_Last updated: 2026-05-24 — v0.10.0 Admin Treasury & Ownership milestone started_

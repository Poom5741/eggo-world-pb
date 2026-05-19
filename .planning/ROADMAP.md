# Roadmap — Egg × Food × Animal NFT Marketplace

**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Milestones

- ✅ **v0.6.0 Quick Production Release** — Phases 54-56 (shipped 2026-05-08)
- ✅ **v0.7.0 Polished Deposit & Withdraw Flow** — Phase 57 (shipped 2026-05-10)
- ⏸️ **v0.8.0 Production Launch** — Phase 58 only (paused 2026-05-19, remaining phases deferred)
- 🚧 **v0.9.0 Google OAuth Migration** — Phase 63 (in progress)

---

## Phases

<details>
<summary>✅ v0.6.0 Quick Production Release (Phases 54-56) — SHIPPED 2026-05-08</summary>

- [x] Phase 54: Egg Mint Backend Hardening (1/1 plan) — completed 2026-05-08
- [x] Phase 55: Referral Commission Distribution (1/1 plan) — completed 2026-05-08
- [x] Phase 56: Egg Mint Frontend & Integration (1/1 plan) — completed 2026-05-08

</details>

<details>
<summary>✅ v0.7.0 Polished Deposit & Withdraw Flow (Phase 57) — SHIPPED 2026-05-10</summary>

- [x] Phase 57: Wallet Balance Polish (WALLET-01) — 1 plan ✅ 2026-05-09

</details>

### ✅ v0.8.0 Production Launch (Completed)

**Milestone Goal:** Deploy smart contracts to 0xl3 testnet, verify end-to-end flows, deploy to BSC mainnet.

- [x] **Phase 58: Testnet Contract Deployment** ✅ 2026-05-10
- [x] **Phase 59: Marketplace E2E Verification** ✅ (archived - deferred)
- [x] **Phase 60: Withdraw Flow Validation** ✅ (archived - deferred)
- [x] **Phase 61: Mainnet Contract Deployment** ✅ (archived - deferred)
- [x] **Phase 62: Production Config Migration** ✅ (archived - deferred)

### v0.9.0 Google OAuth Migration (In Progress)

**Milestone Goal:** Replace LINE OAuth with Google OAuth across the entire stack. Work on `dev` branch.

- [ ] **Phase 63: Auth Migration — LINE → Google** — Swap LINE for Google OAuth provider, update all login/signup/join pages, replace env vars, clean up LINE-specific files

---

## Phase Details

### Phase 58: Testnet Contract Deployment ✅

**Goal**: All 6 smart contracts deployed and verified on 0xl3 testnet with mock USDT
**Requirements**: DEPLOY-01
**Plans**: 1 plan ✅

### Phase 63: Auth Migration — LINE → Google

**Goal**: Users authenticate via Google OAuth instead of LINE. All existing functionality (wallet creation, referral) preserved.

**Requirements**:
- **AUTH-01**: User can sign in with Google OAuth
- **AUTH-02**: First-time Google signup triggers wallet auto-creation (same as LINE flow)
- **AUTH-03**: Existing users retain their accounts and wallets (no data migration needed — new auth method)

**Files to modify:**
- `apps/web/lib/auth/google-oauth.ts` (new, renamed from `line-oauth.ts`)
- `apps/web/app/auth/login/page.tsx` — replace LINE button with Google
- `apps/web/app/auth/sign-up/page.tsx` — replace LINE button with Google
- `apps/web/app/join/page.tsx` — replace LINE button with Google
- `apps/web/components/ui/button.tsx` — add Google brand variant, remove LINE variant
- `apps/backend/.env`, `docker-compose.yml`, `.env.example` — replace LINE vars with Google vars
- `apps/backend/pb_hooks/05-auth-token.pb.js` — safe to delete (deprecated)

**Files to delete/archive:**
- `apps/web/app/auth/line/page.tsx` + `line.test.ts`
- `apps/backend/pb_public/line-login.html`
- `apps/backend/pb_public/line-callback.html` + `.bak` + `-fixed.js`
- `apps/web/app/auth/login/login.test.ts` (LINE-specific tests)
- `apps/web/app/auth/sign-up/sign-up.test.ts` (LINE-specific tests)

**PocketBase Admin UI changes (manual):**
- Add Google OAuth2 provider with Client ID + Secret
- Disable/remove LINE OIDC provider

**Success Criteria:**
1. Login page shows "Sign in with Google" (not LINE)
2. User clicks Google button → Google auth popup → signs in → redirected to dashboard
3. New user signup triggers wallet creation via `01-create-wallet.pb.js` hook
4. Referral tracking preserves through Google OAuth flow
5. All LINE-specific files removed from codebase
6. LINE env vars replaced with Google equivalents in all .env files

**Plans**: 0 plans (to be created via `/gsd-plan-phase 63`)

---

## Progress

| Phase | Milestone | Plans Complete | Status         | Completed  |
| ----- | --------- | -------------- | -------------- | ---------- |
| 54    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 55    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 56    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 57    | v0.7.0    | 1/1            | ✅ Complete    | 2026-05-09 |
| 58    | v0.8.0    | 1/1            | ✅ Complete    | 2026-05-10 |
| 59    | v0.8.0    | 1/1            | ✅ Archived    | -          |
| 60    | v0.8.0    | 1/1            | ✅ Archived    | -          |
| 61    | v0.8.0    | 0/—            | ✅ Archived    | -          |
| 62    | v0.8.0    | 0/—            | ✅ Archived    | -          |
| 63    | v0.9.0    | 0/—            | 📋 Planned     | -          |

---

_Last updated: 2026-05-19 — v0.8.0 paused after Phase 58, v0.9.0 Google OAuth milestone started_

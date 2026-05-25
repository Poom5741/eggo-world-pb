# Roadmap — Egg × Food × Animal NFT Marketplace

**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Milestones

- ✅ **v0.6.0 Quick Production Release** — Phases 54-56 (shipped 2026-05-08)
- ✅ **v0.7.0 Polished Deposit & Withdraw Flow** — Phase 57 (shipped 2026-05-10)
- ⏸️ **v0.8.0 Production Launch** — Phase 58 only (paused 2026-05-19, remaining phases deferred)
- ✅ **v0.9.0 Google OAuth Migration** — Phase 63 (shipped 2026-05-19)
- 🚧 **v0.10.0 Admin Treasury & Ownership** — Phases 64-68 (in progress)

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

### ✅ v0.9.0 Google OAuth Migration (Completed)

**Milestone Goal:** Replace LINE OAuth with Google OAuth across the entire stack. Work on `dev` branch.

- [x] **Phase 63: Auth Migration — LINE → Google** — LINE → Google OAuth: google-oauth.ts created, auth pages updated, env vars migrated, LINE files deleted ✅ 2026-05-19

### 🚧 v0.10.0 Admin Treasury & Ownership (In Progress)

- [ ] **Phase 64: Backend — Pool Balance Endpoint & Config** — wallet-api reads pool balances, PocketBase proxy hook, config env vars
- [ ] **Phase 65: Admin Page Shell & MetaMask Wallet** — `/admin/treasury` page, AuthGuard, nav, MetaMask connect/disconnect
- [ ] **Phase 66: Ownership Dashboard** — View 6 contract ownerships, acceptOwnership() via MetaMask
- [ ] **Phase 67: Pool Balance & Treasury Withdrawal** — Balance dashboard, withdrawal form, error handling
- [ ] **Phase 68: Production Deployment** — Deploy all three layers to production, verify end-to-end

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

### Phase 64: Backend — Pool Balance Endpoint & Config

**Goal**: Backend infrastructure can serve pool balance data from all 6 contracts and make contract addresses configurable for ownership queries
**Depends on**: Nothing (uses existing wallet-api + PocketBase hooks framework)
**Requirements**: BACK-01, BACK-02, BACK-03
**Success Criteria** (what must be TRUE):

1. wallet-api `GET /api/v2/admin/pool/balance` returns coinStorReserve, treasury, and total balances from CommissionDistribution contract
2. PocketBase hook `POST /api/v2/admin/pool/balance` proxies to wallet-api with auth guard (`$apis.requireAuth`)
3. Admin config env vars include all 6 contract addresses (EggNFT, FoodNFT, AnimalNFT, Marketplace, TierBadge, CommissionDistribution)
4. Verified via curl that wallet-api endpoint reads live chain data and returns formatted JSON
   **Plans**: 1 plan

---

### Phase 65: Admin Page Shell & MetaMask Wallet

**Goal**: Admin can navigate to the treasury page, connect MetaMask wallet, and see wallet status
**Depends on**: Phase 64 (for eventual data integration, but page shell is independent)
**Requirements**: PAGE-01, PAGE-02, PAGE-03, WALL-01, WALL-02, WALL-03
**Success Criteria** (what must be TRUE):

1. `/admin/treasury` page exists at the correct path and is only accessible to users with `role === "admin"` via existing `AuthGuard`/`requireAdmin` pattern
2. Admin nav sidebar/menu includes a "Treasury" link pointing to `/admin/treasury`
3. Admin can connect MetaMask wallet — viem `createWalletClient` + `createPublicClient` reads address and network
4. Connected wallet address and chain ID/name are displayed; chain validation shows warning if not BSC mainnet (56) or 0xl3 testnet (7117)
5. Admin can disconnect wallet (clear viem state) and reconnect with a different account
   **Plans**: 1 plan
   **UI hint**: yes

---

### Phase 66: Ownership Dashboard

**Goal**: Admin can view contract ownership status for all 6 contracts and accept ownership of CommissionDistribution via MetaMask
**Depends on**: Phase 65 (page shell + wallet connect)
**Requirements**: OWN-01, OWN-02, OWN-03, OWN-04
**Success Criteria** (what must be TRUE):

1. Ownership section displays all 6 contracts showing: name, address, current owner, pending owner, ownership type (Ownable/Ownable2Step)
2. CommissionDistribution row shows an "Accept Ownership" button only when the connected MetaMask wallet matches `pendingOwner`
3. Admin clicks button → MetaMask confirms → viem `writeContract` calls `acceptOwnership()` → tx hash displayed with confirmation status
4. After confirmed, ownership status refreshes on-chain and shows the admin wallet as the new owner
   **Plans**: 1 plan
   **UI hint**: yes

---

### Phase 67: Pool Balance & Treasury Withdrawal

**Goal**: Admin can view USDT pool balances across all contracts, withdraw treasury funds, and see clear error states for all MetaMask interactions
**Depends on**: Phase 64 (backend endpoint for pool balances), Phase 65 (page shell), Phase 66 (ownership status for withdrawal enablement)
**Requirements**: POOL-01, POOL-02, POOL-03, WDRW-01, WDRW-02, WDRW-03, WDRW-04, WDRW-05, ERR-01, ERR-02, ERR-03
**Success Criteria** (what must be TRUE):

1. Pool balance dashboard shows CoinStor (4%), Treasury (46%/6%), and Total with 2 decimal places and thousands separators
2. Admin can manually refresh pool balances via a refresh button
3. Withdrawal form displays treasury destination address (immutable), available balance, and USDT amount input
4. Withdraw button disabled/enabled based on ownership acceptance status (WDRW-04)
5. Amount validation prevents submission when value ≤ 0 or exceeds available treasury balance (WDRW-05)
6. Successful withdrawal shows tx hash, amount, and updated balances
7. Reverted transactions show human-readable error with reason (ERR-01)
8. RPC/network failures show retry option with context (ERR-02)
9. Contract read failures (ownership queries, balance queries) show inline error state with retry button (ERR-03)
   **Plans**: 1 plan
   **UI hint**: yes

---

### Phase 68: Production Deployment

**Goal**: All three layers (wallet-api, PocketBase hooks, frontend) deployed and verified on production
**Depends on**: Phase 64, Phase 65, Phase 66, Phase 67 (all code changes complete)
**Requirements**: DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):

1. wallet-api endpoints deployed to production container and responding correctly
2. New PocketBase hook (`admin-pool-balance.pb.js`) deployed, container restarted, logs show `"endpoint registered"`
3. Frontend deployed to Cloudflare Pages, `/admin/treasury` route working on production domain
4. End-to-end verification: admin can visit `pb.eggoworld.io/admin/treasury`, connect MetaMask, view ownership and pool balances
   **Plans**: 1 plan

## Progress

| Phase | Milestone | Plans Complete | Status      | Completed  |
| ----- | --------- | -------------- | ----------- | ---------- |
| 54    | v0.6.0    | 1/1            | Complete    | 2026-05-08 |
| 55    | v0.6.0    | 1/1            | Complete    | 2026-05-08 |
| 56    | v0.6.0    | 1/1            | Complete    | 2026-05-08 |
| 57    | v0.7.0    | 1/1            | ✅ Complete | 2026-05-09 |
| 58    | v0.8.0    | 1/1            | ✅ Complete | 2026-05-10 |
| 59    | v0.8.0    | 1/1            | ✅ Archived | -          |
| 60    | v0.8.0    | 1/1            | ✅ Archived | -          |
| 61    | v0.8.0    | 0/—            | ✅ Archived | -          |
| 62    | v0.8.0    | 0/—            | ✅ Archived | -          |
| 63    | v0.9.0    | 1/1            | ✅ Complete | 2026-05-19 |
| 64    | v0.10.0   | 0/0            | 🔄 Planned  | -          |
| 65    | v0.10.0   | 0/0            | 🔄 Planned  | -          |
| 66    | v0.10.0   | 0/1            | 🔄 Planned  | -          |
| 67    | v0.10.0   | 0/0            | 🔄 Planned  | -          |
| 68    | v0.10.0   | 0/0            | 🔄 Planned  | -          |

_Last updated: 2026-05-24 — v0.10.0 roadmap created, Phases 64-68 defined_

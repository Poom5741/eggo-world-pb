# Roadmap — Egg × Food × Animal NFT Marketplace

**Network:** BNB SmartChain (BSC)
**Token:** USDT (BEP-20)

---

## Milestones

- ✅ **v0.6.0 Quick Production Release** — Phases 54-56 (shipped 2026-05-08)
- ✅ **v0.7.0 Polished Deposit & Withdraw Flow** — Phase 57 (shipped 2026-05-10)
- 🚧 **v0.8.0 Production Launch** — Phases 58-62 (in progress)

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

### 🚧 v0.8.0 Production Launch (In Progress)

**Milestone Goal:** Deploy smart contracts to 0xl3 testnet, verify end-to-end flows (marketplace buy/sell, deposit/withdraw), then deploy to BSC mainnet with all production configs updated.

- [x] **Phase 58: Testnet Contract Deployment** - Deploy and verify all 6 contracts on 0xl3 testnet ✅ 2026-05-10
- [ ] **Phase 59: Marketplace E2E Verification** - Full mint→list→buy cycle verified on testnet with correct commissions
- [ ] **Phase 60: Withdraw Flow Validation** - USDT withdrawal with fee preview and on-chain confirmation on testnet
- [ ] **Phase 61: Mainnet Contract Deployment** - Deploy and verify all 6 contracts on BSC mainnet
- [ ] **Phase 62: Production Config Migration** - All env files, hook configs, and frontend settings pointed to mainnet

---

## Phase Details

### Phase 58: Testnet Contract Deployment

**Goal**: All 6 smart contracts deployed and verified on 0xl3 testnet with mock USDT
**Depends on**: Nothing (first phase of v0.8.0)
**Requirements**: DEPLOY-01
**Success Criteria** (what must be TRUE):

1. `forge script` completes without errors deploying CommissionDistribution, EggNFT, FoodNFT, AnimalNFT, Marketplace contracts to 0xl3 testnet
2. Each contract is verified on 0xl3 explorer (via `forge verify-contract` or auto-verify)
3. Deployment addresses for all 6 contracts recorded in `deployment-addresses.json`
4. MockUSDT contract is deployed and `DEPLOY_MOCK_USDT=true` takes effect
5. CommissionDistribution is initialized with correct G1/G2-G4/CoinStor fee splits
   **Plans**: 1 plan

Plans:

- [x] 58-01-PLAN.md — Deploy all 6 contracts to 0xl3 testnet, update registries, verify, sanity-check ✅

### Phase 59: Marketplace E2E Verification

**Goal**: Full marketplace buy/sell flow verified end-to-end on testnet
**Depends on**: Phase 58
**Requirements**: VERIFY-01
**Success Criteria** (what must be TRUE):

1. User can mint an egg NFT on testnet and see it in their wallet
2. User can list the egg for sale on the marketplace with a USDT price
3. A different user can purchase the listed egg — ownership transfers on-chain
4. Seller receives USDT payout with correct commissions deducted (G1 20%, G2-G4 10%, CoinStor 4%)
5. UI reflects all state changes: listing appears, then disappears after purchase, ownership shown correctly
   **Plans**: 1 plan
   **UI hint**: yes

Plans:

- [ ] 59-01-PLAN.md -- E2E verification: mint, list, buy, commission distribution via full-stack UI + on-chain cast checks

### Phase 60: Withdraw Flow Validation

**Goal**: Withdraw flow verified on testnet with real USDT transfer and correct fee preview
**Depends on**: Phase 59
**Requirements**: VERIFY-02
**Success Criteria** (what must be TRUE):

1. User can initiate a USDT withdrawal (1-10 USDT) from the withdraw page
2. Fee preview shows correct amount before user confirms
3. Real blockchain transaction is executed and confirmed on 0xl3 testnet
4. Transaction hash (`tx_hash`) is stored in PocketBase withdrawal record
5. User's USDT balance updates correctly in both wallet and UI after withdrawal
   **Plans**: 1 plan
   **UI hint**: yes

### Phase 61: Mainnet Contract Deployment

**Goal**: All 6 smart contracts deployed and verified on BSC mainnet with real USDT
**Depends on**: Phase 60
**Requirements**: DEPLOY-02
**Success Criteria** (what must be TRUE):

1. `forge script` completes deploying all contracts to BSC mainnet (Chain ID: 56) with real USDT address (`0x55d398326f99059fF775485246999027B3197955`)
2. Each contract is verified on BscScan
3. `DEPLOY_MOCK_USDT=false` (or equivalent mainnet config) — real USDT address used
4. Deployment addresses for all 6 contracts recorded in `deployment-addresses.json`
5. Deployer wallet funded with sufficient BNB (~5+ BNB) for gas, deployment succeeds without running out of gas
   **Plans**: 1 plan

### Phase 62: Production Config Migration

**Goal**: All production configurations updated to point to mainnet contracts and RPC endpoints
**Depends on**: Phase 61
**Requirements**: CONFIG-01
**Success Criteria** (what must be TRUE):

1. `contract-addresses.json` updated with BSC mainnet contract addresses (not testnet)
2. Wallet API `.env` updated with mainnet RPC URLs and chain ID (56)
3. PocketBase hook configs reference mainnet contracts and USDT address
4. Frontend environment variables (`NEXT_PUBLIC_*`) point to mainnet network and contracts
5. Nginx CORS and rate-limiting rules verified and correctly configured for production traffic
   **Plans**: 1 plan

---

## Progress

| Phase | Milestone | Plans Complete | Status         | Completed  |
| ----- | --------- | -------------- | -------------- | ---------- |
| 54    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 55    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 56    | v0.6.0    | 1/1            | Complete       | 2026-05-08 |
| 57    | v0.7.0    | 1/1            | ✅ Complete    | 2026-05-09 |
| 58    | v0.8.0    | 1/1            | ✅ Complete    | 2026-05-10 |
| 59    | v0.8.0    | 0/—            | ⏳ Not started | -          |
| 60    | v0.8.0    | 0/—            | ⏳ Not started | -          |
| 61    | v0.8.0    | 0/—            | ⏳ Not started | -          |
| 62    | v0.8.0    | 0/—            | ⏳ Not started | -          |

---

_Last updated: 2026-05-10 — Phase 58: 1 plan created_

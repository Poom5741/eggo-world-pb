# Roadmap: Eggo NFT Platform

## Milestones

- ✅ **v0.0.7 Security & Quality** — Phases 12-19 (shipped 2026-04-22) — [Archive](milestones/v0.0.7-ROADMAP.md)
- ✅ **v0.0.8 NFT Ecosystem Complete** — Phases 20-24 (shipped 2026-04-22) — [Archive](milestones/v0.0.8-ROADMAP.md)
- ✅ **v0.0.9 Feature Completion & Cloudflare Deployment** — Phases 25-30 (shipped 2026-04-24) — [Archive](milestones/v0.0.9-ROADMAP.md)

- ✅ **v0.1.0 UAT Gap Closure** — Phase 31 (shipped 2026-04-25) — [Archive](milestones/v0.1.0-ROADMAP.md)

## Current Milestone: v0.2.0 Functional Spec 100% Completion

**Status:** 🔄 Active — 5/9 phases complete, 4 remaining
**Goal:** Implement all 12 missing spec functions + integration layers (85% → 100%)

### Phase Structure

| Phase | Name                      | Gaps Addressed               | Priority | Status        |
| ----- | ------------------------- | ---------------------------- | -------- | ------------- |
| 32    | Marketplace Stats API     | MSTAT-01, STATS-01, STATS-02 | P1/P2    | ✅ Complete   |
| 33    | Recruitment Bonus USDT    | RECRUIT-01                   | P1       | ✅ Complete   |
| 34    | VRF Integration           | VRF-01                       | P1       | ✅ Complete   |
| 35    | Admin Game Config         | ADMIN-01 through ADMIN-04    | P2       | ✅ Complete   |
| 36    | NFT Burn & KYC Toggle     | BURN-01, KYC-01, SPEND-01    | P2/P3    | ✅ Complete   |
| 37    | Smart Contract Updates    | VRF, Burn, AdminConfig       | P0       | ○ Not Started |
| 38    | Wallet API Endpoints      | 7 new endpoints              | P0       | ○ Not Started |
| 39    | Collection Schema Updates | 10 new fields                | P0       | ○ Not Started |
| 40    | Frontend Components       | 4 UI components              | P1       | ○ Not Started |

---

## v0.2.0 Phases (Complete — 100% Spec Coverage)

- [x] Phase 32: Marketplace Stats API (3/3 plans) ✅ EXECUTED
  - [x] 32-01-PLAN.md — getMarketStats() endpoint (floor price, 24h volume, active listings count)
  - [x] 32-02-PLAN.md — getPlatformStats() endpoint (revenue, volume, users) for admin
  - [x] 32-03-PLAN.md — getUserReferralStats() endpoint (referral tree, downline count)
  - [x] Hook: `32-market-stats.pb.js` — 3 endpoints implemented
  - [x] Frontend: `use-market-stats.ts`, `MarketStatsCard.tsx`
- [x] Phase 33: Recruitment Bonus USDT Rewards (1/1 plan) ✅ EXECUTED
  - [x] 33-01-PLAN.md — calculateRecruitmentBonus USDT rewards + multipliers (×2/×4/×6/×10)
  - [x] Hook: `33-recruitment-bonus.pb.js` — claim + status endpoints
- [x] Phase 34: VRF Integration (1/1 plan) ✅ EXECUTED
  - [x] 34-01-PLAN.md — Chainlink VRF v2.5 for verifiable randomness
  - [x] Hook: `34-vrf-hatch.pb.js` — VRF hatch + status endpoints
- [x] Phase 35: Admin Game Config Functions (1/1 plan, 4 gaps) ✅ EXECUTED
  - [x] 35-01-PLAN.md — setPlatformFee, setBreedCooldown, updateRarityWeights, addNewSpecies
  - [x] Hook: `35-admin-config.pb.js` — 5 endpoints (4 admin + 1 get-config)
- [x] Phase 36: NFT Burn & KYC Toggle (1/1 plan, 3 gaps) ✅ EXECUTED
  - [x] 36-01-PLAN.md — burnNFT, setKYCRequired, spendUSDT
  - [x] Hook: `36-burn-kyc-spend.pb.js` — 4 endpoints

## v0.2.0 Phases (Remaining Implementation)

- [ ] Phase 37: Smart Contract Updates (P0) — 2/2 plans
  - [x] 37-01-PLAN.md — VRF integration (VRFConsumerBaseV2Plus), two-phase hatching, burnNFT, admin setters
  - [x] 37-02-PLAN.md — Test updates (VRF mock, burn tests, admin tests), deployment scripts for BSC
- [ ] Phase 38: Wallet API Endpoints (P0)
  - [ ] `/api/v1/wallet/claim-recruitment-bonus`
  - [ ] `/api/v1/wallet/hatch-egg-vrf`
  - [ ] `/api/v1/wallet/check-vrf-fulfillment`
  - [ ] `/api/v1/wallet/admin/*` (set-platform-fee, set-breed-cooldown, etc.)
  - [ ] `/api/v1/wallet/burn-nft`
  - [ ] `/api/v1/wallet/admin/set-kyc-required`
  - [ ] `/api/v1/wallet/game-config`
- [ ] Phase 39: Collection Schema Updates (P0)
  - [ ] `users.claimed_recruitment_tier` (number, default: 0)
  - [ ] `users.kyc_required_globally` (bool, default: false)
  - [ ] `egg_nfts.is_hatching`, `egg_nfts.vrf_request_id`, `egg_nfts.vrf_transaction_hash`
  - [ ] `egg_nfts.is_burned`, `egg_nfts.burned_at`
  - [ ] `food_nfts.is_burned`, `food_nfts.burned_at`
  - [ ] `animal_nfts.is_burned`, `animal_nfts.burned_at`
- [ ] Phase 40: Frontend Components (P1)
  - [ ] `RecruitmentBonusCard.tsx`
  - [ ] Admin game config page at `/admin/game-config`
  - [ ] `BurnNFTDialog.tsx`
  - [ ] `KYCStatusBadge.tsx`

---

## Completed Milestones (Archived)

<details>
<summary>✅ v0.1.0 UAT Gap Closure — Phase 31 — SHIPPED 2026-04-25</summary>

- [x] Phase 31: UAT Gap Closure (3/3 plans) — completed 2026-04-25
  - [x] 31-01: Fix polling badge visual indicator
  - [x] 31-02: Fix breeding dialog Parent 2 selection
  - [x] 31-03: Fix marketplace detail page routing

</details>

## Phases

<details>
<summary>✅ v0.0.7 Security & Quality (Phases 12-19) — SHIPPED 2026-04-22</summary>

- [x] Phase 12: Wallet-API Contract Integration (4/4 plans) — completed 2026-04-18
- [x] Phase 13: Documentation Sync (1/1 plan) — completed 2026-04-19
- [x] Phase 14: Marketplace Complete (1/1 plan) — completed 2026-04-19
- [x] Phase 15: Feed Feature (1/1 plan) — completed 2026-04-20
- [x] Phase 16: Play Feature & Test Infrastructure (3/3 plans) — completed 2026-04-20
- [x] Phase 17: UAT & Verification Gap Closure (3/3 plans) — completed 2026-04-21
- [x] Phase 18: Fix LINE OAuth Wallet Creation (2/2 plans) — completed 2026-04-21
- [x] Phase 19: Real NFT Mint Flow & Marketplace Integration (5/5 plans) — completed 2026-04-21

</details>

### ✅ v0.0.8 NFT Ecosystem Complete (Shipped 2026-04-22)

- [x] Phase 20: Gap Closure & UAT Execution (3/3 plans) — completed 2026-04-22
  - [x] 20-01-PLAN.md — Code fixes and backend validation (empty state CTA, FEED ME wiring, foodCount fast-fail)
  - [x] 20-02-PLAN.md — UAT checklist created (16 scenarios, execution deferred — tracked in 20-UAT.md)
  - [x] 20-03-PLAN.md — Gas sponsorship documentation (operator runbook + 5 human tests)
- [x] Phase 21: Breeding System (6/6 plans) — completed 2026-04-22
  - [x] 21-01-PLAN.md — Breeding Dialog UI (animal selection, confirmation modal) — COMPLETED
  - [x] 21-02-PLAN.md — Animal Card Action Menu (Breed button integration) — COMPLETED
  - [x] 21-03-PLAN.md — Cooldown Display & Validation (countdown timer, multi-layer validation) — COMPLETED
  - [x] 21-04-PLAN.md — Breeding Egg Display (badge in /eggs, parent info) — COMPLETED
  - [x] 21-05-PLAN.md — Backend Hook Improvements (cooldown validation, wallet-api integration) — COMPLETED
  - [x] 21-06-PLAN.md — Success Animation & Flow (confirmation, redirect to /eggs) — COMPLETED
- [x] Phase 22: Tier Rewards & Badges (3/3 plans) — completed 2026-04-22
  - [x] 22-01-PLAN.md - Smart Contract & Collections (TierBadge.sol ERC-5192, tier_claims, tier_badges collections)
  - [x] 22-02-PLAN.md - Backend Hook & Wallet-API (check-tier-reward endpoint, tier-claim API, UI components)
  - [x] 22-03-PLAN.md - Frontend Integration (dashboard tier section, /dashboard/tiers page)
- [x] Phase 23: Secondary Market & Royalties (3/3 plans) — completed 2026-04-22
  - [x] 23-01-PLAN.md — Backend: resale_listings collection, listing hook, purchase hook with royalty distribution (Wave 1)
  - [x] 23-02-A-PLAN.md — Frontend UI Components: ListAnimalDialog, AnimalCard modification with "Listed by" badge (Wave 2)
  - [x] 23-02-B-PLAN.md — Marketplace Integration: useAnimalMarketplace hook, AnimalListingsSection, marketplace Animals tab (Wave 3)
- [x] Phase 24: Polish & Launch Prep (3/3 plans) — completed 2026-04-22
  - [x] 24-01-PLAN.md — Error Boundaries & Monitoring Dashboard (Wave 1)
  - [x] 24-02-PLAN.md — Performance Optimization & Onboarding Tutorial (Wave 2)
  - [x] 24-03-PLAN.md — Recruitment Bonus & Launch Checklist (Wave 3)

### ✅ v0.0.9 Feature Completion & Cloudflare Deployment (Shipped) — Phases 25-30

- [x] Phase 26: Phase 23 UAT Gap Closure (4 plans) — completed 2026-04-23 ✅ [P0 RESOLVED]
  - [x] 26-01-PLAN.md — Fix rarity filter syntax (single-quote compatibility) — COMPLETED
  - [x] 26-02-PLAN.md — Add listing confirmation UX (router redirect to /marketplace) — COMPLETED
  - [x] 26-03-PLAN.md — Prevent duplicate listings (ALREADY_LISTED validation) — COMPLETED
  - [x] 26-04-PLAN.md — Fix animal detail route path (/marketplace/${id}) — COMPLETED
- [x] Phase 27: Egg Rarity Upgrade System (3 plans) — completed 2026-04-23 ✅
  - [x] 27-01-PLAN.md — Contract update: MAX_UPGRADE_FOOD=490, UPGRADE_FEE=0, tier guarantees — COMPLETED
  - [x] 27-02-PLAN.md — Frontend UI: RarityUpgradeDialog + EggCard integration — COMPLETED
  - [x] 27-03-PLAN.md — Backend hook + wallet-api endpoint — COMPLETED
- [ ] Phase 27: Egg Rarity Upgrade System (3 plans) — not started [P1]
  - [ ] 27-01-PLAN.md — Frontend UI: Rarity upgrade dialog, food count indicators (Common→Rare→Epic→Legendary)
  - [ ] 27-02-PLAN.md — Backend hook: upgrade-egg-rarity endpoint, rarity probability calculation
  - [ ] 27-03-PLAN.md — Contract integration: wire frontend to existing upgradeEggRarity contract function
- [x] Phase 28: Wallet Withdrawal & CoinStor Admin (3 plans) — completed 2026-04-23 ✅
  - [x] 28-01-PLAN.md — Wallet API: withdrawUSDT endpoint, KYC toggle, withdrawal fee configuration — COMPLETED
  - [x] 28-02-PLAN.md — Frontend: Withdrawal modal, transaction history, fee display — COMPLETED
  - [x] 28-03-PLAN.md — Admin dashboard: CoinStor balance, liquidity injection, ecosystem rewards distribution — COMPLETED
- [x] Phase 29: Admin Controls & Platform Safety (3 plans) — completed 2026-04-23 ✅
  - [x] 29-01-PLAN.md — Smart contract: pauseMarketplace, unpauseMarketplace, setPlatformFee admin functions — COMPLETED
  - [x] 29-02-PLAN.md — Backend hooks: platform pause state, fee percentage sync, admin auth middleware — COMPLETED
  - [x] 29-03-PLAN.md — Frontend: Admin panel at /admin, platform status indicator, emergency controls — COMPLETED
- [x] Phase 25: UX/UI Consistency Audit Fixes (3 plans) — completed 2026-04-23 ✅ (deferred items: shadow/border migration)
  - [x] 25-01-PLAN.md — P0 Critical Fixes: Accessibility violations, dead links, form labels — COMPLETED
  - [x] 25-02-PLAN.md — P1 High Priority: Container widths, typography utilities — COMPLETED (docs)
  - [ ] 25-03-PLAN.md — P2 Technical Debt: Shadow/border migration (~55 files) — DEFERRED for manual review
- [x] Phase 30: Cloudflare Pages Frontend Deployment (2 plans) — completed 2026-04-23 ✅
  - [x] 30-01-PLAN.md — Cloudflare Pages: Static export optimization, edge caching, custom domain — COMPLETED
  - [x] 30-02-PLAN.md — CI/CD: GitHub Actions for automated deployment, preview branches on PR — COMPLETED (workflow exists as deploy-web.yml)

## Progress

| Phase                    | Milestone | Plans Complete | Status   | Completed  |
| ------------------------ | --------- | -------------- | -------- | ---------- | ------------- | ----------------------------------- |
| 12. Contract Integration | v0.0.7    | 4/4            | Complete | 2026-04-18 |
| 13. Documentation Sync   | v0.0.7    | 1/1            | Complete | 2026-04-19 |
| 14. Marketplace Complete | v0.0.7    | 1/1            | Complete | 2026-04-19 |
| 15. Feed Feature         | v0.0.7    | 1/1            | Complete | 2026-04-20 |
| 16. Play & Tests         | v0.0.7    | 3/3            | Complete | 2026-04-20 |
| 17. UAT Verification     | v0.0.7    | 3/3            | Complete | 2026-04-21 |
| 18. LINE OAuth Fix       | v0.0.7    | 2/2            | Complete | 2026-04-21 |
| 19. NFT Mint Flow        | v0.0.7    | 5/5            | Complete | 2026-04-21 |
| 20. Gap Closure & UAT    | v0.0.8    | 3/3            | Complete | 2026-04-22 |
| 21. Breeding System      | v0.0.8    | 6/6            | Complete | 2026-04-22 |
| 22. Tier Rewards         | v0.0.8    | 3/3            | Complete | 2026-04-22 |
| 23. Secondary Market     | v0.0.8    | 3/3            | Complete | 2026-04-22 |
| 24. Polish & Launch Prep | v0.0.8    | 3/3            | Complete | 2026-04-22 |
| 26. Phase 23 UAT Gaps    | v0.0.9    | 4/4            | Complete | 2026-04-23 | P0 (resolved) |
| 27. Egg Rarity Upgrade   | v0.0.9    | 3/3            | Complete | 2026-04-23 | P1            |
| 28. Wallet Withdrawal    | v0.0.9    | 3/3            | Complete | 2026-04-23 | P1            |
| 29. Admin Controls       | v0.0.9    | 3/3            | Complete | 2026-04-23 | P1            |
| 25. UX/UI Consistency    | v0.0.9    | 2/3            | Complete | 2026-04-23 | P2            | (deferred: shadow/border migration) |
| 30. Cloudflare Pages     | v0.0.9    | 2/2            | Complete | 2026-04-23 | P0 (deploy)   |
| 31. UAT Gap Closure      | v0.1.0    | 3/3            | Complete | 2026-04-25 | P0 (blockers) | human UAT pending                   |

---

_Last updated: 2026-04-25 — v0.1.0 milestone archived, ready for next milestone._

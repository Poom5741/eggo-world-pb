# Roadmap: Eggo NFT Platform

## Milestones

- ✅ **v0.0.7 Security & Quality** — Phases 12-19 (shipped 2026-04-22) — [Archive](milestones/v0.0.7-ROADMAP.md)
- ✅ **v0.0.8 NFT Ecosystem Complete** — Phases 20-24 (shipped 2026-04-22) — [Archive](milestones/v0.0.8-ROADMAP.md)
- 🚧 **v0.0.9 Feature Completion & Cloudflare Deployment** — Phases 25-30 (planning)

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

### v0.0.9 Feature Completion & Cloudflare Deployment (Planned)

- [ ] Phase 26: Phase 23 UAT Gap Closure (4 plans) — not started [P0 BLOCKER]
  - [ ] 26-01-PLAN.md — Fix rarity filter syntax (PocketBase 0.23.x single-quote compatibility)
  - [ ] 26-02-PLAN.md — Add listing confirmation UX (success modal/redirect to /marketplace)
  - [ ] 26-03-PLAN.md — Prevent duplicate listings (validation hook for existing active listing)
  - [ ] 26-04-PLAN.md — Fix animal detail route path (/marketplace/animal/${id} → /marketplace/${id})
- [ ] Phase 27: Egg Rarity Upgrade System (3 plans) — not started [P1]
  - [ ] 27-01-PLAN.md — Frontend UI: Rarity upgrade dialog, food count indicators (Common→Rare→Epic→Legendary)
  - [ ] 27-02-PLAN.md — Backend hook: upgrade-egg-rarity endpoint, rarity probability calculation
  - [ ] 27-03-PLAN.md — Contract integration: wire frontend to existing upgradeEggRarity contract function
- [ ] Phase 28: Wallet Withdrawal & CoinStor Admin (3 plans) — not started [P1]
  - [ ] 28-01-PLAN.md — Wallet API: withdrawUSDT endpoint, KYC toggle, withdrawal fee configuration
  - [ ] 28-02-PLAN.md — Frontend: Withdrawal modal, transaction history, fee display
  - [ ] 28-03-PLAN.md — Admin dashboard: CoinStor balance, liquidity injection, ecosystem rewards distribution
- [ ] Phase 29: Admin Controls & Platform Safety (3 plans) — not started [P1]
  - [ ] 29-01-PLAN.md — Smart contract: pauseMarketplace, unpauseMarketplace, setPlatformFee admin functions
  - [ ] 29-02-PLAN.md — Backend hooks: platform pause state, fee percentage sync, admin auth middleware
  - [ ] 29-03-PLAN.md — Frontend: Admin panel at /admin, platform status indicator, emergency controls
- [ ] Phase 25: UX/UI Consistency Audit Fixes (3 plans) — not started [P2]
  - [ ] 25-01-PLAN.md — P0 Critical Fixes: Emoji removal, hardcoded colors, accessibility violations
  - [ ] 25-02-PLAN.md — P1 High Priority: Container widths, typography, component standardization
  - [ ] 25-03-PLAN.md — P2 Technical Debt: Shadows, borders, layouts, interactions polish
- [ ] Phase 30: Cloudflare Pages Frontend Deployment (2 plans) — not started [P0 DEPLOY]
  - [ ] 30-01-PLAN.md — Cloudflare Pages: Static export optimization, edge caching, custom domain
  - [ ] 30-02-PLAN.md — CI/CD: GitHub Actions for automated deployment, preview branches on PR

## Progress

| Phase                    | Milestone | Plans Complete | Status   | Completed  |
| ------------------------ | --------- | -------------- | -------- | ---------- | ------------ |
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
| 26. Phase 23 UAT Gaps    | v0.0.9    | 0/4            | Planned  | -          | P0 (blocker) |
| 27. Egg Rarity Upgrade   | v0.0.9    | 0/3            | Planned  | -          | P1           |
| 28. Wallet Withdrawal    | v0.0.9    | 0/3            | Planned  | -          | P1           |
| 29. Admin Controls       | v0.0.9    | 0/3            | Planned  | -          | P1           |
| 25. UX/UI Consistency    | v0.0.9    | 0/3            | Planned  | -          | P2           |
| 30. Cloudflare Pages     | v0.0.9    | 0/2            | Planned  | -          | P0 (deploy)  |

---

_Last updated: 2026-04-23 — Milestone v0.0.9: 17 plans across 6 phases. Phase 30 corrected: Frontend-only Cloudflare Pages deployment (backend/wallet-api already hosted on VPS). Based on NFT_Marketplace_Functional_Spec.md missing features._

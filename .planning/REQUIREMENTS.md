---
milestone: v0.0.9
milestone_name: Feature Completion & Cloudflare Deployment
created: 2026-04-23
status: scoped
total_requirements: 19
---

# Milestone v0.0.9 Requirements

Based on missing features from `docs/NFT_Marketplace_Functional_Spec.md` and user deployment request.

---

## Phase 26: Phase 23 UAT Gap Closure (P0 BLOCKER)

### Bug Fixes

- [x] **BUG-01**: Rarity filter buttons filter listings by selected rarity type (fix: single-quote syntax)
  - Phase: 26
  - Plan: 26-01
  - Source: Phase 23 UAT gap 1

- [x] **BUG-02**: After listing animal, user sees confirmation and listing appears in marketplace
  - Phase: 26
  - Plan: 26-02
  - Source: Phase 23 UAT gap 2

- [x] **BUG-03**: Same animal cannot be listed twice while previous listing active
  - Phase: 26
  - Plan: 26-03
  - Source: Phase 23 UAT gap 3

- [x] **BUG-04**: Clicking animal listing card shows detail page without 404 crash
  - Phase: 26
  - Plan: 26-04
  - Source: Phase 23 UAT gap 4

---

## Phase 27: Egg Rarity Upgrade System (P1)

From Spec Section 7.2 — Rarity Upgrade Paths

### Rarity Upgrade UI

- [ ] **RARITY-01**: User sees rarity probability indicator on egg cards based on food count
  - Phase: 27
  - Plan: 27-01
  - Spec: Section 7.2

- [ ] **RARITY-02**: User can open RarityUpgradeDialog from egg detail page
  - Phase: 27
  - Plan: 27-01
  - Spec: Section 7.2

- [ ] **RARITY-03**: User selects additional food items beyond 10 minimum for upgrade
  - Phase: 27
  - Plan: 27-01
  - Spec: Section 7.2

### Rarity Probability Thresholds

| Accumulated Food Items | Minimum Rarity Guaranteed |
| ---------------------- | ------------------------- |
| 10 items (minimum)     | Common                    |
| 50 items               | Rare                      |
| 200 items              | Epic                      |
| 500+ items             | Legendary (chance)        |

- [ ] **RARITY-04**: Backend validates egg ownership and food availability before upgrade
  - Phase: 27
  - Plan: 27-02
  - Spec: Section 7.2

- [ ] **RARITY-05**: Contract call succeeds and updates egg rarity probability
  - Phase: 27
  - Plan: 27-03
  - Spec: Section 7.2 (upgradeEggRarity function)

---

## Phase 28: Wallet Withdrawal & CoinStor Admin (P1)

From Spec Sections 9.2, 3.3, 9.3

### Wallet Withdrawal

- [ ] **WALLET-01**: User can withdraw USDT from platform wallet to external address
  - Phase: 28
  - Plan: 28-01
  - Spec: Section 9.2 (withdrawUSDT)

- [ ] **WALLET-02**: Withdrawal fee displayed before confirmation (configurable)
  - Phase: 28
  - Plan: 28-01, 28-02
  - Spec: Section 9.2

- [ ] **WALLET-03**: Transaction history shows past withdrawals
  - Phase: 28
  - Plan: 28-02
  - Spec: Section 9.2

### CoinStor Reserve Admin

- [ ] **COINSTOR-01**: Admin can view CoinStor balance in dashboard
  - Phase: 28
  - Plan: 28-03
  - Spec: Section 9.3 (getCoinStorBalance)

- [ ] **COINSTOR-02**: Admin can inject liquidity into marketplace pool
  - Phase: 28
  - Plan: 28-03
  - Spec: Section 9.3 (coinStorLiquidityInject)

- [ ] **COINSTOR-03**: Admin can distribute ecosystem rewards in batch
  - Phase: 28
  - Plan: 28-03
  - Spec: Section 9.3 (coinStorEcosystemReward)

---

## Phase 29: Admin Controls & Platform Safety (P1)

From Spec Section 12

### Admin Functions

- [ ] **ADMIN-01**: Admin can pause/unpause marketplace from dashboard
  - Phase: 29
  - Plan: 29-01, 29-03
  - Spec: Section 12 (pauseMarketplace/unpauseMarketplace)

- [ ] **ADMIN-02**: Admin can adjust platform fee percentage
  - Phase: 29
  - Plan: 29-01, 29-03
  - Spec: Section 12 (setPlatformFee)

- [ ] **ADMIN-03**: Admin can update rarity distribution weights
  - Phase: 29
  - Plan: 29-03
  - Spec: Section 12 (updateRarityWeights)

- [ ] **ADMIN-04**: Admin can set breeding cooldown duration
  - Phase: 29
  - Plan: 29-03
  - Spec: Section 12 (setBreedCooldown)

- [ ] **ADMIN-05**: Admin can toggle KYC requirement for withdrawals
  - Phase: 29
  - Plan: 29-02, 29-03
  - Spec: Section 12 (setKYCRequired)

- [ ] **ADMIN-06**: Admin dashboard shows platform stats (revenue, volume, users)
  - Phase: 29
  - Plan: 29-03
  - Spec: Section 12 (getPlatformStats)

---

## Phase 25: UX/UI Consistency Audit Fixes (P2)

From Phase 24 design system audit

### P0 Critical Fixes

- [ ] **UX-01**: Remove emoji usage per design system guidelines
  - Phase: 25
  - Plan: 25-01
  - Source: Design audit

- [ ] **UX-02**: Replace hardcoded colors with design tokens
  - Phase: 25
  - Plan: 25-01
  - Source: Design audit

- [ ] **UX-03**: Fix accessibility violations (WCAG 2.2 AA)
  - Phase: 25
  - Plan: 25-01
  - Source: Design audit

---

## Phase 30: Cloudflare Pages Frontend Deployment (P0 DEPLOY)

User request for frontend deployment automation

### Deployment Requirements

- [ ] **DEPLOY-01**: Frontend deploys automatically on push to main via GitHub Actions
  - Phase: 30
  - Plan: 30-02
  - Source: User request

- [ ] **DEPLOY-02**: Preview deployments created for PRs
  - Phase: 30
  - Plan: 30-02
  - Source: User request

- [ ] **DEPLOY-03**: Edge caching enabled for global performance
  - Phase: 30
  - Plan: 30-01
  - Source: User request

- [ ] **DEPLOY-04**: Custom domain bound (eggoworld.io)
  - Phase: 30
  - Plan: 30-01
  - Source: User request

- [ ] **DEPLOY-05**: Deployment time < 3 minutes
  - Phase: 30
  - Plan: 30-02
  - Source: User request

**Note:** Backend (PocketBase) and Wallet API are already hosted on VPS - no Cloudflare Workers migration needed.

---

## Traceability

| REQ-ID      | Phase | Plan         | Status |
| ----------- | ----- | ------------ | ------ |
| BUG-01      | 26    | 26-01        | scoped |
| BUG-02      | 26    | 26-02        | scoped |
| BUG-03      | 26    | 26-03        | scoped |
| BUG-04      | 26    | 26-04        | scoped |
| RARITY-01   | 27    | 27-01        | scoped |
| RARITY-02   | 27    | 27-01        | scoped |
| RARITY-03   | 27    | 27-01        | scoped |
| RARITY-04   | 27    | 27-02        | scoped |
| RARITY-05   | 27    | 27-03        | scoped |
| WALLET-01   | 28    | 28-01        | scoped |
| WALLET-02   | 28    | 28-01, 28-02 | scoped |
| WALLET-03   | 28    | 28-02        | scoped |
| COINSTOR-01 | 28    | 28-03        | scoped |
| COINSTOR-02 | 28    | 28-03        | scoped |
| COINSTOR-03 | 28    | 28-03        | scoped |
| ADMIN-01    | 29    | 29-01, 29-03 | scoped |
| ADMIN-02    | 29    | 29-01, 29-03 | scoped |
| ADMIN-03    | 29    | 29-03        | scoped |
| ADMIN-04    | 29    | 29-03        | scoped |
| ADMIN-05    | 29    | 29-02, 29-03 | scoped |
| ADMIN-06    | 29    | 29-03        | scoped |
| UX-01       | 25    | 25-01        | scoped |
| UX-02       | 25    | 25-01        | scoped |
| UX-03       | 25    | 25-01        | scoped |
| DEPLOY-01   | 30    | 30-02        | scoped |
| DEPLOY-02   | 30    | 30-02        | scoped |
| DEPLOY-03   | 30    | 30-01        | scoped |
| DEPLOY-04   | 30    | 30-01        | scoped |
| DEPLOY-05   | 30    | 30-02        | scoped |

---

## Out of Scope

- D1 database migration (future milestone consideration)
- Smart contract deployment automation
- Full serverless architecture (PocketBase remains on VPS)
- Recruitment bonus implementation (Phase 24-03 partially covers)
- Species catalog expansion (addNewSpecies admin function)

---

## Summary

| Phase     | Plans  | Requirements                     | Priority     |
| --------- | ------ | -------------------------------- | ------------ |
| 26        | 4      | 4 (BUG-01–04)                    | P0 (blocker) |
| 27        | 3      | 5 (RARITY-01–05)                 | P1           |
| 28        | 3      | 6 (WALLET-01–03, COINSTOR-01–03) | P1           |
| 29        | 3      | 6 (ADMIN-01–06)                  | P1           |
| 25        | 3      | 3 (UX-01–03)                     | P2           |
| 30        | 2      | 5 (DEPLOY-01–05)                 | P0 (deploy)  |
| **Total** | **17** | **29**                           | —            |

---

_Last updated: 2026-04-23 — Requirements scoped for v0.0.9. Phase 30 corrected: Frontend-only deployment (17 plans, 29 requirements). Backend/wallet-api already hosted on VPS._

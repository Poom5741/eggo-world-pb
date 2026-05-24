# NFT Marketplace Project

## Project Overview

**Name:** Egg × Food × Animal NFT Marketplace  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20) — _No native token, USDT for everything_  
**Team:** Solo Developer

## Vision

A gamified NFT marketplace on BSC where users buy, sell, and hatch digital animals. The ecosystem revolves around three core NFT types (Egg, Food, Animal) and uses USDT (BEP-20) as the native currency with a 4-level MLM referral commission structure.

## Current Milestone: v0.10.0 — Admin Treasury & Ownership

**Goal:** Give admin users the ability to accept contract ownership, monitor USDT pool balances across all contracts, and withdraw treasury funds.

**Target Features:**

| Feature                      | Priority | Description                                                                 |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| Contract ownership dashboard | P0       | Display ownership status for all 6 contracts (owner, pending owner, status) |
| Accept ownership             | P0       | Call `acceptOwnership()` on CommissionDistribution (Ownable2Step)           |
| USDT pool balance dashboard  | P0       | Show CoinStor (4%) + Treasury (46%/6%) + Total pool balances                |
| Withdraw treasury pool       | P0       | Admin withdraws USDT from treasury pool via `withdrawTreasury()`            |

**Scope note:** Withdraw sends USDT to the immutable treasury address (contract design). CoinStor (4%) pool withdrawal deferred — no contract function exists yet.

**Previous Milestone:** v0.9.0 Google OAuth Migration (✅ shipped 2026-05-19)

---

## Milestone Archive

### v0.2.0 — Functional Spec 100% Completion 🔄 ACTIVE

**Started:** 2026-04-25
**Phases:** 5 (32-36) planned
**Gaps:** 12 spec functions to implement

**What's Planned:**

- 📊 Marketplace stats API (floor price, 24h volume, active listings)
- 💰 Recruitment bonus USDT rewards with multipliers
- 🔀 VRF integration for verifiable randomness
- ⚙️ Admin game config (fee %, cooldown, rarity weights, species)
- 🔥 NFT burn function + KYC toggle

---

### v0.1.0 — UAT Gap Closure ✅ ARCHIVED

**Shipped:** 2026-04-25  
**Duration:** 1 day  
**Phases:** 1 (Phase 31)  
**Plans:** 3

**What Was Delivered:**

- ✅ Fixed polling badge visibility (minimum 2-second display duration)
- ✅ Fixed breeding dialog Parent 2 selection bug (defensive ID filtering)
- ✅ Fixed marketplace detail page routing (ID validation + server-side redirect)

**Human UAT Pending:** 3 tests in 31-HUMAN-UAT.md

**Key Patterns:**

- Minimum display duration: useState + useRef + useEffect for timeout management
- Defensive ID filtering: Use PocketBase record.id when blockchain token_id unreliable
- Server-side redirect: Next.js redirect() for invalid route params

---

### v0.0.9 — Feature Completion & Cloudflare Deployment ✅ ARCHIVED

**Shipped:** 2026-04-24  
**Duration:** 2 days  
**Phases:** 6 (25-30)

**What Was Delivered:**

- ✅ Rarity upgrade system (MAX_UPGRADE_FOOD=490, RarityUpgradeDialog)
- ✅ Wallet withdrawal (withdrawUSDT endpoint, withdrawal modal)
- ✅ Admin controls (platform pause/unpause, fee configuration)
- ✅ Cloudflare Pages deployment (static export, CI/CD)
- ✅ UAT bug fixes (Phase 26, 31)

---

### v0.0.8 — NFT Ecosystem Complete ✅ ARCHIVED

**Shipped:** 2026-04-22  
**Phases:** 5 (20-24)

**What Was Delivered:**

- ✅ Breeding system: Animal selection dialog, cooldown validation
- ✅ Tier rewards & badges: TierBadge.sol (ERC-5192), dashboard integration
- ✅ Secondary market: resale_listings, royalty distribution
- ✅ Admin dashboard: Error boundaries, monitoring
- ✅ Onboarding tutorial: Walkthrough overlay

---

### v0.0.7 — Security & Quality ✅ ARCHIVED

**Shipped:** 2026-04-22  
**Phases:** 8 (12-19)  
**Commits:** 119

**What Was Delivered:**

- ✅ Real smart contract integration (4 endpoints, 0xl3 testnet deployment)
- ✅ Complete NFT mint flow (contract → PocketBase → marketplace → Buy Now)
- ✅ LINE OAuth wallet auto-creation fix
- ✅ 80%+ test coverage (49 new tests)
- ✅ Feed & play features with daily check-in
- ✅ Gas sponsorship system with relayer wallet
- ✅ Mobile responsive + WCAG 2.2 AA compliance

---

### v0.0.6 — Frontend Migration & Integration ✅ ARCHIVED

**Shipped:** 2026-04-18  
**Audited:** 2026-04-19 (Final Audit: v0.0.6-FINAL-AUDIT.md)  
**Duration:** 13 days (2026-04-05 → 2026-04-18)

**What Was Delivered:**

- ✅ Claymorphism UI with Material Symbols icons
- ✅ LINE OAuth authentication flow
- ✅ Real-time wallet balance (exponential backoff 30s→5min)
- ✅ Buddy Chain referral visualization (G1 20%, G2-G4 10%)
- ✅ Egg management with feed/hatch flows
- ✅ NFT marketplace with buy/sell flows
- ✅ Smart contract integration (Phase 12)
- ✅ Mobile responsive polish (Phase 14)
- ✅ Feed feature with manual food selection (Phase 15)
- ✅ Documentation sync with traceability (Phase 13)

**Requirements Satisfied:** 19/19 scoped (100%)  
**Phases Completed:** 5/5 (8, 9, 10, 11, 13)  
**Final Audit:** `.planning/milestones/v0.0.6-FINAL-AUDIT.md`

---

## Requirements

### Validated (v0.7.0 — SHIPPED 2026-05-10)

- ✓ WALLET-01 (Phase 57) — Wallet balance polish with skeleton, fade-in, inline error, number formatting
- ✓ MINT-01 (Phase 54) — Production egg mint flow with error handling
- ✓ COMM-01 (Phase 55) — 4-level MLM commission distribution (25/15/10/5)
- ✓ FE-01 (Phase 56) — Mint page with payment flow and confirmation modal

**v0.7.0 Final Score:** 1/1 scoped requirements (100%)

### Active (v0.9.0 — Google OAuth Migration)

- [ ] **AUTH-01**: User can sign in with Google OAuth using PocketBase's built-in Google provider
- [ ] **AUTH-02**: First-time Google signup triggers automatic wallet creation (same flow as LINE)
- [ ] **AUTH-03**: Referral tracking works through Google OAuth flow
- [ ] **AUTH-04**: All LINE-specific files removed from codebase

### Previous Milestones (v0.0.6 — ARCHIVED)

- ✓ FOUND-01 → FOUND-06 (Phase 8) — Claymorphism UI, LINE OAuth, navigation
- ✓ FOUND-07 (Phase 9) — Wallet auto-polling
- ✓ DASH-01 → DASH-02 (Phase 9) — Dashboard balance + referrals
- ✓ EGG-01 → EGG-07 (Phase 10) — Egg management
- ✓ MKT-02 → MKT-04 (Phase 11) — Marketplace buy/sell flows

**v0.0.6 Final Score:** 19/19 scoped requirements (100%)

### Out of Scope

- Email/password authentication — Google OAuth only
- Multi-provider linking (LINE + Google for same user) — future milestone
- LINE OAuth preserved alongside Google — goal is replacement, not coexistence
- Mobile app — Web-first approach

---

## Key Decisions

| Decision                        | Phase  | Rationale                                                                                | Outcome                        |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------- | ------------------------------ |
| Material Symbols via Google CDN | 8      | 40KB, edge-cached, simpler than self-hosting                                             | ✅ Good                        |
| TDD workflow for all frontend   | 8      | Enforce test coverage, clean commits                                                     | ✅ 268 tests passing           |
| Exponential backoff polling     | 9      | Balance freshness vs API load                                                            | ✅ 30s→5min pattern reused     |
| Claymorphism design system      | 7      | Jules design requirement                                                                 | ✅ Distinctive visual identity |
| initialLoadComplete pattern     | 57     | Distinguish initial fetch from background polling (prevents skeleton flash)              | ✅ Good                        |
| Hydration-safe auth checks      | 8      | Prevent SSR mismatches                                                                   | ✅ `useIsHydrated()` pattern   |
| Google OAuth over LINE OAuth    | v0.9.0 | LINE OAuth has lower global adoption; Google OAuth more accessible for broader user base | 🔄 Implementing on dev branch  |

---

## Context

**Current state at v0.9.0 start:**

- **Frontend:** Complete claymorphism with mobile responsive polish, LINE OAuth login flow across all auth pages
- **Backend:** PocketBase with LINE OAuth (OIDC provider), auto-wallet hooks, real contract calls
- **Marketplace:** Full buy/sell functionality operational on testnet (Phase 58)
- **Integration:** E2E flows verified through v0.7.0 (Auth→Dashboard→Eggs→Marketplace→Feed)
- **Deployment:** Contracts on 0xl3 testnet (Phase 58). Mainnet deployment deferred.
- **Tests:** 268+ tests passing, 70%+ coverage
- **Branch:** Moving development to `dev` branch

**Known Issues (v0.0.7 Remaining):**

1. **USDT deposit tracking** — Event polling service not implemented (SEC-05 to SEC-08)
2. **Test setup** — 9 vi.mock failures (pre-existing, QUAL-01)
3. **Play feature** — Daily check-in reward system not implemented (FEAT-05 to FEAT-09)
4. **Test coverage** — Currently 70%, target 80%+ (QUAL-02)

**User Feedback:**

- Positive response to claymorphism design and hatch animation
- Buddy Chain visualization well-received for gamification
- Feed feature manual selection preferred over auto-fill (Phase 15 decision)

---

## Constraints

- **Budget:** Solo developer, limited gas fees for testing
- **Timeline:** 2-week milestones maximum
- **Tech:** Static export (Cloudflare Pages), no SSR/edge functions
- **Market:** Thai market focus, LINE OAuth required

---

## Current State (v0.10.0 — DEFINING REQUIREMENTS)

**Started:** 2026-05-24
**Branch:** `dev`
**Status:** Milestone initialized, defining requirements

**Context:**

- CommissionDistribution.sol is Ownable2Step — deployer called `transferOwnership()` but `acceptOwnership()` hasn't been called yet
- Treasury pool holds 46% of primary sale commissions + 6% of resale commissions
- CoinStor pool holds 4% of all commissions
- No existing admin page for ownership or treasury management
- New page at `/admin/treasury` with `requireAdmin` auth

**Known Issues (carried forward):**

1. **USDT deposit tracking** — Event polling service not implemented (SEC-05 to SEC-08)
2. **Test setup** — vi.mock failures (pre-existing, QUAL-01)
3. **Play feature** — Daily check-in reward system not fully implemented (FEAT-05 to FEAT-09)
4. **v0.8.0 deferred** — Phases 59-62 (marketplace E2E, withdraw, mainnet deploy, prod config) deferred

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-24 — v0.10.0 Admin Treasury & Ownership milestone started_

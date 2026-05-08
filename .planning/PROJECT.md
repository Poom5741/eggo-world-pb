# NFT Marketplace Project

## Project Overview

**Name:** Egg × Food × Animal NFT Marketplace  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20) — _No native token, USDT for everything_  
**Team:** Solo Developer

## Vision

A gamified NFT marketplace on BSC where users buy, sell, and hatch digital animals. The ecosystem revolves around three core NFT types (Egg, Food, Animal) and uses USDT (BEP-20) as the native currency with a 4-level MLM referral commission structure.

## Current Milestone: v0.6.0 Quick Production Release

**Status:** Active — Requirements definition started
**Goal:** Ship a production-ready release focusing on core money flows — egg minting and referral commission distribution

**Previous Milestone:** v0.5.0 Security Hardening & Production Readiness

### Target Features

| Feature                     | Priority | Description                                                                    |
| --------------------------- | -------- | ------------------------------------------------------------------------------ |
| Egg Mint Production Flow    | P0       | Ensure end-to-end egg mint flow is production-ready with proper error handling |
| Referral Commission Payouts | P0       | Ensure referral commissions distribute correctly and users can claim payouts   |
| Frontend for Money Flows    | P0       | UI pages and components for egg mint and commission claiming flows             |
| Production Hardening        | P1       | Monitoring, error recovery, final verification for money-related operations    |

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

### Validated (v0.0.6 — ARCHIVED)

- ✓ FOUND-01 → FOUND-06 (Phase 8) — Claymorphism UI, LINE OAuth, navigation
- ✓ FOUND-07 (Phase 9) — Wallet auto-polling
- ✓ DASH-01 → DASH-02 (Phase 9) — Dashboard balance + referrals
- ✓ EGG-01 → EGG-07 (Phase 10) — Egg management
- ✓ MKT-02 → MKT-04 (Phase 11) — Marketplace buy/sell flows

**v0.0.6 Final Score:** 19/19 scoped requirements (100%)  
**Deferred to v0.0.7:** MKT-01/05/06, MOB-01/02/03/04/05

### Active (v0.0.7 — In Progress)

**Security (P0):**

- ✅ SEC-01 → SEC-04 (Phase 12) — Real blockchain contract calls
- ⏸️ SEC-05 → SEC-08 (Phase 13) — USDT deposit tracking (pending)

**Quality (P1):**

- ✅ QUAL-03 → QUAL-06 (Phase 14) — Mobile responsive polish, WCAG 2.2 AA
- ✅ FEAT-01 → FEAT-04 (Phase 15) — Feed feature with manual selection
- ⏸️ QUAL-01 → QUAL-02 (Phase 16) — Test infrastructure, coverage 80%+ (pending)

**Features (P2):**

- ⏸️ FEAT-05 → FEAT-09 (Phase 16) — Play feature, daily check-in (pending)

### Out of Scope

- Email/password authentication — LINE OAuth only
- Mobile app — Web-first approach
- Multi-language support — Thai initially
- Dark mode toggle — Single theme for v0.0.6

---

## Key Decisions

| Decision                        | Phase | Rationale                                    | Outcome                        |
| ------------------------------- | ----- | -------------------------------------------- | ------------------------------ |
| Material Symbols via Google CDN | 8     | 40KB, edge-cached, simpler than self-hosting | ✅ Good                        |
| TDD workflow for all frontend   | 8     | Enforce test coverage, clean commits         | ✅ 268 tests passing           |
| Exponential backoff polling     | 9     | Balance freshness vs API load                | ✅ 30s→5min pattern reused     |
| Claymorphism design system      | 7     | Jules design requirement                     | ✅ Distinctive visual identity |
| Auto-wallet creation on signup  | 4     | Remove blockchain complexity                 | ✅ Seamless UX                 |
| Hydration-safe auth checks      | 8     | Prevent SSR mismatches                       | ✅ `useIsHydrated()` pattern   |

---

## Context

**Current state after v0.0.6 archival:**

- Frontend: Complete claymorphism migration with mobile responsive polish
- Backend: PocketBase with LINE OAuth, auto-wallet hooks, real contract calls
- Marketplace: Full buy/sell functionality operational
- Integration: All E2E flows verified (Auth→Dashboard→Eggs→Marketplace→Feed)
- Mobile: WCAG 2.2 AA compliant, 5 breakpoints tested, touch targets 44x44px

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

## Current State (v0.0.7 Shipped)

**Shipped:** 2026-04-22  
**Duration:** 5 days (2026-04-18 → 2026-04-22)  
**Commits:** 119

### What Shipped

- ✅ Real smart contract integration (4 endpoints, 0xl3 testnet deployment)
- ✅ Complete NFT mint flow (contract → PocketBase → marketplace → Buy Now)
- ✅ LINE OAuth wallet auto-creation fix
- ✅ 80%+ test coverage (49 new tests)
- ✅ Feed & play features with daily check-in
- ✅ Gas sponsorship system with relayer wallet
- ✅ Mobile responsive + WCAG 2.2 AA compliance

### Known Gaps (Phase 20) → NOW v0.0.8

- Feed-egg foodCount validation
- 10 UAT scenarios (manual testing required)
- Gas sponsorship documentation
- Empty state UI for /eggs page

### Active Milestone: v0.0.8 NFT Ecosystem Complete

**Phases:** 20-24 (5 phases planned)

1. **Phase 20: Gap Closure & UAT** — Complete deferred validation, documentation, UAT execution
2. **Phase 21: Breeding System** — Animal breeding mechanics, cooldowns, fees
3. **Phase 22: Tier Rewards** — Seedling/Grower/Farmer badges with USDT rewards
4. **Phase 23: Secondary Market** — Animal NFT resale with royalties
5. **Phase 24: Polish & Launch Prep** — Production hardening, monitoring, onboarding

<details>
<summary>Previous State (v0.0.6 Archived)</summary>

## Previous State

**v0.0.6 Frontend Migration & Integration** (Shipped: 2026-04-18)

- Claymorphism UI migration with Material Symbols icons
- Real-time wallet with exponential backoff polling
- Buddy Chain referral visualization
- Egg management with feed/hatch flows
- NFT marketplace with complete buy/sell flows
- Mobile responsive polish with WCAG 2.2 AA compliance

</details>

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

_Last updated: 2026-05-08 — v0.6.0 Quick Production Release milestone started_

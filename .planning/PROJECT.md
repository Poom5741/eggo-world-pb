# NFT Marketplace Project

## Project Overview

**Name:** Egg × Food × Animal NFT Marketplace  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20) — _No native token, USDT for everything_  
**Team:** Solo Developer

## Vision

A gamified NFT marketplace on BSC where users buy, sell, and hatch digital animals. The ecosystem revolves around three core NFT types (Egg, Food, Animal) and uses USDT (BEP-20) as the native currency with a 4-level MLM referral commission structure.

## Core Game Loop

```
BUY EGG NFT (25 USDT)
      │
      ▼
RECEIVE 2× FOOD NFTs (bonus)
      │
      ▼
BUY MORE FOOD NFTs (0.50 USDT each)
      │
      ▼
FEED EGG 10 FOOD ITEMS → HATCH
      │
      ▼
RECEIVE ANIMAL NFT (random rarity)
      │
      ▼
SELL / HOLD / BREED on Marketplace
```

## Key Features

### NFT Types

1. **Egg NFT** (25 USDT) — Comes with 2 Food NFTs bonus, requires 10 food to hatch
2. **Food NFT** (0.50 USDT) — Consumable to feed eggs, 4 types (Grain, Fish, Insects, Herbs)
3. **Animal NFT** — Hatched from eggs, 4 rarity tiers (Common 60%, Rare 25%, Epic 12%, Legendary 3%)

### Referral System (4-Level MLM)

- **G1** (Direct referrer): 20% commission
- **G2**: 10% commission
- **G3**: 10% commission
- **G4**: 10% commission
- **Total payout**: 50% of Egg NFT sale ($12.50 from $25)

### CoinStor Reserve

- 4% of every transaction goes to platform reserve
- Used for: liquidity, ecosystem rewards, emergency payouts

## Technical Stack

**Frontend:** Next.js 16 (Bun runtime, static export for Cloudflare Pages)

- shadcn/ui components, Tailwind CSS 4
- PocketBase client for auth
- Ethers v6 / dacc-js for wallet interactions

**Backend:** PocketBase

- LINE OAuth authentication
- Auto-wallet creation hooks
- User and NFT metadata storage

**Wallet API:** Express.js (TypeScript, Bun runtime)

- Wallet generation with dacc-js v0.0.5
- USDT balance management
- Transaction signing

**Smart Contracts:** Foundry (Solidity 0.8.20)

- ERC-1155 NFT contracts (Egg, Food, Animal)
- Marketplace contract with escrow
- Commission distribution engine
- USDT (BEP-20) integration

**Infrastructure:**

- Docker for PocketBase
- Nginx reverse proxy
- BSC testnet/mainnet deployment

---

## Current State: v0.0.6 SHIPPED ✅

**Shipped:** 2026-04-18  
**Milestone:** Frontend Migration & Integration  
**Duration:** 13 days (2026-04-05 → 2026-04-18)

### What Was Delivered

**Phases Completed:** 5 phases (14 plans, 25 tasks)

1. **Claymorphism UI** — Modern design with Material Symbols icons, responsive navigation
2. **Real-time Wallet** — Auto-polling USDT balance with exponential backoff (30s→5min)
3. **Buddy Chain Referrals** — 4-level visualization (G1 20%, G2-G4 10%)
4. **Egg Management** — Feed/hatch flows with 12-second animation sequence
5. **NFT Marketplace** — Complete buy/sell flows with USDT approval and escrow
6. **Documentation** — Updated REQUIREMENTS.md with accurate traceability

**Requirements Satisfied:** 25/25 (100% of v0.0.6 scope)

### Current Codebase State

- **LOC:** ~60K TypeScript/JavaScript
- **Tests:** 268/277 passing (9 pre-existing setup issues)
- **Build:** 2.5s (Bun)
- **Deployment:** Static export for Cloudflare Pages

---

## Current Milestone: v0.0.7 Security & Quality

**Goal:** Address technical debt, improve security, and complete mobile polish

**Target features:**

- **Security (P0):** Replace 4 mock blockchain endpoints in wallet-api with real ethers.js contract calls
- **Quality (P1):** Fix 9 vi.mock test failures, implement track-deposit hook (USDT polling)
- **Mobile Polish (P2):** Responsive breakpoints (320px-1440px), touch interactions, wire Feed/Play buttons
- **Features (P2):** Complete remaining marketplace features, implement Feed feature

---

## Requirements

### Validated (v0.0.6)

- ✓ FOUND-01 → FOUND-06 (Phase 8) — Claymorphism UI, LINE OAuth, navigation
- ✓ FOUND-07 (Phase 9) — Wallet auto-polling
- ✓ DASH-01 → DASH-05 (Phase 9) — Dashboard components
- ✓ EGG-01 → EGG-07 (Phase 10) — Egg management
- ✓ MKT-01 → MKT-06 (Phase 11) — Marketplace with buy/sell

### Active (v0.0.7)

Requirements being defined — see REQUIREMENTS.md

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

**Current state after v0.0.6:**

- Frontend: Complete claymorphism migration with TDD
- Backend: PocketBase with LINE OAuth, auto-wallet hooks
- Marketplace: Full buy/sell functionality operational
- Integration: All E2E flows verified (Auth→Dashboard→Eggs→Marketplace)

**Known Issues:**

1. **Mock blockchain calls** — 4 wallet-api endpoints need real implementation
2. **Test setup** — 9 vi.mock failures (pre-existing, not v0.0.6 regressions)
3. **Feed/Play buttons** — TODO in UI, functionality deferred
4. **Track deposit hook** — Not implemented, tests in RED PHASE

**User Feedback:**

- Initial testing shows positive response to claymorphism design
- Buddy Chain visualization well-received for gamification
- Hatch animation praised for building anticipation

---

## Constraints

- **Budget:** Solo developer, limited gas fees for testing
- **Timeline:** 2-week milestones maximum
- **Tech:** Static export (Cloudflare Pages), no SSR/edge functions
- **Market:** Thai market focus, LINE OAuth required

---

_Last updated: 2026-04-18 — Milestone v0.0.7 Security & Quality started_

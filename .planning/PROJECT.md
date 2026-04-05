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

## Current Milestone: v0.0.6 Frontend Migration & Integration

**Goal:** Replace current frontend with Jules-generated claymorphism design using TDD while maintaining full backend integration

**Target features:**

- Modern claymorphism UI with Material Symbols icons
- LINE OAuth authentication with new Join/Login pages
- Dashboard with real-time USDT balance and referral tracking
- Egg management (view, feed, hatch) with smart contract integration
- Marketplace with buy/sell flows and commission display
- Mobile-responsive navigation (TopNav, SideNav, BottomNav)
- Full test coverage using TDD (Red→Green→Refactor cycles)

**Development Approach:**

- Test-Driven Generation for all phases
- Each phase: red (test) → green (implement) → refactor commits
- Preserve existing backend endpoints and PocketBase collections
- Maintain LINE OAuth single-click flow
- Support static export for Cloudflare Pages

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

_Last updated: 2026-04-05 — v0.0.6 Frontend Migration started_

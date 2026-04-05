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

## Current State (v0.0.5 — Shipped 2026-04-05)

### ✅ Shipped in v0.0.5

**Smart Contracts:**

- MockUSDT, CommissionDistribution, AnimalNFT, EggNFT, FoodNFT deployed to 0XL3 testnet
- All cross-contract authorizations configured
- 147/147 Forge tests passing

**Backend:**

- PocketBase event sync hook with block polling (30s interval)
- Crash recovery via lastProcessedBlock tracking
- 5 event handlers (EggMinted, FoodMinted, AnimalMinted, EggHatched, CommissionDistributed)

**Frontend:**

- 17 routes rendering correctly
- Full user flow: Buy Egg → Buy Food → Feed → Hatch → List → Sell
- Auto-polling wallet balance with useWalletPoll hook
- Product detail pages + referral dashboard

**Auth & Wallet:**

- LINE OAuth integration with single-click login
- TypeScript + dacc-js v0.0.5 wallet API migration
- Auto-wallet creation on signup (20-char random password)
- Header with user avatar, name, wallet, navigation

**UI/UX:**

- Claymorphism redesign complete (hybrid "Clay Frames, Pixel Content")
- 12+ UI components with clay variants
- 14+ pages redesigned
- WCAG 2.1 AA compliant, 60 FPS performance

**Testing:**

- 63 tests passing across auth, wallet, dashboard flows
- Build passes clean

### 🎯 Next Milestone Focus

**Candidate areas:**

- Breeding & Tiers mechanics
- Admin dashboard & analytics
- Secondary market royalties
- Performance optimization
- Additional game features

---

## Constraints

**Technical Constraints:**

- Must use USDT (BEP-20), no native token
- Static export for Cloudflare Pages deployment
- LINE OAuth for authentication (Thai market)
- BSC network only (no multi-chain initially)

---

## Key Decisions (v0.0.5)

| Decision                         | Rationale                                 | Outcome                           |
| -------------------------------- | ----------------------------------------- | --------------------------------- |
| Hybrid claymorphism UI           | Modern containers showcase pixel art NFTs | ✅ Good — clear visual hierarchy  |
| Direct LINE OAuth initiation     | Eliminate double-click friction           | ✅ Good — single-click flow works |
| dacc-js over ethers v6           | LINE Wallet integration requirement       | ✅ Good — working integration     |
| PocketBase event sync            | Blockchain → DB synchronization           | ✅ Good — crash recovery works    |
| Default redirect to `/dashboard` | Post-auth UX clarity                      | ✅ Good — users see their data    |

---

## References

- **Design System:** `.planning/DESIGN_SYSTEM.md`
- **Milestone Archive:** `.planning/milestones/v0.0.5-ROADMAP.md`
- **Reference Implementation:** `resources/mvp-foodcourt/` (for patterns only)

---

_Last updated: 2026-04-05 after v0.0.5 Claymorphism UI Launch_

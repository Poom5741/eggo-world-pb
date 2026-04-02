# NFT Marketplace Project

## Project Overview

**Name:** Egg × Food × Animal NFT Marketplace  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20) - *No native token, USDT for everything*  
**Timeline:** Urgent (< 2 weeks)  
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
1. **Egg NFT** (25 USDT) - Comes with 2 Food NFTs bonus, requires 10 food to hatch
2. **Food NFT** (0.50 USDT) - Consumable to feed eggs, 4 types (Grain, Fish, Insects, Herbs)
3. **Animal NFT** - Hatched from eggs, 4 rarity tiers (Common 60%, Rare 25%, Epic 12%, Legendary 3%)

### Referral System (4-Level MLM)
- **G1** (Direct referrer): 20% commission
- **G2**: 10% commission
- **G3**: 10% commission
- **G4**: 10% commission
- **Total payout**: 50% of Egg NFT sale ($12.50 from $25)

### CoinStor Reserve
- 4% of every transaction goes to platform reserve
- Used for: liquidity, ecosystem rewards, emergency payouts

### Tier Rewards
- **Tier 1** (10 food items): $5 USDT + "Seedling" badge
- **Tier 2** (100 food items): $50 USDT + "Grower" badge
- **Tier 3** (1000 food items): $500 USDT + "Farmer" badge

## Technical Stack

**Frontend:** Next.js 16 (Bun runtime, static export for Cloudflare Pages)
- shadcn/ui components, Tailwind CSS 4
- PocketBase client for auth
- Ethers v6 for wallet interactions

**Backend:** PocketBase
- LINE OAuth authentication
- Auto-wallet creation hooks
- User and NFT metadata storage

**Wallet API:** Express.js service
- Wallet generation endpoint
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

## Current State

**Existing Infrastructure:**
- ✅ Next.js frontend with LINE OAuth
- ✅ PocketBase backend with wallet hooks
- ✅ Express.js wallet API
- ✅ Foundry smart contract setup
- ✅ Reference implementation (resources/mvp-foodcourt)

**To Build:**
- ❌ NFT smart contracts (Egg, Food, Animal)
- ❌ Marketplace contract with commission engine
- ❌ USDT integration (no native token)
- ❌ MLM referral tracking
- ❌ Hatching/breeding mechanics
- ❌ Tier reward system
- ❌ Frontend marketplace UI
- ❌ Admin dashboard

## Constraints

**Timeline:** < 2 weeks (urgent)
**Team:** Solo developer
**Budget:** Not specified

**Technical Constraints:**
- Must use USDT (BEP-20), no native token
- Static export for Cloudflare Pages deployment
- LINE OAuth for authentication (Thai market)
- BSC network only (no multi-chain initially)

## Success Criteria

**MVP (Week 1-2):**
- [ ] Users can register with LINE OAuth + referral
- [ ] Users can buy Egg NFTs (25 USDT) and receive 2 Food NFTs bonus
- [ ] Users can buy Food NFTs (0.50 USDT)
- [ ] Users can feed eggs and hatch Animal NFTs
- [ ] Marketplace for listing/buying NFTs with USDT
- [ ] 4-level referral commission distribution in USDT
- [ ] CoinStor 4% fee collection
- [ ] Basic wallet balance display

**Post-MVP:**
- [ ] Animal breeding mechanics
- [ ] Tier rewards and badges
- [ ] Admin dashboard
- [ ] Advanced rarity upgrades
- [ ] Secondary market royalties

## References

- **Functional Spec:** `docs/NFT_Marketplace_Functional_Spec.md`
- **Codebase Map:** `.planning/codebase/` (7 documents)
- **Reference Implementation:** `resources/mvp-foodcourt/` (for patterns only)

## Notes

- This project uses the existing eggo-pocketbase infrastructure
- resources/mvp-foodcourt is a REFERENCE ONLY, not the actual project
- USDT for everything - no native token economics
- Target users: NFT Collectors and gamers
- Thai market focus (LINE OAuth)

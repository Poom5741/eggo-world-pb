# NFT Marketplace — Functional Design Specification
### ALLICOIN Ecosystem | Egg × Food × Animal NFT Platform

> **Version:** 1.0 — Draft
> **Based on:** Client conceptual notes
> **Token:** ALLICOIN
> **Primary Currency:** USDT

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [NFT Types & Properties](#2-nft-types--properties)
3. [ALLICOIN Token Mechanics](#3-allicoin-token-mechanics)
4. [Marketplace Functions](#4-marketplace-functions)
5. [Referral & MLM Commission System](#5-referral--mlm-commission-system)
6. [Commission Distribution Engine](#6-commission-distribution-engine)
7. [Hatching & Breeding Mechanics](#7-hatching--breeding-mechanics)
8. [Reward Tier System](#8-reward-tier-system)
9. [Wallet & CoinStor Functions](#9-wallet--coinstor-functions)
10. [Smart Contract Function List](#10-smart-contract-function-list)
11. [User-Facing Functions](#11-user-facing-functions)
12. [Admin & Platform Functions](#12-admin--platform-functions)
13. [Data Models](#13-data-models)
14. [Commission Flow Summary](#14-commission-flow-summary)

---

## 1. System Overview

The platform is a **gamified NFT Marketplace** built on blockchain where users buy, sell, and hatch digital animals. The ecosystem revolves around three core NFT types (Egg, Food, Animal) and a native token (ALLICOIN). Revenue from NFT sales is distributed through a 4-level MLM referral commission structure. The game loop is: **Buy Egg NFT → Feed with Food NFTs → Hatch into Animal NFT → Trade on Marketplace**.

```
GAME LOOP
─────────────────────────────────────────────────────────
  BUY EGG NFT (25 USDT)
       │
       ▼
  RECEIVE FOOD NFTs (2 items included)
       │
       ▼
  BUY MORE FOOD NFTs (0.50 USDT each) via Marketplace
       │
       ▼
  ACCUMULATE 10 FOOD ITEMS → HATCH EGG
       │
       ▼
  RECEIVE ANIMAL NFT (random rarity)
       │
       ▼
  SELL / HOLD / BREED on Marketplace (priced in ALLICOIN)
─────────────────────────────────────────────────────────
```

**Platform currency flow:**
- Users pay in **USDT**
- Commissions distributed in **ALLICOIN (FIX type)**
- ALLICOIN accumulates in wallet → converts to **A% (liquid ALLICOIN)** once threshold met
- Platform retains **4%** of all transactions → **CoinStor** reserve pool

---

## 2. NFT Types & Properties

### 2.1 Egg NFT

| Property | Value |
|---|---|
| Purchase Price | **25 USDT** |
| Listed Price (resale floor) | 1 USDT |
| Market Price (resale) | 1.20 USDT |
| Included Items on Mint | 2× Food NFT |
| Hatch Requirement | 10 Food NFTs consumed |
| Token Standard | ERC-1155 or equivalent |

**Properties stored on-chain:**
- `egg_id` — unique identifier
- `owner_address`
- `food_count` — number of food items consumed (0–10)
- `is_hatched` — boolean
- `hatch_timestamp`
- `rarity_seed` — random seed for Animal NFT generation
- `referral_chain` — array of 4 upstream wallet addresses (G1→G4)

**`mintEggNFT(buyer_address, referrer_address)`**
1. Verify payment of 25 USDT from buyer
2. Mint 1 Egg NFT to buyer wallet
3. Auto-mint 2 Food NFTs to buyer wallet (bonus)
4. Record `referral_chain[0]` = referrer_address
5. Traverse referral chain to populate G2, G3, G4
6. Trigger `distributeEggCommission(sale_amount=25, referral_chain)`
7. Emit event `EggMinted(egg_id, buyer, referrer)`

---

### 2.2 Food NFT

| Property | Value |
|---|---|
| Listed Price | **0.50 USDT** |
| Market Price | **0.60 USDT** |
| Purpose | Feed Egg NFT to progress toward hatching |
| Token Standard | ERC-1155 (fungible batch) |

**Properties:**
- `food_id`
- `food_type` — (e.g., Grain, Fish, Insects — for cosmetic rarity of resulting Animal)
- `owner_address`
- `is_consumed` — boolean

**`mintFoodNFT(buyer_address, quantity, referrer_address)`**
1. Verify payment of `0.50 USDT × quantity`
2. Mint `quantity` Food NFTs to buyer
3. Trigger `distributeFoodCommission(sale_amount=0.50 × quantity, referral_chain)`
4. Emit `FoodMinted(food_ids[], buyer)`

**`feedEgg(egg_id, food_ids[])`**
1. Verify caller owns both `egg_id` and all `food_ids[]`
2. Verify `egg.is_hatched == false`
3. Burn each Food NFT in `food_ids[]`
4. Increment `egg.food_count += len(food_ids[])`
5. If `egg.food_count >= 10` → trigger `hatchEgg(egg_id)`
6. Emit `EggFed(egg_id, food_ids[], new_food_count)`

---

### 2.3 Animal NFT

| Property | Value |
|---|---|
| Minted By | Hatching only (not purchasable directly) |
| Marketplace Price | Set by owner in ALLICOIN |
| Rarity Tiers | Common / Rare / Epic / Legendary |

**Properties:**
- `animal_id`
- `species` — determined by rarity_seed + food_type history
- `rarity` — Common / Rare / Epic / Legendary
- `owner_address`
- `hatch_date`
- `generation` — Gen 0 (from Egg NFT), Gen 1+ (from breeding)
- `parent_egg_id`

**Rarity Distribution (suggested):**

| Rarity | Probability | Estimated Market Value |
|---|---|---|
| Common | 60% | 5–15 USDT |
| Rare | 25% | 15–50 USDT |
| Epic | 12% | 50–200 USDT |
| Legendary | 3% | 200–500 USDT |

---

## 3. ALLICOIN Token Mechanics

ALLICOIN is the native platform token. It has two states:

### 3.1 FIX ALLICOIN
- Commissions are distributed as **FIX ALLICOIN** — locked tokens held in the recipient's wallet
- FIX ALLICOIN cannot be transferred or traded immediately
- They accumulate until the wallet reaches the **A% Conversion Threshold**

### 3.2 A% (Liquid ALLICOIN)
- Once a wallet's FIX balance reaches the conversion threshold, FIX tokens **automatically convert to A% (liquid)** ALLICOIN
- A% ALLICOIN can be used to buy NFTs on the marketplace, transferred, or withdrawn

**`convertFIXtoLiquid(wallet_address)`**
1. Read `wallet.fix_allicoin_balance`
2. If balance >= `CONVERSION_THRESHOLD` (platform-configurable):
   - Move entire FIX balance to `wallet.liquid_allicoin_balance`
   - Set `wallet.fix_allicoin_balance = 0`
   - Emit `ALLICOINConverted(wallet, amount)`

### 3.3 CoinStor Reserve
- 4% of every transaction (USDT or ALLICOIN) is deposited into the **CoinStor** platform reserve
- CoinStor funds are used for: platform liquidity, buybacks, ecosystem rewards, emergency payouts
- **`depositToCoinStor(amount)`** — called automatically by all sale functions

---

## 4. Marketplace Functions

### 4.1 `listNFTForSale(nft_id, nft_type, price_usdt, price_allicoin)`
- Owner lists an NFT (Egg, Food, or Animal) on the marketplace
- Sets a floor price (listed price) and/or ALLICOIN price
- Transfers NFT to marketplace escrow contract
- Emits `NFTListed(nft_id, seller, price)`

### 4.2 `buyNFT(nft_id, payment_method)`
- `payment_method` = USDT or ALLICOIN
- Verifies buyer has sufficient balance
- Routes payment through commission engine
- Transfers NFT from escrow to buyer
- Emits `NFTSold(nft_id, buyer, seller, price)`

### 4.3 `cancelListing(nft_id)`
- Returns NFT from escrow to seller wallet
- Emits `ListingCancelled(nft_id, seller)`

### 4.4 `updateListingPrice(nft_id, new_price)`
- Updates the asking price of a listed NFT
- Only callable by original lister

### 4.5 `getMarketplaceListings(filter)`
- Returns paginated list of active listings
- Filters: `nft_type`, `price_range`, `rarity`, `sort_by`

### 4.6 `getMarketStats()`
- Returns: floor price, 24h volume, total sales, active listings count

---

## 5. Referral & MLM Commission System

The system supports **4 levels of referrers** (G1 → G2 → G3 → G4). Each user must be registered with a referrer to participate.

### 5.1 Referral Chain Registration

**`registerUser(user_address, referrer_address)`**
1. Verify `referrer_address` is a registered user
2. Record `user.upline_G1 = referrer_address`
3. Look up referrer's upline: `user.upline_G2 = G1.upline_G1`
4. Continue: `user.upline_G3 = G2.upline_G1`
5. Continue: `user.upline_G4 = G3.upline_G1`
6. Store full `referral_chain[G1, G2, G3, G4]` on user record
7. Emit `UserRegistered(user_address, referral_chain[])`

### 5.2 MLM Level Structure

```
YOU (buyer)
  │
  ├── G1 (Direct referrer)      → 20% commission on Egg NFT sale
  │
  ├── G2 (G1's referrer)        → 10% commission
  │
  ├── G3 (G2's referrer)        → 10% commission
  │
  └── G4 (G3's referrer)        → 10% commission
```

**Total referral payout per $25 Egg NFT sale = 50% = $12.50**

### 5.3 Downline Recruitment Bonus Table

When YOU recruit new users who go on to purchase Egg NFTs, you earn Food NFT bonuses and ALLICOIN rewards based on your total downline size:

| Your Total Recruits (G1 Direct) | Food Items Rewarded | Multiplier | Bonus (10 items tier) | Bonus (100 items tier) | Bonus (1000 items tier) |
|---|---|---|---|---|---|
| 10 recruits | 1 Food NFT | ×2 | $10 | $100 | $1,000 |
| 100 recruits | 1 Food NFT | ×4 | $20 | $200 | $2,000 |
| 1,000 recruits | 1 Food NFT | ×6 | $30 | $300 | $3,000 |
| 10,000 recruits | 1 Food NFT | ×10 | $50 | $500 | $5,000 |

*(Numbers in parentheses from notes represent cumulative/adjusted reward values)*

**`calculateRecruitmentBonus(user_address)`**
1. Count `user.total_direct_recruits`
2. Look up bonus tier from table above
3. Mint bonus Food NFTs to user wallet
4. Calculate ALLICOIN reward based on active items in tier
5. Credit ALLICOIN (FIX) to user wallet
6. Trigger `convertFIXtoLiquid()` check

---

## 6. Commission Distribution Engine

### 6.1 Egg NFT Commission ($25 sale)

```
$25.00  TOTAL SALE
├── $5.00   (20%) → G1 Wallet as ALLICOIN FIX
├── $2.50   (10%) → G2 Wallet as ALLICOIN FIX
├── $2.50   (10%) → G3 Wallet as ALLICOIN FIX
├── $2.50   (10%) → G4 Wallet as ALLICOIN FIX
├── $1.00   (4%)  → CoinStor Reserve
└── $11.50  (46%) → Platform / Liquidity Pool
```

**`distributeEggCommission(sale_amount, referral_chain[])`**
1. Calculate each level's cut:
   - `G1_amount = sale_amount × 0.20`
   - `G2_amount = sale_amount × 0.10`
   - `G3_amount = sale_amount × 0.10`
   - `G4_amount = sale_amount × 0.10`
   - `platform_fee = sale_amount × 0.04`
2. If `referral_chain[i]` is null (no upline at that level), redirect to platform pool
3. Convert USDT amounts to ALLICOIN at current FIX rate
4. Credit ALLICOIN FIX to each upline wallet
5. Deposit `platform_fee` to CoinStor
6. Trigger `convertFIXtoLiquid()` check for each credited wallet
7. Emit `CommissionDistributed(sale_id, amounts[], recipients[])`

---

### 6.2 Food NFT Commission ($0.50 per item → from $4.00 pool example)

When Food NFTs are purchased, a secondary commission is paid from the transaction:

```
$4.00  FOOD NFT BATCH PURCHASE (example: 8 items × $0.50)
├── $0.80   (20%) → G1 Wallet as ALLICOIN FIX
├── $0.40   (10%) → G2 Wallet as ALLICOIN FIX
├── $0.40   (10%) → G3 Wallet as ALLICOIN FIX
├── $0.40   (10%) → G4 Wallet as ALLICOIN FIX
└── Remainder    → Platform
```

**`distributeFoodCommission(sale_amount, referral_chain[])`**
- Same logic as `distributeEggCommission` but applied to food sale amount
- Emits `FoodCommissionDistributed(sale_id, amounts[], recipients[])`

---

### 6.3 Secondary Marketplace Sale Commission

When a user resells an Animal/Egg NFT on secondary market:

**`distributeResaleCommission(sale_amount, seller, original_referral_chain[])`**
1. Calculate royalties: 10% of resale → original referral chain
2. Apply same 4-level split (2%, 1%, 1%, 1% of total sale as royalties)
3. Seller receives `sale_amount × 0.85` (after platform 4% + 10% royalty + 1% misc)
4. Emit `ResaleCommissionDistributed(...)`

---

## 7. Hatching & Breeding Mechanics

### 7.1 Egg Hatching

**`hatchEgg(egg_id)`**
1. Verify `egg.food_count >= 10`
2. Verify `egg.is_hatched == false`
3. Generate `rarity_seed` using VRF (Verifiable Random Function) or block hash
4. Determine `rarity` from rarity distribution table
5. Determine `species` based on food types consumed
6. Mint 1 Animal NFT to egg owner:
   - `animal.parent_egg_id = egg_id`
   - `animal.generation = 0`
   - `animal.rarity = derived_rarity`
   - `animal.species = derived_species`
7. Mark `egg.is_hatched = true`
8. Emit `EggHatched(egg_id, animal_id, rarity, species)`

### 7.2 Rarity Upgrade Paths

| Accumulated Food Items | Minimum Rarity Guaranteed |
|---|---|
| 10 items (minimum) | Common |
| 50 items | Rare |
| 200 items | Epic |
| 500+ items | Legendary (chance) |

**`upgradeEggRarity(egg_id, extra_food_ids[])`**
- Feed additional food beyond minimum 10 to improve rarity odds
- Each extra food item adds a weighted bonus to `rarity_seed`
- Emits `EggUpgraded(egg_id, new_food_count, new_rarity_probability)`

### 7.3 Animal Breeding (Generation 1+)

**`breedAnimals(animal_id_1, animal_id_2)`**
1. Verify caller owns both animals
2. Verify neither animal is currently breeding
3. Lock both animals for `BREED_COOLDOWN` period (e.g., 48 hours)
4. Pay breeding fee (in ALLICOIN)
5. Generate offspring rarity = `max(parent1.rarity, parent2.rarity)` with variance
6. Mint 1 new Animal NFT with `generation = max(gen1, gen2) + 1`
7. Emit `AnimalsBreed(animal_id_1, animal_id_2, offspring_id)`

---

## 8. Reward Tier System

Users earn tiered rewards based on total Food NFT items accumulated (bought or earned).

### 8.1 Tier Thresholds

| Tier | Food Items Required | ALLICOIN Reward | Description |
|---|---|---|---|
| Tier 1 — Seedling | 10 | $5 equivalent | Basic hatcher |
| Tier 2 — Grower | 100 | $50 equivalent | Active participant |
| Tier 3 — Farmer | 1,000 | $500 equivalent | Power user |

### 8.2 `checkAndGrantTierReward(user_address)`
1. Read `user.lifetime_food_items`
2. Check against tier thresholds
3. If new tier reached and not yet claimed:
   - Credit ALLICOIN equivalent to user wallet (FIX type)
   - Record `user.highest_tier_reached`
   - Emit `TierRewardGranted(user, tier, reward_amount)`
4. Trigger `convertFIXtoLiquid()` check

### 8.3 Tier Badge NFTs

Upon reaching each tier, users are minted a **non-transferable Badge NFT** (soulbound):
- Tier 1 Badge: "Seedling 🌱"
- Tier 2 Badge: "Grower 🌿"
- Tier 3 Badge: "Farmer 🌾"

**`mintTierBadge(user_address, tier)`**
- Mints soulbound ERC-5192 token (non-transferable)
- Grants cosmetic in-game benefits

---

## 9. Wallet & CoinStor Functions

### 9.1 User Wallet Structure

```
UserWallet {
  address:                  wallet_address
  usdt_balance:             float
  fix_allicoin_balance:     float      ← locked commissions
  liquid_allicoin_balance:  float      ← spendable ALLICOIN (A%)
  total_earned_allicoin:    float      ← lifetime stats
  conversion_threshold:     float      ← set by platform (configurable)
  referral_chain:           address[4] ← [G1, G2, G3, G4]
  total_direct_recruits:    int
  lifetime_food_items:      int
  highest_tier_reached:     int (0–3)
}
```

### 9.2 Wallet Functions

**`getWalletBalance(user_address)`**
- Returns USDT, FIX ALLICOIN, liquid ALLICOIN balances

**`withdrawUSDT(user_address, amount)`**
- Withdraw USDT to external wallet
- Requires KYC verification (if applicable)
- Deducts `WITHDRAWAL_FEE` (platform configurable)

**`spendLiquidALLICOIN(user_address, amount, purpose)`**
- Used for NFT purchases, breeding fees, upgrades
- Decrements `liquid_allicoin_balance`

**`transferALLICOIN(from, to, amount)`**
- Peer-to-peer ALLICOIN transfer (liquid only)
- FIX ALLICOIN cannot be transferred

### 9.3 CoinStor Reserve Functions

**`getCoinStorBalance()`**
- Returns total CoinStor reserve in USDT and ALLICOIN

**`coinStorBuyback(amount_usdt)`** *(Admin only)*
- Uses CoinStor USDT to buy ALLICOIN from market
- Supports token price stability

**`coinStorLiquidityInject(amount)`** *(Admin only)*
- Injects liquidity into marketplace pool from reserve

**`coinStorEcosystemReward(recipient[], amounts[])`** *(Admin only)*
- Batch distribute ecosystem rewards from CoinStor

---

## 10. Smart Contract Function List

### Core NFT Contract
| Function | Description |
|---|---|
| `mintEggNFT(buyer, referrer)` | Mint Egg NFT + 2 food bonus |
| `mintFoodNFT(buyer, qty, referrer)` | Mint Food NFTs |
| `feedEgg(egg_id, food_ids[])` | Feed food to egg |
| `hatchEgg(egg_id)` | Hatch egg into Animal NFT |
| `upgradeEggRarity(egg_id, food_ids[])` | Extra food for better rarity |
| `breedAnimals(id1, id2)` | Breed two animals |
| `mintTierBadge(user, tier)` | Mint soulbound badge |
| `burnNFT(nft_id)` | Destroy NFT (admin/owner) |

### Marketplace Contract
| Function | Description |
|---|---|
| `listNFTForSale(nft_id, type, price)` | List for sale |
| `buyNFT(nft_id, payment_method)` | Purchase listed NFT |
| `cancelListing(nft_id)` | Delist NFT |
| `updateListingPrice(nft_id, price)` | Edit price |
| `getMarketplaceListings(filter)` | Browse listings |
| `getMarketStats()` | Platform stats |

### Commission Contract
| Function | Description |
|---|---|
| `distributeEggCommission(amount, chain[])` | Pay 4-level egg referral |
| `distributeFoodCommission(amount, chain[])` | Pay 4-level food referral |
| `distributeResaleCommission(amount, chain[])` | Pay resale royalties |
| `calculateRecruitmentBonus(user)` | Compute downline bonus |

### Token / Wallet Contract
| Function | Description |
|---|---|
| `registerUser(user, referrer)` | Register + set upline chain |
| `convertFIXtoLiquid(wallet)` | FIX → A% conversion |
| `getWalletBalance(user)` | Read balances |
| `withdrawUSDT(user, amount)` | External withdrawal |
| `spendLiquidALLICOIN(user, amount, purpose)` | Spend liquid tokens |
| `transferALLICOIN(from, to, amount)` | P2P transfer |
| `depositToCoinStor(amount)` | 4% fee → reserve |
| `getCoinStorBalance()` | Read reserve |
| `checkAndGrantTierReward(user)` | Check tier upgrade |

### Admin Contract
| Function | Description |
|---|---|
| `setConversionThreshold(amount)` | Configure FIX → A% threshold |
| `setPlatformFee(percent)` | Set CoinStor fee % |
| `setPriceOracle(oracle_address)` | Update USDT/ALLICOIN rate feed |
| `pauseMarketplace()` | Emergency pause |
| `unpauseMarketplace()` | Resume |
| `coinStorBuyback(amount)` | Token buyback |
| `coinStorLiquidityInject(amount)` | Add liquidity |
| `coinStorEcosystemReward(recipients[], amounts[])` | Batch reward |
| `updateRarityWeights(weights[])` | Adjust drop rates |
| `setBreedCooldown(seconds)` | Configure breed timer |

---

## 11. User-Facing Functions

These are the primary actions available to end users through the dApp interface:

### Onboarding
- **Register** with referral link → `registerUser()`
- **Connect Wallet** (MetaMask / compatible)
- **Deposit USDT** to platform wallet

### Shopping
- **Browse Marketplace** → `getMarketplaceListings()`
- **Buy Egg NFT** (25 USDT) → `mintEggNFT()`
- **Buy Food NFT** (0.50 USDT each) → `mintFoodNFT()`
- **Buy Animal NFT** (secondary market) → `buyNFT()`

### Game Actions
- **Feed My Egg** → `feedEgg(egg_id, food_ids[])`
- **Hatch My Egg** (when food_count ≥ 10) → `hatchEgg(egg_id)`
- **Upgrade Egg Rarity** (extra food) → `upgradeEggRarity()`
- **Breed Animals** (2 animals + fee) → `breedAnimals()`

### Selling
- **List NFT for Sale** → `listNFTForSale()`
- **Cancel Listing** → `cancelListing()`
- **Update Price** → `updateListingPrice()`

### Earnings
- **View Wallet** → `getWalletBalance()`
- **View Referral Tree** → `getUserReferralStats()`
- **Claim Tier Reward** → `checkAndGrantTierReward()`
- **Withdraw USDT** → `withdrawUSDT()`

---

## 12. Admin & Platform Functions

| Category | Function | Description |
|---|---|---|
| Token | `setConversionThreshold` | Adjust FIX → liquid threshold |
| Token | `setPriceOracle` | Update ALLICOIN/USDT rate feed |
| Fees | `setPlatformFee` | Change CoinStor % |
| Reserve | `coinStorBuyback` | Token price support |
| Reserve | `coinStorLiquidityInject` | Add marketplace liquidity |
| Reserve | `coinStorEcosystemReward` | Distribute ecosystem grants |
| Game | `updateRarityWeights` | Balance drop rates |
| Game | `setBreedCooldown` | Adjust breeding wait time |
| Game | `addNewSpecies` | Expand Animal NFT catalog |
| Safety | `pauseMarketplace` | Emergency stop |
| Safety | `unpauseMarketplace` | Resume operations |
| KYC | `setKYCRequired(bool)` | Toggle KYC for withdrawals |
| Reporting | `getPlatformStats` | Revenue, volume, users |

---

## 13. Data Models

### NFT: Egg
```json
{
  "egg_id": "UUID",
  "owner_address": "0x...",
  "mint_timestamp": 1234567890,
  "food_count": 0,
  "max_food": 10,
  "is_hatched": false,
  "hatch_timestamp": null,
  "rarity_seed": null,
  "referral_chain": ["0xG1", "0xG2", "0xG3", "0xG4"],
  "mint_price_usdt": 25.00
}
```

### NFT: Food
```json
{
  "food_id": "UUID",
  "food_type": "grain | fish | insect | herb",
  "owner_address": "0x...",
  "is_consumed": false,
  "consumed_by_egg_id": null,
  "mint_price_usdt": 0.50
}
```

### NFT: Animal
```json
{
  "animal_id": "UUID",
  "owner_address": "0x...",
  "species": "Dragon | Wolf | Phoenix | ...",
  "rarity": "Common | Rare | Epic | Legendary",
  "generation": 0,
  "parent_egg_id": "UUID",
  "parent_animal_ids": null,
  "hatch_date": "2025-01-01",
  "breed_count": 0,
  "breed_cooldown_until": null,
  "image_uri": "ipfs://..."
}
```

### User
```json
{
  "address": "0x...",
  "registered_at": 1234567890,
  "upline_G1": "0x...",
  "upline_G2": "0x...",
  "upline_G3": "0x...",
  "upline_G4": "0x...",
  "total_direct_recruits": 0,
  "lifetime_food_items": 0,
  "highest_tier_reached": 0,
  "fix_allicoin_balance": 0.0,
  "liquid_allicoin_balance": 0.0,
  "usdt_balance": 0.0,
  "total_earned_allicoin": 0.0,
  "kyc_verified": false
}
```

---

## 14. Commission Flow Summary

### Per $25 Egg NFT Sale

```
$25.00 received
│
├─ $5.00  → G1 wallet (ALLICOIN FIX, 20%)
├─ $2.50  → G2 wallet (ALLICOIN FIX, 10%)
├─ $2.50  → G3 wallet (ALLICOIN FIX, 10%)
├─ $2.50  → G4 wallet (ALLICOIN FIX, 10%)
├─ $1.00  → CoinStor reserve (4%)
└─ $11.50 → Platform operations (46%)

ALLICOIN FIX in wallet
  │
  └─ When balance ≥ THRESHOLD
       └─ Auto-converts → Liquid ALLICOIN (A%)
            └─ Can spend in marketplace or withdraw
```

### Per $0.50 Food NFT Sale

```
$0.50 received
│
├─ $0.10  → G1 wallet (ALLICOIN FIX, 20%)
├─ $0.05  → G2 wallet (ALLICOIN FIX, 10%)
├─ $0.05  → G3 wallet (ALLICOIN FIX, 10%)
├─ $0.05  → G4 wallet (ALLICOIN FIX, 10%)
├─ $0.02  → CoinStor reserve (4%)
└─ $0.23  → Platform (46%)
```

---

*End of Functional Design Specification v1.0*
*This document is intended for developer handoff and smart contract architecture planning.*

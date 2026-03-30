# Food NFT Minting & Consumption System - Implementation Plan

**Generated:** 2026-03-30  
**Status:** Pending Review  
**Phase:** Phase 4 - Food NFT System

---

## Executive Summary

Implement a Food NFT system for the EggoWorld platform where users can mint Food NFTs for 0.50 USDT each, feed them to Egg NFTs to progress toward hatching, and trigger commission distributions. Food NFTs use ERC-1155 fungible standard with batch minting support, random food type assignment (Grain/Fish/Insects/Herb), and burn-on-consumption mechanics.

---

## Requirements Summary

### Functional Requirements
- ✅ User can mint Food NFTs for 0.50 USDT each
- ✅ Support batch minting (multiple Food NFTs in single transaction)
- ✅ Food type randomly assigned on mint (Grain/Fish/Insects/Herb) for cosmetic rarity
- ✅ Commission distribution triggered on mint (20% G1, 10% G2, 10% G3, 10% G4)
- ✅ Event emitted: `FoodMinted(food_ids[], buyer)`
- ✅ Food NFT burned when fed to egg
- ✅ Egg NFT tracks which food types were consumed
- ✅ Integration test: Mint food and feed to egg

### Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token Standard | ERC-1155 Fungible | Batch minting, gas efficient, quantity-based |
| Food Type Assignment | Random on Mint | Gamification, surprise element |
| Consumption Model | Burn on Feed | Simple, gas efficient, clear state |
| Contract Architecture | Separate Contract | Clean separation, maintainability |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  apps/web/ - Next.js Frontend                                   │
│  - /marketplace/food (mint page)                                │
│  - /dashboard/eggs/{id}/feed (feeding UI)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POCKETBASE BACKEND                         │
│  apps/backend/                                                   │
│  - Collections: food_nfts, egg_consumption_logs                 │
│  - Hooks: 13-mint-food-nft.pb.js, 14-feed-egg.pb.js             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       WALLET API                                │
│  wallet-api/server.js                                           │
│  - POST /api/wallet/mint-food                                   │
│  - POST /api/wallet/feed-egg                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SMART CONTRACTS                             │
│  contracts/src/                                                  │
│  - FoodNFT.sol (ERC-1155)                                       │
│  - EggNFT.sol (modified - add consumption tracking)             │
│  - CommissionDistribution.sol (reuse existing)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Work Breakdown Structure

### Phase 4.1: Smart Contract Development

#### 4.1.1 Create FoodNFT Contract
**File:** `contracts/src/FoodNFT.sol`

**Responsibilities:**
- ERC-1155 fungible token implementation
- Single token ID for all Food NFTs (quantity-based)
- Random food type assignment on mint
- Burn mechanism for consumption
- Commission integration

**Key Structures:**
```solidity
enum FoodType {
    Grain,    // Common (40%)
    Fish,     // Uncommon (30%)
    Insects,  // Rare (20%)
    Herb      // Epic (10%)
}

struct FoodProperties {
    uint256 food_id;
    address owner;
    FoodType food_type;
    bool is_consumed;
    uint256 consumed_by_egg_id;
}
```

**Key Functions:**
```solidity
// Mint Food NFTs (batch)
function mintFood(address buyer, uint256 quantity, address referrer) 
    external 
    returns (uint256[] memory food_ids)

// Feed egg (burns food NFTs)
function feedEgg(
    uint256 egg_token_id,
    uint256[] calldata food_ids,
    address eggNftContract
) external

// Get food properties
function getFoodProperties(uint256 food_id) 
    external 
    view 
    returns (
        uint256 food_id,
        address owner,
        FoodType food_type,
        bool is_consumed,
        uint256 consumed_by_egg_id
    )

// Get food type distribution
function getFoodTypeDistribution(uint256[] calldata food_ids)
    external
    view
    returns (uint256 grain, uint256 fish, uint256 insects, uint256 herb)
```

**Events:**
```solidity
event FoodMinted(uint256[] food_ids, address indexed buyer, uint256 quantity);
event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
event FoodTypeAssigned(uint256 food_id, FoodType food_type);
```

**Pricing:**
- LISTED_PRICE: 0.50 USDT (500000000000000000 wei, 18 decimals)
- MARKET_PRICE: 0.60 USDT (600000000000000000 wei, 18 decimals)

**Food Type Distribution:**
```solidity
function _assignRandomFoodType(uint256 food_id) internal view returns (FoodType) {
    uint256 random = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        food_id
    ))) % 100;
    
    if (random < 40) return FoodType.Grain;      // 0-39 (40%)
    else if (random < 70) return FoodType.Fish;  // 40-69 (30%)
    else if (random < 90) return FoodType.Insects; // 70-89 (20%)
    else return FoodType.Herb;                   // 90-99 (10%)
}
```

---

#### 4.1.2 Modify EggNFT Contract
**File:** `contracts/src/EggNFT.sol`

**Changes Required:**
1. Add food consumption tracking
2. Add food type history
3. Modify `hatchEgg` to require 10 food items consumed
4. Add interface for FoodNFT contract

**New Structures:**
```solidity
struct EggProperties {
    uint256 egg_id;
    address owner;
    uint256 food_count;        // Number of food items consumed
    bool is_hatched;
    uint256 rarity_seed;
    address[4] referral_chain;
    mapping(uint256 => FoodType) food_type_history; // NEW: Track food types
}
```

**New Functions:**
```solidity
// Record food consumption (called by FoodNFT contract)
function recordFoodConsumption(
    uint256 egg_token_id,
    uint256[] calldata food_ids,
    FoodType[] calldata food_types
) external onlyFoodNFTContract

// Get food type history
function getFoodTypeHistory(uint256 egg_token_id)
    external
    view
    returns (FoodType[] memory)
```

**Modified Functions:**
```solidity
function hatchEgg(uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    
    EggProperties storage props = _eggProperties[tokenId];
    require(!props.is_hatched, "Egg already hatched");
    require(props.food_count >= 10, "Not enough food consumed"); // NEW
    
    props.is_hatched = true;
    
    emit EggHatched(tokenId);
}
```

---

#### 4.1.3 Update CommissionDistribution Contract
**File:** `contracts/src/CommissionDistribution.sol`

**Changes Required:**
- No changes needed (already supports generic commission distribution)
- Add FoodNFT contract to authorized callers

**Add:**
```solidity
function setFoodNFTContract(address _foodNFT) external {
    require(msg.sender == owner, "Only owner can set");
    require(_foodNFT != address(0), "FoodNFT address cannot be zero");
    foodNFTContract = _foodNFT;
    emit FoodNFTContractSet(_foodNFT);
}
```

---

#### 4.1.4 Create Smart Contract Tests
**File:** `contracts/test/FoodNFT.t.sol`

**Test Categories:**
1. Deployment validation
2. Mint single Food NFT
3. Mint batch Food NFTs (10, 50, 100)
4. Food type random distribution
5. Feed egg functionality
6. Burn on consumption
7. Commission distribution on food mint
8. Egg food count tracking
9. Food type history tracking
10. Cannot feed already hatched egg
11. Cannot feed food you don't own
12. Hatch egg with 10 food items
13. Cannot hatch with <10 food items
14. Event emission validation
15. Full integration flow (mint food → feed egg → hatch)

**Example Test:**
```solidity
function test_BatchMintFood() public {
    vm.startPrank(buyer);
    mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
    
    uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
    vm.stopPrank();
    
    assertEq(food_ids.length, 10, "Should mint 10 Food NFTs");
    
    // Verify ownership
    for (uint256 i = 0; i < food_ids.length; i++) {
        (, address owner,,,) = foodNFT.getFoodProperties(food_ids[i]);
        assertEq(owner, buyer);
    }
}

function test_FeedEggAndBurn() public {
    // Mint egg
    vm.prank(buyer);
    uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
    
    // Mint 10 food items
    vm.startPrank(buyer);
    mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
    uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
    
    // Feed egg
    foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    vm.stopPrank();
    
    // Verify egg food count
    (,,,uint256 food_count,,) = eggNFT.getEggProperties(egg_token_id);
    assertEq(food_count, 10, "Egg should have 10 food items");
    
    // Verify food NFTs are burned
    for (uint256 i = 0; i < food_ids.length; i++) {
        (,,,bool is_consumed,) = foodNFT.getFoodProperties(food_ids[i]);
        assertTrue(is_consumed, "Food should be consumed");
    }
}
```

---

#### 4.1.5 Create Deployment Script
**File:** `contracts/script/DeployFoodNFT.s.sol`

**Deployment Steps:**
1. Deploy FoodNFT contract
2. Set EggNFT contract address in FoodNFT
3. Set FoodNFT contract address in EggNFT
4. Set FoodNFT in CommissionDistribution
5. Verify contracts on BSCScan

**Command:**
```bash
cd contracts
forge script script/DeployFoodNFT.s.sol \
  --rpc-url bsc_testnet \
  --broadcast \
  --verify \
  --slow
```

---

### Phase 4.2: Database Schema

#### 4.2.1 Create food_nfts Collection
**File:** `apps/backend/collections/food_nfts.json`

**Schema:**
```json
{
  "name": "food_nfts",
  "type": "base",
  "system": false,
  "schema": [
    {
      "name": "food_id",
      "type": "number",
      "required": true,
      "unique": true,
      "options": { "min": 0 }
    },
    {
      "name": "token_id",
      "type": "number",
      "required": true,
      "unique": false,
      "options": { "min": 0 }
    },
    {
      "name": "owner",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1
      }
    },
    {
      "name": "food_type",
      "type": "select",
      "required": true,
      "options": {
        "values": ["grain", "fish", "insects", "herb"]
      }
    },
    {
      "name": "is_consumed",
      "type": "bool",
      "required": true,
      "default": false
    },
    {
      "name": "consumed_by_egg",
      "type": "relation",
      "required": false,
      "options": {
        "collectionId": "egg_nfts",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1
      }
    },
    {
      "name": "contract_address",
      "type": "text",
      "required": true,
      "options": { "pattern": "^0x[a-fA-F0-9]{40}$" }
    },
    {
      "name": "tx_hash",
      "type": "text",
      "required": true,
      "unique": false,
      "options": { "pattern": "^0x[a-fA-F0-9]{64}$" }
    },
    {
      "name": "minted_at",
      "type": "date",
      "required": true
    }
  ],
  "indexes": [
    "CREATE INDEX idx_food_nfts_owner ON food_nfts (owner)",
    "CREATE INDEX idx_food_nfts_is_consumed ON food_nfts (is_consumed)",
    "CREATE INDEX idx_food_nfts_food_type ON food_nfts (food_type)"
  ],
  "listRule": "@request.auth.id != \"\" && owner = @request.auth.id",
  "viewRule": "@request.auth.id != \"\" && owner = @request.auth.id",
  "createRule": null,
  "updateRule": "@request.auth.id != \"\" && owner = @request.auth.id",
  "deleteRule": null
}
```

---

#### 4.2.2 Create egg_consumption_logs Collection
**File:** `apps/backend/collections/egg_consumption_logs.json`

**Schema:**
```json
{
  "name": "egg_consumption_logs",
  "type": "base",
  "system": false,
  "schema": [
    {
      "name": "egg",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "egg_nfts",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1
      }
    },
    {
      "name": "food_items",
      "type": "json",
      "required": true,
      "options": {}
    },
    {
      "name": "food_type_distribution",
      "type": "json",
      "required": false,
      "options": {}
    },
    {
      "name": "total_food_count",
      "type": "number",
      "required": true,
      "options": { "min": 0 }
    },
    {
      "name": "fed_at",
      "type": "date",
      "required": true
    }
  ],
  "indexes": [
    "CREATE INDEX idx_consumption_egg ON egg_consumption_logs (egg)"
  ],
  "listRule": "@request.auth.id != \"\" && egg.owner = @request.auth.id",
  "viewRule": "@request.auth.id != \"\" && egg.owner = @request.auth.id",
  "createRule": null,
  "updateRule": null,
  "deleteRule": "@request.auth.id != \"\" && egg.owner = @request.auth.id"
}
```

---

#### 4.2.3 Update users Collection
**File:** `apps/backend/collections/users.json`

**Add Fields:**
```json
{
  "name": "food_nft_count",
  "type": "number",
  "required": false,
  "options": { "min": 0 }
},
{
  "name": "total_food_consumed",
  "type": "number",
  "required": false,
  "options": { "min": 0 }
}
```

---

### Phase 4.3: Backend Hooks

#### 4.3.1 Create Mint Food NFT Hook
**File:** `apps/backend/pb_hooks/13-mint-food-nft.pb.js`

**Endpoint:** `POST /api/v2/mint-food`

**Request:**
```json
{
  "quantity": 10,
  "referrer_id": "user_id"
}
```

**Flow:**
1. Authenticate user
2. Validate USDT balance (quantity × 0.50 USDT)
3. Build referral chain
4. Call wallet-api mint-food endpoint
5. Create food_nfts records (one per food item)
6. Deduct USDT from buyer
7. Create commission_records
8. Update user food_nft_count
9. Return success with food IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "food_ids": [1, 2, 3, 4, 5],
    "tx_hash": "0x...",
    "total_cost": "5.00",
    "food_type_distribution": {
      "grain": 2,
      "fish": 2,
      "insects": 1,
      "herb": 0
    }
  }
}
```

---

#### 4.3.2 Create Feed Egg Hook
**File:** `apps/backend/pb_hooks/14-feed-egg.pb.js`

**Endpoint:** `POST /api/v2/feed-egg`

**Request:**
```json
{
  "egg_token_id": 1,
  "food_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**Flow:**
1. Authenticate user
2. Verify user owns egg NFT
3. Verify user owns all food NFTs
4. Verify egg not hatched
5. Call wallet-api feed-egg endpoint
6. Update egg_nfts food_count
7. Mark food_nfts as consumed
8. Create egg_consumption_logs record
9. Update user total_food_consumed
10. Return success

**Response:**
```json
{
  "success": true,
  "data": {
    "egg_token_id": 1,
    "new_food_count": 10,
    "ready_to_hatch": true,
    "tx_hash": "0x...",
    "food_type_distribution": {
      "grain": 4,
      "fish": 3,
      "insects": 2,
      "herb": 1
    }
  }
}
```

---

### Phase 4.4: Wallet API

#### 4.4.1 Add Mint Food Endpoint
**File:** `wallet-api/server.js`

**Endpoint:** `POST /api/wallet/mint-food`

**Request:**
```json
{
  "wallet": "0x...",
  "daccPublicKey": "0x...",
  "pin": "encrypted_pin",
  "quantity": 10,
  "referrer": "0x...",
  "foodNftAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "food_ids": [1, 2, 3, 4, 5],
    "status": "pending_blockchain_confirmation"
  }
}
```

---

#### 4.4.2 Add Feed Egg Endpoint
**File:** `wallet-api/server.js`

**Endpoint:** `POST /api/wallet/feed-egg`

**Request:**
```json
{
  "wallet": "0x...",
  "daccPublicKey": "0x...",
  "pin": "encrypted_pin",
  "egg_token_id": 1,
  "food_ids": [1, 2, 3, 4, 5],
  "foodNftAddress": "0x...",
  "eggNftAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "pending_blockchain_confirmation"
  }
}
```

---

### Phase 4.5: Frontend Implementation

#### 4.5.1 Create Food Marketplace Page
**File:** `apps/web/app/marketplace/food/page.tsx`

**Features:**
- Display Food NFT price (0.50 USDT)
- Quantity selector (1-100)
- User USDT balance display
- Referrer ID input (optional)
- Mint button with validation
- Success modal with food type distribution
- Recent food mints history

**UI Components:**
```tsx
<FoodMintingCard>
  <PriceDisplay price="0.50" currency="USDT" />
  <QuantitySelector min={1} max={100} />
  <TotalCost quantity={10} price={0.50} />
  <ReferrerInput optional={true} />
  <MintButton />
  <FoodTypeDistributionPreview />
</FoodMintingCard>
```

---

#### 4.5.2 Create Feed Egg Page
**File:** `apps/web/app/dashboard/eggs/[id]/feed/page.tsx`

**Features:**
- Egg NFT display with current food count
- User's available Food NFTs grid
- Multi-select for food items
- "Feed Selected" button
- Confirmation modal
- Success state with food type distribution
- Progress to hatching (X/10)

**UI Components:**
```tsx
<EggFeedInterface>
  <EggProgressCard 
    egg_id={1} 
    food_count={7} 
    max_food={10} 
  />
  <FoodNFTGrid 
    food_items={user_food_nfts}
    onSelect={(id) => setSelected(id)}
    multiSelect={true}
  />
  <FeedButton 
    disabled={selectedFood.length === 0}
    onClick={handleFeed}
  />
</EggFeedInterface>
```

---

#### 4.5.3 Create Food NFT Card Component
**File:** `apps/web/components/food-nft/FoodCard.tsx`

**Props:**
```typescript
interface FoodCardProps {
  food: {
    food_id: number;
    token_id: number;
    food_type: 'grain' | 'fish' | 'insects' | 'herb';
    is_consumed: boolean;
    minted_at: string;
  };
  onSelect?: (id: number) => void;
  selected?: boolean;
  disableSelection?: boolean;
}
```

**Features:**
- Food type badge with color coding
- Grain: Yellow 🌾
- Fish: Blue 🐟
- Insects: Green 🦗
- Herb: Purple 🌿
- Consumed status overlay
- Selection checkbox for feeding

---

#### 4.5.4 Create useFoodNft Hook
**File:** `apps/web/hooks/use-food-nft.ts`

**Functions:**
```typescript
function useFoodNft() {
  return {
    loading: boolean,
    error: string | null,
    mintFood: (quantity: number, referrerId?: string) => Promise<MintResult | null>,
    feedEgg: (egg_token_id: number, food_ids: number[]) => Promise<FeedResult | null>,
    getUserFoodNfts: (userId: string) => Promise<FoodNFT[]>,
    getFoodTypeDistribution: (food_ids: number[]) => Promise<Distribution>,
    getTotalFoodConsumed: (userId: string) => Promise<number>
  }
}
```

---

#### 4.5.5 Update Eggs Dashboard
**File:** `apps/web/app/dashboard/eggs/page.tsx`

**Changes:**
- Add "Feed" button to EggCard
- Show food count progress (X/10)
- Show "Ready to Hatch" badge when food_count >= 10
- Link to feed page

---

### Phase 4.6: Testing

#### 4.6.1 Smart Contract Tests
**Command:**
```bash
cd contracts
forge test
forge test --gas-report
forge test --match-test test_FeedEgg
```

**Coverage Target:** >90%

---

#### 4.6.2 Backend Hook Tests
**File:** `apps/backend/pb_hooks/13-mint-food-nft.pb.js.test.js`

**Test Cases:**
1. Mint 1 Food NFT
2. Mint 10 Food NFTs (batch)
3. Insufficient USDT balance
4. Invalid referrer ID
5. Commission distribution
6. Feed egg with valid food
7. Feed already hatched egg
8. Feed food you don't own

**Run:**
```bash
cd apps/backend
bun test
```

---

#### 4.6.3 Frontend Tests
**File:** `apps/web/components/food-nft/FoodCard.test.tsx`

**Test Cases:**
1. Render FoodCard with all food types
2. Selection functionality
3. Disabled state for consumed food
4. Click handlers

**Run:**
```bash
cd apps/web
bun test
```

---

#### 4.6.4 Integration Test
**File:** `contracts/test/FoodIntegration.t.sol`

**Full Flow Test:**
```solidity
function test_FullFoodFlow() public {
    // 1. User mints Egg NFT
    vm.prank(buyer);
    uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
    
    // 2. User mints 10 Food NFTs
    vm.startPrank(buyer);
    mockUSDT.approve(address(foodNFT), 5 * 10); // 0.50 * 10
    uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
    
    // 3. Feed egg
    foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    
    // 4. Verify egg has 10 food
    (,,,uint256 food_count,,) = eggNFT.getEggProperties(egg_token_id);
    assertEq(food_count, 10);
    
    // 5. Hatch egg
    eggNFT.hatchEgg(egg_token_id);
    (,,,bool is_hatched,,) = eggNFT.getEggProperties(egg_token_id);
    assertTrue(is_hatched);
    
    vm.stopPrank();
}
```

---

## Migration Plan

### Database Migrations

**1. Create food_nfts Collection:**
```bash
cd apps/backend
# Export schema to JSON
# Import via PocketBase Admin UI or migration script
```

**2. Create egg_consumption_logs Collection:**
```bash
# Same process as above
```

**3. Update users Collection:**
```bash
# Add food_nft_count and total_food_consumed fields
```

---

### Environment Variables

**Contracts (.env):**
```bash
FOOD_NFT_ADDRESS=0x...  # After deployment
EGG_NFT_ADDRESS=0x...    # Existing
COMMISSION_DISTRIBUTION_ADDRESS=0x...  # Existing
USDT_ADDRESS=0x...       # Existing
```

**PocketBase:**
```bash
# Add to PocketBase settings via Admin UI
foodNftContractAddress=0x...
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_FOOD_NFT_ADDRESS=0x...
NEXT_PUBLIC_EGG_NFT_ADDRESS=0x...
```

**Wallet API (.env):**
```bash
FOOD_NFT_ADDRESS=0x...
EGG_NFT_ADDRESS=0x...
```

---

## Deployment Checklist

### Smart Contracts
- [ ] Deploy FoodNFT to BSC Testnet
- [ ] Set EggNFT address in FoodNFT
- [ ] Set FoodNFT address in EggNFT
- [ ] Set FoodNFT in CommissionDistribution
- [ ] Verify contracts on BSCScan
- [ ] Run integration tests on testnet
- [ ] Deploy to BSC Mainnet
- [ ] Update all environment variables

---

### Backend
- [ ] Create food_nfts collection
- [ ] Create egg_consumption_logs collection
- [ ] Update users collection
- [ ] Deploy hook 13-mint-food-nft.pb.js
- [ ] Deploy hook 14-feed-egg.pb.js
- [ ] Test endpoints with Postman
- [ ] Update PocketBase settings with contract addresses

---

### Wallet API
- [ ] Add /api/wallet/mint-food endpoint
- [ ] Add /api/wallet/feed-egg endpoint
- [ ] Test with local blockchain
- [ ] Deploy to production
- [ ] Update URLs in PocketBase hooks

---

### Frontend
- [ ] Create /marketplace/food page
- [ ] Create /dashboard/eggs/[id]/feed page
- [ ] Create FoodCard component
- [ ] Create useFoodNft hook
- [ ] Update Eggs dashboard
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with testnet contracts
- [ ] Deploy to production

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Smart contract bugs | High | Medium | Comprehensive testing, audit |
| Food type RNG manipulation | Medium | Low | Use block.prevrandao + seed |
| Commission calculation errors | High | Low | Reuse existing distribution logic |
| Frontend hydration issues | Medium | Medium | Follow existing patterns |
| Database schema migration | Low | Low | Test on staging first |
| Gas price spikes | Medium | High | Batch operations, optimize gas |

---

## Security Considerations

### Smart Contracts
- ✅ Access control on sensitive functions
- ✅ ReentrancyGuard on mint and feed
- ✅ Input validation on all functions
- ✅ Event emissions for tracking
- ✅ No private key exposure

### Backend
- ✅ Authentication required on all endpoints
- ✅ Input validation on quantity and food_ids
- ✅ Ownership verification before feeding
- ✅ Transaction hash uniqueness
- ✅ USDT balance checks

### Frontend
- ✅ Hydration safety checks
- ✅ Auth state management
- ✅ Error handling on all API calls
- ✅ Loading states for UX
- ✅ Confirmation modals for irreversible actions

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| 4.1 Smart Contracts | Development, testing, deployment | 3-4 days |
| 4.2 Database Schema | Collections, migrations | 0.5 days |
| 4.3 Backend Hooks | Hook development, testing | 1-2 days |
| 4.4 Wallet API | Endpoints, testing | 0.5-1 day |
| 4.5 Frontend | Pages, components, hooks | 2-3 days |
| 4.6 Testing | Integration tests, E2E | 1-2 days |
| **Total** | | **8-12 days** |

---

## Acceptance Criteria Validation

| Criterion | Status | Validation Method |
|-----------|--------|-------------------|
| User can mint Food NFTs for 0.50 USDT each | ✅ | Smart contract test, frontend manual test |
| Support batch minting | ✅ | Test with 10, 50, 100 quantity mints |
| Food type randomly assigned on mint | ✅ | Verify distribution over 1000 mints |
| Commission distribution on mint | ✅ | Verify G1-G4 balances after mint |
| Event emitted: FoodMinted | ✅ | Event log assertion in tests |
| Food NFT burned when fed | ✅ | Verify is_consumed flag and burn event |
| Egg tracks consumed food | ✅ | Query food_type_history on egg |
| Integration test passes | ✅ | Full flow: mint → feed → hatch |

---

## Future Enhancements

1. **Food NFT Marketplace Trading** - Allow users to trade Food NFTs
2. **Food Type Bonuses** - Different food types affect rarity differently
3. **Bulk Feed** - Feed all selected food at once
4. **Food Crafting** - Combine 10 common food → 1 rare food
5. **Food Staking** - Stake Food NFTs for passive rewards
6. **Food Achievements** - Badges for collecting all food types

---

## References

- [Egg NFT Module Docs](./modules/egg-nft.md)
- [NFT Marketplace Spec](./NFT_Marketplace_Functional_Spec.md)
- [PocketBase Hook Patterns](../resources/mvp-foodcourt/pb_hooks/)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin ERC-1155](https://docs.openzeppelin.com/contracts/4.x/erc1155)

---

**Last Updated:** 2026-03-30  
**Author:** AI Planning Assistant  
**Review Required By:** Poom

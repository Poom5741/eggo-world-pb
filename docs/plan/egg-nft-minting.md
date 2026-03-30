# Egg NFT Minting Implementation Plan

## Overview
Implement core Egg NFT minting with automatic referral chain recording and on-chain commission distribution. Purchase price: 25 USDT, auto-mints 2 Food NFTs (tracked as property), 4-level referral chain (G1-G4), commission distribution (20%/10%/10%/10%), 4% CoinStor reserve.

---

## Phase 1: Smart Contract Development (Local Blockchain)

### 1.1 Create EggNFT ERC-721 Contract
**Location:** `contracts/src/EggNFT.sol`

**Features:**
- ERC-721 compliant NFT with metadata
- Properties: `egg_id`, `owner`, `food_count` (0-10), `is_hatched`, `rarity_seed`, `referral_chain[4]`
- Mint price: 25 USDT (stored as constant)
- Auto-mint 2 Food NFTs (increment `food_count`)
- Event: `EggMinted(uint256 egg_id, address buyer, address referrer)`

**Functions:**
- `mintEgg(address referrer)` - Purchase and mint (requires USDT approval)
- `getEggProperties(uint256 eggId)` - View egg data
- `hatchEgg(uint256 eggId)` - Hatch egg (changes `is_hatched`)
- `withdrawCommission()` - Owner withdraw accumulated commissions

**File:** `contracts/src/EggNFT.sol`

---

### 1.2 Create CommissionDistribution Contract
**Location:** `contracts/src/CommissionDistribution.sol`

**Features:**
- 4-level referral chain support
- Commission splits: G1=20%, G2=10%, G3=10%, G4=10%, CoinStor=4%, Treasury=46%
- Automatic distribution on mint
- Platform address: `0x0000000000000000000000000000000000000000` for missing levels

**Functions:**
- `distributeCommission(address[4] calldata referralChain, uint256 amount)` - Distribute on mint
- `claimCommission()` - Referrers claim accumulated commissions
- `getCommissionBalance(address referrer)` - View pending commission

**File:** `contracts/src/CommissionDistribution.sol`

---

### 1.3 Create MockUSDT for Testing
**Location:** `contracts/test/MockUSDT.sol`

**Features:**
- ERC-20 mock token for local testing
- Mint function for test accounts
- Used in Foundry tests before testnet deployment

**File:** `contracts/test/MockUSDT.sol`

---

### 1.4 Write Foundry Tests
**Location:** `contracts/test/EggNFT.t.sol`

**Test Cases:**
- ✅ User can purchase Egg NFT for 25 USDT
- ✅ System auto-mints 2 bonus Food NFTs (food_count = 2)
- ✅ Referral chain recorded: G1 through G4
- ✅ Commission distribution triggered (20%/10%/10%/10%)
- ✅ Egg NFT properties stored on-chain
- ✅ Event emitted: `EggMinted(egg_id, buyer, referrer)`
- ✅ 4% deposited to CoinStor reserve
- ✅ Full mint flow integration test with referral chain
- ✅ Edge cases: missing referrers, partial chains, reentrancy

**File:** `contracts/test/EggNFT.t.sol`

---

### 1.5 Create Forge Deployment Script
**Location:** `contracts/script/DeployEggNFT.s.sol`

**Deployment Steps:**
1. Deploy MockUSDT (local only)
2. Deploy CommissionDistribution
3. Deploy EggNFT (links to CommissionDistribution + USDT address)
4. Set USDT address on EggNFT
5. Configure CoinStor address (4% reserve)
6. Verify contracts on BSCScan (testnet/mainnet)

**File:** `contracts/script/DeployEggNFT.s.sol`

---

## Phase 2: PocketBase Integration

### 2.1 Create `egg_nfts` Collection
**Location:** `apps/backend/collections/egg_nfts.json`

**Schema:**
```json
{
  "name": "egg_nfts",
  "type": "base",
  "fields": [
    { "name": "egg_id", "type": "number" },
    { "name": "owner_id", "type": "relation" },
    { "name": "token_id", "type": "number" },
    { "name": "contract_address", "type": "text" },
    { "name": "food_count", "type": "number", "max": 10 },
    { "name": "is_hatched", "type": "bool" },
    { "name": "rarity_seed", "type": "number" },
    { "name": "referral_chain", "type": "json" },
    { "name": "tx_hash", "type": "text" },
    { "name": "minted_at", "type": "date" }
  ]
}
```

**File:** `apps/backend/collections/egg_nfts.json`

---

### 2.2 Create `commission_records` Collection
**Location:** `apps/backend/collections/commission_records.json`

**Schema:**
```json
{
  "name": "commission_records",
  "type": "base",
  "fields": [
    { "name": "user_id", "type": "relation" },
    { "name": "level", "type": "number" },
    { "name": "amount", "type": "number" },
    { "name": "tx_hash", "type": "text" },
    { "name": "from_egg_id", "type": "relation" },
    { "name": "claimed", "type": "bool" },
    { "name": "claimed_at", "type": "date" }
  ]
}
```

**File:** `apps/backend/collections/commission_records.json`

---

### 2.3 Create Migration Files
**Location:** `apps/backend/pb_migrations/`

**Files:**
- `NNN_create_egg_nfts.js` - Egg NFT collection
- `NNN_create_commission_records.js` - Commission tracking

---

### 2.4 Create Mint Hook
**Location:** `apps/backend/pb_hooks/11-mint-egg-nft.pb.js`

**Flow:**
1. User calls `/api/v2/mint-egg` with `referrer_id`
2. Hook validates USDT balance (25 USDT required)
3. Hook builds referral chain (G1-G4) from `referral_chain` field
4. Hook calls EggNFT contract `mintEgg(referrerChain)`
5. On success:
   - Create `egg_nfts` record
   - Deduct 25 USDT from buyer
   - Create `commission_records` for G1-G4
   - Update user `usdt_balance`
   - Emit event log

**Response Format:**
```javascript
e.json(200, { 
  success: true, 
  data: { 
    token_id, 
    egg_id, 
    tx_hash, 
    food_count: 2,
    referral_chain: [...]
  } 
})
```

**File:** `apps/backend/pb_hooks/11-mint-egg-nft.pb.js`

---

### 2.5 Create Claim Commission Hook
**Location:** `apps/backend/pb_hooks/12-claim-commission.pb.js`

**Flow:**
1. User calls `/api/v2/claim-commission`
2. Hook calls `CommissionDistribution.claimCommission()`
3. Updates `commission_records` as claimed
4. Updates user `usdt_total_earned`
5. Returns claimed amount

**File:** `apps/backend/pb_hooks/12-claim-commission.pb.js`

---

## Phase 3: Frontend Integration

### 3.1 Create Mint Page
**Location:** `apps/web/app/mint/page.tsx`

**Features:**
- Display egg price (25 USDT)
- Show user's USDT balance
- Referrer input (optional, from URL param or referral code)
- Mint button with loading state
- Transaction status display
- Success modal with egg details

**File:** `apps/web/app/mint/page.tsx`

---

### 3.2 Create Egg Dashboard
**Location:** `apps/web/app/dashboard/eggs/page.tsx`

**Features:**
- List user's owned Egg NFTs
- Display: egg_id, food_count, is_hatched, rarity_seed
- Hatch button (if not hatched)
- View referral chain
- View earned commissions

**File:** `apps/web/app/dashboard/eggs/page.tsx`

---

### 3.3 Create Commission Dashboard
**Location:** `apps/web/app/dashboard/commissions/page.tsx`

**Features:**
- Display pending commission balance
- Show commission history (G1-G4 earnings)
- Claim button
- Transaction history

**File:** `apps/web/app/dashboard/commissions/page.tsx`

---

### 3.4 Create EggNFT Contract Hook
**Location:** `apps/web/hooks/use-egg-nft.ts`

**Features:**
- `mintEgg(referrerChain: string[])` - Call mint function
- `getEggProperties(tokenId: number)` - Fetch egg data
- `getCommissionBalance(address: string)` - Fetch pending commission
- `claimCommission()` - Claim earned commissions
- Event listeners for `EggMinted` events

**File:** `apps/web/hooks/use-egg-nft.ts`

---

### 3.5 Add Egg NFT UI Components
**Location:** `apps/web/components/`

**Components:**
- `EggCard.tsx` - Display egg properties
- `ReferralChainDisplay.tsx` - Visual G1-G4 chain
- `CommissionBreakdown.tsx` - Show commission distribution
- `MintButton.tsx` - Mint action with validation

**Files:**
- `apps/web/components/egg-nft/EggCard.tsx`
- `apps/web/components/egg-nft/ReferralChainDisplay.tsx`
- `apps/web/components/egg-nft/CommissionBreakdown.tsx`
- `apps/web/components/egg-nft/MintButton.tsx`

---

## Phase 4: Testing & Deployment

### 4.1 Local Testing (Anvil)
**Commands:**
```bash
cd contracts
anvil --fork-url https://bsc-testnet.publicnode.com  # Fork BSC testnet
forge test --vvv  # Run all tests
```

**Test Checklist:**
- ✅ Mint with full referral chain (G1-G4)
- ✅ Mint with partial chain (only G1)
- ✅ Mint with no referrer
- ✅ Commission distribution accuracy
- ✅ Food count increments correctly
- ✅ Event emissions
- ✅ Reentrancy protection
- ✅ USDT approval flow

---

### 4.2 BSC Testnet Deployment
**Commands:**
```bash
cd contracts
forge script script/DeployEggNFT.s.sol --rpc-url bsc_testnet --broadcast --verify
```

**Post-Deployment:**
1. Update `.env` with contract addresses
2. Update PocketBase `wallet_configs` with contract address
3. Test mint flow with real USDT on testnet
4. Verify commission distribution

---

### 4.3 Integration Testing
**Test Scenarios:**
1. User A mints with no referrer → Only CoinStor gets 4%
2. User B mints with User A as G1 → A gets 20%, CoinStor 4%
3. User C mints with B as G1, A as G2 → B=20%, A=10%, CoinStor=4%
4. Full 4-level chain → G1=20%, G2=10%, G3=10%, G4=10%, CoinStor=4%
5. User claims commission → Balance updates correctly

---

### 4.4 Production Deployment (BSC Mainnet)
**Commands:**
```bash
cd contracts
forge script script/DeployEggNFT.s.sol --rpc-url bsc --broadcast --verify
```

**Pre-deployment Checklist:**
- ✅ All tests pass on testnet
- ✅ Security audit completed
- ✅ CoinStor multisig address configured
- ✅ Emergency pause mechanism tested
- ✅ Gas optimization reviewed

---

## File Structure Summary

```
contracts/
├── src/
│   ├── EggNFT.sol                    # Main NFT contract
│   └── CommissionDistribution.sol    # Commission logic
├── test/
│   ├── EggNFT.t.sol                  # Foundry tests
│   └── MockUSDT.sol                  # Mock token for testing
├── script/
│   └── DeployEggNFT.s.sol            # Deployment script
└── foundry.toml                      # Already exists

apps/backend/
├── collections/
│   ├── egg_nfts.json                 # New collection
│   └── commission_records.json       # New collection
├── pb_migrations/
│   ├── NNN_create_egg_nfts.js        # Migration
│   └── NNN_create_commission_records.js
└── pb_hooks/
    ├── 11-mint-egg-nft.pb.js         # Mint endpoint
    └── 12-claim-commission.pb.js     # Claim endpoint

apps/web/
├── app/
│   ├── mint/
│   │   └── page.tsx                  # Mint page
│   └── dashboard/
│       ├── eggs/
│       │   └── page.tsx              # Egg dashboard
│       └── commissions/
│           └── page.tsx              # Commission dashboard
├── components/
│   └── egg-nft/
│       ├── EggCard.tsx
│       ├── ReferralChainDisplay.tsx
│       ├── CommissionBreakdown.tsx
│       └── MintButton.tsx
└── hooks/
    └── use-egg-nft.ts                # Contract interaction hook
```

---

## Acceptance Criteria Mapping

| Criteria | Implementation | Test |
|----------|----------------|------|
| ✅ Purchase for 25 USDT | `EggNFT.mintEgg()` requires USDT approval | `testMintWithUSDT()` |
| ✅ Auto-mint 2 Food NFTs | `food_count` set to 2 on mint | `testFoodCountIncrement()` |
| ✅ 4-level referral chain | `referral_chain[4]` stored on NFT | `testReferralChainRecording()` |
| ✅ Commission distribution | `CommissionDistribution.distributeCommission()` | `testCommissionDistribution()` |
| ✅ On-chain properties | All properties in ERC-721 struct | `testEggProperties()` |
| ✅ EggMinted event | `emit EggMinted(...)` in mint function | `testEventEmission()` |
| ✅ 4% CoinStor reserve | Hardcoded in distribution logic | `testCoinStorReserve()` |
| ✅ Integration test | Full flow in `EggNFT.t.sol` | `testFullMintFlow()` |

---

## Dependencies & Environment

**Local Development:**
- Foundry (forge, anvil)
- Bun (frontend)
- PocketBase (backend)
- Node.js 18+

**Testnet:**
- BSC Testnet RPC
- Testnet USDT token address
- BSCScan API key

**Mainnet:**
- BSC Mainnet RPC
- Mainnet USDT token address (0x55d398326f99059fF775485246999027B3197955)
- CoinStor multisig address

---

## Next Steps

1. **Start with Phase 1** - Create smart contracts locally
2. **Run Foundry tests** - Validate all logic on Anvil
3. **Deploy to testnet** - Test with real USDT on BSC testnet
4. **Build PocketBase hooks** - Integrate contracts with backend
5. **Create frontend UI** - Build mint and dashboard pages
6. **Full integration test** - End-to-end flow verification
7. **Security audit** - Review contracts before mainnet
8. **Deploy to mainnet** - Production launch

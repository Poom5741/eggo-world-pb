# Egg NFT Module Documentation

## Overview

The Egg NFT module is the core gameplay mechanic of EggoWorld. Users purchase Egg NFTs for 25 USDT, which automatically mints 2 Food NFTs. Users can collect more Food NFTs and hatch their Eggs into Animal NFTs. The module features a 4-level referral commission system with on-chain distribution.

**Status:** ✅ Phase 3 Complete (Ready for Testnet Deployment)

---

## Business Logic

### Mint Flow
1. User pays 25 USDT
2. System mints 1 Egg NFT (ERC-721)
3. System auto-mints 2 Food NFTs (tracked as property)
4. Commission distributed to referral chain (G1-G4)
5. 4% reserved for CoinStor

### Commission Distribution
| Level | Role | Commission |
|-------|------|------------|
| G1 | Direct referrer | 20% (5 USDT) |
| G2 | Level 2 | 10% (2.5 USDT) |
| G3 | Level 3 | 10% (2.5 USDT) |
| G4 | Level 4 | 10% (2.5 USDT) |
| CoinStor | Platform reserve | 4% (1 USDT) |
| Treasury | Protocol treasury | 46% (11.5 USDT) |
| **Total** | | **100% (25 USDT)** |

### Hatching Flow
1. User collects 10 Food NFTs
2. User triggers hatch function
3. Egg NFT metadata updates (is_hatched = true)
4. Animal NFT minted (future feature)

---

## Smart Contracts

### EggNFT.sol

**Location:** `contracts/src/EggNFT.sol`

**Key Features:**
- ERC-721 compliant NFT
- Mint price: 25 USDT (constant)
- Auto-mints 2 Food NFTs on purchase
- Stores referral chain on-chain
- Reentrancy protection

**Functions:**
```solidity
// Mint Egg with single referrer
function mintEgg(address referrer) external returns (uint256)

// Mint Egg with full referral chain
function mintEggWithChain(address[4] calldata referralChain) external returns (uint256)

// Get egg properties
function getEggProperties(uint256 tokenId) external view returns (
    uint256 egg_id,
    address owner,
    uint256 food_count,
    bool is_hatched,
    uint256 rarity_seed,
    address[4] memory referral_chain
)

// Hatch egg
function hatchEgg(uint256 tokenId) external

// Getters
function getFoodCount(uint256 tokenId) external view returns (uint256)
function isEggHatched(uint256 tokenId) external view returns (bool)
function getReferralChain(uint256 tokenId) external view returns (address[4] memory)
```

**Egg Properties:**
```solidity
struct EggProperties {
    uint256 egg_id;           // Unique egg identifier
    address owner;            // Current owner
    uint256 food_count;       // 0-10 Food NFTs collected
    bool is_hatched;          // Hatch status
    uint256 rarity_seed;      // Random rarity (0-999999)
    address[4] referral_chain; // G1-G4 referrers
}
```

**Rarity Tiers:**
| Seed Range | Rarity | Probability |
|------------|--------|-------------|
| 0-99 | Legendary | 10% |
| 100-299 | Epic | 20% |
| 300-599 | Rare | 30% |
| 600-799 | Uncommon | 20% |
| 800-999999 | Common | 20% |

---

### CommissionDistribution.sol

**Location:** `contracts/src/CommissionDistribution.sol`

**Key Features:**
- 4-level referral chain support
- Automatic distribution on mint
- Claim mechanism for referrers
- CoinStor 4% reserve

**Functions:**
```solidity
// Set EggNFT contract address
function setEggNFTContract(address _eggNFT) external

// Distribute commission on mint
function distributeCommission(
    address[4] calldata referralChain,
    uint256 amount
) external

// Claim accumulated commissions
function claimCommission() external

// View pending commission
function getCommissionBalance(address referrer) external view returns (uint256)

// CoinStor withdraw
function withdrawCoinStor() external
```

---

## Database Schema

### egg_nfts Collection

**Location:** `apps/backend/collections/egg_nfts.json`

**Schema:**
```json
{
  "name": "egg_nfts",
  "type": "base",
  "fields": [
    { "name": "egg_id", "type": "number" },
    { "name": "owner", "type": "relation", "collection": "users" },
    { "name": "token_id", "type": "number", "unique": true },
    { "name": "contract_address", "type": "text" },
    { "name": "food_count", "type": "number", "max": 10 },
    { "name": "is_hatched", "type": "bool" },
    { "name": "rarity_seed", "type": "number" },
    { "name": "referral_chain", "type": "json" },
    { "name": "tx_hash", "type": "text", "unique": true },
    { "name": "minted_at", "type": "date" }
  ],
  "indexes": [
    "CREATE INDEX idx_egg_nfts_owner ON egg_nfts (owner)",
    "CREATE INDEX idx_egg_nfts_token_id ON egg_nfts (token_id)",
    "CREATE INDEX idx_egg_nfts_is_hatched ON egg_nfts (is_hatched)"
  ],
  "rules": {
    "list": "@request.auth.id != \"\" && owner = @request.auth.id",
    "view": "@request.auth.id != \"\" && owner = @request.auth.id",
    "create": "@request.auth.id != \"\" && owner = @request.auth.id",
    "update": "@request.auth.id != \"\" && owner = @request.auth.id",
    "delete": "@request.auth.id != \"\" && owner = @request.auth.id"
  }
}
```

---

### commission_records Collection

**Location:** `apps/backend/collections/commission_records.json`

**Schema:**
```json
{
  "name": "commission_records",
  "type": "base",
  "fields": [
    { "name": "user", "type": "relation", "collection": "users" },
    { "name": "level", "type": "number", "min": 1, "max": 4 },
    { "name": "amount", "type": "number" },
    { "name": "tx_hash", "type": "text" },
    { "name": "from_egg", "type": "relation", "collection": "egg_nfts" },
    { "name": "claimed", "type": "bool" },
    { "name": "claimed_at", "type": "date" },
    { "name": "block_number", "type": "number" }
  ],
  "indexes": [
    "CREATE INDEX idx_commission_user ON commission_records (user)",
    "CREATE INDEX idx_commission_claimed ON commission_records (claimed)",
    "CREATE INDEX idx_commission_tx_hash ON commission_records (tx_hash)"
  ],
  "rules": {
    "list": "@request.auth.id != \"\" && user = @request.auth.id",
    "view": "@request.auth.id != \"\" && user = @request.auth.id",
    "create": null,
    "update": "@request.auth.id != \"\" && user = @request.auth.id",
    "delete": null
  }
}
```

---

## API Endpoints

### PocketBase Hooks

#### 1. Mint Egg NFT

**Hook:** `apps/backend/pb_hooks/11-mint-egg-nft.pb.js`

**Endpoint:** `POST /api/v2/mint-egg`

**Authentication:** Required (PocketBase token)

**Request:**
```json
{
  "referrer_id": "user_id_here"  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "token_id": 1,
    "egg_id": 1001,
    "tx_hash": "0xabc123...",
    "food_count": 2,
    "is_hatched": false,
    "rarity_seed": 250,
    "referral_chain": ["0x123...", "0x456...", null, null]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Insufficient USDT balance",
    "code": "INSUFFICIENT_BALANCE"
  }
}
```

**Flow:**
1. Authenticate user
2. Validate USDT balance (≥25 USDT)
3. Build referral chain from `referrer_id`
4. Call wallet-api mint endpoint
5. Create `egg_nfts` record
6. Deduct 25 USDT from buyer
7. Create `commission_records` for G1-G4
8. Update user `usdt_total_earned`
9. Return success response

**Error Codes:**
- `AUTH_REQUIRED` - User not authenticated
- `WALLET_NOT_FOUND` - User has no wallet
- `INSUFFICIENT_BALANCE` - Less than 25 USDT
- `REFERRER_NOT_FOUND` - Invalid referrer ID
- `CONFIG_ERROR` - Contract address not configured
- `MINT_FAILED` - Contract call failed

---

#### 2. Claim Commission

**Hook:** `apps/backend/pb_hooks/12-claim-commission.pb.js`

**Endpoint:** `POST /api/v2/claim-commission`

**Authentication:** Required

**Request:** None

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "claimed_amount": "10.5",
    "tx_hash": "0xdef456...",
    "records_count": 3
  }
}
```

**Response (No Claims):**
```json
{
  "success": true,
  "data": {
    "claimed_amount": "0",
    "tx_hash": null,
    "records_count": 0,
    "message": "No unclaimed commissions"
  }
}
```

**Flow:**
1. Authenticate user
2. Query unclaimed commission records
3. Call wallet-api claim endpoint
4. Mark records as claimed
5. Update user `usdt_total_earned`
6. Return claimed amount

---

### Wallet API Endpoints

#### Mint Egg Contract

**Endpoint:** `POST /api/wallet/mint-egg`

**Request:**
```json
{
  "wallet": "0x...",
  "daccPublicKey": "0x...",
  "pin": "encrypted_pin",
  "referralChain": ["0x123...", "0x456...", null, null],
  "eggNftAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xabc123...",
    "status": "pending_blockchain_confirmation"
  }
}
```

---

#### Claim Commission Contract

**Endpoint:** `POST /api/wallet/claim-commission`

**Request:**
```json
{
  "wallet": "0x...",
  "daccPublicKey": "0x...",
  "pin": "encrypted_pin",
  "commissionDistributionAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xdef456...",
    "status": "pending_blockchain_confirmation"
  }
}
```

---

## Frontend Components

### Pages

#### 1. Mint Page

**Location:** `apps/web/app/mint/page.tsx`

**URL:** `/mint`

**Features:**
- Display mint price (25 USDT)
- Show user's USDT balance
- Referrer ID input (optional)
- Mint button with validation
- Success/error states

---

#### 2. Eggs Dashboard

**Location:** `apps/web/app/dashboard/eggs/page.tsx`

**URL:** `/dashboard/eggs`

**Features:**
- Grid view of user's Egg NFTs
- Stats: total, hatched, food count, value
- EggCard components
- Hatch functionality
- Empty state with CTA

---

#### 3. Commissions Dashboard

**Location:** `apps/web/app/dashboard/commissions/page.tsx`

**URL:** `/dashboard/commissions`

**Features:**
- Pending commission balance
- Total earned display
- G1-G4 earnings breakdown
- Claim button
- Commission history

---

### Components

#### EggCard

**Location:** `apps/web/components/egg-nft/EggCard.tsx`

**Props:**
```typescript
interface EggCardProps {
  egg: {
    token_id: number
    egg_id: number
    food_count: number
    is_hatched: boolean
    rarity_seed: number
    referral_chain?: string[]
    minted_at: string
  }
  onHatch?: () => void
}
```

**Features:**
- Displays egg visual
- Shows rarity badge (Common → Legendary)
- Food count tracker
- Hatch status
- Referral chain toggle
- Hatch button

---

#### useEggNft Hook

**Location:** `apps/web/hooks/use-egg-nft.ts`

**Functions:**
```typescript
function useEggNft() {
  return {
    loading: boolean,
    error: string | null,
    mintEgg: (referrerId?: string) => Promise<MintResult | null>,
    getEggProperties: (tokenId: number) => Promise<EggProperties | null>,
    getCommissionBalance: (address: string) => Promise<number>,
    claimCommission: () => Promise<ClaimResult | null>,
    getUserEggs: (userId: string) => Promise<any[]>,
    getUserCommissions: (userId: string) => Promise<any[]>
  }
}
```

---

## Testing

### Smart Contract Tests

**Location:** `contracts/test/EggNFT.t.sol`

**Test Coverage:** 15/15 passing

**Test Categories:**
1. Deployment validation
2. Mint with USDT
3. Food count increment
4. Referral chain recording
5. Commission distribution
6. CoinStor reserve
7. Event emission
8. Hatch functionality
9. Edge cases (no referrer, partial chain)
10. USDT transfer
11. Reentrancy protection
12. Multiple mints
13. Claim commission
14. Full integration flow

**Run Tests:**
```bash
cd contracts
forge test
forge test --gas-report
```

---

### Frontend Tests

**Location:** `apps/web/components/egg-nft/EggCard.test.tsx`

**Run Tests:**
```bash
cd apps/web
bun test
bun test EggCard.test.tsx
```

---

## Deployment

### Environment Variables

**Contracts (.env):**
```bash
PRIVATE_KEY=your_deployer_key
COINSTOR_RESERVE_ADDRESS=0x...
DEPLOY_MOCK_USDT=false  # true for local testing
USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955  # BSC mainnet
BSCSCAN_API_KEY=your_api_key
```

**PocketBase:**
```bash
# Add to PocketBase settings
eggNftContractAddress=0x...
commissionDistributionAddress=0x...
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_EGG_NFT_ADDRESS=0x...
NEXT_PUBLIC_COMMISSION_DISTRIBUTION_ADDRESS=0x...
```

---

### Deployment Steps

**1. Deploy to BSC Testnet:**
```bash
cd contracts
forge script script/DeployEggNFT.s.sol \
  --rpc-url bsc_testnet \
  --broadcast \
  --verify
```

**2. Update Configuration:**
- Update PocketBase settings with contract addresses
- Update frontend `.env.local`
- Update wallet-api configuration

**3. Test Mint Flow:**
- Mint with testnet USDT
- Verify referral chain recording
- Verify commission distribution
- Test claim functionality

**4. Deploy to BSC Mainnet:**
```bash
cd contracts
forge script script/DeployEggNFT.s.sol \
  --rpc-url bsc \
  --broadcast \
  --verify
```

---

## Migration Scripts

### Create egg_nfts Collection

**Migration:** `apps/backend/pb_migrations/1774772605_create_egg_nfts.js`

**Run:**
```bash
cd apps/backend
./pocketbase migrate up
```

---

### Create commission_records Collection

**Migration:** `apps/backend/pb_migrations/1774772606_create_commission_records.js`

**Run:**
```bash
cd apps/backend
./pocketbase migrate up
```

---

## Troubleshooting

### Common Issues

**1. Mint Fails with "Insufficient Balance"**
- Check user's `usdt_balance` in `user_wallets` collection
- Ensure balance ≥ 25 USDT
- Verify USDT deduction logic in hook

**2. Referral Chain Not Recording**
- Check `referrer_id` in request
- Verify referral chain building logic in hook
- Ensure referrer user exists

**3. Commission Not Distributing**
- Check contract addresses in PocketBase settings
- Verify wallet-api is running
- Check contract logs on BSCScan

**4. Claim Fails**
- Check unclaimed commission records exist
- Verify contract has ETH for gas
- Check wallet-api claim endpoint

---

## Security Considerations

**Smart Contracts:**
- ✅ ReentrancyGuard on mint function
- ✅ Access control on distribution
- ✅ No private key exposure
- ✅ Event emissions for tracking

**Backend:**
- ✅ Authentication required on all endpoints
- ✅ Input validation on referrer ID
- ✅ Transaction hash uniqueness
- ✅ USDT balance checks before mint

**Frontend:**
- ✅ Hydration safety checks
- ✅ Auth state management
- ✅ Error handling on all API calls
- ✅ Loading states for UX

---

## Future Enhancements

1. **Food NFT Trading** - Marketplace for Food NFTs
2. **Animal NFT Minting** - Hatch 10 Food → 1 Animal NFT
3. **Breeding System** - Breed Animal NFTs
4. **Staking** - Stake Egg/Animal NFTs for rewards
5. **Governance** - DAO for Egg NFT holders
6. **Cross-chain** - Bridge to other chains

---

## Related Documentation

- [Egg NFT Implementation Plan](../plan/egg-nft-minting.md)
- [Frontend Design Guide](../plan/egg-nft-frontend-guide.md)
- [Smart Contract README](../../contracts/README.md)
- [TDG Configuration](../../TDG.md)

---

**Last Updated:** March 30, 2026
**Status:** Phase 3 Complete - Ready for Testnet

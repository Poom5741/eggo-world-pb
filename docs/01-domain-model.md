# Domain Model

## Core Entities

### User

**Purpose**: Represents a user in the EggoWorld system

**Attributes**:
- `id` (string, unique): Primary key
- `email` (string, unique): User's email address
- `password` (string): Hashed password
- `walletAddress` (string): EVM wallet address (0x...)
- `lineUserId` (string, optional): LINE OAuth user ID
- `lineDisplayName` (string, optional): LINE display name
- `referrerId` (string, optional): ID of user who referred them
- `usdtBalance` (number): USDT balance in wallet
- `eggNftCount` (number): Number of Egg NFTs owned
- `foodNftCount` (number): Number of Food NFTs owned
- `animalNftCount` (number): Number of Animal NFTs owned
- `totalEarned` (number): Total commissions earned
- `totalWithdrawn` (number): Total USDT withdrawn
- `avatar` (file, optional): Profile avatar image
- `verified` (boolean): Email verification status
- `active` (boolean): Account active status
- `created` (datetime): Account creation timestamp
- `updated` (datetime): Last update timestamp

**Relationships**:
- One-to-one with UserWallet
- One-to-many with Referrals (as referrer)
- One-to-one with Referrals (as referee)
- One-to-many with NFTs

**Business Rules**:
- Email must be unique
- Wallet address is generated automatically on signup
- Can register via LINE OAuth or email/password
- Must have a valid 4-level referral chain

### Referral

**Purpose**: Tracks MLM referral relationships and commission chains

**Attributes**:
- `id` (string, unique): Primary key
- `referrerId` (string): ID of the referrer (user who invited)
- `refereeId` (string, unique): ID of the referee (new user)
- `level` (number): Level in referral chain (1-4)
- `g1` (string): ID of G1 referrer (direct)
- `g2` (string): ID of G2 referrer (2nd level)
- `g3` (string): ID of G3 referrer (3rd level)
- `g4` (string): ID of G4 referrer (4th level)
- `totalCommission` (number): Total commissions earned from this referral
- `createdAt` (datetime): When referral was created

**Relationships**:
- Many-to-one with Users (referrer)
- Many-to-one with Users (referee)

**Business Rules**:
- Every user must have a 4-level referral chain
- G1 is always the direct referrer
- G2, G3, G4 are determined by walking up the referrer's chain
- Platform address fills gaps when chain is incomplete
- Commission percentages: G1=25%, G2=15%, G3=10%, G4=5%

### UserWallet

**Purpose**: Stores encrypted wallet information

**Attributes**:
- `id` (string, unique): Primary key
- `userId` (string, unique): Foreign key to Users
- `walletAddress` (string, unique): EVM wallet address
- `encryptedPrivateKey` (string): XOR-encrypted private key
- `usdtBalance` (number): Current USDT balance
- `pendingBalance` (number): Pending USDT (awaiting confirmation)
- `totalDeposited` (number): Total USDT deposited
- `totalWithdrawn` (number): Total USDT withdrawn
- `lastUpdated` (datetime): Last balance update
- `created` (datetime): Wallet creation timestamp

**Relationships**:
- One-to-one with Users

**Business Rules**:
- Private key must be encrypted with master key + userId
- Wallet address is deterministic for testing
- Balance updates are transactional
- Cannot withdraw more than available balance

### NFT

**Purpose**: Represents NFTs in the game (Egg, Food, Animal)

**Attributes**:
- `id` (string, unique): Primary key
- `tokenId` (number): Token ID on blockchain
- `contractAddress` (string): Smart contract address
- `type` (enum): "egg" | "food" | "animal"
- `rarity` (enum): "common" | "rare" | "epic" | "legendary"
- `ownerId` (string): Foreign key to Users
- `price` (number): Purchase price in USDT
- `hatched` (boolean): Whether egg has hatched (for egg type)
- `hatchCount` (number): Number of food items used to hatch
- `createdAt` (datetime): NFT creation timestamp
- `updatedAt` (datetime): Last update timestamp

**Relationships**:
- Many-to-one with Users (owner)

**Business Rules**:
- Egg NFT costs $25 and includes 2 free Food NFTs
- Food NFT costs $0.50 each
- 10 Food NFTs required to hatch 1 Egg NFT
- Hatched Egg becomes Animal NFT
- NFT ownership is tracked both on-chain and off-chain

### Transaction

**Purpose**: Records all financial transactions

**Attributes**:
- `id` (string, unique): Primary key
- `userId` (string): Foreign key to Users
- `type` (enum): "deposit" | "withdrawal" | "purchase" | "commission" | "transfer"
- `amount` (number): Transaction amount in USDT
- `fromAddress` (string): Source wallet address
- `toAddress` (string): Destination wallet address
- `txHash` (string, optional): Blockchain transaction hash
- `status` (enum): "pending" | "completed" | "failed"
- `relatedReferralId` (string, optional): If commission, related referral
- `relatedNftId` (string, optional): If purchase, related NFT
- `createdAt` (datetime): Transaction timestamp
- `completedAt` (datetime, optional): Completion timestamp

**Relationships**:
- Many-to-one with Users
- Many-to-one with Referrals (optional)
- Many-to-one with NFTs (optional)

**Business Rules**:
- All transactions are immutable
- Commission transactions create transactions for each level
- Purchase transactions trigger commission distribution
- Status must progress: pending → completed/failed

## Entity Relationships

```
User (1) ----< (1) UserWallet
  |
  | (1)
  |
  >---- (1) Referral (as referee)
  |
  | (many)
  |
  >---- Referral (as referrer)
  |
  | (many)
  |
  >---- NFT (owner)
  |
  | (many)
  |
  >---- Transaction

Referral (1) ----< (many) Transaction (commissions)
  |
  | (1)
  |
  >---- User (referrer)
  |
  | (1)
  |
  >---- User (referee)

NFT (1) ----< (many) Transaction (purchases)
  |
  | (1)
  |
  >---- User (owner)

Transaction (many) ----> (1) User
Transaction (many) ----> (1) Referral (optional)
Transaction (many) ----> (1) NFT (optional)
```

## Value Objects

### Money
- `amount` (number): The monetary value
- `currency` (string): Always "USDT"
- **Immutable**: Once created, never changes

### WalletAddress
- `address` (string): EVM-compatible address (0x...)
- **Validation**: Must match regex `^0x[a-fA-F0-9]{40}$`
- **Immutable**: Wallet addresses never change

### CommissionSplit
- `g1Amount` (number): G1 commission (25%)
- `g2Amount` (number): G2 commission (15%)
- `g3Amount` (number): G3 commission (10%)
- `g4Amount` (number): G4 commission (5%)
- `platformAmount` (number): Platform fee (45%)
- **Validation**: Sum must equal total amount

## Aggregates

### User Aggregate
**Root**: User
**Entities**:
- User
- UserWallet
- Referral (where user is referee)

**Invariants**:
- User must have exactly one wallet
- User must have exactly one referral chain (as referee)
- Wallet balance cannot be negative

### NFTAggregate
**Root**: NFT
**Entities**:
- NFT
- Transaction (purchase transactions only)

**Invariants**:
- NFT must have exactly one owner
- NFT type cannot change
- Egg NFT can only hatch once

## Domain Services

### ReferralChainBuilder
**Responsibility**: Builds 4-level referral chains for new users

**Methods**:
- `buildChain(referrerId: string): ReferralChain`

**Logic**:
1. Start with referrer as G1
2. Get referrer's G2 as G2, or use platform address
3. Get referrer's G3 as G3, or use platform address
4. Get referrer's G4 as G4, or use platform address
5. Return complete chain

### CommissionDistributor
**Responsibility**: Distributes commissions across referral levels

**Methods**:
- `distribute(amount: number, referralChain: ReferralChain): CommissionSplit`

**Logic**:
1. Calculate G1 commission (25% of amount)
2. Calculate G2 commission (15% of amount)
3. Calculate G3 commission (10% of amount)
4. Calculate G4 commission (5% of amount)
5. Calculate platform fee (remaining 45%)
6. Create commission transactions for each level
7. Update user balances

### WalletEncryptionService
**Responsibility**: Encrypts and decrypts wallet private keys

**Methods**:
- `encrypt(privateKey: string, userId: string): string`
- `decrypt(encryptedKey: string, userId: string): string`

**Logic**:
1. Combine master key with userId
2. XOR encrypt/decrypt the private key
3. Return encrypted/decrypted result

### NFTHatchingService
**Responsibility**: Manages NFT hatching process

**Methods**:
- `canHatch(eggNft: NFT, foodCount: number): boolean`
- `hatch(eggNft: NFT): AnimalNFT`

**Logic**:
1. Verify egg hasn't hatched yet
2. Verify user has 10+ food items
3. Convert egg NFT to animal NFT
4. Consume 10 food items
5. Update NFT ownership

## Business Rules

### Registration Rules
1. **Email Uniqueness**: Email addresses must be unique across all users
2. **Wallet Creation**: Every user gets a unique EVM wallet on registration
3. **Referral Chain**: Every user must have a complete 4-level referral chain
4. **LINE OAuth**: LINE OAuth users still get wallet and referral chain

### Referral Rules
1. **Direct Referral**: G1 is always the direct referrer
2. **Chain Depth**: Maximum 4 levels (G1, G2, G3, G4)
3. **Platform Fallback**: Use platform address when chain is incomplete
4. **Commission Eligibility**: Only referrers in the chain earn commissions
5. **No Self-Referral**: A user cannot refer themselves

### NFT Rules
1. **Egg Purchase**: $25 for 1 Egg NFT + 2 free Food NFTs
2. **Food Purchase**: $0.50 per Food NFT
3. **Hatching**: 10 Food NFTs required to hatch 1 Egg NFT
4. **Single Hatch**: Each Egg can only hatch once
5. **Ownership**: NFTs have exactly one owner at any time

### Transaction Rules
1. **Atomicity**: Transactions are all-or-nothing
2. **Immutability**: Completed transactions cannot be modified
3. **Balance Validation**: Cannot withdraw more than available balance
4. **Commission Distribution**: Commissions distribute simultaneously on purchase

### Security Rules
1. **Private Key Encryption**: All private keys must be encrypted at rest
2. **No Key Logging**: Private keys never appear in logs
3. **Authentication**: All API endpoints require valid authentication
4. **Rate Limiting**: API calls are rate-limited per user

## State Machines

### User State Machine
```
[Unverified] --verify email--> [Verified]
[Verified] --deactivate--> [Inactive]
[Inactive] --reactivate--> [Verified]
```

### Transaction State Machine
```
[Pending] --confirm--> [Completed]
[Pending] --fail--> [Failed]
```

### NFT State Machine (Egg)
```
[Purchased] --add 10 food--> [Ready to Hatch]
[Ready to Hatch] --hatch--> [Hatched → Animal NFT]
```

## Events

### Domain Events
1. **UserRegistered**: New user created with wallet and referral chain
2. **ReferralCreated**: New referral relationship established
3. **NFTPurchased**: User purchased an NFT
4. **CommissionEarned**: Referrer earned commission
5. **NFTHatched**: Egg NFT hatched into Animal NFT
6. **WithdrawalRequested**: User requested USDT withdrawal
7. **WithdrawalCompleted**: Withdrawal processed successfully

### Event Handlers
- **UserRegistered**: Creates wallet, builds referral chain, sends welcome email
- **NFTPurchased**: Distributes commissions, updates balances
- **CommissionEarned**: Updates user balance, creates transaction record
- **NFTHatched**: Converts egg to animal, consumes food items

## Invariants

### User Invariants
- Every user has exactly one wallet
- Every user has exactly one referral chain (as referee)
- USDT balance cannot be negative

### Referral Invariants
- Every referral has exactly one referrer and one referee
- Commission percentages always sum to 55% (25+15+10+5)
- Referral chains are always 4 levels deep

### NFT Invariants
- Every NFT has exactly one owner
- Egg NFT can only hatch once
- Total food items = purchased + free from eggs

### Transaction Invariants
- All transactions are immutable
- Transaction amounts are always positive
- Commissions always distribute to 4 levels

## Data Integrity Constraints

### Database Constraints
- Unique constraints on email, wallet address
- Foreign key constraints on relationships
- Check constraints on balances (>= 0)
- Not null constraints on required fields

### Application Constraints
- Email format validation
- Wallet address format validation (EVM)
- Commission calculation validation (sums to total)
- Referral chain depth validation (exactly 4 levels)

## Migration Considerations

### Future Schema Changes
- Add more NFT types (beyond egg, food, animal)
- Add NFT marketplace listings
- Add auction/bidding system
- Add achievement/badge system
- Add user tiers or levels

### Backward Compatibility
- Never remove fields, only deprecate
- Add new fields with default values
- Maintain old enum values when adding new ones
- Use versioning for API breaking changes

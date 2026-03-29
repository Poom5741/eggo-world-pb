# Wallet Management System Implementation Plan

## Overview

Implement user wallet system for managing USDT balances and user data with referral chain tracking.

---

## Architecture Decisions

| Component | Decision |
|-----------|----------|
| Referral chain | Separate `referrals` collection |
| USDT balance | Fields on `users` collection |
| Withdrawal fee | Config collection (admin configurable) |

---

## Phase 1: Database Schema Design

### 1.1 Update Users Collection

**File:** `apps/backend/collections/users.json`

**New Fields to Add:**
- `usdt_balance` (number) - Current USDT balance
- `usdt_total_earned` (number) - Lifetime USDT earned
- `total_direct_recruits` (number) - Count of direct referrals
- `lifetime_food_items` (number) - Total food items purchased
- `highest_tier_reached` (text) - Highest membership tier
- `referrer_id` (relation) - Direct referrer (G1)

**Migration File:** `apps/backend/pb_migrations/{timestamp}_updated_users.js`

### 1.2 Create UserWallets Collection

**File:** `apps/backend/collections/user_wallets.json`

**Fields:**
- `user_id` (relation → users) - Owner
- `usdt_balance` (number, default: 0) - Spendable USDT
- `total_earned` (number, default: 0) - Lifetime earnings
- `total_spent` (number, default: 0) - Lifetime spending
- `total_withdrawn` (number, default: 0) - Total withdrawals
- `wallet_address` (text) - EVM wallet address
- `last_transaction_at` (date) - Last activity

**Rules:**
- List/View: `user_id = @request.auth.id`
- Create: System only (auto-created with user)
- Update: System only (via hooks)

**Migration File:** `apps/backend/pb_migrations/{timestamp}_create_user_wallets.js`

### 1.3 Create Referrals Collection

**File:** `apps/backend/collections/referrals.json`

**Fields:**
- `referrer_id` (relation → users) - Upline
- `referee_id` (relation → users) - Downline
- `level` (number) - Relationship level (1-4)
- `created` (autodate)

**Purpose:** Track 4-level referral chain (G1, G2, G3, G4)

**Migration File:** `apps/backend/pb_migrations/{timestamp}_create_referrals.js`

### 1.4 Create WalletConfigs Collection

**File:** `apps/backend/collections/wallet_configs.json`

**Fields:**
- `key` (text, unique) - Config key (e.g., "WITHDRAWAL_FEE")
- `value` (number) - Config value (e.g., 0.05 for 5%)
- `description` (text) - Human-readable description
- `updated` (autodate)

**Initial Data:**
- `WITHDRAWAL_FEE`: 0.05 (5%)

**Migration File:** `apps/backend/pb_migrations/{timestamp}_create_wallet_configs.js`

---

## Phase 2: PocketBase Hooks Implementation

### 2.1 Hook: Wallet Auto-Creation Update

**File:** `apps/backend/pb_hooks/01-create-wallet.pb.js`

**Changes:**
- Add initialization of `usdt_balance` and `usdt_total_earned` to 0
- Trigger UserWallets record creation

**Logic:**
```javascript
onRecordAfterCreateSuccess("users", (e) => {
  // Existing wallet creation logic...
  
  // Initialize wallet balance fields
  e.record.set("usdt_balance", 0)
  e.record.set("usdt_total_earned", 0)
  e.record.set("total_direct_recruits", 0)
  e.record.set("lifetime_food_items", 0)
  e.record.set("highest_tier_reached", "bronze")
  
  $app.save(e.record)
  
  // Create UserWallets record
  const walletCollection = $app.findCollectionByNameOrId("user_wallets")
  const walletRecord = new Record(walletCollection)
  walletRecord.set("user_id", e.record.id)
  walletRecord.set("usdt_balance", 0)
  $app.save(walletRecord)
})
```

### 2.2 Hook: Referral Chain Management

**File:** `apps/backend/pb_hooks/05-referral-chain.pb.js`

**Triggers:**
- After user creation with referrer

**Logic:**
```javascript
onRecordAfterCreateSuccess("users", (e) => {
  const user = e.record
  const referrerId = user.getString("referrer_id")
  
  if (!referrerId) return
  
  // Create G1 relationship
  createReferralRecord(referrerId, user.id, 1)
  
  // Get referrer's referrer for G2, G3, G4
  let currentReferrerId = referrerId
  for (let level = 2; level <= 4; level++) {
    const referrerRecord = $app.findRecordById("users", currentReferrerId)
    const nextReferrerId = referrerRecord.getString("referrer_id")
    
    if (!nextReferrerId) break
    
    createReferralRecord(nextReferrerId, user.id, level)
    currentReferrerId = nextReferrerId
  }
  
  // Update referrer's direct recruit count
  const referrer = $app.findRecordById("users", referrerId)
  const currentCount = referrer.getNumber("total_direct_recruits")
  referrer.set("total_direct_recruits", currentCount + 1)
  $app.save(referrer)
})

function createReferralRecord(referrerId, refereeId, level) {
  const collection = $app.findCollectionByNameOrId("referrals")
  const record = new Record(collection)
  record.set("referrer_id", referrerId)
  record.set("referee_id", refereeId)
  record.set("level", level)
  $app.save(record)
}
```

### 2.3 Hook: Wallet Balance Endpoint

**File:** `apps/backend/pb_hooks/06-wallet-balance.pb.js`

**Endpoint:** `POST /api/v2/wallet/balance`

**Request:**
```json
{
  "user_address": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usdt_balance": 100.50,
    "total_earned": 500.00,
    "total_spent": 200.00,
    "total_withdrawn": 100.00
  }
}
```

**Logic:**
```javascript
routerAdd("POST", "/api/v2/wallet/balance", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  const { user_address } = body
  
  if (!user_address) {
    return e.json(400, { 
      success: false, 
      error: { message: "user_address required", code: "VALIDATION_ERROR" } 
    })
  }
  
  try {
    const userRecord = $app.findFirstRecordByData("users", "wallet_address", user_address)
    
    if (!userRecord) {
      return e.json(404, { 
        success: false, 
        error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } 
      })
    }
    
    const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id)
    
    e.json(200, {
      success: true,
      data: {
        usdt_balance: walletRecord.getNumber("usdt_balance"),
        total_earned: walletRecord.getNumber("total_earned"),
        total_spent: walletRecord.getNumber("total_spent"),
        total_withdrawn: walletRecord.getNumber("total_withdrawn")
      }
    })
  } catch (error) {
    e.json(500, {
      success: false,
      error: { message: error.message, code: "BALANCE_FETCH_FAILED" }
    })
  }
})
```

### 2.4 Hook: Withdraw USDT

**File:** `apps/backend/pb_hooks/07-withdraw-usdt.pb.js`

**Endpoint:** `POST /api/v2/wallet/withdraw`

**Request:**
```json
{
  "user_address": "0x...",
  "amount": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 50.00,
    "fee": 2.50,
    "net_amount": 47.50,
    "new_balance": 50.00
  }
}
```

**Logic:**
```javascript
routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  const { user_address, amount } = body
  
  // Validation
  if (!user_address || !amount || amount <= 0) {
    return e.json(400, { 
      success: false, 
      error: { message: "Invalid parameters", code: "VALIDATION_ERROR" } 
    })
  }
  
  try {
    const userRecord = $app.findFirstRecordByData("users", "wallet_address", user_address)
    const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id)
    
    // Get withdrawal fee from config
    const configRecord = $app.findFirstRecordByData("wallet_configs", "key", "WITHDRAWAL_FEE")
    const withdrawalFeeRate = configRecord.getNumber("value") // e.g., 0.05
    
    const balance = walletRecord.getNumber("usdt_balance")
    const fee = amount * withdrawalFeeRate
    const totalRequired = amount + fee
    
    if (balance < totalRequired) {
      return e.json(400, { 
        success: false, 
        error: { message: "Insufficient balance", code: "INSUFFICIENT_BALANCE" } 
      })
    }
    
    // Update wallet
    walletRecord.set("usdt_balance", balance - totalRequired)
    walletRecord.set("total_withdrawn", walletRecord.getNumber("total_withdrawn") + amount)
    walletRecord.set("last_transaction_at", new Date().toISOString())
    $app.save(walletRecord)
    
    // Update user record
    userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"))
    $app.save(userRecord)
    
    e.json(200, {
      success: true,
      data: {
        amount: amount,
        fee: fee,
        net_amount: amount,
        new_balance: walletRecord.getNumber("usdt_balance")
      }
    })
  } catch (error) {
    e.json(500, {
      success: false,
      error: { message: error.message, code: "WITHDRAWAL_FAILED" }
    })
  }
})
```

### 2.5 Hook: Spend USDT

**File:** `apps/backend/pb_hooks/08-spend-usdt.pb.js`

**Endpoint:** `POST /api/v2/wallet/spend`

**Request:**
```json
{
  "user_address": "0x...",
  "amount": 25.00,
  "purpose": "food_item"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 25.00,
    "purpose": "food_item",
    "new_balance": 75.00
  }
}
```

**Logic:**
```javascript
routerAdd("POST", "/api/v2/wallet/spend", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  const { user_address, amount, purpose } = body
  
  if (!user_address || !amount || amount <= 0 || !purpose) {
    return e.json(400, { 
      success: false, 
      error: { message: "Invalid parameters", code: "VALIDATION_ERROR" } 
    })
  }
  
  try {
    const userRecord = $app.findFirstRecordByData("users", "wallet_address", user_address)
    const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id)
    
    const balance = walletRecord.getNumber("usdt_balance")
    
    if (balance < amount) {
      return e.json(400, { 
        success: false, 
        error: { message: "Insufficient balance", code: "INSUFFICIENT_BALANCE" } 
      })
    }
    
    // Update wallet
    walletRecord.set("usdt_balance", balance - amount)
    walletRecord.set("total_spent", walletRecord.getNumber("total_spent") + amount)
    walletRecord.set("last_transaction_at", new Date().toISOString())
    $app.save(walletRecord)
    
    // Update user record
    userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"))
    
    // Track food items if applicable
    if (purpose === "food_item") {
      userRecord.set("lifetime_food_items", userRecord.getNumber("lifetime_food_items") + 1)
    }
    
    $app.save(userRecord)
    
    e.json(200, {
      success: true,
      data: {
        amount: amount,
        purpose: purpose,
        new_balance: walletRecord.getNumber("usdt_balance")
      }
    })
  } catch (error) {
    e.json(500, {
      success: false,
      error: { message: error.message, code: "SPEND_FAILED" }
    })
  }
})
```

### 2.6 Hook: Transfer USDT (P2P)

**File:** `apps/backend/pb_hooks/09-transfer-usdt.pb.js`

**Endpoint:** `POST /api/v2/wallet/transfer`

**Request:**
```json
{
  "from_address": "0x...",
  "to_address": "0x...",
  "amount": 10.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 10.00,
    "from_new_balance": 90.00,
    "to_new_balance": 60.00
  }
}
```

**Logic:**
```javascript
routerAdd("POST", "/api/v2/wallet/transfer", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  const { from_address, to_address, amount } = body
  
  if (!from_address || !to_address || !amount || amount <= 0) {
    return e.json(400, { 
      success: false, 
      error: { message: "Invalid parameters", code: "VALIDATION_ERROR" } 
    })
  }
  
  try {
    const fromUser = $app.findFirstRecordByData("users", "wallet_address", from_address)
    const toUser = $app.findFirstRecordByData("users", "wallet_address", to_address)
    
    if (!fromUser || !toUser) {
      return e.json(404, { 
        success: false, 
        error: { message: "User not found", code: "USER_NOT_FOUND" } 
      })
    }
    
    const fromWallet = $app.findFirstRecordByData("user_wallets", "user_id", fromUser.id)
    const toWallet = $app.findFirstRecordByData("user_wallets", "user_id", toUser.id)
    
    const fromBalance = fromWallet.getNumber("usdt_balance")
    
    if (fromBalance < amount) {
      return e.json(400, { 
        success: false, 
        error: { message: "Insufficient balance", code: "INSUFFICIENT_BALANCE" } 
      })
    }
    
    // Atomic transfer
    fromWallet.set("usdt_balance", fromBalance - amount)
    fromWallet.set("total_spent", fromWallet.getNumber("total_spent") + amount)
    fromWallet.set("last_transaction_at", new Date().toISOString())
    $app.save(fromWallet)
    
    const toBalance = toWallet.getNumber("usdt_balance")
    toWallet.set("usdt_balance", toBalance + amount)
    toWallet.set("total_earned", toWallet.getNumber("total_earned") + amount)
    toWallet.set("last_transaction_at", new Date().toISOString())
    $app.save(toWallet)
    
    // Update user records
    fromUser.set("usdt_balance", fromWallet.getNumber("usdt_balance"))
    toUser.set("usdt_balance", toWallet.getNumber("usdt_balance"))
    $app.save(fromUser)
    $app.save(toUser)
    
    e.json(200, {
      success: true,
      data: {
        amount: amount,
        from_new_balance: fromWallet.getNumber("usdt_balance"),
        to_new_balance: toWallet.getNumber("usdt_balance")
      }
    })
  } catch (error) {
    e.json(500, {
      success: false,
      error: { message: error.message, code: "TRANSFER_FAILED" }
    })
  }
})
```

### 2.7 Hook: Update User Tier

**File:** `apps/backend/pb_hooks/10-update-tier.pb.js`

**Endpoint:** `POST /api/v2/user/update-tier`

**Request:**
```json
{
  "user_address": "0x...",
  "tier": "gold"
}
```

**Logic:**
```javascript
routerAdd("POST", "/api/v2/user/update-tier", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  const { user_address, tier } = body
  
  if (!user_address || !tier) {
    return e.json(400, { 
      success: false, 
      error: { message: "Invalid parameters", code: "VALIDATION_ERROR" } 
    })
  }
  
  try {
    const userRecord = $app.findFirstRecordByData("users", "wallet_address", user_address)
    
    const tiers = ["bronze", "silver", "gold", "platinum", "diamond"]
    const currentTierIndex = tiers.indexOf(userRecord.getString("highest_tier_reached"))
    const newTierIndex = tiers.indexOf(tier)
    
    // Only update if new tier is higher
    if (newTierIndex > currentTierIndex) {
      userRecord.set("highest_tier_reached", tier)
      $app.save(userRecord)
    }
    
    e.json(200, {
      success: true,
      data: {
        highest_tier_reached: userRecord.getString("highest_tier_reached")
      }
    })
  } catch (error) {
    e.json(500, {
      success: false,
      error: { message: error.message, code: "TIER_UPDATE_FAILED" }
    })
  }
})
```

---

## Phase 3: Wallet API Updates

### 3.1 Add USDT Balance Endpoint

**File:** `wallet-api/server.js`

**Endpoint:** `POST /api/v1/wallet/balance`

```javascript
app.post('/api/v1/wallet/balance', async (req, res) => {
    try {
        const { user_address } = req.body
        
        if (!user_address) {
            return res.status(400).json({ 
                success: false, 
                error: 'user_address is required' 
            })
        }
        
        // Query PocketBase for wallet balance
        const response = await fetch(`${POCKETBASE_URL}/api/collections/user_wallets/records`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        })
        
        const data = await response.json()
        const wallet = data.items.find(w => w.user_address === user_address)
        
        if (!wallet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Wallet not found' 
            })
        }
        
        res.json({
            success: true,
            data: {
                usdt_balance: wallet.usdt_balance,
                total_earned: wallet.total_earned,
                total_spent: wallet.total_spent
            }
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        })
    }
})
```

---

## Phase 4: Integration Tests

### 4.1 Wallet Lifecycle Tests

**File:** `apps/backend/wallet.test.js`

**Test Cases:**

```javascript
import { describe, it, expect, beforeEach } from 'bun:test'

describe('Wallet Management System', () => {
  let testUser, testUser2
  
  beforeEach(async () => {
    // Setup test users
    testUser = await createTestUser('test1@example.com')
    testUser2 = await createTestUser('test2@example.com')
  })
  
  describe('UserWallet Creation', () => {
    it('should auto-create UserWallet on user signup', async () => {
      const wallet = await getUserWallet(testUser.id)
      expect(wallet).toBeDefined()
      expect(wallet.usdt_balance).toBe(0)
      expect(wallet.total_earned).toBe(0)
    })
  })
  
  describe('getWalletBalance', () => {
    it('should return USDT balance for user address', async () => {
      const result = await getWalletBalance(testUser.wallet_address)
      expect(result.success).toBe(true)
      expect(result.data.usdt_balance).toBe(0)
    })
    
    it('should return WALLET_NOT_FOUND for unknown address', async () => {
      const result = await getWalletBalance('0xUnknown')
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('WALLET_NOT_FOUND')
    })
  })
  
  describe('withdrawUSDT', () => {
    beforeEach(async () => {
      await creditUSDT(testUser.wallet_address, 100)
    })
    
    it('should withdraw USDT with fee deduction', async () => {
      const result = await withdrawUSDT(testUser.wallet_address, 50)
      expect(result.success).toBe(true)
      expect(result.data.fee).toBe(2.5) // 5% fee
      expect(result.data.net_amount).toBe(50)
      
      const balance = await getWalletBalance(testUser.wallet_address)
      expect(balance.data.usdt_balance).toBe(47.5)
    })
    
    it('should fail with INSUFFICIENT_BALANCE', async () => {
      const result = await withdrawUSDT(testUser.wallet_address, 150)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
    })
  })
  
  describe('spendUSDT', () => {
    beforeEach(async () => {
      await creditUSDT(testUser.wallet_address, 100)
    })
    
    it('should spend USDT for food_item', async () => {
      const result = await spendUSDT(testUser.wallet_address, 25, 'food_item')
      expect(result.success).toBe(true)
      
      const balance = await getWalletBalance(testUser.wallet_address)
      expect(balance.data.usdt_balance).toBe(75)
      
      const user = await getUser(testUser.id)
      expect(user.lifetime_food_items).toBe(1)
    })
    
    it('should fail with INSUFFICIENT_BALANCE', async () => {
      const result = await spendUSDT(testUser.wallet_address, 150, 'food_item')
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
    })
  })
  
  describe('transferUSDT', () => {
    beforeEach(async () => {
      await creditUSDT(testUser.wallet_address, 100)
      await creditUSDT(testUser2.wallet_address, 50)
    })
    
    it('should transfer USDT between users', async () => {
      const result = await transferUSDT(
        testUser.wallet_address,
        testUser2.wallet_address,
        30
      )
      expect(result.success).toBe(true)
      
      const fromBalance = await getWalletBalance(testUser.wallet_address)
      const toBalance = await getWalletBalance(testUser2.wallet_address)
      
      expect(fromBalance.data.usdt_balance).toBe(70)
      expect(toBalance.data.usdt_balance).toBe(80)
    })
    
    it('should fail with INSUFFICIENT_BALANCE', async () => {
      const result = await transferUSDT(
        testUser.wallet_address,
        testUser2.wallet_address,
        150
      )
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
    })
  })
  
  describe('Referral Chain', () => {
    it('should create 4-level referral chain', async () => {
      // Create chain: U1 -> U2 -> U3 -> U4 -> U5
      const u1 = await createTestUser('u1@example.com')
      const u2 = await createTestUser('u2@example.com', u1.id)
      const u3 = await createTestUser('u3@example.com', u2.id)
      const u4 = await createTestUser('u4@example.com', u3.id)
      const u5 = await createTestUser('u5@example.com', u4.id)
      
      // Check referrals for u1
      const referrals = await getReferrals(u1.id)
      expect(referrals.length).toBe(4) // u2 (G1), u3 (G2), u4 (G3), u5 (G4)
      
      expect(referrals[0].level).toBe(1)
      expect(referrals[0].referee_id).toBe(u2.id)
      
      expect(referrals[3].level).toBe(4)
      expect(referrals[3].referee_id).toBe(u5.id)
    })
    
    it('should update total_direct_recruits', async () => {
      const u1 = await createTestUser('p1@example.com')
      await createTestUser('p2@example.com', u1.id)
      await createTestUser('p3@example.com', u1.id)
      
      const updatedU1 = await getUser(u1.id)
      expect(updatedU1.total_direct_recruits).toBe(2)
    })
  })
  
  describe('No Locked States', () => {
    it('should allow immediate spend after credit', async () => {
      await creditUSDT(testUser.wallet_address, 100)
      
      // Should be immediately spendable
      const spendResult = await spendUSDT(testUser.wallet_address, 100, 'food_item')
      expect(spendResult.success).toBe(true)
      
      const balance = await getWalletBalance(testUser.wallet_address)
      expect(balance.data.usdt_balance).toBe(0)
    })
  })
  
  describe('Tier Tracking', () => {
    it('should track highest tier reached', async () => {
      await updateTier(testUser.wallet_address, 'silver')
      let user = await getUser(testUser.id)
      expect(user.highest_tier_reached).toBe('silver')
      
      await updateTier(testUser.wallet_address, 'gold')
      user = await getUser(testUser.id)
      expect(user.highest_tier_reached).toBe('gold')
      
      // Should not downgrade
      await updateTier(testUser.wallet_address, 'silver')
      user = await getUser(testUser.id)
      expect(user.highest_tier_reached).toBe('gold')
    })
  })
})

// Helper functions
async function createTestUser(email, referrerId = null) {
  // Create user via PocketBase API
}

async function getUserWallet(userId) {
  // Query user_wallets collection
}

async function getWalletBalance(address) {
  // Call /api/v2/wallet/balance
}

async function creditUSDT(address, amount) {
  // Helper to add USDT for testing
}

async function withdrawUSDT(address, amount) {
  // Call /api/v2/wallet/withdraw
}

async function spendUSDT(address, amount, purpose) {
  // Call /api/v2/wallet/spend
}

async function transferUSDT(from, to, amount) {
  // Call /api/v2/wallet/transfer
}

async function getReferrals(userId) {
  // Query referrals collection
}

async function updateTier(address, tier) {
  // Call /api/v2/user/update-tier
}
```

---

## Phase 5: Testing & Validation

### 5.1 Manual Testing Checklist

- [ ] User signup creates UserWallet with 0 balance
- [ ] Referral chain creates 4 levels correctly
- [ ] `getWalletBalance` returns correct data
- [ ] `withdrawUSDT` deducts fee (5%)
- [ ] `spendUSDT` decrements balance and tracks food items
- [ ] `transferUSDT` moves funds between wallets
- [ ] No locked states - funds immediately spendable
- [ ] `INSUFFICIENT_BALANCE` errors work correctly
- [ ] Tier tracking updates highest tier only

### 5.2 Integration Test Commands

```bash
# Run backend tests
cd apps/backend
docker-compose exec backend pocketbase test

# Run wallet API tests
cd wallet-api
bun test

# Run full integration tests
bun run test:integration
```

---

## Implementation Order

1. **Day 1:** Database schema (collections + migrations)
2. **Day 2:** Core hooks (06-balance, 07-withdraw, 08-spend)
3. **Day 3:** Advanced hooks (09-transfer, 10-tier, 05-referral)
4. **Day 4:** Integration tests + bug fixes
5. **Day 5:** Manual testing + documentation

---

## Acceptance Criteria Mapping

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| UserWallet data model | Phase 1.2 | ☐ |
| getWalletBalance() | Phase 2.3 | ☐ |
| withdrawUSDT() | Phase 2.4 | ☐ |
| WITHDRAWAL_FEE deducted | Phase 2.4 (config collection) | ☐ |
| spendUSDT() | Phase 2.5 | ☐ |
| transferUSDT() | Phase 2.6 | ☐ |
| No locked states | All hooks (direct balance updates) | ☐ |
| Referral chain (4 levels) | Phase 1.3 + 2.2 | ☐ |
| Track direct recruits | Phase 1.1 + 2.2 | ☐ |
| Track food items | Phase 1.1 + 2.5 | ☐ |
| Track highest tier | Phase 1.1 + 2.7 | ☐ |
| Integration tests | Phase 4 | ☐ |

---

## Dependencies

- PocketBase running (port 8090)
- Wallet API running (port 3001)
- Test users with wallets created
- Config collection populated with WITHDRAWAL_FEE

---

## Notes

- All USDT is immediately spendable (no vesting/locking)
- Withdrawal fee is configurable via admin UI
- Referral chain auto-generates on user creation
- Tier updates only increase (never downgrade)
- All hooks require authentication via `$apis.requireAuth(e)`

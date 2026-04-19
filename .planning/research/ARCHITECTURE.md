# Architecture Research — v0.0.7 Security & Quality

**Domain:** Blockchain NFT platform with wallet management
**Researched:** 2026-04-18
**Overall confidence:** HIGH

---

## Executive Summary

Eggo NFT platform uses 3-tier architecture: Next.js frontend (static), PocketBase backend (hooks), and Express wallet-api (contract interactions). For v0.0.7, we're replacing mock blockchain calls with real ethers.js contract interactions.

**Current state:**

- Frontend: Claymorphism UI complete, Feed/Play buttons exist but disconnected
- Backend: 27 hooks handle business logic, track-deposit hook incomplete
- Wallet API: 4 endpoints return mock transactions (lines 388-512 in `server.js`)

**Architecture pattern:** Frontend → PocketBase Hook → Wallet API → Blockchain → Database Update

---

## Wallet-API Contract Integration

### Current Architecture

**Request/Response Format** (from `server.js` lines 379-512):

```javascript
// Current mock endpoints (ALL need real implementation):
POST /api/wallet/mint-egg
POST /api/wallet/claim-commission
POST /api/wallet/mint-food
POST /api/wallet/feed-egg

// Request format:
{
  "wallet": "0x...",
  "daccPublicKey": "daccPublickey_0x...",
  "pin": "randomPassword123",
  "referralChain": ["0x...", "0x...", null, null],
  "eggNftAddress": "0x..."
}

// Response format:
{
  "success": true,
  "data": {
    "txHash": "0xMOCK",  // ❌ Currently fake
    "food_ids": [1,2,3],
    "status": "pending_blockchain_confirmation"
  }
}
```

**Hook Integration Points** (from `13-mint-egg-nft.pb.js`):

```javascript
// PocketBase hook calls wallet-api:
const response = fetch("http://wallet-api:3001/api/wallet/mint-egg", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    wallet: wallet.get("wallet"),
    daccPublicKey: wallet.get("daccPublickey"),
    pin: wallet.get("pin"), // Encrypted password
    referralChain: referralChain,
    eggNftAddress: eggNftAddress,
  }),
})
```

### Required Changes

#### 1. Private Key Storage & Decryption Flow

**Current approach** (from `wallet-api/server.js` lines 7-59):

```javascript
// Master key from environment
const MASTER_KEY = process.env.WALLET_MASTER_KEY || "change-this-in-production"

// Encryption key = MASTER_KEY + userId (unique per user)
const encryptionKey = MASTER_KEY + userId

// Decrypt function (supports v3 XOR legacy and v4 AES-GCM)
async function decryptPrivateKey(encryptedData, masterKey) {
  if (encryptedData.version === 4) {
    // AES-256-GCM with IV + authTag
    const key = crypto.createHash("sha256").update(masterKey).digest()
    const iv = Buffer.from(encryptedData.iv, "hex")
    const authTag = Buffer.from(encryptedData.authTag, "hex")
    const ciphertext = Buffer.from(encryptedData.ciphertext, "hex")

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, null, "utf8")
    decrypted += decipher.final("utf8")
    return decrypted // Private key
  }
}
```

**Required implementation for contract calls:**

```javascript
// REAL implementation needed (replace mock):
app.post("/api/wallet/mint-egg", async (req, res) => {
  const { wallet: walletAddress, daccPublicKey, pin, referralChain, eggNftAddress } = req.body

  // 1. Validate inputs
  if (!walletAddress || !pin) {
    return res.status(400).json({ success: false, error: { message: "Missing params" } })
  }

  // 2. Get user's encrypted private key from database
  // (Need to fetch from PocketBase or have hook pass it)
  const encryptedPrivateKey = await fetchFromPocketBase(walletAddress)

  // 3. Decrypt using MASTER_KEY + walletAddress
  const encryptionKey = MASTER_KEY + walletAddress
  const privateKey = await decryptPrivateKey(encryptedPrivateKey, encryptionKey)

  // 4. Create ethers signer
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  const signer = new ethers.Wallet(privateKey, provider)

  // 5. Connect to NFT contract
  const nftContract = new ethers.Contract(eggNftAddress, EGG_NFT_ABI, signer)

  // 6. Execute transaction
  const tx = await nftContract.mintEgg(referralChain)
  await tx.wait() // Wait for confirmation

  // 7. Return real tx hash
  res.json({
    success: true,
    data: {
      txHash: tx.hash, // ✅ REAL
      status: "confirmed",
    },
  })
})
```

#### 2. Master Key Management

**Security architecture:**

```bash
# Environment variable (NEVER commit)
WALLET_MASTER_KEY=<32-char-random-string>

# Generate with:
openssl rand -hex 32
# Output: 64-character hex string (256 bits)
```

**Key properties:**

- **Never stored in database** — only in environment
- **Combined with user ID** — `MASTER_KEY + userId` creates unique key per user
- **Encrypted at rest** — AES-256-GCM with IV + authTag
- **Never logged** — no console.log of private keys

**Production deployment:**

```bash
# Docker Compose
services:
  wallet-api:
    environment:
      - WALLET_MASTER_KEY=${WALLET_MASTER_KEY}  # From .env file
      - NODE_ENV=production

# Or in production server
export WALLET_MASTER_KEY="<secret>"
```

#### 3. Contract ABI Management

**Required:** Store contract ABIs for wallet-api to use.

```javascript
// wallet-api/contracts/egg-nft-abi.json
;[
  {
    inputs: [{ name: "referrerChain", type: "address[]" }],
    name: "mintEgg",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // ... more functions
]
```

**Better approach:** Hardcode minimal ABI in `server.js` to avoid file I/O:

```javascript
const EGG_NFT_ABI = [
  "function mintEgg(address[] referrerChain) external payable returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
]
```

#### 4. Error Handling & Retry Logic

**Recommended pattern:**

```javascript
app.post("/api/wallet/mint-egg", async (req, res) => {
  try {
    // ... contract call
  } catch (error) {
    console.error("Mint egg contract call failed:", {
      wallet: walletAddress,
      error: error.message,
      code: error.code,
    })

    // Categorize errors
    let errorCode = "CONTRACT_CALL_FAILED"
    if (error.code === "INSUFFICIENT_FUNDS") {
      errorCode = "INSUFFICIENT_GAS"
    } else if (error.code === "NONCE_TOO_LOW") {
      errorCode = "NETWORK_CONGESTION"
    }

    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: errorCode,
      },
    })
  }
})
```

---

## Track-Deposit Hook Architecture

### Current State (from `13-track-deposit.pb.js`)

Hook exists at `apps/backend/pb_hooks/13-track-deposit.pb.js` with:

```javascript
routerAdd("POST", "/api/v2/deposit/poll", async (e) => {
  e.requireAuth()
  const { user_address } = e.parseBody()

  // Polls CommissionDistribution contract for Transfer events
  // Uses eth_getLogs with fromBlock: "latest", toBlock: "latest"

  // Checks for duplicate tx_hash before creating deposit record
  // Updates user_wallets.usdt_balance on confirmed deposits
})
```

**Limitations:**

- Only polls latest block (not historical)
- No scheduled polling (requires manual trigger)
- No backfill mechanism for missed events

### Architecture Options

| Option                                   | Pros                         | Cons                          | Recommendation     |
| ---------------------------------------- | ---------------------------- | ----------------------------- | ------------------ |
| **1. PocketBase hook polling**           | Simple, existing codebase    | No scheduling, manual trigger | ❌ Not suitable    |
| **2. Separate polling service**          | Full control, scheduled jobs | New service to maintain       | ✅ **RECOMMENDED** |
| **3. External webhook (Alchemy/Infura)** | No polling needed, real-time | Vendor lock-in, cost          | ⚠️ Alternative     |

### Recommended Approach: Separate Polling Service

**Architecture diagram:**

```
┌──────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Cron Job        │──────▶  Poller Service  │──────▶  PocketBase     │
│  (every 30s)     │      │  (Node.js)       │      │  API            │
└──────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │  BSC RPC Node    │
                          │  (eth_getLogs)   │
                          └──────────────────┘
```

**New service structure:**

```
deposit-poller/
├── index.js           # Main polling loop
├── poller.js          # Event polling logic
├── pocketbase.js      # PB API client
├── config.js          # Contract addresses, RPC URL
└── package.json
```

**Polling logic:**

```javascript
// deposit-poller/poller.js
const { ethers } = require("ethers")

async function pollDeposits(userAddress, fromBlock, toBlock) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)

  const transferSignature = "0xddf252ad..." // Transfer event topic
  const toTopic = `0x${userAddress.slice(2).padStart(64, "0")}`

  const logs = await provider.getLogs({
    address: process.env.COMMISSION_DISTRIBUTION_ADDRESS,
    topics: [transferSignature, null, toTopic],
    fromBlock: fromBlock,
    toBlock: toBlock,
  })

  return logs.map((log) => ({
    txHash: log.transactionHash,
    amount: ethers.formatUnits(log.data, 6), // USDT has 6 decimals
    fromAddress: `0x${log.topics[1].slice(26)}`,
    blockNumber: log.blockNumber,
  }))
}

// Main loop
setInterval(async () => {
  // 1. Get all user wallets from PocketBase
  const wallets = await pocketBase.getAllUserWallets()

  // 2. Get last polled block (stored in DB)
  const lastPolledBlock = await getLastPolledBlock()

  // 3. Poll each wallet
  for (const wallet of wallets) {
    const deposits = await pollDeposits(wallet.address, lastPolledBlock, "latest")

    // 4. Filter duplicates and update balances
    for (const deposit of deposits) {
      const exists = await pocketBase.depositExists(deposit.txHash)
      if (!exists) {
        await pocketBase.createDeposit(deposit)
        await pocketBase.updateBalance(wallet.userId, deposit.amount)
      }
    }
  }

  // 5. Update lastPolledBlock
  await setLastPolledBlock("latest")
}, 30000) // Every 30 seconds
```

**Why this approach:**

1. **Deduplication:** Stores lastPolledBlock in database, never processes same event twice
2. **Scheduled:** Runs automatically, no manual trigger needed
3. **Decoupled:** Doesn't block PocketBase threads
4. **Observable:** Can monitor poller health separately
5. **Scalable:** Easy parallelize if needed

**Integration with existing hook:**

The existing `13-track-deposit.pb.js` endpoint can remain for:

- Manual re-polling (admin feature)
- On-demand balance refresh for specific user
- Backfill mechanism

---

## Mobile Responsive Architecture

### Component Strategy

**Recommended pattern** (from existing claymorphism UI in `apps/web/app/`):

```typescript
// Responsive wrapper component with mobile-first CSS
export function ResponsivePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      w-full
      min-h-screen
      px-4           // Base: 16px padding on mobile (320px+)
      sm:px-6        // Small: 24px (640px+)
      lg:px-8        // Large: 32px (1024px+)
    ">
      {children}
    </div>
  )
}
```

**Component variants vs conditional rendering:**

```typescript
// ✅ PATTERN A: Responsive wrapper (PREFERRED)
// Single component adapts via Tailwind breakpoints
export function FoodCard({ food }: { food: FoodNFT }) {
  return (
    <div className="
      w-full
      sm:w-1/2      // Tablet: 2 columns
      lg:w-1/3      // Desktop: 3 columns
      xl:w-1/4      // Large: 4 columns
    ">
      {/* Content */}
    </div>
  )
}

// ✅ PATTERN B: Conditional rendering for complex layouts
// Mobile: simplified UI, Desktop: full UI
export function EggDashboard({ egg }: { egg: EggNFT }) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  if (isMobile) {
    return <MobileEggView egg={egg} />  // Simplified
  }

  return <DesktopEggView egg={egg} />   // Full UI with stats
}

// ❌ ANTI-PATTERN: Responsive logic scattered in component
export function BadExample() {
  return (
    <div className={width < 640 ? 'text-sm' : 'text-lg'}>  // Don't do this
      {/* ... */}
    </div>
  )
}
```

### Data Flow: UI Button → Contract → Database

**Feed feature example:**

```
┌─────────────────────┐
│  User taps "Feed"   │
│  button in UI       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Frontend           │
│  (apps/web/app/    │
│   eggs/page.tsx)   │
│                     │
│  - Validate owner-  │
│    ship client-side │
│  - Show loading UI  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  POST /api/v2/      │
│  feed-egg           │
│  (PocketBase hook)  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  16-feed-egg.pb.js  │
│                     │
│  - Verify ownership │
│  - Validate inputs  │
│  - Call wallet-api  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Wallet API         │
│  (POST /api/wallet/ │
│   feed-egg)         │
│                     │
│  - Decrypt key      │
│  - Create signer    │
│  - Call contract    │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Smart Contract     │
│  (FoodNFT + EggNFT) │
│                     │
│  - Consume food     │
│  - Update foodCount │
│  - Emit event       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Hook updates DB    │
│                     │
│  - egg_nfts.        │
│    food_count++     │
│  - food_nfts.       │
│    is_consumed=true │
│  - Create log       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Frontend refreshes │
│                     │
│  - Refetch egg data │
│  - Update UI state  │
│  - Show success     │
└─────────────────────┘
```

**Frontend implementation** (from `apps/web/app/eggs/page.tsx`):

```typescript
// Current state (line 89):
<button
  onClick={async () => {
    // TODO: Implement feed flow
    await handleFeed(egg.id, selectedFoodIds)
  }}
  disabled={!canFeed}
>
  Feed Egg
</button>

// Required implementation:
async function handleFeed(eggId: number, foodIds: number[]) {
  try {
    setLoading(true)

    const response = await fetch(`${PB_URL}/api/v2/feed-egg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      },
      body: JSON.stringify({
        egg_token_id: eggId,
        food_ids: foodIds
      })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error.message)
    }

    // Update UI
    toast.success('Egg fed successfully!')
    await refreshEggData()  // Refetch from PocketBase
    setSelectedFoodIds([])  // Clear selection

  } catch (error) {
    toast.error(`Failed to feed egg: ${error.message}`)
  } finally {
    setLoading(false)
  }
}
```

### Responsive Breakpoint Strategy

**Project convention** (Tailwind CSS 4, from `apps/web/`):

```typescript
// apps/web/app/eggs/[[...id]]/page.tsx
<div className="
  grid
  grid-cols-1        // Mobile: single column (320px)
  sm:grid-cols-2     // Tablet: 2 columns (640px)
  lg:grid-cols-3     // Desktop: 3 columns (1024px)
  xl:grid-cols-4     // Large: 4 columns (1280px)
  gap-4
  sm:gap-6
  lg:gap-8
">
```

---

## Feed/Play Data Flow Architecture

### Complete Flow for Feed Feature

**Steps with responsible component:**

| Step | Component                                 | Responsibility                                 |
| ---- | ----------------------------------------- | ---------------------------------------------- |
| 1    | `apps/web/app/eggs/page.tsx`              | Render Feed button, validate user selection    |
| 2    | `apps/web/lib/pocketbase/client.ts`       | Add Authorization header, handle auth          |
| 3    | `apps/backend/pb_hooks/16-feed-egg.pb.js` | Verify ownership, parse body, validate         |
| 4    | `apps/backend/pb_hooks/16-feed-egg.pb.js` | Call wallet-api endpoint                       |
| 5    | `wallet-api/server.js` lines 479-512      | **Decrypt private key from pin**               |
| 6    | `wallet-api/server.js`                    | Create ethers signer, call `foodNFT.feedEgg()` |
| 7    | `wallet-api/server.js`                    | Wait for transaction confirmation              |
| 8    | `apps/backend/pb_hooks/16-feed-egg.pb.js` | Update `egg_nfts.food_count`                   |
| 9    | `apps/backend/pb_hooks/16-feed-egg.pb.js` | Mark `food_nfts.is_consumed = true`            |
| 10   | `apps/backend/pb_hooks/16-feed-egg.pb.js` | Create `egg_consumption_logs` record           |
| 11   | `apps/web/app/eggs/page.tsx`              | Refetch egg data, update UI                    |

**Data transformations:**

```javascript
// Frontend → Backend
{
  "egg_token_id": 123,
  "food_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

// Backend → Wallet API
{
  "wallet": "0x123...",
  "daccPublicKey": "daccPublickey_0x123...",
  "pin": "randomPassword123",
  "egg_token_id": 123,
  "food_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "foodNftAddress": "0xFOOD_CONTRACT",
  "eggNftAddress": "0xEGG_CONTRACT"
}

// Wallet API → Contract
// Call: foodNFT.contract.feedEgg(
//   tokenId: 123,
//   foodIds: [1, 2, 3, ...],
//   owner: "0x123..."
// )

// Contract → Backend
{
  "txHash": "0xREAL_HASH",
  "success": true
}

// Backend → Frontend
{
  "success": true,
  "data": {
    "egg_token_id": 123,
    "new_food_count": 12,
    "ready_to_hatch": true,
    "tx_hash": "0xREAL_HASH",
    "food_type_distribution": {
      "grain": 4,
      "fish": 3,
      "insects": 2,
      "herb": 1
    }
  }
}
```

### Play Feature Architecture

**Status:** UI button exists (line 95 in `apps/web/app/eggs/page.tsx`) but game mechanics undefined.

**Required decisions before implementation:**

1. **What is "play"?**
   - Minigame (tap/click game)?
   - Social interaction (show egg to friends)?
   - Earning mechanism (generate rewards)?

2. **On-chain or off-chain?**
   - On-chain: Smart contract call, gas fees, slow UX
   - Off-chain: Database updates only, instant feedback

3. **State storage?**
   - Smart contract: Immutable, expensive, gas fees
   - PocketBase: Mutable, cheap, can migrate

**Recommended approach for MVP:**

```typescript
// Off-chain play interaction
POST /api/v2/play-with-egg
{
  "egg_token_id": 123,
  "interaction_type": "pet"  // or "play", "clean", etc.
}

// Response
{
  "success": true,
  "data": {
    "happiness": 85,  // Updated stat
    "xp_gained": 10,
    "new_level": 5
  }
}
```

This doesn't require wallet-api contract calls — simple PocketBase hook updating `egg_nfts` metadata fields.

---

## Build Order

### Phase Dependencies

```
┌────────────────────────────────────┐
│  1. Wallet-API Contract Layer      │  ← Foundation (blocks all others)
│     - Real ethers.js calls         │
│     - Contract ABI management      │
│     - Private key decryption       │
└────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────┐
│  2. Track-Deposit Infrastructure   │  ← Parallel with 3
│     - Deploy polling service       │
│     - Configure scheduled jobs     │
│     - Backfill historical data     │
└────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────┐
│  3. Feed Feature (Full Stack)      │  ← Depends on 1
│     - Frontend: Hook up button     │
│     - Backend: Already exists      │
│     - Wallet-API: Real contract    │
└────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────┐
│  4. Play Feature                   │  ← Need design decision
│     - Define game mechanics        │
│     - Off-chain state preferred    │
│     - No contract call needed      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  5. Mobile Polish                  │  ← Parallel with any phase
│     - Responsive CSS tuning        │
│     - Touch interaction testing    │
│     - Performance optimization     │
└────────────────────────────────────┘
```

### Detailed Task Sequence

**Phase 1: Wallet-API Contract Implementation (CRITICAL)**

```markdown
# Foundation - Blocks all other phases

## Tasks:

1. [ ] **Add environment variables**
   - NEXT_PUBLIC_RPC_URL (BSC testnet/mainnet)
   - WALLET_MASTER_KEY (production secret)
   - EGG_NFT_CONTRACT_ADDRESS
   - FOOD_NFT_CONTRACT_ADDRESS

2. [ ] **Implement real contract calls**
   - `/api/wallet/mint-egg` (line 379)
   - `/api/wallet/claim-commission` (line 408)
   - `/api/wallet/mint-food` (line 442)
   - `/api/wallet/feed-egg` (line 479)

3. [ ] **Test contract interactions**
   - Verify private key decryption
   - Test on BSC testnet first
   - Verify gas estimation

4. [ ] **Error handling**
   - Insufficient gas errors
   - Network timeout handling
   - Transaction failure recovery
```

**Phase 2: Track-Deposit Service**

```markdown
## Tasks:

1. [ ] **Set up polling service**
   - Create `deposit-poller/` directory
   - Install ethers v6
   - Configure RPC endpoint

2. [ ] **Implement polling logic**
   - lastPolledBlock tracking
   - eth_getLogs for each wallet
   - Duplicate detection via tx_hash

3. [ ] **Database integration**
   - Create/update deposits collection
   - Hook into user_wallets balance updates

4. [ ] **Deploy and monitor**
   - Docker container or PM2 process
   - Health check endpoint
   - Alerting on failures
```

**Phase 3: Feed Feature**

```markdown
## Tasks:

1. [ ] **Frontend: Hook up button**
   - Replace TODO in `apps/web/app/eggs/page.tsx:89`
   - Add loading state
   - Add error handling

2. [ ] **Food selection**
   - Implement food NFT picker
   - Validate 10 food items required
   - Show food type distribution

3. [ ] **Backend: Already complete**
   - `16-feed-egg.pb.js` handles all logic
   - No changes needed

4. [ ] **UI feedback**
   - Success/error toasts
   - Refresh egg data after feed
   - Show "Ready to Hatch" when food_count >= 10
```

**Phase 4: Play Feature**

```markdown
## Tasks:

1. [ ] **Game design decision**
   - Define "play" mechanics
   - Decide on-chain vs off-chain
   - Define rewards/benefits

2. [ ] **Off-chain implementation** (recommended)
   - New PocketBase hook: `POST /api/v2/play-with-egg`
   - Update egg metadata (happiness, xp)
   - Create play_logs collection

3. [ ] **Frontend**
   - Hook up Play button
   - Add interaction animations
   - Show updated stats
```

**Phase 5: Mobile Polish**

```markdown
## Tasks:

1. [ ] **Audit responsive layouts**
   - Check all pages on 320px-1440px
   - Test landscape orientation
   - Verify touch targets (44px min)

2. [ ] **CSS consistency**
   - Use Tailwind breakpoints consistently
   - Mobile-first CSS (base styles for mobile)
   - Conditional rendering for complex UI

3. [ ] **Performance**
   - Lazy load heavy components
   - Optimize images for mobile
   - Reduce re-renders
```

---

## Security Architecture

### Critical Security Patterns

**1. Never expose private keys**

```javascript
// ✅ GOOD: Key exists only in memory
app.post('/api/wallet/mint-egg', async (req, res) => {
  const privateKey = await decryptPrivateKey(...)  // In memory only
  const signer = new ethers.Wallet(privateKey, provider)

  // Use signer, never log or store
  const tx = await signer.sendTransaction(...)

  // Clear from memory (garbage collection handles this)
  privateKey = null
})

// ❌ BAD: Logging private key
console.log('Private key:', privateKey)  // NEVER DO THIS
```

**2. Use authenticated endpoints only**

```javascript
// ✅ GOOD: Always require auth
routerAdd("POST", "/api/v2/feed-egg", (e) => {
  const user = $apis.requireAuth(e) // Auth required
  // ... rest of logic
})

// ❌ BAD: Public endpoint
routerAdd("POST", "/api/v2/feed-egg", (e) => {
  // No authentication
  // Anyone can feed anyone's egg!
})
```

**3. Validate ownership before contract calls**

```javascript
// ✅ GOOD: Verify ownership
const eggs = $app
  .dao()
  .findRecordsByFilter("egg_nfts", `token_id = ${egg_token_id} && owner.id = "${user.id}"`, "", 1)

if (eggs.length === 0) {
  return e.json(404, { error: { message: "Egg not found or not yours" } })
}

// ❌ BAD: Trusting client input
const { egg_token_id } = e.parseBody()
// Just use it without verifying ownership
```

**4. Idempotent operations (prevent duplicates)**

```javascript
// ✅ GOOD: Check existence before creating
const exists = await pocketBase.findFirstRecordByData("deposits", "tx_hash", txHash)

if (exists) {
  console.log("Deposit already tracked, skipping")
  return
}

// ❌ BAD: Always creating new record
await pocketBase.createRecord({ tx_hash: txHash })
// Will create duplicate on retry!
```

---

## Sources

- `wallet-api/server.js` — Current wallet API implementation
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Mint egg hook pattern
- `apps/backend/pb_hooks/16-feed-egg.pb.js` — Feed egg hook pattern
- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Track deposit hook (incomplete)
- `apps/web/app/eggs/page.tsx` — Frontend egg management UI
- Project documentation (`AGENTS.md`, `README.md`)

## Confidence Assessment

| Area                       | Confidence | Reason                                 |
| -------------------------- | ---------- | -------------------------------------- |
| Wallet-API Integration     | HIGH       | Analyzed existing code, patterns clear |
| Track-Deposit Architecture | MEDIUM     | Hook exists, service needs design      |
| Mobile Responsive          | HIGH       | Existing patterns in claymorphism UI   |
| Feed/Play Data Flow        | HIGH       | Hook code analyzed, flow documented    |
| Security Patterns          | HIGH       | Based on existing hook implementations |

## Open Questions

- **Play feature mechanics:** Need game design decision before implementation can proceed
- **Contract deployment status:** Need to verify contract addresses and ABI availability
- **RPC endpoint:** Need to confirm BSC testnet/mainnet RPC URLs and rate limits
- **Deposit polling interval:** 30s recommended, but trade-off between freshness vs RPC cost needs discussion

---

**Last updated:** 2026-04-18
**Next action:** Roadmap planning based on this architecture research

# Stack Research — v0.0.7 Security & Quality

**Researched:** 2026-04-18  
**Confidence:** HIGH (verified with Context7, official docs, websearch)

---

## 1. Blockchain Contract Interactions

### Current State

**Mock endpoints in `wallet-api/server.js` (lines 373-511):**

- `/api/wallet/mint-egg` — Returns fake `txHash: "0xMOCK_HASH"`
- `/api/wallet/claim-commission` — Returns fake transaction hash
- `/api/wallet/mint-food` — Returns fake food_ids array
- `/api/wallet/feed-egg` — Returns fake transaction hash

**What exists (reuse):**

- ✅ `ethers v6` already installed in `wallet-api/package.json`
- ✅ `decryptPrivateKey()` function (AES-256-GCM) — Lines 31-59
- ✅ `MASTER_KEY` environment variable pattern
- ✅ Encrypted private key storage in PocketBase `users.pin` field

### Required Additions

| Component            | Library/Version            | Purpose                            | Why                                          |
| -------------------- | -------------------------- | ---------------------------------- | -------------------------------------------- |
| **Contract ABI**     | Manual JSON                | ERC-1155 NFT interface definitions | ethers.js requires ABI for contract calls    |
| **Contract Address** | `/contract-addresses.json` | Deployed contract addresses        | Network-specific addresses (testnet/mainnet) |
| **RPC Provider**     | `ethers.JsonRpcProvider`   | BSC RPC connection                 | Already have RPC URL in config               |
| **Signer**           | `ethers.Wallet`            | Transaction signing                | Decrypt private key, create signer           |
| **Gas Estimation**   | `contract.estimateGas`     | Prevent out-of-gas errors          | Avoid failed transactions                    |

### Integration Pattern

```javascript
// wallet-api/server.js — Replace mock endpoints

const EGG_NFT_ABI = [
  "function mintEgg(uint256 eggId, address referrer) external returns (uint256 tokenId)",
  "function feedEgg(uint256 eggTokenId, uint256[] calldata foodTokenIds) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
]

// Inside endpoint handler:
app.post("/api/wallet/mint-egg", async (req, res) => {
  try {
    const { wallet: walletAddress, pin, egg_id, referralChain } = req.body

    // 1. Get user's encrypted private key from PocketBase
    const user = await pocketBase.collection("users").getOne(walletAddress)

    // 2. Decrypt private key
    const privateKey = await decryptPrivateKey(
      JSON.parse(user.pin), //encryptedPrivateKey object
      MASTER_KEY + walletAddress
    )

    // 3. Create signer and provider
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL)
    const signer = new ethers.Wallet(privateKey, provider)

    // 4. Connect to contract
    const nftContract = new ethers.Contract(process.env.EGG_NFT_ADDRESS, EGG_NFT_ABI, signer)

    // 5. Estimate gas (prevent failures)
    const gasEstimate = await nftContract.mintEgg.estimateGas(egg_id, referralChain[0])

    // 6. Execute transaction
    const tx = await nftContract.mintEgg(egg_id, referralChain[0], {
      gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer
    })

    // 7. Wait for confirmation
    const receipt = await tx.wait()

    res.json({
      success: true,
      data: {
        transaction_hash: tx.hash,
        token_id: await nftContract.tokenOfOwnerByIndex(walletAddress, 0),
        receipt: {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        },
      },
    })
  } catch (error) {
    console.error("Mint egg error:", error)
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MINT_FAILED" },
    })
  }
})
```

### Security Considerations

**CRITICAL:**

1. **Never log private keys** — Only log wallet addresses and transaction hashes
2. **Validate input before decryption** — Check parameters BEFORE calling `decryptPrivateKey()`
3. **Use environment variables** — Contract addresses must come from `.env`, not hardcoded
4. **Gas estimation** — Always estimate gas + 20% buffer to prevent out-of-gas failures
5. **Error messages** — Don't expose internal errors to client (strip stack traces)

### Environment Variables to Add

```bash
# wallet-api/.env

# BSC RPC
BSC_RPC_URL="https://bsc-testnet-rpc.publicnode.com"  # Testnet
BSC_MAINNET_RPC_URL="https://bsc-dataseed.binance.org"  # Mainnet

# Contract addresses (testnet)
EGG_NFT_ADDRESS="0x..."
FOOD_NFT_ADDRESS="0x..."
ANIMAL_NFT_ADDRESS="0x..."
COMMISSION_DISTRIBUTION_ADDRESS="0x..."
MARKETPLACE_ADDRESS="0x..."

# Contract addresses (mainnet) — separate file or prefixed
MAINNET_EGG_NFT_ADDRESS="0x..."
```

---

## 2. USDT Event Polling (Track Deposit Hook)

### Polling vs WebSocket Tradeoffs

| Approach                      | Pros                                                                                | Cons                                                                                        | Best For                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Polling (eth_getLogs)**     | ✅ Stateless (no filterId)<br>✅ Works with Infura/Alchemy<br>✅ Simple retry logic | ❌ Higher latency (block delay)<br>❌ More RPC calls                                        | ✅ Production dApps<br>✅ Multi-provider setups<br>✅ PocketBase hooks |
| **WebSocket (eth_subscribe)** | ✅ Real-time (instant)<br>✅ Fewer RPC calls                                        | ❌ Requires persistent connection<br>❌ FilterId state issues<br>❌ PocketBase incompatible | ❌ NOT recommended for this project                                    |

**Recommendation:** Use **polling with `eth_getLogs`** — matches existing architecture, stateless, works with PocketBase hooks.

### Required Libraries/Configuration

| Component             | Library/Version                      | Purpose                          | Why                               |
| --------------------- | ------------------------------------ | -------------------------------- | --------------------------------- |
| **Event Polling**     | Direct RPC `eth_getLogs`             | Query Transfer events            | ethers.js `provider.send()`       |
| **Event Parsing**     | Manual ABI decoding                  | Extract from/to/amount from logs | Transfer event is standard ERC-20 |
| **Block Tracking**    | PocketBase field `last_polled_block` | Prevent re-polling same events   | Idempotency                       |
| **Confirmation Wait** | 3-6 block confirmations              | Prevent chain reorg issues       | Standard BSC practice             |

### Transfer Event Signature

```solidity
// ERC-20 Transfer event (USDT uses 6 decimals)
event Transfer(
  address indexed from,
  address indexed to,
  uint256 amount
);

// Event signature (keccak256 hash)
TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
```

### Integration Pattern (PocketBase Hook)

```javascript
// apps/backend/pb_hooks/13-track-deposit.pb.js

const TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const USDT_ADDRESS = "0xc015ebb27696b73E72Bef099b72791D7e666E2d0".toLowerCase();
const CONFIRMATIONS = 3; // Wait for 3 blocks

routerAdd("POST", "/api/v2/deposit/poll", (e) => {
  const { users } = e.requireAuth();
  const { user_address } = e.parseBody();

  try {
    // 1. Validate input
    if (!user_address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return e.json(400, {
        success: false,
        error: { message: "Invalid wallet address", code: "INVALID_ADDRESS" }
      });
    }

    // 2. Get last polled block (or use current block - 100)
    let lastPolledBlock = users.getNumber("last_polled_block") || 0;
    const currentBlock = await getCurrentBlock(EGGO_CONFIG.blockchain.rpcUrl);

    // 3. Build filter for Transfer events TO user wallet
    const toTopic = "0x" + user_address.slice(2).padStart(64, "0");
    const logParams = {
      address: EGGO_CONFIG.blockchain.contracts.CommissionDistribution,
      fromBlock: lastPolledBlock > 0
        ? "0x" + (lastPolledBlock + 1).toString(16)
        : "0x" + (currentBlock - 1000).toString(16),
      toBlock: "0x" + (currentBlock - CONFIRMATIONS).toString(16),
      topics: [TRANSFER_SIGNATURE, null, toTopic] // from=null (any), to=user_address
    };

    // 4. Poll RPC
    const logs = await pollRpcLogs(EGGO_CONFIG.blockchain.rpcUrl, logParams);

    // 5. Parse events
    const deposits = [];
    for (const log of logs) {
      const fromAddress = "0x" + log.topics[1].slice(26);
      const amountHex = log.data;
      const amount = parseInt(amountHex, 16) / Math.pow(10, 6); // USDT 6 decimals

      // 6. Check idempotency (prevent duplicate tx_hash)
      try {
        $app.findFirstRecordByData("deposits", "tx_hash", log.transactionHash);
        continue; // Skip duplicate
      } catch (err) {
        // Not found - create deposit record
      }

      // 7. Create deposit record
      const deposit = $app.create("deposits", {
        user: users.id,
        amount: amount,
        tx_hash: log.transactionHash,
        from_address: fromAddress,
        block_number: parseInt(log.blockNumber, 16),
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      });

      deposits.push(deposit);
    }

    // 8. Update user's last_polled_block
    if (logs.length > 0) {
      users.set("last_polled_block", currentBlock - CONFIRMATIONS);
      $app.save(users);
    }

    // 9. Return response
    e.json(200, {
      success: true,
      data: {
        deposits: deposits.map(d => ({
          tx_hash: d.tx_hash,
          amount: d.amount,
          from_address: d.from_address
        })),
        new_balance: users.getNumber("usdt_balance"),
        last_polled_block: currentBlock - CONFIRMATIONS
      }
    });

  } catch (error) {
    console.error("Deposit poll error:", error);
    e.json(500, {
      success: false,
      error: { message: error.message, code: "POLL_FAILED" }
    });
  }
}, { "requestTimeout": 30000 });

// Helper: Poll RPC logs
async function pollRpcLogs(rpcUrl, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [params],
      id: 1
    })
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }

  return result.result || [];
}

// Helper: Get current block number
async function getCurrentBlock(rpcUrl) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1
    })
  });

  const result = await response.json();
  return parseInt(result.result, 16);
}
```

### Performance Considerations

**From research (ethers.js issue #696, #4784):**

1. **Block range limits** — Most providers limit 2000-10000 blocks per request
   - **Solution:** Paginate if range > 5000 blocks
2. **Polling frequency** — Don't poll faster than block time (BSC = 3s)
   - **Solution:** Frontend polls every 30s-60s (not every 4s)
3. **Archive node requirement** — Old events may require archive node
   - **Solution:** Track `last_polled_block` to always poll recent blocks only

---

## 3. Mobile Responsive Design

### Breakpoint Strategy

**Tailwind CSS 4 default breakpoints (mobile-first):**

| Prefix     | Min Width | Device Target                   |
| ---------- | --------- | ------------------------------- |
| **(none)** | 0px       | Mobile phones (320px-639px)     |
| `sm:`      | 640px     | Small tablets, landscape phones |
| `md:`      | 768px     | Large tablets, portrait         |
| `lg:`      | 1024px    | Laptops, small desktops         |
| `xl:`      | 1280px    | Desktops                        |
| `2xl:`     | 1536px    | Large monitors                  |

**Container queries (for components):**

| Variant | Min Width | Use Case            |
| ------- | --------- | ------------------- |
| `@3xs:` | 256px     | Tiny cards          |
| `@xs:`  | 320px     | Minimum phone width |
| `@sm:`  | 384px     | Large phones        |
| `@md:`  | 448px     | Tablets             |

### CSS Patterns (Tailwind Utilities)

**Mobile-First Pattern:**

```tsx
// apps/web/app/eggs/page.tsx — Example

// Base (mobile) → Tablet → Desktop
<div className="
  flex flex-col          /* Mobile: stacked */
  md:flex-row           /* Tablet: horizontal */
  lg:gap-6              /* Desktop: larger gaps */
  xl:grid xl:grid-cols-3 /* Large: 3-column grid */
">
  {/* Egg card */}
  <div className="
    w-full              /* Mobile: full width */
    md:w-1/2            /* Tablet: half width */
    lg:w-auto           /* Desktop: auto width */
  ">
    ...
  </div>
</div>

// Text sizing
<h1 className="
  text-xl               /* Mobile: 20px */
  md:text-2xl          /* Tablet: 24px */
  lg:text-3xl          /* Desktop: 30px */
">

// Spacing (padding/margin)
<div className="
  p-2                   /* Mobile: 8px */
  md:p-4               /* Tablet: 16px */
  lg:p-6               /* Desktop: 24px */
">
```

**Arbitrary Breakpoints (for 320px specifically):**

```tsx
// Target exactly 320px+ (minimum phone width)
<div className="min-[320px]:text-base max-[319px]:text-sm">
  {/* Text is base size at 320px+, small below 320px */}
</div>

// Container queries (component-level responsiveness)
<div className="@container">
  <div className="
    @xs:text-sm        /* 320px+ inside container */
    @md:text-base      /* 448px+ inside container */
  ">
    ...
  </div>
</div>
```

### Testing Approach

**Manual Testing:**

1. **Chrome DevTools Device Mode** — Test 320px, 375px, 768px, 1024px
2. **Real Device Testing** — iOS Safari (375px), Android Chrome (360px)
3. **Landscape Mode** — Verify layouts at 667px (iPhone landscape)

**Automated Testing (Optional):**

```bash
# Install Playwright for screenshot testing
bun add -D @playwright/test

# Test at specific breakpoints
# tests/responsive.spec.ts
import { test, devices } from '@playwright/test';

test('eggs page responsive', async ({ page }) => {
  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/eggs');
  await expect(page).toHaveScreenshot('eggs-mobile.png');

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('eggs-tablet.png');

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page).toHaveScreenshot('eggs-desktop.png');
});
```

---

## 4. Touch Interactions

### Gesture Handling Library

**Recommended: `@use-gesture/react` v10.x**

| Library                    | Bundle Size | Learning Curve    | Best For                                |
| -------------------------- | ----------- | ----------------- | --------------------------------------- |
| **@use-gesture/react**     | ~6KB        | Low (React hooks) | ✅ This project (lightweight React app) |
| react-swipeable            | ~3KB        | Very Low          | Simple swipe only                       |
| react-use-gesture (legacy) | Deprecated  | -                 | ❌ Don't use                            |
| react-gesture-responder    | ~8KB        | Medium            | Complex gestures                        |

**Why `@use-gesture/react`:**

- ✅ Small bundle (6KB gzipped)
- ✅ Built for React (hooks pattern)
- ✅ Handles touch + mouse (unified API)
- ✅ Swipe detection built-in
- ✅ No dependencies on React Native

### Installation

```bash
cd apps/web
bun add @use-gesture/react

# Verify
bun add -D @types/react @types/react-dom  # TypeScript types (if needed)
```

### Swipe-to-Refresh Implementation

**Pattern for egg list refresh:**

```tsx
// apps/web/app/eggs/page.tsx

import { usePull } from "@use-gesture/react"
import { useState } from "react"

export default function EggsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const bind = usePull(
    ({ active, down, movement: [my], direction: [dy] }) => {
      // my = vertical movement (positive = pulling down)
      setPullDistance(active ? Math.max(0, my) : 0)

      // Trigger refresh when pulled > 150px and released
      if (!down && my > 150 && !isRefreshing) {
        handleRefresh()
      }
    },
    {
      // Configuration
      rubberband: true, // Elastic effect
      filterTaps: true, // Ignore accidental taps
      bounds: { top: 0 }, // Only pull from top
      swipe: {
        distance: 150, // Minimum pull distance
        velocity: 0.3, // Minimum swipe speed
      },
    }
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshEggData() // Your existing refresh logic
    setIsRefreshing(false)
    setPullDistance(0)
  }

  return (
    <div {...bind()} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center transition-transform"
        style={{ transform: `translateY(${pullDistance - 100}px)` }}
      >
        {isRefreshing ? (
          <LoadingSpinner />
        ) : pullDistance > 100 ? (
          <span className="text-white text-sm">Release to refresh</span>
        ) : null}
      </div>

      {/* Egg list */}
      <div className="pt-4">{/* ... existing egg cards ... */}</div>
    </div>
  )
}
```

### Swipe Gestures (Egg Actions)

**Horizontal swipe for quick actions:**

```tsx
import { useDrag } from "@use-gesture/react"

function EggCard({ egg, onFeed, onSell }) {
  const [swipeOffset, setSwipeOffset] = useState(0)

  const bind = useDrag(
    ({ active, movement: [mx], swipe: [swipeX], direction: [dx] }) => {
      if (active) {
        // Track drag distance
        setSwipeOffset(mx)
      } else if (swipeX !== 0) {
        // Swipe detected
        if (swipeX === -1) {
          // Swiped left → Sell action
          onSell(egg.id)
        } else if (swipeX === 1) {
          // Swiped right → Feed action
          onFeed(egg.id)
        }
        setSwipeOffset(0)
      } else {
        // No swipe, return to center
        setSwipeOffset(0)
      }
    },
    {
      swipe: {
        distance: 100, // Minimum swipe distance
        velocity: 0.5, // Minimum swipe speed
      },
      bounds: { left: -150, right: 150 }, // Max drag distance
      rubberband: true,
    }
  )

  return (
    <div
      {...bind()}
      className="relative overflow-hidden"
      style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-green-500 flex items-center justify-center text-white">Feed</div>
        <div className="w-1/2 bg-red-500 flex items-center justify-center text-white">Sell</div>
      </div>

      {/* Egg card content */}
      <div className="relative bg-white rounded-lg p-4">{/* ... egg details ... */}</div>
    </div>
  )
}
```

### Touch vs Mouse Event Handling

**Unified Approach (use-gesture handles both):**

```tsx
// ❌ Don't do this (redundant)
const handleTouch = (e) => { ... }
const handleMouse = (e) => { ... }

// ✅ Do this (unified with use-gesture)
const bind = useDrag(({ movement, active }) => {
  // Works for both touch and mouse
  console.log(movement, active);
});

<div {...bind()}>
  {/* Single handler for both */}
</div>
```

**Touch-Specific Considerations:**

1. **Touch targets** — Minimum 44x44px (Apple HIG)

   ```tsx
   <button className="min-w-[44px] min-h-[44px] p-3">Tap me</button>
   ```

2. **Prevent scroll conflicts** — Use `touch-action` CSS

   ```tsx
   <div className="touch-pan-y">
     {" "}
     {/* Allow vertical scroll */}
     <div className="touch-pan-x">
       {" "}
       {/* Allow horizontal swipe */}
       {/* Swipe content */}
     </div>
   </div>
   ```

3. **Feedback** — Visual feedback on touch
   ```tsx
   <button className="active:scale-95 transition-transform">{/* Scales down on touch */}</button>
   ```

---

## 5. Recommendations Summary

### Must Add (with versions)

| Library                    | Version   | Location                | Purpose                    |
| -------------------------- | --------- | ----------------------- | -------------------------- |
| `@use-gesture/react`       | `^10.3.1` | `apps/web/package.json` | Touch gesture handling     |
| Contract ABIs              | Manual    | `wallet-api/contracts/` | ERC-1155 interfaces        |
| `/contract-addresses.json` | Manual    | Project root            | Network-specific addresses |

### Already Have (Reuse)

| Library            | Version  | Location                  | Reuse For                      |
| ------------------ | -------- | ------------------------- | ------------------------------ |
| `ethers`           | `^6.x`   | `wallet-api/package.json` | Contract calls, event polling  |
| `crypto` (Node.js) | Built-in | `wallet-api/server.js`    | AES-256-GCM decryption         |
| Tailwind CSS       | `^4.x`   | `apps/web/`               | Responsive breakpoints         |
| TanStack Query     | `^5.x`   | `apps/web/`               | Polling with `refetchInterval` |

### Avoid (Not Needed)

| Library                 | Why Avoid                                   | Alternative             |
| ----------------------- | ------------------------------------------- | ----------------------- |
| `react-swipeable`       | @use-gesture/react does same + more         | Use @use-gesture/react  |
| `web3.js`               | ethers v6 already installed, smaller bundle | Stick with ethers v6    |
| `ethers v5`             | v6 has better TypeScript, smaller bundle    | Already using v6        |
| WebSocket subscriptions | PocketBase incompatible, filterId issues    | Use eth_getLogs polling |
| `react-use-gesture`     | Deprecated, renamed to @use-gesture/react   | Use @use-gesture/react  |

---

## 6. Integration Checklist

### Wallet API Changes

- [ ] Create `wallet-api/contracts/` directory
- [ ] Add contract ABIs (ERC-1155, CommissionDistribution)
- [ ] Add `/contract-addresses.json` with testnet addresses
- [ ] Update `wallet-api/.env` with `BSC_RPC_URL`, contract addresses
- [ ] Replace 4 mock endpoints with real contract calls
- [ ] Add gas estimation + error handling
- [ ] Test with real deployment on BSC testnet

### PocketBase Hook Changes

- [ ] Create `pb_hooks/13-track-deposit.pb.js`
- [ ] Implement `eth_getLogs` polling function
- [ ] Add idempotency check (prevent duplicate tx_hash)
- [ ] Add `last_polled_block` field to users collection
- [ ] Test with mock Transfer events (test already exists)

### Frontend Changes

- [ ] Install `@use-gesture/react` in `apps/web/`
- [ ] Add swipe-to-refresh on `/eggs` page
- [ ] Add swipe gestures to egg cards (feed/sell)
- [ ] Verify responsive breakpoints (320px-1440px)
- [ ] Test on real mobile devices (iOS Safari, Android Chrome)
- [ ] Add loading states for gesture feedback

---

## 7. Source Verification

| Finding                    | Source                                   | Confidence |
| -------------------------- | ---------------------------------------- | ---------- |
| ethers v6 contract API     | Context7 `/websites/ethers_v6`           | HIGH       |
| eth_getLogs best practices | theRpc.io docs                           | HIGH       |
| eth_getLogs pitfalls       | ethers.js GitHub #696, #4784             | HIGH       |
| Tailwind breakpoints       | tailwindcss.com/docs                     | HIGH       |
| use-gesture patterns       | GitHub pmndrs/use-gesture                | HIGH       |
| TanStack Query polling     | GitHub tanstack/query/docs               | HIGH       |
| USDT Transfer event sig    | ERC-20 standard, verified with websearch | HIGH       |

---

**Next Steps:**

1. **Contracts first** — Deploy contracts and get addresses (blocks wallet-api implementation)
2. **Wallet API** — Replace mock endpoints (P0 security issue)
3. **Track deposit hook** — Implement polling (P1 quality issue)
4. **Mobile polish** — Add gestures (P2 nice-to-have)

**Timeline Estimate:**

- Contracts: Already deployed (existing)
- Wallet API: 1-2 days (4 endpoints)
- Track deposit: 1 day (single hook)
- Mobile gestures: 1-2 days (UI polish)

Total: **3-5 days** for v0.0.7 milestone

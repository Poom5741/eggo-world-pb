# Pitfalls Research — v0.0.7 Security & Quality

**Domain:** Blockchain NFT marketplace with contract interactions, USDT polling, mobile UX
**Researched:** 2026-04-18
**Overall confidence:** MEDIUM (verified with Context7 + official docs + multiple sources)

---

## Security Pitfalls (P0 - Blocks Launch)

### Private Key Handling

**Pitfall:** Logging private keys, encryption keys, or mnemonics during development or error handling.

**Why it happens:**

- Debug logging during contract interaction development
- Error messages that include full transaction objects
- Console statements left in production code

**Warning signs:**

- `console.log` statements in wallet-api or hooks containing `privateKey`, `signer`, `wallet`
- Error stack traces showing key material
- Keys visible in PocketBase logs (`/tmp/pocketbase.log`)

**Consequences:**

- Complete wallet compromise
- User fund theft
- Regulatory/compliance violations

**Prevention:**

```javascript
// ❌ NEVER DO THIS
console.log("Wallet created:", wallet) // Contains privateKey
console.log("Signer:", signer) // Contains key

// ✅ CORRECT
console.log("Wallet created:", { address: wallet.address })
console.log("Transaction sent:", { hash: tx.hash, to: tx.to })

// Redact sensitive fields in error messages
try {
  await doSomethingWithKey(privateKey)
} catch (error) {
  console.error("Operation failed:", {
    code: error.code,
    message: error.message,
    // privateKey NOT included
  })
}
```

**Detection:**

```bash
# Audit for key logging
grep -r "console.log.*privateKey\|console.log.*signer\|console.log.*mnemonic" apps/backend wallet-api

# Check PocketBase logs
ssh root@host "grep -i 'private\|secret\|key' /tmp/pocketbase.log"
```

**Phase:** Phase 14 (Wallet-api contract integration)

**Sources:**

- Context7: Ethers v6 Wallet API docs (HIGH confidence)
- OWASP Smart Contract Security guidelines (HIGH confidence)

---

### Transaction Finality Assumptions

**Pitfall:** Treating transaction as confirmed immediately after `tx.wait()` without waiting for sufficient block confirmations.

**Why it happens:**

- Ethers `tx.wait()` defaults to 1 confirmation
- UI shows "confirmed" too early
- Chain reorganizations can orphan recently-mined blocks

**Warning signs:**

- UI shows "Success!" immediately after `tx.wait()`
- Balance updates before N confirmations (N < 5 for BSC)
- No confirmation count displayed to users

**Consequences:**

- Users see funds that may disappear after reorg
- Economy exploits (users spend before final)
- Race conditions in hatch/claim flows

**Prevention:**

```javascript
// ❌ Insufficient (1 confirmation default)
const receipt = await tx.wait()
updateBalance()

// ✅ Wait for sufficient confirmations (BSC: 5-12)
const receipt = await tx.wait(12) // Wait for 12 block confirmations
const confirmations = await tx.confirmations()

// Update UI only after sufficient confirmations
if (confirmations >= 12) {
  updateBalance()
  toast.success("Transaction confirmed (12 blocks)")
}
```

**BSC-specific guidance:**

- Testnet: 5 confirmations (faster blocks, less security)
- Mainnet: 12-15 confirmations (production security)

**Detection:**

```bash
# Check for insufficient wait patterns
grep -r "tx.wait()" apps/web wallet-api | grep -v "wait(5\|wait(12\|wait(\d"
```

**Phase:** Phase 14 (Contract integration)

**Sources:**

- Context7: Ethers v6 TransactionResponse.wait() docs (HIGH confidence)
- QuickNode reorg handling docs (MEDIUM confidence)

---

### Gas Estimation Failures

**Pitfall:** Not handling gas estimation errors, leading to failed transactions or overpayment.

**Why it happens:**

- Network congestion changes gas prices rapidly
- Contract state changes between estimation and execution
- Insufficient balance for gas + transaction

**Warning signs:**

- Transactions failing with "out of gas"
- Users reporting "transaction reverted" without clear error
- No retry logic for gas estimation

**Consequences:**

- Failed minting/feeding operations
- Users pay gas for reverted transactions
- Poor UX during high network congestion

**Prevention:**

```javascript
// ❌ No error handling
const gasLimit = await contract.estimateGas.mintEgg(eggId)
const tx = await contract.mintEgg(eggId, { gasLimit })

// ✅ With fallback and buffer
async function estimateWithFallback(method, params, baseGasLimit) {
  try {
    const estimated = await method.estimateGas(...params)
    // Add 20% buffer for safety
    return estimated.mul(120).div(100)
  } catch (estimateError) {
    console.warn("Gas estimate failed, using fallback:", estimateError)
    // Use known safe default for this operation
    return ethers.BigNumber.from(baseGasLimit)
  }
}

const gasLimit = await estimateWithFallback(
  contract.mintEgg,
  [eggId],
  150000 // Known safe default for mintEgg
)
```

**Detection:**

- Monitor gas estimation failure rate in logs
- Track transaction revert reasons

**Phase:** Phase 14 (Contract integration)

**Sources:**

- Context7: Ethers v6 Signer API (HIGH confidence)
- Ethers error handling documentation (HIGH confidence)

---

## Data Integrity Pitfalls (P0 - Blocks Launch)

### Duplicate Deposit Tracking

**Pitfall:** Counting the same USDT Transfer event multiple times, inflating user balances.

**Why it happens:**

- Polling runs multiple times before processed event is stored
- No deduplication on transaction hash
- Race conditions in concurrent poll requests

**Warning signs:**

- User balance increases without new deposit
- Multiple deposit records with same `tx_hash`
- Logs show same event processed multiple times

**Consequences:**

- Users get free USDT
- Economy inflation
- Reserve fund depletion

**Prevention:**

```javascript
// ✅ Database-level deduplication (PostgreSQL/PocketBase)
// Use unique constraint on tx_hash
CREATE UNIQUE INDEX idx_deposits_tx_hash ON deposits(tx_hash);

// ✅ Application-level check (current hook pattern)
let existingDeposit = null
try {
  existingDeposit = $app.findFirstRecordByData("deposits", "tx_hash", txHash)
} catch (err) {
  // Not found = OK to process
}

if (existingDeposit) {
  console.log('Deposit already tracked:', txHash)
  return e.json(200, { success: true, data: { skipped: true } })
}

// Create deposit record AFTER verification
const deposit = $app.dao().findRecordByName("deposits")
deposit.set("tx_hash", txHash)
// ... other fields
$app.dao().saveRecord(deposit)
```

**Database constraint (recommended):**

```sql
-- Add unique index to prevent duplicates at DB level
CREATE UNIQUE INDEX idx_deposits_unique ON deposits(tx_hash, log_index);
```

**Detection:**

```sql
-- Query for duplicate deposits
SELECT tx_hash, COUNT(*)
FROM deposits
GROUP BY tx_hash
HAVING COUNT(*) > 1;
```

**Phase:** Phase 15 (Track-deposit implementation)

**Sources:**

- QuickNode reorg handling (HIGH confidence)
- EventDock idempotency patterns (HIGH confidence)
- Current hook `13-track-deposit.pb.js` analysis (HIGH confidence)

---

### Chain Reorganization Handling

**Pitfall:** Not detecting or handling blockchain reorganizations, leading to incorrect deposit tracking.

**Why it happens:**

- Blocks can be orphaned during network consensus changes
- Polling from "latest" may miss reorg events
- No verification of parent hash continuity

**Warning signs:**

- Deposit records with block numbers that later disappear
- Transaction hashes not found in canonical chain
- Balance discrepancies after network hiccups

**Consequences:**

- Tracked deposits that never actually occurred
- Balance inflation
- Audit trail corruption

**Prevention:**

```javascript
// ✅ Store block hash alongside each deposit
const deposit = {
  tx_hash: txHash,
  block_number: blockNumber,
  block_hash: blockHash, // CRITICAL for reorg detection
  log_index: event.logIndex, // Unique within block
}

// ✅ Verify parent hash continuity on each poll
const latestBlock = await provider.getBlock("latest")
const storedBlock = await provider.getBlock(currentBlock - 1)

if (latestBlock.parentHash !== storedBlock.hash) {
  console.warn("Reorg detected! Rolling back...")
  await rollbackToCommonAncestor()
  await reprocessCanonicalChain()
}

// ✅ Use confirmations (wait N blocks before treating as final)
const safeBlock = latestBlock.number - 12 // 12 confirmations
await processEventsUpTo(safeBlock)
```

**Reorg detection flow:**

1. Store `block_hash` for each processed event
2. On each poll, verify parent hash matches stored hash
3. If mismatch: detect reorg, rollback to common ancestor
4. Reprocess from canonical chain
5. Update/removed orphaned records

**BSC-specific:**

- Reorganizations are rare but DO occur (especially on testnet)
- Use 12+ confirmations for production (BSC mainnet finality is faster than Ethereum but not instant)

**Phase:** Phase 15 (Track-deposit implementation)

**Sources:**

- Medium: "Understanding Blockchain Reorgs" (HIGH confidence)
- QuickNode reorg handling guide (HIGH confidence)
- EIP-8072 transaction inclusion with reorg monitoring (MEDIUM confidence)

---

### Missing Event Handling

**Pitfall:** Missing blockchain events due to polling interval gaps or RPC failures.

**Why it happens:**

- Server downtime during critical events
- RPC rate limiting blocks requests
- Polling interval too long for fast blockchains

**Warning signs:**

- User deposits exist on-chain but not in database
- Gaps in `block_number` sequence in deposits table
- RPC error logs showing 429/500 responses

**Consequences:**

- Lost user funds (not tracked)
- Support tickets
- Manual reconciliation required

**Prevention:**

```javascript
// ✅ Poll with block range (not just "latest")
const currentBlock = await provider.getBlockNumber()
const fromBlock = lastProcessedBlock + 1
const toBlock = currentBlock - 12 // Leave 12-block buffer for reorgs

const logs = await provider.getLogs({
  address: contractAddress,
  topics: [transferSignature, null, toTopic],
  fromBlock: fromBlock,
  toBlock: toBlock,
})

// ✅ Handle RPC failures with retry + exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

// ✅ Adaptive chunking for large ranges
async function fetchLogsAdaptive(fromBlock, toBlock) {
  const MAX_RANGE = 1000 // Adjust per RPC limits
  if (toBlock - fromBlock <= MAX_RANGE) {
    return await fetchLogsOnce(fromBlock, toBlock)
  }

  // Split range in half and retry
  const mid = Math.floor((fromBlock + toBlock) / 2)
  const logs1 = await fetchLogsAdaptive(fromBlock, mid)
  const logs2 = await fetchLogsAdaptive(mid + 1, toBlock)
  return [...logs1, ...logs2]
}
```

**Detection:**

```sql
-- Find gaps in block processing
SELECT
  block_number,
  LAG(block_number) OVER (ORDER BY block_number) as prev_block,
  block_number - LAG(block_number) OVER (ORDER BY block_number) as gap
FROM deposits
WHERE block_number - LAG(block_number) OVER (ORDER BY block_number) > 1
ORDER BY block_number DESC;
```

**Phase:** Phase 15 (Track-deposit implementation)

**Sources:**

- Bitium: "Best On-chain Data Indexing Solutions for dApps in 2026" (HIGH confidence)
- ChainStack: "Ethereum redundant event listener" (HIGH confidence)
- Current `13-track-deposit.pb.js` polling pattern (HIGH confidence)

---

## Quality Pitfalls (P1 - Technical Debt)

### Untested Mobile Breakpoints

**Pitfall:** Only testing on desktop and one mobile size, missing layout breaks at edge cases.

**Why it happens:**

- Developers test at common breakpoints (375px, 768px)
- Real devices have varied viewports (320px-430px mobile)
- DevTools responsive mode doesn't catch all real-device issues

**Warning signs:**

- Horizontal scroll on 320px devices
- Text too small to read without zooming
- Touch targets under 44×44px
- Content overflow on budget Android phones

**Consequences:**

- Poor UX for users with small/old devices
- Accessibility violations (WCAG 2.2)
- Increased bounce rate on mobile

**Prevention:**

```typescript
// ✅ Test matrix configuration (Playwright example)
const viewports = [
  { width: 320, name: "mobile-s" }, // iPhone SE / budget Android
  { width: 375, name: "mobile-m" }, // iPhone 12-15 mini
  { width: 390, name: "mobile-l" }, // iPhone 14/15
  { width: 430, name: "mobile-xl" }, // iPhone 15 Pro Max
  { width: 768, name: "tablet" }, // iPad portrait
  { width: 1024, name: "laptop" }, // Small laptop
  { width: 1440, name: "desktop" }, // Standard desktop
]

// ✅ Automated responsive test
test("no horizontal overflow on all pages", async ({ page }) => {
  const pages = ["/", "/eggs", "/marketplace", "/dashboard"]
  const widths = [320, 375, 768, 1024, 1440]

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 })
    for (const path of pages) {
      await page.goto(path)
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      )
      expect(hasOverflow).toBe(false)
    }
  }
})

// ✅ Touch target size audit
test("all interactive elements have 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto("/")

  const buttons = await page.locator('button, a, [role="button"]').all()
  for (const button of buttons) {
    const box = await button.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
})
```

**Detection:**

```bash
# Manual audit command (Chrome DevTools)
# Test viewports: 320px, 375px, 768px, 1024px, 1440px
# Check for: horizontal scroll, text size, touch targets

# Automated Lighthouse audit
lighthouse http://localhost:3000 --view --preset=performance --form-factor=mobile
```

**Phase:** Phase 16 (Mobile polish)

**Sources:**

- Mobile Viewer: "How to Test Responsive Design" (HIGH confidence)
- Peasy Design: "Responsive Design Breakpoints" (HIGH confidence)
- TestParty: "Mobile Accessibility Patterns" (HIGH confidence)

---

### Image Scaling Failures

**Pitfall:** Images with fixed pixel widths breaking out of containers on mobile.

**Why it happens:**

- Images without `max-width: 100%`
- Fixed `width` and `height` attributes
- Missing `aspect-ratio` for CLS prevention

**Warning signs:**

- Horizontal scroll on pages with images
- Images overflow parent containers
- Images not loading with correct aspect ratio

**Consequences:**

- Broken layouts
- Poor Core Web Vitals (CLS scores)
- Accessibility issues (images not visible on small screens)

**Prevention:**

```css
/* ✅ Responsive image pattern */
img {
  max-width: 100%;
  height: auto;
  display: block; /* Remove inline spacing */
}

/* ✅ Next.js Image component (preferred) */
import Image from 'next/image'

<Image
  src="/egg.png"
  alt="Egg NFT"
  width={400}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority
/>

/* ✅ Container with aspect ratio */
.egg-card {
  aspect-ratio: 1 / 1;
  width: 100%;
  max-width: 400px;
}

.egg-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Detection:**

```bash
# Check for fixed-width images
grep -r "width: \d+px" apps/web/components | grep -v "max-width"

# Lighthouse CLS audit
lighthouse http://localhost:3000 --view
```

**Phase:** Phase 16 (Mobile polish)

**Sources:**

- Responsive Web Design Guide (HIGH confidence)
- Next.js Image documentation (HIGH confidence)

---

### iOS Input Zoom

**Pitfall:** iOS Safari automatically zooms when focusing inputs with font-size < 16px.

**Why it happens:**

- iOS Safari behavior (not a bug)
- Inputs styled with small font sizes for design

**Warning signs:**

- Screen zooms in unexpectedly on input focus
- Layout breaks after zoom
- Users complain about needing to pinch-zoom out

**Consequences:**

- Poor UX on iPhones
- Broken layouts
- Accessibility friction

**Prevention:**

```css
/* ✅ Force 16px minimum on all inputs */
input,
textarea,
select {
  font-size: 16px; /* Minimum to prevent iOS zoom */
}

/* ✅ If you need smaller visual size, use scale transform */
.input-small {
  font-size: 16px;
  transform: scale(0.875); /* Visually 14px */
  transform-origin: left center;
}
```

**Detection:**

- Manual testing on iOS device or Safari simulation
- Check computed font-size of all form inputs

**Phase:** Phase 16 (Mobile polish)

**Sources:**

- Responsive Web Design Guide (HIGH confidence)
- Apple Human Interface Guidelines (HIGH confidence)

---

## UX Pitfalls (P1 - Technical Debt)

### Gesture Conflicts

**Pitfall:** Custom swipe gestures conflict with browser back/forward navigation gestures.

**Why it happens:**

- Mobile browsers use edge swipes for navigation
- Custom horizontal scroll/swipe handlers don't prevent defaults
- No threshold sensitivity for edge swipes

**Warning signs:**

- Users accidentally navigate back when swiping left
- Swipe-to-feed triggers browser history navigation
- Complaints about "app going back randomly"

**Consequences:**

- Lost work (users lose in-progress actions)
- Frustration
- Abandoned sessions

**Prevention:**

```javascript
// ✅ Prevent default on edge swipes (React example)
function usePreventSwipeNavigation() {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Don't prevent on edge swipes (browser navigation zone)
      const isEdgeSwipe = e.touches[0].clientX < 20 ||
                         e.touches[0].clientX > window.innerWidth - 20

      if (isEdgeSwipe) return // Let browser handle edge swipes

      // Prevent internal swipes from triggering browser nav
      if (shouldHandleSwipe(e)) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    return () => document.removeEventListener('touchstart', handleTouchStart)
  }, [])
}

// ✅ Use overscroll-behavior for horizontal scroll containers
.css-horizontal-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain; /* Prevent pull-to-refresh conflicts */
}

// ✅ Add threshold sensitivity (avoid accidental triggers)
function handleSwipe(deltaX: number) {
  const THRESHOLD = 50 // pixels
  if (Math.abs(deltaX) < THRESHOLD) return // Ignore small swipes

  // Process swipe only if it exceeds threshold
  if (deltaX > THRESHOLD) {
    handleSwipeRight()
  } else if (deltaX < -THRESHOLD) {
    handleSwipeLeft()
  }
}
```

**Detection:**

- Manual testing on iOS Safari and Chrome mobile
- Check for edge swipe conflicts

**Phase:** Phase 17 (Touch interactions)

**Sources:**

- WebKit PR #40377: "Prevent navigation transition swipe gestures" (HIGH confidence)
- Stack Overflow: "overscroll-behavior does not prevent browser navigation" (MEDIUM confidence)
- WICG proposal: "API to Control User Gesture Navigation" (MEDIUM confidence)

---

### Hover-Only Interactions

**Pitfall:** Functionality only accessible via `:hover` state, invisible to touch users.

**Why it happens:**

- Desktop-first design patterns
- Dropdown menus that require hover
- Tooltips that don't show on tap

**Warning signs:**

- "I can't see the delete button on mobile"
- Menu items hidden behind hover-only triggers
- Tooltips never appearing on touch devices

**Consequences:**

- Hidden functionality
- Accessibility violations
- Poor mobile UX

**Prevention:**

```css
/* ❌ Hover-only (BAD) */
.menu-item:hover .dropdown {
  display: block;
}

/* ✅ Touch-friendly alternative */
.menu-item:hover .dropdown,
.menu-item:focus-within .dropdown,
.menu-item[data-touched="true"] .dropdown {
  display: block;
}

/* ✅ Add visible button alternative */
.dropdown-trigger {
  /* Always visible on mobile */
  display: block;
}

@media (hover: hover) {
  /* Hide trigger on desktop, use hover */
  .dropdown-trigger {
    display: none;
  }
}
```

**Detection:**

```bash
# Find hover-only patterns
grep -r ":hover" apps/web/components | grep -v "focus\|focus-within"

# Accessibility audit (axe-core)
npm install -g @axe-core/cli
axe http://localhost:3000
```

**Phase:** Phase 17 (Touch interactions)

**Sources:**

- TestParty: "Mobile Accessibility Patterns" (HIGH confidence)
- WCAG 2.2 guidelines (HIGH confidence)

---

### Touch Target Overlap

**Pitfall:** Interactive elements positioned too close together on mobile, causing accidental taps.

**Why it happens:**

- Desktop layouts compressed for mobile
- Dense information design
- Missing minimum touch target enforcement

**Warning signs:**

- Users tap wrong button frequently
- Complaints about "buttons too close together"
- High error rate on mobile forms

**Consequences:**

- User frustration
- Incorrect actions (wrong NFT selected)
- Accessibility violations

**Prevention:**

```css
/* ✅ Minimum 44×44px touch targets */
button,
a,
[role="button"] {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px; /* Use padding, not fixed size */
}

/* ✅ Add spacing between interactive elements */
.button-group {
  display: flex;
  gap: 8px; /* Adequate spacing */
}

/* ✅ Check for overlap programmatically */
/* (Playwright test above catches this) */
```

**Detection:**

```css
/* CSS audit for small touch targets */
.button {
  min-height: 44px;
  min-width: 44px;
}
```

**Phase:** Phase 17 (Touch interactions)

**Sources:**

- WCAG 2.2 Target Size (Enhanced) guideline (HIGH confidence)
- Apple Human Interface Guidelines (HIGH confidence)
- TestParty: "Mobile Accessibility Patterns" (HIGH confidence)

---

## Feature Pitfalls (P2 - Nice to Have)

### Feed Economy Exploits

**Pitfall:** Users feeding same egg from multiple concurrent sessions, bypassing consumption limits.

**Why it happens:**

- No database transaction isolation
- Race condition between "check food count" and "update food count"
- Optimistic UI updates before server confirmation

**Warning signs:**

- Egg shows 10 food consumed but only 8 food transactions
- Users hatching eggs with fewer than 10 food
- Food inventory negative or inconsistent

**Consequences:**

- Free hatches (economy inflation)
- Food NFT duplication
- Platform revenue loss

**Prevention:**

```javascript
// ✅ Database transaction with atomic update
// (PocketBase uses SQLite, supports ACID transactions)
const eggCollection = $app.dao().getCollectionByNameOrId("egg_nfts")

// Use transaction for atomic check-and-update
$app.dao().runInTransaction(async (txDao) => {
  // Lock the egg record (simulate with read-write lock)
  const egg = await txDao.findRecordById("egg_nfts", eggId)

  // Check current food count
  const currentFoodCount = egg.get("food_count") || 0
  if (currentFoodCount + foodIds.length > 10) {
    throw new Error("Egg already has enough food")
  }

  // Verify ownership of all food items FIRST
  for (const foodId of foodIds) {
    const food = await txDao.findRecordById("food_nfts", foodId)
    if (food.get("owner_id") !== user.id) {
      throw new Error("Food item not owned by user")
    }
    if (food.get("consumed")) {
      throw new Error("Food item already consumed")
    }
  }

  // Atomically update egg food count
  egg.set("food_count", currentFoodCount + foodIds.length)
  await txDao.saveRecord(egg)

  // Mark all food items as consumed
  for (const foodId of foodIds) {
    const food = await txDao.findRecordById("food_nfts", foodId)
    food.set("consumed", true)
    await txDao.saveRecord(food)
  }
})

// ✅ Optimistic locking with version field
// Add 'version' field to egg_nfts collection
const currentVersion = egg.get("version")
egg.set("version", currentVersion + 1)

// This will fail if version changed between read and write
egg.onBeforeSave = (e) => {
  const dbRecord = $app.dao().findRecordById("egg_nfts", egg.id)
  if (dbRecord.get("version") !== currentVersion) {
    throw new Error("Concurrent modification detected")
  }
}
```

**Detection:**

```sql
-- Find eggs with suspicious food counts
SELECT
  id,
  food_count,
  (SELECT COUNT(*) FROM egg_consumption_logs WHERE egg_id = egg_nfts.id) as logged_feed_count
FROM egg_nfts
WHERE food_count != (SELECT COUNT(*) FROM egg_consumption_logs WHERE egg_id = egg_nfts.id);
```

**Phase:** Phase 17 (Feed implementation)

**Sources:**

- Zealynx: "Asset Duplication Attack" (HIGH confidence)
- OWASP: "Race condition in crafting" patterns (HIGH confidence)
- Mav Levin: "Check-then-Act" vulnerability (HIGH confidence)

---

### Race Condition on Item Consumption

**Pitfall:** Same food NFT consumed multiple times in concurrent requests.

**Why it happens:**

- Validation occurs before consumption
- Gap between "check consumed" and "mark consumed"
- Multiple simultaneous feed requests

**Warning signs:**

- Food NFT consumed count > 1
- Same food_id appears in multiple feed logs
- User has fewer food NFTs than logged consumption

**Consequences:**

- Economy exploits
- NFT duplication
- Balance sheet errors

**Prevention:**

```javascript
// ✅ Atomic consumption with unique constraint
// Database: Add unique index on (food_id, consumed) where consumed = true
CREATE UNIQUE INDEX idx_food_consumed_unique ON food_nfts(id) WHERE consumed = true;

// Application: Check existence before update
try {
  const food = await $app.dao().findRecordById("food_nfts", foodId)

  if (food.get('consumed')) {
    throw new Error('Food already consumed')
  }

  // Mark as consumed (unique constraint will prevent duplicates)
  food.set('consumed', true)
  await $app.dao().saveRecord(food)

} catch (error) {
  if (error.message.includes('unique constraint')) {
    console.error('Concurrent consumption detected:', foodId)
    return e.json(400, {
      success: false,
      error: { message: 'Food already consumed', code: 'DUPLICATE_CONSUMPTION' }
    })
  }
  throw error
}
```

**Phase:** Phase 17 (Feed implementation)

**Sources:**

- OWASP: "Race condition in crafting" (HIGH confidence)
- Cyfrin: "Double spending attacks" (HIGH confidence)

---

### Missing Feed Validation

**Pitfall:** Not validating all preconditions before calling wallet-api feed-egg endpoint.

**Why it happens:**

- Trusts frontend input without verification
- Skips ownership checks
- Doesn't verify egg hatched status

**Warning signs:**

- Hatched eggs being fed
- Users feeding eggs they don't own
- Food items consumed without transfer

**Consequences:**

- Invalid blockchain transactions (wasted gas)
- Economy exploits
- Error cascades

**Prevention:**

```javascript
// ✅ Comprehensive validation checklist
routerAdd("POST", "/api/v2/feed-egg", (e) => {
  const user = $apis.requireAuth(e)
  const { egg_token_id, food_ids } = e.parseBody()

  // 1. Validate inputs
  if (!egg_token_id || food_ids.length === 0) {
    return e.json(400, { error: { message: "Invalid input", code: "VALIDATION_ERROR" } })
  }

  // 2. Verify egg exists and owned by user
  const egg = $app.findFirstRecordByData("egg_nfts", "token_id", egg_token_id)
  if (!egg || egg.get("owner_id") !== user.id) {
    return e.json(404, { error: { message: "Egg not found or not owned", code: "NOT_FOUND" } })
  }

  // 3. Verify egg not hatched
  if (egg.get("is_hatched")) {
    return e.json(400, { error: { message: "Egg already hatched", code: "ALREADY_HATCHED" } })
  }

  // 4. Verify egg not already has 10 food
  if (egg.get("food_count") >= 10) {
    return e.json(400, { error: { message: "Egg already fully fed", code: "MAX_FOOD" } })
  }

  // 5. Verify user owns ALL food items
  // 6. Verify food items not consumed
  // 7. Verify food_ids don't contain duplicates
  // 8. Verify feed won't exceed 10 food limit

  // THEN call wallet-api
})
```

**Phase:** Phase 17 (Feed implementation)

**Sources:**

- Current `16-feed-egg.pb.js` hook analysis (HIGH confidence)
- OWASP input validation guidelines (HIGH confidence)

---

## Summary by Phase

| Phase                  | Primary Pitfall Category | Critical Pitfalls                                         | Prevention Priority                                                         |
| ---------------------- | ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| **14 (Wallet-api)**    | Security (P0)            | Private key logging, transaction finality, gas estimation | Implement secure logging patterns, add confirmation waits, add gas fallback |
| **15 (Track-deposit)** | Data integrity (P0)      | Duplicate tracking, chain reorganizations, missing events | Add unique constraints, store block hashes, implement retry logic           |
| **16 (Mobile polish)** | Quality (P1)             | Untested breakpoints, image scaling, iOS zoom             | Test matrix (320px-1440px), max-width: 100%, 16px inputs                    |
| **17 (Feed)**          | Feature (P2)             | Economy exploits, race conditions, missing validation     | Database transactions, optimistic locking, comprehensive validation         |

---

## Cross-Cutting Concerns

### Error Message Security

**Pitfall:** Detailed error messages expose system internals or assist attackers.

**Prevention:**

```javascript
// ❌ Overly detailed (BAD)
throw new Error(`Failed to decrypt wallet with key: ${masterKey.slice(0, 10)}...`)

// ✅ Generic user message, detailed log
console.error("Wallet decryption failed:", {
  error: error.message,
  userId: user.id,
  // masterKey NOT logged
})
e.json(500, {
  success: false,
  error: { message: "Wallet operation failed", code: "WALLET_ERROR" },
})
```

**Phase:** All phases

---

### Rate Limiting

**Pitfall:** No rate limiting on expensive blockchain endpoints.

**Consequences:**

- API abuse
- RPC quota exhaustion
- Service denial

**Prevention:**

```javascript
// Add rate limiting to wallet-api endpoints
// Use express-rate-limit or similar
const rateLimit = require("express-rate-limit")

const depositPollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many requests, please try again later",
})

app.post("/api/v2/deposit/poll", depositPollLimiter, async (req, res) => {
  // ...
})
```

**Phase:** Phase 15 (Track-deposit)

---

## Confidence Assessment

| Area                      | Confidence | Notes                                                    |
| ------------------------- | ---------- | -------------------------------------------------------- |
| Private key security      | HIGH       | Context7 (official Ethers docs)                          |
| Transaction confirmations | HIGH       | Context7 + QuickNode                                     |
| Gas estimation            | HIGH       | Context7 (Ethers Signer API)                             |
| Duplicate prevention      | HIGH       | EventDock + QuickNode + database best practices          |
| Chain reorganizations     | MEDIUM     | Multiple sources but BSC-specific behavior needs testing |
| Mobile testing matrix     | HIGH       | Multiple responsive design guides                        |
| Touch target sizing       | HIGH       | WCAG 2.2 + Apple HIG                                     |
| Gesture conflicts         | MEDIUM     | WebKit + StackOverflow (browser-dependent)               |
| Feed economy exploits     | HIGH       | OWASP + Zealynx GameFi security                          |

---

## Research Recommendations for Phases

**Phase 14 (Wallet-api):**

- Likely needs: Context7 ethers.js queries for specific contract patterns
- Unlikely to need: Deep research (standard patterns documented)

**Phase 15 (Track-deposit):**

- Likely needs: BSC reorg frequency data, RPC provider rate limits
- Unlikely to need: Core deduplication patterns (well-documented)

**Phase 16 (Mobile polish):**

- Likely needs: User analytics for device viewport distribution
- Unlikely to need: Breakpoint research (standard patterns suffice)

**Phase 17 (Feed):**

- Likely needs: Economy balance modeling, exploit scenario testing
- Unlikely to need: Core transaction patterns (standard database ACID)

---

_**Last updated:** 2026-04-18 — Research for v0.0.7 Security & Quality milestone_

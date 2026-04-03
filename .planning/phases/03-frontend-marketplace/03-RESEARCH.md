# Phase 3: Frontend Marketplace - Research

**Researched:** 2026-04-02
**Status:** Complete
**Phase Goal:** User-facing UI for all core actions

---

## Executive Summary

Phase 3 is **60% complete** with 6 pages already built (auth flow, mint egg, egg inventory, commissions, food marketplace). The remaining 6 pages need to be prioritized and implemented with focus on completing the core game loop.

**Key Research Findings:**

1. **Hatch Egg Implementation** - Simple reveal flow using existing transaction patterns from mint page. No complex animations needed (per D-08).
2. **My Wallet Page** - Uses existing Wallet API `/balance` endpoint with auto-polling every 30s (per D-11).
3. **Auto-Polling** - Custom React hook pattern, not React Query (keeps bundle small for static export).
4. **Component Reuse** - 58 shadcn/ui components available; mint page provides complete template for transaction flows.

---

## 1. Hatch Egg Implementation

### Contract Interaction

**Function Call:**

```solidity
// EggNFT.sol
function hatchEgg(uint256 eggId) external returns (uint256 animalId)
```

**Requirements:**

- Egg must have `food_count >= 10`
- Caller must be egg owner
- Emits `EggHatched(eggId, animalId, rarity, species)`

**Implementation Pattern:**

```typescript
// apps/web/app/dashboard/eggs/[id]/hatch/page.tsx
const handleHatch = async () => {
  setLoading(true)
  try {
    const contract = new Contract(EGG_NFT_ADDRESS, EGG_NFT_ABI, signer)
    const tx = await contract.hatchEgg(eggId)
    await tx.wait() // Wait for confirmation

    // Show reveal
    setHatchedAnimal({
      animalId: result.animalId,
      species: result.species,
      rarity: result.rarity,
    })
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### Reveal UI (Simple - per D-08)

**No animations** - Just a card reveal:

```typescript
// apps/web/components/HatchReveal.tsx
export function HatchReveal({ animal }) {
  const rarityColors = {
    common: 'bg-gray-400',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500'
  }

  return (
    <Card>
      <CardHeader>
        <Badge className={rarityColors[animal.rarity]}>
          {animal.rarity.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{animal.species}</h2>
          <p className="text-muted-foreground">Generation #{animal.generation}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => router.push('/dashboard/nfts')}>
          Claim to Inventory
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### What Metadata to Show

From PocketBase `nfts` collection (synced by Phase 2 hooks):

- `species` - Chicken, Dragon, Phoenix, etc.
- `rarity` - Common (60%), Rare (25%), Epic (12%), Legendary (3%)
- `generation` - Gen 0, Gen 1, etc.
- `parent_egg_id` - Which egg it hatched from
- `food_distribution` - What types of food were fed (optional polish)

---

## 2. My Wallet Page

### USDT Balance Display

**Wallet API Endpoint:**

```javascript
GET /api/wallet/:address/balance
// Returns: { usdt: "125.50", native: "0.023" }
```

**Implementation with Auto-Polling:**

```typescript
// apps/web/app/wallet/page.tsx
export default function WalletPage() {
  const { balance, loading, error, refresh } = useWalletPoll(user.wallet)

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>USDT Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{balance.usdt} USDT</div>
          <p className="text-muted-foreground">
            ≈ ${(parseFloat(balance.usdt) * 1.00).toFixed(2)} USD
          </p>
          {loading && <p className="text-xs text-blue-500">Updating...</p>}
        </CardContent>
      </Card>

      {/* Withdraw Section */}
      <WithdrawForm balance={balance.usdt} />

      {/* Transaction History */}
      <TransactionHistory userId={user.id} />
    </div>
  )
}
```

### Withdraw Flow

**Critical:** Withdraw goes through PocketBase, not direct contract call.

```typescript
// apps/web/components/WithdrawForm.tsx
const handleWithdraw = async (amount: string) => {
  setLoading(true)
  try {
    // 1. Create withdrawal request in PocketBase
    const request = await pb.collection("withdrawal_requests").create({
      user: user.id,
      amount,
      status: "pending",
    })

    // 2. Backend hook processes withdrawal (Phase 2)
    // 3. User receives USDT in external wallet
    setSuccess(true)
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### Transaction History

Query PocketBase `transactions` collection:

```typescript
const transactions = await pb.collection("transactions").getList(1, 10, {
  filter: `user.id = "${user.id}"`,
  sort: "-created",
})
```

Display columns:

- Date
- Type (mint/purchase/sale/commission/withdraw)
- Amount (USDT)
- Status (confirmed/pending)
- Tx hash (link to BscScan)

---

## 3. Auto-Polling Strategy

### Custom Hook Pattern (NOT React Query)

React Query adds 13KB bundle size. Custom hook is 2KB:

```typescript
// apps/web/hooks/use-wallet-poll.ts
export function useWalletPoll(walletAddress: string, intervalMs = 30000) {
  const [balance, setBalance] = useState({ usdt: "0", native: "0" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return

    setLoading(true)
    try {
      const res = await fetch(`/api/wallet/${walletAddress}/balance`)
      const data = await res.json()
      setBalance(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    // Initial fetch
    fetchBalance()

    // Poll every intervalMs
    const pollInterval = setInterval(fetchBalance, intervalMs)
    return () => clearInterval(pollInterval)
  }, [fetchBalance, intervalMs])

  return { balance, loading, error, refresh: fetchBalance }
}
```

### Loading States

```typescript
// apps/web/components/BalanceDisplay.tsx
{loading && balance.usdt !== '0' && (
  <Badge variant="secondary" className="animate-pulse">
    Updating...
  </Badge>
)}

{error && (
  <Alert variant="destructive">
    <AlertDescription>
      Failed to load balance. <Button variant="link" onClick={refresh}>Retry</Button>
    </AlertDescription>
  </Alert>
)}
```

### Manual Refresh Button

```typescript
// Always provide manual override
<Button
  variant="outline"
  size="sm"
  onClick={refresh}
  disabled={loading}
>
  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
  Sync
</Button>
```

---

## 4. Product Detail Page

### Metadata Sources

**From PocketBase (primary):**

- NFT name, description
- Image URL
- Current owner
- Listed price (if for sale)
- Custom metadata (species, rarity, food_count)

**From Contract (fallback):**

- Token URI (IPFS/Arweave)
- On-chain attributes

### Page Structure

```typescript
// apps/web/app/marketplace/[nftId]/page.tsx
export default function NftDetailPage({ params }) {
  const { nft } = useNft(params.nftId) // PocketBase query

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Image */}
      <Card>
        <img src={nft.image} alt={nft.name} className="w-full" />
      </Card>

      {/* Right: Details */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{nft.name}</h1>
          <Badge>{nft.type}</Badge>
          <Badge variant={rarityToVariant(nft.rarity)}>
            {nft.rarity}
          </Badge>
        </div>

        <PriceCard price={nft.listed_price} onBuy={handleBuy} />

        {/* Stats */}
        <Grid className="grid-cols-2">
          <Stat label="Owner" value={nft.owner.name} />
          <Stat label="Food Count" value={`${nft.food_count}/10`} />
          <Stat label="Generation" value={nft.generation} />
          <Stat label="Species" value={nft.species} />
        </Grid>

        {/* Action Buttons */}
        {isOwner ? (
          <Button onClick={() => setListingModalOpen(true)}>
            List for Sale
          </Button>
        ) : (
          <Button onClick={handleBuy} disabled={!nft.is_listed}>
            Buy Now
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Reuse Existing Components

From mint page:

- `PriceCard` - Display price in USDT with buy button
- Loading states
- Error handling

From dashboard:

- `Stat` - Label/value pairs
- `Badge` - Rarity indicators

---

## 5. Referral Dashboard

### Data Model

From PocketBase `users` collection:

```typescript
interface User {
  id: string
  wallet_address: string
  referral_chain: [string, string, string, string] // [G1, G2, G3, G4]
  total_direct_recruits: number // G1 count
  lifetime_food_items: number
  usdt_balance: number
  total_earned_usdt: number
}
```

### Simple List First (per D-06)

**Tree visualization deferred** - Start with table:

```typescript
// apps/web/app/dashboard/referrals/page.tsx
export default function ReferralDashboard() {
  const { downline, earnings } = useReferralData(user.id)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Direct Recruits (G1)" value={downline.g1.length} />
        <StatCard label="Total Downline" value={downline.total} />
        <StatCard label="Lifetime Earnings" value={`${earnings.total} USDT`} />
      </div>

      {/* Referral Link */}
      <ReferralLinkGenerator userId={user.id} />

      {/* Earnings Breakdown */}
      <EarningsBreakdown earnings={earnings} />

      {/* Downline Table */}
      <DownlineTable downline={downline.g1} />
    </div>
  )
}
```

### Earnings Breakdown

```typescript
// apps/web/components/EarningsBreakdown.tsx
export function EarningsBreakdown({ earnings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.byLevel.map((level) => (
              <TableRow key={level.level}>
                <TableCell>G{level.level} ({level.percentage}%)</TableCell>
                <TableCell>{level.count}</TableCell>
                <TableCell className="font-medium">
                  {level.earned} USDT
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Downline Table

```typescript
// apps/web/components/DownlineTable.tsx
export function DownlineTable({ downline }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct Recruits</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Egg Purchases</TableHead>
              <TableHead>Food Purchases</TableHead>
              <TableHead>Your Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {downline.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{truncateAddress(user.wallet)}</TableCell>
                <TableCell>{formatDate(user.created)}</TableCell>
                <TableCell>{user.egg_purchases}</TableCell>
                <TableCell>{user.food_purchases}</TableCell>
                <TableCell className="font-medium">
                  {user.earned_for_you} USDT
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

---

## 6. Integration Patterns

### Reuse Mint Page Pattern

The existing mint page (`apps/web/app/mint/page.tsx`) provides the complete template:

```typescript
// Mint page structure (reuse for hatch, withdraw, etc.)
1. Loading state check
2. Wallet connection check
3. Form input (if needed)
4. Submit button with loading state
5. Transaction processing
6. Success/error handling
7. Redirect or show result
```

### Component Extraction Opportunities

**Extract these from existing pages:**

1. `TransactionProcessor` - Wraps contract calls with loading/error states
2. `WalletBalance` - Display with auto-polling
3. `NftCard` - Reusable card for marketplace/listings
4. `CommissionBreakdown` - Show G1/G2/G3/G4 distribution

### Composition Pattern

```typescript
// apps/web/components/BuyEgg.tsx
export function BuyEgg() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy Egg NFT</CardTitle>
        <CardDescription>
          25 USDT • Includes 2 bonus Food NFTs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionProcessor
          contract={eggNftContract}
          function="mintEggNFT"
          args={[user.address, referrer]}
          onSuccess={handleSuccess}
          onError={handleError}
        >
          <ReferrerInput />
          <BonusFoodPreview count={2} />
        </TransactionProcessor>
      </CardContent>
      <CardFooter>
        <SubmitButton loading={loading}>
          Mint for 25 USDT
        </SubmitButton>
      </CardFooter>
    </Card>
  )
}
```

---

## 7. Testing Strategy

### Component Tests (Critical)

```typescript
// apps/web/components/HatchReveal.test.tsx
import { test, expect } from 'bun:test'

test('HatchReveal shows correct rarity color', () => {
  render(<HatchReveal animal={{ rarity: 'legendary', species: 'Dragon' }} />)

  expect(screen.getByText('LEGENDARY')).toHaveClass('bg-yellow-500')
  expect(screen.getByText('Dragon')).toBeInTheDocument()
})

test('HatchReveal shows claim button', () => {
  const onClaim = vi.fn()
  render(<HatchReveal animal={{...}} onClaim={onClaim} />)

  expect(screen.getByText('Claim to Inventory')).toBeInTheDocument()
})
```

### Integration Tests (Important)

```typescript
// apps/web/__tests__/hatch-flow.test.tsx
test('complete hatch flow', async () => {
  // 1. Navigate to egg detail
  render(<EggDetailPage eggId={123} />)

  // 2. Click hatch button
  await userEvent.click(screen.getByText('Hatch Egg'))

  // 3. Confirm transaction
  await userEvent.click(screen.getByText('Confirm'))

  // 4. Wait for reveal
  await waitFor(() => {
    expect(screen.getByText('LEGENDARY')).toBeInTheDocument()
  })

  // 5. Claim to inventory
  await userEvent.click(screen.getByText('Claim to Inventory'))

  // 6. Verify redirect
  expect(router.push).toHaveBeenCalledWith('/dashboard/nfts')
})
```

### E2E Flow Tests (Post-MVP)

Defer until core pages complete. Priority order:

1. Buy Egg → Feed → Hatch loop
2. Buy Food → Feed → Hatch loop
3. List for Sale → Purchase flow
4. Withdraw earnings

---

## 8. Page Priority Matrix

### Wave 1 (MVP Critical - Must Have)

| Page      | Effort  | Impact                            | Dependencies       |
| --------- | ------- | --------------------------------- | ------------------ |
| Hatch Egg | 2 hours | HIGH - Completes core loop        | Egg detail page    |
| My Wallet | 3 hours | HIGH - Users need to see earnings | Wallet API Phase 2 |

### Wave 2 (Better UX - Should Have)

| Page               | Effort  | Impact                    | Dependencies          |
| ------------------ | ------- | ------------------------- | --------------------- |
| Product Detail     | 2 hours | MEDIUM - Better discovery | PocketBase NFT sync   |
| Referral Dashboard | 3 hours | MEDIUM - Better tracking  | Referral hook Phase 2 |

### Wave 3 (Polish - Nice to Have)

| Page                | Effort  | Impact                       | Dependencies         |
| ------------------- | ------- | ---------------------------- | -------------------- |
| Buy Food Standalone | 1 hour  | LOW - Already in marketplace | Food NFT contract    |
| List for Sale       | 2 hours | LOW - Secondary market       | Marketplace contract |

---

## 9. Recommended Plan Structure

### Plan 01: Hatch Egg Flow (Wave 1)

- task 1: Create hatch page structure
- task 2: Implement hatch transaction logic
- task 3: Build reveal UI component
- checkpoint: Test hatch flow end-to-end

### Plan 02: My Wallet Page (Wave 1)

- task 1: Create useWalletPoll hook
- task 2: Build wallet page with balance display
- task 3: Implement withdraw form
- task 4: Add transaction history
- checkpoint: Verify balance polling + withdraw

### Plan 03: Product Detail + Referral (Wave 2)

- task 1: Create product detail page
- task 2: Build referral dashboard with table
- checkpoint: Review both pages

### Plan 04: Polish + Auto-Polling (Wave 2)

- task 1: Add auto-polling to dashboard pages
- task 2: Build list-for-sale modal
- task 3: Add buy food standalone page
- checkpoint: Test all polling + flows

---

## 10. Common Pitfalls to Avoid

### 1. Hydration Mismatches

❌ **Wrong:**

```typescript
const user = pb.authStore.record // Accesses during SSR
```

✅ **Correct:**

```typescript
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null
```

### 2. Missing Loading States

❌ **Wrong:**

```typescript
const { balance } = useWalletPoll(address)
return <div>{balance.usdt} USDT</div> // Undefined on first render
```

✅ **Correct:**

```typescript
const { balance, loading } = useWalletPoll(address)
if (loading) return <LoadingSpinner />
return <div>{balance.usdt} USDT</div>
```

### 3. Direct Contract Calls for Balance

❌ **Wrong:**

```typescript
const balance = await usdtContract.balanceOf(address) // Slow, rate-limited
```

✅ **Correct:**

```typescript
const balance = await fetch(`/api/wallet/${address}/balance`) // Fast, cached
```

### 4. Polling Too Frequently

❌ **Wrong:**

```typescript
setInterval(fetchBalance, 5000) // 5 seconds = rate limit risk
```

✅ **Correct:**

```typescript
setInterval(fetchBalance, 30000) // 30 seconds = balanced
```

### 5. Tree Visualization Complexity

❌ **Wrong:** Build D3 tree visualization for referrals (8+ hours)

✅ **Correct:** Simple table first (2 hours), tree later if needed

---

## 11. Dependencies on Phase 2

**Phase 3 BLOCKS until Phase 2 completes:**

1. **Wallet API endpoints** - Balance queries, withdraw processing
2. **PocketBase NFT sync hook** - NFTs collection populated with metadata
3. **Commission tracking hook** - Referral earnings data
4. **Withdrawal requests collection** - For withdraw flow

**Phase 3 CAN START without:**

- Direct contract event listeners (use PocketBase as source of truth)
- On-chain balance queries (use Wallet API)

---

## 12. Validation Architecture

### Truths (Observable Behaviors)

- User can hatch an egg after feeding 10 food items
- User can see their USDT balance on wallet page
- User can request a withdrawal
- Balance updates automatically every 30 seconds
- User can see their referral downline in a table
- User can see commission earnings by level (G1/G2/G3/G4)

### Artifacts (Files to Create)

| Path                                     | Purpose            | Lines   |
| ---------------------------------------- | ------------------ | ------- |
| `app/dashboard/eggs/[id]/hatch/page.tsx` | Hatch egg page     | 80-100  |
| `app/wallet/page.tsx`                    | Wallet page        | 100-120 |
| `app/dashboard/referrals/page.tsx`       | Referral dashboard | 100-120 |
| `app/marketplace/[nftId]/page.tsx`       | Product detail     | 80-100  |
| `hooks/use-wallet-poll.ts`               | Auto-polling hook  | 40-50   |
| `components/HatchReveal.tsx`             | Hatch reveal UI    | 50-60   |
| `components/WithdrawForm.tsx`            | Withdraw form      | 60-70   |
| `components/DownlineTable.tsx`           | Downline display   | 50-60   |

### Key Links (Critical Connections)

- `hatch/page.tsx` → `EggNFT.hatchEgg()` via ethers
- `wallet/page.tsx` → `/api/wallet/:address/balance` every 30s
- `withdraw/page.tsx` → PocketBase `withdrawal_requests` collection
- `referrals/page.tsx` → PocketBase `users` with referral_chain

---

## Conclusion

Phase 3 needs **4 focused plans** targeting the 6 remaining pages. Priority is completing the core game loop (hatch + wallet), then adding polish (product detail + referrals).

**Estimated Effort:** 8-12 hours total (1-1.5 days)
**Risk:** Low - reusing existing patterns from mint page and dashboard
**Blockers:** Phase 2 Wallet API + PocketBase hooks must complete first

**Next Step:** Create PLAN.md files for each wave, starting with Hatch Egg and My Wallet pages.

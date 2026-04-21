# Buy Now Flow Verification — Phase 17 Plan 17-02

## Critical Issues Found

### Issue 1: Endpoint Mismatch

**Frontend calls:** `/api/v2/marketplace/buy` (BuyFlow.tsx:175)
**Backend registers:** `/api/v2/buy-nft` (20-buy-nft.pb.js:35)

**Impact:** Buy Now flow will fail with 404 error.

**Fix needed:** Either:

1. Update frontend to call `/api/v2/buy-nft`, OR
2. Update backend to register `/api/v2/marketplace/buy`

### Issue 2: Request Body Mismatch

**Frontend sends:**

```json
{
  "listing_id": "string",
  "buyer_address": "0x..."
}
```

**Backend expects:**

```json
{
  "nft_id": "string",
  "nft_type": "egg|food|animal"
}
```

**Impact:** Backend will reject request with "NFT ID and type required" error.

**Fix needed:** Update backend to accept listing_id and look up listing, OR update frontend to send nft_id/nft_type.

## Current Implementation Analysis

### BuyFlow Component (apps/web/components/marketplace/BuyFlow.tsx)

**✅ Good:**

- Dialog flow implemented (lines 54-57)
- Purchase state management (isPurchasing)
- Wallet validation (lines 152-165)
- Toast notifications (lines 169-172, 194-198)
- Error handling (lines 189-191)
- Success redirect (lines 200+)
- Hydration safety (lines 49, 60-63, 136-138)
- Auth check (lines 87-96, 140-142)

**✅ Size:** 326 lines (meets ≥300 line requirement)

**✅ Exports:** `BuyFlow`, `BuyFlowProps`

### Backend Hook (apps/backend/pb_hooks/20-buy-nft.pb.js)

**✅ Good:**

- Full purchase flow implemented (lines 35-220)
- USDT balance validation (lines 116-140)
- Balance deduction/credit with 4% fee (lines 142-171)
- NFT ownership transfer (lines 173-177)
- Transaction recording (lines 179-194)
- Error handling (lines 210-219)
- Proper JSON responses

**❌ Issues:**

- Wrong endpoint path (`/api/v2/buy-nft` instead of `/api/v2/marketplace/buy`)
- Wrong request body format (expects `nft_id`, receives `listing_id`)
- Doesn't integrate with marketplace listings collection

## Fix Plan

### Option 1: Fix Backend to Match Frontend (RECOMMENDED)

Update `20-buy-nft.pb.js` to:

1. Change endpoint to `/api/v2/marketplace/buy`
2. Accept `listing_id` and `buyer_address`
3. Look up listing from `marketplace_listings` collection
4. Use listing's nft_id, nft_type, price for purchase logic

### Option 2: Fix Frontend to Match Backend

Update `BuyFlow.tsx` to:

1. Change endpoint to `/api/v2/buy-nft`
2. Send `nft_id` and `nft_type` instead of `listing_id`
3. Get nft_id/nft_type from props instead of listingId

## Recommendation

**Option 1 is better** because:

- Frontend is already integrated with marketplace listing pages
- `listingId` is the natural identifier in marketplace context
- Backend should adapt to frontend's domain model (listings)
- Less frontend changes needed (already wired up in [id]/page.tsx)

## Testing Strategy

After fix:

1. Unit test: Verify endpoint responds correctly
2. Integration test: Test full purchase flow
3. Manual test: Click Buy Now on marketplace detail page

## Artifacts

- Frontend component: apps/web/components/marketplace/BuyFlow.tsx (✅ exists, 326 lines)
- Backend hook: apps/backend/pb_hooks/20-buy-nft.pb.js (✅ exists, needs fixes)
- Integration gap: Endpoint and request body mismatch (❌ needs fix)

# Phase 23: Secondary Market & Royalties - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable Animal NFT resale on marketplace with 10% royalty distribution to the original referrer chain. Users can list owned Animal NFTs for custom USDT prices, and buyers can purchase them with royalties automatically calculated and distributed.

**In scope:**

- List Animal NFT for sale with custom price
- Secondary sale triggers 10% royalty to referral chain (2% G1, 1% G2, 1% G3, 1% G4)
- Seller receives 85% of sale price
- Marketplace displays Animal NFTs with rarity filter
- Breeding cooldown validation before listing
- Purchase flow reuse from Phase 19

**Out of scope:**

- Auction-style listings (deferred)
- Direct offers to NFT owners (deferred)
- Bulk listing from inventory page
- Price expiration/relist logic
- Collection views and portfolio analytics

</domain>

<decisions>
## Implementation Decisions

### Listing UX

- **D-01:** Individual listing only — "List for Sale" button on Animal detail page
- **D-02:** Reuse existing detail page pattern from Egg/Food NFTs
- **D-03:** No bulk listing support — focus on single NFT experience first

### Pricing & Duration

- **D-04:** Fixed price only, no expiration — simplest implementation
- **D-05:** Listing stays active until sold or manually cancelled
- **D-06:** Matches Phase 19 marketplace pattern for consistency

### Royalty Distribution

- **D-07:** Off-chain royalty distribution via backend hook (matches Phase 12 commission pattern)
- **D-08:** Backend calculates and distributes 10% royalty after sale completes
- **D-09:** No smart contract upgrade required — reuse existing Marketplace.sol
- **D-10:** Royalty split: 2% G1, 1% G2, 1% G3, 1% G4 of total sale price

### Marketplace Display & Filters

- **D-11:** Rarity filter required (Common/Rare/Epic/Legendary)
- **D-12:** Price sorting (ascending/descending) recommended
- **D-13:** Generation filter optional — defer if time constrained
- **D-14:** Reuse AnimalCard component with "Listed by [user]" badge

### Purchase Flow

- **D-15:** Reuse Phase 19 Buy Now flow — no custom secondary market flow
- **D-16:** Same UI components, same transaction pattern
- **D-17:** Transaction hash emitted on secondary sale

### Smart Contract

- **D-18:** Reuse existing Marketplace.sol listItem() function
- **D-19:** No new SecondaryMarket.sol contract
- **D-20:** No contract upgrade — secondary sales use same listing structure

### Backend Storage

- **D-21:** New resale_listings collection in PocketBase
- **D-22:** Track: nft_id, seller_id, price, royalty_recipients, status
- **D-23:** Create listing record on list, update on sale

### Validation

- **D-24:** Check breeding cooldown status before allowing listing (required)
- **D-25:** Verify NFT ownership — only owner can list (required for security)
- **D-26:** Price confirmation modal before finalizing listing

### Claude's Discretion

- Price input validation (minimum price, decimal handling)
- Error messages for failed listings
- Empty state for marketplace when no Animal NFTs listed
- Loading states during listing/purchase

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Phase 23 — RESALE-01 through RESALE-05 requirements
- `.planning/PROJECT.md` §Active Milestone — Secondary Market description

### Prior Phase Patterns

- `.planning/phases/19-real-nft-mint-flow-marketplace-integration/19-CONTEXT.md` — Marketplace buy flow pattern
- `.planning/phases/12-wallet-api-contract-integration/12-CONTEXT.md` — Commission distribution pattern
- `.planning/phases/21-breeding-system/21-CONTEXT.md` — Animal NFT handling, breeding cooldown

### Contract & Backend

- `contracts/src/Marketplace.sol` — Existing marketplace contract
- `apps/backend/pb_hooks/` — Existing hooks pattern (01-xx naming)
- `wallet-api/server.js` — Transaction signing pattern

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **AnimalCard component:** `apps/web/components/AnimalCard.tsx` — Add "Listed by" badge variant
- **Marketplace page:** `apps/web/app/marketplace/page.tsx` — Extend for Animal NFT tab
- **Buy Now flow:** Phase 19 implementation — Reuse transaction pattern
- **Commission distribution:** Phase 12 hook `12-commission.pb.js` — Royalty distribution pattern

### Established Patterns

- **PocketBase listings:** `marketplace_items` collection — Reference schema for `resale_listings`
- **Wallet-API endpoints:** `/buy-egg`, `/claim-commission` — Transaction flow pattern
- **Cooldown validation:** Phase 21 breeding cooldown — Reuse validation logic

### Integration Points

- **Marketplace.sol listItem():** Reuse for secondary listings
- **AnimalNFT.sol:** Ownership verification, rarity enum
- **PocketBase hooks:** On resale listing create/update hooks
- **CommissionDistribution.sol:** May need adjustment for royalty recipients

</code_context>

<specifics>
## Specific Ideas

- "Listed by [username]" badge on marketplace cards — clear ownership display
- Royalty breakdown in backend logs for transparency (not shown to users)
- Simple rarity filter dropdown (Common/Rare/Epic/Legendary)
- Fixed 85% seller payout (no negotiation)

</specifics>

<deferred>
## Deferred Ideas

- **Bulk listing** — List multiple Animal NFTs from inventory page (Phase 24+)
- **Auction-style listings** — Bid system with expiration (Future milestone)
- **Direct offers** — Offer to specific NFT owner (Future milestone)
- **Price expiration** — 7/14/30 day listing expiration (Phase 24+)
- **Generation filter** — Higher priority for breeding lineage display
- **Custom secondary market flow** — Detailed royalty breakdown UI (Phase 24+)

</deferred>

---

_Phase: 23-secondary-market-royalties_
_Context gathered: 2026-04-22_

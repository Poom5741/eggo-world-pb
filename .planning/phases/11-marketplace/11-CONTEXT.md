# Phase 11: Marketplace - Context

**Gathered:** 2026-04-15  
**Status:** Ready for planning

<domain>
## Phase Boundary

NFT marketplace interface where users can browse available NFTs, view product details, buy NFTs with USDT, create sell listings, and see transparent commission breakdown showing 4-level referral distribution.

**Requirements:** MKT-01, MKT-02, MKT-03, MKT-04, MKT-05, MKT-06

**Success Criteria:**

1. Marketplace page lists all available NFTs from PocketBase with filters
2. Product detail page shows NFT metadata (image, name, rarity, owner) and price in USDT
3. Buy flow executes USDT approval then marketplace purchase transaction
4. Sell flow creates marketplace listing with escrow and sets asking price
5. Commission breakdown displays 4-level referral distribution (G1 20%, G2-G4 10% each)
6. Transaction confirmation updates UI state after blockchain sync completes

</domain>

<decisions>
## Locked Decisions (from Phase 8-10 patterns)

### Design System

- **D-01:** Claymorphism styling consistent with Phases 8-10 — use existing `clay-card`, `clay-button` classes
- **D-02:** Material Symbols icons throughout — no Lucide icons (per Phase 9 D-01)
- **D-03:** Thai language for UI text with English subtitles where appropriate
- **D-04:** Loading skeletons with `animate-pulse` during data fetch (per Phase 10 pattern)
- **D-05:** Error boundaries with retry button (per Phase 10 pattern)
- **D-06:** Exponential backoff polling: 30s → 60s → 120s → 5min (per Phase 10 D-20)

### Transaction Flow

- **D-07:** Two-step buy flow: USDT approval → marketplace purchase (ERC20 approval pattern)
- **D-08:** Transaction confirmation toasts with Etherscan link (per Phase 9 pattern)
- **D-09:** Polling state indicator: "Updating..." badge with pulse animation (per Phase 9 D-05, Phase 10)
- **D-10:** Commission breakdown shows all 4 levels: G1 (20%), G2 (10%), G3 (10%), G4 (10%)

### Component Patterns

- **D-11:** Card grid layout: 3 columns desktop, 2 tablet, 1 mobile (per Phase 10 D-03)
- **D-12:** Rarity badges: Common (gray), Rare (blue), Epic (purple), Legendary (yellow) (per Phase 10 D-24)
- **D-13:** Price display in USDT with 4 decimal places (e.g., "100.0000 USDT")
- **D-14:** Owner address truncated: first 6 chars + "..." + last 4 chars

### OpenCode's Discretion

- Filter UI implementation (dropdown vs chips vs sidebar)
- Exact marketplace page layout (hero section vs simple grid)
- Sort options (price, rarity, newest)
- Empty state illustration style
- Sell dialog form field ordering
- Exact animation timings for transaction success

</decisions>

<canonical_refs>

## Canonical References

**Existing Code to Reuse:**

| Pattern | Source | Adaptation |
|---------|--------|------------|
| `useWalletPoll` | `apps/web/hooks/use-wallet-poll.ts` | Create `useMarketplacePoll` for listing status |
| Egg cards | `apps/web/components/eggs/egg-card.tsx` | Adapt for NFT product cards |
| Transaction flow | Phase 9 buy food | Same approval → purchase pattern |
| Loading skeletons | `apps/web/app/eggs/loading.tsx` | Create marketplace loading skeleton |
| Error boundary | `apps/web/app/eggs/error.tsx` | Create marketplace error boundary |
| Rarity badges | Phase 10 egg cards | Same color coding, add to product cards |

**Smart Contract Functions:**

```solidity
// From Marketplace.sol (to be confirmed):
function buyNft(uint256 listingId) external payable
function createListing(uint256 tokenId, uint256 price) external
function cancelListing(uint256 listingId) external
function updatePrice(uint256 listingId, uint256 newPrice) external
function getListings() external view returns (Listing[])
function getListing(uint256 listingId) external view returns (Listing)

// From USDT.sol (existing):
function approve(address spender, uint256 amount) external returns (bool)
function allowance(address owner, address spender) external view returns (uint256)
```

**PocketBase Collections:**

```javascript
// nft_listings collection (to be confirmed):
- id (string)
- token_id (string) — NFT token ID
- seller (string) — user ID or wallet address
- price (number) — price in USDT (wei)
- status (string) — active/sold/cancelled
- created (datetime)
- nft_metadata (json) — cached NFT metadata

// eggs / animal_nfts collection (existing):
- Used for displaying NFT metadata
```

</canonical_refs>

<research_needed>

## Research Required (Level 2)

Phase 11 requires standard research before planning:

1. **Marketplace.sol contract analysis** — Confirm available functions and parameters
2. **PocketBase marketplace collection** — Verify schema and fields
3. **Existing marketplace code audit** — Understand what's already built in `apps/web/app/marketplace/`
4. **USDT approval pattern** — Confirm ERC20 approval flow for marketplace
5. **Commission distribution logic** — How 4-level referral distribution is calculated on-chain

**Recommended:** Run `/gsd-research-phase 11` before planning to gather technical details.

</research_needed>

</context>

# Phase 23: Secondary Market & Royalties - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 23-secondary-market-royalties
**Areas discussed:** Listing UX, Pricing, Royalties, Filters, Purchase, Contract, Listing UI, Backend, Validation

---

## Listing UX

| Option                      | Description                                                                                                                                 | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Individual listing only     | Dedicated "List for Sale" button on Animal detail page. Reuses existing pattern from Egg detail. Simpler, focuses on single NFT experience. | ✓        |
| Bulk listing from inventory | List multiple Animal NFTs from user's /animals page. Faster for collectors but more complex UI.                                             |          |
| Both approaches             | Individual from detail page + bulk from inventory. Maximum flexibility but requires two UX patterns.                                        |          |

**User's choice:** Individual listing only
**Notes:** Reuses existing detail page pattern for consistency

---

## Pricing & Duration

| Option                               | Description                                                                                                                        | Selected |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Fixed price, no expiration           | Simplest implementation. User sets USDT price, listing stays active until sold or cancelled. Matches Phase 19 marketplace pattern. | ✓        |
| Fixed price with optional expiration | User can set 7/14/30 day expiration. Auto-expired listings reduce clutter but add complexity.                                      |          |
| Price with auto-relist               | Expired listings automatically relist at same price. Keeps marketplace populated but requires relist logic.                        |          |

**User's choice:** Fixed price, no expiration
**Notes:** Matches Phase 19 marketplace pattern for consistency

---

## Royalty Distribution

| Option                   | Description                                                                                                                         | Selected |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Off-chain distribution   | Backend calculates and distributes after sale. Matches existing commission pattern (Phase 12). Simpler, no contract upgrade needed. | ✓        |
| On-chain automatic split | Smart contract splits royalty on sale. Requires contract upgrade. More gas, fully transparent.                                      |          |
| Hybrid approach          | Contract holds royalty, backend triggers distribution. Combines on-chain transparency with off-chain control.                       |          |

**User's choice:** Off-chain distribution
**Notes:** Matches Phase 12 commission distribution pattern — no contract upgrade required

---

## Marketplace Display & Filters

| Option                              | Description                                                                                  | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Rarity (Common/Rare/Epic/Legendary) | Core filter. Essential for marketplace browsing. Existing rarity enum in AnimalNFT contract. | ✓        |
| Generation (Gen 0, Gen 1, Gen 2+)   | Shows breeding lineage. Higher gen = more bred animals. Useful for collectors.               |          |
| Species type                        | Filter by animal type (if species exist in contract). Adds variety to browsing.              |          |
| Price sorting (Low/High)            | Essential for price-conscious buyers. Ascending/descending sort.                             |          |

**User's choice:** Rarity filter only (initially)
**Notes:** Price sorting recommended but Generation/Species deferred

---

## Purchase Flow

| Option                             | Description                                                                                                                            | Selected |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Reuse Buy Now flow                 | Reuse Phase 19 marketplace purchase pattern. Same flow, same UI components. Minimal new code, consistent UX.                           | ✓        |
| Custom flow with royalty breakdown | Custom secondary market flow showing royalty breakdown (10% to referrers, 85% to seller, 5% platform). More transparent but more code. |          |

**User's choice:** Reuse Buy Now flow
**Notes:** Minimal new code, consistent with Phase 19 marketplace pattern

---

## Smart Contract Approach

| Option                           | Description                                                                                                | Selected |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Reuse existing Marketplace.sol   | Reuse Marketplace.listItem() function. No contract changes. Secondary sales use same listing structure.    | ✓        |
| New SecondaryMarket.sol contract | Add ResaleListing struct with royalty tracking. More explicit but requires contract upgrade and migration. |          |
| Extend Marketplace contract      | Extend Marketplace.sol with royalty field. Minimal upgrade, backward compatible.                           |          |

**User's choice:** Reuse existing Marketplace.sol
**Notes:** No contract upgrade — secondary sales use same listing structure as primary sales

---

## Listing UI Display

| Option                         | Description                                                                                                         | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Reuse AnimalCard with badge    | Reuse marketplace card layout with "Listed by [user]" badge. Minimal changes, consistent with existing cards.       | ✓        |
| New ResaleAnimalCard component | New ResaleAnimalCard component with seller info, price, royalty breakdown visible. More detailed but new component. |          |

**User's choice:** Reuse AnimalCard with badge
**Notes:** Add "Listed by [user]" badge to existing AnimalCard component

---

## Backend Storage

| Option                              | Description                                                                                                                                          | Selected |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| New resale_listings collection      | Create resale_listings collection in PocketBase. Track listed NFTs, prices, sellers, royalty recipients. Matches existing marketplace_items pattern. | ✓        |
| Extend marketplace_items collection | Extend existing marketplace_items collection with is_secondary field. Reuse schema but add flag.                                                     |          |

**User's choice:** New resale_listings collection
**Notes:** Clean separation, matches marketplace_items schema pattern

---

## Validation Requirements

| Option                         | Description                                                              | Selected     |
| ------------------------------ | ------------------------------------------------------------------------ | ------------ |
| Check breeding cooldown status | Required. Prevents listing NFTs that are locked for breeding.            | ✓            |
| Verify NFT ownership           | Required. Only owner can list their NFT.                                 | ✓ (implicit) |
| Show similar NFT prices        | Optional. Might confuse users if different owners have different prices. |              |
| Price confirmation modal       | Optional. User must confirm price before listing.                        | ✓            |

**User's choice:** Breeding cooldown status check, ownership verification (security), price confirmation modal
**Notes:** Ownership verification is mandatory for security even though not explicitly selected

---

## Claude's Discretion

- Price input validation (minimum price, decimal handling)
- Error messages for failed listings
- Empty state for marketplace when no Animal NFTs listed
- Loading states during listing/purchase

---

## Deferred Ideas

- Bulk listing — List multiple Animal NFTs from inventory page (Phase 24+)
- Auction-style listings — Bid system with expiration (Future milestone)
- Direct offers — Offer to specific NFT owner (Future milestone)
- Price expiration — 7/14/30 day listing expiration (Phase 24+)
- Generation filter — Higher priority for breeding lineage display
- Custom secondary market flow — Detailed royalty breakdown UI (Phase 24+)

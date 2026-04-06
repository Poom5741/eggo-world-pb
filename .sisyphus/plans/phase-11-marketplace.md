# Phase 11: Marketplace - Work Plan

## TL;DR

> **Quick Summary**: Build NFT marketplace interface for buying and selling Egg/Food/Animal NFTs with transparent 50% commission display. Users browse listings, buy with USDT (approve→purchase), and sell from inventory pages.
> 
> **Deliverables**: 
> - Marketplace page with grid listings and filters
> - Product detail page with commission breakdown
> - Buy flow (USDT approval + purchase)
> - Sell flow (create listing from inventory)
> - Cancel/update listing for sellers
> - Real-time status sync with blockchain
> 
> **Estimated Effort**: Medium (4-5 waves, ~8 tasks)
> **Parallel Execution**: YES - UI components can parallelize, contract integration sequential
> **Critical Path**: Design → Grid/Listings → Buy Flow → Sell Flow → Status Sync

---

## Context

### Original Request
Phase 11 of v0.0.6 Frontend Migration: Build Marketplace feature per requirements MKT-01 through MKT-06 with commission display showing 4-level referral distribution (G1 20%, G2-G4 10% each = 50% total).

### Interview Summary
**Key Decisions**:
- Commission: 50% of sale price (G1 20%, G2-G4 10% each)
- NFT types: All supported (Egg, Food, Animal)
- Sell flow: Create listing from inventory pages (Eggs, Food, Animals)
- Buy flow: Two-step (approve USDT → execute purchase)
- Filters: By type (Egg/Food/Animal), by rarity, by price range, by newest

**Research Findings**:
- Smart contracts: `listNFTForSale()`, `buyNFT()`, `cancelListing()`, `updateListingPrice()`
- PocketBase collection: `marketplace_listings`
- Minimum prices: Egg 1 USDT, Food 0.50 USDT (from spec)
- Commission distributed immediately on purchase

### Metis Review
**Identified Gaps** (addressed):
- Race conditions: NFT sold/cancelled between view and purchase
- Stale data: PocketBase sync with blockchain
- USDT approval UX: Two-step process needs clear guidance
- Commission clarity: Show breakdown BEFORE confirmation
- Gas fee surprise: Show estimated gas upfront

---

## Work Objectives

### Core Objective
Build marketplace interface where users can browse NFT listings, view product details with commission breakdown, buy NFTs with USDT (two-step approval), and create sell listings from their inventory pages.

### Concrete Deliverables
1. Marketplace page (`/marketplace`) with grid layout and filters
2. Product detail page (`/marketplace/[id]`) with NFT metadata and commission breakdown
3. Buy flow: Approve USDT → Purchase NFT → Confirmation
4. Sell flow: "Sell" button on inventory pages → Set price → Create listing
5. Cancel listing flow for sellers
6. Update listing price flow
7. Real-time status sync (active/sold/cancelled)
8. Commission breakdown UI (G1-G4 distribution)

### Definition of Done
- [ ] `bun test` passes with new marketplace tests
- [ ] `bun run build` succeeds with zero errors
- [ ] Marketplace page lists all active listings
- [ ] Product detail shows correct commission breakdown
- [ ] Buy flow executes USDT approval then purchase
- [ ] Sell flow creates listing from inventory
- [ ] Cancel/update listing works for sellers
- [ ] Sold/cancelled listings marked appropriately

### Must Have
- Grid layout with responsive design (3/2/1 columns)
- Filter by type (Egg/Food/Animal), rarity, price range
- Commission breakdown visible BEFORE purchase
- Two-step buy flow with clear progress
- Sell button on Eggs/Food/Animals inventory pages
- Real-time status sync with blockchain

### Must NOT Have (Guardrails)
- NO auction/bidding system (fixed price only)
- NO offer/negotiation flow
- NO bundle sales
- NO price analytics/charts (basic list only)
- NO infinite USDT approvals (exact amount only)
- NO manual NFT selection UI (auto-select from inventory)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Bun test, 206 tests passing)
- **Automated tests**: YES (TDD - Red/Green/Refactor)
- **Framework**: Bun test with React Testing Library
- **Agent-Executed QA**: Playwright for browser UI, curl for API

### QA Policy
Every task includes agent-executed QA scenarios with:
- **Frontend/UI**: Playwright - Navigate, interact, assert DOM, screenshot
- **API**: Bash (curl) - Send requests, assert status + response
- **Evidence**: `.sisyphus/evidence/task-{N}-{scenario}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Create marketplace page shell + route
├── Task 2: Create marketplace listing card component
├── Task 3: Create marketplace filters component
└── Task 4: Setup PocketBase marketplace_listings integration

Wave 2 (After Wave 1 - buy flow):
├── Task 5: Build marketplace grid with real data
├── Task 6: Build product detail page
├── Task 7: Implement USDT approval flow
└── Task 8: Implement buy NFT transaction flow

Wave 3 (After Wave 2 - sell flow):
├── Task 9: Add "Sell" button to Eggs inventory
├── Task 10: Add "Sell" button to Food inventory
├── Task 11: Add "Sell" button to Animals inventory
└── Task 12: Implement create listing flow

Wave 4 (After Wave 3 - management):
├── Task 13: Implement cancel listing flow
├── Task 14: Implement update price flow
├── Task 15: Build commission breakdown component
└── Task 16: Implement real-time status sync

Wave FINAL (After ALL - verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 5 |
| 2 | - | 5 |
| 3 | - | 5 |
| 4 | - | 5,6,7,8 |
| 5 | 1,2,3,4 | 6 |
| 6 | 4,5 | 7,8 |
| 7 | 6 | 8 |
| 8 | 6,7 | F1-F4 |
| 9 | - | 12 |
| 10 | - | 12 |
| 11 | - | 12 |
| 12 | 4,9,10,11 | F1-F4 |
| 13 | 12 | F1-F4 |
| 14 | 12 | F1-F4 |
| 15 | 6,8 | F1-F4 |
| 16 | 4,8 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → `quick` agents (scaffolding)
- **Wave 2**: 4 tasks → `visual-engineering` + `unspecified-high` (buy flow)
- **Wave 3**: 4 tasks → `quick` + `unspecified-high` (sell flow)
- **Wave 4**: 4 tasks → `unspecified-high` + `deep` (management + sync)
- **FINAL**: 4 tasks → parallel verification

---

## TODOs

- [ ] 1. Create marketplace page shell + route

  **What to do**:
  - Create `/app/marketplace/page.tsx` with LayoutWrapper
  - Add route to navigation (TopNav, SideNav, BottomNav)
  - Setup basic page structure with header and container
  - Add Thai comments for all code
  
  **Must NOT do**:
  - No actual listing data yet (placeholder only)
  - No filters or search
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Task 5
  
  **References**:
  - `apps/web/app/eggs/page.tsx` - Page structure pattern
  - `apps/web/components/LayoutWrapper.tsx` - Navigation wrapper
  - `resources/eggo-world-uxui-jules/src/app/marketplace/page.tsx` - Design reference
  
  **Acceptance Criteria**:
  - [ ] `/marketplace` route accessible
  - [ ] LayoutWrapper renders TopNav, SideNav, BottomNav
  - [ ] Page shows "Marketplace" header
  
  **QA Scenarios**:
  ```
  Scenario: Marketplace page loads
    Tool: Playwright
    Steps:
      1. Navigate to /marketplace
      2. Assert "Marketplace" text visible
      3. Assert LayoutWrapper renders navigation
    Evidence: .sisyphus/evidence/task-1-marketplace-load.png
  ```

  **Commit**: 
  - Message: `feat(marketplace): add marketplace page shell`
  - Files: `apps/web/app/marketplace/page.tsx`

---

- [ ] 2. Create marketplace listing card component

  **What to do**:
  - Create `components/marketplace/ListingCard.tsx`
  - Props: nft (image, name, rarity, price, seller)
  - Claymorphism styling with hover animation
  - Rarity badge (Common/Rare/Epic/Legendary)
  - Price display in USDT
  - "View Details" button
  
  **Must NOT do**:
  - No buy button on card (navigate to detail page)
  - No real data fetching (receive via props)
  
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Task 5
  
  **References**:
  - `apps/web/components/ui/card.tsx` - Claymorphism variants
  - `apps/web/components/ui/badge.tsx` - Rarity badges
  - `apps/web/components/eggs/EggCard.tsx` - Card pattern from Phase 10
  - `resources/eggo-world-uxui-jules/src/app/marketplace/page.tsx` - Design reference

  **Acceptance Criteria**:
  - [ ] Component renders with mock data
  - [ ] Claymorphism styling applied
  - [ ] Hover animation works
  - [ ] Rarity badge displays correctly
  - [ ] Price shows in USDT format

  **QA Scenarios**:
  ```
  Scenario: Listing card renders correctly
    Tool: Playwright
    Steps:
      1. Render ListingCard with mock NFT
      2. Assert image displays
      3. Assert rarity badge visible
      4. Assert price shows "25 USDT"
      5. Hover and verify animation
    Evidence: .sisyphus/evidence/task-2-listing-card.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add listing card component`
  - Files: `apps/web/components/marketplace/ListingCard.tsx`

---

- [ ] 3. Create marketplace filters component

  **What to do**:
  - Create `components/marketplace/MarketplaceFilters.tsx`
  - Filter by type: Egg, Food, Animal (checkboxes or tabs)
  - Filter by rarity: Common, Rare, Epic, Legendary
  - Sort by: Newest, Price (low→high), Price (high→low)
  - Clear filters button
  - Claymorphism styling
  
  **Must NOT do**:
  - No price range slider (dropdown only)
  - No advanced filters
  
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Task 5
  
  **References**:
  - `apps/web/components/ui/select.tsx` - Dropdown component
  - `apps/web/components/ui/checkbox.tsx` - Checkbox component
  - Phase 10 filter patterns if any

  **Acceptance Criteria**:
  - [ ] Type filter renders (Egg/Food/Animal)
  - [ ] Rarity filter renders
  - [ ] Sort dropdown renders
  - [ ] Clear filters button works
  - [ ] onChange callbacks fire correctly

  **QA Scenarios**:
  ```
  Scenario: Filters work correctly
    Tool: Playwright
    Steps:
      1. Select "Egg" type filter
      2. Assert callback fired with {type: 'egg'}
      3. Click "Clear" button
      4. Assert filters reset
    Evidence: .sisyphus/evidence/task-3-filters.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add filters component`
  - Files: `apps/web/components/marketplace/MarketplaceFilters.tsx`

---

- [ ] 4. Setup PocketBase marketplace_listings integration

  **What to do**:
  - Create `lib/pocketbase/marketplace.ts`
  - Functions: `getMarketplaceListings()`, `getListingById()`
  - Types: `MarketplaceListing`, `ListingStatus`
  - Integrate with existing PocketBase client
  - Add error handling
  
  **Must NOT do**:
  - No direct blockchain calls (use PocketBase as source of truth)
  - No mutations yet (read-only)
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: Tasks 5,6,7,8,12,16
  
  **References**:
  - `apps/web/lib/pocketbase/client.ts` - PocketBase client
  - `apps/web/lib/pocketbase/eggs.ts` - Pattern from Phase 10
  - PocketBase collections: `marketplace_listings`

  **Acceptance Criteria**:
  - [ ] `getMarketplaceListings()` returns listings array
  - [ ] `getListingById()` returns single listing
  - [ ] Types defined correctly
  - [ ] Error handling implemented
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Fetch marketplace listings
    Tool: Bash (curl)
    Steps:
      1. Call getMarketplaceListings()
      2. Assert returns array with listing objects
      3. Assert each has id, nft_id, price, seller
    Evidence: .sisyphus/evidence/task-4-pb-integration.json
  ```

  **Commit**:
  - Message: `feat(marketplace): add PocketBase integration`
  - Files: `apps/web/lib/pocketbase/marketplace.ts`

---

- [ ] 5. Build marketplace grid with real data

  **What to do**:
  - Integrate ListingCard into marketplace page
  - Fetch real listings from PocketBase
  - Apply filters from MarketplaceFilters
  - Responsive grid: 3 cols desktop, 2 tablet, 1 mobile
  - Empty state: "No listings available"
  - Loading skeleton
  
  **Must NOT do**:
  - No pagination yet (MVP: show all)
  - No search functionality
  
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 1,2,3,4
  - **Blocks**: Task 6
  
  **References**:
  - Task 1: Marketplace page shell
  - Task 2: ListingCard component
  - Task 3: MarketplaceFilters component
  - Task 4: PocketBase integration

  **Acceptance Criteria**:
  - [ ] Grid renders with real listing data
  - [ ] Filters apply correctly
  - [ ] Responsive layout works
  - [ ] Empty state shows when no listings
  - [ ] Loading skeleton displays

  **QA Scenarios**:
  ```
  Scenario: Grid displays listings
    Tool: Playwright
    Steps:
      1. Load /marketplace
      2. Assert listing cards visible
      3. Apply "Egg" filter
      4. Assert only Egg listings show
      5. Resize to mobile, verify 1 column
    Evidence: .sisyphus/evidence/task-5-grid.png
  ```

  **Commit**:
  - Message: `feat(marketplace): integrate grid with real data`
  - Files: `apps/web/app/marketplace/page.tsx`

---

- [ ] 6. Build product detail page

  **What to do**:
  - Create `/app/marketplace/[id]/page.tsx`
  - Large NFT image (300px+)
  - Name, rarity badge, owner info
  - Price in USDT with USD equivalent
  - "Buy Now" button (disabled if sold)
  - Commission breakdown: G1 20%, G2-G4 10% each
  - "Back to Marketplace" link
  
  **Must NOT do**:
  - No transaction execution yet
  - No seller controls (buyer view only)
  
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 4,5
  - **Blocks**: Tasks 7,8
  
  **References**:
  - Task 4: PocketBase integration
  - Task 5: Grid component
  - `resources/eggo-world-uxui-jules/src/app/marketplace/[id]/page.tsx` - Design reference

  **Acceptance Criteria**:
  - [ ] Detail page loads at `/marketplace/[id]`
  - [ ] Large NFT image displays
  - [ ] Rarity badge visible
  - [ ] Price shows correctly
  - [ ] Commission breakdown visible
  - [ ] Buy button renders

  **QA Scenarios**:
  ```
  Scenario: Detail page loads
    Tool: Playwright
    Steps:
      1. Navigate to /marketplace/123
      2. Assert NFT image visible
      3. Assert "Buy Now" button present
      4. Assert commission breakdown shows "G1: 20%"
    Evidence: .sisyphus/evidence/task-6-detail.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add product detail page`
  - Files: `apps/web/app/marketplace/[id]/page.tsx`

---

- [ ] 7. Implement USDT approval flow

  **What to do**:
  - Create `lib/contracts/usdt.ts` for USDT contract interaction
  - Function: `approveUSDT(spender, amount)`
  - Check existing approval before prompting
  - Show approval dialog with amount
  - Progress indicator: "Step 1/2: Approving USDT..."
  - Handle MetaMask rejection gracefully
  
  **Must NOT do**:
  - NO infinite approvals (exact amount only)
  - NO auto-approval on page load
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Task 6
  - **Blocks**: Task 8
  
  **References**:
  - `apps/web/lib/contracts/egg.ts` - Contract interaction pattern
  - USDT ABI (BEP-20 standard)
  - Phase 10 transaction patterns

  **Acceptance Criteria**:
  - [ ] `approveUSDT()` function works
  - [ ] Approval dialog shows correct amount
  - [ ] Progress indicator displays
  - [ ] Rejection handled gracefully
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Approve USDT for purchase
    Tool: Playwright + tmux
    Steps:
      1. Click "Buy Now" on listing
      2. Assert approval dialog shows "25 USDT"
      3. Confirm in MetaMask
      4. Assert "Step 1/2 complete"
    Evidence: .sisyphus/evidence/task-7-approval.png

  Scenario: Reject approval
    Tool: Playwright
    Steps:
      1. Click "Buy Now"
      2. Reject in MetaMask
      3. Assert error message: "Approval cancelled"
    Evidence: .sisyphus/evidence/task-7-rejection.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add USDT approval flow`
  - Files: `apps/web/lib/contracts/usdt.ts`, `apps/web/components/marketplace/ApprovalDialog.tsx`

---

- [ ] 8. Implement buy NFT transaction flow

  **What to do**:
  - Create `lib/contracts/marketplace.ts` for marketplace contract
  - Function: `buyNFT(listingId)`
  - Two-step flow: Check approval → Execute purchase
  - Transaction confirmation dialog
  - Progress: "Step 2/2: Purchasing NFT..."
  - Success: Toast + redirect to inventory
  - Error handling with retry
  
  **Must NOT do**:
  - NO purchase without approval check
  - NO optimistic UI updates
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 6,7
  - **Blocks**: FINAL verification
  
  **References**:
  - Task 7: USDT approval
  - Task 6: Product detail
  - `contracts/src/Marketplace.sol` - Contract functions
  - Phase 10 transaction patterns

  **Acceptance Criteria**:
  - [ ] `buyNFT()` function works
  - [ ] Approval check before purchase
  - [ ] Progress indicators show correctly
  - [ ] Success toast displays
  - [ ] Redirects to appropriate inventory
  - [ ] Error handling works

  **QA Scenarios**:
  ```
  Scenario: Complete NFT purchase
    Tool: Playwright + tmux
    Steps:
      1. Click "Buy Now" (already approved)
      2. Confirm purchase
      3. Assert "Step 2/2: Purchasing..."
      4. Wait for confirmation
      5. Assert success toast
      6. Assert redirect to inventory
    Evidence: .sisyphus/evidence/task-8-purchase.png

  Scenario: Purchase fails (already sold)
    Tool: Playwright
    Steps:
      1. Try to buy NFT that was just sold
      2. Assert error: "NFT no longer available"
    Evidence: .sisyphus/evidence/task-8-sold-error.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add buy NFT transaction flow`
  - Files: `apps/web/lib/contracts/marketplace.ts`, `apps/web/components/marketplace/BuyFlow.tsx`

---

- [ ] 9. Add "Sell" button to Eggs inventory

  **What to do**:
  - Add "Sell" button to EggCard component
  - Button only shows for owned eggs
  - Click opens sell dialog
  - Input field for asking price
  - Validate minimum price (1 USDT)
  
  **Must NOT do**:
  - NO actual listing creation yet
  - NO auto-fill of price
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: Task 12
  
  **References**:
  - `apps/web/components/eggs/EggCard.tsx` - Existing EggCard
  - `apps/web/app/eggs/page.tsx` - Eggs inventory page

  **Acceptance Criteria**:
  - [ ] "Sell" button appears on owned eggs
  - [ ] Dialog opens with price input
  - [ ] Minimum price validation (1 USDT)
  - [ ] Button hidden for non-owned eggs

  **QA Scenarios**:
  ```
  Scenario: Sell button on egg card
    Tool: Playwright
    Steps:
      1. Navigate to /eggs
      2. Assert "Sell" button on owned egg
      3. Click "Sell"
      4. Assert price input dialog
    Evidence: .sisyphus/evidence/task-9-sell-egg.png
  ```

  **Commit**:
  - Message: `feat(eggs): add sell button to egg cards`
  - Files: `apps/web/components/eggs/EggCard.tsx`

---

- [ ] 10. Add "Sell" button to Food inventory

  **What to do**:
  - Add "Sell" button to Food inventory page
  - Similar to Task 9
  - Minimum price: 0.50 USDT
  
  **Must NOT do**:
  - NO actual listing creation yet
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: Task 12
  
  **References**:
  - Task 9 pattern
  - `apps/web/app/food/page.tsx` - Food inventory

  **Acceptance Criteria**:
  - [ ] "Sell" button appears on Food page
  - [ ] Dialog with price input
  - [ ] Minimum price: 0.50 USDT

  **QA Scenarios**:
  ```
  Scenario: Sell button on food
    Tool: Playwright
    Steps:
      1. Navigate to /food
      2. Click "Sell" on food item
      3. Assert price input with min 0.50
    Evidence: .sisyphus/evidence/task-10-sell-food.png
  ```

  **Commit**:
  - Message: `feat(food): add sell button to food inventory`
  - Files: `apps/web/app/food/page.tsx`

---

- [ ] 11. Add "Sell" button to Animals inventory

  **What to do**:
  - Add "Sell" button to Animals page
  - Similar to Tasks 9,10
  - Minimum price: 5 USDT (from spec)
  
  **Must NOT do**:
  - NO actual listing creation yet
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: Task 12
  
  **References**:
  - Tasks 9,10 patterns
  - `apps/web/app/animals/page.tsx` - Animals inventory

  **Acceptance Criteria**:
  - [ ] "Sell" button appears on Animals page
  - [ ] Dialog with price input
  - [ ] Minimum price: 5 USDT

  **QA Scenarios**:
  ```
  Scenario: Sell button on animals
    Tool: Playwright
    Steps:
      1. Navigate to /animals
      2. Click "Sell" on animal
      3. Assert price input with min 5
    Evidence: .sisyphus/evidence/task-11-sell-animal.png
  ```

  **Commit**:
  - Message: `feat(animals): add sell button to animals`
  - Files: `apps/web/app/animals/page.tsx`

---

- [ ] 12. Implement create listing flow

  **What to do**:
  - Create `lib/contracts/marketplace.ts` function: `createListing(nftId, price)`
  - Two-step: Approve NFT transfer → Create listing
  - Confirmation dialog with commission preview
  - Show "You'll receive: X USDT after 50% commission"
  - Success: Listing appears in marketplace
  - Error handling
  
  **Must NOT do**:
  - NO manual NFT selection (auto from inventory context)
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 3)
  - **Blocked By**: Tasks 4,9,10,11
  - **Blocks**: FINAL verification
  
  **References**:
  - Tasks 9,10,11: Sell buttons
  - Task 4: PocketBase integration
  - `contracts/src/Marketplace.sol` - `listNFTForSale()`

  **Acceptance Criteria**:
  - [ ] `createListing()` function works
  - [ ] NFT approval step
  - [ ] Commission preview shows
  - [ ] Listing appears in marketplace after success
  - [ ] Error handling works

  **QA Scenarios**:
  ```
  Scenario: Create listing
    Tool: Playwright + tmux
    Steps:
      1. Click "Sell" on owned egg
      2. Enter price: 25 USDT
      3. Assert "You'll receive: 12.50 USDT"
      4. Confirm
      5. Assert listing appears in marketplace
    Evidence: .sisyphus/evidence/task-12-create-listing.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add create listing flow`
  - Files: `apps/web/components/marketplace/CreateListingDialog.tsx`

---

- [ ] 13. Implement cancel listing flow

  **What to do**:
  - Add "Cancel Listing" button to user's own listings
  - Function: `cancelListing(listingId)`
  - Confirmation dialog
  - NFT returns to owner's wallet
  - Listing marked as cancelled in PocketBase
  
  **Must NOT do**:
  - NO cancel for non-owned listings
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 4)
  - **Blocked By**: Task 12
  - **Blocks**: FINAL verification
  
  **References**:
  - Task 12: Create listing
  - `contracts/src/Marketplace.sol` - `cancelListing()`

  **Acceptance Criteria**:
  - [ ] Cancel button on owned listings
  - [ ] Confirmation dialog
  - [ ] NFT returns to wallet
  - [ ] Listing marked cancelled

  **QA Scenarios**:
  ```
  Scenario: Cancel listing
    Tool: Playwright
    Steps:
      1. View own listing
      2. Click "Cancel Listing"
      3. Confirm
      4. Assert listing marked "Cancelled"
    Evidence: .sisyphus/evidence/task-13-cancel.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add cancel listing flow`
  - Files: `apps/web/components/marketplace/CancelListingDialog.tsx`

---

- [ ] 14. Implement update price flow

  **What to do**:
  - Add "Edit Price" button to user's own listings
  - Function: `updateListingPrice(listingId, newPrice)`
  - Validation: newPrice >= minimum
  - Update in PocketBase after blockchain confirmation
  
  **Must NOT do**:
  - NO price update for sold/cancelled listings
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 4)
  - **Blocked By**: Task 12
  - **Blocks**: FINAL verification
  
  **References**:
  - Task 12: Create listing
  - `contracts/src/Marketplace.sol` - `updateListingPrice()`

  **Acceptance Criteria**:
  - [ ] Edit price button on owned listings
  - [ ] Price input with validation
  - [ ] Price updates in marketplace

  **QA Scenarios**:
  ```
  Scenario: Update listing price
    Tool: Playwright
    Steps:
      1. View own listing at 25 USDT
      2. Click "Edit Price"
      3. Enter 30 USDT
      4. Assert price updated in marketplace
    Evidence: .sisyphus/evidence/task-14-update-price.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add update price flow`
  - Files: `apps/web/components/marketplace/UpdatePriceDialog.tsx`

---

- [ ] 15. Build commission breakdown component

  **What to do**:
  - Create `components/marketplace/CommissionBreakdown.tsx`
  - Props: salePrice
  - Shows: G1 20%, G2 10%, G3 10%, G4 10%, Platform 50%
  - Visual: Pie chart or bar chart
  - "Why 50%?" tooltip explaining referral rewards
  - Shows exact USDT amounts
  
  **Must NOT do**:
  - NO dynamic commission rates (fixed 50%)
  
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 4)
  - **Blocked By**: Tasks 6,8
  - **Blocks**: FINAL verification
  
  **References**:
  - Task 6: Product detail
  - Task 8: Buy flow
  - `docs/NFT_Marketplace_Functional_Spec.md` - Commission structure

  **Acceptance Criteria**:
  - [ ] Component shows G1-G4 breakdown
  - [ ] Shows exact USDT amounts
  - [ ] Tooltip explains 50% commission
  - [ ] Visual representation (chart)

  **QA Scenarios**:
  ```
  Scenario: Commission breakdown displays
    Tool: Playwright
    Steps:
      1. View listing at 100 USDT
      2. Assert "G1: 20 USDT (20%)"
      3. Assert "G2-G4: 10 USDT each"
      4. Hover "Why 50%?" tooltip
    Evidence: .sisyphus/evidence/task-15-commission.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add commission breakdown component`
  - Files: `apps/web/components/marketplace/CommissionBreakdown.tsx`

---

- [ ] 16. Implement real-time status sync

  **What to do**:
  - Create hook: `useMarketplaceSync()`
  - Poll PocketBase every 30 seconds for listing status changes
  - Listen for on-chain events (sold, cancelled)
  - Update UI when listing status changes
  - Show "Updating..." indicator
  - Exponential backoff on errors
  
  **Must NOT do**:
  - NO WebSocket (polling only for MVP)
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 4)
  - **Blocked By**: Tasks 4,8
  - **Blocks**: FINAL verification
  
  **References**:
  - Task 4: PocketBase integration
  - Task 8: Buy flow
  - `apps/web/hooks/use-wallet-poll.ts` - Polling pattern

  **Acceptance Criteria**:
  - [ ] Hook polls every 30 seconds
  - [ ] Status updates reflect in UI
  - [ ] "Updating..." indicator shows
  - [ ] Exponential backoff on errors

  **QA Scenarios**:
  ```
  Scenario: Status sync works
    Tool: Playwright
    Steps:
      1. Buy NFT from marketplace
      2. Wait for sync (max 30s)
      3. Assert listing shows "SOLD"
      4. Assert "Buy" button disabled
    Evidence: .sisyphus/evidence/task-16-sync.png
  ```

  **Commit**:
  - Message: `feat(marketplace): add real-time status sync`
  - Files: `apps/web/hooks/use-marketplace-sync.ts`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read plan end-to-end. Verify all 16 tasks complete. Check "Must Have" present, "Must NOT Have" absent. Check evidence files exist.
  Output: `Tasks [16/16] | Must Have [6/6] | Must NOT Have [0/0] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review for AI slop, excessive comments, generic names.
  Output: `Build [PASS/FAIL] | Tests [N/N] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Execute all QA scenarios from tasks. Test buy flow, sell flow, cancel, update price. Cross-task integration.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify 1:1 with spec. No auctions, no offers, no bundles. Commission exactly 50%.
  Output: `Spec Compliance [YES/NO] | VERDICT`

---

## Commit Strategy

- Wave 1 commits: Tasks 1-4
- Wave 2 commits: Tasks 5-8
- Wave 3 commits: Tasks 9-12
- Wave 4 commits: Tasks 13-16
- Final verification commits: F1-F4

---

## Success Criteria

### Verification Commands
```bash
cd apps/web && bun test              # All tests pass
cd apps/web && bun run build         # Zero errors
curl http://localhost:3000/marketplace  # Page loads
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] 16 tasks complete
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Commission shows 50% breakdown
- [ ] Buy flow works end-to-end
- [ ] Sell flow works end-to-end
- [ ] Status sync working

---

_Plan: Phase 11 Marketplace_
_Generated: 2026-04-06_

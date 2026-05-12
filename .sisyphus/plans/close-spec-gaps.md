# Plan: Close NFT Marketplace Spec Gaps

**Branch:** `feat/withdraw-timeout-and-tests`
**Based on:** Gap analysis of `docs/NFT_Marketplace_Functional_Spec.md` vs codebase
**Date:** 2026-05-12

## Gaps to Close

| #   | Gap                         | Severity | What Exists                            | What's Missing     |
| --- | --------------------------- | -------- | -------------------------------------- | ------------------ |
| G1  | `updateListingPrice`        | Medium   | `Marketplace.sol:updateListingPrice()` | PB hook + frontend |
| G2  | `upgradeEggRarity` frontend | Low      | Contract + hook `17` + wallet-api      | Frontend page      |
| G3  | `breedAnimals` frontend     | Low      | Contract + hook `18` + wallet-api      | Frontend page      |

---

## Phase 1: updateListingPrice (Hook + Frontend)

### Step 1.1: Create PB Hook `37-update-listing-price.pb.js`

**File:** `apps/backend/pb_hooks/37-update-listing-price.pb.js`
**Endpoint:** `POST /api/v2/update-listing-price`

**Pattern to follow:** `22-cancel-listing.pb.js` (same auth + ownership check + marketplace_listings table)

**Flow:**

1. Authenticate user via `e.requestInfo().auth`
2. Parse `listing_id` and `new_price` from body
3. Validate `new_price > 0`
4. Look up listing in `marketplace_listings` collection
5. Verify listing belongs to user (`seller` field)
6. Verify listing status is `active`
7. Call wallet-api: `POST /api/v1/marketplace/update-price` with `{nftContract, tokenId, newPrice}`
8. Update `marketplace_listings` record: set `price` field
9. Return success with `listing_id`, `old_price`, `new_price`

### Step 1.2: Add wallet-api endpoint

**File:** `wallet-api/server.js`
**Endpoint:** `POST /api/v1/marketplace/update-price`

**Flow:**

1. Validate body: `nftContract`, `tokenId`, `newPrice`
2. Call `Marketplace.updateListingPrice(nftContract, tokenId, newPrice)`
3. Return `{tx_hash, old_price, new_price}`

### Step 1.3: Add frontend Edit Price UI

**Files to modify:**

- `apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx` — add "Edit Price" button for seller
- New component: `apps/web/components/marketplace/edit-price-dialog.tsx` — modal with price input
- `apps/web/app/marketplace/detail/ResaleDetailClient.tsx` — add "Edit Price" button for seller

**UI flow:**

1. Seller clicks "Edit Price" on their listed item
2. Modal opens with current price pre-filled
3. Seller enters new price, clicks "Update"
4. Calls `POST /api/v2/update-listing-price`
5. On success: close modal, refresh listing to show new price
6. On error: show error toast

---

## Phase 2: upgradeEggRarity Frontend

**Existing backend:** Hook `17-upgrade-egg-rarity.pb.js` + wallet-api `/api/wallet/upgrade-egg-rarity`

### Step 2.1: Create upgrade page

**File:** `apps/web/app/eggs/[id]/upgrade/page.tsx`
**File:** `apps/web/app/eggs/[id]/upgrade/UpgradeEggClient.tsx`

**Pattern to follow:** `apps/web/app/eggs/[id]/feed/` (same egg detail + food selection pattern)

**UI flow:**

1. Load egg details (token_id, food_count, rarity_upgrade_count, is_hatched)
2. Show egg card with current stats
3. Load user's unconsumed Food NFTs
4. Allow selecting food items to burn (checkboxes, max 10 to reach cap of 20)
5. Show upgrade fee: 5 USDT × selected food count
6. "Upgrade" button calls `POST /api/v2/upgrade-egg-rarity` with `{egg_token_id, food_ids}`
7. On success: show new food_count, rarity_bonus, tx_hash
8. Error handling: insufficient balance, egg already hatched, etc.

### Step 2.2: Add link from egg detail

**File to modify:** `apps/web/app/eggs/[id]/feed/FeedEggClient.tsx` or egg detail — add "Upgrade Rarity" navigation button visible when `food_count >= 10 && !is_hatched`

---

## Phase 3: breedAnimals Frontend

**Existing backend:** Hook `18-breed-animals.pb.js` + wallet-api `/api/wallet/breed-animals`

### Step 3.1: Create breed page

**File:** `apps/web/app/animals/breed/page.tsx`
**File:** `apps/web/app/animals/breed/BreedAnimalsClient.tsx`

**Pattern to follow:** Animal selection UI similar to marketplace listing but for selecting 2 owned animals

**UI flow:**

1. Load user's Animal NFTs (only unhatched, not on cooldown)
2. Show two selection slots (Parent 1, Parent 2)
3. For each slot: dropdown/selector with animal cards showing rarity, species, generation
4. Show breeding info: fee (5 USDT), cooldown (48h), child generation = `max(parent1, parent2) + 1`
5. "Breed" button calls `POST /api/v2/breed-animals` with `{parent1_animal_id, parent2_animal_id}`
6. On success: show breeding egg created (token_id, generation, parents)
7. Error handling: same animal selected twice, insufficient balance, animal on cooldown

### Step 3.2: Add link from animals page

**File to modify:** `apps/web/app/animals/page.tsx` — add "Breed Animals" button/CTA

---

## Phase 4: Verification

### Step 4.1: Type check + lint

```bash
cd apps/web && bunx tsc --noEmit
```

### Step 4.2: Run existing tests

```bash
cd apps/web && bun test
```

### Step 4.3: LSP diagnostics on all changed files

---

## Dependencies

- Phase 1: None (standalone)
- Phase 2: None (standalone, backend exists)
- Phase 3: None (standalone, backend exists)
- All phases can run in parallel

## Files Changed

| File                                                        | Phase | Action                |
| ----------------------------------------------------------- | ----- | --------------------- |
| `apps/backend/pb_hooks/37-update-listing-price.pb.js`       | 1     | CREATE                |
| `wallet-api/server.js`                                      | 1     | MODIFY (add endpoint) |
| `apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx` | 1     | MODIFY                |
| `apps/web/app/marketplace/detail/ResaleDetailClient.tsx`    | 1     | MODIFY                |
| `apps/web/components/marketplace/edit-price-dialog.tsx`     | 1     | CREATE                |
| `apps/web/app/eggs/[id]/upgrade/page.tsx`                   | 2     | CREATE                |
| `apps/web/app/eggs/[id]/upgrade/UpgradeEggClient.tsx`       | 2     | CREATE                |
| `apps/web/app/eggs/[id]/feed/FeedEggClient.tsx`             | 2     | MODIFY (add link)     |
| `apps/web/app/animals/breed/page.tsx`                       | 3     | CREATE                |
| `apps/web/app/animals/breed/BreedAnimalsClient.tsx`         | 3     | CREATE                |
| `apps/web/app/animals/page.tsx`                             | 3     | MODIFY (add CTA)      |

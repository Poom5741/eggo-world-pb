---
status: testing
phase: 10-egg-management
source:
  - 10-01-SUMMARY.md
  - 10-02-SUMMARY.md
  - 10-03-SUMMARY.md
  - 10-04-SUMMARY.md
started: "2026-04-05T14:15:00Z"
  updated: "2026-04-05T14:50:00Z"
---

## Current Test

**PARTIALLY FIXED:** Frontend wallet field bug fixed. Backend collections need manual creation via Admin UI.

**Completed:**

- ✅ Fixed `user.wallet` field reference (was `user.wallet_address`)
- ✅ Created collection JSON schemas in `apps/backend/collections/`
- ✅ PocketBase running on server

**Remaining:**

- ⏳ Create 5 collections via PocketBase Admin UI: `egg_nfts`, `commission_records`, `transactions`, `animal_nfts`, `food_nfts`

**Manual Steps Required:**

1. Open https://pb.eggoworld.io/_/
2. Login: `admin@eggo.local` / `admin123`
3. For each collection: Settings → Import Collection → Upload JSON from `apps/backend/collections/{name}.json`
4. Save each collection

**Collection Files Ready:**

- `apps/backend/collections/egg_nfts.json`
- `apps/backend/collections/commission_records.json`
- `apps/backend/collections/transactions.json` (created today)
- `apps/backend/collections/animal_nfts.json`
- `apps/backend/collections/food_nfts.json`

---

**Blocker:** PocketBase collections (`egg_nfts`, `commission_records`, `transactions`, `users` record access) returning 404 on `pb.eggoworld.io`. Frontend code is correct — backend collections need to be migrated/deployed.

## Tests

### 1. Egg NFT Page Display

expected: Navigate to /eggs page while authenticated. Page displays featured egg hero at top, grid of egg cards below (3 cols desktop), each showing egg image, name (#ID), rarity badge, element type, feeding progress (X/10). "Updating..." badge pulses during polling. Loading skeleton on initial fetch.
result: blocked
blocked_by: backend
reason: "PocketBase collections (egg_nfts, commission_records, transactions) returning 404 on pb.eggoworld.io. Frontend code correct — backend collections need migration/deployment."

### 2. Feed Flow - Quick Fill

expected: Click "FEED ME" button on an egg card with <10 food. Dialog opens showing "Quick Fill: Auto-select 10 food items". Click "Confirm" button. Transaction toast appears. After confirmation, egg card shows updated food count (e.g., "4/10" → "14/10" or caps at 10).
result: [pending]

### 3. Feed Flow - Validation

expected: Try to feed an egg that already has 10 food items. "FEED ME" button should be disabled or show different state (egg is ready to hatch, not feed).
result: [pending]

### 4. Hatch Flow - Button Visibility

expected: Egg card with exactly 10 food items shows "HATCH!" button (replaces or appears alongside "FEED ME"). Featured egg hero shows "HATCH NOW!" button when food_count >= 10.
result: [pending]

### 5. Hatch Flow - Animation

expected: Click "HATCH!" button → confirmation modal appears. Click "HATCH NOW" → animation plays (10-15 seconds): egg glows → cracks → shakes violently → bursts with light → Animal emerges → rarity badge displays (Common=gray, Rare=blue, Epic=purple, Legendary=yellow).
result: [pending]

### 6. Hatch Flow - Result Display

expected: After hatch animation completes, modal shows the newly hatched Animal NFT with: animal name, element type, rarity badge with correct color coding.
result: [pending]

### 7. Polling - "Updating..." Badge

expected: Keep /eggs page open for 30+ seconds. "Updating..." badge with pulse animation appears on egg cards. Badge shows spinning sync icon during polling updates.
result: [pending]

### 8. Error Boundary - Retry

expected: Simulate network error (or wait for backend to be unavailable). Error boundary appears with friendly message and "Retry" button. Clicking "Retry" attempts to reload eggs.
result: [pending]

### 9. Empty State - No Eggs

expected: User with no egg NFTs sees empty state: friendly illustration/message "No eggs yet" with "Get your first egg" CTA button linking to marketplace/mint page.
result: [pending]

### 10. Wallet Check - No Wallet Connected

expected: Disconnect wallet (or use account without wallet). Page should show "Connect Wallet" prompt or redirect to dashboard with message about wallet requirement.
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 1

## Gaps

[none — backend collections need manual creation via Admin UI]

## Blockers

- **Backend collections need manual creation:** PocketBase Admin UI import required for 5 collections
  - `egg_nfts` - Egg NFT ownership and feeding progress
  - `commission_records` - Referral commission tracking
  - `transactions` - Transaction history
  - `animal_nfts` - Hatched animal NFTs
  - `food_nfts` - Food item NFTs

  **How to fix:**
  1. SSH to server: `ssh -i ~/.ssh/poom-server root@204.168.144.14`
  2. Collection JSONs are at: `/root/eggo-world-pb/apps/backend/collections/`
  3. Or access Admin UI: https://pb.eggoworld.io/_/ (login: admin@eggo.local / admin123)
  4. Import each collection via Settings → Import Collection

  **Frontend code is correct** — verified wallet field fix in commits ba62723, f54e405

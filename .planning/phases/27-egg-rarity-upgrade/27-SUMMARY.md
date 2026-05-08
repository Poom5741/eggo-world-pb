---
phase: 27-egg-rarity-upgrade
status: completed
completed: 2026-04-23
plans_completed: 3/3
---

# Phase 27 Summary — Egg Rarity Upgrade System

## Overview

Implemented egg rarity upgrade system allowing users to feed additional food NFTs (up to 500 total) to improve hatch rarity probability with tier guaranteed minimums.

## Changes Made

### Plan 27-01: Smart Contract Update (`contracts/src/EggNFT.sol`)

| Change                         | Before                           | After                                          |
| ------------------------------ | -------------------------------- | ---------------------------------------------- |
| `UPGRADE_FEE`                  | `5 * 10^18` (5 USDT)             | `0` (no fee)                                   |
| `MAX_UPGRADE_FOOD`             | `10`                             | `490`                                          |
| `upgradeEggRarity()` max check | `"Max 20 food items"`            | `"Max 500 food items (10 base + 490 upgrade)"` |
| Fee transfer logic             | Transferred UPGRADE_FEE per item | Removed (no fee)                               |

**Tier Guaranteed Minimums (`_calculateRarity()`):**

- ≥ 500 extra food: **LEGENDARY guaranteed** (100%)
- ≥ 200 extra food: **EPIC minimum** (cannot roll Common/Rare)
- ≥ 50 extra food: **RARE minimum** (cannot roll Common)

### Plan 27-02: Frontend UI Components

**New File:** `apps/web/components/eggs/rarity-upgrade-dialog.tsx`

- Food selection grid (490 max items, pattern from FeedDialog)
- Probability bars (Common/Rare/Epic/Legendary with dynamic updates)
- Guaranteed tier badge display
- Confirmation flow with 12-block wait

**Modified:** `apps/web/components/egg-nft/EggCard.tsx`

- Added `showUpgradeButton` prop
- Added "UPGRADE" button (shows when food_count >= 10 AND not hatched)
- Integrated RarityUpgradeDialog component

### Plan 27-03: Backend Hook + Wallet API

**New File:** `apps/backend/pb_hooks/27-upgrade-egg-rarity.pb.js`

- POST `/api/v2/upgrade-egg-rarity` endpoint
- Validates: egg ownership, food_count >= 10, max 490 items
- Calls wallet-api for blockchain transaction (user pays gas)

**Modified:** `wallet-api/server.js`

- Added POST `/api/wallet/upgrade-egg-rarity` endpoint
- Uses EGG_NFT_ABI (already existed at line 10)
- User wallet authentication via PocketBase admin credentials

## Files Modified/Created

| File                                                 | Action   | Lines Changed                                       |
| ---------------------------------------------------- | -------- | --------------------------------------------------- |
| `contracts/src/EggNFT.sol`                           | Modified | 3 changes (constants, max check, tier logic)        |
| `apps/web/components/eggs/rarity-upgrade-dialog.tsx` | Created  | ~280 lines                                          |
| `apps/web/components/egg-nft/EggCard.tsx`            | Modified | Added Star import, upgrade button, dialog component |
| `wallet-api/server.js`                               | Modified | +145 lines (new endpoint)                           |
| `apps/backend/pb_hooks/27-upgrade-egg-rarity.pb.js`  | Created  | ~90 lines                                           |

## Acceptance Criteria Met

- [x] Contract supports 500 max food items (D-01)
- [x] Hybrid rarity mechanics with tier guarantees (D-02)
- [x] No upgrade fee — only burns food NFTs (D-03)
- [x] Single upgrade session, max 490 items (D-04)
- [x] Egg card action menu integration (D-05)
- [x] Button shows only on ready eggs (food_count >= 10) (D-06)
- [x] Manual grid selection pattern (D-07)
- [x] Probability bars per tier with dynamic updates (D-08)

---

_Generated from Phase 27 CONTEXT.md decisions D-01 through D-12_

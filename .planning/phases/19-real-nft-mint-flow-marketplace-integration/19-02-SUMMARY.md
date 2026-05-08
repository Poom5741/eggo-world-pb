---
phase: 19-real-nft-mint-flow-marketplace-integration
plan: "02"
subsystem: frontend
tags: [mint-page, navigation, wallet-api-integration, claymorphism]
dependency:
  requires: [19-01-mint-endpoint]
  provides: [mint-page-ui, mint-navigation]
  affects: [apps/web/app/mint/page.tsx, apps/web/components/SideNav.tsx]
tech-stack:
  added: []
  patterns: [client-component, auth-guard, balance-fetch, wallet-api-call, confirmation-polling]
key-files:
  created:
    - apps/web/app/mint/page.tsx
  modified:
    - apps/web/components/SideNav.tsx
    - apps/web/app/settings/page.tsx (lint fix)
    - apps/web/app/support/page.tsx (lint fix)
    - apps/web/components/marketplace/BuyFlow.tsx (lint fix)
    - apps/web/components/marketplace/ListingCard.tsx (lint fix)
    - apps/web/lib/contracts/marketplace.test.ts (lint fix)
decisions:
  - "Replaced Animals with Mint in mobile nav to maintain 4-item limit"
  - "Used wallet-api /mint-egg endpoint instead of direct PocketBase call"
  - "Implemented 12-block confirmation polling with 5-second intervals"
  - "Disabled mint button when balance < 25 USDT for better UX"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-21T08:38:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 19 Plan 02: Dedicated Mint Egg Page & Navigation Integration Summary

**One-liner:** Created dedicated /mint page with balance check, wallet-api integration, 12-block confirmation polling, and navigation updates for desktop and mobile.

## Tasks Completed

| #   | Task                                               | Commit  | Files Modified                                       |
| --- | -------------------------------------------------- | ------- | ---------------------------------------------------- |
| 1   | Create dedicated Mint Egg page at /mint            | c6e8fdd | apps/web/app/mint/page.tsx (+ lint fixes in 5 files) |
| 2   | Add Mint to navigation (SideNav + BottomNavMobile) | db02a41 | apps/web/components/SideNav.tsx                      |

## Implementation Details

### Task 1: Mint Page Creation (c6e8fdd)

**File created:** `apps/web/app/mint/page.tsx` (332 lines)

**Features implemented:**

- Authentication guard with redirect to `/auth/login` if not authenticated
- USDT balance fetch from PocketBase `user_wallets` collection
- Prominent display of mint price (25 USDT)
- Balance card showing sufficient/insufficient status with color coding
- Optional referrer ID input field with validation (PocketBase user ID pattern)
- Mint button calling wallet-api `/mint-egg` endpoint
- Transaction progress states: "Preparing..." → "Waiting for confirmation (0/12 blocks)..." → "Confirmed!"
- 12-block confirmation polling every 5 seconds (max 24 attempts = 2 minutes)
- Success display with txHash and BSCScan link (`https://rpc.0xl3.com/tx/${txHash}`)
- Auto-redirect to `/eggs?highlight=${tokenId}` after 3 seconds on success
- Error handling with clear error messages and retry option
- Mint button disabled when balance < 25 USDT
- Claymorphism design system throughout (clay-card, clay-button variants)
- LayoutWithoutNav wrapper for consistency

**State management:**

- `loading`: Button loading state
- `error`: Error message display
- `txHash`: Transaction hash after submission
- `balance`: User's USDT balance
- `referrerId`: Optional referrer user ID
- `confirmationProgress`: Transaction progress state machine ('idle' | 'preparing' | 'waiting' | 'confirmed' | 'error')
- `tokenId`: Minted token ID for highlight redirect

**Security compliance (threat model):**

- T-19-06 (Spoofing): Auth check redirects unauthenticated users to `/auth/login`
- T-19-07 (Tampering): Referrer ID validated against PocketBase user ID pattern (`/^[a-z0-9]+$/`)
- T-19-08 (Information Disclosure): Balance is user's own data, no exposure to other users

**Deviation - Lint fixes:**
Fixed 7 pre-existing lint errors blocking commit (Rule 1 - Auto-fix bugs):

- Removed unused `useState` import from `app/settings/page.tsx`
- Removed unused `useState` import from `app/support/page.tsx`
- Prefixed unused `handleClose` with underscore in `components/marketplace/BuyFlow.tsx`
- Prefixed unused `id` prop with underscore in `components/marketplace/ListingCard.tsx`
- Removed unused imports (`beforeEach`, `afterEach`, `mock`) from `lib/contracts/marketplace.test.ts`

### Task 2: Navigation Integration (db02a41)

**File modified:** `apps/web/components/SideNav.tsx`

**Desktop SideNav changes:**

- Added Mint item to `NAV_ITEMS` array with `add_circle` icon
- Inserted after Eggs, before Animals for logical flow: Dashboard → Eggs → Mint → Animals → Marketplace → Referrals
- Total items: 6 (was 5)

**Mobile BottomNavMobile changes:**

- Added Mint item to `MOBILE_NAV_ITEMS` array with `add_circle` icon
- Replaced Animals with Mint to maintain 4-item limit
- Mobile nav order: Dashboard → Eggs → Mint → Marketplace
- Animals accessible from Eggs page (existing functionality)

## Verification

### Automated Checks

- ✅ Task 1: `test -f apps/web/app/mint/page.tsx` → PASS
- ✅ Task 2: SideNav contains `'/mint'` and `add_circle` → PASS
- ✅ Lint: No errors in codebase (7 pre-existing errors fixed)

### Manual Verification Required

1. Navigate to `/mint` page (desktop and mobile breakpoints)
2. Verify auth redirect: Unauthenticated users redirected to `/auth/login`
3. Verify balance displays correctly (test with user having >25 and <25 USDT)
4. Verify mint button disabled when balance < 25 USDT
5. Enter optional referrer ID, click mint button
6. Verify wallet-api `/mint-egg` endpoint called with correct parameters
7. Verify transaction progress shows 12-block confirmation states
8. After success, verify txHash displayed with BSCScan link
9. Verify redirect to `/eggs?highlight=${tokenId}` after 3 seconds
10. Test error handling: insufficient balance, invalid referrer ID, wallet-api failure
11. Verify navigation renders correctly on desktop (6 items) and mobile (4 items)

## Key Decisions

1. **Wallet-api integration over direct PocketBase**: Plan specified calling wallet-api `/mint-egg` endpoint (not PocketBase `/api/v2/mint-egg`) for server-side signing consistency with Phase 12 architecture.

2. **Confirmation polling pattern**: Implemented 5-second polling interval with max 24 attempts (2 minutes) to cover 12-block confirmation wait on BSC (~36s) with safety buffer.

3. **Mobile nav item replacement**: Replaced Animals with Mint in mobile nav (4 items max) since Animals accessible from Eggs page, maintaining logical priority: Dashboard → Eggs → Mint → Marketplace.

4. **Balance-based button disable**: Disabled mint button when balance < 25 USDT instead of allowing click and showing error, providing better UX feedback.

5. **Referrer ID validation**: Client-side validation of referrer ID format (`/^[a-z0-9]+$/`) before sending to wallet-api to prevent invalid requests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 7 pre-existing lint errors blocking commit**

- **Found during:** Task 1 commit
- **Issue:** Pre-existing lint errors in 5 files prevented pre-commit hook from passing
- **Fix:** Removed unused imports, prefixed unused variables with underscore
- **Files modified:**
  - `apps/web/app/settings/page.tsx` (removed unused useState)
  - `apps/web/app/support/page.tsx` (removed unused useState)
  - `apps/web/components/marketplace/BuyFlow.tsx` (prefixed unused handleClose)
  - `apps/web/components/marketplace/ListingCard.tsx` (prefixed unused id)
  - `apps/web/lib/contracts/marketplace.test.ts` (removed unused imports)
- **Commit:** c6e8fdd

## Known Stubs

None identified in modified code. All functionality is fully wired:

- Balance fetched from real PocketBase `user_wallets` collection
- Mint calls real wallet-api `/mint-egg` endpoint
- Transaction confirmation polling implemented (depends on wallet-api `/tx-status/:hash` endpoint availability)
- Redirect to `/eggs` with highlight parameter

## Threat Flags

| Flag                            | File                       | Description                                                                                                     |
| ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| threat_flag:auth_check          | apps/web/app/mint/page.tsx | Auth guard redirects unauthenticated users (T-19-06 mitigation)                                                 |
| threat_flag:referrer_validation | apps/web/app/mint/page.tsx | Referrer ID format validation before wallet-api call (T-19-07 mitigation)                                       |
| threat_flag:wallet_api_call     | apps/web/app/mint/page.tsx | Client calls wallet-api with user ID and wallet address (T-19-06: auth token not sent, wallet-api handles auth) |

## Self-Check

- ✅ apps/web/app/mint/page.tsx exists (332 lines)
- ✅ apps/web/components/SideNav.tsx exists with Mint nav items
- ✅ Commit c6e8fdd exists: Mint page + lint fixes
- ✅ Commit db02a41 exists: Navigation updates
- ✅ No file deletions in commits
- ✅ No untracked files from task execution
- ✅ Lint passes with 0 errors (185 warnings - pre-existing)

## Self-Check: PASSED

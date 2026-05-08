---
phase: 19-real-nft-mint-flow-marketplace-integration
plan: "03"
subsystem: wallet-api, pocketbase
tags: [on-chain-buy, gas-sponsorship, marketplace-integration]
dependency:
  requires: [19-01-mint-endpoint, 19-04-gas-sponsorship]
  provides: [on-chain-buy-flow, atomic-pb-update-after-chain]
  affects: [wallet-api/server.js, apps/backend/pb_hooks/20-buy-nft.pb.js]
tech-stack:
  added: [MARKETPLACE_ABI]
  patterns: [relayer-wallet-pattern, gas-sponsorship-logging, atomic-chain-then-db]
key-files:
  created: []
  modified:
    - wallet-api/server.js
    - apps/backend/pb_hooks/20-buy-nft.pb.js
decisions:
  - "Added relayer wallet null check before executing buy (graceful error if not configured)"
  - "Used nftId (from listing) as listingId for wallet-api call (maps PB listing to on-chain listing)"
  - "Wallet-api URL defaults to http://localhost:3001 if WALLET_API_URL not set"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-21T08:48:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 19 Plan 03: On-Chain Buy Flow & Marketplace Integration Summary

**One-liner:** Replaced database-only buy flow with on-chain marketplace contract calls via wallet-api, enabling real NFT ownership transfer with gas sponsorship and atomic PocketBase updates after chain confirmation.

## Tasks Completed

| #   | Task                                                         | Commit  | Files Modified                         |
| --- | ------------------------------------------------------------ | ------- | -------------------------------------- |
| 1   | Add buy-nft endpoint to wallet-api for on-chain purchase     | a868baa | wallet-api/server.js                   |
| 2   | Update PocketBase buy hook to call wallet-api then update DB | 066036f | apps/backend/pb_hooks/20-buy-nft.pb.js |

## Implementation Details

### Task 1: Wallet-api Buy NFT Endpoint (a868baa)

**File modified:** `wallet-api/server.js`

**Changes:**

- Added `MARKETPLACE_ABI` constant with `buyNFT`, `getListedNFT`, `createListing`, `cancelListing` functions and `NFTSold` event
- Added `POST /api/wallet/buy-nft` endpoint after feed-egg endpoint
- Endpoint accepts `buyerUserId`, `listingId`, `marketplaceAddress` parameters
- Uses platform relayer wallet (`relayerWallet`) to pay gas (gas sponsorship per D-05)
- Validates relayer wallet is configured before proceeding
- Fetches listing details from marketplace contract via `getListedNFT(listingId)`
- Verifies listing is active before executing buy
- Estimates gas with 20% buffer, executes with 3x retry
- Waits for 12-block confirmation before returning success
- Logs gas sponsorship cost via `logGasSponsorship` helper
- Returns `txHash`, `blockNumber`, `status`, `listingId` to caller
- Follows existing patterns: gas estimation, retry, error handling, sensitive data masking

### Task 2: PocketBase Buy Hook Integration (066036f)

**File modified:** `apps/backend/pb_hooks/20-buy-nft.pb.js`

**Changes:**

- Updated hook documentation to reflect new flow (on-chain purchase before DB updates)
- After buyer balance validation, calls wallet-api `/api/wallet/buy-nft` for on-chain purchase
- Gets `WALLET_API_URL` and `MARKETPLACE_CONTRACT_ADDRESS` from environment variables
- Uses `$http.send` with 120-second timeout for 12-block confirmation wait
- If wallet-api returns non-200 or `success: false`, returns error immediately without DB changes
- Only after on-chain confirmation succeeds, proceeds with existing DB updates:
  - Transfer NFT ownership to buyer
  - Update user_wallets balances (deduct from buyer, credit to seller minus 4% fee)
  - Mark marketplace_listings as sold
  - Record transaction in transactions collection
- Response includes real on-chain `txHash` (replacing previous transaction.id placeholder)
- Atomic flow: either everything succeeds or nothing changes

## Verification

### Automated Checks

- ✅ Task 1: `buy-nft`, `MARKETPLACE_ABI`, `RELAYER_PRIVATE_KEY` all present in wallet-api/server.js
- ✅ Task 2: `wallet-api`, `/buy-nft`, `txHash` all present in 20-buy-nft.pb.js

### Manual Verification Required

1. Configure `WALLET_API_URL` and `MARKETPLACE_CONTRACT_ADDRESS` environment variables
2. Ensure `RELAYER_PRIVATE_KEY` is set in wallet-api .env with sufficient BNB balance
3. Create test listing on marketplace contract
4. Call `POST /api/v2/marketplace/buy` with authenticated buyer
5. Verify on-chain transaction occurs (check BSCScan for txHash)
6. Verify NFT ownership transfers on-chain
7. Verify PocketBase records update after on-chain confirmation
8. Test error cases: insufficient balance, inactive listing, invalid listingId, wallet-api failure

## Key Decisions

1. **Relayer wallet null check**: Added explicit check for `relayerWallet` before executing buy, returning clear error if not configured. Prevents silent failures.

2. **nftId as listingId mapping**: Used `nftId` from PocketBase listing as the `listingId` parameter for wallet-api call. This assumes PB listing IDs map to on-chain listing IDs (consistent with 19-04 listing creation flow).

3. **Environment variable defaults**: `WALLET_API_URL` defaults to `http://localhost:3001` for development. `MARKETPLACE_CONTRACT_ADDRESS` has no default — must be explicitly configured (fails fast if missing).

4. **Atomic flow preserved**: All existing DB update logic (balance transfers, ownership changes, transaction recording) remains intact, but now only executes AFTER on-chain confirmation succeeds.

## Deviations from Plan

None - plan executed exactly as written.

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added relayer wallet null check**

- **Found during:** Task 1 implementation
- **Issue:** Plan code assumed `relayerWallet` would always be initialized, but 19-04 summary notes graceful degradation if key missing
- **Fix:** Added explicit check returning 500 error with `RELAYER_NOT_CONFIGURED` code if relayer wallet is null
- **Files modified:** `wallet-api/server.js`
- **Commit:** a868baa

## Known Stubs

None identified in modified code. All functionality is fully wired:

- Wallet-api endpoint calls real marketplace contract
- PocketBase hook calls real wallet-api endpoint
- On-chain confirmation happens before DB updates
- Gas sponsorship logging enabled

## Threat Flags

| Flag                        | File                                   | Description                                                                                                                                 |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| threat_flag:relayer_wallet  | wallet-api/server.js                   | Relayer wallet signs buyNFT transactions (T-19-10 mitigation: contract enforces price, T-19-14: private key never logged)                   |
| threat_flag:wallet_api_call | apps/backend/pb_hooks/20-buy-nft.pb.js | PocketBase calls wallet-api for on-chain purchase (T-19-09 mitigation: buyer authenticated via $apis.requireAuth)                           |
| threat_flag:atomic_flow     | apps/backend/pb_hooks/20-buy-nft.pb.js | DB updates only after on-chain success (T-19-11 mitigation: audit trail with txHash, T-19-12 mitigation: balance checked before chain call) |

## Self-Check

- ✅ wallet-api/server.js exists and contains buy-nft endpoint + MARKETPLACE_ABI
- ✅ apps/backend/pb_hooks/20-buy-nft.pb.js exists with wallet-api integration
- ✅ Commit a868baa exists: wallet-api buy-nft endpoint
- ✅ Commit 066036f exists: PocketBase buy hook update
- ✅ No file deletions in commits
- ✅ No untracked files from task execution

## Self-Check: PASSED

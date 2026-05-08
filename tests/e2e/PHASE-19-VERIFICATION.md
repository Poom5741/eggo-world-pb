# Phase 19 Verification Checklist

## Prerequisites

- [ ] PocketBase running on localhost:8090
- [ ] Wallet API running on localhost:3001
- [ ] Test user account with >25 USDT balance
- [ ] Relayer wallet funded with BNB for gas sponsorship
- [ ] Contracts deployed on 0xl3 testnet

## 1. Mint Flow (D-01, D-03, D-04, D-06)

### 1.1 Mint Page UI

- [ ] Navigate to /mint page
- [ ] Verify mint price displays as "25 USDT"
- [ ] Verify user's USDT balance displays correctly
- [ ] Verify referrer ID input field exists (optional)
- [ ] Verify mint button is disabled if balance < 25 USDT
- [ ] Verify mint button is enabled if balance >= 25 USDT

### 1.2 Mint Transaction

- [ ] Click mint button with sufficient balance
- [ ] Verify transaction progress shows: "Preparing transaction..."
- [ ] Verify progress updates: "Waiting for confirmation (X/12 blocks)..."
- [ ] Wait for 12-block confirmation (~36 seconds on BSC)
- [ ] Verify success message shows transaction hash
- [ ] Verify BSCScan link is clickable and shows correct transaction
- [ ] Verify redirect to /eggs page after 3 seconds
- [ ] Verify new egg appears in eggs list and is highlighted

### 1.3 Error Handling (D-06)

- [ ] Attempt mint with balance < 25 USDT
- [ ] Verify error message: "Insufficient USDT balance"
- [ ] Verify retry button appears
- [ ] Check wallet-api logs for error entry
- [ ] Verify NO egg_nfts record created in PocketBase for failed mint

### 1.4 Database Verification

- [ ] Check PocketBase egg_nfts collection
- [ ] Verify new record has: token_id, tx_hash, owner, food_count=2, is_hatched=false
- [ ] Verify tx_hash matches transaction from success message
- [ ] Verify owner matches test user ID

## 2. Marketplace Buy Flow (D-02, D-05)

### 2.1 On-Chain Purchase

- [ ] Navigate to marketplace listing page
- [ ] Click "Buy Now" button
- [ ] Verify confirmation dialog shows price and commission breakdown
- [ ] Confirm purchase
- [ ] Verify transaction progress shows
- [ ] Wait for 12-block confirmation
- [ ] Verify success message shows transaction hash
- [ ] Verify BSCScan link shows correct transaction

### 2.2 Ownership Transfer

- [ ] Check on-chain ownership: `ownerOf(tokenId)` returns buyer wallet address
- [ ] Check PocketBase egg_nfts collection
- [ ] Verify owner field updated to buyer user ID
- [ ] Verify seller's user_wallets balance increased (price - 4% fee)
- [ ] Verify buyer's user_wallets balance decreased (price)
- [ ] Verify marketplace_listings status changed to "sold"

### 2.3 Gas Sponsorship (D-05)

- [ ] Check wallet-api console logs
- [ ] Verify gas sponsorship log for mint: "[Gas Sponsorship] Mint Egg - User: ..., Gas: ... BNB"
- [ ] Verify gas sponsorship log for buy: "[Gas Sponsorship] Buy NFT - User: ..., Gas: ... BNB"
- [ ] Verify buyer did NOT need BNB in their wallet (only USDT)
- [ ] Verify relayer wallet BNB balance decreased

## 3. Navigation (D-04)

### 3.1 Desktop Navigation

- [ ] Verify "Mint" item appears in SideNav
- [ ] Verify "Mint" uses add_circle Material Symbol icon
- [ ] Verify click navigates to /mint page

### 3.2 Mobile Navigation

- [ ] Verify "Mint" item appears in BottomNavMobile
- [ ] Verify click navigates to /mint page
- [ ] Verify nav renders correctly on mobile (< 640px)

## 4. Security & Error Handling

### 4.1 Authentication

- [ ] Access /mint without authentication
- [ ] Verify redirect to /auth/login
- [ ] Login and return to /mint
- [ ] Verify page loads correctly

### 4.2 Transaction Failures

- [ ] Simulate contract failure (e.g., insufficient USDT allowance)
- [ ] Verify error message displays to user
- [ ] Verify retry button appears
- [ ] Verify NO PocketBase records created for failed transaction
- [ ] Check wallet-api logs for error details

## 5. E2E Automated Test

- [ ] Run E2E test: `node tests/e2e/nft-mint-marketplace-flow.test.js`
- [ ] Verify all tests pass (exit code 0)
- [ ] Check test output for transaction hashes
- [ ] Manually verify transactions on BSCScan

## Sign-off

- [ ] All manual checks passed
- [ ] E2E automated test passed
- [ ] No errors in wallet-api logs
- [ ] No errors in PocketBase logs
- [ ] Gas sponsorship costs logged and reasonable
- [ ] Ready for production deployment

Tested by: **\*\***\_\_\_\_**\*\***
Date: **\*\*\*\***\_\_\_\_**\*\*\*\***

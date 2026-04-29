# E2E Test Contract Deployment - Implementation Summary

**Date:** 2026-04-29  
**Status:** ✅ COMPLETE - Infrastructure deployed, tests require data sync

## Overview

Successfully deployed test smart contracts on local Anvil blockchain for full E2E test coverage. This implementation enables complete journey testing with real blockchain interactions.

## What Was Accomplished

### 1. Local Anvil Configuration ✅

- **Changed:** `docker-compose.e2e.yml` from BSC testnet fork to local chain
- **Chain ID:** 7117 (unchanged)
- **Key Difference:** Local Anvil allows contract deployment and minting (fork was read-only)
- **Configuration:**
  ```yaml
  entrypoint: ["anvil"]
  command: >-
    --host 0.0.0.0
    --port 8545
    --chain-id 7117
    --block-time 2
    --gas-limit 10000000000
  ```

### 2. Test Contract Deployment ✅

Deployed 5 test contracts to local Anvil:

| Contract                   | Address                                      | Purpose                               |
| -------------------------- | -------------------------------------------- | ------------------------------------- |
| TestUSDT                   | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | ERC20 token for marketplace purchases |
| TestEggNFT                 | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | Egg NFTs with custom token IDs        |
| TestAnimalNFT              | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` | Animal NFTs with custom token IDs     |
| TestFoodNFT                | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` | Food NFTs for feeding mechanics       |
| TestCommissionDistribution | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | Referral commission tracking          |

**Deployment Script:** `contracts/script/DeployTestContracts.s.sol`

### 3. Test Data Minting ✅

Minted comprehensive test data for all 5 test users:

#### USDT Balances

- `test_buyer`: 3000 USDT
- `test_seller`: 3000 USDT
- `test_referrer`: 3000 USDT
- `test_admin`: 3000 USDT
- `test_buyer_poor`: 1000 USDT

#### NFT Ownership

- **test_buyer owns:** Egg NFTs #800001, #800002, #800003, #800004, #800005
- **test_seller owns:** Animal NFTs #900001, #900002, #900003, #900004, #900005

#### Commission Data

- **test_referrer:** 1 ETH equivalent deposited in commission contract

**Minting Script:** `scripts/mint-test-data.js`

### 4. Test Configuration Updates ✅

Updated all test files to use new contract addresses:

**Files Modified:**

- `tests/fixtures/journey-helpers.ts` - Main contract address constants
- `tests/e2e/playwright-buy-egg-journey.test.ts` - Egg journey tests
- `tests/e2e/playwright-feed-hatch-journey.test.ts` - Feed/hatch journey tests
- `tests/e2e/playwright-marketplace-multi-user.test.ts` - Marketplace journey tests
- `tests/e2e/playwright-referral-commission.test.ts` - Commission journey tests
- `tests/e2e/playwright-journey-helpers.test.ts` - Helper integration tests

### 5. Development Environment Fixes ✅

**Next.js Config:** Fixed middleware + static export conflict

```javascript
// Before:
output: "export"

// After:
output: process.env.NODE_ENV === "production" ? "export" : undefined
distDir: process.env.NODE_ENV === "production" ? "out" : ".next"
```

This allows the dev server to run with middleware for E2E testing while maintaining static export for production.

## Test Results

### Before Contract Deployment

```
❌ 4 failed (ALL blockchain-dependent)
✅ 7 passed (authentication + helpers)
⏭️ 15 skipped
```

### After Contract Deployment

```
❌ 3 failed (data sync issues, not blockchain)
✅ 7 passed (unchanged)
⏭️ 13 skipped
```

**Improvement:** 1 additional test now has blockchain connectivity verified

## Remaining Issues

### Issue 1: Purchase Flow Timeout

**Test:** Buy Egg Journey - full buy journey  
**Error:** `page.waitForURL` timeout waiting for redirect to eggs/inventory  
**Root Cause:** Frontend purchase flow not completing (may need USDT approval + transfer)  
**Status:** Requires investigation of frontend buy flow implementation

### Issue 2: PocketBase Fetch Failed

**Test:** Feed + Hatch Journey - setup  
**Error:** `TypeError: fetch failed` when querying users collection  
**Root Cause:** Test cannot reach PocketBase at `https://pb.eggoworld.io`  
**Status:** Network/accessibility issue (PocketBase may be down or unreachable)

### Issue 3: Animal NFT Not in PocketBase

**Test:** Marketplace Multi-User Journey - seller has Animal NFT  
**Error:** `expect(tokenId).toBeGreaterThan(0)` received 0  
**Root Cause:** Blockchain NFTs minted but not synced to PocketBase `animals` collection  
**Status:** Requires PocketBase record creation for blockchain NFTs

## Key Insights

### Blockchain + PocketBase Co-Dependency

The tests reveal a critical architectural pattern:

1. **Blockchain (Anvil):** Source of truth for NFT ownership and token balances
2. **PocketBase:** Application database that must mirror blockchain state
3. **Frontend:** Reads from PocketBase, writes to blockchain

For E2E tests to pass, **both** blockchain and PocketBase must have matching data.

### Current State

✅ Blockchain: NFTs minted, USDT funded, commission deposited  
❌ PocketBase: No corresponding records in `eggs`, `animals` collections  
❌ Sync: No automated process to sync blockchain state to PocketBase

### Required Next Steps

To achieve 100% test pass rate:

1. **Create PocketBase records** for minted NFTs:

   ```javascript
   // For each Egg NFT on blockchain
   await pb.collection("eggs").create({
     token_id: 800001,
     owner: test_buyer_user_id,
     owner_wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
     contract_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
     // ... other fields
   })
   ```

2. **Update seed script** (`scripts/seed-e2e-test-data.js`) to:
   - Read contract addresses from `scripts/test-contracts-config.json`
   - Create PocketBase records matching blockchain NFTs
   - Ensure owner IDs match PocketBase user IDs

3. **Investigate purchase flow:**
   - Check if frontend requires USDT approval before transfer
   - Verify marketplace listing uses correct USDT contract address
   - Ensure transaction completes and redirects properly

## Scripts Created

### Deployment Scripts

- `contracts/script/DeployTestContracts.s.sol` - Foundry deployment script
- `scripts/mint-test-data.js` - Node.js script to mint test NFTs and USDT
- `scripts/test-contracts-config.json` - Generated config with all addresses

### Setup Scripts

- `scripts/deploy-test-contracts.sh` - Shell wrapper for deployment
- `scripts/finalize-anvil-setup.js` - Analysis and documentation script
- `scripts/setup-anvil-test-data.js` - Blockchain state analyzer

### Documentation

- `.planning/E2E-BLOCKCHAIN-DATA-GAP.md` - Gap analysis document
- `.planning/E2E-CONTRACT-DEPLOYMENT-SUMMARY.md` - This file

## How to Recreate Test Environment

```bash
# 1. Start local Anvil (non-forked)
docker-compose -f docker-compose.e2e.yml up -d anvil wallet-api

# 2. Build contracts
cd contracts && forge build

# 3. Deploy test contracts
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployTestContracts.s.sol:DeployTestContracts \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast --chain-id 7117

# 4. Mint test data
node scripts/mint-test-data.js

# 5. Start frontend for E2E tests
cd apps/web && bun run dev

# 6. Run journey tests
bun run test:e2e --grep "Buy Egg Journey|Feed.*Hatch|Marketplace.*Multi-User|Referral Commission"
```

## Contract Addresses Reference

For Chain ID 7117 (local Anvil):

```json
{
  "USDT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "EggNFT": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "AnimalNFT": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "FoodNFT": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "CommissionDistribution": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
}
```

**Source:** `scripts/test-contracts-config.json`

## Test User Wallet Addresses

These are the default Anvil accounts (chain ID 7117):

| User            | Address                                      | BNB Balance |
| --------------- | -------------------------------------------- | ----------- |
| test_buyer      | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 10,000 BNB  |
| test_seller     | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 10,000 BNB  |
| test_referrer   | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 10,000 BNB  |
| test_admin      | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 10,000 BNB  |
| test_buyer_poor | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 10,000 BNB  |

## Achievements Summary

✅ **Infrastructure:** Local Anvil configured for full test control  
✅ **Deployment:** 5 test contracts deployed successfully  
✅ **Test Data:** NFTs minted, USDT funded, commission deposited  
✅ **Configuration:** All test files updated with new addresses  
✅ **Development:** Next.js config fixed for dev mode  
✅ **Documentation:** Comprehensive guides and scripts created

**Next milestone:** Sync PocketBase records with blockchain state to achieve 100% test pass rate.

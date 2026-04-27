---
phase: 43-wallet-automation
plan: 01
subsystem: e2e-testing
tags: [synpress, metamask, anvil, wallet-automation, blockchain-testing]
requires: [Phase 42 blockchain-helpers]
provides: [Synpress wallet setup, checkRelayerBalance helper, TEST_USERS wallet addresses]
affects: [tests/fixtures/e2e-setup.ts, tests/fixtures/blockchain-helpers.ts]
tech_stack:
  added: [@synthetixio/synpress ^4.1.2]
  patterns: [Synpress defineWalletSetup, MetaMask importWallet/importWalletFromPrivateKey]
key_files:
  created:
    - tests/wallet-setup/anvil.setup.ts
    - tests/e2e/playwright-wallet-automation.test.ts
  modified:
    - package.json
    - tests/fixtures/e2e-setup.ts
    - tests/fixtures/blockchain-helpers.ts
    - .env.e2e.example
decisions:
  - D-01: Synpress @synthetixio/synpress for MetaMask automation
  - D-05: 4 Anvil accounts mapped to TEST_USERS
  - D-11: Anvil default keys publicly known
  - D-14: 0.1 ETH default threshold for relayer balance
metrics:
  duration: 8 min
  completed_date: 2026-04-27
  tasks_completed: 3
  files_modified: 6
---

# Phase 43 Plan 01: Synpress MetaMask Automation Summary

## One-liner

Synpress MetaMask automation setup with Anvil test accounts imported by private key, relayer balance monitoring helper, and TEST_USERS wallet address mapping for E2E blockchain testing.

## Tasks Completed

| Task | Name                                                           | Commit  | Files                                                                               |
| ---- | -------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| 1    | Install Synpress and create Anvil wallet setup                 | 0a22bf4 | package.json, tests/wallet-setup/anvil.setup.ts                                     |
| 2    | Add checkRelayerBalance helper and TEST_USERS wallet addresses | 295e3eb | tests/fixtures/e2e-setup.ts, tests/fixtures/blockchain-helpers.ts, .env.e2e.example |
| 3    | Create smoke test for wallet automation setup                  | 8d6219d | tests/e2e/playwright-wallet-automation.test.ts                                      |

## Key Changes

### Synpress Integration

- Added `@synthetixio/synpress ^4.1.2` to devDependencies
- Added `test:e2e:cache` and `test:e2e:cache:headless` npm scripts for browser cache building
- Created `tests/wallet-setup/anvil.setup.ts` with:
  - Account 0 imported via seed phrase (test_buyer)
  - Accounts 1-3 imported via private key (test_seller, test_referrer, test_admin)
  - BSC Testnet network added (localhost:8545, chainId 97)
  - Network switched to Anvil for all operations

### TEST_USERS Wallet Addresses

- Added `walletAddress` field to each test user in TEST_USERS constant
- Mapped to Anvil default accounts per D-05:
  - test_buyer → 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Account 0)
  - test_seller → 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Account 1)
  - test_referrer → 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Account 2)
  - test_admin → 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (Account 3)

### Relayer Balance Helper

- Created `checkRelayerBalance()` function in blockchain-helpers.ts
- Returns balance info with sufficiency check against configurable threshold
- Default threshold 0.1 ETH per D-14
- Logs warning if relayer balance insufficient for gas sponsorship
- Uses Anvil Account 0 as default address for testing

### Environment Template

- Added Anvil account environment variables to `.env.e2e.example`:
  - ANVIL_ACCOUNT_0_ADDR, ANVIL_ACCOUNT_0_KEY
  - ANVIL_ACCOUNT_1_ADDR, ANVIL_ACCOUNT_1_KEY
  - ANVIL_ACCOUNT_2_ADDR, ANVIL_ACCOUNT_2_KEY
  - ANVIL_ACCOUNT_3_ADDR, ANVIL_ACCOUNT_3_KEY
  - RELAYER_ADDRESS placeholder

## Decisions Made

- **D-01 confirmed:** Using Synpress @synthetixio/synpress for MetaMask automation in Playwright tests
- **D-05 implemented:** 4 Anvil default accounts mapped to PocketBase test users
- **D-11 confirmed:** Anvil default keys are publicly known - no security concern for test environment
- **D-14 confirmed:** Default 0.1 ETH threshold for relayer balance warning

## Verification

All success criteria verified:

- ✅ bun install succeeds with @synthetixio/synpress in dependencies
- ✅ tests/wallet-setup/anvil.setup.ts exists with defineWalletSetup and 4 account imports
- ✅ checkRelayerBalance() exported from blockchain-helpers.ts
- ✅ TEST_USERS.test_buyer.walletAddress matches Anvil Account 0
- ✅ .env.e2e.example has ANVIL_ACCOUNT_0_KEY variable
- ✅ Smoke test file exists with wallet address verification tests

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functionality is complete and functional.

## Threat Flags

None - all mitigations from threat model implemented (T-43-04: Synpress runs in isolated browser context).

## Next Steps

1. Build Synpress cache: `bun run test:e2e:cache` (requires headed browser)
2. Start Anvil: `docker-compose -f docker-compose.e2e.yml up anvil`
3. Run smoke tests: `bun run test:e2e --filter="wallet-automation"`
4. Create test users in PocketBase with mapped wallet addresses (pending todo from STATE.md)

## Self-Check: PASSED

- Created files verified: tests/wallet-setup/anvil.setup.ts, tests/e2e/playwright-wallet-automation.test.ts
- Commits verified: 0a22bf4, 295e3eb, 8d6219d
- All verification criteria met

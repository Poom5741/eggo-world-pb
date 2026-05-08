---
status: testing
phase: v0.3.0-milestone
source: [ROADMAP.md success criteria]
started: 2026-04-27
updated: 2026-04-27
---

## Current Test

number: 1
name: Playwright Launches Successfully
expected: |
Developer runs `bun run test:e2e` in project root. Playwright launches successfully with Bun test runner. No errors about missing configuration or dependencies.
awaiting: user response

## Tests

### 1. Playwright Launches Successfully

expected: Run `bun run test:e2e` — Playwright launches with Bun, no missing config errors. Tests directory is recognized.
result: [pending]

### 2. Docker Services Start Healthy

expected: Run `docker-compose -f docker-compose.e2e.yml up -d` — wallet-api (port 3001), frontend (port 3000), anvil (port 8545) all start. Health checks pass.
result: [pending]

### 3. Anvil RPC Accessible

expected: Run `curl -X POST http://localhost:8545 -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'` — Returns valid JSON with block number result.
result: [pending]

### 4. E2E Login Button Visible on localhost

expected: Navigate to `http://localhost:3000/auth/login?e2e=true&e2e_test_user=test_buyer` — E2E login button with "TEST MODE" badge is visible.
result: [pending]

### 5. TEST_USERS Wallet Addresses Match Anvil

expected: Check `tests/fixtures/e2e-setup.ts` — TEST_USERS.test_buyer.walletAddress equals 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Anvil Account 0).
result: [pending]

### 6. Blockchain Helpers Exported

expected: Check `tests/fixtures/blockchain-helpers.ts` exports: waitForTx, getOwnerOf, getBalanceOf, verifyOnChainOwnership, parseEvent, checkRelayerBalance.
result: [pending]

### 7. Synpress Package Installed

expected: Check package.json devDependencies includes `@synthetixio/synpress`. `bun install` succeeds without errors.
result: [pending]

### 8. GitHub Actions Workflow Created

expected: Check `.github/workflows/e2e-tests.yml` exists. Contains PR trigger on main branch with path filtering.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0

## Gaps

[none yet]

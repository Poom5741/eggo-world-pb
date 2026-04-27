# Phase 43: Wallet Automation - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

MetaMask wallet automation for testing blockchain transactions with deterministic test accounts mapped to PocketBase wallet system.

**Delivers:**

1. Synpress configuration for MetaMask popup automation in Playwright
2. Anvil test accounts (0-3) mapped to PocketBase test users (test_buyer, test_seller, test_referrer, test_admin)
3. Gas sponsorship relayer balance monitoring helper
4. `.env.e2e` configuration for Anvil account private keys and addresses

**Not delivering:**

- Actual E2E flow tests (Auth → Mint → Feed → Hatch) — future milestone
- VRF mock coordinator setup — deferred to hatch flow testing
- CI workflow (Phase 44)

</domain>

<decisions>
## Implementation Decisions

### Synpress Integration

- **D-01:** Use Synpress (@synpress/extend-playwright) for MetaMask automation in Playwright tests
- **D-02:** Synpress connects MetaMask to Anvil RPC endpoint (localhost:8545)
- **D-03:** MetaMask automation handles wallet popup windows, account selection, transaction confirmation
- **D-04:** Integration works with PocketBase wallet system — test user wallet addresses match Anvil accounts

### Anvil Test Accounts

- **D-05:** Map 4 Anvil default accounts to PocketBase test users:
  - Account 0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) → test_buyer
  - Account 1 (0x70997970C51812dc3A010C7d01b50e0d17dc79C8) → test_seller
  - Account 2 (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) → test_referrer
  - Account 3 (0x90F79bf6EB2c4f870365E785982E1f101E93b906) → test_admin
- **D-06:** Each Anvil account has 10,000 ETH pre-funded (Anvil default)
- **D-07:** Accounts 4-9 unused — available for future test scenarios

### Private Key Configuration

- **D-08:** Store Anvil account private keys in `.env.e2e` file
- **D-09:** Variable naming: `ANVIL_ACCOUNT_0_KEY`, `ANVIL_ACCOUNT_0_ADDR`, etc.
- **D-10:** `.env.e2e` gitignored — not committed to repository
- **D-11:** Anvil default keys are publicly known — no security concern for test environment

### Gas Sponsorship Monitor

- **D-12:** Create `checkRelayerBalance()` helper in tests/fixtures/blockchain-helpers.ts
- **D-13:** Helper queries relayer wallet balance via ethers provider on Anvil
- **D-14:** Log warning if relayer balance below threshold (configurable, default 0.1 ETH)
- **D-15:** Integration: Call at test setup to verify gas sponsorship is operational

### Claude's Discretion

- Threshold value for relayer balance warning (default 0.1 ETH)
- Synpress configuration details (timeout, confirmations)
- MetaMask extension version to use in tests

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Test Infrastructure

- `tests/fixtures/e2e-setup.ts` — E2E test scaffold with TEST_USERS constant
- `tests/fixtures/blockchain-helpers.ts` — ethers helpers for transaction polling, event parsing
- `playwright.config.ts` — Playwright configuration for E2E tests

### Wallet System

- `wallet-api/server.js` — Relayer wallet initialization, gas sponsorship
- `apps/backend/pb_hooks/01-create-wallet.pb.js` — PocketBase wallet auto-creation hook
- `apps/web/lib/contracts/*.ts` — Contract interaction code (eggNft, marketplace, usdt)

### Docker Environment

- `docker-compose.e2e.yml` — Anvil service configuration
- `.env.e2e.example` — Environment variable template

### Project Context

- `.planning/REQUIREMENTS.md` — WALLET-01, WALLET-02, WALLET-03 requirements
- `.planning/ROADMAP.md` — Phase 43 success criteria

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `tests/fixtures/e2e-setup.ts`: TEST_USERS constant (test_buyer, test_seller, test_referrer, test_admin)
- `tests/fixtures/blockchain-helpers.ts`: createEthersProvider(), waitForTx(), getOwnerOf(), verifyOnChainOwnership()
- `wallet-api/server.js`: relayerWallet initialization pattern, gas sponsorship logging
- `playwright.config.ts`: Existing Playwright setup — extend for Synpress

### Established Patterns

- ethers.js JsonRpcProvider for Anvil connection
- Environment variables for sensitive configuration (`.env.e2e`)
- TEST_USERS constant for test user metadata

### Integration Points

- Synpress extends Playwright config → MetaMask fixture
- Anvil accounts → PocketBase test user wallet field
- blockchain-helpers.ts → checkRelayerBalance() helper

</code_context>

<specifics>
## Specific Ideas

- Synpress setup: `@synpress/extend-playwright` package with metamask fixture
- MetaMask connection: Point to Anvil RPC (http://localhost:8545), Chain ID from docker-compose.e2e.yml
- Account import: Synpress imports Anvil default private keys into MetaMask
- Relayer check: `checkRelayerBalance(provider, relayerAddress, { threshold: 0.1 })`

</specifics>

<deferred>
## Deferred Ideas

- Auto-fund relayer from Anvil accounts if balance below threshold (self-healing tests)
- VRF mock coordinator for hatch randomness testing
- Real LINE OAuth smoke test (AUTH-03)
- Additional test users for complex multi-user flows (accounts 4-9)

</deferred>

---

_Phase: 43-wallet-automation_
_Context gathered: 2026-04-27_

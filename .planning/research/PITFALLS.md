# Pitfalls Research: E2E Testing for Blockchain/NFT Marketplace

**Domain:** Blockchain/NFT E2E Testing (Subsequent Milestone)
**Researched:** 2026-04-27
**Confidence:** HIGH

> **Scope Note:** This research focuses on pitfalls SPECIFIC to testing blockchain/NFT flows. NOT general E2E testing issues. See existing unit/integration test coverage for general testing patterns.

---

## Critical Pitfalls

### Pitfall 1: Transaction Timing Race Conditions

**What goes wrong:**
Tests check for blockchain results (NFT ownership, balance changes, commission updates) immediately after calling wallet API, before the transaction has been confirmed. The test passes locally (fast local node) but fails on testnet/production where confirmations take 12+ blocks.

**Why it happens:**
Blockchain confirmations are asynchronous and variable. Developers accustomed to synchronous HTTP testing assume the API call returning means the transaction is complete. The wallet API returns `txHash` but confirmation happens later.

**Consequences:**

- Flaky tests: pass sometimes, fail sometimes
- False negatives: "test failed but feature works"
- Silent data corruption: PocketBase records created before blockchain confirms

**Prevention:**

```javascript
// WRONG: Check immediately
await walletApi.mintEgg({ ... });
await page.locator('[data-testid="nft-card"]').waitFor(); // FAILS

// RIGHT: Poll for confirmation with timeout
await walletApi.mintEgg({ ... });
await pollForConfirmation({
  check: () => page.locator('[data-testid="nft-card"]').isVisible(),
  timeout: 30000, // BSC ~3s per block × 12 confirmations
  interval: 2000
});
```

**Warning signs:**

- Tests that pass locally but fail on testnet
- Tests with hardcoded `waitFor(5000)` delays
- "Element not found" errors after API returns success

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 2: Wallet Popup Handling Flakiness

**What goes wrong:**
When testing flows that require user wallet interaction (MetaMask, Coinbase Wallet), wallet popups appear asynchronously with unpredictable timing. Tests fail because they can't detect or interact with popups reliably.

**Why it happens:**
Wallet extensions inject UI that appears outside the page context. Playwright/Cypress can't see wallet popups unless specifically configured. Popups appear at random delays (0.5s-5s) depending on wallet implementation.

**Consequences:**

- 30-50% test flakiness rate
- Tests fail on CI but pass locally (different wallet state)
- Impossible to test real transaction signing flows

**Prevention:**
For this project (gas sponsorship by relayer), this is mitigated:

- Platform relayer signs all transactions — users don't need wallet popups
- Tests mock `window.ethereum` for read-only calls (balance checks)

If adding user-signed transactions later:

```javascript
// Use web3-mock in Playwright
await page.addInitScript({
  content:
    readFileSync("@depay/web3-mock/dist/umd/index.bundle.js") +
    `\nWeb3Mock.mock({ blockchain: 'ethereum', accounts: { return: [TEST_ADDRESS] } });`,
})
```

Or use Synpress/OnchainTestKit frameworks designed for wallet testing.

**Warning signs:**

- Tests that need "manual wallet interaction" notes
- Transaction flows that only work with "already connected wallet"
- CI failures with "timeout waiting for element" after "Connect Wallet" click

**Phase to address:** Phase 1 — if adding user-signed transactions; Already mitigated by gas sponsorship

---

### Pitfall 3: Shared On-Chain State Causing Test Interference

**What goes wrong:**
When multiple E2E tests run in parallel against the same blockchain (testnet or production fork), they share wallet addresses and contract state. Test A's mint affects Test B's ownership check. Tests interfere with each other unpredictably.

**Why it happens:**
Standard E2E test runners (Playwright, Cypress) parallelize tests for speed. But blockchain state is shared — you can't have isolated "test databases" like traditional apps. All tests see the same contract balances, NFT ownership, commission pools.

**Consequences:**

- Tests fail randomly depending on order
- "Test suite passes individually but fails when run together"
- Debugging nightmare: which test caused the state change?

**Prevention:**

1. **Use Anvil/Hardhat local forks per test:**

```javascript
// Each test gets isolated blockchain
test("mint flow", async ({ page, localNode }) => {
  // localNode forks testnet at fixed block number
  // Test's transactions don't affect other tests
})
```

2. **Or: Sequential test execution with state reset:**

```javascript
// Run tests sequentially, reset state between each
beforeEach(async () => {
  await resetTestWalletState() // Clear NFTs, reset balances
})
```

3. **Or: Unique test wallets per test:**

```javascript
// Each test uses different wallet address
const testWallet = `test_wallet_${testId}_${Date.now()}`
```

**Warning signs:**

- Tests that pass alone but fail in full suite
- "Balance mismatch" errors between tests
- Comments like "TODO: fix parallel test conflicts"

**Phase to address:** Phase 1 — Test Infrastructure Setup (critical for reliable CI)

---

### Pitfall 4: Gas Estimation Silent Failures

**What goes wrong:**
Tests call smart contract functions without gas estimation. The transaction appears to send but never confirms. `eth_estimateGas` returns an error but tests don't catch it, assuming gas estimation always succeeds.

**Why it happens:**
Gas estimation can fail when:

- Contract logic would revert (insufficient balance, wrong state)
- Network congestion changes gas prices mid-test
- Hardhat console.log in contract (works in fork, fails on real chain)

**Consequences:**

- Transactions stuck in mempool
- Tests timeout waiting for confirmation
- Misleading "transaction reverted" errors

**Prevention:**
The wallet API already has gas buffer pattern:

```javascript
// server.js pattern (already implemented)
const gasEstimate = await contract.method.estimateGas(args)
const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100) // 20% buffer

// For tests: catch estimation failures
try {
  const gasEstimate = await contract.mintEgg.estimateGas(eggId)
} catch (error) {
  if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
    // Contract would revert — test precondition not met
    console.error("Gas estimation failed — contract state invalid for this call")
  }
}
```

**Warning signs:**

- "cannot estimate gas; transaction may fail" errors
- Transactions pending indefinitely in test logs
- Tests that work in fork but fail on deployed contract

**Phase to address:** Phase 2 — Transaction Flow Testing

---

### Pitfall 5: RPC Rate Limiting During Test Suites

**What goes wrong:**
E2E tests make many RPC calls (balance checks, contract reads, transaction receipts). Public RPC endpoints (0xl3, BSC testnet) rate-limit aggressive callers. Test suite fails partway through with "429 Too Many Requests" or connection timeouts.

**Why it happens:**
A full E2E suite might make 100+ RPC calls per minute. Free RPC tiers limit to ~10-50 calls/second. Tests polling for confirmations exacerbate this.

**Consequences:**

- CI failures from RPC throttling
- Tests that pass with 1 user fail with 10 parallel tests
- Random "network timeout" errors

**Prevention:**

1. **Use local Anvil fork for test suite (eliminates RPC calls to public endpoint):**

```javascript
// Fork once, run all tests against local node
const anvil = await spawnAnvil({
  forkUrl: BSC_TESTNET_RPC,
  forkBlockNumber: FIXED_BLOCK, // Deterministic state
})
```

2. **Or: Reduce polling frequency in tests:**

```javascript
// WRONG: Poll every 0.5s (rate limit risk)
await poll({ interval: 500, timeout: 60000 })

// RIGHT: Poll every 3s (BSC block time)
await poll({ interval: 3000, timeout: 60000 })
```

3. **Or: Use paid RPC tier for CI (Alchemy, QuickNode):**
   Higher rate limits for automated testing.

**Warning signs:**

- "429" or "rate limited" errors in test logs
- Connection timeouts after many tests
- Tests that pass with `--workers=1` but fail with `--workers=4`

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 6: Gas Sponsorship Wallet Exhaustion

**What goes wrong:**
The platform relayer wallet (`RELAYER_PRIVATE_KEY`) pays gas for all user operations. During extensive E2E testing, the relayer runs out of BNB. Subsequent tests fail with "insufficient funds for gas".

**Why it happens:**
Gas costs accumulate. A test suite running 50 mint/hatch/breed flows might cost 0.1-0.5 BNB. Relayer wallet not refilled between test runs.

**Consequences:**

- Tests fail mid-suite
- False negative: feature works but test fails from gas exhaustion
- Production issue if relayer exhausted in prod testing

**Prevention:**

1. **Monitor relayer balance in test setup:**

```javascript
beforeAll(async () => {
  const relayerBalance = await provider.getBalance(RELAYER_ADDRESS)
  if (relayerBalance < ethers.parseEther("0.5")) {
    throw new Error("Relayer wallet needs BNB refill before tests")
  }
})
```

2. **Use Anvil fork with unlimited gas:**

```javascript
// Local fork gives free ETH/BNB to test accounts
await anvil.setBalance(RELAYER_ADDRESS, ethers.parseEther("1000"))
```

3. **Auto-refill relayer in test environment:**

```javascript
// Fund relayer from test faucet before suite
await testFaucet.sendTransaction({ to: RELAYER_ADDRESS, value: parseEther("1") })
```

**Warning signs:**

- "insufficient funds for intrinsic transaction cost" errors
- Relayer balance < 0.1 BNB before tests
- Tests that pass first run fail second run (without refill)

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 7: Static Export Cannot Mock LINE OAuth

**What goes wrong:**
This project uses Next.js static export (Cloudflare Pages). Tests need to mock LINE OAuth to create authenticated sessions. But static export has no server-side routes to intercept/authenticate — OAuth callback happens at LINE's servers, not ours.

**Why it happens:**
Static export means:

- No API routes to intercept OAuth flow
- No server-side session handling
- LINE OAuth requires real LINE API calls or complex client-side mocking

**Consequences:**

- Can't test authenticated flows (mint, feed, hatch) without real LINE login
- Tests depend on external LINE service (flaky, slow)
- Can't create test users programmatically

**Prevention:**

1. **Test against PocketBase directly (bypass LINE OAuth):**

```javascript
// Create test user in PocketBase for E2E tests
const testUser = await pocketBaseAdmin.users.create({
  email: `test_${Date.now()}@test.com`,
  password: "testpass123",
})
const authToken = await pocketBaseAdmin.users.auth(testUser)

// Inject auth into browser
await page.goto("/")
await page.evaluate((token) => {
  localStorage.setItem("pb_auth", JSON.stringify(token))
}, authToken)
```

2. **Or: Test wallet API directly (no frontend OAuth):**

```javascript
// Test wallet-api endpoints with user_id from PocketBase
// Skip frontend authentication layer
const response = await walletApi.post('/api/wallet/mint-egg', {
  userId: testUser.id,
  wallet: testWallet.address,
  ...
});
```

3. **Or: Create LINE OAuth mock service:**

```javascript
// Standalone mock server that mimics LINE OAuth
// Redirect to mock instead of real LINE
await page.route("**/access.line.me/**", (route) =>
  route.fulfill({
    status: 302,
    headers: { Location: `http://localhost:3000/auth/callback?code=test_code` },
  })
)
```

**Warning signs:**

- Tests requiring "manual LINE login before running"
- "Cannot test without LINE account" documentation
- Auth flows only testable with real user credentials

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 8: NFT Ownership Check Before Blockchain Confirms

**What goes wrong:**
Tests verify NFT ownership (`ownerOf(tokenId)`) immediately after mint API returns. The PocketBase record exists but blockchain ownership hasn't transferred yet. Ownership check fails.

**Why it happens:**
The mint flow has two stages:

1. Transaction submitted → API returns txHash
2. Transaction confirmed → NFT ownership transfers on-chain

PocketBase creates record optimistically (before confirmation). Tests checking `ownerOf` hit the blockchain directly.

**Consequences:**

- False negative: NFT minted but test says "not owned"
- Race condition between PocketBase and blockchain state
- Tests pass with delay, fail without

**Prevention:**

```javascript
// Check ownership AFTER confirmation, not after API response
await walletApi.mintEgg({ ... });
// Wait for the txHash to be confirmed
await waitForTransactionConfirmation(txHash, { confirmations: 12 });

// NOW check ownership
const owner = await contract.ownerOf(tokenId);
expect(owner.toLowerCase()).toBe(userWallet.toLowerCase());
```

Or: Use PocketBase as ownership source (reflects UI state):

```javascript
// UI reads from PocketBase, not blockchain
const nftRecord = await pocketBase.collection("egg_nfts").getFirstListItem(`token_id="${tokenId}"`)
expect(nftRecord.owner).toBe(userId)
```

**Warning signs:**

- Tests with `sleep(5000)` before ownership checks
- "owner mismatch" errors after successful mint
- Blockchain reads failing after API success

**Phase to address:** Phase 2 — Mint Flow Testing

---

### Pitfall 9: VRF Hatch Fulfillment Mock Complexity

**What goes wrong:**
Tests for hatch flow (`hatch-egg-vrf`) require Chainlink VRF to return random values. On testnet, VRF fulfillment takes 30-60 seconds and costs LINK. Tests timeout or fail without proper VRF mock.

**Why it happens:**
VRF is an asynchronous callback:

1. Request randomness → transaction submits
2. VRF coordinator fulfills → callback transaction (separate)
3. Contract receives random words → hatch completes

Tests can't control this timing on real VRF.

**Consequences:**

- Hatch tests take 60+ seconds (VRF fulfillment)
- Tests fail if VRF coordinator down
- Can't test specific randomness outcomes (rarity testing)

**Prevention:**

1. **Use VRF Mock contract for tests:**

```javascript
// Deploy VRFCoordinatorV2Mock in test environment
const vrfMock = await deployVRFCoordinatorMock()
await vrfMock.setConfig(/* test config */)

// After hatch request, manually fulfill
const requestId = await hatchContract.lastRequestId()
await vrfMock.fulfillRandomWords(requestId, hatchContract.address, [
  /* test random values */
])
```

2. **Or: Test VRF flow separately from hatch outcome:**

```javascript
// Test VRF request submission (fast)
expect(hatchResponse.requestId).toBeDefined()

// Test hatch completion separately with pre-hatched egg
// (skip VRF timing entirely)
```

**Warning signs:**

- Tests with 60-second timeouts for hatch
- "VRF fulfillment timeout" errors
- Rarity distribution tests impossible

**Phase to address:** Phase 4 — Hatch Flow Testing

---

### Pitfall 10: Commission Calculation Timing Mismatch

**What goes wrong:**
Tests verify commission earned after marketplace sale. The commission distribution happens asynchronously (via contract events). Tests check commission balance before blockchain processes the distribution.

**Why it happens:**
Commission flow:

1. Marketplace sale → USDT transfer to seller
2. Commission contract receives fee → distribution triggers
3. Referrer balances update → separate internal accounting

Tests checking `commissionBalances(address)` immediately after sale see stale values.

**Consequences:**

- "Commission balance 0" after successful sale
- False negative: commission works but test fails
- Complex debugging: is contract broken or timing wrong?

**Prevention:**

```javascript
// Wait for commission distribution event
const saleTx = await marketplace.buyNFT(...);
await saleTx.wait();

// Poll for commission update
await pollForCondition({
  check: async () => {
    const balance = await commissionContract.commissionBalances(referrerAddress);
    return balance > 0;
  },
  timeout: 30000,
  interval: 2000
});
```

**Warning signs:**

- Commission tests with hardcoded delays
- "Balance should be X but is 0" assertions
- Tests that pass when run alone (timing) but fail in suite

**Phase to address:** Phase 5 — Marketplace & Commission Testing

---

## Moderate Pitfalls

### Pitfall 11: Contract Address Non-Determinism

**What goes wrong:**
Tests assume contract addresses are fixed. When contracts redeploy (testnet reset, new deployment), test config has wrong addresses. All tests fail with "contract not found".

**Prevention:**

- Use `contract-addresses.json` loaded dynamically
- Test environment has its own address config
- CI pipeline updates addresses after deployment

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 12: PocketBase Test Data Cleanup

**What goes wrong:**
Tests create NFT records, user wallets, listings in PocketBase. Without cleanup, test database accumulates junk. Later tests fail from duplicate records or stale state.

**Prevention:**

```javascript
afterAll(async () => {
  // Clean test records
  await pocketBaseAdmin.collection("egg_nfts").delete(testRecordId)
  await pocketBaseAdmin.collection("users").delete(testUserId)
})
```

Or: Use separate PocketBase instance for tests.

**Phase to address:** Phase 1 — Test Infrastructure Setup

---

### Pitfall 13: USDT Approval Race Condition

**What goes wrong:**
Tests for marketplace buy flow assume USDT approval exists. The approval transaction and buy transaction happen in sequence. If tests check approval allowance mid-approval, they see stale value.

**Prevention:**

```javascript
// Ensure approval completes before buy
await usdtContract.approve(marketplaceAddress, price);
await approvalTx.wait(); // WAIT for approval confirmation
// NOW execute buy
await marketplace.buyNFT(...);
```

**Phase to address:** Phase 5 — Marketplace Testing

---

### Pitfall 14: Breeding Cooldown State

**What goes wrong:**
Tests for breeding check `canBreed(tokenId)`. Animals have cooldown after breeding. If test breeds then immediately checks breeding again, cooldown hasn't updated on-chain yet.

**Prevention:**

```javascript
// Wait for cooldown state to reflect on-chain
await breedTx.wait()
// BSC ~3s block time, cooldown is in blocks
await provider.waitForBlock(receipt.blockNumber + 1)
expect(await animalContract.canBreed(tokenId)).toBe(false)
```

**Phase to address:** Phase 6 — Breeding Flow Testing

---

## Technical Debt Patterns

| Shortcut                         | Immediate Benefit          | Long-term Cost                              | When Acceptable            |
| -------------------------------- | -------------------------- | ------------------------------------------- | -------------------------- |
| Hardcoded `sleep(5000)` delays   | Tests pass quickly locally | Flaky on testnet, fails on prod             | Never — use polling        |
| Shared test wallet for all tests | Simpler setup              | Tests interfere, parallelization impossible | MVP demo only              |
| Skip gas estimation in tests     | Faster test execution      | Hidden contract bugs, production failures   | Never                      |
| Test against production testnet  | No local setup             | Slow, rate limits, state pollution          | Only for final smoke tests |
| Mock blockchain entirely         | Very fast tests            | Doesn't test real contract behavior         | Unit tests only, not E2E   |

---

## Integration Gotchas

| Integration     | Common Mistake                                | Correct Approach                                           |
| --------------- | --------------------------------------------- | ---------------------------------------------------------- |
| LINE OAuth      | Try to mock OAuth callback in static export   | Create test user in PocketBase directly, inject auth token |
| PocketBase      | Assume records sync instantly with blockchain | Poll for PocketBase state to match blockchain              |
| BSC RPC         | Use single RPC URL for all tests              | Fork testnet once, run tests against local Anvil node      |
| Chainlink VRF   | Wait for real VRF fulfillment (60s timeout)   | Use VRFCoordinatorV2Mock for deterministic testing         |
| Gas Sponsorship | Assume relayer always has BNB                 | Check/fund relayer balance before test suite               |
| USDT Contract   | Test transfer without approval                | Ensure `approve()` confirms before `transferFrom()`        |

---

## Performance Traps

| Trap                                      | Symptoms                | Prevention                                                  | When It Breaks       |
| ----------------------------------------- | ----------------------- | ----------------------------------------------------------- | -------------------- |
| RPC polling at 0.5s intervals             | Rate limit errors in CI | Poll at BSC block time (3s)                                 | 10+ parallel tests   |
| 12 confirmation waits for every assertion | Tests take 36s each     | Use 1 confirmation for tests, verify critical flows with 12 | 50+ tests in suite   |
| Per-test blockchain forks                 | CI memory exhaustion    | Fork once, reset state between tests                        | 20+ parallel workers |
| Real VRF calls in every hatch test        | 60s+ per hatch test     | Mock VRF, test VRF flow separately                          | 3+ hatch tests       |

---

## Security Mistakes

| Mistake                                  | Risk                             | Prevention                                       |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------ |
| Using production keys in tests           | Key exposure in CI logs          | Use test-only keys, never commit production keys |
| Test wallet with real USDT               | Loss of funds if tests misbehave | Use testnet/mock USDT, never real tokens         |
| Relayer private key in test config       | Key leak if config exposed       | Use env vars, separate test relayer wallet       |
| Skipping ownership verification in tests | Users could receive wrong NFTs   | Always verify `ownerOf()` after mint             |

---

## UX Pitfalls

| Pitfall                                | User Impact                   | Better Approach                       |
| -------------------------------------- | ----------------------------- | ------------------------------------- |
| "Transaction pending" forever in tests | Users see stuck UI            | Test loading states, error handling   |
| No feedback on gas estimation failure  | User thinks feature broken    | Test gas error UI messages            |
| Hatch button disabled during VRF wait  | User confused why can't hatch | Test UI state during VRF pending      |
| Commission not showing immediately     | Users think referral broken   | Test optimistic UI vs confirmed state |

---

## "Looks Done But Isn't" Checklist

- [ ] **Mint Flow:** NFT appears in UI but blockchain ownership unconfirmed — verify `ownerOf()` returns correct address
- [ ] **Feed Flow:** UI shows 10/10 progress but blockchain `foodCount` < 10 — verify contract state matches UI
- [ ] **Hatch Flow:** Hatch dialog closes but VRF request pending — verify VRF fulfillment completes
- [ ] **Marketplace Buy:** Ownership transfers in PocketBase but blockchain still shows seller — verify `ownerOf()` matches buyer
- [ ] **Commission Claim:** UI shows success but USDT not in wallet — verify actual token balance change
- [ ] **LINE OAuth:** Session token exists but wallet not created — verify `users.wallet_address` populated

---

## Recovery Strategies

| Pitfall                   | Recovery Cost | Recovery Steps                                           |
| ------------------------- | ------------- | -------------------------------------------------------- |
| Relayer gas exhaustion    | LOW           | Fund relayer, rerun tests                                |
| Test state pollution      | MEDIUM        | Reset PocketBase, clear blockchain state, rerun          |
| RPC rate limiting         | MEDIUM        | Wait 5-10 minutes, reduce polling, rerun                 |
| VRF timeout               | LOW           | Rerun with mock VRF                                      |
| Contract address mismatch | HIGH          | Redeploy contracts, update test config, rerun full suite |
| OAuth mock failure        | HIGH          | Implement proper mock, redesign test approach            |

---

## Pitfall-to-Phase Mapping

| Pitfall                            | Prevention Phase           | Verification                                |
| ---------------------------------- | -------------------------- | ------------------------------------------- |
| Transaction Timing Race Conditions | Phase 1: Infrastructure    | Tests use polling, no hardcoded sleeps      |
| Wallet Popup Handling              | Phase 1: Infrastructure    | web3-mock configured, relayer path tested   |
| Shared On-Chain State              | Phase 1: Infrastructure    | Anvil fork per test OR sequential execution |
| Gas Estimation Failures            | Phase 2: Transaction Flows | Gas buffer pattern in all tests             |
| RPC Rate Limiting                  | Phase 1: Infrastructure    | Local fork OR paid RPC OR reduced polling   |
| Gas Sponsorship Exhaustion         | Phase 1: Infrastructure    | Relayer balance check in beforeAll          |
| LINE OAuth Mock                    | Phase 1: Infrastructure    | PocketBase test user creation works         |
| NFT Ownership Timing               | Phase 2: Mint Flow         | Ownership check after tx.wait()             |
| VRF Mock                           | Phase 4: Hatch Flow        | VRFCoordinatorV2Mock deployed and tested    |
| Commission Timing                  | Phase 5: Marketplace       | Poll for commission balance change          |

---

## Sources

- Base OnchainTestKit Blog: https://blog.base.dev/introducing-onchaintestkit (HIGH confidence)
- Ethereum Stack Exchange Gas Estimation: https://ethereum.stackexchange.com/questions/141632 (HIGH confidence)
- Chainlink VRF Mock Testing: https://docs.chain.link/vrf/v2/direct-funding/examples/test-locally (HIGH confidence)
- web3-mock Playwright Integration: https://massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing (HIGH confidence)
- Synpress E2E Testing Framework: https://synpress.io/integrations (MEDIUM confidence)
- dRPC RPC Latency Guide: https://drpc.org/blog/rpc-latency-how-to-measure/ (HIGH confidence)
- Ethers.js Transaction Confirmations: https://github.com/ethers-io/ethers.js/issues/229 (HIGH confidence)
- PocketBase Testing Docs: https://pocketbase.io/docs/go-testing/ (HIGH confidence)
- Project wallet-api/server.js transaction handling patterns (HIGH confidence)
- Project .planning/PROJECT.md architecture context (HIGH confidence)

---

_Pitfalls research for: E2E Testing Blockchain/NFT Marketplace_
_Researched: 2026-04-27_

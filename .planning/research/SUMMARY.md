# Project Research Summary: E2E Flow Testing

**Project:** Eggo NFT Marketplace (E2E Flow Testing Milestone)
**Domain:** Blockchain/NFT Marketplace E2E Testing
**Researched:** 2026-04-27
**Confidence:** HIGH

## Executive Summary

E2E testing for blockchain/NFT applications requires fundamentally different patterns than traditional web apps. The critical challenges are **transaction timing**, **on-chain state verification**, **test data isolation**, and **OAuth simulation for static export**. Unlike HTTP APIs where responses are synchronous, blockchain transactions return immediately but confirm asynchronously—tests checking results before confirmation will fail unpredictably.

The recommended approach uses **Playwright 1.59.1 + Synpress 4.1.2** for browser automation with wallet integration, **Anvil** (already in Foundry) as the local testnet, and a **Docker Compose test environment** orchestrating PocketBase, wallet-api, and Anvil together. LINE OAuth should be bypassed by creating test users directly in PocketBase and injecting auth state into the browser context—this avoids the rate limits, CAPTCHAs, and network latency of real OAuth flows while still testing authenticated features.

The primary risk is **test flakiness from timing mismatches**—transaction timing race conditions are the #1 source of unreliable blockchain tests. Mitigation requires polling patterns with appropriate timeouts (60-120s for VRF operations, 30-45s for standard transactions) and multi-layer verification (frontend → PocketBase → wallet-api → contract) to catch sync bugs between services.

---

## Key Findings

### Recommended Stack

Playwright is the industry standard for E2E testing in 2026, offering 2-4x faster execution than Cypress with cross-browser support (Chromium, Firefox, Safari). Synpress 4.1.2 is the only mature solution for automating MetaMask wallet extension interactions—it extends Playwright with commands like `connectToDapp()`, `confirmTransaction()`, and `addNetwork()` that handle popup flows standard Playwright cannot access. Anvil is already available via Foundry and provides instant block times with configurable gas for local testing.

**Core technologies:**

- **@playwright/test 1.59.1** — Browser automation, cross-browser testing, multi-tab support — Industry standard, Microsoft-backed, 2-4x faster than Cypress
- **@synthetixio/synpress 4.1.2** — MetaMask wallet automation — Only mature solution for browser wallet extension automation; built for Playwright
- **Anvil (Foundry)** — Local Ethereum testnet — Already in project; instant block times; supports mainnet forking; no additional installation
- **Bun test** — Unit test runner — Already in use via `bun:test`; native and faster than jest/vitest

**Critical configuration:** Tests must run **sequentially (`workers: 1`)** because Synpress manages a single MetaMask instance that cannot be parallelized across tests.

### Expected Features

Blockchain E2E testing has non-negotiable requirements that differ from traditional web testing. Users (developers) expect reliable tests that pass consistently across environments.

**Must have (table stakes):**

- **Transaction Confirmation Wait** — Blockchain operations are async; `tx.wait(1)` or `waitForTransactionReceipt()` required before assertions
- **On-Chain State Verification** — Trust comes from blockchain; verify `ownerOf(tokenId)` directly, not just PocketBase records
- **Event Parsing** — Mint/transfer outcomes are in events, not return values; parse `EggMinted`, `EggHatched` events from receipt logs
- **Test Account Isolation** — Each test needs clean wallet state; use Anvil's deterministic accounts or create test users per test
- **Extended Timeouts** — Blockchain ops take 30-120 seconds; `test.setTimeout(120000)` for VRF operations

**Should have (competitive):**

- **Multi-Account Setup** — Marketplace buy/sell requires 2+ accounts; commission verification needs 4-level referral chain (G1→G4)
- **Forked Mainnet Testing** — Test against real BSC contract state with Anvil fork without gas costs
- **LINE OAuth Mock** — Inject PocketBase auth directly; bypass external OAuth for speed and reliability

**Defer (v2+):**

- **Real 0xl3 testnet testing** — Pre-deployment validation only; too slow and rate-limited for CI
- **Gas optimization verification** — Track gas costs across flows; useful but not essential for MVP

### Architecture Approach

The recommended architecture places Playwright tests in a dedicated `tests/e2e/` directory with fixtures for auth, blockchain, and PocketBase state. The critical pattern is **Auth Bypass via API Injection**—create test users directly in PocketBase via admin API, generate auth tokens, and inject them into browser cookies. This bypasses LINE OAuth entirely while still testing authenticated flows.

**Major components:**

1. **Auth Fixture** (`tests/e2e/fixtures/auth.fixture.ts`) — Creates test users in PocketBase, injects session state into browser context, cleans up after tests
2. **Blockchain Fixture** (`tests/e2e/fixtures/blockchain.fixture.ts`) — Forks/connects to Anvil, manages deterministic test accounts, deploys mock VRF coordinator
3. **Docker Compose Environment** (`docker-compose.e2e.yml`) — Orchestrates PocketBase, wallet-api, Anvil, and frontend with health checks and proper startup ordering
4. **Flow Tests** (`tests/e2e/flows/*.spec.ts`) — User journey tests for Auth, Mint, Feed, Hatch, Marketplace, Commission, Tier flows

**Multi-layer verification pattern:** For each transaction flow, verify state at each layer:

- Frontend: UI elements visible (`page.getByRole()`, `expect(locator).toBeVisible()`)
- PocketBase: Records created/updated (`request.get()` to collection API)
- wallet-api: Endpoint called successfully (`request.post()` check `success: true`)
- Contract: State change confirmed (RPC `eth_call` or contract read methods)

### Critical Pitfalls

**Top 5 pitfalls with prevention strategies:**

1. **Transaction Timing Race Conditions** — Tests check blockchain results immediately after API call, before confirmation. Prevention: Use polling patterns with timeouts matching blockchain timing (BSC ~3s/block). NEVER use hardcoded `sleep()` delays.

2. **Shared On-Chain State Killing Parallel Testing** — Tests running against same blockchain share wallet addresses and contract state. Prevention: Use Anvil local fork per test OR run tests sequentially with state reset between each.

3. **Gas Sponsorship Wallet Exhaustion** — Platform relayer wallet pays gas for all operations; runs out of BNB during test suites. Prevention: Monitor relayer balance in `beforeAll`, use Anvil fork with `setBalance()` to fund unlimited test gas.

4. **VRF Fulfillment Timeout** — Hatch flow requires Chainlink VRF randomness; real VRF takes 30-60 seconds. Prevention: Deploy `VRFCoordinatorV2Mock` in test environment for deterministic, instant fulfillment.

5. **LINE OAuth Cannot Be Mocked in Static Export** — Static export has no server-side routes to intercept OAuth; real LINE calls required. Prevention: Create test users directly in PocketBase, inject auth token via browser context—bypass OAuth UI entirely.

---

## Implications for Roadmap

Based on research, suggested phase structure addresses dependencies and mitigates pitfalls progressively:

### Phase 1: Test Infrastructure Setup

**Rationale:** Infrastructure is the foundation—without proper test environment, fixtures, and helpers, all subsequent tests will be flaky. Addresses the #1 pitfall (timing race conditions) by establishing polling patterns early.
**Delivers:** Playwright config, Docker Compose environment, auth/blockchain fixtures, transaction wait helpers, test account setup
**Addresses:** Must-have features: Transaction Wait Helper, On-Chain Verification Helper, Test Account Isolation, Timeout Configuration
**Avoids:** Pitfalls 1, 2, 3, 5, 6, 7 (timing, state isolation, gas exhaustion, OAuth mock, RPC rate limiting, contract addresses)

### Phase 2: Auth + Mint Flow Tests

**Rationale:** Auth is prerequisite for all authenticated flows; Mint is simplest transaction flow to validate infrastructure. Together they prove the end-to-end testing framework works.
**Delivers:** Auth flow test (LINE OAuth bypass verification), Mint flow test (buy egg → verify NFT ownership)
**Uses:** Playwright, Synpress (optional for real wallet), Anvil, auth fixture
**Implements:** Auth fixture pattern, multi-layer verification (frontend → PB → contract)

### Phase 3: Feed + Hatch Flow Tests

**Rationale:** Feed flow tests food consumption logic; Hatch introduces VRF complexity. Sequential because Hatch depends on Feed completion (egg must have 10 food).
**Delivers:** Feed flow test, Hatch flow test with VRF mock, food burn verification, rarity distribution testing
**Uses:** Anvil VRF mock deployment, polling patterns for async VRF fulfillment
**Avoids:** Pitfall 9 (VRF mock complexity), Pitfall 8 (ownership timing)

### Phase 4: Marketplace Flow Tests

**Rationale:** Marketplace requires multi-account setup (seller + buyer)—more complex than single-user flows. Tests listing creation, approval, purchase, and ownership transfer.
**Delivers:** Marketplace flow test with 2 accounts, USDT approval handling, listing/purchase verification
**Uses:** Anvil multi-account setup, USDT contract mock
**Avoids:** Pitfall 13 (USDT approval race condition), tests commission triggers

### Phase 5: Commission + Tier Flow Tests

**Rationale:** Most complex flows—Commission needs 4-level referral chain, Tier needs accumulated lifetime stats. Deferred until simpler flows prove infrastructure stability.
**Delivers:** Commission distribution verification, 4-user referral chain setup, Tier badge minting test
**Uses:** PocketBase referral_chain field mocking, multi-account fixture
**Avoids:** Pitfall 10 (commission timing mismatch), verifies MLM logic

### Phase Ordering Rationale

- **Infrastructure first** (Phase 1): Without proper helpers and environment, all tests inherit timing and isolation problems
- **Auth before authenticated flows** (Phase 2): Every subsequent flow requires authenticated session; auth fixture must be proven first
- **Feed before Hatch** (Phase 3): Hatch depends on Feed—cannot hatch without feeding; natural dependency
- **Single-user before multi-user** (Phase 2-3 before 4-5): Multi-account setup is more complex; prove single-user works first
- **Core flows before advanced** (Phases 1-3 before 4-5): Mint/Feed/Hatch are table stakes; Marketplace/Commission are competitive features

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3:** VRF mock deployment and configuration—Chainlink VRF coordinator mock setup needs careful implementation; may need `/gsd-research-phase` for VRFCoordinatorV2Mock patterns
- **Phase 5:** Commission contract integration details—MLM distribution logic is contract-specific; need to verify actual contract implementation for test assertions

Phases with standard patterns (skip research-phase):

- **Phase 1:** Well-documented Playwright/Docker patterns; auth fixture follows standard session injection patterns
- **Phase 2:** Mint flow testing patterns documented in existing contract tests; Synpress patterns from official docs
- **Phase 4:** Marketplace patterns similar to standard NFT transfer testing; multi-account setup follows Anvil deterministic accounts pattern

---

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                                                                  |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Playwright/Synpress verified from official docs (playwright.dev, Synthetixio/synpress); Cyfrin Academy course confirms patterns; version compatibility checked                                                                         |
| Features     | HIGH       | Transaction timing from ethers/wagmi/viem official docs; on-chain verification from Blockscout guide; multi-account setup from Anvil standard practice; timing constants from BSC block times                                          |
| Architecture | HIGH       | Playwright mock patterns from official docs; Docker E2E patterns from established guides; auth fixture from Currents.dev authentication testing guide; project source code analyzed for existing patterns                              |
| Pitfalls     | HIGH       | Base OnchainTestKit blog for wallet testing; Ethereum Stack Exchange for gas estimation; Chainlink docs for VRF mock; web3-mock Playwright integration guide; all sources are primary documentation or established community resources |

**Overall confidence:** HIGH

### Gaps to Address

Areas requiring validation during implementation:

- **LINE OAuth bypass details:** Pattern is established (Auth0 testing), but LINE-specific OAuth flow details may need adjustment. PocketBase hooks for LINE auth should be verified—test user creation may need specific fields matching LINE OAuth expectations.

- **Contract event parsing specifics:** `EggMinted`, `EggHatched` event structures are documented in existing code (`apps/web/lib/contracts/*.ts`), but event argument names/types should be verified against deployed contract during testing setup.

- **Gas sponsorship flow in tests:** Wallet-api uses relayer for gas sponsorship; need to verify relayer private key setup in test environment and that Anvil fork properly simulates gas sponsorship without real BNB.

- **PocketBase-wallet-api synchronization timing:** Events trigger PocketBase sync after blockchain confirmation; polling interval for PocketBase state sync may need tuning based on actual hook processing speed.

---

## Sources

### Primary (HIGH confidence)

- **Playwright Documentation** — playwright.dev/docs/best-practices, playwright.dev/docs/mock — Test patterns, mock API patterns
- **Synpress GitHub** — github.com/Synthetixio/synpress — Wallet automation commands, Playwright integration
- **Wagmi waitForTransactionReceipt** — wagmi.sh/core/api/actions/waitForTransactionReceipt — Transaction timing patterns
- **Ethers.js v6** — docs.ethers.org/v6/ — Transaction handling, event parsing
- **Foundry Book** — book.getfoundry.sh/ — Anvil local testnet, forking patterns
- **Chainlink VRF Docs** — docs.chain.link/vrf/v2/direct-funding/examples/test-locally — VRF mock setup

### Secondary (MEDIUM confidence)

- **Cyfrin Academy** — updraft.cyfrin.io/courses/full-stack-web3-development-crash-course — Synpress + Playwright setup patterns
- **BugBug.io comparison** — bugbug.io/blog/test-automation-tools/cypress-vs-playwright/ — Performance comparison
- **Currents.dev Auth Testing** — currents.dev/posts/testing-authentication-with-playwright-the-complete-guide — Authentication bypass patterns
- **Blockscout NFT Verification** — blog.blockscout.com/minted-nft-not-showing-how-to-verify-onchain/ — On-chain verification patterns

### Project Context (HIGH confidence)

- **apps/web/lib/contracts/\*.ts** — Existing contract interaction patterns, event parsing code
- **wallet-api/server.js** — Gas sponsorship patterns, transaction handling
- **contracts/test/\*.t.sol** — Existing Foundry test patterns
- **apps/web/package.json** — Existing stack (Bun, Testing Library)

---

_Research completed: 2026-04-27_
_Ready for roadmap: yes_

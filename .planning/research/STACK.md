# Stack Research: E2E Flow Testing for NFT Marketplace

**Domain:** Blockchain/NFT Marketplace E2E Testing
**Researched:** 2026-04-27
**Confidence:** HIGH

## Recommended Stack

### Core E2E Testing Technologies

| Technology                | Version   | Purpose                             | Why Recommended                                                                                                                                                                                                                           |
| ------------------------- | --------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **@playwright/test**      | 1.59.1    | Browser automation & E2E UI testing | Industry standard in 2026; 2-4x faster than Cypress; cross-browser (Chromium, Firefox, Safari); multi-tab/window support critical for wallet popup flows; works with static export; Microsoft-backed with active development              |
| **@synthetixio/synpress** | 4.1.2     | MetaMask wallet automation for Web3 | Only mature solution for automating browser wallet extension interactions; extends Playwright with `connectToDapp()`, `confirmTransaction()`, `addNetwork()` commands; handles complex popup flows that standard Playwright cannot access |
| **anvil**                 | (Foundry) | Local Ethereum testnet              | Already in project via Foundry; instant block times; configurable gas; supports mainnet forking for testing against real BSC contracts; no additional installation needed                                                                 |

### Supporting Libraries

| Library                       | Version    | Purpose                   | When to Use                                                                                                                                                    |
| ----------------------------- | ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **msw** (Mock Service Worker) | 2.7.x      | API mocking for E2E tests | When need to mock wallet-api, LINE OAuth, or PocketBase responses; intercepts at network level without modifying app code; works in Playwright browser context |
| **@playwright/test** API mode | (built-in) | API endpoint testing      | For testing wallet-api Express endpoints directly; faster than UI tests for backend validation; already part of Playwright installation                        |
| **vi** (Bun mock)             | (built-in) | Unit test mocking         | Already in use via `bun:test`; use for component-level mocks before E2E layer                                                                                  |

### Development Tools

| Tool                   | Purpose              | Notes                                                                                                                  |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Playwright UI Mode** | Debugging E2E tests  | `bunx playwright test --ui`; time-travel debugging; trace viewer for failed tests; essential for wallet flow debugging |
| **Playwright Codegen** | Generate test code   | `bunx playwright codegen`; records user interactions; helpful for complex wallet flow patterns                         |
| **Trace Viewer**       | Post-mortem analysis | Auto-captured on failure; shows network requests, console logs, DOM snapshots at each step                             |

## Installation

```bash
# Core E2E (add to apps/web/package.json devDependencies)
bun add -D @playwright/test @synthetixio/synpress

# Initialize Playwright
bunx playwright install  # Downloads browser binaries (Chromium, Firefox, WebKit)

# Initialize Synpress cache (MetaMask extension)
bunx synpress  # Creates .cache-synpress/ with MetaMask

# Optional: API mocking
bun add -D msw

# Create test directories
mkdir -p apps/web/e2e apps/web/e2e/wallet-setup
```

**Note:** Do NOT use `bun pm install` for Playwright — browser binary installation requires `playwright install` command.

## Alternatives Considered

| Recommended          | Alternative           | When to Use Alternative                                                                                                                           |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright           | Cypress               | If team prefers real-time visual debugging; if only Chrome/Firefox needed; if simpler test requirements and team less experienced with automation |
| Playwright           | Selenium              | Never — legacy tool, 3x slower, requires WebDriver setup, no auto-wait                                                                            |
| Synpress             | Manual wallet testing | If only 1-2 wallet flows; if Synpress cache issues persist; but manual testing doesn't scale for CI                                               |
| Anvil                | Hardhat Network       | If need Hardhat plugin ecosystem; if team stronger in JS than Solidity; but Anvil is faster and already in project                                |
| Playwright API tests | Bun fetch tests       | For simple API checks; but Playwright API tests integrate with E2E suite, shared reporters, same CI pipeline                                      |

## What NOT to Add

| Avoid                        | Why                                                                                   | Use Instead                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **vitest**                   | Already have Bun test runner; redundant; Bun test is native and faster                | Continue with `bun test` for unit tests                        |
| **jest**                     | Bun handles unit tests natively; jest setup overhead unnecessary                      | `bun:test` imports already in use                              |
| **cypress**                  | Slower; in-browser architecture limits wallet popup handling; no Safari support       | Playwright + Synpress                                          |
| **@testing-library/cypress** | Cypress not recommended for this project                                              | @testing-library/react (already installed) for component tests |
| **hardhat**                  | Foundry already installed and faster; adding Hardhat adds 2 smart contract frameworks | Foundry (forge, anvil) already in use                          |
| **wagmi in tests**           | Framework coupling; E2E should test from user perspective                             | Synpress for wallet interactions at browser level              |

## Stack Patterns by Variant

**If testing flows without real wallet (mocked blockchain):**

- Use Playwright with `page.route()` to intercept contract calls
- Mock `ethers.js` responses at the network level
- Faster but less realistic
- Good for: Auth flows, UI state transitions, non-transactional features

**If testing real wallet flows (production-like):**

- Use Synpress with MetaMask automation
- Connect to Anvil local testnet (`chainId: 31337`)
- Seed test accounts with `anvil --accounts 10`
- Good for: Mint, Feed, Hatch, Marketplace buy/sell, Commission claim

**If testing against BSC testnet (0xl3):**

- Synpress `metamask.addNetwork()` with 0xl3 RPC
- Use test account from `.env.test`
- Slower (real network latency) but validates real contract integration
- Good for: Pre-deployment validation, production smoke tests

**If testing static export on Cloudflare:**

- Serve built app locally: `bunx serve out -p 3000`
- Playwright config: `baseURL: 'http://localhost:3000'`
- Note: Cannot use `webServer` auto-start with static export
- Good for: Production deployment validation

## Version Compatibility

| Package A                    | Compatible With             | Notes                                                                                             |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| @playwright/test@1.59.1      | @synthetixio/synpress@4.1.2 | Synpress 4.x built for Playwright (older versions for Cypress)                                    |
| Playwright                   | Bun runtime                 | Not fully native; runs via Node compatibility layer; startup faster but browser launch same speed |
| Synpress                     | MetaMask 10.34.x            | Synpress caches specific MetaMask version; cache mismatch requires manual rename (see pitfalls)   |
| ethers.js@6.16.0             | Anvil                       | ethers v6 works with any JSON-RPC; Anvil provides standard RPC                                    |
| Next.js@16.1.6 static export | Playwright                  | Fully compatible; serve static files via any HTTP server                                          |

## Configuration Examples

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Sequential for wallet flows
  workers: 1, // Prevent race conditions with single MetaMask

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Comment out firefox/webkit for faster dev
  ],

  // For static export: manually start server
  // webServer: { command: 'bunx serve out -p 3000', ... }
})
```

### e2e/wallet-setup/basic.setup.ts (Synpress)

```typescript
import { defineWalletSetup } from "@synthetixio/synpress"
import { MetaMask } from "@synthetixio/synpress/playwright"

const SEED_PHRASE =
  process.env.TEST_SEED_PHRASE || "test test test test test test test test test test test junk"
const PASSWORD = "Tester@1234"

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD)
  await metamask.importWallet(SEED_PHRASE)

  // Add Anvil network for local testing
  await metamask.addNetwork({
    name: "Anvil Local",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    symbol: "ETH",
  })
})
```

### Mock Strategy for LINE OAuth

```typescript
// e2e/auth/mock-line-oauth.ts
import { test, expect } from "@playwright/test"

test("bypass LINE OAuth for E2E", async ({ page, context }) => {
  // Option 1: Inject test auth token directly
  await context.addCookies([
    { name: "pb_auth", value: "test-token", domain: "localhost", path: "/" },
  ])

  // Option 2: Mock LINE OAuth redirect
  await page.route("https://access.line.me/**", (route) => {
    route.fulfill({
      status: 302,
      headers: { Location: "/auth/line/callback?code=test-code" },
    })
  })

  await page.goto("/dashboard")
  await expect(page.getByText("Welcome")).toBeVisible()
})
```

## Sources

- **Playwright release notes** — https://playwright.dev/docs/release-notes — Verified 1.59.1 features (Timeline, Speedboard, UI mode improvements)
- **Synpress documentation** — https://github.com/Synthetixio/synpress — Verified Playwright integration, MetaMask commands
- **Cyfrin Academy** — https://updraft.cyfrin.io/courses/full-stack-web3-development-crash-course — Synpress + Playwright setup patterns, wallet automation
- **BugBug.io comparison** — https://bugbug.io/blog/test-automation-tools/cypress-vs-playwright/ — Playwright 2-4x faster, cross-browser advantage
- **BrowserStack Bun guide** — https://www.browserstack.com/guide/bun-playwright — Bun + Playwright compatibility notes
- **Foundry book** — https://book.getfoundry.sh/ — Anvil local testnet documentation
- **Project files** — apps/web/package.json, apps/backend/package.json, contracts/README.md — Verified existing stack (Bun, Testing Library, Foundry)

---

_Stack research for: E2E Flow Testing (NFT Marketplace on BSC)_
_Researched: 2026-04-27_

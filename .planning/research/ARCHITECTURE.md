# Architecture Research: E2E Testing Integration

**Domain:** Multi-service NFT Marketplace with Blockchain
**Researched:** 2026-04-27
**Confidence:** HIGH

## Existing Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16 Static Export)                   │
│                         Cloudflare Pages Hosting                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │Dashboard│  │  Eggs   │  │ Market  │  │ Animals │        │
│  │  Pages  │  │  Pages  │  │  Pages  │  │  Pages  │  │  Pages  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │            │              │
│       └────────────┴────────────┴────────────┴────────────┘              │
│                           │                                              │
│   ┌───────────────────────┼───────────────────────────────────┐         │
│   │           PocketBase Client SDK (pocketbase.js)           │         │
│   └───────────────────────┬───────────────────────────────────┘         │
└────────────────────────────┼────────────────────────────────────────────┘
                             │ HTTP API
┌────────────────────────────┼────────────────────────────────────────────┐
│                      POCKETBASE BACKEND (Docker)                         │
│                       pb.eggoworld.io:8090                               │
│  ┌───────────────────────┴───────────────────────────────────┐         │
│  │              Collections + Hooks + OAuth                   │         │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │         │
│  │  │ users   │  │egg_nfts │  │food_nfts│  │ listings│        │         │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │         │
│  └───────┼────────────┼────────────┼────────────┼─────────────┘         │
│          │            │            │            │                        │
│  ┌───────┴────────────┴────────────┴────────────┴───────────────┐       │
│  │                 PocketBase Hooks (Go/JS)                      │       │
│  │  - OnRecordCreate: Call wallet-api for mint operations       │       │
│  │  - OnRecordUpdate: Sync blockchain state                     │       │
│  │  - LINE OAuth integration                                     │       │
│  └─────────────────────────────┬────────────────────────────────┘       │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │ HTTP API
┌────────────────────────────────┼────────────────────────────────────────┐
│                     WALLET-API (Express.js)                              │
│                        localhost:3001                                    │
│  ┌─────────────────────────────┴───────────────────────────────────┐   │
│  │                 Blockchain Operations                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │/mint-egg│  │mint-food│  │feed-egg │  │buy-nft  │              │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘              │   │
│  └───────┼────────────┼────────────┼────────────┼────────────────────┘   │
│          │            │            │            │                        │
│  ┌───────┴────────────┴────────────┴────────────┴───────────────────┐   │
│  │  Gas Sponsorship (Relayer Wallet) + AES-256-GCM Key Management   │   │
│  └──────────────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────────────┼────────────────────────────────────┘
                                      │ ethers.js RPC
┌─────────────────────────────────────┼────────────────────────────────────┐
│                    SMART CONTRACTS (Foundry)                              │
│              0xl3 Testnet (Chain ID 7117) / BSC Mainnet                   │
│  ┌──────────────────────────────────┴────────────────────────────────┐   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │EggNFT   │  │FoodNFT  │  │AnimalNFT│  │Market   │  │Commission│  │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │   │
│  └──────┴───────────┴───────────┴───────────┴───────────┴───────────┘   │   │
│                                                                         │   │
│  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │          Foundry Test Suite (Anvil Local Testnet)                 │   │   │
│  │          contracts/test/*.t.sol (Chain ID 31337)                  │   │   │
│  └──────────────────────────────────────────────────────────────────┘   │   │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                       │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐     │
│  │ LINE OAuth  │  │ 0xl3 RPC: https://rpc.0xl3.com                  │     │
│  │ (External)  │  │ BSC RPC: https://bsc-dataseed.binance.org       │     │
│  └─────────────┘  └─────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘
```

## Recommended E2E Test Architecture

### Test Runner Location

**Recommendation:** Playwright in monorepo root (`tests/e2e/`)

```
eggo-pocketbase/
├── tests/
│   ├── e2e/                    # Playwright E2E tests (NEW)
│   │   ├── playwright.config.ts
│   │   ├── fixtures/           # Test fixtures (auth, blockchain)
│   │   │   ├── auth.fixture.ts
│   │   │   ├── blockchain.fixture.ts
│   │   │   └── pocketbase.fixture.ts
│   │   ├── mocks/              # External service mocks
│   │   │   ├── line-oauth.mock.ts
│   │   │   ├── rpc.mock.ts
│   │   │   └── wallet-api.mock.ts
│   │   ├── flows/              # User flow tests
│   │   │   ├── auth-flow.spec.ts
│   │   │   ├── mint-flow.spec.ts
│   │   │   ├── feed-hatch-flow.spec.ts
│   │   │   ├── marketplace-flow.spec.ts
│   │   │   ├── commission-flow.spec.ts
│   │   │   ├── tier-flow.spec.ts
│   │   │   └── breeding-flow.spec.ts
│   │   ├── integration/        # Cross-service verification
│   │   │   ├── frontend-to-pb.spec.ts
│   │   │   ├── pb-to-wallet-api.spec.ts
│   │   │   └── wallet-api-to-contract.spec.ts
│   │   └── setup/              # Test environment setup
│   │       ├── setup-project.ts
│   │       ├── seed-test-data.ts
│   │       └── teardown.ts
│   └── integration/            # Existing integration tests
│       └── tools/
├── apps/
│   ├── web/                    # Existing bun:test unit tests
│   └── backend/                # Existing bun:test PocketBase tests
├── wallet-api/                 # Express API (integration test target)
└── contracts/                  # Foundry tests (Anvil local testnet)
    └── test/
        ├── AnvilIntegration.t.sol
        ├── FoodNFTAnvilIntegration.t.sol
        └── EggFeedingAnvilIntegration.t.sol
```

### Component Responsibilities

| Component                  | Responsibility                                 | Implementation                                   |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| **Playwright Test Runner** | Browser automation, cross-service verification | `tests/e2e/` with `playwright.config.ts`         |
| **Auth Fixture**           | Mock LINE OAuth, inject session state          | `fixtures/auth.fixture.ts` (API-based setup)     |
| **Blockchain Fixture**     | Fork/Anvil connection, contract mocking        | `fixtures/blockchain.fixture.ts` (optional fork) |
| **PocketBase Fixture**     | Test DB seeding, cleanup                       | `fixtures/pocketbase.fixture.ts`                 |
| **Setup Project**          | Pre-test environment initialization            | Playwright setup project pattern                 |
| **Flow Tests**             | User journey verification                      | `flows/*.spec.ts`                                |
| **Integration Tests**      | Cross-service boundary checks                  | `integration/*.spec.ts`                          |

## Architectural Patterns

### Pattern 1: Auth Bypass via API Injection

**What:** Inject authentication state directly into browser context, bypassing LINE OAuth UI flow.

**Why:** External OAuth providers are unreliable in E2E tests (rate limits, network latency, CAPTCHA). Speed up tests by skipping real OAuth.

**Implementation:**

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base } from "@playwright/test"

type AuthFixture = {
  authenticatedPage: Page
  testUser: { id: string; wallet: string }
}

export const test = base.extend<AuthFixture>({
  // Create authenticated page by injecting session
  authenticatedPage: async ({ page, request }, use) => {
    // 1. Create test user directly in PocketBase via API
    const testUser = await createTestUser(request)

    // 2. Get PocketBase auth token via admin API
    const authResponse = await request.post(`${PB_URL}/api/admins/auth-with-password`, {
      data: { email: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD },
    })
    const adminToken = authResponse.json().token

    // 3. Generate auth token for test user
    const userAuthResponse = await request.post(`${PB_URL}/api/collections/users/auth`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: testUser.id },
    })
    const userToken = userAuthResponse.json().token

    // 4. Inject auth state into browser context
    await page.context().addCookies([
      {
        name: "pb_auth",
        value: JSON.stringify({ token: userToken, record: testUser }),
        domain: "localhost",
        path: "/",
      },
    ])

    await use(page, testUser)

    // 5. Cleanup: Delete test user
    await cleanupTestUser(request, testUser.id)
  },
})
```

**Trade-offs:**

- ✅ Fast: No UI login flow, ~100ms vs 5-15 seconds
- ✅ Reliable: No external OAuth dependency
- ✅ Isolated: Each test gets fresh user state
- ⚠ Requires PocketBase admin access
- ⚠ Needs separate test for actual LINE OAuth UI flow

### Pattern 2: Mock External Dependencies with `page.route()`

**What:** Intercept and mock network requests to external services (LINE OAuth, RPC endpoints).

**Why:** Control responses, avoid rate limits, test edge cases (failures, timeouts).

**Implementation:**

```typescript
// tests/e2e/mocks/line-oauth.mock.ts
export async function mockLINEOAuth(page: Page) {
  // Intercept LINE OAuth callback
  await page.route("**/api/oauth2-redirect**", async (route) => {
    // Fulfill with mock auth response
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        token: "mock-line-token",
        user: {
          id: "mock-line-user-id",
          name: "Test User",
          picture: "https://example.com/avatar.png",
        },
      }),
    })
  })

  // Intercept LINE Login button click redirect
  await page.route("**/access.line.me/oauth2/v2.1/authorize**", async (route) => {
    // Redirect directly to callback URL with mock code
    await route.fulfill({
      status: 302,
      headers: {
        Location: `${PB_URL}/api/oauth2-redirect?code=test-code&state=test-state`,
      },
    })
  })
}

// tests/e2e/mocks/rpc.mock.ts
export async function mockRPCResponses(page: Page, mockResponses: Record<string, any>) {
  await page.route("**/rpc.0xl3.com**", async (route) => {
    const request = route.request()
    const body = request.postDataJSON()

    // Match method and return mock response
    if (body.method === "eth_call" && mockResponses[body.params[0]]) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: mockResponses[body.params[0]],
        }),
      })
    } else {
      // Pass through to real RPC for unmocked calls
      await route.continue()
    }
  })
}
```

**Trade-offs:**

- ✅ Complete control over external responses
- ✅ Can test failure scenarios (timeout, error)
- ✅ No rate limiting concerns
- ⚠ Requires maintaining mock responses synced with real API
- ⚠ Some calls should pass through (use `route.continue()`)

### Pattern 3: Docker Compose Test Environment

**What:** Run entire test stack via Docker Compose for reproducible environments.

**Why:** Isolated, clean state per run, CI/CD consistency, service dependency management.

**Implementation:**

```yaml
# docker-compose.e2e.yml
version: "3.8"

services:
  # Infrastructure
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    environment:
      - PB_ADMIN_EMAIL=test@test.com
      - PB_ADMIN_PASSWORD=testpass
    ports:
      - "8090:8090"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/api/health"]
      interval: 3s
      timeout: 3s
      retries: 10
    volumes:
      - pb_test_data:/pb_data

  wallet-api:
    build:
      context: ./wallet-api
      dockerfile: Dockerfile
    environment:
      - POCKETBASE_URL=http://pocketbase:8090
      - RPC_URL=http://anvil:8545
      - WALLET_MASTER_KEY=test-master-key
      - RELAYER_PRIVATE_KEY=test-relayer-key
      - PB_ADMIN_EMAIL=test@test.com
      - PB_ADMIN_PASSWORD=testpass
      - CHAIN_ID=31337
    depends_on:
      pocketbase:
        condition: service_healthy
      anvil:
        condition: service_started
    ports:
      - "3001:3001"

  anvil:
    image: ghcr.io/foundry-rs/foundry:latest
    command: ["anvil", "--chain-id", "31337", "--port", "8545"]
    ports:
      - "8545:8545"

  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.test
      args:
        - NEXT_PUBLIC_PB_URL=http://pocketbase:8090
        - NEXT_PUBLIC_WALLET_API_URL=http://wallet-api:3001
    depends_on:
      wallet-api:
        condition: service_started
    ports:
      - "3000:3000"

  playwright:
    build:
      context: ./tests/e2e
      dockerfile: Dockerfile.playwright
    environment:
      - BASE_URL=http://frontend:3000
      - PB_URL=http://pocketbase:8090
      - WALLET_API_URL=http://wallet-api:3001
      - RPC_URL=http://anvil:8545
    depends_on:
      frontend:
        condition: service_started
    volumes:
      - ./test-results:/app/results

volumes:
  pb_test_data:
```

**Trade-offs:**

- ✅ 100% reproducible across environments
- ✅ Automatic cleanup via ephemeral volumes
- ✅ Service health checks ensure proper startup order
- ⚠ Slower startup than local (Docker overhead)
- ⚠ Requires Docker setup maintenance

### Pattern 4: Multi-Layer Verification

**What:** Verify state across all layers (frontend → PocketBase → wallet-api → contract) in single test.

**Why:** Catch data synchronization bugs between layers.

**Implementation:**

```typescript
// tests/e2e/integration/mint-flow.spec.ts
test("mint egg: verify across all layers", async ({ authenticatedPage, request }) => {
  const testUser = authenticatedPage.testUser

  // Step 1: UI Action - Click mint button
  await authenticatedPage.goto("/eggs")
  await authenticatedPage.getByRole("button", { name: "Mint Egg" }).click()

  // Step 2: Wait for UI update
  await authenticatedPage.waitForSelector('[data-testid="new-egg-card"]')

  // Step 3: Verify PocketBase state
  const pbResponse = await request.get(`${PB_URL}/api/collections/egg_nfts/records`, {
    params: { filter: `owner="${testUser.id}"` },
  })
  const pbData = pbResponse.json()
  expect(pbData.items.length).toBeGreaterThan(0)
  const eggRecord = pbData.items[0]

  // Step 4: Verify wallet-api logs (optional: check endpoint directly)
  const walletApiHealth = await request.get(`${WALLET_API_URL}/health`)
  expect(walletApiHealth.ok).toBeTruthy()

  // Step 5: Verify contract state (via wallet-api query or direct RPC)
  // For testnet fork, query contract directly
  const contractResponse = await request.post(`${RPC_URL}`, {
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: EGG_NFT_ADDRESS,
          data: "0x...", // ownerOf(uint256) calldata
        },
        "latest",
      ],
    },
  })

  // Owner should match test user's wallet address
  expect(contractResponse.json().result).toContain(testUser.wallet.toLowerCase())
})
```

**Trade-offs:**

- ✅ Full system verification
- ✅ Catches sync bugs between layers
- ⚠ More complex test setup
- ⚠ Higher test execution time

## Test Flow Strategy

### User Flow Tests (P0 - Critical Path)

| Flow                                 | Test Strategy                                                                | External Dependencies |
| ------------------------------------ | ---------------------------------------------------------------------------- | --------------------- |
| Auth (LINE OAuth → Dashboard)        | **Mock LINE OAuth** via `page.route()`, verify session state in PocketBase   | LINE OAuth mocked     |
| Mint (Buy egg → NFT appears)         | Real wallet-api call to Anvil testnet, verify PB record + contract ownership | Anvil local testnet   |
| Feed (Buy food → Feed egg → 10/10)   | Real wallet-api calls, verify PB food_count update                           | Anvil local testnet   |
| Hatch (Feed 10 → Hatch → Animal)     | Real contract interactions, verify Animal NFT mint                           | Anvil local testnet   |
| Marketplace (List → Buy → Transfer)  | Real listing creation, mock or real buy depending on complexity              | Anvil + PB hooks      |
| Commission (Referral → Earn → Claim) | Mock referral tree, verify commission distribution                           | PB + Anvil            |
| Tier (Consume → Threshold → Badge)   | Mock tier thresholds, verify badge mint                                      | PB + Anvil            |

### Test Environment Modes

| Mode                 | Use Case                 | Configuration                                        |
| -------------------- | ------------------------ | ---------------------------------------------------- |
| **Full Mock**        | Fast CI, unit-like tests | All external services mocked via `page.route()`      |
| **Hybrid**           | Recommended default      | LINE OAuth mocked, Anvil testnet for blockchain      |
| **Full Integration** | Production validation    | Real 0xl3 testnet, real LINE OAuth (staging account) |

### Recommended Default: Hybrid Mode

```typescript
// playwright.config.ts - Hybrid mode
export default defineConfig({
  projects: [
    // Setup: Seed test data
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Main tests: Hybrid mode
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
      dependencies: ["setup"],
    },
  ],
  // Global setup for Anvil + PocketBase
  globalSetup: require.resolve("./setup/global-setup"),
  globalTeardown: require.resolve("./setup/global-teardown"),
})
```

## Data Flow Verification Points

### Request Flow

```
[User Clicks Mint]
    ↓
[Frontend] → PocketBase Client SDK → [PocketBase Hook]
    ↓              ↓                      ↓
[UI Update] ← Collection Record ← [OnRecordCreate Hook]
    ↓                                     ↓
    └───→ wallet-api POST /mint-egg ←────┘
                    ↓
            [ethers.js Contract Call]
                    ↓
            [Anvil/0xl3 RPC Node]
                    ↓
            [Contract Execution]
                    ↓
            [Event Emitted] → [PocketBase Sync]
                    ↓
            [Frontend Poll/Update]
```

### Key Verification Points

| Layer      | Check                             | Method                                              |
| ---------- | --------------------------------- | --------------------------------------------------- |
| Frontend   | Button state, UI elements         | `page.getByRole()`, `expect(locator).toBeVisible()` |
| PocketBase | Record created/updated            | `request.get()` to collection API                   |
| wallet-api | Endpoint called, response success | `request.post()`, check `success: true`             |
| Contract   | State change, ownership           | RPC `eth_call` or contract read methods             |
| Sync       | Data consistency across layers    | Compare IDs, timestamps between PB and contract     |

## Anti-Patterns to Avoid

### Anti-Pattern 1: Real LINE OAuth in Every Test

**What people do:** Click through LINE Login UI in every E2E test.

**Why it's wrong:**

- External OAuth is rate-limited
- UI flow takes 5-15 seconds per test
- CAPTCHA/email verification breaks tests
- Cannot control edge cases (expired token, network failure)

**Do this instead:**

- Inject auth state via API (see Pattern 1)
- Have ONE dedicated test for LINE OAuth UI flow validation
- Mock LINE OAuth for all other feature tests

### Anti-Pattern 2: Real 0xl3 Testnet for CI Tests

**What people do:** Use real 0xl3 testnet RPC in CI E2E tests.

**Why it's wrong:**

- Testnet has variable latency
- Block confirmations take 12+ blocks
- Testnet faucet limits (limited test USDT)
- Rate limiting from RPC provider

**Do this instead:**

- Use Anvil local testnet (chain ID 31337)
- Fork 0xl3 if needed for existing contract state
- Seed unlimited test tokens via Anvil

### Anti-Pattern 3: Shared Test User Across Tests

**What people do:** Create one test user account, reuse in all tests.

**Why it's wrong:**

- Tests modify state (buy NFTs, feed eggs)
- Parallel tests conflict (same wallet balance)
- Race conditions in shared state

**Do this instead:**

- Create isolated test user per test via fixture
- Use worker-scoped fixtures for parallel isolation
- Cleanup test user after each test

### Anti-Pattern 4: Skipping Backend Verification

**What people do:** Only check frontend UI, ignore PocketBase/wallet-api state.

**Why it's wrong:**

- UI may show stale data while backend differs
- Sync bugs between layers go undetected
- Contract ownership mismatches hidden

**Do this instead:**

- Verify at each layer (frontend → PB → wallet-api → contract)
- Check data consistency across services
- Use multi-layer verification pattern

### Anti-Pattern 5: Static Export Incompatibility

**What people do:** Run E2E tests against `next dev` server instead of production build.

**Why it's wrong:**

- Static export has different behavior (no server-side routes)
- Hydration behavior differs
- Middleware/routing may differ

**Do this instead:**

- Run tests against `next build && next export && next start` (or static server)
- Use `output: 'export'` compatible configuration
- Test both dev and production modes separately

## Integration Points

### External Services Mocking Strategy

| Service          | Mock Strategy                        | When to Mock      | When to Use Real              |
| ---------------- | ------------------------------------ | ----------------- | ----------------------------- |
| LINE OAuth       | `page.route()` redirect interception | All feature tests | One auth flow validation test |
| 0xl3 RPC         | Anvil local testnet OR RPC mock      | CI/Dev tests      | Production validation         |
| BSC RPC          | Fork via Anvil OR mock               | CI tests          | Pre-production testing        |
| Cloudflare Pages | Local static server                  | All tests         | Deployment verification       |

### Internal Service Communication

| Boundary                | Test Coverage                      | Notes                          |
| ----------------------- | ---------------------------------- | ------------------------------ |
| Frontend ↔ PocketBase   | Frontend tests + Integration tests | Client SDK calls, auth cookies |
| PocketBase ↔ wallet-api | Hook tests + Integration tests     | HTTP calls in hooks            |
| wallet-api ↔ Contracts  | wallet-api tests + Foundry tests   | ethers.js calls                |
| Contracts ↔ Events      | Foundry tests + Integration tests  | Event emission                 |

## New vs Modified Components

### New Components (Test Infrastructure)

| Component                | Location              | Purpose                     |
| ------------------------ | --------------------- | --------------------------- |
| `playwright.config.ts`   | `tests/e2e/`          | Playwright configuration    |
| `auth.fixture.ts`        | `tests/e2e/fixtures/` | Auth state injection        |
| `blockchain.fixture.ts`  | `tests/e2e/fixtures/` | Anvil/testnet connection    |
| `pocketbase.fixture.ts`  | `tests/e2e/fixtures/` | PB test data seeding        |
| `line-oauth.mock.ts`     | `tests/e2e/mocks/`    | LINE OAuth interception     |
| `setup-project.ts`       | `tests/e2e/setup/`    | Pre-test initialization     |
| `docker-compose.e2e.yml` | Root                  | Test environment definition |
| `Dockerfile.playwright`  | `tests/e2e/`          | Playwright container        |

### Modified Components

| Component                  | Location | Changes                                 |
| -------------------------- | -------- | --------------------------------------- |
| `apps/web/package.json`    | Existing | Add Playwright devDependency            |
| `apps/web/next.config.mjs` | Existing | Ensure static export compatibility      |
| `wallet-api/server.js`     | Existing | Add `/test/seed` endpoint for test data |
| `apps/backend/pb_hooks/`   | Existing | Add test-mode hooks if needed           |

### Build Order

```
1. Install Playwright: npm install -D @playwright/test
2. Create test infrastructure (config, fixtures, mocks)
3. Add test endpoints to services (seed, cleanup)
4. Create docker-compose.e2e.yml
5. Write flow tests
6. CI integration (GitHub Actions workflow)
```

## Scaling Considerations

| Scale      | Architecture Adjustments                                     |
| ---------- | ------------------------------------------------------------ |
| 10 tests   | Local Anvil + simple mocks sufficient                        |
| 50 tests   | Worker-scoped fixtures, Docker Compose recommended           |
| 100+ tests | Dedicated test database, parallel workers, sharded test runs |

### Scaling Priorities

1. **First bottleneck:** Test execution time → Parallel workers with isolated fixtures
2. **Second bottleneck:** Test data conflicts → Dedicated test PocketBase instance
3. **Third bottleneck:** Blockchain wait times → Mock contract responses for UI tests

## Sources

- Playwright Documentation: https://playwright.dev/docs/best-practices (HIGH confidence)
- Playwright Mock APIs: https://playwright.dev/docs/mock (HIGH confidence)
- Next.js Testing with Playwright: https://nextjs.org/docs/pages/guides/testing/playwright (HIGH confidence)
- Testing Authentication with Playwright: https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide (HIGH confidence)
- Docker E2E Testing: https://oneuptime.com/blog/post/2026-02-08-how-to-use-docker-for-end-to-end-testing-environments/view (HIGH confidence)
- Ethereum Smart Contract Testing: https://ethereum.org/developers/docs/smart-contracts/testing/ (HIGH confidence)
- Project source code analysis (wallet-api/server.js, apps/web/next.config.mjs, contracts/foundry.toml) (HIGH confidence)

---

_Architecture research for: E2E Testing Integration_
_Researched: 2026-04-27_

# TDG Configuration - EggoWorld

NFT Membership System with LINE OAuth and EVM Wallet Integration

## Modules

| Module | Path | Tech Stack | Test Status |
|--------|------|------------|-------------|
| Web | `apps/web/` | Next.js 16 + React 19 + Bun | ✅ Configured |
| Backend | `apps/backend/` | PocketBase (Go) + pb_hooks | ✅ Hooks Testable |
| Wallet API | `wallet-api/` | Express.js + ethers | ✅ Configured |
| Contracts | `contracts/` | Foundry + Solidity 0.8.20 | ✅ Configured |

---

# Module: Web (`apps/web/`)

## Project Information
- Language: TypeScript
- Framework: Next.js 16 (App Router)
- Test Framework: bun:test + Testing Library
- Runtime: Bun

## Build Command
```bash
cd apps/web && bun run build
```

## Test Commands

**Initial Setup (run once):**
```bash
cd apps/web && bun add -d @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Run All Tests:**
```bash
cd apps/web && bun test
```

**Run Single Test File:**
```bash
cd apps/web && bun test app/auth/login/login.test.ts
```

**Run Tests in Watch Mode:**
```bash
cd apps/web && bun test --watch
```

**Run Tests with Coverage:**
```bash
cd apps/web && bun test --coverage
```

## Test File Patterns
- Integration tests: `**/*.test.{ts,tsx}`
- Component tests: `app/**/*.test.tsx`
- Hook tests: `hooks/**/*.test.ts`
- File content tests: `app/**/{name}.test.ts`
- E2E tests: `e2e/**/*.spec.ts`

## Module-Specific Conventions

### React Patterns
- Functional components with TypeScript
- App Router (not Pages Router)
- Server Components by default, 'use client' directive for client components
- shadcn/ui components with Tailwind CSS
- Radix UI primitives

### State Management
- React Hook Form for forms with Zod validation
- PocketBase SDK for authentication
- React Context for UI state
- URL state with useSearchParams

### Testing Patterns
- Testing Library for component testing (semantic locators)
- bun:test as test runner (Jest-compatible API)
- Test component interactions, not implementation details
- Use `screen.getByRole()`, `screen.getByText()`, `screen.getByTestId()`
- Mock PocketBase SDK calls with `vi.mock()` or `bun.mock()`

### Test File Structure
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'bun:test'
import userEvent from '@testing-library/user-event'

describe('ComponentName', () => {
  it('renders correctly', () => {})
  it('handles user interactions', () => {})
  it('shows error states', () => {})
})
```

## References
- `apps/web/README.md` - Module documentation
- `docs/plan/line-oauth-implementation-summary.md` - LINE OAuth implementation guide

---

# Module: Wallet API (`wallet-api/`)

## Project Information
- Language: JavaScript (Node.js)
- Framework: Express.js
- Dependencies: ethers, cors, dotenv
- Test Framework: bun:test

## Build Command
```bash
# No build required - run directly
bun wallet-api/server.js
```

## Test Commands

**Initial Setup (run once):**
```bash
cd wallet-api && bun add -d bun:test supertest
```

**Run All Tests:**
```bash
cd wallet-api && bun test
```

**Run Single Test File:**
```bash
cd wallet-api && bun test server.test.js
```

**Run Tests in Watch Mode:**
```bash
cd wallet-api && bun test --watch
```

## Test File Patterns
- API tests: `*.test.js`
- Integration tests: `*.integration.test.js`
- Test directory: `wallet-api/`

## API Endpoints
- `GET /health` - Health check
- `POST /api/wallet/create` - Create single wallet
- `POST /api/wallet/batch` - Batch create wallets

## Module-Specific Conventions

### Testing Patterns
- supertest for HTTP assertions
- Test API endpoints end-to-end
- Mock ethers wallet creation if needed
- Validate request/response schemas

### Test File Structure
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import request from 'supertest'
import app from './server.js'

describe('Wallet API', () => {
  describe('POST /api/wallet/create', () => {
    it('creates a new wallet', async () => {})
    it('returns error for invalid request', async () => {})
  })
})
```

## References
- `wallet-api/README.md` - API documentation

---

# Module: Backend (`apps/backend/`)

## Project Information
- Type: PocketBase (Go binary)
- Hooks: `pb_hooks/` - JavaScript hooks for wallet creation
- Frontend: `pb_public/` - Simple HTML files (fallback)
- Test Approach: Test pb_hooks JavaScript logic

## Commands
```bash
# Start via Docker
cd apps/backend && docker compose up -d

# Or run PocketBase directly
./pocketbase serve --publicDir ./pb_public
```

## Test Commands

**pb_hooks Testing:**
```bash
# Run PocketBase with hooks loaded
cd apps/backend && ./pocketbase serve --publicDir ./pb_public

# Test hooks via API calls (manual or automated)
curl -X POST http://localhost:8090/api/...
```

**Integration Test Setup:**
```bash
# Start test database
cd apps/backend && docker compose up -d

# Run integration tests against running instance
cd apps/backend && bun test pb_hooks/*.test.js
```

## Test File Patterns
- Hook tests: `pb_hooks/**/*.test.js`
- Integration tests: `tests/**/*.test.js`

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/collections/users/auth-with-oauth2` - OAuth login
- `GET /_/` - Admin UI

## Module-Specific Conventions

### pb_hooks Patterns
- JavaScript hooks triggered by PocketBase events
- Wallet creation on user signup
- NFT minting logic
- LINE OAuth integration

### Testing Patterns
- Test hooks by triggering PocketBase events
- Validate wallet creation side effects
- Assert NFT ownership records
- Mock external API calls (LINE, blockchain)

## References
- `apps/backend/README.md` - Backend documentation
- `apps/backend/docs/` - API documentation

---

# Module: Contracts (`contracts/`)

## Project Information
- Language: Solidity 0.8.20
- Framework: Foundry
- Test Framework: Forge (built-in)
- Dependencies: OpenZeppelin Contracts

## Build Command
```bash
cd contracts && forge build
```

## Test Commands

**Run All Tests:**
```bash
cd contracts && forge test
```

**Run Single Test File:**
```bash
cd contracts && forge test --match-path test/Counter.t.sol
```

**Run Specific Test Function:**
```bash
cd contracts && forge test --match-test testFunctionName
```

**Run Tests with Gas Reports:**
```bash
cd contracts && forge test --gas-report
```

**Run Tests Verbosely:**
```bash
cd contracts && forge test -vvv
```

**Run Tests with Coverage:**
```bash
cd contracts && forge coverage
```

## Test File Patterns
- Test files: `*.t.sol`
- Test directory: `contracts/test/`
- Script files: `contracts/script/*.sol`

## Module-Specific Conventions

### Contract Structure
- `src/` - Smart contract source files
- `test/` - Forge test files
- `script/` - Deployment scripts
- `lib/` - Dependencies (OpenZeppelin, etc.)

### Testing Patterns
- Inherit `Test` contract from Foundry
- Use `setUp()` for test fixtures
- Use `vm.*` cheatcodes for mocking and manipulation
- Test success, failure, and edge cases
- Gas optimization testing with `--gas-report`

### Test File Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }
}
```

### Deployment Scripts
- Use `forge script` for deployments
- Support multiple networks (BSC, Ethereum, Polygon)
- Store deployment artifacts in `broadcast/`

### Common Commands
```bash
# Format contracts
forge fmt

# Lint contracts
forge fmt --check

# Take gas snapshot
forge snapshot

# Deploy to network
forge script script/Deploy.s.sol --rpc-url <url> --private-key <key>

# Verify on Etherscan
forge verify-contract <address> <contract> --chain-id <id>
```

## References
- `contracts/README.md` - Foundry documentation
- `contracts/foundry.toml` - Foundry configuration
- https://book.getfoundry.sh/ - Foundry book

---

## TDG Workflow

TDG follows Red-Green-Refactor cycle:

1. **RED**: Write failing tests
   ```bash
   cd <module> && bun test
   ```

2. **GREEN**: Implement code to pass tests
   - Write minimal code to make tests pass
   - Run tests frequently

3. **REFACTOR**: Optimize and clean up
   - Improve code quality
   - Ensure tests still pass

## Quick Start

**For Web module:**
```bash
cd apps/web
bun add -d bun:test @testing-library/react @testing-library/jest-dom jsdom
bun test
```

**For Wallet API:**
```bash
cd wallet-api
bun add -d bun:test supertest
bun test
```

**For Backend (pb_hooks):**
```bash
cd apps/backend
# Start PocketBase first, then test hooks via API
docker compose up -d
```

**For Contracts module:**
```bash
cd contracts
forge build
forge test
forge test --gas-report  # With gas analysis
```

**For Web module (Egg NFT features):**
```bash
cd apps/web
bun run dev              # Start dev server
bun test                 # Run tests
bun test EggCard.test.tsx # Run specific test
```

---

# Phase 3: Frontend Integration - COMPLETE ✅

## Files Created

### Pages:
- `apps/web/app/mint/page.tsx` - Egg NFT minting page
- `apps/web/app/dashboard/eggs/page.tsx` - User's egg collection dashboard
- `apps/web/app/dashboard/commissions/page.tsx` - Commission earnings dashboard

### Components:
- `apps/web/components/egg-nft/EggCard.tsx` - Egg NFT display card
- `apps/web/components/egg-nft/ReferralChainDisplay.tsx` - Referral chain visualization
- `apps/web/components/egg-nft/CommissionBreakdown.tsx` - Commission distribution display
- `apps/web/components/egg-nft/MintButton.tsx` - Mint action button with validation

### Hooks:
- `apps/web/hooks/use-egg-nft.ts` - Egg NFT contract interaction hook

### Tests:
- `apps/web/components/egg-nft/EggCard.test.tsx` - EggCard component tests

## Features Implemented

### Mint Page (`/mint`):
- ✅ Display mint price (25 USDT)
- ✅ Show user's USDT balance with progress bar
- ✅ Referrer ID input (optional)
- ✅ Mint button with loading/success states
- ✅ Balance validation
- ✅ Success modal with redirect to eggs dashboard
- ✅ Error handling and display

### Eggs Dashboard (`/dashboard/eggs`):
- ✅ Grid view of user's Egg NFTs
- ✅ Stats: total eggs, hatched count, food NFTs, total value
- ✅ EggCard component with:
  - Token ID and rarity badge (Common/Uncommon/Rare/Epic/Legendary)
  - Food count display (0-10)
  - Hatch status indicator
  - Mint date
  - Referral chain viewer
  - Hatch button (if not hatched)
- ✅ Empty state with mint CTA
- ✅ Refresh after hatching

### Commissions Dashboard (`/dashboard/commissions`):
- ✅ Pending commission balance
- ✅ Total earned display
- ✅ Earnings breakdown by level (G1-G4)
- ✅ Claim button with transaction status
- ✅ Commission history list
- ✅ Real-time balance updates

### useEggNft Hook:
- ✅ `mintEgg(referrerId)` - Mint new Egg NFT
- ✅ `getEggProperties(tokenId)` - Fetch egg data
- ✅ `getCommissionBalance(address)` - Get pending commissions
- ✅ `claimCommission()` - Claim earned commissions
- ✅ `getUserEggs(userId)` - List user's eggs
- ✅ `getUserCommissions(userId)` - List commission records

## Design System Alignment

### Visual Style:
- Pixel art aesthetic with retro gaming vibes
- Font: Press Start 2P (Google Fonts)
- Colors: Space blue (#1a1a2e), Yellow (#facc15), Navy (#0f3460), Red (#e94560)
- Border style: 4px solid borders with primary color
- Icons: Lucide Icons (Egg, Coins, Wallet, Flame)

### UI Components Used:
- shadcn/ui primitives (Card, Button, Badge, Input, Progress, Alert)
- Tailwind CSS 4 for styling
- Custom pixel font for headings
- Animate.css for subtle animations

### Responsive Design:
- Mobile-first approach
- Grid layouts adapt to screen size (1/2/3/4 columns)
- Touch-friendly button sizes
- Readable on all devices

## API Integration

### PocketBase Endpoints:
- `POST /api/v2/mint-egg` - Mint Egg NFT
- `POST /api/v2/claim-commission` - Claim commissions
- `GET /api/collections/egg_nfts` - Fetch egg records
- `GET /api/collections/commission_records` - Fetch commission records

### Wallet API Endpoints:
- `POST /api/wallet/mint-egg` - Contract mint interaction
- `POST /api/wallet/claim-commission` - Contract claim interaction

## Testing

### Component Tests:
```bash
cd apps/web
bun test EggCard.test.tsx
```

### Test Coverage:
- EggCard renders correctly
- Rarity labels display properly
- Hatch status shows correctly
- Referral chain toggle works
- Button states (loading, disabled, success)

## User Flow

1. **Mint Flow:**
   ```
   User visits /mint → Checks balance → Enters referrer (optional) → 
   Clicks "Mint Egg" → API call → Success → Redirects to /dashboard/eggs
   ```

2. **View Eggs Flow:**
   ```
   User visits /dashboard/eggs → Sees egg grid → Views egg details → 
   Clicks "View Referral Chain" → Sees G1-G4 referrers
   ```

3. **Hatch Flow:**
   ```
   User clicks "Hatch Egg" → API call → Egg status updates → 
   Visual change (egg icon → flame icon)
   ```

4. **Commission Flow:**
   ```
   User visits /dashboard/commissions → Sees pending balance → 
   Clicks "Claim" → API call → Balance updates → Success message
   ```

## Next Steps (Phase 4: Testing & Deployment):

1. Deploy contracts to BSC testnet
2. Update environment variables with contract addresses
3. Test full mint flow with real USDT on testnet
4. Verify commission distribution on-chain
5. Security audit before mainnet deployment

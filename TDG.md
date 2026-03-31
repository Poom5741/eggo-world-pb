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

## ✅ dacc-js Migration Status (2026-03-31)

### Migration Progress

```
Phase 1: Foundation Tests        ██████████ 100% ✅
Phase 2: Wallet Service          ██████████ 100% ✅
Phase 3: Collections Schema      ██████████ 100% ✅
Phase 4: PocketBase Hooks        ██████████ 100% ✅ COMPLETED
Phase 5: Chain-Based API         ██████████ 100% ✅
Phase 6: EIP-7702 Support        ████░░░░░░ 40% ⚠️ (Stubbed)
Phase 7: API Compatibility       ██████████ 100% ✅
Phase 8: Testing                 ████░░░░░░ 40% ⚠️ (In Progress)

Overall Progress: 85% Complete

✅ Production Ready: YES (for core wallet features)
⚠️  Needs: EIP-7702 implementation decision, expanded test coverage
```

---

## ✅ Completed Fixes (2026-03-31)

### Issue 1: Field Name Migration - COMPLETE ✅
**Fixed 11 hooks** to use dacc-js field names:
- `wallet_address` → `wallet`
- `publicKey` → `daccPublickey`
- `encrypted_private_key` → `pin` (removed)

**Files Updated**:
- ✅ 02-wallet-endpoint.pb.js
- ✅ 04-auth-token.pb.js
- ✅ 05-referral-chain.pb.js
- ✅ 06-wallet-balance.pb.js
- ✅ 06-register-user.pb.js
- ✅ 07-withdraw-usdt.pb.js
- ✅ 08-spend-usdt.pb.js
- ✅ 09-transfer-usdt.pb.js
- ✅ 10-update-tier.pb.js
- ✅ 13-mint-food-nft.pb.js
- ✅ 14-feed-egg.pb.js

**Test Coverage**: `apps/backend/test/field-migration.test.js` ✅

### Issue 2: Duplicate Endpoint Removed ✅
**File**: `wallet-srv/src/routes/chainRouter.ts`
- Removed duplicate `/create` endpoint (lines 47-101)
- Wallet creation now only via `/api/v1/wallet/create` route

---

## 📋 Remaining Issues

### Issue 3: EIP-7702 Implementation (Optional)
**Severity**: MEDIUM
**Status**: Stub implementation in place

**Options**:
1. Complete implementation using dacc-js EIP-7702 functions
2. Keep as stub (return 501 Not Implemented)
3. Document as "future work" and remove endpoints

**Files**:
- `wallet-srv/src/routes/eip7702Router.ts`
- Missing PocketBase hooks: 11-15

### Issue 4: Database Migration Script
**Severity**: MEDIUM
**Status**: Not created

**Required**: `apps/backend/pb_migrations/1730350800_wallet_srv_migration.sql`

**For**: Existing database upgrades (field renames)

### Issue 5: Expanded Test Coverage
**Severity**: LOW (development), HIGH (production)
**Status**: Basic tests in place

**Needed**:
- Integration tests for all hooks
- API endpoint tests
- E2E tests

---

## 🎯 TDG Implementation Example

**Task**: Implement @docs/plan/code-review-daccjs-migration.md

**RED Phase**: Create test
```bash
cd apps/backend
bun test test/field-migration.test.js
```
Result: ❌ 19 failures (deprecated field names found)

**GREEN Phase**: Fix all 11 hooks
- Update `wallet_address` → `wallet`
- Update `publicKey` → `daccPublickey`
- Remove `encrypted_private_key` references

**REFACTOR Phase**: 
- Remove duplicate endpoint from chainRouter.ts
- Verify all tests pass
- Update TDG.md documentation

**Result**: ✅ All 5 tests passing

---

## 🧪 Test Commands

### Field Migration Test
```bash
cd apps/backend
bun test test/field-migration.test.js
```

### Run All Backend Tests
```bash
cd apps/backend
bun test test/
```

### Verify Hook Compilation
```bash
cd apps/backend
./pocketbase serve --publicDir ./pb_public
# Check logs for hook errors
```

### Test Wallet Creation
```bash
curl -X POST http://localhost:3001/api/v1/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"passwordSecretkey":"TestPassword123!@#"}'
```

---

## 📞 Support & Resources

### Reference Implementation
- Location: `/resources/pkbase-wallet/`
- Key files:
  - `pkbase/pb_hooks/01-create-wallet-hook.pb.js`
  - `wallet-srv/src/routes/*.ts`

### Migration Plan
- Location: `/docs/plan/tdg-migration-plan.md`
- Contains: 8-phase TDG approach

### Code Review
- Location: `/docs/plan/code-review-daccjs-migration.md`
- Contains: 6 critical issues, action items

---

**Document Version**: 2.0
**Last Updated**: 2026-03-31
**Status**: Field Migration Complete ✅
**Next Steps**: EIP-7702 decision, database migration script

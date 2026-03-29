# TDG Configuration - EggoWorld

NFT Membership System with LINE OAuth and EVM Wallet Integration

## Modules

| Module | Path | Tech Stack | Test Status |
|--------|------|------------|-------------|
| Web | `apps/web/` | Next.js 16 + React 19 + Bun | ✅ Configured |
| Backend | `apps/backend/` | PocketBase (Go) + pb_hooks | ✅ Hooks Testable |
| Wallet API | `wallet-api/` | Express.js + ethers | ✅ Configured |

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

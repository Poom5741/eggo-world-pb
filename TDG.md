# TDG Configuration - EggoWorld

NFT Membership System with LINE OAuth and EVM Wallet Integration

## Modules

| Module | Path | Tech Stack | Test Status |
|--------|------|------------|-------------|
| Web | `apps/web/` | Next.js 16 + React 19 + Bun | Not configured |
| Backend | `apps/backend/` | PocketBase (Go) | External |
| Wallet API | `wallet-api/` | Express.js + ethers | Not configured |

---

# Module: Web (`apps/web/`)

## Project Information
- Language: TypeScript
- Framework: Next.js 16 (App Router)
- Test Framework: Not configured (recommend bun:test)
- Runtime: Bun

## Build Command
```bash
cd apps/web && bun run build
```

## Test Commands
**Not configured** - Need to set up test framework.

Recommended setup:
```bash
cd apps/web && bun add -d bun:test @testing-library/react @testing-library/jest-dom jsdom
```

## Test File Patterns
- Unit tests: `**/*.test.{ts,tsx}`
- Integration tests: `**/*.integration.test.{ts,tsx}`
- E2E tests: `e2e/**/*.spec.ts`

## Module-Specific Conventions

### React Patterns
- Functional components with TypeScript
- App Router (not Pages Router)
- Server Components by default, 'use client' directive for client components
- shadcn/ui components with Tailwind CSS

### Auth Patterns
- PocketBase SDK for authentication
- LINE OAuth + Email/Password
- Middleware for protected routes

### State Management
- React Query for server state (if needed)
- React Context for UI state
- URL state with useSearchParams

## References
- `apps/web/README.md` - Module documentation

---

# Module: Wallet API (`wallet-api/`)

## Project Information
- Language: JavaScript (Node.js)
- Framework: Express.js
- Dependencies: ethers, cors, dotenv

## Build Command
```bash
# No build required - run directly
bun wallet-api/server.js
```

## Test Commands
**Not configured** - Need to set up test framework.

Recommended setup:
```bash
cd wallet-api && bun add -d bun:test
```

## API Endpoints
- `GET /health` - Health check
- `POST /api/wallet/create` - Create single wallet
- `POST /api/wallet/batch` - Batch create wallets

---

# Module: Backend (`apps/backend/`)

## Project Information
- Type: PocketBase (Go binary)
- Hooks: `pb_hooks/` - Lua/JavaScript hooks for wallet creation
- Frontend: `pb_public/` - Simple HTML files (fallback)

## Commands
```bash
# Start via Docker
cd apps/backend && docker compose up -d

# Or run PocketBase directly
./pocketbase serve --publicDir ./pb_public
```

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/collections/users/auth-with-oauth2` - OAuth login
- `GET /_/` - Admin UI

---

## TDG Workflow

TDG follows Red-Green-Refactor cycle:
1. **RED**: Write failing tests
2. **GREEN**: Implement code to pass tests
3. **REFACTOR**: Optimize and clean up
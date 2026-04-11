# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-29
**Commit:** See git history
**Branch:** See git status

## OVERVIEW

NFT membership system with LINE OAuth and EVM wallet integration. Monorepo with Next.js 16 frontend (Bun runtime), PocketBase backend, and Express.js wallet service.

## STRUCTURE

```
eggo-pocketbase/
├── apps/web/              # Next.js 16 frontend (Bun, shadcn/ui, Tailwind 4)
├── apps/backend/          # PocketBase (LINE OAuth, wallet hooks)
├── wallet-api/            # Express.js wallet generation service
├── contracts/             # Foundry smart contracts (Solidity 0.8.20)
├── nginx/                 # Nginx reverse proxy config
├── resources/mvp-foodcourt/  # Reference implementation
└── docs/                  # Documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add UI page | `apps/web/app/` | App Router, use existing auth pattern |
| Add React component | `apps/web/components/` | Colocate tests, use shadcn/ui |
| Add shadcn/ui component | `apps/web/components/ui/` | Run `bunx shadcn@latest add` |
| Add PocketBase hook | `apps/backend/pb_hooks/` | Name: `NN-feature.pb.js` (NN = sequence) |
| Add collection | `apps/backend/collections/` | Update migrations after |
| Wallet API changes | `wallet-api/server.js` | Express.js, ethers v6 |
| LINE OAuth config | `apps/backend/.env` | LINE_CHANNEL_ID, LINE_CHANNEL_SECRET |
| Add smart contract | `contracts/src/` | Foundry, Solidity 0.8.20, OpenZeppelin |
| Add contract test | `contracts/test/` | Forge test |
| Deploy contracts | `contracts/script/` | Forge script, BSC testnet/mainnet |
| Reference example | `resources/mvp-foodcourt/` | 20+ hook examples, Thai language |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `app/page.tsx` | Entry | `apps/web/app/` | Landing page |
| `app/auth/*` | Pages | `apps/web/app/auth/` | Login, signup, callback, error |
| `middleware.ts` | Middleware | `apps/web/` | Edge auth, LINE OAuth redirect |
| `client.ts` | Client | `apps/web/lib/pocketbase/` | PocketBase SDK wrapper |
| `01-create-wallet.pb.js` | Hook | `apps/backend/pb_hooks/` | Auto-creates EVM wallet on signup |
| `04-auth-token.pb.js` | Hook | `apps/backend/pb_hooks/` | LINE OAuth token exchange |
| `server.js` | Server | `wallet-api/` | Wallet generation endpoint |

## CONVENTIONS

**Language:** Thai comments when user speaks Thai

**Package Management:** Bun only for `apps/web` (not npm/yarn/pnpm)

**File Naming:**
- PocketBase hooks: `NN-feature.pb.js` (NN = execution order)
- React components: PascalCase (`CashierDashboard.tsx`)
- Pages: kebab-case directories (`auth/callback/page.tsx`)
- Hooks: `use*` prefix (`use-client-state.ts`)

**TypeScript:** `strict: true`, path alias `@/*` in `apps/web`

**UI:** shadcn/ui with new-york style, Lucide icons, Tailwind CSS 4

**Testing:** Bun test, colocated `*.test.tsx` files

## ANTI-PATTERNS (THIS PROJECT)

**DO NOT:**
- Create API routes in `apps/web/app/api/` - static export incompatible
- Access `window`, `localStorage` in initial render (hydration mismatch)
- Access `pb.authStore.record` during SSR (use `useIsHydrated()` hook)
- Commit `.next/` build artifacts (currently in repo, should be ignored)
- Commit PocketBase binary (32MB, download instead)
- Use hardcoded secrets (LINE_CHANNEL_SECRET in docker-compose)
- Create `pb_hooks` without authentication (`$apis.requireAuth(e)`)

**NEVER:**
- Commit `.env` files with real secrets
- Log private keys or sensitive data
- Skip input validation before blockchain operations

## UNIQUE STYLES

**Hydration Safety:**
```typescript
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null
// Return early or loading state until hydrated
```

**PocketBase Hook Response:**
```javascript
e.json(200, { 
  success: true, 
  data: { ... } 
})
// Error: e.json(400, { success: false, error: { message, code } })
```

**Blockchain API Retry:** 3 attempts with exponential backoff

## COMMANDS

```bash
# Frontend (apps/web)
bun run dev              # Start dev server (bun --hot)
bun run build            # Build for production
bun run test             # Run tests (bun test)
bun run test:coverage    # With coverage

# Backend (PocketBase)
cd apps/backend
docker-compose up -d     # Start PocketBase (port 8090)

# Wallet API
cd wallet-api
bun run dev              # Start Express server

# Monorepo
make dev                 # Start frontend
make backend             # Start local PocketBase
make dev-local           # Frontend + local PB
```

## NOTES

**PocketBase URL:** Production at `https://pb.eggoworld.io`, local at `http://localhost:8090`

**Chain IDs:** BSC Testnet (97), BSC Mainnet (56), Ethereum (1), Polygon (137)

**Wallet Fields:** `wallet`, `daccPublickey`, `pin` (encrypted) - auto-created by hook `01`

**Error Codes:** `AUTH_REQUIRED`, `WALLET_NOT_FOUND`, `BALANCE_NATIVE_FAILED`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`

**Deployment:** Static export for Cloudflare Pages (`output: 'export'` in next.config.mjs)

**References:** `resources/mvp-foodcourt/CLAUDE.md` has comprehensive hook examples

<!-- FLUX:START -->
## Flux Task Management

You have access to Flux for task management via MCP or CLI.

**Rules:**
- All work MUST belong to exactly one project_id
- Do NOT guess or invent a project_id
- Track all work as tasks; update status as you progress
- Close tasks immediately when complete

**Startup:**
1. List projects (`flux project list`)
2. Select or create ONE project
3. Confirm active project_id before any work

**If context is lost:** Re-list projects/tasks. Ask user if ambiguous.

### Using Flux with OMO (AI Agents)

**MCP Integration:** Flux is configured in `.mcp.json` as the `flux` MCP server.

**Agent Workflow:**
```bash
# 1. Get next ready task (unblocked, priority-sorted)
flux ready

# 2. Show task details
flux show <task-id>

# 3. Mark task as in progress
flux task start <task-id>

# 4. Work on the task...

# 5. Mark task done with completion note
flux task done <task-id> --note "Completed: [what you did]"
```

**Task Creation Pattern:**
```bash
# Create new task with priority
flux task create "<task title>" -P 0  # P0=urgent, P1=normal, P2=low

# Create task with dependency (blocks until dependency is done)
flux task create "<task>" --depends-on <task-id>
```

**Current Project:** `Eggo NFT Platform (zsvm79i)` - located at `.flux/`

**Commands:**
- `flux project list` - List all projects
- `flux ready` - Show unblocked tasks sorted by priority
- `flux task list` - List all tasks
- `flux show <id>` - Show task details
- `flux task create "<title>" -P <0|1|2>` - Create new task
- `flux task start <id>` - Mark as in_progress
- `flux task done <id> --note "<note>"` - Mark complete
- `flux update-status <id> --status <status>` - Update status
<!-- FLUX:END -->

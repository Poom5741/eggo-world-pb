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

| Task                    | Location                    | Notes                                    |
| ----------------------- | --------------------------- | ---------------------------------------- |
| Add UI page             | `apps/web/app/`             | App Router, use existing auth pattern    |
| Add React component     | `apps/web/components/`      | Colocate tests, use shadcn/ui            |
| Add shadcn/ui component | `apps/web/components/ui/`   | Run `bunx shadcn@latest add`             |
| Add PocketBase hook     | `apps/backend/pb_hooks/`    | Name: `NN-feature.pb.js` (NN = sequence) |
| Add collection          | `apps/backend/collections/` | Update migrations after                  |
| Wallet API changes      | `wallet-api/server.js`      | Express.js, ethers v6                    |
| LINE OAuth config       | `apps/backend/.env`         | LINE_CHANNEL_ID, LINE_CHANNEL_SECRET     |
| Add smart contract      | `contracts/src/`            | Foundry, Solidity 0.8.20, OpenZeppelin   |
| Add contract test       | `contracts/test/`           | Forge test                               |
| Deploy contracts        | `contracts/script/`         | Forge script, BSC testnet/mainnet        |
| Reference example       | `resources/mvp-foodcourt/`  | 20+ hook examples, Thai language         |

## CODE MAP

| Symbol                   | Type       | Location                   | Role                              |
| ------------------------ | ---------- | -------------------------- | --------------------------------- |
| `app/page.tsx`           | Entry      | `apps/web/app/`            | Landing page                      |
| `app/auth/*`             | Pages      | `apps/web/app/auth/`       | Login, signup, callback, error    |
| `middleware.ts`          | Middleware | `apps/web/`                | Edge auth, LINE OAuth redirect    |
| `client.ts`              | Client     | `apps/web/lib/pocketbase/` | PocketBase SDK wrapper            |
| `01-create-wallet.pb.js` | Hook       | `apps/backend/pb_hooks/`   | Auto-creates EVM wallet on signup |
| `04-auth-token.pb.js`    | Hook       | `apps/backend/pb_hooks/`   | LINE OAuth token exchange         |
| `server.js`              | Server     | `wallet-api/`              | Wallet generation endpoint        |

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

## GSD (Get Shit Done) Framework

This project uses the GSD framework for structured agentic development. All 79 GSD commands are available in Qoder.

### Quick Start

```bash
# Check project status
/gsd-progress

# Plan a phase
/gsd-plan-phase 1

# Execute the phase
/gsd-execute-phase 1

# Get help
/gsd-help
```

### Documentation

- **Full Guide**: `.qoder/GSD-IN-QODER.md`
- **Quick Reference**: `.qoder/GSD-COMMANDS.md`
- **Setup Status**: `.qoder/GSD-SETUP-COMPLETE.md`

### Available Commands

79 slash commands available:

- `/gsd-new-project` - Initialize projects
- `/gsd-plan-phase` - Create phase plans
- `/gsd-execute-phase` - Execute plans
- `/gsd-debug` - Debug issues
- `/gsd-progress` - Check status
- And 74 more...

See `.qoder/GSD-COMMANDS.md` for complete list.

## NOTES

**PocketBase URL:** Production at `https://pb.eggoworld.io`, local at `http://localhost:8090`

**Chain IDs:** BSC Testnet (97), BSC Mainnet (56), Ethereum (1), Polygon (137)

**Wallet Fields:** `wallet`, `daccPublickey`, `pin` (encrypted) - auto-created by hook `01`

**Error Codes:** `AUTH_REQUIRED`, `WALLET_NOT_FOUND`, `BALANCE_NATIVE_FAILED`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`

**Deployment:** Static export for Cloudflare Pages (`output: 'export'` in next.config.mjs)

**References:** `resources/mvp-foodcourt/CLAUDE.md` has comprehensive hook examples

<!-- OMO:START -->

## OMO Workflow (Hybrid PM System)

**Adopted**: Oh-My-OpenAgent PM workflow for feature-level planning. Use for new features, keep `.planning/phases/` for major milestones.

### File Structure

For each new feature, create alongside code:

```
apps/web/features/<feature-name>/
├── SPEC.md          # Product brief (what & why)
└── tasks.md         # Sprint board (how & when)
```

### SPEC.md Template

```markdown
# Feature: <name>

## Problem

<What user pain point does this solve?>

## Success Criteria

- <Measurable outcome 1>
- <Measurable outcome 2>

## Out of Scope

- <What we're NOT doing>

## Acceptance Test

<How to verify: "Open X, verify Y, expect Z">
```

### tasks.md Template

```markdown
# Sprint: <feature-name>

## In Progress

- [ ] P1: <TASK_ID> Task description (#github-issue)
  - Subtasks if needed
  - Accepts: deps=none

## To Do

- [ ] P1: <TASK_ID> Task (#issue)
  - Accepts: deps=<TASK_ID>
- [ ] P2: <TASK_ID> Task (#issue)

## Done

- [x] <TASK_ID> Completed task (#issue)
```

### Priority Rules

| Priority | Meaning               | Response Time |
| -------- | --------------------- | ------------- |
| P0       | Urgent, blocks others | Immediate     |
| P1       | Normal feature work   | Next sprint   |
| P2       | Nice-to-have          | Backlog       |

### Workflow

1. **Feature Request** → Draft SPEC.md, review with user
2. **Task Breakdown** → Create tasks.md with dependencies
3. **GitHub Issues** → Manual creation for P1+ tasks (link via `#issue`)
4. **Execution** → Reference issues in commits: `fix: add balance #45`
5. **Completion** → Mark tasks done, update SPEC.md if scope changed

### Commit Convention

```bash
git commit -m "feat: add wallet balance display #45"
git commit -m "fix: handle loading state in balance card #47"
```

### Integration with Flux

- Use Flux for task tracking (`.flux/`)
- Use OMO for feature structure (SPEC.md + tasks.md)
- Cross-reference: SPEC.md ↔ Flux task ID

<!-- OMO:END -->

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

---

## PRODUCTION DEPLOYMENT GUIDE

**CRITICAL:** Read this section BEFORE deploying to production to avoid costly mistakes.

### Production Architecture

**IMPORTANT:** Production PocketBase runs in **Docker Compose**, NOT as a binary process.

- **Production Server:** `root@204.168.144.14`
- **SSH Key:** `~/.ssh/poom-server`
- **Production Path:** `/root/eggo-world-pb`
- **Container Name:** `eggo-pb`
- **Docker Compose File:** `/root/eggo-world-pb/docker-compose.yml`

**PocketBase Version:** 0.23.4 (running in Docker container)

### Common Deployment Mistakes

**1. Wrong Deployment Method**

- ❌ **WRONG:** Running PocketBase as binary process (`./pocketbase serve`)
- ✅ **CORRECT:** Use Docker Compose (`docker compose up -d pocketbase`)
- Production uses Docker container, not standalone binary

**2. Wrong Directory**

- Production is at `/root/eggo-world-pb` NOT `/root/eggo-pocketbase`
- Verify: `ssh root@204.168.144.14 "find /root -name 'pb_hooks' -type d"`

**3. Hook Loading Location**

- PocketBase loads `pb_hooks/` from Docker image (baked in during build)
- Hooks are NOT mounted as volumes - they're copied into the image
- MUST rebuild Docker image to update hooks

**4. SSH Configuration**

- Set BEFORE deployment:

```bash
export SSH_KEY="~/.ssh/poom-server"
export SSH_HOST="204.168.144.14"
```

**5. Hook Loading Verification**

- After restart, check: `tail -50 /tmp/pocketbase.log | grep 'endpoint registered'`
- Should see "Hot wallet balance endpoint registered" etc.

**6. Endpoint Testing**

- 400/401/403 errors are NORMAL for unauthenticated requests
- Test with auth: `curl -H "Authorization: Bearer $TOKEN" ...`

---

### Production Deployment Checklist

#### Pre-Deployment

- [ ] Verify directory: `ssh root@204.168.144.14 "find /root -name 'pb_hooks'"`
- [ ] Check running process: `ssh root@host "ps aux | grep pocketbase"`
- [ ] Set SSH environment variables
- [ ] Backup: `ssh root@host "cp -r pb_hooks pb_hooks.backup"`

### Production Deployment Workflow

#### Upload and Deploy Hooks

```bash
# 1. Upload new hook file
scp -i ~/.ssh/poom-server -o StrictHostKeyChecking=no apps/backend/pb_hooks/NN-*.pb.js \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/

# 2. Rebuild Docker image (hooks are baked into image)
ssh -i ~/.ssh/poom-server -o StrictHostKeyChecking=no root@204.168.144.14 "
  cd /root/eggo-world-pb && \
  docker compose build pocketbase && \
  docker compose up -d pocketbase
"

# 3. Verify deployment
ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=20 pocketbase | grep 'endpoint registered'"
```

**IMPORTANT:**

- Hooks are copied into Docker image during build, NOT mounted as volumes
- Must rebuild image with `docker compose build pocketbase` to update hooks
- Cannot just restart container - must rebuild

#### Verify Deployment

```bash
# Health check
curl -s https://pb.eggoworld.io/api/health

# Check logs for hook loading
ssh -i ~/.ssh/poom-server root@204.168.144.14 "
  docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=50 pocketbase | grep -E 'endpoint|hook|registered'
"

# Test endpoint with auth
TOKEN="your-auth-token"
curl -X POST https://pb.eggoworld.io/api/v2/hot-wallet/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x..."}'
```

#### Check Container Status

```bash
# Check if container is running
ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker ps | grep eggo-pb"

# Check container logs
ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker logs eggo-pb --tail=50"

# Check container details
ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker inspect eggo-pb | grep -i status"
```

---

### Quick Reference

**SSH Access**

```bash
ssh -i ~/.ssh/poom-server -o StrictHostKeyChecking=no root@204.168.144.14
```

**Upload Hook**

```bash
scp -i ~/.ssh/poom-server -o StrictHostKeyChecking=no apps/backend/pb_hooks/NN-*.pb.js \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
```

**Deploy Hook (Rebuild & Restart)**

```bash
ssh -i ~/.ssh/poom-server -o StrictHostKeyChecking=no root@204.168.144.14 "
  cd /root/eggo-world-pb && \
  docker compose build pocketbase && \
  docker compose up -d pocketbase
"
```

**Check Logs**

```bash
ssh -i ~/.ssh/poom-server root@204.168.144.14 "
  docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=50 pocketbase | grep -E 'endpoint|hook|error'
"
```

**Run Commands in Container**

```bash
ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker exec eggo-pb <command>"
```

---

### Common Errors & Solutions

**Error:** `address already in use`
**Fix:** `docker compose -f /root/eggo-world-pb/docker-compose.yml down pocketbase && docker compose up -d pocketbase`

**Error:** `No such container`
**Cause:** Container not running
**Fix:** `docker compose -f /root/eggo-world-pb/docker-compose.yml up -d pocketbase`

**Error:** `pb_hooks: No such file`
**Cause:** Wrong path or hooks not copied to image
**Fix:** `find /root -name 'pb_hooks' -type d` and rebuild image

**Error:** Hooks not loading
**Cause:** Hooks not baked into Docker image
**Fix:** Rebuild image with `docker compose build pocketbase`

**Error:** 400/401/403 on endpoint
**Cause:** Missing auth or wrong auth method
**Fix:** Add `Authorization: Bearer <token>` header, use `e.requestInfo().auth` in hooks

**Error:** `sql: no rows in result set`
**Cause:** Database query returned empty result
**Fix:** Check if record exists, verify field names match collection schema

---

## POCKETBASE HOOK DEVELOPMENT PATTERNS (v0.23.4)

**CRITICAL:** These patterns were discovered through extensive debugging. ALWAYS follow these patterns.

### 1. Authentication in Router Hooks

**✅ CORRECT:** Use `e.requestInfo().auth` to get authenticated user

```javascript
routerAdd("POST", "/api/v2/mint-egg", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id
    const collectionId = requestInfo.auth?.collectionId

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" },
      })
    }

    // Get user record
    const user = $app.findRecordById("users", userId)
    if (!user) {
      return e.json(401, {
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      })
    }

    // ... rest of logic
  } catch (err) {
    return e.json(500, { success: false, error: { message: err.message, code: "MINT_FAILED" } })
  }
})
```

**❌ WRONG:** These DO NOT work in PocketBase 0.23.4:

```javascript
// DON'T USE - doesn't exist in v0.23.4
const user = $apis.requireAuth(e)

// DON'T USE - doesn't exist in v0.23.4
const { users } = e.requireAuth()

// DON'T USE - $security.parseUnverifiedJWT uses atob which doesn't exist
const tokenData = $security.parseUnverifiedJWT(token)
```

### 2. Database Queries

**✅ CORRECT:** Use `$app.findFirstRecordByData()` for simple field lookups

```javascript
// Find user_wallets record by user_id
const wallet = $app.findFirstRecordByData("user_wallets", "user_id", user.id)

if (!wallet) {
  return e.json(400, {
    success: false,
    error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" },
  })
}
```

**❌ WRONG:** These DON'T work:

```javascript
// DON'T USE - parameterized queries don't work this way
const wallet = $app.findFirstRecordByFilter("user_wallets", "user_id = {:userId}", {
  "@userId": user.id,
})

// DON'T USE - $app.dao() doesn't exist in v0.23.4
const wallet = $app.dao().findFirstRecordByData("user_wallets", "user_id", user.id)
```

### 3. Record Operations

**✅ CORRECT API methods in v0.23.4:**

```javascript
// Find record by ID
const user = $app.findRecordById("users", userId)

// Find collection
const collection = $app.findCollectionByNameOrId("user_wallets")

// Create new record
const newRecord = $app.newRecord(collection)

// Set fields
newRecord.set("user_id", userId)
newRecord.set("wallet_address", "0x...")

// Save record
$app.save(newRecord)
```

**❌ WRONG:** These DON'T exist:

```javascript
// DON'T USE - $app.dao() doesn't exist
$app.dao().findRecordById("users", userId)
$app.dao().saveRecord(record)
$app.dao().createRecord(collection, data)
```

### 4. Accessing Record Fields

**✅ CORRECT:** Use `.get()` method

```javascript
const walletAddress = user.get("wallet")
const daccPublicKey = user.get("daccPublickey")
const pin = user.get("pin")
const usdtBalance = wallet.get("usdt_balance")
```

**⚠️ CAUTION:** `user.get()` can return `null` but may appear truthy in some contexts. Always check explicitly:

```javascript
const pin = user.get("pin")
if (!pin || pin === null || pin === "") {
  // Handle missing pin
}
```

### 5. Collection Schema

**`users` collection stores:**

- `wallet` - EVM wallet address (0x...)
- `daccPublickey` - DACC public key (daccPublickey*0x...*...)
- `pin` - Encrypted wallet password (random, NOT user's login password)
- `referral_chain` - Array of referrer user IDs

**`user_wallets` collection stores:**

- `user_id` - Relation to users collection (required, cascadeDelete)
- `wallet_address` - Same as users.wallet (for easier queries)
- `usdt_balance` - Current USDT balance (number)
- `total_earned` - Lifetime USDT earned
- `total_spent` - Lifetime USDT spent
- Indexes: `idx_user_wallets_user_id` (unique), `idx_user_wallets_wallet_address`

### 6. Response Format

**✅ Standard response format:**

```javascript
// Success
return e.json(200, {
    success: true,
    data: { ... }
});

// Error
return e.json(400, {
    success: false,
    error: {
        message: 'Descriptive error message',
        code: 'ERROR_CODE'
    }
});
```

### 7. Environment Variables

```javascript
// Access environment variables
const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
const lineChannelId = $os.getenv("LINE_CHANNEL_ID")
```

### 8. HTTP Requests to External APIs

```javascript
const response = $http.send({
  url: "https://api.example.com/endpoint",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
})

// Parse response
let responseData
if (response.json && typeof response.json === "object") {
  responseData = response.json
} else if (response.body) {
  let responseBody = response.body
  if (Array.isArray(response.body)) {
    responseBody = ""
    for (let i = 0; i < response.body.length; i++) {
      responseBody += String.fromCharCode(response.body[i])
    }
  }
  responseData = JSON.parse(responseBody)
}

if (response.statusCode < 200 || response.statusCode >= 300) {
  throw new Error("API returned status " + response.statusCode)
}
```

### 9. Logging

```javascript
// Standard logging
console.log("Info message")
console.error("Error message")

// PocketBase logger
$app.logger().info("Operation completed", { userId: user.id })
$app.logger().error("Operation failed", err)
```

---

## DEBUGGING SESSION LEARNINGS (April 2026)

### Mint Flow Debugging Session

**Issue:** Mint page was calling wallet-api directly instead of going through PocketBase.

**Root Cause:**

- Frontend was calling `http://localhost:3001/api/v1/wallet/mint-egg` directly
- Should call PocketBase endpoint: `${pb.baseURL}/api/v2/mint-egg`
- PocketBase hook handles: balance validation, referral logic, wallet-api calls, record creation

**Fix:**

- Changed mint page to call PocketBase hook with Authorization header
- Hook validates USDT balance, builds referral chain, calls wallet-api internally
- **Architecture:** Frontend → PocketBase → wallet-api → blockchain

**Files Modified:**

- `apps/web/app/mint/page.tsx` - Changed API endpoint and added auth header
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` - Fixed authentication and database queries

---

### Authentication Debugging Session

**Issue:** PocketBase hook couldn't authenticate user - multiple authentication methods failed.

**Failed Attempts:**

1. **`$apis.requireAuth(e)`** - Returns function name as string "pbRequireAuth" in v0.23.4 ❌
2. **`e.requireAuth()`** - Method doesn't exist in v0.23.4 ❌
3. **`$security.parseUnverifiedJWT(token)`** - Uses `atob` which doesn't exist in PocketBase JSVM ❌
4. **`e.auth.record`** - Undefined in router hooks ❌

**Working Solution:**

```javascript
const requestInfo = e.requestInfo()
const userId = requestInfo.auth?.id
const collectionId = requestInfo.auth?.collectionId

if (!userId) {
  return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
}

const user = $app.findRecordById("users", userId)
```

**Key Learning:** PocketBase v0.23.4 parses auth token automatically and makes it available via `e.requestInfo().auth`. DO NOT try to parse JWT manually.

---

### Database Query Debugging Session

**Issue:** `sql: no rows in result set` error when looking up user_wallets record.

**Failed Attempts:**

1. **`$app.findFirstRecordByFilter('user_wallets', 'user_id = {:userId}', {'@userId': user.id})`**
   - Error: "invalid filter expression: unexpected character '{'"
   - Parameter syntax doesn't work with this API ❌

2. **`$app.findFirstRecordByData('user_wallets', 'user_id', user.id)` with wrong user.id**
   - Was passing `pbRequireAuth` string instead of actual user ID ❌
   - Fixed by using correct auth method first

**Working Solution:**

```javascript
// After getting correct userId from e.requestInfo().auth
const wallet = $app.findFirstRecordByData("user_wallets", "user_id", userId)

if (!wallet) {
  return e.json(400, { success: false, error: { message: "Wallet not found" } })
}
```

**Key Learning:** `findFirstRecordByData` works for simple field lookups, but user.id must be valid. Always verify auth first.

---

### Wallet Fields Debugging Session

**Issue:** User login fails with "Wallet setup incomplete. Please contact support. (Error: DACC_KEY_MISSING)"

**Root Cause:**

- User record had `wallet` and `daccPublickey` but `pin` was `null`
- Frontend checks `if (!user.daccPublickey)` in `line-callback.html`
- `onRecordCreate` hook (01-create-wallet.pb.js) only fires on NEW user creation
- Existing users created before hook was added don't have wallet fields

**Debugging Process:**

1. Checked user record via API - found `pin: null`
2. Tried to update pin via hook - hook read pin as truthy even though it was null
3. **Issue:** `user.get('pin')` may return undefined which is coerced to truthy in some contexts

**Solution:**

- Created temporary fix endpoint (`99-fix-user-wallet.pb.js`) to manually set missing fields
- For new users: LINE OAuth triggers `onRecordCreate` hook which creates wallet automatically
- For existing users: Must manually populate wallet fields or re-register

**Key Learnings:**

1. **Pin field location:** `users` collection (NOT `user_wallets`)
2. **Pin generation:** Random password generated by wallet-api, stored in `users.pin`
3. **NEVER use user's login password** - it's hashed by PocketBase before storage
4. **Hook execution:** `onRecordCreate` only fires once on user creation, not on subsequent logins
5. **Field truthiness:** `user.get('field')` can return values that appear truthy but are actually null/undefined in database

---

### Production Deployment Debugging

**Issue:** Tried to restart PocketBase as binary process in production.

**User Feedback:** "you doing wrong thing again you need to run pocketbase on server with docker compose not binary build"

**Root Cause:**

- AGENTS.md had outdated info saying production uses binary process
- Actually uses Docker Compose with container `eggo-pb`
- Hooks are baked into Docker image, not mounted as volumes

**Correct Deployment:**

```bash
# Upload hook
scp -i ~/.ssh/poom-server apps/backend/pb_hooks/NN-*.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/

# Rebuild and restart
ssh -i ~/.ssh/poom-server root@204.168.144.14 "
  cd /root/eggo-world-pb && \
  docker compose build pocketbase && \
  docker compose up -d pocketbase
"
```

**Key Learning:** ALWAYS verify deployment architecture before making changes. Check if Docker is being used:

```bash
ssh root@host "docker ps | grep pocketbase"
```

---

### JWT Token Structure

**PocketBase auth JWT contains:**

```json
{
  "collectionId": "_pb_users_auth_",
  "exp": 1767374651,
  "id": "1r3su033r736n5o",
  "refreshable": true,
  "type": "auth"
}
```

**Key Points:**

- `id` is the user record ID
- `collectionId` is always `_pb_users_auth_` for users
- Token is automatically parsed by PocketBase and available via `e.requestInfo().auth`
- DO NOT manually parse JWT - use the built-in auth parsing

---

### Collection ID vs Collection Name

**Important:** PocketBase has both collection names and collection IDs:

- **Collection Name:** `users`, `user_wallets`, `egg_nfts` (human-readable)
- **Collection ID:** `_pb_users_auth_` (system ID for users collection)

**When to use which:**

```javascript
// Use collection NAME for most operations
const user = $app.findRecordById("users", userId)
const wallet = $app.findFirstRecordByData("user_wallets", "user_id", userId)

// Collection ID from JWT token can also work
const user = $app.findRecordById("_pb_users_auth_", userId)
```

---

### General Debugging Tips

1. **Always check server logs first:**

   ```bash
   ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=50 pocketbase"
   ```

2. **Add debug logging to hooks:**

   ```javascript
   console.log("[Mint] Step 1 - User ID:", userId)
   console.log("[Mint] Step 2 - Wallet:", wallet ? wallet.id : "NULL")
   console.error("[Mint] ERROR:", err)
   console.error("[Mint] ERROR stack:", err.stack)
   ```

3. **Verify database state:**
   - Use PocketBase Admin UI at `https://pb.eggoworld.io/_/`
   - Or query via API with admin token

4. **Test endpoints with curl:**

   ```bash
   curl -X POST https://pb.eggoworld.io/api/v2/mint-egg \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"referrer_id":null}'
   ```

5. **Check if user exists and has required fields:**
   ```bash
   curl "https://pb.eggoworld.io/api/collections/users/records/$USER_ID" \
     -H "Authorization: Bearer $TOKEN" | jq '{wallet, daccPublickey, pin}'
   ```

---

## MISTAKES & LEARNINGS

### Wallet Creation Hook Fix (April 2026)

**Issue:** LINE OAuth signup was failing with `{"daccPublickey":{"code":"validation_invalid_format"}}`

**Root Cause:**

- Wallet hook `01-create-wallet.pb.js` was calling wallet-api with WRONG parameters
- Was sending: `{userId: e.record.id}` ❌
- Should send: `{passwordSecretkey: randomPassword, publicEncryption: false}` ✅
- Wallet-api validation failed, so daccPublickey was undefined/empty
- PocketBase validation failed because daccPublickey field requires pattern `^daccPublickey_`

**Initial Mistake:**
First "fix" tried to use `e.record.getString('password')` thinking it contained the user's raw password. **WRONG!**

- PocketBase hashes passwords before storage
- `e.record.getString('password')` returns the HASH, not raw password ❌
- Wallet-api validation expects 12-120 character password, not a 60-char hash ❌

**Correct Fix (learned from reference implementation):**
Refer to `/Users/poom-work/tokenine/eggo-pocketbase/resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js`:

```javascript
// Generate RANDOM secure password for wallet encryption (NOT user's password!)
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
let passwordSecretkey = ""
for (let i = 0; i < 20; i++) {
  passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length))
}

// Use this random password to create wallet
const requestBody = {
  passwordSecretkey: passwordSecretkey, // ✅ Generated random password
  publicEncryption: false,
}

// Store in pin field
e.record.set("pin", passwordSecretkey)
e.record.set("wallet", responseData.data.address)
e.record.set("daccPublickey", responseData.data.daccPublickey)
```

**Key Learnings:**

1. **ALWAYS check reference implementations FIRST** before fixing
2. **User passwords are hashed** - never use for wallet encryption
3. **Generate random password** for wallet, store in `pin` field
4. **Verify wallet-api spec** before calling it
5. **Test on production** not just local - infrastructure issues (Nginx, Docker networking) wasted time
6. **Don't trust internet tutorials** - use project's own reference code (`/resources/`)

**Files to Reference:**

- Hook fix: `apps/backend/pb_hooks/01-create-wallet.pb.js`
- Reference: `resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js` ✅
- Wallet API spec: `resources/pkbase-wallet/wallet-srv/API_LIST.md`

**Verification Steps (MUST DO):**

```bash
# 1. Verify hook file has fix
ssh root@pb_host "grep 'randomPassword\|passwordSecretkey' /root/eggo-world-pb/apps/backend/pb_hooks/01-create-wallet.pb.js"

# 2. Restart production PocketBase
ssh root@pb_host "pkill -f 'pocketbase serve' && cd /root/eggo-world-pb/apps/backend && nohup ./pocketbase serve --http=0.0.0.0:8090 >> /tmp/pocketbase.log 2>&1 &"

# 3. Verify hook loaded
ssh root@pb_host "tail -50 /tmp/pocketbase.log | grep 'Create wallet hook registered'"

# 4. Test user creation via Direct API
ssh root@pb_host 'curl -s -X POST "http://localhost:8090/api/collections/users/records" -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"username\":\"test\",\"password\":\"TestPass123!\",\"passwordConfirm\":\"TestPass123!\"}"'
# ✅ Should return: {"id":"...","collectionId":"_pb_users_auth_",...} with status 200
# ❌ Should NOT return: {"daccPublickey":{"code":"validation_invalid_format"}}
```

**Anti-Patterns (NEVER DO):**

- ❌ Don't use user's password for wallet encryption (it's hashed)
- ❌ Don't skip reading reference implementations
- ❌ Don't assume production infrastructure will work (always test end-to-end)
- ❌ Don't debug Docker networking if binary process exists
- ❌ Don't call wallet-api directly from frontend - always go through PocketBase hooks
- ❌ Don't use `$apis.requireAuth(e)` or `e.requireAuth()` in PocketBase v0.23.4
- ❌ Don't use `$app.dao()` methods - they don't exist in v0.23.4
- ❌ Don't try to parse JWT manually with `$security.parseUnverifiedJWT()`
- ❌ Don't run PocketBase as binary in production - use Docker Compose
- ❌ Don't assume `user.get('field')` returning truthy means it's not null in DB
- ❌ Don't mount `pb_hooks/` as Docker volume - they're baked into image
- ❌ Don't use parameterized queries with `{:` syntax in `findFirstRecordByFilter`

**Success Criteria:**

- [ ] User creation API returns 200 OK (not 400 validation error)
- [ ] User record has: `wallet`, `daccPublickey`, `pin` fields populated
- [ ] Logs show: "Wallet created successfully: 0x..."
- [ ] daccPublickey format matches: `daccPublickey_0x..._...` (starts with `daccPublickey_`)

---

### Wallet Hook Critical Bug Fix (April 2026)

**Issue:** User signup via LINE OAuth was creating records but they were never committed to database.

**Root Cause:**

- Hook `01-create-wallet.pb.js` was missing `e.next()` call
- Without `e.next()`, PocketBase doesn't commit the record
- User creation appeared to succeed but record was never saved

**Additional Issues Found & Fixed:**

- Missing `e.next()` meant record never committed ❌
- Hardcoded wallet API URL (`http://172.18.0.4:3001`) ❌
- Using user's hashed password instead of random password ❌
- Wrong API endpoint path (`/api/wallet/create` vs `/api/v1/wallet/create`) ❌
- Returning hardcoded `version: 3` instead of actual encryption version ❌

**Correct Fix (committed in `47d8187`):**

```javascript
// Use onRecordBeforeCreate (NOT onRecordCreate)
onRecordBeforeCreate((e) => {
  // ... wallet creation logic ...

  // CRITICAL: Must call e.next() to commit the record
  e.next()
})
```

**Key Learnings:**

1. **`e.next()` is MANDATORY** - Without it, records are never committed
2. **Use `onRecordBeforeCreate`** - Set fields BEFORE commit, not after
3. **Generate random password** - User's password is hashed, use generated random password
4. **Use environment variables** - Don't hardcode API URLs
5. **Return actual encryption version** - Don't hardcode version numbers
6. **Test user creation end-to-end** - Verify records are actually created

**Files Modified:**

- `apps/backend/pb_hooks/01-create-wallet.pb.js` - Hook fix
- `wallet-api/server.js` - Version fix (now returns `encryptedPrivateKey.version`)

**Verification Steps (MUST DO):**

```bash
# 1. Test user creation
curl -X POST http://localhost:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"TestPass123!","passwordConfirm":"TestPass123!"}'

# Expected: 200 OK with user record including wallet, daccPublickey, pin
# NOT expected: 400 error or record without wallet fields

# 2. Verify hook has e.next()
grep "e.next()" apps/backend/pb_hooks/01-create-wallet.pb.js
# Should exist at end of hook function

# 3. Verify encryption version
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123"}' | jq '.data.version'
# Should return: 4 (AES-256-GCM), NOT 3 (XOR)
```

**Anti-Patterns (NEVER DO):**

- ❌ Use `onRecordCreate` without `e.next()` - record won't commit
- ❌ Hardcode wallet API URLs - use `$os.getenv("WALLET_SRV_URL")`
- ❌ Use user's password for wallet - generate random password
- ❌ Hardcode version numbers - return actual encryption version

**Success Criteria:**

- [ ] User creation returns 200 OK with wallet fields populated
- [ ] `e.next()` exists in hook at line 89
- [ ] Wallet API returns `version: 4` (AES-256-GCM)
- [ ] WALLET_SRV_URL uses environment variable

---

## REMAINING ISSUES - IMPLEMENTATION GUIDE

### 1. Mock Contract Interactions (P0 - Security Critical)

**Problem:** 4 wallet-api endpoints return mock data instead of real blockchain transactions:

- `/api/v1/wallet/mint-egg` (line 388)
- `/api/v1/wallet/claim-commission` (line 422)
- `/api/v1/wallet/mint-food` (line 457)
- `/api/v1/wallet/feed-egg` (line 493)

**What Needs Implementation:**

These endpoints currently return fake transaction hashes. Real implementation requires:

```javascript
// Current (MOCK - DON'T USE IN PRODUCTION):
app.post("/api/v1/wallet/mint-egg", async (req, res) => {
  // ... validation ...
  res.json({
    success: true,
    data: {
      transaction_hash: "0xMOCK_HASH", // ❌ FAKE
      token_id: Math.floor(Math.random() * 1000), // ❌ FAKE
    },
  })
})

// Required (REAL CONTRACT CALL):
app.post("/api/v1/wallet/mint-egg", async (req, res) => {
  const { user_address, egg_id } = req.body

  // 1. Get user's encrypted private key from database
  const user = await pocketBase.collection("users").getOne(user_address)
  const privateKey = await decryptPrivateKey(user.encrypted_private_key, MASTER_KEY + user.id)

  // 2. Create ethers.js signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(privateKey, provider)

  // 3. Connect to NFT contract
  const nftContract = new ethers.Contract(
    process.env.NEXT_PUBLIC_EGG_NFT_ADDRESS,
    EGG_NFT_ABI,
    signer
  )

  // 4. Call smart contract function
  const tx = await nftContract.mintEgg(egg_id)
  await tx.wait() // Wait for confirmation

  // 5. Return real transaction hash
  res.json({
    success: true,
    data: {
      transaction_hash: tx.hash, // ✅ REAL
      token_id: await nftContract.tokenOfOwnerByIndex(user_address, 0), // ✅ REAL
    },
  })
})
```

**Prerequisites:**

1. Smart contracts deployed to target network
2. Contract addresses file exists (`/contract-addresses.json`)
3. RPC endpoint configured (`NEXT_PUBLIC_RPC_URL` in `.env`)
4. Contract ABIs defined (array of function signatures)

**Files to Create/Modify:**

- `wallet-api/server.js` - Replace 4 mock endpoints with real contract calls
- `wallet-api/contracts/` - Directory for contract ABIs
- `.env` - Add `RPC_URL`, contract addresses

**Testing:**

```bash
# Test mint-egg endpoint
curl -X POST http://localhost:3001/api/v1/wallet/mint-egg \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x...","egg_id":1}'
# Expected: Real transaction hash, not mock

# Verify on blockchain explorer
# Check transaction hash on BSC testnet: https://testnet.bscscan.com/tx/HASH
```

**Dependencies:** Contract deployment must complete first.

---

### 2. Feed Feature (P2 - Nice to Have)

**Problem:** UI button exists in `apps/web/app/eggs/page.tsx:89` but does nothing.

**What Needs Implementation:**

**Frontend** (`apps/web/app/eggs/page.tsx`):

```typescript
// Current (TODO comment):
// TODO: Implement feed flow

// Required implementation:
const handleFeed = async (eggId: number, foodIds: number[]) => {
  try {
    const signer = await getSigner()
    const contract = getEggNftContract(signer)

    // Call smart contract
    const tx = await contract.feedEgg(eggId, foodIds)
    await tx.wait()

    // Update UI
    toast.success("Egg fed successfully!")
    refreshEggData()
  } catch (error) {
    toast.error("Failed to feed egg")
  }
}
```

**Backend Hook** (`apps/backend/pb_hooks/16-feed-egg.pb.js`):

```javascript
routerAdd("POST", "/api/v2/feed-egg", (e) => {
  const { users } = e.requireAuth()
  const { egg_token_id, food_ids } = e.parseBody()

  // 1. Validate user owns the egg NFT
  // 2. Validate user owns the food NFTs
  // 3. Call wallet-api to execute transaction
  // 4. Mark food NFTs as consumed
  // 5. Update egg properties (food_count, rarity_bonus)

  e.json(200, {
    success: true,
    data: {
      transaction_hash: tx.hash,
      new_food_count: newCount,
      rarity_bonus: bonus,
    },
  })
})
```

**Wallet API** (`wallet-api/server.js`):

- Already has `/api/v1/wallet/feed-egg` endpoint (line 493) - needs real contract call

**Dependencies:**

- Contract interactions implemented (Issue #1)
- Food NFT contract deployed
- Egg NFT contract has `feedEgg` function

---

### 3. Play Feature (P2 - Nice to Have)

**Problem:** UI button exists in `apps/web/app/eggs/page.tsx:95` but does nothing.

**What Needs Implementation:**

Similar to Feed feature, but for play/interaction mechanics. Exact implementation depends on game design:

**Frontend** (`apps/web/app/eggs/page.tsx`):

```typescript
// Current (TODO comment):
// TODO: Implement play interaction

// Required implementation (example):
const handlePlay = async (eggId: number) => {
  try {
    const signer = await getSigner()
    const contract = getEggNftContract(signer)

    const tx = await contract.playWithEgg(eggId)
    await tx.wait()

    toast.success("Played with egg!")
  } catch (error) {
    toast.error("Failed to play")
  }
}
```

**Status:** Waiting for game design specification (play = minigame? interaction? earning mechanism?).

---

### 4. RED PHASE Test (P1 - Quality Issue)

**Problem:** Test file `apps/backend/pb_hooks/13-track-deposit.test.js` line 703 states:

```javascript
console.log("Status: RED PHASE - Tests will fail until hook is implemented")
```

**What Needs Implementation:**

**Hook File** (`apps/backend/pb_hooks/13-track-deposit.pb.js`):

```javascript
// Hook needs to:
// 1. Poll USDT Transfer events for user deposits
// 2. Track deposit amounts and timestamps
// 3. Update user's deposit records in PocketBase
// 4. Handle duplicate transaction detection
// 5. Emit events for deposit confirmations

routerAdd("POST", "/api/v2/track-deposit", (e) => {
  const { users } = e.requireAuth()
  const { transaction_hash } = e.parseBody()

  // Implementation needed:
  // 1. Verify transaction on blockchain
  // 2. Check if already tracked (prevent duplicates)
  // 3. Create deposit record
  // 4. Update user balance if needed

  e.json(200, {
    success: true,
    data: {
      deposit_id: record.id,
      amount: amount,
      confirmed: true,
    },
  })
})
```

**Testing:**

```bash
# Run test to verify
bun test apps/backend/pb_hooks/13-track-deposit.test.js
# Expected: All tests pass
# Current: Tests fail with "hook not implemented"
```

---

## SUMMARY - Fixed vs Remaining

| Category                     | Count                 | Files                                            |
| ---------------------------- | --------------------- | ------------------------------------------------ |
| **Fixed & Committed**        | 6 issues              | `01-create-wallet.pb.js`, `wallet-api/server.js` |
| **Blocked (Need Contracts)** | 1 issue (4 endpoints) | `wallet-api/server.js`                           |
| **Deferred (Need Decision)** | 2 issues              | `apps/web/app/eggs/page.tsx`                     |
| **Pending Implementation**   | 1 issue               | `13-track-deposit.pb.js`                         |

**Next Actions:**

1. Deploy smart contracts → Fix mock contract interactions
2. Decide on Feed/Play features → Implement UI + backend
3. Implement track-deposit hook → Fix RED PHASE test

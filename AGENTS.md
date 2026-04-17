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

### Common Deployment Mistakes

**1. Wrong Directory**

- Production is at `/root/eggo-world-pb` NOT `/root/eggo-pocketbase`
- Verify: `ssh root@host "find /root -name 'pb_hooks' -type d"`

**2. PocketBase Runs as Process, NOT Docker**

- Production uses binary: `./pocketbase serve` (not Docker)
- Check: `ps aux | grep 'pocketbase serve'`
- Don't: Try `docker-compose restart pocketbase` (doesn't exist)

**3. Hook Loading Location**

- PocketBase loads `pb_hooks/` from CURRENT WORKING DIRECTORY
- MUST `cd /root/eggo-world-pb/apps/backend` before starting
- NOT from `/root` or project root!

**4. SSH Configuration**

- Set BEFORE deployment:

```bash
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
export REGISTRY="ghcr.io"
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

#### Upload Files

```bash
# Upload new hooks
scp -o StrictHostKeyChecking=no apps/backend/pb_hooks/NN-*.pb.js \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/

# Upload new collections
scp -o StrictHostKeyChecking=no apps/backend/collections/*.json \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/collections/

# Verify uploaded
ssh root@host "ls -la /root/eggo-world-pb/apps/backend/pb_hooks/"
ssh root@host "head -5 /root/eggo-world-pb/apps/backend/pb_hooks/12-*.pb.js"
```

#### Restart PocketBase

```bash
# Kill existing
ssh root@204.168.144.14 "pkill -f 'pocketbase serve'"

# Start from correct directory
ssh root@204.168.144.14 "
  sleep 3 &&
  cd /root/eggo-world-pb/apps/backend &&
  ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
"
```

#### Verify

```bash
# Health check
curl -s https://pb.eggoworld.io/api/health

# Check logs for hook loading
ssh root@host "tail -50 /tmp/pocketbase.log | grep -E 'endpoint|hook|registered'"

# Test endpoint with auth
TOKEN="your-auth-token"
curl -X POST https://pb.eggoworld.io/api/v2/hot-wallet/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x..."}'
```

---

### Quick Reference

**SSH Access**

```bash
ssh -o StrictHostKeyChecking=no root@204.168.144.14
```

**Upload Hook**

```bash
scp -o StrictHostKeyChecking=no apps/backend/pb_hooks/12-*.pb.js \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
```

**Restart PocketBase**

```bash
ssh root@204.168.144.14 "
  pkill -f 'pocketbase serve' &&
  sleep 3 &&
  cd /root/eggo-world-pb/apps/backend &&
  ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
"
```

**Check Logs**

```bash
ssh root@204.168.144.14 "tail -50 /tmp/pocketbase.log | grep -E 'endpoint|hook'"
```

---

### Common Errors & Solutions

**Error:** `address already in use`
**Fix:** `pkill -f 'pocketbase serve'` then restart

**Error:** `No such container`
**Cause:** Using Docker when binary runs directly
**Fix:** Use `ps aux | grep pocketbase` instead

**Error:** `pb_hooks: No such file`
**Cause:** Wrong path
**Fix:** `find /root -name 'pb_hooks' -type d`

**Error:** Hooks not loading
**Cause:** Wrong working directory
**Fix:** `cd apps/backend` before starting PocketBase

**Error:** 400/401/403 on endpoint
**Cause:** Missing auth
**Fix:** Add `Authorization: Bearer <token>` header

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

**Success Criteria:**

- [ ] User creation API returns 200 OK (not 400 validation error)
- [ ] User record has: `wallet`, `daccPublickey`, `pin` fields populated
- [ ] Logs show: "Wallet created successfully: 0x..."
- [ ] daccPublickey format matches: `daccPublickey_0x..._...` (starts with `daccPublickey_`)

---

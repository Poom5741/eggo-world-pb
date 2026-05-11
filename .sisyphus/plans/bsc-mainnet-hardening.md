# BSC Mainnet Production Hardening

## TL;DR

> **Quick Summary**: Fix 2 blocking code bugs and 4 hardening issues identified in production readiness audit for 3 scoped features: Buy Egg (mint), Deposit USDT, Withdraw USDT. Deployment config swap to mainnet is a separate later step.
>
> **Deliverables**:
>
> - Fixed `13-track-deposit.pb.js` (merge conflict resolved, correct auth pattern used)
> - Fixed BSCScan URLs across frontend (2 files)
> - Rate limiting middleware added to wallet-api
> - Withdraw flow reordered (audit record first, balance deduction second)
> - Frontend reads withdrawal fee from backend instead of hardcoding
> - `.env.example` updated, `.env` added to `.gitignore` enforcement
>
> **Estimated Effort**: Short (2-3 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (merge conflict) → all others parallel

---

## Context

### Original Request

User asked: "analysis if we scopedown focus on buying egg. deposit withdraw usdt. is our codebase is production ready to deploy on bsc mainnet?" — Audit completed, identified code-quality issues that must be fixed before ANY deployment (testnet or mainnet).

### Interview Summary

**Key Discussions**:

- Scope: 3 features only (Buy Egg, Deposit USDT, Withdraw USDT)
- KYC: Explicitly NOT needed — removed from scope
- Deployment to BSC mainnet: Explicitly excluded — that's a later step
- Focus: Code bugs and hardening only

**Research Findings**:

- Metis found merge conflict has TWO conflict regions AND the "Updated upstream" version uses broken `e.requireAuth()` pattern
- Deposit page also has wrong testnet URL (not just mint page)
- `.env` keys are NOT in git history (gitignore catches them) but accidental commit risk remains

### Metis Review

**Identified Gaps** (addressed):

- Two merge conflict regions, not one — must resolve BOTH, keeping the correct auth pattern (`e.requestInfo().auth?.id`)
- Deposit page URL also needs fixing — added to Task 2 scope
- `.env` files already gitignored — plan adjusted to enforce + document rather than "remove from git"

---

## Work Objectives

### Core Objective

Fix all production-blocking code bugs and harden the 3 scoped features for reliable operation on any EVM chain.

### Concrete Deliverables

- `apps/backend/pb_hooks/13-track-deposit.pb.js` — merge conflict resolved, working code
- `apps/web/app/mint/page.tsx` — correct BSCScan URL
- `apps/web/app/dashboard/deposit/page.tsx` — correct BSCScan URL
- `wallet-api/server.js` — rate limiting middleware added
- `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` — balance deduction after audit record
- `apps/web/app/dashboard/withdraw/page.tsx` — reads fee from backend
- New endpoint or existing endpoint extended to expose withdrawal fee
- `.gitignore` enforced, `.env.example` updated with security notes

### Definition of Done

- [ ] `13-track-deposit.pb.js` has zero merge conflict markers and uses `e.requestInfo().auth?.id`
- [ ] BSCScan URLs in mint and deposit pages point to `https://bscscan.com/tx`
- [ ] wallet-api returns 429 for >100 requests/15min per IP
- [ ] Withdraw: audit record created BEFORE balance deducted
- [ ] Frontend withdrawal fee matches backend `wallet_configs` value
- [ ] No `.env` files tracked by git

### Must Have

- All P0 and P1 fixes from audit
- Code must work on current testnet (chain 7117) AND be ready for mainnet config swap
- Merge conflict resolution must use `e.requestInfo().auth?.id` (NOT `e.requireAuth()`)
- Rate limiting must not break existing PocketBase hook calls (internal network)

### Must NOT Have (Guardrails)

- No deployment to BSC mainnet
- No KYC implementation
- No smart contract changes
- No new dependencies beyond express-rate-limit
- No changes to game logic (egg price, food price, etc.)
- No UI/UX redesign — only fix bugs and harden

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: NO (no test framework for pb_hooks)
- **Automated tests**: None for PocketBase hooks (they run in Goja VM)
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS — every task has manual QA scenarios

### QA Policy

Every task includes agent-executed QA scenarios with evidence capture.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **PocketBase Hooks**: Use `curl` to test endpoints directly
- **Frontend**: Use Playwright (browser) to verify UI behavior
- **wallet-api**: Use `curl` to test rate limiting and responses

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — blocking code bugs):
├── Task 1: Fix merge conflict in 13-track-deposit.pb.js [quick]
└── Task 2: Fix BSCScan URLs across frontend [quick]

Wave 2 (After Wave 1 — hardening, MAX PARALLEL):
├── Task 3: Add rate limiting to wallet-api [unspecified-high]
├── Task 4: Reorder withdraw flow (audit record first) [quick]
├── Task 5: Frontend reads withdrawal fee from backend [unspecified-high]
└── Task 6: Enforce .gitignore for .env files + security notes [quick]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Full integration QA — mint, deposit, withdraw flows [deep]
└── Task F2: Scope fidelity check [deep]
```

### Dependency Matrix

| Task | Depends On | Blocks |
| ---- | ---------- | ------ |
| 1    | -          | F1     |
| 2    | -          | F1     |
| 3    | -          | F1     |
| 4    | -          | F1     |
| 5    | -          | F1     |
| 6    | -          | F1     |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `quick`
- **Wave 2**: 4 tasks — T3 → `unspecified-high`, T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`
- **Final**: 2 tasks — F1 → `deep`, F2 → `deep`

---

## TODOs

- [x] 1. **Fix merge conflict in 13-track-deposit.pb.js**

  **What to do**:
  - Read `apps/backend/pb_hooks/13-track-deposit.pb.js` completely
  - The file has TWO merge conflict regions (lines ~1 and ~406)
  - The `<<<<<<< Updated upstream` version uses `e.requireAuth()` which is BROKEN in PocketBase v0.23.4
  - The `=======` / `>>>>>>> Stashed changes` version uses `e.requestInfo().auth?.id` which IS correct
  - Resolve ALL conflict markers by keeping the "Stashed changes" version (the one using `requestInfo().auth`)
  - Remove ALL `<<<<<<<`, `=======`, `>>>>>>>` markers
  - Verify no `requireAuth` calls remain in the file — `e.requestInfo().auth?.id` is the ONLY working auth method in v0.23.4
  - Verify the file is valid JavaScript (no syntax errors, no dangling markers)

  **Must NOT do**:
  - Do NOT use `e.requireAuth()` — it's broken in v0.23.4
  - Do NOT use `$apis.requireAuth(e)` — also broken
  - Do NOT remove any non-conflict code
  - Do NOT add new features — just resolve the conflict

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js:1-4` — Correct auth pattern: `e.requestInfo().auth?.id`
  - `apps/backend/pb_hooks/09-withdraw-usdt.pb.js:2-3` — Correct auth pattern with null check

  **API/Type References**:
  - `AGENTS.md` — "PocketBase Hook Development Patterns" section — documents that `e.requestInfo().auth` is the ONLY working auth method

  **Acceptance Criteria**:
  - [ ] `grep -c "<<<<<<" apps/backend/pb_hooks/13-track-deposit.pb.js` returns 0
  - [ ] `grep -c "=======" apps/backend/pb_hooks/13-track-deposit.pb.js` returns 0
  - [ ] `grep -c ">>>>>>" apps/backend/pb_hooks/13-track-deposit.pb.js` returns 0
  - [ ] `grep "requestInfo().auth" apps/backend/pb_hooks/13-track-deposit.pb.js` returns at least 1 match
  - [ ] `grep "requireAuth" apps/backend/pb_hooks/13-track-deposit.pb.js` returns 0 matches
  - [ ] File parses as valid JavaScript (no syntax errors)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Merge conflict fully resolved
    Tool: Bash
    Preconditions: File exists at apps/backend/pb_hooks/13-track-deposit.pb.js
    Steps:
      1. Run: grep -c "<<<<<<" apps/backend/pb_hooks/13-track-deposit.pb.js
      2. Run: grep -c "=======" apps/backend/pb_hooks/13-track-deposit.pb.js
      3. Run: grep -c ">>>>>>" apps/backend/pb_hooks/13-track-deposit.pb.js
      4. Run: grep "requestInfo().auth" apps/backend/pb_hooks/13-track-deposit.pb.js
    Expected Result: Zero conflict markers. At least one `requestInfo().auth` pattern found.
    Failure Indicators: Any `<<<<<<`, `=======`, or `>>>>>>` markers found. `requireAuth` found.
    Evidence: .sisyphus/evidence/task-1-conflict-resolved.txt
  ```

  **Commit**: YES
  - Message: `fix(deposit): resolve merge conflict and use correct auth pattern`
  - Files: `apps/backend/pb_hooks/13-track-deposit.pb.js`

- [x] 2. **Fix BSCScan URLs across frontend**

  **What to do**:
  - In `apps/web/app/mint/page.tsx`: Change `BSCSCAN_BASE_URL = 'https://rpc.0xl3.com/tx'` to `BSCSCAN_BASE_URL = 'https://bscscan.com/tx'`
  - In `apps/web/app/dashboard/deposit/page.tsx`: Search for any `0xl3` or testnet URLs and replace with `bscscan.com` equivalents
  - Search ALL other frontend files for similar wrong explorer URLs (any `rpc.0xl3.com`, `0xl3.testnet`, or similar testnet-specific block explorer URLs)
  - Ensure BSCScan URL uses `https://bscscan.com/tx` as the base pattern
  - BSCScan mainnet URL format: `https://bscscan.com/tx/{txHash}`

  **Must NOT do**:
  - Do NOT change RPC URLs (those are for blockchain connections, not UI)
  - Do NOT change contract addresses
  - Do NOT change chain IDs
  - Only fix BLOCK EXPLORER URLs visible to users

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/web/app/mint/page.tsx:16` — Current wrong URL `BSCSCAN_BASE_URL = 'https://rpc.0xl3.com/tx'`
  - `apps/web/app/dashboard/deposit/page.tsx:350` — Another testnet URL `https://0xl3.testnet.eggoworld.io/tx/`

  **Acceptance Criteria**:
  - [ ] `grep "0xl3" apps/web/app/mint/page.tsx` returns 0 (or only in comments)
  - [ ] `grep "0xl3" apps/web/app/dashboard/deposit/page.tsx` returns 0 (or only in comments)
  - [ ] `grep "bscscan.com" apps/web/app/mint/page.tsx` returns at least 1 match
  - [ ] No testnet-specific explorer URLs remain in any frontend page

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: BSCScan URLs point to real block explorer
    Tool: Bash
    Preconditions: Frontend files exist
    Steps:
      1. Run: grep -rn "0xl3" apps/web/app/ --include="*.tsx" --include="*.ts"
      2. Run: grep -rn "bscscan.com" apps/web/app/ --include="*.tsx" --include="*.ts"
      3. Verify mint page and deposit page use bscscan.com
    Expected Result: Zero `0xl3` URLs remaining. `bscscan.com` found in mint and deposit pages.
    Failure Indicators: Any `0xl3` URLs that are block explorer links (not RPC).
    Evidence: .sisyphus/evidence/task-2-bscscan-urls.txt
  ```

  **Commit**: YES
  - Message: `fix(ui): correct block explorer URLs to use BSCScan`
  - Files: `apps/web/app/mint/page.tsx`, `apps/web/app/dashboard/deposit/page.tsx`, any other files with wrong URLs

- [x] 3. **Add rate limiting middleware to wallet-api**

  **What to do**:
  - Add `express-rate-limit` dependency to wallet-api
  - Configure rate limiting: 100 requests per 15 minutes per IP for general endpoints
  - Add stricter limits: 10 requests per 15 minutes for mint and withdraw endpoints
  - Apply rate limiting BEFORE route handlers in `wallet-api/server.js`
  - Ensure internal PocketBase → wallet-api calls are NOT rate-limited (they come from same Docker network)
  - Add appropriate error response: 429 with `{ success: false, error: { message: "Too many requests", code: "RATE_LIMITED" } }`

  **Must NOT do**:
  - Do NOT rate-limit the PocketBase hook calls (internal network)
  - Do NOT add rate limiting to PocketBase hooks themselves
  - Do NOT change existing endpoint behavior or response formats
  - Do NOT add authentication changes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `wallet-api/server.js:13-14` — Existing middleware: `cors()`, `helmet()` — add rate-limit after these

  **External References**:
  - `express-rate-limit` npm package: https://www.npmjs.com/package/express-rate-limit

  **Acceptance Criteria**:
  - [ ] `express-rate-limit` is in wallet-api's package.json dependencies
  - [ ] `grep "rateLimit" wallet-api/server.js` returns matches
  - [ ] Sending >100 requests in 15 minutes to `/api/wallet/balance` returns 429
  - [ ] Sending >10 requests in 15 minutes to `/api/wallet/mint-egg` returns 429
  - [ ] Normal requests (< limit) still return 200

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Rate limiting blocks excessive requests
    Tool: Bash (curl)
    Preconditions: wallet-api server running on port 3001
    Steps:
      1. Send 5 normal requests to /api/v1/wallet/balance — all should succeed (200/404/400)
      2. Send 15 rapid requests to /api/wallet/mint-egg — first 10 should succeed, 11th should return 429
    Expected Result: Rate limiting activates after threshold, returns 429 with error message
    Failure Indicators: No 429 status returned even after exceeding limit
    Evidence: .sisyphus/evidence/task-3-rate-limit.txt
  ```

  **Commit**: YES
  - Message: `feat(security): add rate limiting to wallet-api`
  - Files: `wallet-api/server.js`, `wallet-api/package.json`

- [x] 4. **Reorder withdraw flow: create audit record before deducting balance**

  **What to do**:
  - In `apps/backend/pb_hooks/09-withdraw-usdt.pb.js`, rearrange the code so that:
    1. First: create `withdrawalRecord` with status `"pending"`
    2. Then: deduct balance from `walletRecord` and `userRecord`
    3. Then: update `withdrawalRecord` status to `"completed"` with tx hash
    4. Save all records
  - This ensures that if anything fails during the process, there's always an audit trail showing the pending withdrawal
  - If the blockchain call fails, the pending record can be investigated manually
  - Add error handling: if balance deduction fails after record creation, mark record as `"failed"`

  **Must NOT do**:
  - Do NOT change the withdrawal fee calculation
  - Do NOT change the wallet-api `/api/v1/wallet/transfer` call
  - Do NOT add KYC logic
  - Do NOT change the success response format

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/backend/pb_hooks/09-withdraw-usdt.pb.js:120-165` — Current flow where balance is deducted before audit record (WRONG order)

  **Acceptance Criteria**:
  - [ ] `withdrawalRecord` creation appears BEFORE `walletRecord.set("usdt_balance", ...)` in the file
  - [ ] New records are initialized with `status: "pending"`
  - [ ] On success, status is updated to `"completed"` with tx hash
  - [ ] On failure, status is updated to `"failed"` with error info

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Withdraw creates audit trail before balance deduction
    Tool: Bash (grep)
    Preconditions: File exists
    Steps:
      1. grep -n "withdrawalRecord" apps/backend/pb_hooks/09-withdraw-usdt.pb.js — verify it appears at a LOWER line number than "usdt_balance" deduction
      2. grep "pending" apps/backend/pb_hooks/09-withdraw-usdt.pb.js — verify initial status is "pending"
      3. grep "failed" apps/backend/pb_hooks/09-withdraw-usdt.pb.js — verify error handling sets status to "failed"
    Expected Result: Audit record creation line number < balance deduction line number. "pending" and "failed" statuses found.
    Failure Indicators: Audit record creation AFTER balance deduction. Missing error status handling.
    Evidence: .sisyphus/evidence/task-4-withdraw-reorder.txt
  ```

  **Commit**: YES
  - Message: `fix(withdraw): create audit record before deducting balance`
  - Files: `apps/backend/pb_hooks/09-withdraw-usdt.pb.js`

- [x] 5. **Frontend reads withdrawal fee from backend instead of hardcoding**

  **What to do**:
  - In `apps/web/app/dashboard/withdraw/page.tsx`: Replace `const withdrawalFeeRate = 0.05` with a fetch to the backend
  - Add a new PocketBase hook endpoint: `GET /api/v2/wallet/withdraw-fee` that reads from `wallet_configs` collection and returns the fee rate
  - OR: Extend the existing `POST /api/v2/hot-wallet/balance` response to include `withdrawal_fee_rate`
  - Frontend should call this endpoint on page load and use the returned rate
  - Fallback to 0.05 if the endpoint fails (graceful degradation)
  - Show the fee percentage to the user in the UI (it already shows the calculated fee amount)

  **Must NOT do**:
  - Do NOT change the withdrawal logic or fee calculation on the backend
  - Do NOT remove the fallback to 0.05 (graceful degradation for offline/error)
  - Do NOT add new collections or migrations

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/backend/pb_hooks/09-withdraw-usdt.pb.js:52-60` — Backend reads fee from `wallet_configs` with 0.05 fallback
  - `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` — Existing balance endpoint, best place to add fee rate
  - `apps/web/app/dashboard/withdraw/page.tsx:49` — Current hardcoded `withdrawalFeeRate = 0.05`

  **Acceptance Criteria**:
  - [ ] `withdraw/page.tsx` fetches fee rate from backend API
  - [ ] Fallback to 0.05 if API fails
  - [ ] New `GET /api/v2/wallet/withdraw-fee` endpoint OR `hot-wallet/balance` includes `withdrawal_fee_rate`
  - [ ] `grep "0.05" apps/web/app/dashboard/withdraw/page.tsx` only shows the fallback value, not the primary source

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Frontend reads fee from backend
    Tool: Bash (grep + curl)
    Preconditions: PocketBase running
    Steps:
      1. grep "withdraw-fee\|withdrawal_fee_rate\|wallet_configs" apps/web/app/dashboard/withdraw/page.tsx — verify backend call exists
      2. curl -X POST http://localhost:8090/api/v2/wallet/withdraw-fee — verify endpoint returns fee rate
      3. OR: curl -X POST http://localhost:8090/api/v2/hot-wallet/balance — verify response includes withdrawal_fee_rate
    Expected Result: Frontend fetches fee from backend. Fallback to 0.05 exists.
    Failure Indicators: Fee still hardcoded as primary source. No backend endpoint for fee.
    Evidence: .sisyphus/evidence/task-5-fee-from-backend.txt
  ```

  **Commit**: YES
  - Message: `fix(withdraw): read withdrawal fee from backend config instead of hardcoding`
  - Files: `apps/web/app/dashboard/withdraw/page.tsx`, `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` (or new hook file)

- [x] 6. **Enforce .gitignore for .env files and add security notes**

  **What to do**:
  - Verify `.gitignore` covers all `.env` files: check `**/.env`, `**/.env.*`, `**/.env.local` patterns
  - Run `git ls-files | grep '\.env'` to confirm no `.env` files are tracked
  - If any are tracked, remove them with `git rm --cached`
  - Update `wallet-api/.env.example` with clear security warnings (NEVER commit real keys)
  - Update `apps/backend/.env` with comment: `# NEVER commit this file with real values`
  - Ensure `.env.production` template exists with placeholders only

  **Must NOT do**:
  - Do NOT overwrite existing `.env` files with new values
  - Do NOT rotate keys (that's a deployment step)
  - Do NOT add `.env` files to git

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `wallet-api/.env` — Contains real keys (local only, but needs protection)
  - `wallet-api/.env.example` — Template file (should have placeholders, not real keys)

  **Acceptance Criteria**:
  - [ ] `git ls-files | grep '\.env$'` returns empty (no .env files tracked)
  - [ ] `.gitignore` includes `**/.env` pattern
  - [ ] `.env.example` files have clear security warnings
  - [ ] `.env.production` has placeholders, not real values

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: No .env files tracked by git
    Tool: Bash
    Preconditions: Git repo exists
    Steps:
      1. Run: git ls-files | grep '\.env$'
      2. Run: git ls-files | grep '\.env.local'
      3. Run: cat .gitignore | grep -c '\.env'
    Expected Result: Step 1 and 2 return empty. Step 3 returns >= 1 (gitignore covers .env).
    Failure Indicators: Any .env or .env.local files tracked by git.
    Evidence: .sisyphus/evidence/task-6-gitignore-check.txt
  ```

  **Commit**: YES
  - Message: `chore(security): enforce .gitignore for .env files and add security notes`
  - Files: `.gitignore`, `wallet-api/.env.example`, `wallet-api/.env.production`

---

## Final Verification Wave (MANDATORY)

- [x] F1. **Full Integration QA** — `deep`
      Test all 3 features end-to-end: mint egg, deposit USDT tracking, withdraw USDT. Verify merge conflict is resolved, BSCScan links work, rate limiting blocks spam, withdraw creates audit record before deduction, frontend shows correct fee.
      Evidence: `.sisyphus/evidence/final-qa/`

- [x] F2. **Scope Fidelity Check** — `deep`
      For each task: verify "What to do" matches actual diff. Confirm no scope creep (no UI redesign, no deployment config, no KYC, no contract changes). Check all Must NOT Have items are respected.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `fix(deposit): resolve merge conflict and use correct auth pattern` — `13-track-deposit.pb.js`
- **Wave 1**: `fix(ui): correct BSCScan URLs for block explorer` — `mint/page.tsx`, `deposit/page.tsx`
- **Wave 2**: `feat(security): add rate limiting to wallet-api` — `server.js`, `package.json`
- **Wave 2**: `fix(withdraw): create audit record before deducting balance` — `09-withdraw-usdt.pb.js`
- **Wave 2**: `fix(withdraw): read fee from backend instead of hardcoding` — `withdraw/page.tsx`, new PB endpoint or existing endpoint extended
- **Wave 2**: `chore(security): enforce .gitignore for .env files` — `.gitignore`, `.env.example`
- **Final**: `chore: production hardening verification complete`

---

## Success Criteria

### Verification Commands

```bash
# Merge conflict resolved
grep -c "<<<<<<" apps/backend/pb_hooks/13-track-deposit.pb.js  # Expected: 0
grep -c "=======" apps/backend/pb_hooks/13-track-deposit.pb.js  # Expected: 0
grep -c ">>>>>>" apps/backend/pb_hooks/13-track-deposit.pb.js   # Expected: 0
grep "requestInfo().auth" apps/backend/pb_hooks/13-track-deposit.pb.js  # Expected: found
grep "requireAuth" apps/backend/pb_hooks/13-track-deposit.pb.js  # Expected: NOT found

# BSCScan URLs correct
grep "bscscan.com" apps/web/app/mint/page.tsx  # Expected: found
grep "bscscan.com" apps/web/app/dashboard/deposit/page.tsx  # Expected: found
grep "0xl3" apps/web/app/mint/page.tsx  # Expected: NOT found (or only in comments)
grep "0xl3" apps/web/app/dashboard/deposit/page.tsx  # Expected: NOT found (or only in comments)

# Rate limiting present
grep "rate" wallet-api/server.js  # Expected: found (rate-limit middleware)

# Withdraw: audit record before balance deduction
grep -n "withdrawalRecord" apps/backend/pb_hooks/09-withdraw-usdt.pb.js  # Should appear BEFORE walletRecord deduction lines

# Frontend reads fee from backend
grep "wallet_configs" apps/web/app/dashboard/withdraw/page.tsx  # Expected: found (or API call to get fee)

# .gitignore enforcement
git ls-files | grep "\.env$"  # Expected: empty (no .env tracked)
```

### Final Checklist

- [ ] Zero merge conflict markers in 13-track-deposit.pb.js
- [ ] All BSCScan links point to bscscan.com
- [ ] Rate limiting active on wallet-api
- [ ] Withdraw creates audit record before balance change
- [ ] Frontend withdrawal fee matches backend config
- [ ] No .env files tracked by git

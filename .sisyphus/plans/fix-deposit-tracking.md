# Fix Deposit Tracking: Wrong Contract Address + Wrong Decimals

## TL;DR

> **Quick Summary**: Deposit tracker queries the CommissionDistribution contract instead of USDT, so no deposits are ever detected. Also divides by 10^6 instead of 10^18, making amounts wrong.
>
> **Deliverables**:
>
> - Fix contract address bug (line 347)
> - Fix decimal precision bug (line 379)
> - Deploy fix to production
> - Verify deposit detection works end-to-end
>
> **Estimated Effort**: Quick (2-line fix + deployment + verification)
> **Parallel Execution**: NO — sequential (fix → test → deploy → verify)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request

User sent 1,000 USDT from Ledger to Eggo wallet via `cast`. On-chain transfer confirmed. Deposit page still shows stale balance — no deposit detected.

### Interview Summary

**Key Discussions**:

- Verified two bugs in `13-track-deposit.pb.js` via on-chain testing and direct code reading
- Confirmed bugs exist in production (SSH verification)
- Verified BSC USDT uses 18 decimals via `cast call decimals()` on both testnet and mainnet

**Research Findings**:

- Bug 1 (line 347): `eth_getLogs` queries `CommissionDistribution` contract — zero Transfer events found because USDT transfers happen on the USDT contract
- Bug 2 (line 379): Divides raw amount by 10^6 instead of 10^18 — confirmed via `cast call decimals()` returning 18 on both networks
- No similar bugs in other hooks (grep confirmed only `13-track-deposit.pb.js` affected)
- Background polling is disabled (PocketBase 0.23.4 JSVM lacks `setInterval`), so only the manual endpoint `POST /api/v2/deposit/poll` is active

### Metis Review

**Identified Gaps** (addressed):

- **Block pointer**: `last_polled_block` may be stale → Resolved: endpoint uses `currentBlock - 100` on first poll, so past deposits will be picked up
- **Idempotency**: Existing deposit records with wrong amounts → Resolved: Bug 1 means zero deposits were ever recorded, so no cleanup needed
- **Dead code**: `pollDeposits()` function uses correct address but is never called → Resolved: Not in scope, but noted for future cleanup

---

## Work Objectives

### Core Objective

Fix deposit tracking so USDT transfers to user wallets are detected and balances updated.

### Concrete Deliverables

- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Line 347: `CommissionDistribution` → `USDT`
- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Line 379: `Math.pow(10, 6)` → `Math.pow(10, 18)`
- Production deployment with verification

### Definition of Done

- [ ] Deposit tracker detects USDT Transfer events on correct contract
- [ ] Amount correctly converted from raw (18-decimal) to human-readable USDT
- [ ] Frontend deposit page shows updated balance after transfer
- [ ] Production deployment verified with logs showing deposit detection

### Must Have

- Fix both bugs in `13-track-deposit.pb.js`
- Deploy fix to production Docker container
- Verify deposit detection with on-chain test

### Must NOT Have (Guardrails)

- Do NOT change the frontend deposit page
- Do NOT change any other hook files
- Do NOT modify the `pollDeposits()` dead code function
- Do NOT change the confirmation threshold (12 blocks)
- Do NOT change the polling architecture (keep manual endpoint)
- Do NOT add `setInterval` or cron-based polling
- Do NOT touch the `checkPendingConfirmations` function logic
- Do NOT reset `last_polled_block` in production database manually

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: NO (unit tests for PB hooks don't exist)
- **Automated tests**: None (PB hooks can't be unit-tested in isolation)
- **Agent-Executed QA**: YES — on-chain verification via `cast`, curl API calls, and production log checks

### QA Policy

Every task includes agent-executed QA scenarios with evidence.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Fix — sequential, 2 edits in same file):
└── Task 1: Fix contract address + decimal precision in 13-track-deposit.pb.js [quick]

Wave 2 (Deploy — rebuild, upload, restart):
└── Task 2: Deploy fixed hook to production [quick]

Wave 3 (Verify — end-to-end confirmation):
└── Task 3: Verify deposit detection end-to-end [deep]

Wave FINAL (Review — 3 parallel checks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
└── Task F3: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 2 → Task 3 → F1-F3 → user okay
```

### Dependency Matrix

| Task | Depends On | Blocks    |
| ---- | ---------- | --------- |
| 1    | —          | 2, 3      |
| 2    | 1          | 3         |
| 3    | 2          | F1-F3     |
| F1   | 3          | user okay |
| F2   | 3          | user okay |
| F3   | 3          | user okay |

### Agent Dispatch Summary

- **Wave 1**: 1 task — T1 → `quick`
- **Wave 2**: 1 task — T2 → `quick`
- **Wave 3**: 1 task — T3 → `deep`
- **Wave FINAL**: 3 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `deep`

---

## TODOs

- [x] 1. Fix contract address and decimal precision in deposit tracker

  **What to do**:
  - In `apps/backend/pb_hooks/13-track-deposit.pb.js`, line 347:
    Change `CONFIG.blockchain.contracts.CommissionDistribution` to `CONFIG.blockchain.contracts.USDT`
  - In `apps/backend/pb_hooks/13-track-deposit.pb.js`, line 379:
    Change `Math.pow(10, 6)` to `Math.pow(10, 18)`
  - Verify no other references to `CommissionDistribution` in the deposit tracking logic (already confirmed: only line 347)

  **Must NOT do**:
  - Do not modify the `pollDeposits()` standalone function (dead code, out of scope)
  - Do not change any other hook files
  - Do not add new features or refactor

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Two targeted line edits, well-defined locations, no architectural decisions
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `sphere-backend`: Not Go code
    - `context7`: Not looking up external docs

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (first task)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL — Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `apps/backend/pb_hooks/13-track-deposit.pb.js:347` — Current bug: `CommissionDistribution` should be `USDT`
  - `apps/backend/pb_hooks/13-track-deposit.pb.js:66` — Correct pattern: `CONFIG.blockchain.contracts.USDT` (in standalone `pollDeposits()`)
  - `apps/backend/pb_hooks/13-track-deposit.pb.js:379` — Current bug: `Math.pow(10, 6)` should be `Math.pow(10, 18)`

  **API/Type References** (contracts to verify against):
  - BSC Testnet MockUSDT `0x150bf0042F8dEA96B350c30B80ff9D6F76CeC963` — `decimals()` returns 18
  - BSC Mainnet USDT `0x55d398326f99059fF775485246999027B3197955` — `decimals()` returns 18

  **External References**:
  - BSC USDT contract: 18 decimals, verified via `cast call`

  **WHY Each Reference Matters**:
  - Line 347: This is the exact line causing deposits to never be detected — the wrong contract address
  - Line 66: The correct pattern that the fix should match — shows `CONFIG.blockchain.contracts.USDT` is already used correctly in the dead code path
  - Line 379: The decimal precision bug — dividing by 10^6 gives amounts 10^12x too large
  - Decimals verification: Confirms on-chain that 18 is the correct value, not 6

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Bug fix — contract address changed correctly
    Tool: Bash (grep)
    Preconditions: File edited and saved
    Steps:
      1. Run: grep -n 'CommissionDistribution' apps/backend/pb_hooks/13-track-deposit.pb.js
      2. Assert: Line 347 does NOT contain "CommissionDistribution" in the address field
      3. Run: grep -n 'CONFIG.blockchain.contracts.USDT' apps/backend/pb_hooks/13-track-deposit.pb.js
      4. Assert: Line 347 NOW contains "CONFIG.blockchain.contracts.USDT"
    Expected Result: CommissionDistribution removed from line 347, replaced with USDT
    Failure Indicators: Line 347 still has CommissionDistribution
    Evidence: .sisyphus/evidence/task-1-contract-address-fix.txt

  Scenario: Bug fix — decimal precision changed correctly
    Tool: Bash (grep)
    Preconditions: File edited and saved
    Steps:
      1. Run: grep -n 'Math.pow(10, 6)' apps/backend/pb_hooks/13-track-deposit.pb.js
      2. Assert: No results (old code removed)
      3. Run: grep -n 'Math.pow(10, 18)' apps/backend/pb_hooks/13-track-deposit.pb.js
      4. Assert: Line 379 contains "Math.pow(10, 18)"
    Expected Result: 10^6 replaced with 10^18 on line 379
    Failure Indicators: Line 379 still has 10^6
    Evidence: .sisyphus/evidence/task-1-decimal-precision-fix.txt
  ```

  **Commit**: YES (group with Task 2)
  - Message: `fix(deposit): correct USDT contract address and decimal precision in deposit tracker`
  - Files: `apps/backend/pb_hooks/13-track-deposit.pb.js`

---

- [x] 2. Deploy fixed hook to production

  **What to do**:
  - Upload fixed `13-track-deposit.pb.js` to production server
  - Rebuild Docker image (hooks are baked in, not volume-mounted)
  - Restart PocketBase container
  - Wait for container to be healthy

  **Must NOT do**:
  - Do not modify any other files on production
  - Do not change environment variables
  - Do not touch the database directly

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Follows established deployment pattern from AGENTS.md, single file upload + rebuild
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `sphere-backend`: Not Go code

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References** (CRITICAL — Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `AGENTS.md` — "Production Deployment Workflow" section with exact commands
  - `AGENTS.md` — "IMPORTANT: Hooks are copied into Docker image during build, NOT mounted as volumes"

  **API/Type References**:
  - Production server: `root@204.168.144.14`, SSH key: `~/.ssh/poom-server`
  - Production path: `/root/eggo-world-pb`
  - Container: `eggo-pb`

  **External References**:
  - AGENTS.md deployment checklist with exact commands

  **WHY Each Reference Matters**:
  - AGENTS.md contains the exact deployment commands proven to work in previous sessions
  - Hooks must be rebuilt into Docker image, not just copied

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Hook file uploaded to production
    Tool: Bash (ssh + file check)
    Preconditions: SSH access available, file ready
    Steps:
      1. scp -i ~/.ssh/poom-server apps/backend/pb_hooks/13-track-deposit.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
      2. ssh -i ~/.ssh/poom-server root@204.168.144.14 "grep 'USDT' /root/eggo-world-pb/apps/backend/pb_hooks/13-track-deposit.pb.js | head -5"
      3. Assert: Output shows CONFIG.blockchain.contracts.USDT on the correct line
    Expected Result: Fixed file present on production server
    Evidence: .sisyphus/evidence/task-2-file-uploaded.txt

  Scenario: Docker image rebuilt and container restarted
    Tool: Bash (ssh)
    Preconditions: File uploaded
    Steps:
      1. ssh -i ~/.ssh/poom-server root@204.168.144.14 "cd /root/eggo-world-pb && docker compose build pocketbase && docker compose up -d pocketbase"
      2. Wait 10 seconds for container startup
      3. ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker ps | grep eggo-pb"
      4. Assert: Container is running and healthy
    Expected Result: Container running with new image containing fixed hook
    Failure Indicators: Container not running, health check fails
    Evidence: .sisyphus/evidence/task-2-container-restarted.txt

  Scenario: Hook loaded and endpoint registered
    Tool: Bash (ssh + logs)
    Preconditions: Container restarted
    Steps:
      1. ssh -i ~/.ssh/poom-server root@204.168.144.14 "docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=30 pocketbase | grep -i 'deposit'"
      2. Assert: Logs show "Deposit tracking endpoints registered"
    Expected Result: Deposit hook loaded successfully
    Failure Indicators: No deposit-related log entries, or error in hook loading
    Evidence: .sisyphus/evidence/task-2-hook-loaded.txt
  ```

  **Commit**: YES (group with Task 1)
  - Message: `fix(deposit): correct USDT contract address and decimal precision in deposit tracker`
  - Files: `apps/backend/pb_hooks/13-track-deposit.pb.js`

---

- [x] 3. Verify deposit detection end-to-end

  **What to do**:
  - Send a test USDT transfer to the Eggo wallet on BSC testnet using `cast`
  - Call the deposit poll endpoint `POST /api/v2/deposit/poll` to trigger deposit detection
  - Verify the deposit record appears in the `deposits` collection
  - Verify the `user_wallets.usdt_balance` is updated correctly
  - Check that the amount reflects 18-decimal division (not 6-decimal)

  **Must NOT do**:
  - Do not modify any code
  - Do not change database records manually
  - Do not skip verification steps

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: End-to-end verification requires multiple steps: on-chain tx, API call, database check, amount validation
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `browser`: Not testing a webpage, testing API + blockchain

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 2)
  - **Blocks**: F1-F3
  - **Blocked By**: Task 2

  **References** (CRITICAL — Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `apps/backend/pb_hooks/13-track-deposit.pb.js:288-458` — The endpoint handler being tested
  - `apps/web/app/dashboard/deposit/page.tsx:140-148` — How frontend calls the endpoint

  **API/Type References**:
  - Endpoint: `POST /api/v2/deposit/poll` with body `{"user_address": "0x..."}` and `Authorization: Bearer <token>`
  - BSC Testnet MockUSDT: `0x150bf0042F8dEA96B350c30B80ff9D6F76CeC963`
  - Eggo wallet: `0x7924505Ef254fd0DE3B1eA5f5cDDA825F2a5666a`
  - Ledger wallet: `0xf6943fB29C3487010a81A1A4dc548071778DA1F5`

  **External References**:
  - BSC Testnet RPC: `https://data-seed-prebsc-1-s1.binance.org:8545`
  - Production PocketBase: `https://pb.eggoworld.io`

  **WHY Each Reference Matters**:
  - The endpoint handler is the code under test — must understand expected input/output
  - The frontend code shows how the endpoint is called, which informs our test
  - The wallet addresses are needed for `cast send` and API calls

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Deposit detected after test transfer
    Tool: Bash (cast + curl)
    Preconditions: Task 2 deployed, Ledger connected, test USDT available
    Steps:
      1. Send 10 USDT from Ledger to Eggo wallet on BSC testnet:
         cast send 0x150bf0042F8dEA96B350c30B80ff9D6F76CeC963 "transfer(address,uint256)" 0x7924505Ef254fd0DE3B1eA5f5cDDA825F2a5666a 10000000000000000000 --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 --ledger
      2. Wait for transaction confirmation (check cast output for status=1)
      3. Call deposit poll endpoint:
         curl -X POST https://pb.eggoworld.io/api/v2/deposit/poll -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"user_address":"0x7924505Ef254fd0DE3B1eA5f5cDDA825F2a5666a"}'
      4. Assert: Response contains "success": true
      5. Assert: Response contains deposits array with at least one entry
      6. Assert: Amount value is approximately 10.0 (not 10^13 or 0.00001)
    Expected Result: Deposit detected with correct human-readable amount
    Failure Indicators: "success": false, empty deposits array, or amount wildly incorrect
    Evidence: .sisyphus/evidence/task-3-deposit-detected.txt

  Scenario: Amount correctly uses 18-decimal division
    Tool: Bash (curl + jq)
    Preconditions: Deposit poll called successfully
    Steps:
      1. From the deposit poll response, extract amount field
      2. Assert: amount is close to expected value (10 USDT, not 10000000000000 USDT)
      3. If amount shows 0.00001 USDT → 18 decimal division applied to 6-decimal raw (bug partially fixed)
      4. If amount shows 10000000000000 USDT → 6 decimal division applied to 18-decimal raw (bug not fixed)
      5. If amount shows ~10 USDT → correct
    Expected Result: Amount ≈ 10.0 USDT (correct 18-decimal division)
    Failure Indicators: Amount is off by factor of 10^12 in either direction
    Evidence: .sisyphus/evidence/task-3-amount-precision.txt

  Scenario: Wrong contract address would find zero events
    Tool: Bash (curl)
    Preconditions: Previous bugs exist (for regression verification)
    Steps:
      1. If we had the old code deployed, calling deposit/poll would return events_processed: 0
      2. With fixed code, calling deposit/poll returns events_processed > 0
      3. Verify in the API response that events_processed > 0 confirming the USDT contract is being queried
    Expected Result: events_processed > 0 indicates USDT contract is correctly queried
    Failure Indicators: events_processed = 0 (still querying wrong contract)
    Evidence: .sisyphus/evidence/task-3-contract-verification.txt
  ```

  **Commit**: NO (verification only, no code changes)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
      Review `13-track-deposit.pb.js` for: correct contract address on line 347 (`CONFIG.blockchain.contracts.USDT`), correct decimal precision on line 379 (`Math.pow(10, 18)`), no other `CommissionDistribution` references in deposit tracking logic, no other `Math.pow(10, 6)` references. Check that the rest of the file is unchanged.
      Output: `Line 347 [PASS/FAIL] | Line 379 [PASS/FAIL] | Other changes [NONE/UNEXPECTED] | VERDICT`

- [x] F3. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `fix(deposit): correct USDT contract address and decimal precision in deposit tracker` - apps/backend/pb_hooks/13-track-deposit.pb.js

---

## Success Criteria

### Verification Commands

```bash
# 1. Local code check
grep -n 'CommissionDistribution' apps/backend/pb_hooks/13-track-deposit.pb.js
# Expected: No match in address field (line 347 should show USDT)

grep -n 'Math.pow(10, 18)' apps/backend/pb_hooks/13-track-deposit.pb.js
# Expected: Line 379 shows Math.pow(10, 18)

# 2. Production deployment check
ssh -i ~/.ssh/poom-server root@204.168.144.14 "grep 'USDT' /root/eggo-world-pb/apps/backend/pb_hooks/13-track-deposit.pb.js | head -5"
# Expected: Shows CONFIG.blockchain.contracts.USDT on line 347

# 3. Deposit detection test
curl -s -X POST https://pb.eggoworld.io/api/v2/deposit/poll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_address":"0x7924505Ef254fd0DE3B1eA5f5cDDA825F2a5666a"}' | jq '.success, .data.new_balance'
# Expected: true, balance > 0
```

### Final Checklist

- [ ] Line 347 uses `CONFIG.blockchain.contracts.USDT` (not `CommissionDistribution`)
- [ ] Line 379 uses `Math.pow(10, 18)` (not `Math.pow(10, 6)`)
- [ ] No other `CommissionDistribution` references in deposit tracking logic
- [ ] Production deployment verified with logs
- [ ] Deposit detection confirms USDT transfers are found
- [ ] Amount calculation is correct (18-decimal division)

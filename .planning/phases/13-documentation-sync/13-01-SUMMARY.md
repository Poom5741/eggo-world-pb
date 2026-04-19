---
phase: "13"
plan: "01"
subsystem: "deposit-tracking"
tags: ["usdt", "deposit", "block-tracking", "confirmations", "security"]
dependency_graph:
  requires: ["12-wallet-api-contract-integration"]
  provides: ["SEC-05", "SEC-06", "SEC-07", "SEC-08"]
  affects: ["deposits collection", "user_wallets collection", "deposit poll hook", "deposit UI"]
tech_stack:
  added: ["block tracking", "confirmation checker", "reorg detection"]
  patterns: ["pending→confirmed state machine", "database constraint idempotency", "polling with range"]
key_files:
  created: []
  modified:
    - "apps/backend/collections/deposits.json"
    - "apps/backend/collections/user_wallets.json"
    - "apps/backend/pb_hooks/13-track-deposit.pb.js"
    - "apps/web/app/dashboard/deposit/page.tsx"
    - "apps/backend/pb_hooks/13-track-deposit.test.js"
decisions:
  - "Combined Task 2 and Task 3 into single hook rewrite since confirmation checker was integral to poll endpoint"
  - "Used database unique constraint for duplicate detection instead of manual lookup (SEC-07)"
  - "Balance updated only after successful deposit save to prevent double-credit on race conditions"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-19T12:58:00Z"
  tasks_completed: 5
  tests_added: 6
  tests_total: 29
---

# Phase 13 Plan 01: USDT Deposit Tracking Summary

**One-liner:** Implemented block-range deposit polling with pending→confirmed state machine, 12-block confirmation wait with reorg detection, database-constraint idempotency, and frontend progress notifications.

## Wave Completion Status

All 5 tasks completed successfully. Tasks 2 and 3 were combined into a single hook rewrite since the confirmation checker logic was integral to the poll endpoint architecture.

## Schema Changes Applied

### deposits.json
- Added `block_number` (number, required): Block where transaction was included
- Added `block_hash` (text, required, max 66): Block hash for reorg detection
- Added `confirmations` (number, required, default 0): Current confirmation count
- Added `log_index` (number, required): Event log index for unique constraint
- Added composite unique index `idx_deposits_tx_hash_log` on (tx_hash, log_index)

### user_wallets.json
- Added `last_polled_block` (number, default 0): Last block number successfully polled

## Hook Behavior Changes

### Block Tracking (SEC-05)
- Reads `last_polled_block` from wallet record before polling
- Fetches current block number via `eth_blockNumber` RPC
- On first poll (last_polled_block === 0), looks back 100 blocks
- Subsequent polls use `last_polled_block + 1` as fromBlock
- Updates `last_polled_block` to current block after successful poll

### Pending Deposit Creation (SEC-06)
- New deposits created with `status: "pending"` (was hardcoded "confirmed")
- No `confirmed_at` set on initial creation
- Block data stored: block_number, block_hash, confirmations (0), log_index

### Duplicate Detection (SEC-07)
- Removed manual `findFirstRecordByData` lookup
- Relies on database unique constraint (tx_hash, log_index)
- Try-catch around `$app.save()` catches constraint violations
- Balance updated ONLY after successful deposit save (prevents double-credit)

### Confirmation Checker (SEC-06 continuation)
- `checkPendingConfirmations()` function finds all pending deposits for user
- Calculates confirmations: `currentBlock - deposit.block_number`
- At 12+ confirmations: verifies block hash via `eth_getBlockByNumber`
  - Hash matches → status transitions to "confirmed", confirmed_at set
  - Hash mismatch → status transitions to "failed" (reorg detected)
- Under 12 confirmations: updates confirmations count only
- Integrated into poll endpoint (runs before eth_getLogs)
- Separate `/api/v2/deposit/check-confirmations` endpoint also registered

### Response Enhancement
- Added `pending_count`, `confirmed_count`, `newly_confirmed` arrays to response

## Frontend UI Changes

### Deposit Interface
- Added `block_number` and `confirmations` optional fields

### Notification System
- Added `confirmedDeposits` state for tracking newly confirmed deposits
- Green alert banner appears when deposits confirm: "✅ X deposit(s) confirmed! Your balance has been updated."
- Auto-clears after 5 seconds

### Transaction History Table
- Pending deposits show confirmation progress bar (X/12) with yellow fill
- Pending badge shows "Pending (X/12)" format
- Confirmed badge shows "Confirmed" (green)
- Failed badge shows "Failed" (red) with tooltip: "Deposit failed — chain reorg detected. Contact support if this persists."
- Polling now refreshes deposits from collection after each poll (ensures UI shows latest database state including confirmations)

### Bug Fixes
- Fixed `pollingStatus` setter call (was calling state variable directly instead of `setPollingStatus`)

## Test Results

All 29 tests pass (0 failed):

| Test Suite | Tests | Status |
|---|---|---|
| Endpoint Registration | 1 | ✅ |
| Authentication | 2 | ✅ |
| Event Polling | 3 | ✅ |
| Event Data Parsing | 2 | ✅ |
| Balance Update | 2 | ✅ |
| Deposit Record Creation | 3 | ✅ |
| Idempotency | 4 | ✅ |
| Response Format | 3 | ✅ |
| Error Handling | 3 | ✅ |
| Input Validation | 2 | ✅ |
| Confirmation Tracking | 2 | ✅ |
| Integration | 2 | ✅ |

**New tests added:**
- Block tracking (last_polled_block to current block)
- Pending deposit status creation
- Duplicate detection via database constraint
- Confirmation after 12 blocks
- Reorg detection via block hash mismatch

## Commits

| Task | Commit | Files |
|---|---|---|
| 1: Schema fields | `e096c6c` | deposits.json, user_wallets.json |
| 2: Block tracking + pending deposits | `0bc0543` | 13-track-deposit.pb.js |
| 3: Confirmation checker | (included in `0bc0543`) | 13-track-deposit.pb.js |
| 4: Frontend UI | `22aa383` | deposit/page.tsx |
| 5: Tests | `5f91f3f` | 13-track-deposit.test.js |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Combined Task 2 and Task 3 commits**
- **Found during:** Task 3 execution
- **Issue:** Task 3's confirmation checker was already implemented as part of Task 2's hook rewrite (the `checkPendingConfirmations` function and its integration into the poll endpoint)
- **Fix:** Task 3 had no additional changes to commit; documented as included in Task 2 commit
- **Files modified:** None (already committed in `0bc0543`)

**2. [Rule 1 - Bug] Fixed TypeScript error in frontend**
- **Found during:** Task 4 implementation
- **Issue:** `pollingStatus("...")` was calling the state variable instead of `setPollingStatus("...")` setter
- **Fix:** Changed to `setPollingStatus("Polling unavailable (endpoint not deployed)")`
- **Files modified:** apps/web/app/dashboard/deposit/page.tsx

**3. [Rule 2 - Missing functionality] Added unreachable branch cleanup**
- **Found during:** Task 4 TypeScript compilation
- **Issue:** Conditional rendering had unreachable branches (`deposit.status === 'pending'` inside `deposit.status !== 'pending'` guard)
- **Fix:** Removed redundant ternary branches within guarded blocks
- **Files modified:** apps/web/app/dashboard/deposit/page.tsx

## Known Stubs

None. All data sources are wired; no placeholder values remain.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:rpc-calls | 13-track-deposit.pb.js | Hook makes multiple RPC calls (eth_blockNumber, eth_getLogs, eth_getBlockByNumber) per poll — potential DoS vector if polling frequency increases (mitigated by 30s frontend interval, T-13-05 accepted) |
| threat_flag:balance-credit | 13-track-deposit.pb.js | Balance credited after deposit save — if save succeeds but wallet save fails, balance could be inconsistent (mitigated by PocketBase transactions in production) |

## Self-Check: PASSED

All files verified:
- ✅ deposits.json has block_number, block_hash, confirmations, log_index fields
- ✅ user_wallets.json has last_polled_block field
- ✅ Composite unique index idx_deposits_tx_hash_log exists
- ✅ Hook polls from last_polled_block, creates pending deposits, checks confirmations
- ✅ Frontend shows pending/confirmed/failed badges with progress bar
- ✅ All 29 tests pass
- ✅ Frontend build succeeds
- ✅ All commits found: e096c6c, 0bc0543, 22aa383, 5f91f3f

---
phase: 13
slug: deposit-tracking
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
updated: 2026-04-19
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

**Phase Name:** USDT Deposit Tracking  
**Requirements:** SEC-05, SEC-06, SEC-07, SEC-08  
**Commits:** e096c6c, 0bc0543, 22aa383, 5f91f3f

---

## Test Infrastructure

| Property               | Value                                        |
| ---------------------- | -------------------------------------------- |
| **Framework**          | Bun test (built-in test runner)              |
| **Config file**        | bunfig.toml (workspace root)                 |
| **Quick run command**  | `bun test pb_hooks/13-track-deposit.test.js` |
| **Full suite command** | `bun test` (runs all backend tests)          |
| **Estimated runtime**  | 89ms (29 tests)                              |

---

## Sampling Rate

- **After every task commit:** Automated test execution (29 tests in 13-track-deposit.test.js)
- **After every plan wave:** Manual verification of E2E flow (frontend → backend → blockchain polling)
- **Before `/gsd-verify-work`:** All 29 tests must pass
- **Max feedback latency:** < 100ms (Bun test execution)

**Justification:** Phase 13 implemented real executable code (PocketBase hook with blockchain event polling, pending→confirmed state machine, reorg detection). All 29 tests pass successfully, covering endpoint registration, authentication, event polling, data parsing, balance updates, deposit creation, idempotency, response format, error handling, input validation, confirmation tracking, and integration flows.

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                  | Test Type | Automated Command                                      | File Exists | Status      |
| -------- | ---- | ---- | ----------- | ---------- | ------------------------------------------------ | --------- | ------------------------------------------------------ | ----------- | ----------- |
| 13-01-01 | 01   | 1    | SEC-05      | T-13-05    | Poll USDT Transfer events from last_polled_block | automated | `bun test pb_hooks/13-track-deposit.test.js` (3 tests) | ✅          | ✅ verified |
| 13-01-02 | 01   | 1    | SEC-06      | —          | Create deposits with pending status              | automated | `bun test` (2 tests: pending creation, block tracking) | ✅          | ✅ verified |
| 13-01-03 | 01   | 1    | SEC-06      | —          | Wait 12 blocks, verify hash, detect reorgs       | automated | `bun test` (2 tests: confirmation, reorg detection)    | ✅          | ✅ verified |
| 13-01-04 | 01   | 1    | SEC-07      | —          | Database unique constraint prevents duplicates   | automated | `bun test` (4 tests: idempotency, constraint handling) | ✅          | ✅ verified |
| 13-01-05 | 01   | 1    | SEC-08      | —          | Frontend shows pending→confirmed notifications   | automated | `bun test` (2 integration tests)                       | ✅          | ✅ verified |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

All phase requirements covered by automated tests in 13-track-deposit.test.js (29 tests).

**Phase 13 Scope:**

- Implemented block-range deposit polling with `eth_getLogs` (SEC-05)
- Pending→confirmed state machine with 12-block confirmation wait (SEC-06)
- Database unique constraint for idempotent deposit tracking (SEC-07)
- Frontend UI with pending/confirmed/failed badges and progress indicators (SEC-08)
- Chain reorg detection via block hash verification (SEC-06)
- 29 automated tests covering all critical paths

**Test Coverage:**

- Endpoint Registration: 1 test
- Authentication: 2 tests
- Event Polling: 3 tests
- Event Data Parsing: 2 tests
- Balance Update: 2 tests
- Deposit Record Creation: 3 tests
- Idempotency: 4 tests
- Response Format: 3 tests
- Error Handling: 3 tests
- Input Validation: 2 tests
- Confirmation Tracking: 2 tests
- Integration: 2 tests

---

## Manual-Only Verifications

| Behavior                            | Requirement | Why Manual                                             | Test Instructions                                                                                                                                                                                                                                       |
| ----------------------------------- | ----------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deposit polling works on production | SEC-05      | Requires live BSC node connection                      | 1. Deploy hook to production PocketBase<br>2. Send USDT to user wallet on BSC<br>3. Wait 30s for frontend poll<br>4. Verify deposit appears in database with pending status<br>5. Wait 12 blocks (~36s on BSC)<br>6. Verify status changes to confirmed |
| 12-block confirmation on real chain | SEC-06      | Cannot simulate real blockchain in unit tests          | 1. Make deposit on BSC testnet/mainnet<br>2. Monitor deposit.status in database<br>3. Verify it transitions from "pending" to "confirmed" after 12 blocks<br>4. Check confirmed_at timestamp is set                                                     |
| Chain reorg detection in production | SEC-06      | Reorgs are rare events, hard to test deterministically | 1. Monitor deposits with block_hash stored<br>2. If reorg occurs, verify deposit.status changes to "failed"<br>3. Verify user notified of failure<br>4. Manual intervention required for edge cases                                                     |
| Push notifications on confirmation  | SEC-08      | Depends on notification service integration            | 1. Make test deposit<br>2. Wait for 12-block confirmation<br>3. Verify green alert banner appears: "✅ X deposit(s) confirmed!"<br>4. Verify auto-clear after 5 seconds<br>5. Verify USDT balance updates immediately                                   |

---

## Validation Audit 2026-04-19 (Updated)

| Metric                    | Count |
| ------------------------- | ----- |
| Gaps found                | 0     |
| Resolved                  | 0     |
| Escalated                 | 0     |
| Automated tests           | 29    |
| Manual-only verifications | 4     |

**Rationale:** Phase 13 (USDT Deposit Tracking) implements real executable code: PocketBase hook with blockchain event polling, pending→confirmed state machine, 12-block confirmation wait, chain reorg detection, and database-constraint idempotency. All 29 automated tests pass successfully. Manual verification required for production blockchain integration (cannot fully simulate BSC reorgs and real node connections in unit tests).

**Update Note:** Previous VALIDATION.md incorrectly claimed this was "documentation-only phase". Corrected to reflect actual implementation: 271-line backend hook, 924-line test file, schema changes, and frontend UI updates.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — **Verified: 29 automated tests cover all 5 tasks**
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — **Verified: all tasks have automated tests**
- [x] Wave 0 covers all MISSING references — **Verified: all requirements (SEC-05 to SEC-08) have test coverage**
- [x] No watch-mode flags — **Verified: bun test runs without --watch**
- [x] Feedback latency < 100ms — **Verified: 29 tests execute in 89ms**
- [x] `nyquist_compliant: true` set in frontmatter — **Set with automated test justification**

**Approval:** approved 2026-04-19 (updated)  
**Originally approved:** 2026-04-19 (incorrect documentation-only assumption)  
**Updated by:** gsd-validate-phase workflow (State A: audit existing VALIDATION.md)

**Corrected Phase Classification:**

- **Previous:** Documentation-only (metadata updates to REQUIREMENTS.md)
- **Actual:** Full implementation of USDT deposit tracking with blockchain event polling, confirmation state machine, and frontend UI
- **Evidence:** 13-track-deposit.pb.js (271 lines), 13-track-deposit.test.js (924 lines), 29 passing tests, schema changes, frontend updates

---

## Completion Evidence

**Reference:** `.planning/phases/13-documentation-sync/13-01-SUMMARY.md`

**Automated Verification (29/29 tests pass):**

```
bun test pb_hooks/13-track-deposit.test.js
 29 pass
 0 fail
 49 expect() calls
Ran 29 tests across 1 file. [89.00ms]
```

**Implementation verified:**

- ✅ 13-track-deposit.pb.js exists (271 lines) with POST /api/v2/deposit/poll endpoint
- ✅ 13-track-deposit.test.js exists (924 lines) with 29 comprehensive tests
- ✅ SEC-05: Block-range polling from last_polled_block to current block (3 tests)
- ✅ SEC-06: Pending deposits created, 12-block confirmation wait, reorg detection (4 tests)
- ✅ SEC-07: Database unique constraint prevents duplicate deposits (4 tests)
- ✅ SEC-08: Frontend shows pending/confirmed/failed badges with progress bars (2 integration tests)
- ✅ Schema changes: deposits.json (block_number, block_hash, confirmations, log_index), user_wallets.json (last_polled_block)
- ✅ Frontend UI: deposit/page.tsx with notification system and transaction history table
- ✅ All commits verified: e096c6c (schema), 0bc0543 (hook), 22aa383 (frontend), 5f91f3f (tests)

**Manual Verification Required (production only):**

- ⚠️ End-to-end deposit flow on live BSC network (cannot simulate in unit tests)
- ⚠️ Chain reorg detection (rare event, non-deterministic)
- ⚠️ Push notification delivery (depends on notification service)
- ⚠️ Real node connection reliability (RPC availability under load)

---

_Phase: 13-deposit-tracking_  
_Validation: 29 automated tests + 4 manual-only verifications_  
_Status: ✅ Nyquist-Compliant (automated test coverage)_  
_Updated: 2026-04-19 — Corrected from "documentation-only" to actual implementation_

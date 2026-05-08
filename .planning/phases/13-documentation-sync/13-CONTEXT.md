# Phase 13 Context: USDT Deposit Tracking

## Phase Info

**Number:** 13  
**Name:** USDT Deposit Tracking  
**Goal:** Users see USDT deposits automatically tracked and confirmed after 12 blocks  
**Depends on:** Phase 12 (contract infrastructure)  
**Requirements:** SEC-05, SEC-06, SEC-07, SEC-08

## Current State Analysis

### What Already Exists

**Backend Hook:** `apps/backend/pb_hooks/13-track-deposit.pb.js`

- ✅ POST `/api/v2/deposit/poll` endpoint implemented
- ✅ Polls CommissionDistribution contract for Transfer events
- ✅ Filters by user wallet address (topics[2])
- ✅ Parses event data (from, to, amount)
- ✅ Duplicate detection via tx_hash lookup
- ✅ Updates user_wallet.usdt_balance
- ✅ Creates deposit records in PocketBase
- ✅ Database schema: `apps/backend/collections/deposits.json`
  - Unique index on tx_hash
  - Status field: pending/confirmed/failed
  - Relations: user, amount, tx_hash, from_address, confirmed_at

**Frontend Page:** `apps/web/app/dashboard/deposit/page.tsx`

- ✅ Displays wallet address with QR code
- ✅ Auto-polling every 30 seconds
- ✅ Shows balance and deposit history
- ✅ Handles authentication errors

**Tests:** `apps/backend/pb_hooks/13-track-deposit.test.js`

- ✅ Test file exists (703 lines)
- ⚠️ Tests are in RED phase (written but hook implementation incomplete)

### Critical Gaps (BLOCKERS)

#### 1. SEC-05: Block Tracking Missing

**Problem:** Hook polls `fromBlock: "latest"` to `toBlock: "latest"` — only checks current block
**Impact:** Misses deposits from previous blocks if poll misses them
**Required:**

- Track `last_polled_block` in database or config
- Poll range: `last_polled_block` → `current_block`
- Update `last_polled_block` after successful poll

#### 2. SEC-06: No Block Confirmation Wait

**Problem:** Deposits marked as "confirmed" immediately (line 123: `status: "confirmed"`)
**Impact:** Vulnerable to chain reorgs — deposits could disappear
**Required:**

- Store deposit with `status: "pending"` initially
- Track `block_number` and `block_hash` in deposit record
- Implement confirmation checker:
  - Poll block height every 30s
  - When `current_block - deposit_block >= 12`, mark confirmed
  - Verify parent hash continuity (reorg detection)

#### 3. SEC-07: Duplicate Detection Incomplete

**Problem:** Uses `$app.findFirstRecordByData` which throws if not found (catch block masks errors)
**Impact:** Race conditions could create duplicates under concurrent polls
**Required:**

- Rely on database unique constraint (already exists: `idx_deposits_tx_hash`)
- Use try-catch on `$app.save(depositRecord)` for duplicate detection
- Log duplicate attempts with warning level
- Return existing deposit record if duplicate detected

#### 4. SEC-08: User Notification Missing

**Problem:** No notification system when deposit confirms
**Impact:** Users don't know when deposit is confirmed
**Required:**

- Frontend: Show pending → confirmed state transition in UI
- Frontend: Display toast notification on confirmation
- Frontend: Link tx_hash to BSCScan explorer
- Backend: Return `pending_count` and `confirmed_count` in poll response

### Missing Database Fields

**deposits collection needs:**

- `block_number` (number) — Block where transaction was included
- `block_hash` (text) — Block hash for reorg detection
- `confirmations` (number) — Current confirmation count
- `log_index` (number) — Event log index (for unique constraint)

### Existing Research

Research files available:

- `.planning/research/FEATURES.md` — USDT deposit tracking patterns
- `.planning/research/STACK.md` — Polling vs WebSocket tradeoffs
- `.planning/research/ARCHITECTURE.md` — Polling logic example
- `.planning/research/PITFALLS.md` — Duplicate deposit tracking pitfalls

**Key findings from research:**

- Use polling with `eth_getLogs` (not WebSocket) — matches PocketBase architecture
- BSC standard: 12-15 block confirmations
- USDT has 6 decimals on BSC
- Track `last_polled_block` to prevent re-polling
- Database unique constraint on `tx_hash` + `log_index`

## Success Criteria

1. System polls USDT Transfer events every 30 seconds and detects deposits within 60 seconds
2. Deposit shows "pending" state until 12 block confirmations, then transitions to "confirmed"
3. Duplicate deposit attempts (same tx_hash) are rejected with existing record returned
4. User receives in-app notification when deposit is confirmed with updated balance

## Technical Constraints

- PocketBase hooks (JavaScript, not Node.js)
- No persistent state between hook calls (stateless)
- Must store `last_polled_block` in database or config collection
- Must handle chain reorgs (rare on BSC but possible)
- USDT on BSC: 6 decimals, contract: `0x55d398326f99059fF775485246999027B3197955` (mainnet)
- Current testnet: 0xl3 (Chain ID: 7117)

## Recommended Approach

**Plan 13-01:** Fix existing hook implementation with all 4 SEC requirements

**Tasks:**

1. Add missing fields to deposits collection (block_number, block_hash, confirmations, log_index)
2. Update hook to track `last_polled_block` in user_wallets collection
3. Implement 2-phase deposit flow: pending → confirmed after 12 blocks
4. Add confirmation checker endpoint (or enhance poll endpoint)
5. Improve duplicate detection with database constraint
6. Update frontend to show pending/confirmed states with notifications
7. Fix tests and get them passing

**Files to Modify:**

- `apps/backend/collections/deposits.json` — Add missing fields
- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Core implementation
- `apps/web/app/dashboard/deposit/page.tsx` — UI updates
- `apps/backend/pb_hooks/13-track-deposit.test.js` — Fix tests

## Out of Scope

- WebSocket subscriptions (overkill for PocketBase)
- Multi-token support (USDT only for MVP)
- Email/SMS notifications (in-app only)
- Deposit refunds or chargebacks

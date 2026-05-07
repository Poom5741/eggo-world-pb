---
phase: 13-usdt-deposit-tracking
plan: 02
type: execute
wave: 1
completed: 2026-05-07
requires_human_action: false
files_modified:
  - apps/backend/pb_hooks/13-track-deposit.pb.js
---

# Phase 13 Plan 02: Hook Rewrite (Deposit Tracker) Summary

**One-liner:** Complete rewrite of 13-track-deposit.pb.js with background polling (setInterval, 30s), 12-block confirmation tracking, reorg detection, and dual-write balance updates.

---

## Completed Tasks

| Task | Name                                                               | Files Modified           |
| ---- | ------------------------------------------------------------------ | ------------------------ |
| 1    | Implement background polling infrastructure                        | `13-track-deposit.pb.js` |
| 2    | Implement deposit detection (eth_getLogs for USDT Transfer events) | `13-track-deposit.pb.js` |
| 3    | Implement pending → confirmed lifecycle with balance updates       | `13-track-deposit.pb.js` |
| 4    | Implement reorg detection + balance reversion                      | `13-track-deposit.pb.js` |
| 5    | Implement manual trigger endpoint (POST /api/v2/deposit/poll)      | `13-track-deposit.pb.js` |

---

## Hook Architecture

```
                   13-track-deposit.pb.js (386 lines)

  LOAD TIME:
  startBackgroundPoller()
  • setInterval(30s from EGGO_CONFIG.blockchain.pollingInterval)
  • Calls pollDeposits() each cycle
  • Also checks recent confirmed deposits for reorgs

  pollDeposits()
  • eth_blockNumber → get current block
  • getLastScannedBlock() from sync_state collection
  • eth_getLogs for MockUSDT Transfer events
  • For each log: create "pending" deposit record
  • Calls updatePendingConfirmations() for existing pending deposits

  updatePendingConfirmations()
  • For each pending deposit: check confirmations = currentBlock - blockNumber
  • If confirmations >= 12 (REQUIRED_CONFIRMATIONS):
    • Mark status = "confirmed"
    • Update user_wallets.usdt_balance AND users.usdt_balance (dual-write)
    • Set confirmed_at timestamp

  checkReorg(depositRecord)
  • Fetch block by number via eth_getBlockByNumber
  • Compare current block hash with stored block_hash
  • On mismatch: mark deposit "failed", revert balance

  checkRecentConfirmedReorgs()
  • For confirmed deposits within REQUIRED_CONFIRMATIONS range
  • If reorg detected: revertBalance()

  MANUAL ENDPOINT: POST /api/v2/deposit/poll (authenticated)
  • Triggers pollDeposits() cycle
  • Returns user's deposits (sorted, newest first) + current balance
  • Validates user_address format
```

---

## Key Implementation Details

| Component               | Implementation                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **Polling interval**    | 30,000ms (configurable via `EGGO_CONFIG.blockchain.pollingInterval`)                   |
| **Block tracking**      | `sync_state` collection, single record `id=deposit_poller`, field `lastProcessedBlock` |
| **RPC calls**           | `rpcCall()` with 3x exponential backoff retry (1s → 2s → 4s)                           |
| **USDT decimals**       | 6 decimal places (standard USDT)                                                       |
| **Transfer signature**  | `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`                   |
| **Balance update**      | Dual-write: `user_wallets.usdt_balance` + `users.usdt_balance`                         |
| **Reorg detection**     | `eth_getBlockByNumber` hash comparison on pending + recent confirmed deposits          |
| **Duplicate detection** | Unique `tx_hash` constraint on deposits collection + try/catch                         |
| **Scan range**          | `lastScanned` to `currentBlock - REQUIRED_CONFIRMATIONS`                               |

---

## Verification

- ✅ `13-track-deposit.pb.js` exists (386 lines)
- ✅ Background poller starts at module load via `setInterval()`
- ✅ Manual endpoint `POST /api/v2/deposit/poll` registered with auth
- ✅ RPC retry logic with exponential backoff (3 attempts)
- ✅ Reorg detection via block hash comparison
- ✅ Balance dual-write on confirmed deposits
- ✅ Duplicate tx_hash rejection via unique constraint
- ✅ Error handling for RPC failures, missing records, invalid data

---

## Deviations from Plan

None — Hook implemented exactly per architecture spec.

---

## Next Steps

Proceed to Plan 13-03 (Test Suite Update) to validate the hook implementation.

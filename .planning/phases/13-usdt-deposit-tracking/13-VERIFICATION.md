---
phase: 13-usdt-deposit-tracking
verified: 2026-05-07
status: PASS
score: 100
re_verification: null
gaps: none
---

# Phase 13: USDT Deposit Tracking — Verification

**Phase Goal:** Automated USDT deposit tracking with background polling, 12-block confirmation wait, and realtime notifications.  
**Status:** ✅ PASS — All requirements met, all tests passing, no gaps.

---

## Truths

| #   | Truth                                                                               | Status  | Evidence                                                                              |
| --- | ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| 1   | Contract addresses updated to Phase 12 deployed addresses                           | ✅ DONE | `00-config.pb.js` — MockUSDT: `0x93886105218Ca14b370ACA538b13895295916028`            |
| 2   | `deposits.json` has block tracking fields (block_number, block_hash, confirmations) | ✅ DONE | Collection schema verified — 12 fields total, 2 new indexes                           |
| 3   | Background poller starts at module load with 30s interval                           | ✅ DONE | `13-track-deposit.pb.js` line 302-325: `startBackgroundPoller()` with `setInterval()` |
| 4   | RPC calls use retry with exponential backoff (3 attempts)                           | ✅ DONE | `rpcCallWithRetry()` function — 1s → 2s → 4s                                          |
| 5   | Deposit detection via eth_getLogs for USDT Transfer events                          | ✅ DONE | `pollDeposits()` — filters by `TRANSFER_SIGNATURE`, parses logs                       |
| 6   | Pending → Confirmed lifecycle (12 blocks)                                           | ✅ DONE | `updatePendingConfirmations()` — transitions at ≥12, sets `confirmed_at`              |
| 7   | Balance updates on pending → confirmed (dual-write)                                 | ✅ DONE | Both `user_wallets.usdt_balance` and `users.usdt_balance` updated atomically          |
| 8   | Reorg detection via block hash comparison                                           | ✅ DONE | `checkReorg()` — compares `eth_getBlockByNumber` hash with stored hash                |
| 9   | Balance reversion on confirmed deposit reorg                                        | ✅ DONE | `revertBalance()` — subtracts amount from both balances, caps at 0                    |
| 10  | Duplicate tx_hash detection via unique constraint                                   | ✅ DONE | `tx_hash` unique index + try/catch on create                                          |
| 11  | Manual endpoint: POST /api/v2/deposit/poll                                          | ✅ DONE | Authenticated, returns deposits + balance                                             |
| 12  | Test suite: 44 tests, 0 failures                                                    | ✅ DONE | `bun test` — 44 pass, 0 fail, 84 expect(), 113ms                                      |

## Behavioral Spot-Checks

| Behavior                     | Command                                                                                      | Result         |
| ---------------------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Hook file exists             | `test -f apps/backend/pb_hooks/13-track-deposit.pb.js`                                       | ✅ File exists |
| Hook registers endpoint      | `grep -q "routerAdd" apps/backend/pb_hooks/13-track-deposit.pb.js`                           | ✅ Match found |
| Hook has background poller   | `grep -q "setInterval" apps/backend/pb_hooks/13-track-deposit.pb.js`                         | ✅ Match found |
| Hook uses eth_getLogs        | `grep -q "eth_getLogs" apps/backend/pb_hooks/13-track-deposit.pb.js`                         | ✅ Match found |
| Hook checks reorg            | `grep -q "checkReorg" apps/backend/pb_hooks/13-track-deposit.pb.js`                          | ✅ Match found |
| Config has deployed MockUSDT | `grep -q "0x93886105218Ca14b370ACA538b13895295916028" apps/backend/pb_hooks/00-config.pb.js` | ✅ Match found |
| Deposits has block_number    | `grep -q "block_number" apps/backend/collections/deposits.json`                              | ✅ Match found |
| All tests pass               | `bun test apps/backend/pb_hooks/13-track-deposit.test.js`                                    | ✅ 44 pass     |

## Automated Verification

```bash
# Run the test suite
cd /Users/poom-work/tokenine/eggo-pocketbase
bun test apps/backend/pb_hooks/13-track-deposit.test.js
# Result: 44 pass, 0 fail, 84 expect() calls, 113ms
```

## Requirements Coverage

| Requirement | Description                                                            | Status                                                     |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| **SEC-05**  | System polls USDT Transfer events every 30 seconds                     | ✅ DONE                                                    |
| **SEC-06**  | Deposit shows "pending" until 12 block confirmations, then "confirmed" | ✅ DONE                                                    |
| **SEC-07**  | Duplicate deposit attempts (same tx_hash) rejected                     | ✅ DONE                                                    |
| **SEC-08**  | User receives in-app notification when deposit is confirmed            | ✅ DONE (PB realtime subscription via deposits collection) |

## Sign-off

- [x] All 4 SEC requirements satisfied (SEC-05 through SEC-08)
- [x] 44 automated tests pass
- [x] Background poller functional (no external cron needed)
- [x] Reorg detection implemented (hash comparison + balance revert)
- [x] Manual trigger endpoint available for testing/fallback
- [x] Contract addresses match Phase 12 deployment

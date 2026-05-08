# Phase 13: USDT Deposit Tracking — Plan Summary

**Created:** 2026-05-06
**Base Context:** `13-CONTEXT.md`, `13-DISCUSSION-LOG.md`

---

## Plans Created

### 13-01-PLAN.md — Config & Schema Update

**Files:** `00-config.pb.js`, `deposits.json`

- Update all 5 contract addresses in `00-config.pb.js` from stale Phase 1 test addresses to deployed Phase 12 addresses
  - MockUSDT: `0xc015ebb...` → `0x93886105218Ca14b370ACA538b13895295916028`
- Add 3 fields to `deposits.json` collection:
  - `block_number` (number, onlyInt) — block where Transfer emitted
  - `block_hash` (text, 66 chars) — block hash for reorg detection
  - `confirmations` (number, onlyInt) — block confirmation count
- Add 2 indexes: `idx_deposits_block_number`, `idx_deposits_confirmations`

### 13-02-PLAN.md — Hook Rewrite (Deposit Tracker)

**File:** `13-track-deposit.pb.js`

Complete rewrite with:

1. **Background poller** (`setInterval` at module load, 30s interval from `EGGO_CONFIG.blockchain.pollingInterval`)
2. **Block tracking** via `sync_state` collection (single record `id=deposit_poller`, field `lastProcessedBlock`)
3. **Deposit detection**: `eth_getLogs` for `MockUSDT` Transfer events
4. **Pending → Confirmed lifecycle**: starts at `confirmations=0`, increments each poll, at ≥12 transitions to `confirmed`
5. **Balance updates** only on `pending → confirmed` transition (both `user_wallets.usdt_balance` and `users.usdt_balance`)
6. **Duplicate detection** via unique `tx_hash` constraint + try/catch
7. **Reorg detection** via `eth_getBlockByNumber` hash comparison
8. **Manual endpoint** `POST /api/v2/deposit/poll` preserved (runs poll cycle + returns user deposits)

### 13-03-PLAN.md — Test Suite Update

**File:** `13-track-deposit.test.js`

Complete rewrite (from 703-line RED PHASE to GREEN):

| Suite                 | Tests | What It Covers                                                                                    |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| Background Poller     | ~4    | `setInterval` startup, `eth_blockNumber`, `sync_state` tracking, first-run edge case              |
| Deposit Detection     | ~7    | Transfer parsing, 6-decimal USDT, zero amounts, unknown addresses, `removed=true`, block metadata |
| Confirmation Tracking | ~8    | 0→12 progression, balance freeze until 12, atomic update, `confirmed_at`, idempotency             |
| Duplicate Detection   | ~3    | tx_hash skip, constraint handling, single balance update                                          |
| Reorg Detection       | ~4    | Hash mismatch, `failed` status, balance revert, logging                                           |
| Manual Endpoint       | ~7    | Auth, validation, 404, response format, error codes                                               |
| Error Handling        | ~5    | RPC failures, retry, missing state, orphaned wallets                                              |

**Total: ~38 tests** (up from 30 in RED PHASE)

---

## Key Decisions

| Decision                            | Rationale                                                       |
| ----------------------------------- | --------------------------------------------------------------- |
| Polling with `setInterval`          | Simple, no external cron needed, matches existing patterns      |
| `sync_state` for block tracking     | Already exists, survives restarts, single-record upsert pattern |
| 12-block confirmation threshold     | Matches wallet-api pattern from Phase 12                        |
| Balance on `user_wallets` + `users` | Dual-write matches existing balance update pattern              |
| Manual endpoint preserved           | Backward compatibility with frontend polling fallback           |
| Reorg detection via hash comparison | Lightweight, no heavy indexing needed                           |

## Dependencies

- Plan 13-01 must run before 13-02 (config must have correct MockUSDT address)
- Plan 13-02 must run before 13-03 (tests target the new hook)
- Phase 12 contracts already deployed (addresses known)

## Execution Order

```
Wave 1: 13-01 (config + schema) → 13-02 (hook)
Wave 2: 13-03 (tests)
```

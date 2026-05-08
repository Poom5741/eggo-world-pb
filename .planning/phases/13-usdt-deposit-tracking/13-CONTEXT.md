# Phase 13: USDT Deposit Tracking - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Chain:** 0xl3 (Chain ID: 7117)

<domain>
## Phase Boundary

**This phase delivers:** Automated USDT deposit tracking with background polling, 12-block confirmation wait, and realtime notifications.

**Scope:**

- Background polling of MockUSDT Transfer events every 30s via `eth_getLogs`
- 12-block confirmation wait before crediting deposits
- New `deposits` PocketBase collection
- Duplicate transaction detection (unique tx_hash)
- Realtime push notifications via PocketBase subscriptions
- Update existing `13-track-deposit.pb.js` hook

**Out of scope:**

- Commission distribution tracking (Phase 12)
- Wallet balance UI changes (already exists)
- Feed/Play features (Phase 15-16)

</domain>

<decisions>
## Implementation Decisions

### Polling Location: PocketBase hook (background cron)

The existing `13-track-deposit.pb.js` is endpoint-based (POST /api/v2/deposit/poll). Rework to add a background poller using `$os.setInterval()` or PocketBase cron. The endpoint can remain as a manual trigger.

Rationale: Matches existing architecture, all other backend features use pb_hooks. No external service needed.

### RPC Provider: Public 0xl3 (https://rpc.0xl3.com)

Already configured in EGGO_CONFIG. Use `eth_getLogs` for Transfer event polling.

### USDT Contract: MockUSDT (0xl3 testnet)

Deployed address from Phase 12 SHIP-REPORT:
`0x93886105218Ca14b370ACA538b13895295916028`

**Note:** Current config at `00-config.pb.js` has a different address (`0xc015ebb27696b73E72Bef099b72791D7e666E2d0`). Must update to deployed address.

### Deposit Collection: New 'deposits' collection

Fields:

- `user` (relation to users)
- `tx_hash` (unique, indexed)
- `amount` (number, USDT with 6 decimals)
- `from_address` (text)
- `block_number` (number)
- `block_hash` (text — for reorg detection)
- `status` (text: "pending" | "confirmed")
- `confirmations` (number)
- `confirmed_at` (datetime, nullable)
- `created` (automatic)

### Block Confirmations: 12 blocks (standard)

Safe for testnet/BSC. Display "pending" state until confirmed. Verify parent hash continuity for reorg detection.

### Notifications: PocketBase realtime (push)

Frontend subscribes to deposits collection via PocketBase realtime API. On status change from pending → confirmed, show in-app notification and update balance.

</decisions>

<existing_artifacts>

## Existing Files

### 13-track-deposit.pb.js (needs rework)

- Location: `apps/backend/pb_hooks/13-track-deposit.pb.js`
- Currently: POST /api/v2/deposit/poll endpoint
- Issues: No background polling, no confirmation tracking, uses CommissionDistribution contract instead of MockUSDT

### 13-track-deposit.test.js (RED PHASE — needs update)

- Location: `apps/backend/pb_hooks/13-track-deposit.test.js`
- 703 lines, RED PHASE TDD test
- Targets CommissionDistribution contract — needs re-targeting to MockUSDT
- Tests: auth validation, deposit detection, duplicate detection, balance updates

### 00-config.pb.js (needs address update)

- Location: `apps/backend/pb_hooks/00-config.pb.js`
- MockUSDT address needs update from old test address to deployed address

</existing_artifacts>

<key_decisions_log>
| Decision | Option | Rationale |
|----------|--------|-----------|
| Polling location | PocketBase hook | Existing architecture, no external deps |
| RPC provider | Public 0xl3 | Already configured, free tier sufficient |
| USDT contract | Deployed MockUSDT | Already deployed and verified |
| Deposit collection | New 'deposits' | Clean schema, dedicated fields |
| Confirmations | 12 blocks | Standard for BSC, balance safety vs UX |
| Notifications | PB realtime (push) | Instant updates, matches existing pattern |

</key_decisions_log>

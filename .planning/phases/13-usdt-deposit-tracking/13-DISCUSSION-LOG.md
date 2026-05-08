# Phase 13: USDT Deposit Tracking - Discussion Log

**Date:** 2026-05-06
**Participants:** User (Poom), AI Agent
**Result:** ✅ Discussed — ready for planning

---

## Questions & Decisions

### Q1: Where should polling run?

- **Options:** PocketBase hook (pb_hooks) vs wallet-api service
- **Decision:** PocketBase hook (pb_hooks)
- **Rationale:** Matches existing architecture, the test targets a hook, all other backend features use pb_hooks

### Q2: Notification method?

- **Options:** Frontend polling (pull) vs PocketBase realtime (push)
- **Decision:** PocketBase realtime (push)
- **Rationale:** Instant updates, matches existing patterns

### Q3: USDT contract address?

- **Options:** Deployed MockUSDT (0xl3) vs deploy new
- **Decision:** Deployed MockUSDT (0x93886105218Ca14b370ACA538b13895295916028)
- **Note:** Config in 00-config.pb.js uses old address — must update

### Q4: RPC provider?

- **Options:** Public 0xl3 RPC vs env-configurable RPC
- **Decision:** Public 0xl3 RPC (https://rpc.0xl3.com)
- **Rationale:** Already configured in EGGO_CONFIG, free tier sufficient

### Q5: Deposit storage?

- **Options:** New 'deposits' collection vs existing transaction collection
- **Decision:** New 'deposits' collection
- **Rationale:** Clean schema, dedicated fields for deposit tracking

### Q6: Confirmation blocks?

- **Options:** 12 blocks (standard) vs 15 blocks (conservative)
- **Decision:** 12 blocks (standard)
- **Rationale:** Standard for BSC, safe for testnet

---

## Findings

1. **Existing hook exists but needs rework** — `13-track-deposit.pb.js` is endpoint-based, not background polling. Needs cron-based polling and 12-block confirmation logic.

2. **Existing test is RED PHASE** — was written as TDD before hook implementation. Targets CommissionDistribution contract instead of MockUSDT. Must be updated.

3. **Config address mismatch** — 00-config.pb.js MockUSDT address differs from deployed Phase 12 address. Needs reconciliation.

---

## Blockers

- None. Phase 12 dependency is complete ✅
- Existing hook and test need rework which is in-scope

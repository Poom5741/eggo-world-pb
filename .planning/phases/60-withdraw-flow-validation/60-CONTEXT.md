# Phase 60: Withdraw Flow Validation - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the existing USDT withdrawal flow end-to-end on 0xl3 testnet with real blockchain transactions, correct fee calculation, and full error path coverage. This is VERIFY-02 — validating implemented code, not building new features.

**Depends on:** Phase 59 (Marketplace E2E Verification) — reuses test users and their earned commissions from marketplace flow.

</domain>

<decisions>
## Implementation Decisions

### Test Scenarios & USDT Amounts

- **D-01:** All 9 scenarios must be verified:
  - Happy path — 1 USDT, 5 USDT, 10 USDT withdrawals
  - Edge cases — 0.01 USDT (min boundary), 0 USDT (zero), -1 USDT (negative)
  - Error states — insufficient balance, invalid external wallet address
  - Fee preview accuracy — frontend displays correct 5% fee and net amount
  - Balance update — balance decreases by withdrawal amount after successful tx

### Blockchain Verification

- **D-02:** Three-layer verification required:
  1. Block explorer visual check — tx visible on 0xl3 explorer with correct USDT transfer
  2. Programmatic balance diff — recipient wallet USDT balance increases by (amount - fee)
  3. PocketBase record — `withdrawals` record has correct `tx_hash` and `status = "completed"`

### Fee Calculation Accuracy

- **D-03:** Two fee configurations tested:
  1. Default 5% — withdraw 10 USDT, verify PB record shows fee=0.50, user receives 9.50 USDT
  2. Config override — set `wallet_configs` key `WITHDRAWAL_FEE` to 0.03 (3%), withdraw 5 USDT, verify fee=0.15 USDT, confirm config-driven fee works

### Error Path Coverage

- **D-04:** Full chaos testing:
  - User errors — insufficient balance returns 400, invalid address returns 400 (validation)
  - Infrastructure failure — wallet-api unreachable → graceful error, no crash
  - Blockchain revert — tx reverts on-chain → PB record status="failed", user balance unchanged
  - Duplicate withdrawal — rapid double-submit → only one tx executed, idempotency verified

### Test Data Source

- **D-05:** Reuse Phase 59 test users with real earned commissions from marketplace flow (mint → list → buy). No pre-funding needed — commissions are earned organically through verified marketplace transactions.

### the agent's Discretion

- Exact verification script structure (bash, Node.js, or manual steps)
- How to simulate wallet-api down (stop container, mock, or environmental)
- Retry behavior for balance checks after tx confirmation
- Logging format and evidence capture for verification report

</decisions>

<specifics>
## Specific Ideas

No specific UI/UX references — this is a backend verification phase focused on blockchain transaction correctness and error resilience.

</specifics>

<canonical_refs>

## Canonical References

### Withdraw Feature Spec

- `apps/web/features/hot-wallet-withdraw/SPEC.md` — Feature success criteria, acceptance test flow, technical constraints
- `apps/web/features/hot-wallet-withdraw/tasks.md` — All 9 tasks complete, implementation inventory

### Backend Implementation

- `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` — Main withdraw hook (POST /api/v2/wallet/withdraw). Auth, validation, fee calculation, wallet-api call, PB record creation
- `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` — Balance endpoint (POST /api/v2/hot-wallet/balance). Returns withdrawable, usdt_balance, total_withdrawn

### Frontend

- `apps/web/app/dashboard/withdraw/page.tsx` — Fully implemented withdraw page with balance display, form validation, fee preview (5%), withdrawal history tabs

### Phase Requirements

- `.planning/ROADMAP.md` § Phase 60 — 5 success criteria for withdraw flow validation

### Smart Contract

- `contracts/src/CommissionDistribution.sol` — `claimCommissionUSDT()` function (source of withdrawable USDT)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **withdrawals collection**: Schema with `user_id`, `amount`, `fee`, `external_wallet_address`, `status`, `tx_hash`, `created` — ready for verification record tracking
- **wallet_configs collection**: `WITHDRAWAL_FEE` key for configurable fee rate — used in D-03 config override test
- **Phase 59 test users**: Will have earned commissions after marketplace E2E flow — direct input to D-05

### Established Patterns

- **Auth pattern**: `e.requestInfo().auth` for PocketBase v0.23.4 (not `$apis.requireAuth`)
- **API response format**: `{ success: true/false, data/error: { message, code } }`
- **Fee pattern**: 5% default, overridable via `wallet_configs.findFirstRecordByData("wallet_configs", "key", "WITHDRAWAL_FEE")`

### Integration Points

- **wallet-api → blockchain**: Hook calls wallet-api's transfer endpoint, which executes real USDT transfer via ethers.js
- **PocketBase → frontend**: Balance fetched from `/api/v2/hot-wallet/balance`, withdrawal submitted to `/api/v2/wallet/withdraw`
- **0xl3 testnet**: RPC `https://rpc.0xl3.com`, mock USDT `0x6Ce3cCcBC5146ED8b88F1FbC12D4682Be3E4Cf8e` (from STATE.md)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 60-withdraw-flow-validation_
_Context gathered: 2026-05-11_

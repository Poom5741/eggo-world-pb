# Phase 28: Wallet Withdrawal & CoinStor Admin - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users withdraw USDT from platform wallet to external blockchain addresses. Admins manage CoinStor reserve pool (4% platform fee accumulator) with balance viewing, liquidity injection, and ecosystem reward batch distribution.

**In scope:**

- Wallet API endpoint for actual blockchain USDT withdrawal (replace mock hook)
- Inline fee preview before withdrawal confirmation (amount + fee + net transfer)
- Withdrawal history tab on existing `/dashboard/withdraw` page
- `withdrawal_records` collection for audit trail
- Admin CoinStor tab on `/admin/monitoring` (balance, liquidity inject, rewards batch)
- Manual input for ecosystem rewards distribution (wallet + amount per line)

**Out of scope:**

- KYC verification system (optional toggle, default false for MVP)
- Smart contract changes (use existing CommissionDistribution.sol functions)
- Withdrawal limits or daily caps
- Email notifications for withdrawal completion
- Admin role system refinement (use existing auth pattern)

</domain>

<decisions>
## Implementation Decisions

### Withdrawal Trigger Location

- **D-01:** Keep existing `/dashboard/withdraw` page — already has balance display, form inputs, wired to hook endpoint. No new modal or route needed.

### Fee Display & Preview

- **D-02:** Inline preview before submission — show "Amount: X | Fee: Y | Net transfer: Z USDT" in form, calculate dynamically from `wallet_configs.WITHDRAWAL_FEE` (default 5%). User sees full breakdown before clicking Withdraw.

### Transaction History

- **D-03:** Tab on withdraw page — add "History" tab to existing `/dashboard/withdraw` showing past withdrawals from `withdrawal_records` collection. No dedicated route needed.

### CoinStor Admin Location

- **D-04:** Extend `/admin/monitoring` with CoinStor tab — add tab to existing admin dashboard (Phase 24 implementation). Single route for all admin functions.

### CoinStor Functions

- **D-05:** All three functions: Balance display + Liquidity injection + Ecosystem rewards batch — full admin capabilities for reserve management.

### Ecosystem Rewards Input

- **D-06:** Manual input per line — admin enters wallet + amount pairs line by line. Simple UI, direct control. No CSV upload for MVP.

### Pre-Locked (from existing implementation)

- **D-07:** Withdrawal fee configurable via `wallet_configs` collection (already implemented in `09-withdraw-usdt.pb.js`)
- **D-08:** KYC toggle optional, default false — no verification required for MVP
- **D-09:** `withdrawal_records` collection for audit trail — new collection needed
- **D-10:** Admin-only PocketBase hook for CoinStor — check admin auth before operations

### Claude's Discretion

- Exact fee preview layout (follow existing form styling, claymorphism pattern)
- History tab table columns (date, amount, fee, destination, status, tx_hash)
- CoinStor balance card design (use existing StatCard pattern)
- Liquidity injection form specifics (amount input, confirmation button)
- Rewards batch input textarea styling
- Number of lines to show in history (default 20 recent)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Phase 28 — WALLET-01 through WALLET-03, COINSTOR-01 through COINSTOR-03
- `.planning/ROADMAP.md` §Phase 28 — Wallet Withdrawal & CoinStor Admin entry
- `docs/NFT_Marketplace_Functional_Spec.md` §9.2 — Wallet functions (withdrawUSDT, fee deduction)
- `docs/NFT_Marketplace_Functional_Spec.md` §9.3 — CoinStor reserve functions (getCoinStorBalance, liquidity inject, ecosystem rewards)

### Existing Implementation

- `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` — Mock withdrawal endpoint (needs wallet-api integration)
- `apps/web/app/dashboard/withdraw/page.tsx` — Existing withdraw page with form
- `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` — Balance endpoint with withdrawable field
- `apps/backend/collections/wallet_configs.json` — Fee configuration collection
- `wallet-api/server.js` — Wallet API server (add withdrawal endpoint)

### Admin Patterns

- `apps/web/app/admin/monitoring/page.tsx` — Existing monitoring dashboard from Phase 24
- `apps/web/app/admin/monitoring/page.tsx` §StatCard — Card pattern for metrics display

### Smart Contract

- `contracts/src/CommissionDistribution.sol` §withdrawCoinStor — Existing CoinStor withdrawal function
- `contracts/src/CommissionDistribution.sol` §coinStorReserve — Reserve address constant
- `contracts/src/CommissionDistribution.sol` §CoinStorDeposit event — Emitted on every sale

### UI Patterns

- `apps/web/components/egg-nft/MintEggModal.tsx` — Modal pattern with confirmation steps
- `apps/web/components/dashboard/balance-card.tsx` — Balance display pattern

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Withdraw page:** `apps/web/app/dashboard/withdraw/page.tsx` — Already has balance fetch, form inputs, submit handler. Add fee preview and history tab.
- **Withdrawal hook:** `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` — Mock endpoint exists, needs wallet-api call for actual blockchain transfer.
- **Wallet configs:** `apps/backend/collections/wallet_configs.json` — WITHDRAWAL_FEE key already used (default 5%).
- **Admin monitoring:** `apps/web/app/admin/monitoring/page.tsx` — StatCard pattern, tab layout possible, existing auth check.
- **CommissionDistribution.sol:** `withdrawCoinStor()` function for admin CoinStor operations.

### Established Patterns

- **PocketBase hooks:** `routerAdd("POST", "/api/v2/...")` pattern, `$app.findFirstRecordByData`, `e.json(200, { success, data })`
- **Fee configuration:** `wallet_configs` collection with key/value pairs, `getNumber("value")`
- **Admin auth:** `pb.authStore.isValid` check in monitoring page — reuse for CoinStor admin
- **Claymorphism:** `clay-card` class, StatCard component pattern for metrics

### Integration Points

- **Withdrawal hook → wallet-api:** Replace mock with actual USDT transfer call to wallet-api endpoint
- **Withdraw page fee preview:** Fetch `WITHDRAWAL_FEE` from `wallet_configs`, calculate dynamically
- **Withdraw page history:** Query `withdrawal_records` collection (new), display in tab
- **Admin monitoring CoinStor tab:** Query CoinStor balance from contract or hook, add inject/rewards forms

### Known Gaps

- No `withdrawal_records` collection exists — needs creation
- Withdrawal hook is mock (logs only) — needs wallet-api integration
- No CoinStor balance hook — needs creation
- No liquidity injection hook — needs creation
- No ecosystem rewards hook — needs creation

</code_context>

<specifics>
## Specific Ideas

- "Fee preview should update as user types amount — reactive calculation before submission"
- "History tab shows: date, amount, fee, destination wallet, status (pending/success/failed), tx_hash"
- "CoinStor balance from CommissionDistribution.sol commissionBalances[coinStorReserve] — query contract directly"
- "Liquidity injection: single amount input, confirmation button, calls `coinStorLiquidityInject(amount)`"
- "Rewards batch: textarea with one wallet+amount per line, parse on submit"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 28 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 28-wallet-withdrawal-coinstor_
_Context gathered: 2026-04-23_

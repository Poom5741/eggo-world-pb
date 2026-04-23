# Phase 28: Wallet Withdrawal & CoinStor Admin - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 28-wallet-withdrawal-coinstor
**Areas discussed:** Withdrawal trigger location, Fee display, Transaction history location, CoinStor admin location, CoinStor functions, Ecosystem rewards input

---

## Withdrawal Trigger Location

| Option                           | Description                                                  | Selected |
| -------------------------------- | ------------------------------------------------------------ | -------- |
| Modal from Balance Card          | Add 'Withdraw' button to existing BalanceCard component      |          |
| Dedicated /wallet Page           | Create new /wallet page with withdrawal form and history     |          |
| Dashboard Quick Actions          | Add withdrawal option to QuickActions component on dashboard |          |
| **Existing /dashboard/withdraw** | **Page already exists with form, balance, submit handler**   | ✓        |

**User's choice:** Existing `/dashboard/withdraw` page (discovered during discussion — user pointed out withdraw button already exists in dashboard top area)

**Notes:** The withdraw page at `/dashboard/withdraw/page.tsx` already has all necessary UI components: balance display, amount input, external wallet input, submit button wired to `/api/v2/wallet/withdraw`. Decision: keep existing page, add fee preview and history tab.

---

## Fee Display & Preview

| Option             | Description                                                    | Selected |
| ------------------ | -------------------------------------------------------------- | -------- | ------------------------------ | --- |
| **Inline Preview** | \*\*Show 'Amount: X                                            | Fee: Y   | Net: Z USDT' before submit\*\* | ✓   |
| Confirmation Modal | After clicking Withdraw, show modal with fee breakdown         |          |
| Text Notice Only   | 'A 5% withdrawal fee will be applied' — no calculation preview |          |

**User's choice:** Inline Preview (Recommended)

**Notes:** Fee is already calculated in hook (5% default from `wallet_configs.WITHDRAWAL_FEE`). Frontend should display breakdown dynamically as user types amount, before clicking Withdraw button.

---

## Transaction History Location

| Option                         | Description                                                | Selected |
| ------------------------------ | ---------------------------------------------------------- | -------- |
| **Tab on Withdraw Page**       | **Add 'History' tab to existing /dashboard/withdraw page** | ✓        |
| Dedicated /wallet/history Page | Create new route for withdrawal history                    |          |
| Dashboard Section              | Section in BalanceCard showing last 3-5 withdrawals        |          |

**User's choice:** Tab on Withdraw Page (Recommended)

**Notes:** Simplest approach — no new route needed. Add tab component to existing withdraw page, query `withdrawal_records` collection (new), display in table format.

---

## CoinStor Admin Location

| Option                       | Description                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| **Extend /admin/monitoring** | **Add 'CoinStor' tab to existing admin dashboard (Phase 24)** | ✓        |
| New /admin/coinstor Page     | Dedicated admin dashboard for reserve management              |          |
| Admin Section in Dashboard   | Add CoinStor controls to /dashboard when admin logged in      |          |

**User's choice:** Extend `/admin/monitoring` (Recommended)

**Notes:** Admin monitoring page exists from Phase 24 with StatCard pattern, auth check, transaction metrics. Adding CoinStor tab keeps all admin functions in single route.

---

## CoinStor Functions

| Option                   | Description                                                   | Selected |
| ------------------------ | ------------------------------------------------------------- | -------- |
| **All Three Functions**  | **Balance display + Liquidity injection + Ecosystem rewards** | ✓        |
| Balance Display Only     | MVP: only balance, defer liquidity and rewards                |          |
| Balance + Liquidity Only | Balance and liquidity, defer ecosystem rewards                |          |

**User's choice:** All Three Functions (Recommended)

**Notes:** Full admin capabilities for CoinStor reserve management: viewing accumulated balance, injecting liquidity into marketplace pool, batch distributing ecosystem rewards to users.

---

## Ecosystem Rewards Input

| Option           | Description                                         | Selected |
| ---------------- | --------------------------------------------------- | -------- |
| **Manual Input** | **Admin enters wallet + amount pairs line by line** | ✓        |
| CSV Upload       | Upload CSV file with wallet,amount columns          |          |

**User's choice:** Manual Input (Recommended)

**Notes:** Simple textarea where admin enters one wallet + amount pair per line. Parse on submit, validate addresses, call hook. No CSV file handling for MVP.

---

## Claude's Discretion

- Exact fee preview layout and styling
- History tab table columns
- CoinStor balance card design
- Liquidity injection form specifics
- Rewards batch textarea styling
- Number of history records to display

---

## Deferred Ideas

None — discussion stayed within Phase 28 scope.

---

_Discussion log generated: 2026-04-23_

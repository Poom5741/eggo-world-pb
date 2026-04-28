# Phase 48: Referral Commission Journey Test - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 48-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 48-referral-commission-journey-test
**Mode:** --auto (auto-selected all decisions)

---

## Gray Areas Identified

| Area               | Description                                                     | Auto-Selected                                             |
| ------------------ | --------------------------------------------------------------- | --------------------------------------------------------- |
| Test Flow          | signup → purchase → commission vs pre-configured referral chain | Pre-configured referral chain (skip signup complexity)    |
| Verification Scope | On-chain only vs PocketBase only vs both                        | Both on-chain + PocketBase (recommended for completeness) |
| Test Users         | Existing test_referrer only vs full 4-level chain               | test_referrer as G1 + minimal G2-G4 placeholders          |
| Claim Testing      | Balance accumulation vs claimCommission() flow                  | Balance accumulation only (core flow focus)               |

---

## Test Flow

| Option                        | Description                                          | Selected |
| ----------------------------- | ---------------------------------------------------- | -------- |
| Pre-configured referral chain | Skip signup UI, pre-set referral_chain on test_buyer | ✓        |
| Full signup journey           | Test LINE OAuth → referral link → signup → purchase  |          |

**Auto-selected:** Pre-configured referral chain — simpler setup, focuses on commission distribution logic rather than signup UI complexity.

**Notes:** Signup flow is separate from commission distribution. The core commission logic is triggered by mint-egg endpoint.

---

## Verification Scope

| Option                       | Description                                                  | Selected |
| ---------------------------- | ------------------------------------------------------------ | -------- |
| Both (on-chain + PocketBase) | Full verification: getCommissionBalance + commission_records | ✓        |
| On-chain only                | Just blockchain state                                        |          |
| PocketBase only              | Just database records                                        |          |

**Auto-selected:** Both on-chain + PocketBase — matches triple verification pattern from Phase 45/47, ensures consistency across blockchain and app state.

---

## Test Users

| Option                            | Description                                    | Selected |
| --------------------------------- | ---------------------------------------------- | -------- |
| test_referrer (G1) + placeholders | Minimal setup, G2-G4 use placeholder addresses | ✓        |
| Full 4-level chain                | Create test users for all 4 levels             |          |

**Auto-selected:** test_referrer (G1) + placeholders — simpler test data setup, covers primary commission recipient (G1 gets 20%).

**Notes:** G1 is the most important level (20% commission). G2-G4 can use placeholder addresses for verification.

---

## Claim Testing

| Option               | Description                              | Selected |
| -------------------- | ---------------------------------------- | -------- |
| Balance accumulation | Verify commission balance after purchase | ✓        |
| Full claim flow      | Test claimCommission() + withdrawal      |          |

**Auto-selected:** Balance accumulation only — covers core commission distribution. Claim flow is a separate operation that can be tested in future phases.

---

## Claude's Discretion

Areas where Claude has flexibility:

- Exact timeout values for blockchain polling
- Retry count for commission balance checks
- Test file location (tests/e2e/playwright-referral-commission.test.ts recommended)
- G2-G4 placeholder addresses (can use Anvil accounts or static addresses)

---

## Deferred Ideas

| Idea                            | Reason                                     |
| ------------------------------- | ------------------------------------------ |
| Commission claim flow testing   | Separate operation, future phase           |
| Referral signup UI journey      | Signup complexity separate from commission |
| Full 4-level chain verification | Extended test, G1 covers primary case      |
| No-referrer error scenario      | Edge case, future phase                    |

---

_Phase: 48-referral-commission-journey-test_
_Discussion completed: 2026-04-28_

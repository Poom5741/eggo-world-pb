# Phase 55: Referral Commission Distribution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 55-referral-commission-distribution
**Areas discussed:** Commission percentages, Credit timing

---

## Commission Percentages

| Option                          | Description                                                            | Selected |
| ------------------------------- | ---------------------------------------------------------------------- | -------- |
| Use requirements (25/15/10/5)   | G1=25%, G2=15%, G3=10%, G4=5% (55% total) — per REQUIREMENTS.md        | ✓        |
| Keep current code (20/10/10/10) | G1=20%, G2=10%, G3=10%, G4=10% (50% total) — current code matches this |          |
| Use a different split           | G1=20%, G2=15%, G3=10%, G4=5% (50% total) — different split            |          |

**User's choice:** Use requirements (25/15/10/5)
**Notes:** User confirmed requirements percentages should be used. Current code has wrong percentages.

---

## Credit Timing

| Option                             | Description                                                                        | Selected |
| ---------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Credit only on claim (Recommended) | Remove usdt_total_earned update from createCommissionRecords, only credit on claim | ✓        |
| Credit immediately (current code)  | Keep immediate credit in createCommissionRecords, remove from claim flow           |          |
| Keep both fields separate          | Create pending balance field, update both claim and total_earned separately        |          |

**User's choice:** Credit only on claim (Recommended)
**Notes:** Prevents double-crediting. Discovered bug: createCommissionRecords() updates usdt_total_earned immediately, and claim-commission hook also updates it. This causes referrers to be credited twice.

---

## Critical Bug Found

**Double-crediting bug:**

- `createCommissionRecords()` (line 137-141 in 13-mint-egg-nft.pb.js): Updates `usdt_total_earned` immediately when commission record is created
- `14-claim-commission.pb.js` (line 90-92): Also adds to `usdt_total_earned` when claiming

**Fix:** Remove `usdt_total_earned` update from `createCommissionRecords()`, keep it only in `claim-commission` flow.

---

## Deferred Ideas

None — discussion stayed within Phase 55 scope

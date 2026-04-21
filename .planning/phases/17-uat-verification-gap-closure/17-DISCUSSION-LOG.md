# Phase 17: UAT & Verification Gap Closure - Discussion Log

**Date:** 2026-04-21  
**Phase:** 17-uat-verification-gap-closure  
**Mode:** Interactive discussion (all areas)

## Gray Areas Discussed

### 1. UAT Test Execution Strategy

**Question:** How should Phase 10's 10 pending UAT scenarios be completed?  
**Decision:** Hybrid approach — automate critical paths, manual for edge cases

### 2. USDT Flow Scope (Buy Now / Gas Sponsorship)

**Question:** What exactly needs to happen when a user clicks "Buy Now"?  
**Decision:** Full end-to-end implementation following pkbase-wallet reference pattern with gas sponsorship and internal ledger transfers

### 3. Dashboard Auto-Polling Coverage

**Question:** Which pages need auto-polling added?  
**Decision:** All dashboard pages — eggs, commissions, deposits, referrals at 30s intervals

### 4. Food Count Validation Location

**Question:** Where should validation for food_count < 10 happen?  
**Decision:** Both layers — backend hook (fast fail) + wallet-api (real-time on-chain validation)

## Decisions Captured in CONTEXT.md

| Decision ID  | Area            | Description                                                                  |
| ------------ | --------------- | ---------------------------------------------------------------------------- |
| D-01 to D-03 | UAT Strategy    | Hybrid testing, critical path prioritization, manual documentation           |
| D-04 to D-07 | USDT Flow       | Full e2e implementation, gas sponsorship, internal ledger, reference pattern |
| D-08 to D-10 | Auto-Polling    | All dashboard pages, 30s interval, "Updating..." indicator                   |
| D-11 to D-13 | Food Validation | Dual-layer validation, error messages, safety net                            |

---

_Phase: 17-uat-verification-gap-closure_  
_Discussion log generated: 2026-04-21_

# Phase 55: Referral Commission Distribution — Plan

**Phase:** 55
**Created:** 2026-05-08
**Status:** Planned
**Requirements:** COMM-01

---

## Overview

Fix commission percentage bug and double-credit bug in the mint flow. Commission percentages must match requirements (G1=25%, G2=15%, G3=10%, G4=5%) and referrers should only be credited when they claim, not immediately on mint.

---

## Wave 1: Bug Fixes

### [P1] TASK-55-01: Fix commission percentages

**File:** `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`

**Changes:**

```javascript
// Line 116 - WRONG:
var commissionPercents = [20, 10, 10, 10]

// CORRECT (per REQUIREMENTS.md):
var commissionPercents = [25, 15, 10, 5]
```

**Success criteria:** Commission percentages match: G1=25%, G2=15%, G3=10%, G4=5%

**Accepts:** (none — first task)

---

### [P1] TASK-55-02: Remove double-credit from createCommissionRecords

**File:** `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`

**Changes:**
Remove lines 137-141 that update `usdt_total_earned` immediately. The claim-commission hook (`14-claim-commission.pb.js`) handles this correctly.

**Before (lines 137-141 to REMOVE):**

```javascript
var referrerUser;
try { referrerUser = $app.findRecordById('users', referrerWallet.get('user_id')); } catch (e) { continue; }
var totalEarned = parseFloat(referrerUser.get('usdt_total_earned') || '0');
referrerUser.set('usdt_total_earned', (totalEarned + commissionAmount).toFixed(2));
$app.save(referrerUser);
```

**After:** Commission records are created but `usdt_total_earned` is NOT updated until user claims.

**Success criteria:** Referrers are only credited when they claim commissions via `/api/v2/claim-commission`

**Accepts:** TASK-55-01

---

## Wave 2: Verification

### [P1] TASK-55-03: Verify commission calculation

**Test cases:**

| Referrer Level | Expected Commission (on $25 mint) |
| -------------- | --------------------------------- |
| G1 (Direct)    | $6.25 (25%)                       |
| G2             | $3.75 (15%)                       |
| G3             | $2.50 (10%)                       |
| G4             | $1.25 (5%)                        |
| **Total**      | **$13.75 (55%)**                  |

**Accepts:** TASK-55-02

---

### [P1] TASK-55-04: Verify no double-credit

**Test flow:**

1. User A refers User B
2. User B mints egg → commission_records created for User A
3. User A's `usdt_total_earned` should NOT change yet
4. User A claims commission → `usdt_total_earned` increases by correct amount
5. User A claims again → no change (already claimed)

**Accepts:** TASK-55-03

---

## Success Criteria (from ROADMAP)

1. [ ] G1 (25%), G2 (15%), G3 (10%), G4 (5%) commission splits distribute correct USDT amounts on mint
2. [ ] Commission records are written to database for each distribution (traceable per purchase)
3. [ ] Missing referrer levels correctly skip to next available level (already working)
4. [ ] Users can verify their commission balance reflects received payouts (via claim flow)

---

## Files to Modify

| File                                          | Changes                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` | Fix commission percentages, remove double-credit |

---

## Notes

**Bug summary:**

- Commission percentages were wrong (20/10/10/10 instead of 25/15/10/5)
- `createCommissionRecords()` was crediting `usdt_total_earned` immediately AND `claim-commission` was crediting again — double-credit!

**Fix approach:**

- Fix percentages in one place (line 116)
- Remove immediate credit from `createCommissionRecords()` — claim hook handles it

---

_Plan created: 2026-05-08_

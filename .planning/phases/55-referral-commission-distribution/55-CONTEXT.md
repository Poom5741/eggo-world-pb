# Phase 55: Referral Commission Distribution - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure referral commissions correctly distribute through the 4-level MLM chain when users mint egg NFTs. Commission percentages must match requirements, and referrers should be credited only when they claim their commissions.

</domain>

<decisions>
## Implementation Decisions

### Commission Percentages

- **D-01:** Commission percentages per level — G1=25%, G2=15%, G3=10%, G4=5% (55% total to referrers). This matches REQUIREMENTS.md for COMM-01.
- **Current code bug:** `13-mint-egg-nft.pb.js` line 116 has `[20, 10, 10, 10]` — must change to `[25, 15, 10, 5]`
- **Mint price:** 25 USDT per egg

### Credit Timing

- **D-02:** Credit referrers' `usdt_total_earned` only when they claim commissions — NOT immediately on mint.
- **Rationale:** Prevents double-crediting. The `createCommissionRecords()` function currently updates `usdt_total_earned` immediately (line 137-141), and `14-claim-commission.pb.js` also updates it on claim (line 90-92). This causes referrers to be credited twice.
- **Fix:** Remove `usdt_total_earned` update from `createCommissionRecords()`, keep it only in `claim-commission` flow.

### Commission Record Creation

- **D-03:** Commission records are created in `13-mint-egg-nft.pb.js` after successful mint transaction.
- **Records created:** One per active referrer level (G1-G4) where referrer exists
- **Record fields:** user, level, amount, tx_hash, from_egg, claimed, claimed_at

### Missing Referrer Levels

- **D-04:** If referral chain level is null, skip that level — no commission record created, no platform fallback needed.
- **Current behavior:** `if (referralChain[ci] === null) continue;` — correct, no change needed.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Commission System

- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Mint hook with commission record creation (BUG: line 116 wrong %, line 137-141 double-credit)
- `apps/backend/pb_hooks/14-claim-commission.pb.js` — Claim commission hook (keep usdt_total_earned update here)
- `apps/backend/collections/commission_records.json` — Commission record schema

### Documentation

- `docs/modules/referrals.md` — 4-level MLM system documentation (percentages outdated)
- `.planning/REQUIREMENTS.md` — COMM-01 requirement definition

### Patterns (from Phase 54)

- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Error response format: `e.json(400, { success: false, error: { message, code } })`
- `wallet-api/server.js` — `withRetry()` pattern with exponential backoff

</canonical_refs>

<codebase_context>

## Existing Code Insights

### Reusable Assets

- `createCommissionRecords()` function in `13-mint-egg-nft.pb.js` — handles commission record creation, needs fixing
- `14-claim-commission.pb.js` — claim flow already implemented, just needs to NOT double-credit

### Bugs to Fix

1. **Line 116 in 13-mint-egg-nft.pb.js:**

   ```javascript
   var commissionPercents = [20, 10, 10, 10] // WRONG
   // Should be:
   var commissionPercents = [25, 15, 10, 5]
   ```

2. **Lines 137-141 in 13-mint-egg-nft.pb.js:**
   ```javascript
   // REMOVE these lines (double-credit bug):
   var referrerUser;
   try { referrerUser = $app.findRecordById('users', referrerWallet.get('user_id')); } catch (e) { continue; }
   var totalEarned = parseFloat(referrerUser.get('usdt_total_earned') || '0');
   referrerUser.set('usdt_total_earned', (totalEarned + commissionAmount).toFixed(2));
   $app.save(referrerUser);
   ```

### Integration Points

- Mint hook creates `commission_records` for each referrer
- Claim hook credits `usdt_total_earned` when user claims
- `user_wallets.usdt_balance` updated separately on claim (via wallet-api)

</codebase_context>

<specifics>
## Specific Ideas

- User emphasized: commission distribution must match requirements (25/15/10/5)
- Bug fix priority: double-crediting must be fixed before Phase 56 frontend work

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 55 scope

</deferred>

---

_Phase: 55-referral-commission-distribution_
_Context gathered: 2026-05-08_

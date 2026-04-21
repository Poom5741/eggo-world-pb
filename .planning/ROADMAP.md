### Phase 18: Fix LINE OAuth Wallet Auto-Creation

**Goal:** LINE OAuth users get wallets auto-created during signup, enabling Buy Now flow  
**Depends on:** Nothing (bug fix)  
**Requirements:** UI-05 (Buy Now flow), SEC-01 (wallet creation)  
**Success Criteria** (what must be TRUE):

1. LINE OAuth signup triggers wallet creation hook automatically
2. New users have `wallet` field populated with valid Ethereum address (0x...)
3. New users have `daccPublickey` field populated
4. `user_wallets` record created with initial USDT balance (0)
5. Buy Now flow works for LINE OAuth users without "User has no wallet" error

**Plans**: 2 plans

Plans:

- [ ] 18-01-PLAN.md — Fix wallet hook (onRecordCreate → onRecordBeforeCreate), add debug endpoint
- [ ] 18-02-PLAN.md — Update OAuth callback with wallet verification, create test script

**Root Cause Identified:**

The `01-create-wallet.pb.js` hook uses `onRecordCreate` with `$apis.requireAuth()` which requires an authenticated user. However, LINE OAuth creates users via `pb.collection('users').create()` WITHOUT an auth token (new user doesn't have one yet). The auth check fails silently, so wallet creation never executes.

**Fix:**

Change hook to `onRecordBeforeCreate` which fires before commit and doesn't require authentication. Remove `$apis.requireAuth()` call and `e.next()` (not needed in onRecordBeforeCreate). Add wallet verification to line-callback.html to catch any future hook failures.

---

_Last updated: 2026-04-21 — Phase 18 plans created_

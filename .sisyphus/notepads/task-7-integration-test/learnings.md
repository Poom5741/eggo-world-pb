# Task 7 Integration Test - Learnings

## What Worked

1. **User Creation via PB API** - POST /api/collections/users/records creates user
2. **Wallet Creation Hook** - After fix, hook creates EVM + DACC wallets correctly
3. **Authentication** - Password auth works with auth-with-password endpoint
4. **Withdraw Flow** - Correctly validates balance and returns INSUFFICIENT_BALANCE

## Bug Found & Fixed

**Issue**: `01-create-wallet.pb.js` used `onRecordBeforeCreate` which is undefined in PocketBase 0.36.x

**Error**: `ReferenceError: onRecordBeforeCreate is not defined`

**Fix**: Changed to `onRecordCreate((e) => {` - the correct function for PB 0.36.x

**Location**: `apps/backend/pb_hooks/01-create-wallet.pb.js:7`

## Key Findings

1. **New wallets have 0 USDT** - This is expected. Withdraw blocked by insufficient balance.
2. **Hook fix required** - Without fix, wallet fields were empty on user creation
3. **Encrypted private key hidden** - Not exposed in API response for security

## Test Results

| Step | Status |
|------|--------|
| Create user | PASS |
| Verify wallet fields | PASS |
| Authenticate | PASS |
| Withdraw (0 balance) | BLOCKED (expected) |

## Evidence

Saved to: `.sisyphus/evidence/task-7-integration-test.json`

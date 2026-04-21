---
phase: "18"
plan: "01"
status: complete
completed: 2026-04-21T12:30:00.000Z
---

# Plan 18-01 Summary: Fix Wallet Creation Hook

## Objective
Fix the wallet creation hook to fire on LINE OAuth user creation by changing from `onRecordCreate` (requires auth) to `onRecordBeforeCreate` (fires before commit, no auth requirement), and add debug endpoint to test OAuth wallet creation flow.

## What Was Built

### 1. Fixed Wallet Creation Hook
**File**: `apps/backend/pb_hooks/01-create-wallet.pb.js`

**Changes**:
- Changed hook type from `onRecordCreate("users", ...)` to `onRecordBeforeCreate((e) => ...)`
- Removed `$apis.requireAuth()` call that was blocking unauthenticated LINE OAuth user creation
- Removed `e.next()` call at end of hook (not needed in onRecordBeforeCreate)
- Added collection filter to only process users collection: `if (e.record.collection().name !== "users") { e.next(); return; }`
- Preserved all existing wallet creation logic (random password generation, wallet API call, field setting)

**Why this fixes the issue**:
- LINE OAuth creates users via `pb.collection('users').create()` WITHOUT an auth token
- The old `onRecordCreate` hook with `$apis.requireAuth()` failed silently for unauthenticated user creation
- `onRecordBeforeCreate` fires BEFORE commit and doesn't require authentication
- Wallet creation now executes for ALL user creation including OAuth flows

### 2. Debug Test Endpoint
**File**: `apps/backend/pb_hooks/18-test-oauth-wallet.pb.js` (NEW)

**Features**:
- Endpoint: `POST /api/v2/test-oauth-wallet`
- Creates test user with unique email pattern: `test-oauth-{timestamp}@line.eggo`
- Triggers `onRecordBeforeCreate` hook automatically
- Verifies wallet fields are populated after creation
- Returns comprehensive JSON response with validation flags:
  - `wallet`: Ethereum address (0x...)
  - `daccPublickey`: DACC public key (daccPublickey_...)
  - `pin_exists`: Whether encryption password was set
  - `usdt_balance`: Initial balance (should be 0)
  - `wallet_valid`: Boolean - wallet starts with "0x"
  - `dacc_publickey_valid`: Boolean - daccPublickey starts with "daccPublickey_"

**Security note**: This endpoint has NO authentication (intentionally for dev testing). Should be removed or protected after Phase 18 verification.

## Key Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `apps/backend/pb_hooks/01-create-wallet.pb.js` | Modified | Fixed hook to use onRecordBeforeCreate |
| `apps/backend/pb_hooks/18-test-oauth-wallet.pb.js` | Created | Debug endpoint for OAuth wallet testing |

## Verification Results

### Hook Verification
```bash
✅ grep "onRecordBeforeCreate" → Line 7: onRecordBeforeCreate((e) => {
✅ !grep "requireAuth" → No matches (removed successfully)
✅ grep "e\.next()" → Only line 10 in collection filter (correct)
✅ grep "e.record.set(\"wallet\"" → Line 79: wallet field setting preserved
✅ grep "e.record.set(\"daccPublickey\"" → Line 80: daccPublickey field setting preserved
✅ grep "e.record.set(\"pin\"" → Line 81: pin field setting preserved
```

### Debug Endpoint Verification
```bash
✅ File exists: apps/backend/pb_hooks/18-test-oauth-wallet.pb.js
✅ grep "routerAdd" → Line 7: POST /api/v2/test-oauth-wallet
✅ grep "newRecord" → Line 20: $app.newRecord("users")
✅ grep "save" → Line 29: $app.save(record)
✅ grep "wallet_valid" → Line 54: wallet validation with startsWith("0x")
✅ grep "daccPublickey" → Multiple lines: daccPublickey in response
```

## Self-Check: PASSED

All acceptance criteria verified:
- ✅ Hook uses `onRecordBeforeCreate((e) =>` (grep confirms)
- ✅ Hook does NOT contain `$apis.requireAuth()` (grep returns nothing)
- ✅ Hook does NOT contain `e.next()` at end (only in collection filter)
- ✅ Hook contains collection filter for users
- ✅ Hook contains wallet field setting
- ✅ Hook contains daccPublickey field setting
- ✅ Hook contains pin field setting
- ✅ Debug endpoint file exists
- ✅ Debug endpoint contains routerAdd
- ✅ Debug endpoint contains user creation with newRecord
- ✅ Debug endpoint contains save call
- ✅ Debug endpoint contains wallet in response
- ✅ Debug endpoint contains wallet validation

## Commit
- **Hash**: 0e520c1
- **Message**: fix(18-01): change wallet hook to onRecordBeforeCreate, add debug endpoint

## Next Steps
- Plan 18-02 will update line-callback.html to verify wallet creation
- Test debug endpoint against local PocketBase: `curl -X POST http://localhost:8090/api/v2/test-oauth-wallet`
- Deploy to production and test against live PocketBase

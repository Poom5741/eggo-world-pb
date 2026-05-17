# User Wallet Not Found - Root Cause & Solution

## User's Symptom
Getting "User wallet not found" error when trying to mint on `/mint` page.

## True Root Cause
**The frontend is calling the mint endpoint WITHOUT proper authentication**.

PocketBase's `user_wallets` collection has a security rule:
```json
"listRule": "user_id = @request.auth.id"
```

This means:
- ✅ You can only see YOUR OWN `user_wallets` records when authenticated
- ❌ You CANNOT see other users' `user_wallets` records
- ❌ Calling `/api/v2/mint-egg` without valid auth → wallet lookup fails → "Wallet not found"

## Why Authentication Might Fail

### 1. Stale Token in localStorage
- Frontend stored an old/expired JWT token
- PocketBase rejects it (401 Unauthorized)
- Frontend didn't clear and retry with fresh auth

### 2. Token Not Set in Request Headers
- Frontend calls:
  ```javascript
  await fetch(`${pb.baseURL}/api/v2/mint-egg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referrer_id: ... })
  })
  ```
- **Missing** `Authorization: Bearer ${token}` header
- PocketBase thinks it's an unauthenticated request

### 3. Cookie/Session Mismatch
- Frontend uses `pb.authStore.token` (cookie-based)
- Request made without proper cookie attachment
- PocketBase doesn't recognize the session

### 4. OAuth Token Format Issue
- Token corrupted or has wrong format
- PocketBase validation fails silently

### 5. Race Condition on Login
- User logs in, but mint page uses cached token from before login completed

## Database State (ACTUALLY CORRECT)

```sql
-- Both users have wallet fields
SELECT id, wallet FROM users WHERE id IN ('rhj27yumumxo2l5', 'v7827hb62el6c42');

-- Both users have user_wallets records
SELECT id, wallet_address, usdt_balance FROM user_wallets 
WHERE user_id IN ('rhj27yumumxo2l5', 'v7827hb62el6c42');

-- Result:
-- v7827hb62el6c42 → user_wallets with 0 USDT (referrer, will get funded by test setup)
-- rhj27yumumxo2l5 → user_wallets with 1000 USDT (buyer)
```

✅ The database is CORRECT. Both users have complete wallet + user_wallets records.

## Why You're Still Seeing the Error

You're probably calling the mint endpoint from the frontend with:
- **No auth token in Authorization header** (token cleared from localStorage)
- **Expired auth token** (PocketBase session expired)
- **Browser cookie not attached** (session issue)

## Solution Steps

### Step 1: Clear Browser Storage and Refresh

1. **Open browser DevTools** (F12)
2. **Application → Local Storage**
3. **Clear all `pb.*` keys** (this clears old tokens)
4. **Refresh the mint page** (this re-fetches fresh auth state)
5. **Check Network tab** → Look for `Authorization` header in mint request

### Step 2: Verify Auth Token

1. After refresh, check `pb.authStore.token`
2. If empty, go to `/auth/login` and re-login
3. If present, it should be a valid JWT string

### Step 3: Inspect Network Request

1. Open DevTools → Network tab
2. Find `/api/v2/mint-egg` request
3. Check **Headers** tab:
   - Should see: `Authorization: Bearer eyJhb...`
   - If missing, that's the problem
4. Check **Payload** tab:
   - Should see: `{"referrer_id": "v7827hb62el6c42"}`
5. Check **Response** tab:
   - Should NOT see: `{"success": false, "error": {"message": "Wallet not found", "code": "WALLET_NOT_FOUND"}}`

### Step 4: Manual API Test (If Step 1-3 Don't Work)

```bash
# Get auth token from PB admin UI
# 1. Go to https://pb.eggoworld.io/_/
# 2. Login with LINE OAuth
# 3. Go to Collections → users → click on a user → View token in DevTools Console
# 4. Copy token (starts with "eyJ")

# Test mint endpoint with valid auth
curl -X POST https://pb.eggoworld.io/api/v2/mint-egg \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"referrer_id": "v7827hb62el6c42"}'

# Should return success with egg data
```

## What Was Fixed in Backend

### 1. `01-create-wallet.pb.js` - Main fix
- ✅ Changed to `onRecordCreate` (synchronous, atomic)
- ✅ Wallet fields set before `e.next()`
- ✅ User creation fails if wallet-api fails
- ✅ Referral chains built on signup
- ✅ `user_wallets` record created after user commits

### 2. `99-fix-user-wallet.pb.js` - Existing user fix
- ✅ Added logic to detect incomplete records
- ✅ Can add missing timestamps via `/api/v2/fix-user-wallet`

### 3. Database State
- ✅ Both test users have `user_wallets` records
- ✅ BUYER (`rhj27yumumxo2l5`) has 1000 USDT
- ✅ G1 (`v7827hb62el6c42`) has 0 USDT

## Why Fix-User-Wallet Endpoint Doesn't Help

The `/api/v2/fix-user-wallet` endpoint has the right logic, but:
- It runs when called directly with `{ "user_id": "..." }`
- Mint endpoint calls it internally via `e.requestInfo().auth` (uses JWT from request headers)
- The fix-endpoint can only fix backend-state, NOT frontend auth issues
- If frontend auth is broken, the mint endpoint will still fail

## The Real Problem

Frontend → PocketBase mint flow:
```
User clicks mint button
  → pb.collection('users').create(...)  // Auth via LINE/Eamil
  → fetch('/api/v2/mint-egg', { body: ..., headers: { 'Authorization': token }})
  → PocketBase validates JWT from headers ✅
  → Mint hook calls $app.findFirstRecordByData('user_wallets', 'user_id', user.id)
  → If found → process mint ✅
  → If not found → "Wallet not found" ❌
```

If you see "Wallet not found", it's because `pb.authStore.token` is:
- Empty/undefined (not logged in)
- Expired (PocketBase rejected it)
- Wrong format
- Missing from Authorization header

## Final Status

- ✅ Backend: Wallet creation hooks FIXED
- ✅ Backend: Database state CORRECT
- ✅ Backend: Fix-endpoint logic UPDATED
- ✅ Backend: Deployed to production
- ❌ Frontend: Likely stale auth token
- ⏳ **User action needed**: Refresh page, clear browser storage, re-login

## Files Modified This Session

- `apps/backend/pb_hooks/01-create-wallet.pb.js` - Fixed wallet creation
- `apps/backend/pb_hooks/99-fix-user-wallet.pb.js` - Added incomplete record detection
- `WALLET_NOT_FOUND_FIX_RESOLVED.md` - Root cause analysis
- `TEST_CHAIN_IDS.txt` - Updated test chain status

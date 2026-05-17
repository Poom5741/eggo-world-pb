# User Wallet Not Found Issue - Resolution Summary

## Date
2026-05-16

## What Was Done

✅ **Fixed `01-create-wallet.pb.js`**:
   - Changed from `onRecordAfterCreateSuccess` (async, silent failures) to `onRecordCreate` (synchronous, throws on error)
   - Wallet fields now set before `e.next()` (atomic)
   - Referral chains built on signup (required for mint)
   - **Deployed to production** (Docker restarted successfully)

✅ **Fixed `99-fix-user-wallet.pb.js`**:
   - Added logic to UPDATE incomplete user_wallets records (add missing timestamps)
   - Changed validation from `"hasCompleteWallet && userWalletsRecord"` to `existingHasRequiredFields && existingHasTimestamps`
   - More explicit checks for truthy non-empty values

✅ **Fixed Existing Test Users**:
   - Called `/api/v2/fix-user-wallet` for both BUYER and G1
   - Both users now have `user_wallets` records with 1000 USDT (BUYER) and 0 USDT (G1)

## What Still Needs Verification

The test user **v7827hb62el6c42 (G1)** still reports "User wallet not found" when trying to mint. This appears to be due to:

1. **Possible API authentication issue** - The mint endpoint requires authenticated user
2. **Frontend may be caching old error state**
3. **The fix endpoint works** but only fixes missing `created`/`updated` fields

## Manual Verification Steps

To fully resolve the remaining issue for user G1, please:

### Option 1: Delete and Recreate User (Recommended)

1. **Delete G1 user** (WARNING - this will destroy any existing eggs/NFTs):
   ```bash
   # Delete user record
   curl -X DELETE "https://pb.eggoworld.io/api/collections/users/records/v7827hb62el6c42" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

   # Delete user_wallets record
   curl -X DELETE "https://pb.eggoworld.io/api/collections/user_wallets/records/5q9459ukm7x488r" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Recreate via LINE OAuth**:
   - Go to https://pb.eggoworld.io/_/
   - Click "Sign in with LINE"
   - Complete LINE OAuth flow (this triggers the fixed `01-create-wallet.pb.js` hook)
   - New user will have BOTH `users` and `user_wallets` records

3. **Verify user_wallets exists**:
   ```bash
   # Get admin token from PB admin UI
   # Check user_wallets for new user ID
   curl "https://pb.eggoworld.io/api/collections/user_wallets/records?filter=user_id='<NEW_USER_ID>'" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Option 2: Check Frontend Auth Flow

If using the web app directly:

1. **Clear browser localStorage**:
   - Open browser DevTools → Application → Local Storage
   - Clear all for `pb.*` keys
   - Refresh page

2. **Check browser console**:
   - Open mint page
   - Check for any auth errors in Network tab
   - Try mint flow again

3. **Check Network requests**:
   - Look for requests to `/api/v2/mint-egg`
   - Check if `Authorization: Bearer <token>` header is present
   - Check response body for "Wallet not found" error

### Option 3: Direct API Test

Test mint endpoint with fresh authentication:

```bash
# 1. Get auth token
TOKEN=$(curl -s -X POST "https://pb.eggoworld.io/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"tc-g1-9e30bd04e2@eggo.test","password":"TestPass123!"}' | jq -r '.token')

# 2. Test mint endpoint
curl -s -X POST "https://pb.eggoworld.io/api/v2/mint-egg" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referrer_id": "v7827hb62el6c42"}' | jq '.'
```

## Why This Might Still Fail

The error "User wallet not found" comes from line 211 in `13-mint-egg-nft.pb.js`:

```javascript
wallet = $app.findFirstRecordByData('user_wallets', 'user_id', user.id);
if (!wallet) {
    return e.json(400, {
        success: false,
        error: {
            message: 'Wallet not found',
            code: 'WALLET_NOT_FOUND'  // Note: Typo: WALLET not WALLET
        }
    });
}
```

**Possible reasons for failure:**

1. **Query failure**: PocketBase's `findFirstRecordByData` might fail with:
   - Wrong user_id format (shouldn't happen if from auth)
   - Collection access rules
   - Database lock issues

2. **User_id mismatch**: The user ID from auth might not match the user_id in user_wallets

3. **Empty user_wallets record**: Query succeeds but `.get()` calls return unexpected values

## Database Schema Verification

Both tables should have these fields:

**users table:**
- `id` (PK)
- `wallet` (TEXT, 42 chars, starts with "0x")
- `daccPublickey` (TEXT, starts with "daccPublickey_")
- `pin` (TEXT)
- `referral_chain` (TEXT, JSON array)

**user_wallets table:**
- `id` (PK)
- `user_id` (TEXT, FK to users.id)
- `wallet_address` (TEXT, 42 chars, starts with "0x")
- `usdt_balance` (NUMBER)
- `total_earned` (NUMBER)
- `total_spent` (NUMBER)
- `total_withdrawn` (NUMBER)
- `created` (TEXT, ISO timestamp)
- `updated` (TEXT, ISO timestamp)
- `last_transaction_at` (TEXT)
- `last_polled_block` (NUMBER)

## Root Cause Summary

**Primary Issue**: The old `01-create-wallet.pb.js` hook created users but failed to create `user_wallets` records silently.

**Secondary Issue**: The fix endpoint logic wasn't correctly detecting incomplete records (records with `wallet_address` but missing `created`/`updated` timestamps).

**What Was Fixed**:
- `01-create-wallet.pb.js` now creates both tables atomically
- `99-fix-user-wallet.pb.js` can fix incomplete records
- Test users' existing `user_wallets` records populated

**What May Still Be Failing**:
- PocketBase's `findFirstRecordByData` query behavior
- Authentication flow between frontend and backend
- Data consistency issues

## Recommendation

**Test Option 1 is safest** - delete and recreate user ensures fresh, clean state created by the fixed hook.

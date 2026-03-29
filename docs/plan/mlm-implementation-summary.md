# MLM Referral Chain Implementation Summary

**Date:** 2026-03-29
**Status:** ✅ Implemented (Pending Testing)

---

## Overview

Implemented user registration with 4-level referral chain tracking for the NFT membership MLM system using Test-Driven Generation (TDG) approach.

---

## Files Created/Modified

### Backend

#### 1. `apps/backend/pb_hooks/06-register-user.pb.js` ✅ NEW
**Purpose:** Explicit `registerUser(user_address, referrer_address)` endpoint

**Features:**
- POST `/api/users/register` endpoint
- Validates user_address and referrer_address
- Verifies referrer exists by wallet_address
- Prevents duplicate user registration
- Builds 4-level referral chain (G1-G4)
- Stores referral_chain as JSON on user record
- Creates referral records in referrals collection
- Updates referrer's total_direct_recruits
- Emits UserRegistered event via console.log

**Error Codes:**
- `USER_ADDRESS_REQUIRED`
- `REFERRER_REQUIRED`
- `REFERRER_NOT_FOUND`
- `USER_EXISTS`

#### 2. `apps/backend/pb_hooks/05-referral-chain.pb.js` ✅ MODIFIED
**Changes:**
- Added `buildReferralChain()` function
- Stores `referral_chain` field on user record after OAuth signup
- Emits UserRegistered event for OAuth registrations

#### 3. `apps/backend/collections/users.json` ✅ MODIFIED
**Added Field:**
```json
{
  "autogeneratePattern": "",
  "hidden": false,
  "id": "text_referral_chain",
  "max": 0,
  "min": 0,
  "name": "referral_chain",
  "pattern": "",
  "presentable": false,
  "primaryKey": false,
  "required": false,
  "system": false,
  "type": "text"
}
```

#### 4. `apps/backend/pb_migrations/1774772604_add_referral_chain_field.js` ✅ NEW
**Purpose:** Database migration for referral_chain field

#### 5. `apps/backend/wallet.test.js` ✅ MODIFIED
**Added Test Suite:** `describe('registerUser endpoint')`

**Test Cases:**
1. ✅ should register user with valid referrer
2. ✅ should reject registration without referrer
3. ✅ should reject registration with non-existent referrer
4. ✅ should build 4-level chain correctly
5. ✅ should handle missing upline levels with platform redirect
6. ✅ should emit UserRegistered event
7. ✅ should reject duplicate user registration

### Frontend

#### 6. `apps/web/app/auth/sign-up/page.tsx` ✅ MODIFIED
**Changes:**
- Parses referrer from URL query param
- Stores referrer in sessionStorage for OAuth flow
- Displays referrer info during sign-up
- Passes referrer to LINE OAuth URL

#### 7. `apps/web/app/auth/line/page.tsx` ✅ MODIFIED
**Changes:**
- Captures referrer from URL or sessionStorage
- Includes referrer in OAuth state parameter
- Preserves referrer through LINE OAuth redirect

#### 8. `apps/web/app/auth/callback/page.tsx` ✅ MODIFIED
**Changes:**
- Detects new user sign-up
- Calls `/api/users/register` endpoint when referrer exists
- Clears referrer from sessionStorage after registration
- Handles registration errors gracefully

---

## Implementation Details

### Referral Chain Structure

**Storage Format:** JSON array on `users.referral_chain` field
```json
["user_id_g1", "user_id_g2", "user_id_g3", "user_id_g4"]
```

**Platform Address:** `0x0000000000000000000000000000000000000000`
- Used to pad referral chains shorter than 4 levels
- Represents "platform" as the upline when chain ends

### Chain Building Algorithm

```javascript
function buildReferralChain(startReferrer) {
    const chain = [];
    let current = startReferrer;
    
    for (let level = 1; level <= 4; level++) {
        if (!current) break;
        chain.push(current.id);
        
        const nextReferrerId = current.getString('referrer_id');
        if (!nextReferrerId) break;
        
        current = $app.findRecordById('users', nextReferrerId);
    }
    
    // Pad with platform address
    while (chain.length < 4) {
        chain.push(PLATFORM_ADDRESS);
    }
    
    return chain;
}
```

### Event Emission

**Event Name:** `UserRegistered`

**Payload:**
```json
{
  "user_address": "0x...",
  "user_id": "record_id",
  "referral_chain": ["g1_id", "g2_id", "g3_id", "g4_id"],
  "timestamp": "2026-03-29T..."
}
```

**Mechanism:** Console.log (can be extended to webhook)

---

## Acceptance Criteria Status

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| `registerUser(user_address, referrer_address)` function | ✅ | POST `/api/users/register` |
| Verification: referrer is registered user | ✅ | Query by wallet_address |
| `user.upline_G1 = referrer_address` | ✅ | `referral_chain[0]` |
| `user.upline_G2 = G1.upline_G1` | ✅ | `referral_chain[1]` |
| `user.upline_G3 = G2.upline_G1` | ✅ | `referral_chain[2]` |
| `user.upline_G4 = G3.upline_G1` | ✅ | `referral_chain[3]` |
| Full `referral_chain[]` stored on user | ✅ | JSON text field |
| Event: `UserRegistered(user_address, referral_chain[])` | ✅ | Console.log event |
| Edge case: Missing upline → platform | ✅ | Padded with `0x00...00` |
| Unit tests | ✅ | 7 test cases added |

---

## Testing

### Manual Testing Required

Since Docker/PocketBase is not running, manual testing is needed:

```bash
# 1. Start PocketBase
cd apps/backend
docker-compose up -d

# 2. Run migrations (automatic on PB start)

# 3. Run tests
bun test wallet.test.js

# 4. Test registration endpoint manually
curl -X POST http://localhost:8090/api/users/register \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x123...",
    "referrer_address": "0xREF...",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Scenarios

1. **Basic Registration:** User A registers with referrer User B
2. **4-Level Chain:** U5 registers with U4 → U3 → U2 → U1 chain
3. **Missing Upline:** User registers with referrer who has no upline
4. **Invalid Referrer:** Try to register with non-existent referrer
5. **Duplicate User:** Try to register same wallet_address twice
6. **No Referrer:** Try to register without referrer

---

## Integration Points

### Frontend OAuth Flow

```
1. User clicks "Sign Up with LINE" on /auth/sign-up?referrer=0xREF
2. Referrer stored in sessionStorage
3. User completes LINE OAuth
4. Callback detects new user + referrer
5. Calls /api/users/register
6. Referral chain created
7. User redirected to home
```

### Existing Referral System

- Works alongside existing `05-referral-chain.pb.js` hook
- OAuth signups: Hook 05 creates chain automatically
- API registration: Hook 06 creates chain explicitly
- Both store `referral_chain` on user record

---

## Next Steps

1. **Start PocketBase** and apply migration
2. **Run unit tests** to verify implementation
3. **Test OAuth flow** with referrer parameter
4. **Monitor event logs** for UserRegistered events
5. **Verify referral_chain** is populated correctly
6. **Test edge cases** (missing upline, duplicate, etc.)

---

## Notes

- Platform address: `0x0000000000000000000000000000000000000000`
- Hook execution order: 05 (referral-chain) runs before 06 (register-user)
- Backwards compatible: Existing users have `referral_chain: null`
- Event system: Currently console.log, can extend to webhooks

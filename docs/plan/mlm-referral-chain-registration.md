# MLM Referral Chain Registration - Implementation Plan

**Created:** 2026-03-29
**Status:** Pending Review

---

## Overview

Implement user registration with 4-level referral chain tracking for the NFT membership MLM system. The system currently has basic referral infrastructure (users.referrer_id field, referrals collection, and hook 05) but needs enhancement to meet the MLM requirements.

## Current State Analysis

**Existing Infrastructure:**
- ✅ `users.referrer_id` relation field exists
- ✅ `referrals` collection with level tracking (G1-G4)
- ✅ Hook `05-referral-chain.pb.js` auto-creates referral relationships
- ✅ `users.total_direct_recruits` field for tracking

**Gaps to Address:**
- ❌ No explicit `registerUser()` endpoint function
- ❌ No referral_chain[] array stored on user record
- ❌ No UserRegistered event emission
- ❌ No explicit verification that referrer is registered
- ❌ Frontend sign-up flow doesn't capture referrer info
- ❌ LINE OAuth flow doesn't pass referrer parameter

---

## Implementation Steps

### Phase 1: Backend - Registration Endpoint & Chain Storage

#### 1.1 Create Registration Endpoint Hook (`06-register-user.pb.js`)
**Location:** `apps/backend/pb_hooks/06-register-user.pb.js`

**Purpose:** Explicit `registerUser(user_address, referrer_address)` function with validation

**Implementation:**
```javascript
routerAdd('POST', '/api/users/register', (e) => {
    const { user_address, referrer_address, email, password, name } = e.parseBody();
    
    // Validation
    if (!user_address) {
        return e.json(400, { 
            success: false, 
            error: { message: "User address required", code: "USER_ADDRESS_REQUIRED" } 
        });
    }
    
    if (!referrer_address) {
        return e.json(400, { 
            success: false, 
            error: { message: "Referrer required", code: "REFERRER_REQUIRED" } 
        });
    }
    
    // Verify referrer exists by wallet_address
    const referrerRecords = $app.findRecordsByFilter(
        'users',
        `wallet_address = "${referrer_address}"`,
        '',
        1
    );
    
    if (!referrerRecords || referrerRecords.length === 0) {
        return e.json(404, { 
            success: false, 
            error: { message: "Referrer not found", code: "REFERRER_NOT_FOUND" } 
        });
    }
    
    const referrer = referrerRecords[0];
    
    // Check if user already exists
    const existingUsers = $app.findRecordsByFilter(
        'users',
        `wallet_address = "${user_address}"`,
        '',
        1
    );
    
    if (existingUsers && existingUsers.length > 0) {
        return e.json(409, { 
            success: false, 
            error: { message: "User already registered", code: "USER_EXISTS" } 
        });
    }
    
    // Create user record
    const userCollection = $app.findCollectionByNameOrId('users');
    const user = new Record(userCollection);
    user.set('wallet_address', user_address);
    user.set('email', email || `${user_address}@user.local`);
    user.set('password', password || generateRandomPassword());
    user.set('name', name || `User_${user_address.substring(2, 8)}`);
    user.set('referrer_id', referrer.id);
    
    // Build 4-level referral chain
    const referralChain = buildReferralChain(referrer);
    user.set('referral_chain', JSON.stringify(referralChain));
    
    // Store upline references (optional denormalization)
    if (referralChain[0]) user.set('upline_G1', referralChain[0]);
    if (referralChain[1]) user.set('upline_G2', referralChain[1]);
    if (referralChain[2]) user.set('upline_G3', referralChain[2]);
    if (referralChain[3]) user.set('upline_G4', referralChain[3]);
    
    $app.save(user);
    
    // Create referral records in referrals collection
    createReferralRecords(referrer.id, user.id, referralChain);
    
    // Update referrer's direct recruit count
    const currentCount = referrer.getNumber('total_direct_recruits') || 0;
    referrer.set('total_direct_recruits', currentCount + 1);
    $app.save(referrer);
    
    // Emit UserRegistered event (via webhook or log)
    emitUserRegisteredEvent(user, referralChain);
    
    return e.json(201, {
        success: true,
        data: {
            user_id: user.id,
            wallet_address: user_address,
            referral_chain: referralChain
        }
    });
});

function buildReferralChain(startReferrer) {
    const chain = [];
    let current = startReferrer;
    
    for (let level = 1; level <= 4; level++) {
        if (!current) break;
        
        chain.push(current.id);
        
        // Get next level referrer
        const nextReferrerId = current.getString('referrer_id');
        if (!nextReferrerId) break;
        
        try {
            current = $app.findRecordById('users', nextReferrerId);
        } catch (err) {
            break;
        }
    }
    
    // Pad with platform address if chain < 4
    const PLATFORM_ADDRESS = '0x0000000000000000000000000000000000000000';
    while (chain.length < 4) {
        chain.push(PLATFORM_ADDRESS);
    }
    
    return chain;
}

function createReferralRecords(referrerId, userId, chain) {
    const referralCollection = $app.findCollectionByNameOrId('referrals');
    
    chain.forEach((uplineId, index) => {
        if (uplineId === '0x0000000000000000000000000000000000000000') return;
        
        const record = new Record(referralCollection);
        record.set('referrer_id', uplineId);
        record.set('referee_id', userId);
        record.set('level', index + 1);
        $app.save(record);
    });
}

function emitUserRegisteredEvent(user, referralChain) {
    // Log event for external monitoring
    console.log('EVENT:UserRegistered', JSON.stringify({
        user_address: user.getString('wallet_address'),
        user_id: user.id,
        referral_chain: referralChain,
        timestamp: new Date().toISOString()
    }));
}
```

**Error Codes:**
- `USER_ADDRESS_REQUIRED`
- `REFERRER_REQUIRED`
- `REFERRER_NOT_FOUND`
- `USER_EXISTS`

#### 1.2 Extend Users Collection Schema
**Location:** `apps/backend/collections/users.json`

**Add Fields:**
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

Store as JSON array: `["user_id_g1", "user_id_g2", "user_id_g3", "user_id_g4"]`

**Optional Denormalization Fields:**
```json
{
  "cascadeDelete": false,
  "collectionId": "_pb_users_auth_",
  "hidden": false,
  "id": "relation_upline_g1",
  "maxSelect": 1,
  "name": "upline_G1",
  "required": false,
  "type": "relation"
}
// Repeat for upline_G2, upline_G3, upline_G4
```

#### 1.3 Update Existing Hook 05
**Location:** `apps/backend/pb_hooks/05-referral-chain.pb.js`

**Modification:** Update to populate `referral_chain` field when user creates via OAuth

```javascript
// After chain creation, add:
const referralChain = buildReferralChain(e.record);
e.record.set('referral_chain', JSON.stringify(referralChain));
$app.save(e.record);

// Emit event
emitUserRegisteredEvent(e.record, referralChain);
```

---

### Phase 2: Frontend - Registration Flow

#### 2.1 Update Sign-Up Page
**Location:** `apps/web/app/auth/sign-up/page.tsx`

**Changes:**
- Add referrer input field (optional for first user)
- Pass referrer info via URL query param: `/auth/sign-up?referrer=<wallet_address>`
- Store referrer in localStorage/sessionStorage during OAuth flow

```typescript
// Parse referrer from URL
const searchParams = useSearchParams()
const referrer = searchParams.get('referrer')

// Pass to LINE OAuth URL as state parameter
const stateData = {
  random: generateRandomString(16),
  returnUrl: returnUrl,
  referrer: referrer  // Add referrer
}
```

#### 2.2 Update LINE OAuth Flow
**Location:** `apps/web/app/auth/line/page.tsx`

**Changes:**
- Preserve referrer through OAuth redirect
- Pass referrer to callback page

#### 2.3 Update OAuth Callback
**Location:** `apps/web/app/auth/callback/page.tsx`

**Changes:**
- After OAuth success, check if user has referrer
- If new user with referrer, call registration endpoint
- Handle registration errors gracefully

```typescript
// After successful OAuth
if (isNewUser && referrerAddress) {
  const registrationResponse = await fetch(`${pb.baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      user_address: authData.record.wallet_address,
      referrer_address: referrerAddress,
      email: authData.record.email,
      name: authData.record.name
    })
  })
  
  if (!registrationResponse.ok) {
    // Handle error
  }
}
```

---

### Phase 3: Testing

#### 3.1 Unit Tests
**Location:** `apps/backend/wallet.test.js`

**Test Cases:**

```javascript
describe('registerUser endpoint', () => {
  it('should register user with valid referrer', async () => {
    const referrer = await createTestUser('referrer@test.com');
    const result = await registerUser('0x123...', referrer.wallet_address);
    
    expect(result.success).toBe(true);
    expect(result.data.referral_chain[0]).toBe(referrer.id);
  });
  
  it('should reject registration without referrer', async () => {
    const result = await registerUser('0x123...', null);
    
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('REFERRER_REQUIRED');
  });
  
  it('should reject registration with non-existent referrer', async () => {
    const result = await registerUser('0x123...', '0xNONEXISTENT');
    
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('REFERRER_NOT_FOUND');
  });
  
  it('should build 4-level chain correctly', async () => {
    const G4 = await createTestUser('g4@test.com');
    const G3 = await createTestUser('g3@test.com', G4.wallet_address);
    const G2 = await createTestUser('g2@test.com', G3.wallet_address);
    const G1 = await createTestUser('g1@test.com', G2.wallet_address);
    const user = await registerUser('0xUSER', G1.wallet_address);
    
    expect(user.data.referral_chain).toEqual([G1.id, G2.id, G3.id, G4.id]);
  });
  
  it('should handle missing upline levels with platform redirect', async () => {
    const G1 = await createTestUser('g1@test.com');
    const user = await registerUser('0xUSER', G1.wallet_address);
    
    // G1 has no upline, so G2-G4 should be platform
    expect(user.data.referral_chain[0]).toBe(G1.id);
    expect(user.data.referral_chain[1]).toBe(PLATFORM_ADDRESS);
    expect(user.data.referral_chain[2]).toBe(PLATFORM_ADDRESS);
    expect(user.data.referral_chain[3]).toBe(PLATFORM_ADDRESS);
  });
  
  it('should emit UserRegistered event', async () => {
    // Mock console.log to capture event emission
    const consoleSpy = jest.spyOn(console, 'log');
    
    await registerUser('0xUSER', referrer.wallet_address);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('EVENT:UserRegistered'),
      expect.any(String)
    );
  });
});
```

---

## Acceptance Criteria Checklist

- [ ] `registerUser(user_address, referrer_address)` function implemented (as POST endpoint)
- [ ] Verification: `referrer_address` is a registered user
- [ ] `user.upline_G1 = referrer_address` (stored in referral_chain[0])
- [ ] `user.upline_G2 = G1.upline_G1` (lookup, stored in referral_chain[1])
- [ ] `user.upline_G3 = G2.upline_G1` (lookup, stored in referral_chain[2])
- [ ] `user.upline_G4 = G3.upline_G1` (lookup, stored in referral_chain[3])
- [ ] Full `referral_chain[G1, G2, G3, G4]` stored on user record
- [ ] Event emitted: `UserRegistered(user_address, referral_chain[])`
- [ ] Edge case handling: Missing upline levels redirect to platform address
- [ ] Unit tests: Registration chain, missing upline handling

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/backend/pb_hooks/06-register-user.pb.js` | Create | Registration endpoint |
| `apps/backend/collections/users.json` | Modify | Add referral_chain field |
| `apps/backend/pb_hooks/05-referral-chain.pb.js` | Modify | Populate referral_chain, emit event |
| `apps/web/app/auth/sign-up/page.tsx` | Modify | Add referrer input |
| `apps/web/app/auth/line/page.tsx` | Modify | Pass referrer through OAuth |
| `apps/web/app/auth/callback/page.tsx` | Modify | Call registration endpoint |
| `apps/backend/wallet.test.js` | Modify | Add unit tests |
| `apps/backend/pb_migrations/<timestamp>_add_referral_chain_field.js` | Create | Migration |

---

## Notes

1. **Platform Address:** Use `0x0000000000000000000000000000000000000000` for missing upline levels

2. **Event Emission:** PocketBase doesn't have native event system - use console.log for monitoring or integrate with webhook service

3. **Backwards Compatibility:** Existing users without referrer_id will have `referral_chain: null` - handle gracefully

4. **Security:** Always require auth in registration endpoint to prevent spam

5. **Performance:** Consider caching upline lookups for deep chains

---

## Dependencies

- PocketBase running with hooks enabled
- Users collection with wallet_address field
- Referrals collection already exists
- Hook execution order: 05 (referral-chain) before 06 (register-user)

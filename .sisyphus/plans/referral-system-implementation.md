# Referral System Implementation Plan

## Overview
Implement referral code system for LINE OAuth-only authentication in EggoWorld NFT membership system.

## Current State
- LINE OAuth-only authentication (no email/password)
- Backend has `referrer_id` and `referral_chain` fields
- Hook 01 (create wallet) and Hook 06 (create referral chain) already exist
- Frontend has referral input UI but not connected

## Target State
- User enters referral code on /join page
- Code saved to sessionStorage before OAuth
- Backend endpoint applies referral after OAuth
- Hook 06 creates 4-level referral chain automatically

---

## Wave 1: Parallel Development (No Dependencies)

### Task 1.1: Create Backend Referral Endpoint
**Agent Type**: `task(category='quick')` or manual implementation
**File**: `apps/backend/pb_hooks/21-apply-referral.pb.js`
**Effort**: 2 hours
**Priority**: High

**What to Implement**:
```javascript
// New endpoint: POST /api/referrals/apply
// - Validate referral code (wallet address)
// - Set referrer_id on user record
// - Trigger Hook 06 automatically
// - Return success/error responses
```

**Key Logic**:
1. Extract `referral_code` and `user_id` from request body
2. Validate user is authenticated
3. Check user doesn't already have referrer
4. Find referrer by wallet address
5. Prevent self-referral
6. Set `user.referrer_id = referrer.id`
7. Save user record
8. Hook 06 fires automatically creating chain

**Acceptance Criteria**:
- [ ] Endpoint accepts POST requests at `/api/referrals/apply`
- [ ] Returns 200 with referrer data on success
- [ ] Returns 400 for missing code
- [ ] Returns 400 for self-referral
- [ ] Returns 404 for invalid code
- [ ] Returns 400 if user already referred
- [ ] Returns 403 for user ID mismatch
- [ ] Hook 06 triggers after referrer_id set

---

### Task 2.1: Connect Referral Input on /join Page
**Agent Type**: `task(category='quick')` or manual implementation
**File**: `apps/web/app/join/page.tsx`
**Effort**: 1 hour
**Priority**: High

**What to Implement**:
```typescript
// Add React state for referral code
// Save to sessionStorage before OAuth redirect
// Pass to initiateLineLogin()
```

**Key Changes**:
1. Add `useState` for referral code
2. Add `onChange` handler to referral input
3. Update `handleLINELogin` function:
   - Check if referral code exists
   - Save to `sessionStorage.setItem('pending_referral_code', code)`
   - Call `initiateLineLogin()`

**Code Structure**:
```typescript
export default function Join() {
  const [referralCode, setReferralCode] = useState('')
  
  const handleLINELogin = () => {
    if (referralCode.trim()) {
      sessionStorage.setItem('pending_referral_code', referralCode.trim())
    }
    window.location.href = '/auth/line'
  }
  
  return (
    // ... existing JSX ...
    <input 
      value={referralCode}
      onChange={(e) => setReferralCode(e.target.value)}
      // ... rest of props
    />
    <button onClick={handleLINELogin}>
      Login with LINE
    </button>
  )
}
```

**Acceptance Criteria**:
- [ ] Input field has controlled state
- [ ] Referral code saved to sessionStorage
- [ ] Code persists through OAuth redirect
- [ ] Empty code handled gracefully

---

## Wave 2: Integration (After Wave 1 Complete)

### Task 2.2: Apply Referral After OAuth Callback
**Agent Type**: `task(category='quick')`
**File**: `apps/web/app/auth/line/page.tsx`
**Effort**: 2 hours
**Priority**: High
**Dependencies**: Task 1.1, Task 2.1

**What to Implement**:
```typescript
// After LINE OAuth successful authentication
// 1. Retrieve referral code from sessionStorage
// 2. Call /api/referrals/apply endpoint
// 3. Handle success/error
// 4. Clear sessionStorage
// 5. Redirect to dashboard
```

**Integration Point**:
- After `authWithPassword` succeeds (around line 44-52 in current file)
- Before redirect to `/dashboard`

**Code Structure**:
```typescript
const authenticate = async () => {
  // ... existing auth logic ...
  
  // AFTER successful auth
  const pendingReferralCode = sessionStorage.getItem('pending_referral_code')
  
  if (pendingReferralCode && authData.record) {
    try {
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token
        },
        body: JSON.stringify({
          referral_code: pendingReferralCode,
          user_id: authData.record.id
        })
      })
      
      const result = await response.json()
      console.log('Referral result:', result)
      
      // Clear from sessionStorage
      sessionStorage.removeItem('pending_referral_code')
    } catch (error) {
      console.error('Failed to apply referral:', error)
      // Continue to dashboard even if referral fails
    }
  }
  
  // Redirect to dashboard
  window.location.href = redirectTo
}
```

**Acceptance Criteria**:
- [ ] Referral code retrieved from sessionStorage
- [ ] POST to `/api/referrals/apply` with auth token
- [ ] Success: Show toast notification
- [ ] Failure: Show error, don't block navigation
- [ ] sessionStorage cleared after processing

---

## Wave 3: Testing & Security

### Task 3.1: End-to-End Testing
**Agent Type**: Manual QA
**Effort**: 1 hour
**Priority**: Medium
**Dependencies**: Task 2.2

**Test Scenarios**:

**Scenario 1: New User with Valid Referral**
1. User A exists with wallet `0x1234...`
2. User B visits /join?ref=0x1234...
3. User B enters referral code, clicks LINE Login
4. Completes LINE OAuth
5. ✅ Backend: `referrer_id` set to User A
6. ✅ Backend: Hook 06 creates G1-G4 chain
7. ✅ Backend: User A's `total_direct_recruits` incremented

**Scenario 2: New User without Referral**
1. User C visits /join
2. Leaves referral code empty
3. Clicks LINE Login
4. Completes LINE OAuth
5. ✅ User record created without `referrer_id`
6. ✅ No referral chain created
7. ✅ User can still use platform normally

**Scenario 3: Invalid Referral Code**
1. User D enters fake code: "FAKE123"
2. Clicks LINE Login
3. Completes LINE OAuth
4. Backend returns 404 error
5. ✅ User created but no referral applied
6. ✅ Error message shown to user

**Scenario 4: Self-Referral Blocked**
1. User E tries to refer themselves
2. Enter their own wallet address
3. Backend returns 400 error
4. ✅ Self-referral prevented

**Scenario 5: Duplicate Referral Prevention**
1. User F already has referrer
2. Tries to apply another referral code
3. Backend returns 400 error
4. ✅ Original referral preserved

---

### Task 3.2: Security Review
**Agent Type**: `task(subagent_type='oracle')` or manual
**Effort**: 1 hour
**Priority**: Medium
**Dependencies**: Task 2.2

**Security Checks**:

**Rate Limiting**:
```javascript
// Add to 21-apply-referral.pb.js
// Limit to 5 attempts per IP per hour
const rateLimitKey = `rate_limit_${e.request.ip}`
const attempts = $app.store().get(rateLimitKey) || 0
if (attempts >= 5) {
  return e.json(429, { error: { message: "Too many attempts", code: "RATE_LIMITED" }})
}
$app.store().set(rateLimitKey, attempts + 1, 3600) // 1 hour TTL
```

**Input Validation**:
- [ ] Referral code sanitized (trim, lowercase)
- [ ] Max length validation
- [ ] Pattern validation (wallet address format)

**Authorization**:
- [ ] User can only apply referral to themselves
- [ ] Auth token required
- [ ] User ID matches authenticated user

**Edge Cases**:
- [ ] Handle deleted referrer
- [ ] Handle referrer with no wallet
- [ ] Handle concurrent requests

---

## Execution Commands

### Start Implementation:

**Backend (Task 1.1)**:
```bash
# Create new hook file
touch apps/backend/pb_hooks/21-apply-referral.pb.js

# Add content from plan above
# Restart PocketBase to load hook
cd apps/backend && docker-compose restart
```

**Frontend (Task 2.1)**:
```bash
# Modify /join page
# Add React state and sessionStorage logic
```

**Integration (Task 2.2)**:
```bash
# Modify /auth/line page
# Add fetch call to /api/referrals/apply
```

**Testing**:
```bash
# Test scenarios
# Verify in PocketBase Admin UI
# Check referral records created
```

---

## Success Criteria

- [ ] User can enter referral code on /join
- [ ] Code persists through LINE OAuth
- [ ] Referral applied after OAuth success
- [ ] Hook 06 creates 4-level chain
- [ ] All 5 test scenarios pass
- [ ] Security measures in place
- [ ] No console errors
- [ ] Build succeeds

---

## Files to Modify/Created

**New Files**:
- `apps/backend/pb_hooks/21-apply-referral.pb.js`

**Modified Files**:
- `apps/web/app/join/page.tsx`
- `apps/web/app/auth/line/page.tsx`

**No Changes Required**:
- `apps/backend/pb_hooks/01-create-wallet.pb.js` (already works)
- `apps/backend/pb_hooks/06-referral-chain.pb.js` (already works)
- `apps/backend/collections/users.json` (fields already exist)

---

## Notes

- Hook 06 triggers on `onRecordAfterCreateSuccess` AND `onRecordAfterUpdateSuccess`
- Setting `referrer_id` on existing user triggers Hook 06
- No need to modify existing hooks - they work as-is
- sessionStorage is same-origin only (secure)
- Rate limiting prevents brute force attacks

---

**Ready to start implementation?** Use the commands above or delegate to appropriate agents.

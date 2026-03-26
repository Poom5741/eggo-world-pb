# LINE OAuth Production Setup Plan

## Executive Summary
Complete production-ready setup for LINE OAuth with PocketBase, including wallet auto-creation, simple frontend, and proper error handling.

## Current State Analysis

### ✅ What's Working:
- PocketBase Docker container running
- Nginx reverse proxy configured
- Admin user created (admin@eggo.local / admin123)
- LINE credentials available (Channel ID: 2009441873)
- Wallet creation hook exists

### ❌ Critical Issues to Fix:
1. **OAuth field mapping broken** - Uses `id` instead of `sub`
2. **Missing redirect URL** in generated auth URLs
3. **No simple frontend page** for testing
4. **Docker environment variables** not properly configured

---

## Phase 1: Fix PocketBase OAuth Configuration

### 1.1 Update OAuth Field Mapping
**Problem:** LINE returns `sub` for user ID, not `id`
**Current mapping:** `id → externalId` (fails validation)
**Fix:** Change to `sub → externalId`

**Changes needed:**
```json
{
  "oauth2": {
    "mappedFields": {
      "sub": "externalId",
      "name": "name",
      "picture": "avatar",
      "email": "email"
    }
  }
}
```

### 1.2 Add Redirect URL to OAuth Config
**Problem:** Auth URLs generated without `redirect_uri` parameter
**Fix:** Add `redirectURL` field to OAuth provider config

**Value:** `https://pb.eggoworld.io/api/oauth2-redirect`

---

## Phase 2: Docker Configuration Updates

### 2.1 Update docker-compose.yml
Add production environment variables:

```yaml
environment:
  ENCRYPTION: 4nWpfKByg2u3tkbbHAZ34div
  LINE_CHANNEL_ID: 2009441873
  LINE_CHANNEL_SECRET: 4ede94afa7d59b71ffda15a136ffddea
  LINE_CALLBACK_URL: https://pb.eggoworld.io/api/oauth2-redirect
  APP_URL: https://pb.eggoworld.io
  NODE_ENV: production
```

---

## Phase 3: Create Simple Frontend Page

### 3.1 File: pb_public/line-login.html
Simple HTML page with:
- "Login with LINE" button
- OAuth flow handling
- User info display
- Wallet address display (auto-generated)

### 3.2 Features
- Uses PocketBase JS SDK
- PKCE flow (automatic)
- Error handling
- Clean UI

---

## Phase 4: LINE Console Configuration

### 4.1 Required Settings
**Callback URL:** `https://pb.eggoworld.io/api/oauth2-redirect`

**Scopes:**
- `openid` (required)
- `profile` (for name, picture)
- `email` (requires LINE approval)

---

## Phase 5: Testing Plan

1. Visit login page
2. Click LINE button
3. Authorize on LINE
4. Redirect back to success page
5. Verify:
   - User created
   - Profile data populated
   - Wallet auto-generated
   - Logs show wallet hook execution

---

## Implementation Order

1. Fix OAuth field mapping (10 min)
2. Update docker-compose (5 min)
3. Create frontend pages (30 min)
4. Configure LINE Console (5 min)
5. Test end-to-end (15 min)

**Total: ~65 minutes**

---

## Success Criteria

- ✅ LINE OAuth flow works end-to-end
- ✅ User record created with LINE data
- ✅ Wallet auto-generated on user creation
- ✅ Works on production domain
- ✅ Error handling works

Ready to proceed?
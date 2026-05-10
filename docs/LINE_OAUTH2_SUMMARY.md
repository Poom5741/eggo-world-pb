# LINE OAuth2 Implementation Summary

## ✅ What Was Done

I've successfully migrated your LINE OAuth implementation to use **PocketBase's native OAuth2** with the **PocketBase JS SDK's `authWithOAuth2()` method**.

### How It Works Now

When a user clicks "Login with LINE":

1. **Frontend calls**: `pb.collection('users').authWithOAuth2({ provider: 'oidc' })`
2. **SDK opens a popup** with LINE's authentication page
3. **User logs in** with their LINE account
4. **LINE redirects** back to PocketBase's `/api/oauth2-redirect` endpoint
5. **PocketBase handles** the token exchange automatically
6. **PocketBase creates/updates** the user in the database
7. **Wallet creation hook** (`01-create-wallet.pb.js`) runs automatically
8. **SDK receives** the auth data and closes the popup
9. **Frontend gets** the auth token and user record
10. **Referral system** is applied (if new user)
11. **User is redirected** to the dashboard

### Files Modified

#### Frontend (apps/web)

1. **`lib/auth/line-oauth.ts`** ✅
   - Now uses `pb.collection('users').authWithOAuth2({ provider: 'oidc' })`
   - Handles the complete OAuth2 flow with popup
   - Manages referral application after successful login
   - Returns to dashboard automatically

2. **`app/auth/login/page.tsx`** ✅
   - Updated to call async `initiateLineLogin()`
   - Added error handling

3. **`app/auth/sign-up/page.tsx`** ✅
   - Updated to call async `initiateLineLogin()`
   - Added error handling

4. **`app/join/page.tsx`** ✅
   - Updated to call async `initiateLineLogin()`
   - Added error handling

#### Backend (apps/backend)

5. **`pb_public/line-login.html`** ✅
   - Demo page now uses `pb.collection('users').authWithOAuth2()`
   - Shows user info after successful login
   - Simplified - removed custom OAuth logic

6. **`pb_hooks/05-auth-token.pb.js`** ✅
   - Deprecated all custom endpoints
   - Kept as reference only

### What You Need to Configure

#### 1. PocketBase Admin UI

Go to your PocketBase admin panel and configure the OAuth2 provider:

**Local Development:**
- URL: `http://localhost:8090/_/`
- Navigate to: Settings → Collections → users → OAuth2 tab
- Edit the `oidc` provider

**Production:**
- URL: `https://pb.eggoworld.io/_/`
- Same navigation path

**Configuration:**

| Field | Value |
|-------|-------|
| Client ID | `2009441873` |
| Client Secret | `4ede94afa7d59b71ffda15a136ffddea` |
| Auth URL | `https://access.line.me/oauth2/v2.1/authorize` |
| Token URL | `https://api.line.me/oauth2/v2.1/token` |
| User Info URL | *(leave empty)* |
| Display Name | `Line` |

**Field Mapping:**
- `sub` → `externalId`
- `name` → `name`
- `picture` → `avatarURL`
- `email` → `email`

**Redirect URL:**
```
http://localhost:8090/api/oauth2-redirect  (for local)
https://pb.eggoworld.io/api/oauth2-redirect  (for production)
```

#### 2. LINE Developers Console

Add the callback URL to your LINE channel:

1. Go to: https://developers.line.biz/console/
2. Select your channel (ID: 2009441873)
3. Click "LINE Login" tab
4. Add callback URL:
   ```
   https://pb.eggoworld.io/api/oauth2-redirect
   ```
5. Save

### Testing

#### Local Testing

```bash
# Start PocketBase
cd apps/backend
docker-compose up -d

# Start frontend
cd apps/web
bun dev
```

Visit: http://localhost:3000/auth/login
Click "Login with LINE"
A popup will open with LINE authentication
After login, you'll be redirected to the dashboard

#### Backend Demo Page

Visit: http://localhost:8090/line-login.html
Click "Login with LINE"
Same popup flow will work

### Code Example

```typescript
// This is all you need now!
import { createClient } from '@/lib/pocketbase/client'

async function loginWithLine() {
  const pb = createClient()
  
  const authData = await pb.collection('users').authWithOAuth2({
    provider: 'oidc',
  })
  
  console.log('User ID:', authData.record.id)
  console.log('Token:', authData.token)
  console.log('Is new user:', authData.meta?.isNewUser)
  
  // User is automatically authenticated
  // pb.authStore.isValid = true
  // pb.authStore.token = authData.token
  // pb.authStore.record = authData.record
}
```

### Benefits

✅ **Much simpler code** - Removed ~300 lines of custom OAuth logic  
✅ **Better security** - Client secret stays on PocketBase server  
✅ **Better UX** - Popup-based flow keeps users on your app  
✅ **Automatic everything** - User creation, wallet creation, token exchange  
✅ **SDK managed** - Uses official PocketBase JS SDK  
✅ **Works everywhere** - Same code for local and production  

### Old Files (Can Delete After Testing)

These are no longer needed:
- `apps/backend/pb_public/line-callback.html`
- `apps/web/app/auth/line/page.tsx`
- `apps/backend/pb_hooks/05-auth-token.pb.js`

### Troubleshooting

**Popup blocked?**
- Make sure the login button click handler is NOT async/await before calling `authWithOAuth2()`
- Safari is strict about popups - user must directly click the button

**"Invalid redirect_uri" from LINE?**
- Verify the redirect URL in LINE Console matches exactly
- No trailing slash, must be HTTPS for production

**OAuth2 provider not found?**
- Check provider name is `oidc` in PocketBase Admin UI
- Verify the provider is enabled

**Wallet not created?**
- Check hook `01-create-wallet.pb.js` is loaded
- Verify PocketBase logs for hook execution

---

**Date:** May 9, 2026  
**Status:** ✅ Complete - Ready for testing  
**Next Step:** Configure OAuth2 provider in PocketBase Admin UI

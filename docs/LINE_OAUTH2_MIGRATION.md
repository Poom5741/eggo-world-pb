# LINE OAuth Migration to PocketBase Native OAuth2

## Overview

This document describes the migration from custom LINE OAuth implementation to PocketBase's native OAuth2 provider.

### What Changed

**Before (Custom Implementation):**
- Custom LINE OAuth flow with manual token exchange
- Custom endpoints: `/api/auth/line-exchange`, `/api/auth/line-auth`, `/api/auth/line-user`
- Custom callback handler: `line-callback.html`
- Manual user creation and password generation
- Complex multi-step authentication flow

**After (PocketBase Native OAuth2):**
- PocketBase handles entire OAuth2 flow automatically
- No custom endpoints needed
- Uses built-in `/api/collections/users/auth-with-oauth2` endpoint
- Simpler, more secure, and maintainable

## Files Modified

### Frontend (apps/web)

1. **`lib/auth/line-oauth.ts`** ✅ Updated
   - Now redirects to PocketBase OAuth2 endpoint
   - Removed direct LINE OAuth URL construction
   - Simplified to use `pb.collection('users').authWithOAuth2()`

2. **`app/auth/callback/page.tsx`** ✅ Updated
   - Simplified to use PocketBase native OAuth2 authentication
   - Removed legacy email/password flow
   - Removed token-based auth from line-callback.html
   - Now uses `pb.collection('users').authWithOAuth2()` directly

### Backend (apps/backend)

3. **`pb_hooks/05-auth-token.pb.js`** ✅ Deprecated
   - All custom endpoints removed
   - File kept as reference with deprecation notice
   - Can be safely deleted after verification

## Files No Longer Needed (Can Be Deleted)

These files are part of the old custom OAuth flow and are no longer used:

- `apps/backend/pb_public/line-callback.html` - Custom callback handler
- `apps/backend/pb_public/line-login.html` - Custom login page
- `apps/web/app/auth/line/page.tsx` - Old LINE callback page (redundant now)

## PocketBase Admin Configuration Required

You MUST configure the OAuth2 provider in PocketBase Admin UI:

### Step 1: Access Admin Panel

1. Go to: `https://pb.eggoworld.io/_/` (production) or `http://localhost:8090/_/` (local)
2. Login with admin credentials

### Step 2: Configure OAuth2 Provider

1. Navigate to: **Settings** → **Collections** → **users**
2. Click **OAuth2** tab
3. Click **Edit** (pencil icon) on the `oidc` provider

### Step 3: Fill in LINE OAuth Settings

| Field | Value |
|-------|-------|
| **Client ID** | `2009441873` |
| **Client Secret** | `4ede94afa7d59b71ffda15a136ffddea` |
| **Auth URL** | `https://access.line.me/oauth2/v2.1/authorize` |
| **Token URL** | `https://api.line.me/oauth2/v2.1/token` |
| **User Info URL** | *(leave EMPTY - using ID Token)* |
| **Display Name** | `Line` |

### Step 4: Configure Field Mapping

| LINE Claim | PocketBase Field |
|------------|------------------|
| `sub` | `externalId` |
| `name` | `name` |
| `picture` | `avatarURL` |
| `email` | `email` |

### Step 5: Set Redirect URL

The redirect URL should be:
```
https://pb.eggoworld.io/api/oauth2-redirect
```

Or for local development:
```
http://localhost:8090/api/oauth2-redirect
```

### Step 6: Enable the Provider

- Make sure the **Enabled** checkbox is checked
- Click **Save**

## LINE Developers Console Configuration

Ensure your LINE channel has the correct callback URL registered:

1. Go to: https://developers.line.biz/console/
2. Select your channel (Channel ID: 2009441873)
3. Click on **LINE Login** tab
4. Add this callback URL:
   ```
   https://pb.eggoworld.io/api/oauth2-redirect
   ```
5. Click **Save**

**Important:**
- No trailing slash
- Must be HTTPS for production
- Must match exactly (case-sensitive)

## How the New Flow Works

### Authentication Flow (Popup-based)

```
User clicks "Login with LINE"
    ↓
Frontend calls: pb.collection('users').authWithOAuth2({ provider: 'oidc' })
    ↓
PocketBase SDK opens popup window
    ↓
Popup redirects to: /api/oauth2-redirect?provider=oidc
    ↓
PocketBase redirects to LINE OAuth consent screen
    ↓
User authorizes on LINE
    ↓
LINE redirects to: /api/oauth2-redirect?code=...&state=...
    ↓
PocketBase exchanges code for tokens automatically
    ↓
PocketBase creates/updates user in database
    ↓
PocketBase sends auth data back to SDK via realtime connection
    ↓
SDK closes popup and returns authData
    ↓
Frontend receives authData with token and user record
    ↓
Frontend handles referral (if new user) and redirects to dashboard
```

### Key Benefits

1. **Security**: Client secret stays on PocketBase server
2. **Simplicity**: No custom token exchange logic or redirect handling
3. **Reliability**: Uses PocketBase's tested OAuth2 implementation
4. **Maintainability**: Less custom code to maintain
5. **Automatic User Creation**: PocketBase handles user creation on first login
6. **Better UX**: Popup-based flow keeps users on your app

## Testing the Migration

### Local Development Testing

1. Start PocketBase locally:
   ```bash
   cd apps/backend
   docker-compose up -d
   ```

2. Start the frontend:
   ```bash
   cd apps/web
   bun dev
   ```

3. Configure PocketBase OAuth2 provider (see Admin Configuration above)
   - Use `http://localhost:8090/api/oauth2-redirect` as redirect URL
   - You may need to configure LINE to allow localhost callback for testing

4. Test the flow:
   - Visit: http://localhost:3000
   - Click "Login with LINE"
   - Complete LINE authentication
   - Verify redirect to dashboard
   - Check that user is created in PocketBase

### Production Testing

1. Deploy the updated code
2. Configure PocketBase OAuth2 provider on production
3. Test with a test LINE account
4. Verify:
   - User is created with correct fields
   - Wallet auto-creation hook still works
   - Referral system works
   - User can access dashboard and all features

## Migration Checklist

- [ ] Configure OAuth2 provider in PocketBase Admin UI
- [ ] Set correct redirect URL in LINE Developers Console
- [ ] Test OAuth2 flow in local development
- [ ] Test wallet auto-creation on new user signup
- [ ] Test referral system with OAuth2 login
- [ ] Deploy to production
- [ ] Test production OAuth2 flow
- [ ] Verify existing LINE users can still login
- [ ] Delete deprecated files (optional):
  - `apps/backend/pb_public/line-callback.html`
  - `apps/backend/pb_public/line-login.html`
  - `apps/backend/pb_hooks/05-auth-token.pb.js`
  - `apps/web/app/auth/line/page.tsx`

## Troubleshooting

### Issue: "Invalid redirect_uri" from LINE

**Solution:**
- Verify the redirect URL in LINE Console matches exactly: `https://pb.eggoworld.io/api/oauth2-redirect`
- No trailing slash, must be HTTPS

### Issue: OAuth2 provider not found

**Solution:**
- Verify provider name is `oidc` in PocketBase Admin UI
- Check that the provider is enabled
- Verify Client ID and Secret are correct

### Issue: User not created after OAuth

**Solution:**
- Check PocketBase logs for errors
- Verify field mapping is correct (`sub` → `externalId`)
- Check that the users collection allows OAuth2 authentication

### Issue: Wallet not created for new user

**Solution:**
- Verify hook `01-create-wallet.pb.js` is loaded
- Check PocketBase logs for hook execution
- Ensure `daccPublickey` field validation pattern is correct

## Rollback Plan

If you need to rollback to the custom implementation:

1. Revert git changes:
   ```bash
   git checkout HEAD~1 -- apps/web/lib/auth/line-oauth.ts
   git checkout HEAD~1 -- apps/web/app/auth/callback/page.tsx
   git checkout HEAD~1 -- apps/backend/pb_hooks/05-auth-token.pb.js
   ```

2. Restart PocketBase
3. The old custom flow will be restored

## Support

If you encounter issues:
1. Check PocketBase logs: `tail -f /tmp/pocketbase.log`
2. Check browser console for errors
3. Verify OAuth2 configuration in Admin UI
4. Test with LINE's OAuth2 debugger tool

---

**Migration Date:** May 9, 2026  
**Status:** ✅ Code changes complete, awaiting PocketBase Admin configuration  
**Next Steps:** Configure OAuth2 provider in PocketBase Admin UI and test

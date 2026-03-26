# LINE OAuth Setup Guide

Step-by-step guide for configuring LINE OAuth for local testing with eggo-pb PocketBase instance.

## Overview

This guide will help you:
1. Create a LINE Login channel
2. Configure it for local testing
3. Set up PocketBase OIDC provider
4. Test the OAuth flow

## Prerequisites

- LINE account (personal)
- LINE Developers Console access: https://developers.line.me/console/
- PocketBase running locally

---

## Step 1: Create LINE Login Channel

### 1.1 Access LINE Developers Console

1. Go to https://developers.line.me/console/
2. Log in with your LINE account
3. If you don't have a provider, create one:
   - Click **Create**
   - Select **Create a LINE Login channel**
   - Choose **Create a new provider** or use existing

### 1.2 Create LINE Login Channel

1. Click **Create a LINE Login channel**
2. Fill in required information:
   - **Channel name**: `eggo-pb-dev` (or your preferred name)
   - **Channel description**: `Development testing for eggo-pb`
   - **App types**: Select `Web app`
   - **Email**: Your email address

3. Click **Create**
4. Read and agree to the terms
5. Your channel is now created!

### 1.3 Get Channel Credentials

After creating the channel, you'll see:

```
Channel ID:     1234567890
Channel Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: Save these securely! You'll need them for PocketBase configuration.

---

## Step 2: Configure Callback URLs

### 2.1 Add Callback URL

1. In your LINE Login channel, go to **LINE Login** tab
2. Find **Callback URL** section
3. Click **Edit**
4. Add these URLs:

For local testing:
```
http://localhost:8090/api/oauth2-redirect
http://127.0.0.1:8090/api/oauth2-redirect
```

For production (when ready):
```
https://your-domain.com/api/oauth2-redirect
```

5. Click **Update**

### 2.2 Configure Other Settings

While in the LINE Login tab:

1. **Scopes** (what information to request):
   - `openid` (required)
   - `profile` (required for name/avatar)
   - `email` (optional, requires approval)

2. **Email address permission**:
   - If you need email, click **Apply for email permission**
   - Fill out the form explaining why you need it
   - Wait for approval (usually quick for development)

3. **Web app configuration**:
   - **Site URL**: `http://localhost:3000` (your frontend)
   - **Privacy policy URL**: (optional for testing)
   - **Terms of use URL**: (optional for testing)

---

## Step 3: Configure PocketBase OIDC Provider

### 3.1 Start PocketBase

```bash
cd /Users/poom-work/tokenine/eggo-pocketbase/eggo-pb
./pocketbase serve --http="0.0.0.0:8090"
```

### 3.2 Access Admin UI

1. Open browser: http://localhost:8090/_/
2. Log in with your admin credentials (create if first time)

### 3.3 Configure OAuth2 Provider

1. Go to **Collections** → **Users**
2. Click **Options** tab
3. Scroll to **OAuth2 settings**
4. Click **Add OAuth2 provider**

### 3.4 Fill in LINE Configuration

Select provider type: **OpenID Connect (OIDC)**

Fill in the details:

| Field | Value |
|-------|-------|
| **Name** | `line` |
| **Client ID** | Your LINE Channel ID (e.g., `1234567890`) |
| **Client Secret** | Your LINE Channel Secret |
| **Authorization URL** | `https://access.line.me/oauth2/v2.1/authorize` |
| **Token URL** | `https://api.line.me/oauth2/v2.1/token` |
| **User info URL** | `https://api.line.me/oauth2/v2.1/userinfo` |
| **Scopes** | `openid profile email` |

### 3.5 Map User Fields

Enable **Map OAuth2 fields to user collection**:

| OAuth2 Field | User Collection Field |
|--------------|----------------------|
| `id` | `externalId` |
| `name` | `name` |
| `avatarURL` | `avatar` |
| `email` | `email` |

Click **Save**

---

## Step 4: Test the OAuth Flow

### 4.1 Using PocketBase Admin UI (Quick Test)

1. Go to **Collections** → **Users**
2. Click **+ New** button
3. Look for **OAuth2** section
4. Click **Login with LINE** button
5. You'll be redirected to LINE login
6. After login, you'll be redirected back
7. A new user should be created!

Check the user record:
- `externalId` should be set (LINE user ID)
- `name` should show LINE display name
- `wallet_address` should be generated
- `encrypted_private_key` should be populated

### 4.2 Using Frontend Application

#### JavaScript/TypeScript Example

```typescript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

async function startLINELogin() {
  // Get available auth methods
  const authMethods = await pb.collection('users').listAuthMethods();
  
  // Find LINE provider
  const lineProvider = authMethods.authProviders.find(
    p => p.name === 'line'
  );
  
  if (!lineProvider) {
    console.error('LINE OAuth not configured');
    return;
  }
  
  // Store code verifier for later
  localStorage.setItem('pb_oauth_code_verifier', lineProvider.codeVerifier);
  
  // Redirect to LINE login
  const redirectUrl = 'http://localhost:3000/auth/callback';
  window.location.href = lineProvider.authUrl + encodeURIComponent(redirectUrl);
}

async function handleOAuthCallback() {
  // Get code and state from URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (!code || !state) {
    console.error('Missing code or state');
    return;
  }
  
  // Get stored code verifier
  const codeVerifier = localStorage.getItem('pb_oauth_code_verifier');
  
  // Complete OAuth
  try {
    const authData = await pb.collection('users').authWithOAuth2Code(
      'line',
      code,
      codeVerifier,
      state,
      'http://localhost:3000/auth/callback'
    );
    
    console.log('Logged in!', authData);
    console.log('Wallet address:', authData.record.wallet_address);
    
    // Clear code verifier
    localStorage.removeItem('pb_oauth_code_verifier');
    
    // Redirect to app
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### 4.3 Testing Checklist

- [ ] Click "Login with LINE" redirects to LINE
- [ ] LINE login page displays your app name
- [ ] After login, user is created in PocketBase
- [ ] User fields are populated:
  - `externalId` (LINE user ID)
  - `name` (LINE display name)
  - `avatar` (LINE profile image)
  - `wallet_address` (auto-generated)
  - `encrypted_private_key` (encrypted wallet data)
- [ ] User can log out and log back in
- [ ] Same LINE account gets same PocketBase user

---

## Step 5: Common Issues & Solutions

### Issue: "Invalid client_id"

**Cause**: Channel ID is incorrect or channel not activated

**Solution**:
1. Verify Channel ID in LINE Console
2. Ensure channel status is "Active"
3. Check for typos in PocketBase config

### Issue: "Callback URL mismatch"

**Cause**: Redirect URL doesn't match LINE Console settings

**Solution**:
1. Check LINE Console → LINE Login → Callback URL
2. Must exactly match: `http://localhost:8090/api/oauth2-redirect`
3. No trailing slashes, exact protocol match

### Issue: "Invalid scope"

**Cause**: Requesting scope not allowed

**Solution**:
1. Check LINE Console → LINE Login → Scopes
2. Only request scopes that are enabled
3. `email` scope requires approval

### Issue: User created but fields empty

**Cause**: Field mapping not configured

**Solution**:
1. Go to Users collection → Options → OAuth2
2. Check "Map OAuth2 fields to user collection"
3. Verify mappings:
   - `id` → `externalId`
   - `name` → `name`
   - `avatarURL` → `avatar`

### Issue: "User not found" on callback

**Cause**: OAuth2 code expired or state mismatch

**Solution**:
1. Code is valid for only 10 minutes
2. State parameter must match
3. Try login flow again

### Issue: "Channel secret is invalid"

**Cause**: Channel Secret is wrong

**Solution**:
1. Get fresh Channel Secret from LINE Console
2. Channel Secret may have been regenerated
3. Update in PocketBase config

---

## Step 6: Moving to Production

### 6.1 Update LINE Channel Settings

1. Go to LINE Console → Your channel
2. Update **Site URL** to production: `https://your-domain.com`
3. Add production callback: `https://your-domain.com/api/oauth2-redirect`
4. Add production domain to allowed domains

### 6.2 Submit for Review (if needed)

For production use with many users:

1. Go to LINE Console → **Developing** → **Submit for review**
2. Fill out required information
3. Wait for LINE approval

### 6.3 Configure Production PocketBase

Update `.env` file:

```bash
LINE_CHANNEL_ID=your_production_channel_id
LINE_CHANNEL_SECRET=your_production_channel_secret
APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## Additional Resources

### LINE Documentation
- LINE Login: https://developers.line.biz/en/services/line-login/
- OAuth 2.0: https://developers.line.biz/en/reference/line-login/
- OpenID Connect: https://developers.line.biz/en/docs/line-login/integrate-pkce/

### PocketBase Documentation
- OAuth2: https://pocketbase.io/docs/authentication/#oauth2
- JavaScript Hooks: https://pocketbase.io/docs/js-hook-overview/

### Testing Tools
- LINE Console: https://developers.line.me/console/
- OAuth 2.0 Debugger: https://oauthdebugger.com/

---

## Security Checklist

Before going to production:

- [ ] Channel Secret stored securely (not in code)
- [ ] Using HTTPS for production
- [ ] Callback URLs use HTTPS
- [ ] Email permission approved (if needed)
- [ ] Channel submitted for review
- [ ] Testing complete in development
- [ ] Error handling implemented
- [ ] User data handling complies with LINE terms

---

## Next Steps

1. ✅ LINE OAuth configured
2. → Read [WALLET_SECURITY.md](./WALLET_SECURITY.md) to understand wallet security
3. → Review [SETUP.md](./SETUP.md) for complete setup
4. → Implement frontend OAuth flow in your app

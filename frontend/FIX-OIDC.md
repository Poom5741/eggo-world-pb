# Fix OIDC Provider Configuration

## Problem
The LINE OAuth URL shows:
`redirect_uri=http://localhost:8090/frontend/callback.html`

But it should be:
`redirect_uri=http://localhost:3000/frontend/callback.html`

This redirect_uri is set in PocketBase's OIDC provider configuration, NOT in frontend code.

## Solution: Reconfigure OIDC Provider in PocketBase

### Step 1: Open PocketBase Admin
http://localhost:8090/_/

### Step 2: Go to OAuth2 Settings
1. Click **Settings** (gear icon)
2. Scroll to **OAuth2 Providers** section

### Step 3: Edit or Recreate LINE/OIDC Provider

**Option A: Edit existing provider**
1. Find your LINE/OIDC provider
2. Click **Edit** (pencil icon)
3. Change **Redirect URI** to: `http://localhost:3000/frontend/callback.html`
4. Click **Save**

**Option B: Delete and recreate**
1. Delete the existing OIDC provider
2. Click **Add new provider**
3. Select **OIDC** provider type
4. Fill in:
   - **Name**: `line` or `oidc`
   - **Client ID**: `2009441873`
   - **Client Secret**: `4ede94afa7d59b71ffda15a136ffddea`
   - **Issuer URL**: `https://access.line.me`
   - **Redirect URI**: `http://localhost:3000/frontend/callback.html`
5. Click **Save**

### Step 4: Clear Browser Cache
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Or clear browser cache completely

### Step 5: Test Again
1. Go to http://localhost:3000/frontend/
2. Click "Login with LINE"
3. Verify the LINE OAuth URL now shows `redirect_uri=http://localhost:3000/frontend/callback.html`

## Verify the Fix

The new LINE OAuth URL should look like:
```
https://access.line.me/oauth2/v2.1/authorize?
  client_id=2009441873&
  redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Ffrontend%2Fcallback.html
  ...
```

Note the `localhost:3000` instead of `localhost:8090`.

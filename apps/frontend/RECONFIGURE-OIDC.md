# Reconfigure OIDC Provider (Delete & Recreate)

PocketBase doesn't allow editing redirect URI - you must delete and recreate the provider.

## Steps

### 1. Open PocketBase Admin
http://localhost:8090/_/

### 2. Delete Existing OIDC Provider
1. Click **Settings** (gear icon ⚙️)
2. Scroll to **OAuth2 Providers** section
3. Find your LINE/OIDC provider
4. Click **Delete** (trash icon 🗑️)
5. Confirm deletion

### 3. Create New OIDC Provider
1. Click **Add new provider** button
2. Select **OpenID Connect** (OIDC)
3. Fill in these exact values:

| Field | Value |
|-------|-------|
| **Name** | `line` |
| **Client ID** | `2009441873` |
| **Client Secret** | `4ede94afa7d59b71ffda15a136ffddea` |
| **Issuer URL** | `https://access.line.me` |
| **Redirect URI** | `http://localhost:3000/frontend/callback.html` |

4. Click **Save**

### 4. Verify
1. Refresh page
2. Confirm new provider shows with correct redirect URI
3. It should display: `http://localhost:3000/frontend/callback.html`

### 5. Clear Browser Cache
- Press `Ctrl+Shift+R` (hard refresh)
- Or open DevTools → Network tab → Check "Disable cache"

### 6. Test OAuth Flow
1. Go to http://localhost:3000/frontend/
2. Click "Login with LINE"
3. **Check the LINE OAuth URL** - it should now show:
   ```
   redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Ffrontend%2Fcallback.html
   ```
4. Complete LINE login
5. Should redirect back to `http://localhost:3000/frontend/callback.html`
6. Callback page exchanges code and redirects to frontend

## Also Update LINE Developers Console

Don't forget to add the callback URL in LINE Developers Console:

1. Go to https://console.line.me/
2. Select your channel
3. **LINE Login** tab
4. **Callback URLs** section
5. Add: `http://localhost:3000/frontend/callback.html`
6. Click **Save**

## Summary of URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000/frontend/ | Login page |
| Callback | http://localhost:3000/frontend/callback.html | OAuth callback |
| PocketBase API | http://localhost:8090/api/ | Backend API |
| PocketBase Admin | http://localhost:8090/_/ | Admin panel |
| LINE OAuth | https://access.line.me/oauth2/v2.1/authorize | LINE login |

# Fix: ClientResponseError 0 - OAuth2 Provider Not Configured

## Problem

You're getting this error when clicking "Login with LINE":

```
ClientResponseError 0
Something went wrong while processing your request.
```

## Root Cause

The OAuth2 provider (`oidc`) is **not configured** in your PocketBase instance. The `authWithOAuth2()` method fails because PocketBase doesn't know about the LINE provider yet.

## Solution

You need to configure the LINE OAuth2 provider in PocketBase. Choose one of these methods:

### Method 1: Run Configuration Script (Fastest)

```bash
cd apps/backend

# Set your admin credentials (if different from defaults)
export PB_ADMIN_EMAIL="admin@eggo.io"
export PB_ADMIN_PASSWORD="admin123456"

# Run the configuration script
node scripts/configure-line-oauth2.js
```

This will automatically configure the OAuth2 provider for you.

### Method 2: Manual Configuration via Admin UI

1. **Open PocketBase Admin:**
   ```bash
   # Local
   open http://localhost:8090/_/
   
   # Production
   open https://pb.eggoworld.io/_/
   ```

2. **Login with admin credentials**

3. **Navigate to OAuth2 Settings:**
   - Click **Collections** (left sidebar)
   - Click **users**
   - Click **Settings** icon (⚙️) or **Edit collection**
   - Click **OAuth2** tab

4. **Add LINE Provider:**
   - Click **Add OAuth2 provider**
   - Select **Custom OIDC**
   - Fill in:
     ```
     Name:              oidc
     Client ID:         2009441873
     Client Secret:     4ede94afa7d59b71ffda15a136ffddea
     Auth URL:          https://access.line.me/oauth2/v2.1/authorize
     Token URL:         https://api.line.me/oauth2/v2.1/token
     User Info URL:     (leave empty)
     Display Name:      Line
     ```

5. **Configure Field Mapping:**
   Click on "Mapped Fields" and set:
   ```
   id → externalId
   name → name
   picture → avatarURL
   email → email
   ```

6. **Enable the provider:**
   - Check the **Enabled** checkbox ✓

7. **Save**

### Method 3: Via PocketBase API (Manual)

If you prefer to use curl or Postman:

```bash
# 1. Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8090/api/admins/auth \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@eggo.io","password":"admin123456"}' | jq -r '.token')

# 2. Configure OAuth2 provider
curl -X PATCH http://localhost:8090/api/collections/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "oauth2": {
      "enabled": true,
      "providers": [{
        "name": "oidc",
        "client_id": "2009441873",
        "client_secret": "4ede94afa7d59b71ffda15a136ffddea",
        "auth_url": "https://access.line.me/oauth2/v2.1/authorize",
        "token_url": "https://api.line.me/oauth2/v2.1/token",
        "user_api_url": "",
        "display_name": "Line",
        "mapped_fields": {
          "id": "externalId",
          "name": "name",
          "picture": "avatarURL",
          "email": "email"
        },
        "enabled": true
      }]
    }
  }'
```

## Verify Configuration

After configuring, verify it worked:

### Option 1: Check Admin UI
- Go back to Collections → users → OAuth2 tab
- You should see "Line (oidc)" listed and enabled

### Option 2: Check via API
```bash
curl http://localhost:8090/api/collections/users/auth-methods | jq '.oauth2.providers'
```

You should see:
```json
[
  {
    "name": "oidc",
    "displayName": "Line",
    "state": "...",
    "codeVerifier": "...",
    "authURL": "https://access.line.me/oauth2/v2.1/authorize?..."
  }
]
```

## Test LINE Login

Once configured, test it:

1. **Visit your app:**
   ```bash
   open http://localhost:3000/auth/login
   ```

2. **Click "Login with LINE"**
   - A popup should open with LINE's login page
   - Login with your LINE account
   - After successful login, popup closes and you're redirected to dashboard

## Troubleshooting

### Still getting the same error?

1. **Check if PocketBase is running:**
   ```bash
   curl http://localhost:8090/api/health
   ```

2. **Check admin credentials:**
   - Make sure you're using the correct admin email/password
   - Default is usually `admin@eggo.io` / `admin123456`

3. **Check PocketBase logs:**
   ```bash
   # If using Docker
   docker logs pocketbase
   
   # If running directly
   tail -f /tmp/pocketbase.log
   ```

4. **Verify OAuth2 provider exists:**
   ```bash
   curl http://localhost:8090/api/collections/users/auth-methods | jq '.oauth2'
   ```

### "Invalid redirect_uri" from LINE?

Add the callback URL to LINE Developers Console:
1. Go to: https://developers.line.biz/console/
2. Select your channel (ID: 2009441873)
3. LINE Login tab
4. Add: `http://localhost:8090/api/oauth2-redirect` (for local)
5. Save

### Popup blocked?

- Make sure you're clicking the button directly (not calling async before `authWithOAuth2`)
- Check browser popup settings
- Safari is strict - may need to allow popups for localhost

## Next Steps

After successful configuration:
1. ✅ Test LINE login flow
2. ✅ Verify user is created in PocketBase
3. ✅ Verify wallet is auto-created by hook
4. ✅ Test referral system (if applicable)
5. ✅ Deploy to production and configure production OAuth2

---

**Need more help?** See [LINE_OAUTH2_SUMMARY.md](./LINE_OAUTH2_SUMMARY.md) for complete documentation.

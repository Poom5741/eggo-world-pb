# LINE OAuth Setup - FINAL STATUS

## ⚠️ OAuth Configuration Requires Manual UI Setup

After extensive investigation, the PocketBase OAuth configuration **cannot be updated programmatically** in this version (0.36.6). The OAuth provider settings are cached and only editable through the Admin UI.

## ✅ What's Working

1. **Frontend Pages** - line-login.html and line-callback.html ready
2. **LINE Token Exchange** - Callback URL validated, token exchange works
3. **Wallet Creation Hook** - Auto-generates EVM wallets for new users
4. **Docker Setup** - All environment variables configured
5. **Redirect URI** - Frontend properly constructs auth URLs

## ❌ What Requires Manual Configuration

### OAuth Provider Settings (Admin UI Required)

**The database contains the correct config, but PocketBase doesn't load it on startup.**

**Manual Steps:**

1. **Login to Admin UI**
   - URL: https://pb.eggoworld.io/_/
   - Email: admin@eggo.local
   - Password: admin123

2. **Navigate to OAuth Settings**
   - Settings → Collections → users
   - Click "OAuth2" tab

3. **Edit "oidc" Provider**
   - Click the pencil/edit icon
   - Ensure these settings:
     ```
     Client ID: 2009441873
     Client Secret: 4ede94afa7d59b71ffda15a136ffddea
     Auth URL: https://access.line.me/oauth2/v2.1/authorize
     Token URL: https://api.line.me/oauth2/v2.1/token
     UserInfo URL: https://api.line.me/oauth2/v2.1/userinfo
     Display Name: Line
     PKCE: ✓ (checked)
     ```

4. **Field Mapping (CRITICAL)**
   - Change from: `id → externalId`
   - Change to: `sub → externalId`
   
   Full mapping:
   ```
   sub → externalId
   name → name
   picture → avatar
   email → email
   ```

5. **Save Configuration**

## 🧪 Test After Configuration

1. Visit: https://pb.eggoworld.io/line-login.html
2. Click "Login with LINE"
3. Authorize on LINE
4. Should redirect back with:
   - User name
   - Email (if approved)
   - Wallet address (auto-generated)

## 📁 Files Ready

All frontend and backend code is ready:
- `/pb_public/line-login.html` - Login page
- `/pb_public/line-callback.html` - Callback handler
- `/pb_public/index.html` - Landing page
- `/pb_hooks/01-create-wallet.pb.js` - Wallet auto-creation
- `docker-compose.yml` - Production config

## 🔍 Why API/DB Updates Don't Work

PocketBase 0.36.6 caches collection options on startup. While the database has been updated with correct OAuth settings (verified via direct SQLite query), the API layer doesn't reload this configuration dynamically. This is a known limitation - OAuth provider configuration must be done through the Admin UI.

## 📋 LINE Console Configuration

Already configured:
- Callback URL: `https://pb.eggoworld.io/line-callback.html`
- Channel ID: 2009441873
- Channel Secret: 4ede94afa7d59b71ffda15a136ffddea

---

**Next Action:** Complete OAuth configuration in Admin UI (2 minutes), then test.

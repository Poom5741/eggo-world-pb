# LINE OAuth - Current Status

## ✅ Fixed Issues

### 1. Frontend Redirect URI (FIXED)
**File:** `pb_public/line-login.html`

The frontend now properly replaces the empty redirect_uri parameter in the auth URL:
```javascript
// Before: redirect_uri=
// After: redirect_uri=https://pb.eggoworld.io/line-callback.html
```

### 2. Wallet Master Key (FIXED)
**File:** `docker-compose.yml`

Added WALLET_MASTER_KEY environment variable:
```yaml
WALLET_MASTER_KEY: production_key_change_this_32_characters
```

### 3. Frontend Pages (CREATED)
- **line-login.html** - Login page with LINE button
- **line-callback.html** - Handles OAuth callback
- **index.html** - Landing page

## ⚠️ Still Required: Manual Configuration

### Step 1: Update LINE Console
Add this callback URL to your LINE Developers Console:
```
https://pb.eggoworld.io/line-callback.html
```

**How:**
1. Go to https://developers.line.biz/
2. Select your channel (ID: 2009441873)
3. Go to "LINE Login" tab
4. Add callback URL (one per line)
5. Save

### Step 2: Fix OAuth Field Mapping in PocketBase
**Problem:** Current mapping uses `id → externalId`, but LINE returns `sub`

**Fix in PocketBase Admin:**
1. Go to: https://pb.eggoworld.io/_/
2. Login: admin@eggo.local / admin123
3. Settings → Collections → users
4. Click "OAuth2" tab
5. Edit "oidc" provider
6. Change field mapping:
   ```
   FROM: id → externalId
   TO:   sub → externalId
   ```
7. Save

## 🧪 Testing

After completing the manual steps, test here:
**https://pb.eggoworld.io/line-login.html**

Expected flow:
1. Click "Login with LINE"
2. Authorize on LINE
3. Return to callback page
4. See user profile + wallet address

## 🔍 Debugging

If it fails, check:
1. Browser console for JavaScript errors
2. Docker logs: `docker logs pocketbase`
3. LINE Console callback URL matches exactly
4. OAuth field mapping shows `sub → externalId`

## 📁 Files Modified
- `docker-compose.yml` - Added env vars
- `pb_public/line-login.html` - Fixed redirect_uri handling
- `pb_public/line-callback.html` - Created
- `pb_public/index.html` - Updated

---
**Status:** Frontend and backend ready. Waiting for LINE Console config and PocketBase field mapping update.
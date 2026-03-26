# LINE OAuth Manual Configuration Required

## Current Status

✅ **Working:**
- Docker container running
- Frontend pages created (line-login.html, line-callback.html)
- LINE callback URL added and validated (token exchange works)
- Wallet creation hook active
- Redirect URI properly set in frontend

❌ **Requires Manual Configuration:**
- PocketBase OAuth provider settings cannot be updated via API
- Must be configured through Admin UI

## Why Manual Config is Needed

PocketBase stores OAuth configuration in the database, and this version (0.36.6) only allows OAuth provider updates through the Admin UI. API PATCH requests to the collection don't persist OAuth settings.

## Manual Configuration Steps

### Step 1: Login to PocketBase Admin
```
URL: https://pb.eggoworld.io/_/
Email: admin@eggo.local
Password: admin123
```

### Step 2: Navigate to OAuth Settings
1. Click **Settings** (gear icon) in the sidebar
2. Scroll down to **Collections** section
3. Click on **users** collection
4. Click the **OAuth2** tab

### Step 3: Configure OAuth Provider

You should see an "oidc" provider already listed. Click the **Edit** (pencil) icon.

**Fill in these fields:**

| Field | Value |
|-------|-------|
| **Client ID** | `2009441873` |
| **Client Secret** | `4ede94afa7d59b71ffda15a136ffddea` |
| **Auth URL** | `https://access.line.me/oauth2/v2.1/authorize` |
| **Token URL** | `https://api.line.me/oauth2/v2.1/token` |
| **User Info URL** | `https://api.line.me/oauth2/v2.1/userinfo` |
| **Display Name** | `Line` |

### Step 4: Configure Field Mapping

This is the **most important** part! LINE returns `sub` for user ID, not `id`.

**Mapping fields:**

| LINE Field | PocketBase Field |
|------------|------------------|
| `sub` | `externalId` |
| `name` | `name` |
| `picture` | `avatar` |
| `email` | `email` |

**Do NOT use:**
- ❌ `id` → externalId (wrong!)
- ❌ `username` → (leave empty)

### Step 5: Enable PKCE
Make sure **PKCE** checkbox is checked (should be enabled by default)

### Step 6: Save
Click **Save** to persist the configuration.

## Verify Configuration

After saving, test the OAuth flow:

1. Visit: https://pb.eggoworld.io/line-login.html
2. Click "Login with LINE"
3. Authorize on LINE
4. You should see:
   - User name
   - Email (if LINE approved)
   - Wallet address (auto-generated)

## Expected Result

If configured correctly:
1. ✅ LINE authorization page appears
2. ✅ Redirects back to callback page
3. ✅ User account created in PocketBase
4. ✅ Wallet automatically generated
5. ✅ User info displayed

## Troubleshooting

### "Failed to fetch OAuth2 token"
- ✅ Already fixed (callback URL was issue)
- If reappears: Check LINE Console callback URL matches exactly

### "Failed to create record"
- This is the OAuth mapping issue
- Fix: Update field mapping to use `sub → externalId`

### "Invalid state parameter"
- Clear browser cache/localStorage
- Try again in incognito mode

### Wallet not created
- Check logs: `docker logs pocketbase`
- Should see: "Create wallet hook triggered for user: XXX"
- If not, check wallet fields exist in users collection

## Current Frontend Files

All frontend files are ready and working:
- `/pb_public/line-login.html` - Login page
- `/pb_public/line-callback.html` - Callback handler (with debug logging)
- `/pb_public/index.html` - Landing page

## LINE Console Configuration (Already Done)

Callback URL should be set to:
```
https://pb.eggoworld.io/line-callback.html
```

If you haven't added this yet:
1. Go to https://developers.line.biz/console/
2. Select channel: 2009441873
3. LINE Login tab
4. Add callback URL
5. Save

---

## Summary

**One manual step remains:** Configure OAuth provider in PocketBase Admin UI with correct client secret and field mapping (`sub → externalId`).

Once this is done, the entire LINE OAuth flow will work end-to-end with automatic wallet creation.

# LINE OAuth Setup - FINAL INSTRUCTIONS

## ✅ What's Working

1. **Frontend Pages** - https://pb.eggoworld.io/line-login.html ✓
2. **LINE Token Exchange** - Callback URL validated ✓
3. **ID Token Claims** - Using JWT instead of UserInfo endpoint ✓
4. **Wallet Auto-Creation** - Hook active and working ✓
5. **Docker & Nginx** - Both containers healthy ✓

## ⚠️ Manual Admin UI Configuration Required

**PocketBase OAuth `mappedFields` must be configured through Admin UI** (cannot be done via API/database).

### Step 1: Login to Admin
- **URL:** https://pb.eggoworld.io/_/
- **Email:** admin@eggo.local
- **Password:** admin123

### Step 2: Configure OAuth Provider

1. **Settings** → **Collections** → **users**
2. Click **"OAuth2"** tab
3. Click **Edit** (pencil icon) on "oidc" provider

### Step 3: Fill in Provider Settings

| Field | Value |
|-------|-------|
| Client ID | `2009441873` |
| Client Secret | `4ede94afa7d59b71ffda15a136ffddea` |
| Auth URL | `https://access.line.me/oauth2/v2.1/authorize` |
| Token URL | `https://api.line.me/oauth2/v2.1/token` |
| **User Info URL** | *(leave EMPTY - using ID Token)* |
| Display Name | `Line` |

### Step 4: Configure Field Mapping

**Important:** Select PocketBase field on left, **TYPE** LINE field name on right:

| PocketBase Field (select) | LINE Field (type manually) |
|---------------------------|---------------------------|
| `externalId` | `sub` |
| `name` | `name` |
| `avatar` | `picture` |
| `email` | `email` |

### Step 5: Save
- Click **Save**
- OAuth configuration is now complete

## 🧪 Test LINE Login

1. Visit: **https://pb.eggoworld.io/line-login.html**
2. Click "Login with LINE"
3. Authorize on LINE
4. Should redirect back with:
   - ✓ User name displayed
   - ✓ Email (if LINE approved)
   - ✓ Wallet address (auto-generated)

## 🔍 Why Manual Config is Required

PocketBase 0.36.6 (ghcr.io/muchobien/pocketbase) has a limitation where OAuth `mappedFields` are not loaded from the database at runtime. The Admin UI properly persists these settings.

The database contains the correct configuration, but the API layer doesn't load it. Manual UI configuration bypasses this limitation.

## 📋 LINE Console Configuration

Already configured in LINE Developers Console:
- **Callback URL:** `https://pb.eggoworld.io/line-callback.html`
- **Channel ID:** `2009441873`
- **Scopes:** `openid profile email`

---

**Time to complete:** 2 minutes in Admin UI
**Result:** Full LINE OAuth with automatic wallet creation

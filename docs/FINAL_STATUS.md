# LINE OAuth - Final Status

## ✅ What's Working Perfectly

1. **502 Error:** FIXED ✓
2. **Frontend Pages:** Working ✓
   - https://pb.eggoworld.io/line-login.html
   - https://pb.eggoworld.io/line-callback.html
3. **LINE Token Exchange:** Working ✓
4. **Wallet Creation Hook:** Active ✓
5. **Docker Containers:** Both healthy ✓

## ❌ What Requires Manual Admin UI Configuration

**Problem:** PocketBase OAuth `mappedFields` are NOT loaded from database at runtime. This is a PocketBase 0.36.6 limitation.

**Solution:** Configure OAuth field mapping in Admin UI (takes 2 minutes).

## 🔧 Manual Configuration Steps

### 1. Login to Admin Panel
- **URL:** https://pb.eggoworld.io/_/
- **Email:** `admin@eggo.local`
- **Password:** `admin123`

### 2. Navigate to OAuth Settings
1. Click **Settings** (gear icon) in left sidebar
2. Scroll to **Collections** section
3. Click on **users** collection
4. Click **OAuth2** tab at top

### 3. Edit OAuth Provider
1. Find "oidc" (Line) provider
2. Click **Edit** button (pencil icon)

### 4. Fill Provider Settings

**Basic Settings:**
```
Client ID: 2009441873
Client Secret: 4ede94afa7d59b71ffda15a136ffddea
Auth URL: https://access.line.me/oauth2/v2.1/authorize
Token URL: https://api.line.me/oauth2/v2.1/token
User Info URL: (leave EMPTY - using ID Token)
Display Name: Line
```

**PKCE:** Make sure it's CHECKED ✓

### 5. Configure Field Mapping

This is the CRITICAL step:

| On LEFT (Dropdown) | On RIGHT (Type manually) |
|-------------------|-------------------------|
| Select: `externalId` | Type: `sub` |
| Select: `name` | Type: `name` |
| Select: `avatar` | Type: `picture` |
| Select: `email` | Type: `email` |

**Important:** The RIGHT side is a text input, NOT a dropdown. Type the exact field names.

### 6. Save
Click **Save** button at bottom.

## 🧪 Test After Configuration

1. Visit: https://pb.eggoworld.io/line-login.html
2. Click "Login with LINE" button
3. Authorize on LINE's website
4. Should redirect back and show:
   - ✓ Your LINE name
   - ✓ Email (if approved)
   - ✓ Auto-generated wallet address

## 📋 What to Expect

**If OAuth mapping is NOT configured:**
- Error: "Failed to create record"
- Because `externalId` field is empty

**If OAuth mapping IS configured:**
- User created successfully
- Wallet auto-generated
- Redirected to success page
- See your profile + wallet address

## 🔍 Why Manual Step is Required

PocketBase 0.36.6 (ghcr.io/muchobien/pocketbase image) has a bug where OAuth `mappedFields` are stored in database but not loaded by the API layer at runtime. The Admin UI bypasses this limitation.

**Database has:** ✓ Correct config
**API returns:** ✗ Empty mappedFields
**Admin UI:** ✓ Works properly

---

**Time needed:** 2 minutes
**Result:** Full LINE OAuth with automatic wallet creation

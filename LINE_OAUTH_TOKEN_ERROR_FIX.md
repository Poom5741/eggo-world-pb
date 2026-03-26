# LINE OAuth Token Exchange Failed - Solution

## Error Analysis

**Error:** `Failed to fetch OAuth2 token`
**LINE Response:** `invalid_grant - invalid authorization code`

## Root Cause

The authorization code is being rejected by LINE. This happens when:

1. **Redirect URI mismatch** (MOST COMMON)
   - The redirect_uri in the token request doesn't match what's registered in LINE Console
   - LINE validates this STRICTLY

2. **Expired code** (codes expire after 10 minutes)

3. **Code already used** (codes can only be used once)

4. **Client secret wrong**

## Solution: Add Callback URL to LINE Console

### Step 1: Go to LINE Developers Console
1. Visit: https://developers.line.biz/console/
2. Select your channel (Channel ID: 2009441873)
3. Click on "LINE Login" tab

### Step 2: Add Callback URL
Add this EXACT URL to the "Callback URLs" section:
```
https://pb.eggoworld.io/line-callback.html
```

**Important:**
- No trailing slash
- Must be HTTPS
- Must match exactly (case-sensitive)
- One URL per line

### Step 3: Save and Wait
- Click "Save"
- Wait 2-5 minutes for changes to propagate

### Step 4: Test Again
1. Clear your browser cache/localStorage
2. Visit: https://pb.eggoworld.io/line-login.html
3. Try logging in again

## Debug: Verify Your LINE Console Config

The callback URL section should look like:
```
Callback URLs
━━━━━━━━━━━━
https://pb.eggoworld.io/line-callback.html
```

## Alternative: Test with Different Redirect

If you're still having issues, we can test with the LINE-provided redirect format:

Update your LINE Console to also include:
```
https://pb.eggoworld.io/api/oauth2-redirect
```

Then use the PocketBase-managed OAuth flow instead of our custom callback.

## Need Help?

1. Take a screenshot of your LINE Console callback URL section
2. Check browser console for the exact redirect_uri being sent
3. Compare the two - they must match EXACTLY

---
**Most likely fix:** Add `https://pb.eggoworld.io/line-callback.html` to LINE Console callback URLs
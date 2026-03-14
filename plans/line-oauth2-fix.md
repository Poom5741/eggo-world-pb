# LINE OAuth2 Fix - Final Solution

## Problem Summary

OAuth2 authentication fails with redirect to `/auth/oauth2-redirect-failure`.

## Root Cause Analysis

After extensive testing, I discovered:

1. **Empty `redirect_uri` is expected**: The `redirect_uri=` being empty in the `/api/collections/users/auth-methods` response is normal PocketBase behavior. The redirect URI is dynamically generated when the OAuth flow is actually initiated.

2. **Scope includes `email`**: PocketBase is adding `email` to the scope (`openid+email+profile`) even when we set it to `openid profile` in the database. This might cause issues if your LINE channel hasn't been approved for email access.

3. **LINE credentials are valid**: Confirmed via curl test that the Channel ID and Secret work correctly.

## The Real Issue

The OAuth2 redirect failure is likely caused by one of these:

### 1. LINE Console Callback URL Mismatch

The callback URL in LINE Console must match **exactly**:
```
http://localhost:8090/api/oauth2-redirect
```

No trailing slash, exact protocol match.

### 2. Email Scope Not Approved

If your LINE channel hasn't been approved for email access, the `email` scope will cause the OAuth flow to fail.

### 3. PKCE Code Verifier/Challenge Mismatch

LINE requires PKCE. PocketBase handles this automatically, but there might be issues with the code exchange.

## Solutions

### Solution 1: Verify LINE Console Settings (Most Likely Fix)

1. Go to [LINE Developers Console](https://developers.line.me/console/)
2. Select your channel
3. Go to **LINE Login** tab
4. Verify **Callback URL** is exactly:
   ```
   http://localhost:8090/api/oauth2-redirect
   ```
5. Save changes

### Solution 2: Remove Email Scope (If Not Approved)

Since PocketBase is adding `email` to the scope automatically, you have two options:

**Option A**: Get email scope approved by LINE
- Submit your channel for review in LINE Console
- Explain you need email for user identification

**Option B**: Use a custom OAuth2 hook (advanced)
- Create a custom hook that handles the OAuth2 flow without the email scope
- See the custom hook example below

### Solution 3: Test the Actual OAuth Flow

The empty `redirect_uri` in the API response is expected. Test the actual flow:

1. Open Admin UI: http://localhost:8090/_/
2. Go to **Collections** → **users**
3. Click **+ New** to create a new user
4. Look for **"Login with LINE"** button
5. Click it and complete the LINE login
6. Watch the PocketBase logs for errors

### Solution 4: Check PocketBase Logs

Run PocketBase with verbose logging to see the actual error:

```bash
docker logs -f eggo-pb
```

Watch for errors when you try to log in with LINE.

## Custom OAuth2 Hook (If Built-in OAuth2 Doesn't Work)

If the built-in OAuth2 continues to fail, you can create a custom hook:

```javascript
// pb_hooks/10-line-oauth.pb.js
console.log("Setting up LINE OAuth hook...");

onRequest("/api/line-login", async (e) => {
  // Generate PKCE
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generateSha256(codeVerifier);
  
  // Store code verifier in session
  // Redirect to LINE
  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code&` +
    `client_id=2009441873&` +
    `redirect_uri=http://localhost:8090/api/line-callback&` +
    `scope=openid+profile&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;
  
  e.redirect(authUrl);
});

onRequest("/api/line-callback", async (e) => {
  const code = e.query.get("code");
  
  // Exchange code for token
  const tokenResponse = await $http.send({
    url: "https://api.line.me/oauth2/v2.1/token",
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: `grant_type=authorization_code&` +
          `code=${code}&` +
          `redirect_uri=http://localhost:8090/api/line-callback&` +
          `client_id=2009441873&` +
          `client_secret=4ede94afa7d59b71ffda15a136ffddea`
  });
  
  // Get user info and create/link user
  // ...
});
```

## Testing Checklist

- [ ] LINE Console callback URL is exactly `http://localhost:8090/api/oauth2-redirect`
- [ ] LINE channel is active
- [ ] PocketBase OAuth2 provider is enabled
- [ ] Field mapping is configured (id → externalId, name → name, avatarURL → avatar)
- [ ] Test OAuth flow from Admin UI
- [ ] Check PocketBase logs for specific errors

## Expected Behavior

When OAuth2 works correctly:

1. Click "Login with LINE" → Redirect to LINE login
2. User logs in to LINE → Redirect back to PocketBase
3. PocketBase creates/links user with LINE ID
4. User is authenticated in PocketBase

## Current Database Configuration

The OAuth2 provider in the database is configured as:

```json
{
  "pkce": true,
  "name": "line",
  "clientId": "2009441873",
  "clientSecret": "4ede94afa7d59b71ffda15a136ffddea",
  "authURL": "https://access.line.me/oauth2/v2.1/authorize",
  "tokenURL": "https://api.line.me/oauth2/v2.1/token",
  "userInfoURL": "https://api.line.me/oauth2/v2.1/userinfo",
  "scopes": "openid profile",
  "displayName": "LINE"
}
```

Note: Even though `scopes` is set to `openid profile`, PocketBase may still add `email` to the actual request.

## Next Steps

1. **Verify LINE Console callback URL** - This is the most common issue
2. **Test the actual OAuth flow** - Not just the API response
3. **Check PocketBase logs** - For specific error messages
4. **Consider email scope approval** - If email is required
5. **Use custom hook** - If built-in OAuth2 doesn't work with LINE

## Additional Resources

- LINE OAuth2 Documentation: https://developers.line.biz/en/reference/line-login/
- LINE PKCE Guide: https://developers.line.biz/en/docs/line-login/integrate-pkce/
- PocketBase OAuth2: https://pocketbase.io/docs/authentication/#oauth2

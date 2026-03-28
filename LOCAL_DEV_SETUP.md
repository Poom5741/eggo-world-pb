# Local Development with Production PocketBase

This setup allows you to run your frontend locally (`localhost:3000`) while using the production PocketBase instance (`https://pb.eggoworld.io`) for authentication and data.

## How It Works

### Architecture
```
┌─────────────────┐      OAuth      ┌──────────────────┐      ┌─────────────────┐
│  Local Frontend │ ──────────────── │  Production PB   │ ──── │   LINE OAuth    │
│  localhost:3000 │                  │ pb.eggoworld.io  │      │  access.line.me │
└─────────────────┘                  └──────────────────┘      └─────────────────┘
         │                                     │
         │     Redirect with token             │
         │◄────────────────────────────────────┘
         │
    ┌────▼────┐
    │  Auth   │
    │  Saved  │
    └─────────┘
```

### Flow
1. User clicks "Login with LINE" on localhost
2. Frontend redirects to `pb.eggoworld.io/line-login.html?returnUrl=http://localhost:3000/auth/line`
3. Production PocketBase stores the return URL
4. User authenticates with LINE
5. LINE redirects back to production callback
6. Production callback redirects back to localhost with auth token
7. Local frontend saves auth and redirects to home

## Current Configuration

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io
```

This is already configured correctly.

## Files Changed

### 1. Frontend: `/apps/web/app/auth/line/page.tsx`
- Redirects to production PocketBase with return URL
- Handles incoming auth data from production redirect

### 2. Frontend: `/apps/web/lib/pocketbase/client.ts`
- Loads auth from `localStorage` on initialization
- Syncs auth state with `localStorage` automatically
- Clears `localStorage` on logout

### 3. Production: `/apps/backend/pb_public/line-login.html`
- Stores `returnUrl` parameter in sessionStorage/localStorage
- Used when redirecting back from LINE OAuth

### 4. Production: `/apps/backend/pb_public/line-callback.html`
- Checks for stored return URL
- Redirects to localhost if return URL is present and contains 'localhost'
- Passes auth token and user data as URL parameters

## Deployment Steps

To deploy these changes to production:

```bash
# Commit the changes
git add apps/backend/pb_public/line-login.html
git add apps/backend/pb_public/line-callback.html
git commit -m "feat: Add support for local development OAuth redirects"

# Deploy to production (adjust based on your deployment process)
# Option 1: If using Docker
cd apps/backend
docker-compose up -d

# Option 2: If using direct deployment
# Copy pb_public files to production server
scp pb_public/*.html user@pb.eggoworld.io:/path/to/pb_public/
```

## Testing the Setup

1. Start your local frontend:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Open `http://localhost:3000/auth/line`

3. Click "Login with LINE"

4. Complete LINE authentication

5. You should be redirected back to `http://localhost:3000/auth/line?token=...&user=...`

6. The page will automatically:
   - Extract the token and user data
   - Save to localStorage
   - Redirect to home page

## Security Considerations

1. **Token in URL**: The auth token is passed in the URL query string during redirect. This is generally safe for localhost development but consider:
   - Tokens have expiration
   - HTTPS is used in production
   - Tokens are immediately cleared from URL and stored securely

2. **CORS**: Ensure your production PocketBase has proper CORS settings if needed

3. **State Parameter**: The OAuth flow includes a state parameter to prevent CSRF attacks

## Troubleshooting

### Issue: "No authorization code received"
- Check browser console for errors
- Verify LINE OAuth configuration in production
- Ensure LINE callback URL is registered correctly

### Issue: Not redirected back to localhost
- Verify `returnUrl` is being stored in sessionStorage
- Check if callback page is reading the stored URL correctly
- Verify the return URL contains 'localhost'

### Issue: Auth not persisting after refresh
- Check browser DevTools > Application > Local Storage
- Verify `pocketbase_auth` key exists
- Check console for JSON parsing errors

## Alternative: Local PocketBase

If you need to test PocketBase changes locally, you can:

1. Start local PocketBase: `./eggo-pb/pocketbase serve`
2. Update `.env.local`: `NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090`
3. Configure LINE OAuth callback to use `http://localhost:8090/line-callback.html`

Note: This requires updating LINE OAuth settings in LINE Developer Console.

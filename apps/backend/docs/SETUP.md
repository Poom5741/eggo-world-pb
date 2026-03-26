# Eggo-PB Setup Guide

Complete setup guide for the eggo-pb PocketBase instance with LINE OAuth and automatic wallet creation.

## Prerequisites

- PocketBase v0.22 or later
- LINE Login channel (from [LINE Developers Console](https://developers.line.me/console/))
- Node.js (for running scripts, if needed)
- Git (for version control)

## Quick Start

### 1. Download PocketBase

```bash
# For macOS (Apple Silicon)
curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_macOS_arm64.zip -o pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase

# For macOS (Intel)
curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_macOS_amd64.zip -o pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase

# For Linux
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip -O pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase
```

### 2. Set Up Project Structure

```bash
cd /Users/poom-work/tokenine/eggo-pocketbase/eggo-pb

# Create necessary directories
mkdir -p pb_data pb_public pb_migrations
```

### 3. Import Collection Schema

#### Option A: Via PocketBase Admin UI (Recommended for first time)

1. Start PocketBase:
   ```bash
   ./pocketbase serve
   ```

2. Open browser to `http://localhost:8090/_/`

3. Create admin account

4. Go to **Settings** → **Import collections**

5. Paste the contents of `collections/users.json`

6. Click **Import**

#### Option B: Via PocketBase CLI (if available)

```bash
# If using pocketbase-cli
pocketbase collections import collections/users.json
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# LINE OAuth Configuration
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret

# Wallet Encryption (CRITICAL - Generate a strong key)
# Generate with: openssl rand -hex 32
WALLET_MASTER_KEY=your_64_character_hex_key_here

# App Configuration
APP_NAME=eggo-pb
APP_URL=http://localhost:8090
NODE_ENV=development
```

**Important**: Never commit `.env` file to git!

### 5. Configure LINE OAuth Provider

See [LINE_OAUTH_SETUP.md](./LINE_OAUTH_SETUP.md) for detailed instructions.

Quick steps:

1. Go to PocketBase Admin UI → Users collection → Options

2. Click **Add OAuth2 provider**

3. Select **OpenID Connect (OIDC)**

4. Fill in the configuration:
   - **Name**: `line`
   - **Client ID**: Your LINE Channel ID
   - **Client Secret**: Your LINE Channel Secret
   - **Authorization URL**: `https://access.line.me/oauth2/v2.1/authorize`
   - **Token URL**: `https://api.line.me/oauth2/v2.1/token`
   - **User info URL**: `https://api.line.me/oauth2/v2.1/userinfo`
   - **Scopes**: `openid profile email`

5. Enable **Map fields**:
   - LINE `id` → `externalId`
   - LINE `name` → `name`
   - LINE `avatarURL` → `avatar`

6. Click **Save**

### 6. Start PocketBase

```bash
./pocketbase serve --http="0.0.0.0:8090"
```

For production with HTTPS:

```bash
./pocketbase serve --https="your-domain.com:443"
```

### 7. Test the Setup

#### Test 1: Health Check

```bash
curl http://localhost:8090/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "eggo-pb",
  "version": "1.0.0"
}
```

#### Test 2: LINE OAuth Flow

1. Open your frontend app
2. Click "Login with LINE"
3. Complete LINE authentication
4. Verify user is created in PocketBase Admin UI
5. Check that wallet fields are populated:
   - `wallet_address`
   - `encrypted_private_key`
   - `publicKey`
   - `wallet_version`

## Directory Structure

```
eggo-pb/
├── pocketbase                      # PocketBase binary
├── collections/
│   └── users.json                 # User collection schema
├── pb_hooks/
│   ├── 00-config.pb.js           # Configuration hook
│   ├── 01-create-wallet.pb.js    # Wallet creation hook
│   └── 99-debug.pb.js            # Debug utilities
├── pb_data/                      # Database files (gitignored)
├── pb_public/                    # Static files
├── pb_migrations/                # Database migrations
├── docs/
│   ├── SETUP.md                  # This file
│   ├── LINE_OAUTH_SETUP.md       # LINE OAuth guide
│   └── WALLET_SECURITY.md        # Security documentation
├── .env                          # Environment variables (gitignored)
└── .gitignore                    # Git ignore rules
```

## Important Security Notes

1. **WALLET_MASTER_KEY**: This is the most critical secret. If lost, you cannot decrypt private keys.
   - Store securely (password manager, secrets manager)
   - Back up in multiple secure locations
   - Never share or commit to git

2. **Database Access**: The `encrypted_private_key` field is hidden from API responses, but database backups contain encrypted keys.
   - Secure database backups
   - Encrypt backups at rest
   - Limit backup access

3. **API Rules**: Default rules restrict users to viewing only their own data.
   - Review rules before making changes
   - Never expose `encrypted_private_key` in view rules

## Troubleshooting

### Issue: Wallet not created on signup

**Symptoms**: User created but wallet fields are empty

**Solutions**:
1. Check PocketBase logs for errors
2. Verify hooks are loaded: `pb_hooks/` should contain `.pb.js` files
3. Check that `externalId` field is being populated from LINE OAuth
4. Ensure `WALLET_MASTER_KEY` is set (check logs for config errors)

### Issue: LINE OAuth not working

**Symptoms**: "Authentication failed" or redirect errors

**Solutions**:
1. Verify LINE Channel ID and Secret
2. Check callback URL matches LINE Developer Console settings
3. Ensure `http://localhost:8090` is in allowed domains (for local testing)
4. Check that scopes match what's configured in LINE Console

### Issue: Cannot decrypt private keys

**Symptoms**: Decryption fails or returns wrong data

**Solutions**:
1. Verify `WALLET_MASTER_KEY` matches the one used during encryption
2. Check wallet version (should be 3)
3. Ensure user ID hasn't changed (used in key derivation)

### Issue: Private key exposed in API

**Symptoms**: `encrypted_private_key` visible in API responses

**Solutions**:
1. Check Users collection view rules
2. Ensure `encrypted_private_key` field has `hidden: true`
3. Update rules to not include sensitive fields

## Production Deployment

### Step 1: Set Up Production Environment

```bash
# Set environment to production
export NODE_ENV=production

# Set strong WALLET_MASTER_KEY (generate new one)
export WALLET_MASTER_KEY=$(openssl rand -hex 32)

# Set production URL
export APP_URL=https://your-domain.com
```

### Step 2: Configure HTTPS

PocketBase supports HTTPS directly:

```bash
./pocketbase serve --https="your-domain.com:443"
```

Or use reverse proxy (nginx, Caddy):

```nginx
# nginx example
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 3: Update LINE OAuth Settings

1. Go to [LINE Developers Console](https://developers.line.me/console/)
2. Update callback URL to production: `https://your-domain.com/api/oauth2-redirect`
3. Add production domain to allowed domains

### Step 4: Database Backups

Set up automated backups:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp -r pb_data backups/pb_data_$DATE
tar -czf backups/pb_data_$DATE.tar.gz backups/pb_data_$DATE
rm -rf backups/pb_data_$DATE
```

Add to crontab:
```
0 2 * * * /path/to/backup.sh
```

### Step 5: Monitoring

- Check PocketBase logs regularly
- Set up alerts for errors
- Monitor disk space (pb_data can grow)
- Set up log rotation

## Next Steps

1. Read [WALLET_SECURITY.md](./WALLET_SECURITY.md) to understand wallet security
2. Review [LINE_OAUTH_SETUP.md](./LINE_OAUTH_SETUP.md) for OAuth details
3. Implement frontend integration (see Frontend Integration section below)

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Start LINE OAuth
async function loginWithLINE() {
  const authMethods = await pb.collection('users').listAuthMethods();
  const lineProvider = authMethods.authProviders.find(
    p => p.name === 'line'
  );
  
  if (!lineProvider) {
    throw new Error('LINE OAuth not configured');
  }
  
  // Redirect to LINE login
  window.location.href = lineProvider.authUrl + 
    encodeURIComponent('http://localhost:3000/auth/callback');
}

// Handle OAuth callback
async function handleCallback(code: string, state: string) {
  const authData = await pb.collection('users').authWithOAuth2(
    'line',
    code,
    state,
    'http://localhost:3000/auth/callback'
  );
  
  // User is now logged in
  console.log('User:', authData.record);
  console.log('Wallet:', authData.record.wallet_address);
}

// Get current user
function getCurrentUser() {
  return pb.authStore.model;
}

// Logout
function logout() {
  pb.authStore.clear();
}
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review PocketBase documentation: https://pocketbase.io/docs/
3. Check LINE Login documentation: https://developers.line.biz/
4. See [WALLET_SECURITY.md](./WALLET_SECURITY.md) for security questions

## License

This project is part of the eggo-pocketbase system.

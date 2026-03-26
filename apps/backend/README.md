# Eggo-PB

PocketBase backend for eggo with LINE OAuth authentication and automatic wallet generation.

## Features

- 🔐 **LINE OAuth Integration**: Seamless login with LINE accounts
- 💰 **Automatic Wallet Creation**: EVM-compatible wallets generated on signup
- 🔒 **Encrypted Private Keys**: Web3 Secret Storage v3 format for maximum security
- 📱 **Mobile Ready**: Works with LINE mobile app
- 🔧 **Easy Setup**: Complete documentation and examples

## Quick Start

```bash
# 1. Download PocketBase
curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_macOS_arm64.zip -o pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase

# 2. Set up environment
cp .env.example .env
# Edit .env with your LINE credentials

# 3. Import collection schema
# Start PocketBase and import collections/users.json via Admin UI

# 4. Configure LINE OAuth
# See docs/LINE_OAUTH_SETUP.md for detailed steps

# 5. Start the server
./pocketbase serve --http="0.0.0.0:8090"
```

Visit http://localhost:8090/_/ for the Admin UI.

## Documentation

- [SETUP.md](docs/SETUP.md) - Complete setup guide
- [LINE_OAUTH_SETUP.md](docs/LINE_OAUTH_SETUP.md) - LINE OAuth configuration
- [WALLET_SECURITY.md](docs/WALLET_SECURITY.md) - Wallet security & private key handling

## Project Structure

```
eggo-pb/
├── pocketbase                      # PocketBase binary
├── pb_hooks/                       # JavaScript hooks
│   ├── 00-config.pb.js            # Environment configuration
│   ├── 01-create-wallet.pb.js     # Wallet creation on signup
│   └── 99-debug.pb.js             # Debug utilities
├── collections/
│   └── users.json                 # Users collection schema
├── docs/                          # Documentation
│   ├── SETUP.md
│   ├── LINE_OAUTH_SETUP.md
│   └── WALLET_SECURITY.md
├── pb_data/                       # Database files (gitignored)
├── pb_public/                     # Static files
└── pb_migrations/                 # Database migrations
```

## Security

- Private keys are **encrypted** using Web3 Secret Storage v3 format
- Encryption key derived from `WALLET_MASTER_KEY` environment variable
- Sensitive fields hidden from API responses
- See [WALLET_SECURITY.md](docs/WALLET_SECURITY.md) for details

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LINE_CHANNEL_ID` | Yes | LINE Login Channel ID |
| `LINE_CHANNEL_SECRET` | Yes | LINE Login Channel Secret |
| `WALLET_MASTER_KEY` | Yes | Encryption key for private keys (32+ chars) |
| `APP_URL` | No | Application URL (default: http://localhost:8090) |
| `NODE_ENV` | No | Environment (development/production) |

## API Endpoints

### Authentication

```javascript
// List auth methods (including LINE OAuth)
GET /api/collections/users/auth-methods

// OAuth callback (handled automatically by PocketBase)
GET /api/oauth2-redirect
```

### Health Check

```bash
GET /api/health
```

### Debug (Development Only)

```bash
GET /api/debug/info
POST /api/debug/test-wallet
```

## User Fields

| Field | Type | Description |
|-------|------|-------------|
| `externalId` | text | LINE user ID (required) |
| `name` | text | Display name from LINE |
| `avatar` | file | Profile image from LINE |
| `email` | email | Email from LINE (if available) |
| `wallet_address` | text | Wallet public address (0x...) |
| `encrypted_private_key` | text | **Encrypted** private key (Web3 format) |
| `publicKey` | text | Public key |
| `wallet_version` | number | Wallet format version (3) |

## Wallet Creation Flow

1. User clicks "Login with LINE"
2. LINE OAuth redirects back to PocketBase
3. PocketBase creates user record
4. `onRecordCreate` hook triggers for "users" collection
5. Hook generates new EVM wallet (address + private key)
6. Private key encrypted with Web3 Secret Storage v3
7. Encrypted data stored in `encrypted_private_key` field
8. Wallet address stored in `wallet_address` field
9. User is now logged in with wallet ready to use

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Start LINE OAuth
async function loginWithLINE() {
  const authMethods = await pb.collection('users').listAuthMethods();
  const lineProvider = authMethods.authProviders.find(p => p.name === 'line');
  
  localStorage.setItem('pb_oauth_code_verifier', lineProvider.codeVerifier);
  window.location.href = lineProvider.authUrl + encodeURIComponent('http://localhost:3000/auth/callback');
}

// Handle OAuth callback
async function handleCallback(code: string, state: string) {
  const codeVerifier = localStorage.getItem('pb_oauth_code_verifier');
  
  const authData = await pb.collection('users').authWithOAuth2Code(
    'line',
    code,
    codeVerifier,
    state,
    'http://localhost:3000/auth/callback'
  );
  
  console.log('Wallet address:', authData.record.wallet_address);
  // Note: encrypted_private_key is never exposed to frontend
}
```

## Troubleshooting

### Wallet not created

Check PocketBase logs:
```bash
./pocketbase serve --http="0.0.0.0:8090" 2>&1 | tee pocketbase.log
```

### LINE OAuth not working

1. Verify Channel ID and Secret
2. Check callback URL in LINE Console matches exactly
3. Ensure `externalId` field is mapped correctly

See [SETUP.md](docs/SETUP.md) for detailed troubleshooting.

## Development

### Adding New Hooks

1. Create file in `pb_hooks/` with `.pb.js` extension
2. Hooks are loaded alphabetically (00-, 01-, 99-)
3. Restart PocketBase to reload hooks

### Testing

```bash
# Run health check
curl http://localhost:8090/api/health

# Test wallet creation (dev only)
curl -X POST http://localhost:8090/api/debug/test-wallet
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Generate new `WALLET_MASTER_KEY`: `openssl rand -hex 32`
3. Use HTTPS: `./pocketbase serve --https="your-domain.com:443"`
4. Update LINE Console with production callback URL
5. Set up automated database backups
6. Monitor logs regularly

See [SETUP.md](docs/SETUP.md) for complete production checklist.

## License

This project is part of the eggo-pocketbase system.

## Support

For issues:
1. Check documentation in `docs/`
2. Review [SETUP.md](docs/SETUP.md) troubleshooting section
3. Check PocketBase logs

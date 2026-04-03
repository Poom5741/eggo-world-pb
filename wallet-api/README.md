# Wallet API v2.0.0 - DACC Wallet Generation Service

**Runtime:** Bun + TypeScript + Express  
**Library:** dacc-js v0.0.5  
**Port:** 3001

---

## Overview

Wallet API generates DACC-compatible wallets for user accounts. Called by PocketBase hook `01-create-wallet.pb.js` on user signup via LINE OAuth.

**Migration:** v1.0.0 (ethers v6) → v2.0.0 (dacc-js v0.0.5)

---

## Quick Start

### Local Development

```bash
cd wallet-api
bun install
bun run dev
```

Verify:

```bash
curl http://localhost:3001/health
# {"status":"OK","service":"wallet-api","version":"2.0.0"}
```

### Production Deployment

```bash
# Build
bun build src/index.ts --outdir dist --target bun

# Run
bun dist/index.js
```

---

## API Endpoints

### POST /api/wallet/create

Create DACC wallet with password.

**Request:**

```json
{
  "passwordSecretkey": "SecurePass123!",
  "publicEncryption": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "daccPublickey": "daccPublickey_abc123..."
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "message": "passwordSecretkey must be 12-120 characters",
    "code": "VALIDATION_ERROR"
  }
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2026-04-02T18:00:00.000Z",
  "service": "wallet-api",
  "version": "2.0.0"
}
```

---

## Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Security
MIN_PASSWORD_LENGTH=12
MAX_PASSWORD_LENGTH=120
PUBLIC_ENCRYPTION=false

# CORS
CORS_ORIGIN=*

# DACC Network
DATA_STORAGE_NETWORK=opSepolia
```

---

## Integration Flow

```
User signs up via LINE OAuth
         ↓
PocketBase creates user record
         ↓
01-create-wallet.pb.js hook triggers
         ↓
Hook generates 20-char random passwordSecretkey
         ↓
Hook calls: POST http://wallet-api:3001/api/wallet/create
         ↓
Wallet API creates DACC wallet via dacc-js
         ↓
Wallet API returns: { address, daccPublickey }
         ↓
Hook saves to user record:
  - wallet: address
  - pin: passwordSecretkey
  - daccPublickey: daccPublickey
```

---

## Key Changes from v1.0.0

| Aspect          | v1.0.0 (ethers)                               | v2.0.0 (dacc-js)                          |
| --------------- | --------------------------------------------- | ----------------------------------------- |
| Library         | ethers v6                                     | dacc-js v0.0.5                            |
| Runtime         | Node.js 18                                    | Bun 1.x                                   |
| Language        | JavaScript                                    | TypeScript                                |
| Wallet Type     | EVM (Ethereum-compatible)                     | DACC (Decentralized Data Chain)           |
| Response Fields | `address`, `publicKey`, `encryptedPrivateKey` | `address`, `daccPublickey`                |
| Password        | Auto-generated XOR encrypted                  | User-provided (12-120 chars)              |
| Request Format  | `{ userId }`                                  | `{ passwordSecretkey, publicEncryption }` |

---

## Testing

### Manual Test

```bash
# Create wallet
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "passwordSecretkey": "TestPassword123!",
    "publicEncryption": false
  }'

# Expected response:
# {"success":true,"data":{"address":"0x...","daccPublickey":"daccPublickey_..."}}
```

### Health Check

```bash
curl http://localhost:3001/health
```

---

## Deployment Checklist

- [ ] Set `MIN_PASSWORD_LENGTH=12` (security)
- [ ] Set `MAX_PASSWORD_LENGTH=120` (security)
- [ ] Configure `CORS_ORIGIN` for production domain
- [ ] Set `DATA_STORAGE_NETWORK` (opSepolia for testnet)
- [ ] Enable HTTPS in production
- [ ] Monitor wallet-api logs for errors
- [ ] Test wallet creation flow end-to-end

---

## Troubleshooting

### "passwordSecretkey must be 12-120 characters"

**Cause:** Password validation failed  
**Fix:** Ensure password is 12-120 characters with mixed case, numbers, special chars

### "Connection refused" from PocketBase

**Cause:** wallet-api not running or wrong URL  
**Fix:**

1. Check `docker ps | grep wallet-api`
2. Verify `WALLET_SRV_URL=http://wallet-api:3001` in PocketBase env
3. Test health endpoint: `curl http://localhost:3001/health`

### TypeScript compilation errors

**Cause:** Missing dependencies or wrong Bun version  
**Fix:**

```bash
bun install
bun run tsc --noEmit
```

---

## Architecture

```
wallet-api/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── env.ts                # Type-safe environment variables
│   └── routes/
│       └── createWallet.ts   # Wallet creation endpoint
├── package.json              # Dependencies (dacc-js, express, etc.)
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## Security Notes

- **NEVER** commit `.env` with real secrets
- **ALWAYS** use HTTPS in production
- **Rotate** passwords if compromised
- **Monitor** for unusual wallet creation patterns

---

**Last Updated:** 2026-04-02  
**Version:** 2.0.0  
**Status:** ✅ Deployed to production

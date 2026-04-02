---
phase: 04-line-wallet-integration
plan: 01
subsystem: wallet-api
tags:
  - typescript
  - dacc-js
  - migration
  - bun
dependency_graph:
  requires: []
  provides:
    - TypeScript wallet API with dacc-js v0.0.5
    - POST /api/wallet/create endpoint
    - GET /health endpoint
  affects:
    - apps/backend/pb_hooks/01-create-wallet.pb.js (future update needed)
tech_stack:
  added:
    - dacc-js@^0.0.5
    - typescript@^5.3.3
    - bun-types@latest
    - helmet@^7.1.0
  removed:
    - ethers@^6.9.0
  patterns:
    - Express + Bun runtime
    - Type-safe environment variables
    - ES modules (type: "module")
key_files:
  created:
    - wallet-api/package.json (v2.0.0 with dacc-js dependencies)
    - wallet-api/tsconfig.json (Bun-compatible TypeScript config)
    - wallet-api/.env.example (environment template)
    - wallet-api/src/index.ts (Express server entry point)
    - wallet-api/src/env.ts (type-safe env variables)
    - wallet-api/src/routes/createWallet.ts (wallet creation endpoint)
  modified:
    - wallet-api/bun.lock (updated dependencies)
  deprecated:
    - wallet-api/server.js (JavaScript + ethers v6 version)
decisions:
  D-01: Use dacc-js v0.0.5 instead of ethers v6 for wallet creation
  D-03: Migrate to TypeScript + Express + Bun runtime
  D-07: Keep endpoint as /api/wallet/create (backward compatible)
metrics:
  duration: ~5 minutes
  completed: "2026-04-03T00:41:00Z"
  tasks_completed: 2/2
  files_created: 6
  lines_added: 342
---

# Phase 04 Plan 01: TypeScript + dacc-js Migration Summary

**One-liner:** Migrated wallet-api from JavaScript + ethers v6 to TypeScript + dacc-js v0.0.5 with Express + Bun runtime, maintaining backward-compatible endpoint at POST /api/wallet/create.

## Executive Summary

Successfully migrated wallet-api from JavaScript (ethers v6) to TypeScript (dacc-js v0.0.5) as per decisions D-01, D-03, and D-07. The new implementation matches the reference structure from `resources/pkbase-wallet/wallet-srv/` while maintaining backward compatibility with existing PocketBase hooks.

## What Was Built

### 1. TypeScript Project Structure (Task 1)

**package.json** - Updated to v2.0.0 (major bump for breaking change):

- Runtime: Bun (`type: "module"`)
- Dependencies: dacc-js@^0.0.5, express@^4.18.2, cors@^2.8.5, helmet@^7.1.0, dotenv@^16.3.1
- DevDependencies: typescript@^5.3.3, bun-types, @types/express, @types/cors, @types/node
- Scripts: `dev` (bun --watch), `start`, `build`, `test`

**tsconfig.json** - Bun-compatible configuration:

- Target: ES2022, Module: ESNext, ModuleResolution: bundler
- Strict mode enabled, path aliases (@/\*)
- No emit (runtime compilation via Bun)

**.env.example** - Environment template:

- PORT, CORS_ORIGIN, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH
- PUBLIC_ENCRYPTION, DATA_STORAGE_NETWORK

### 2. TypeScript Wallet Routes (Task 2)

**src/index.ts** - Express server entry point:

- Middleware: helmet(), cors(), express.json()
- Health endpoint: GET /health (returns status, timestamp, service, version)
- Router: /api/wallet (backward compatible, NOT /api/v1/wallet)
- Error handling middleware and 404 handler

**src/env.ts** - Type-safe environment variables:

- Centralized env config with parseInt defaults
- Exports: PORT, CORS_ORIGIN, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, etc.

**src/routes/createWallet.ts** - Wallet creation endpoint:

- POST /api/wallet/create: validates passwordSecretkey (12-120 chars)
- Uses `createDaccWallet()` from dacc-js
- Returns: `{ success: true, data: { address, daccPublickey } }`
- GET /api/wallet/create-info: returns wallet creation metadata

## Breaking Changes from v1 (ethers) to v2 (dacc-js)

| Field                 | v1 (ethers)               | v2 (dacc-js)   | Notes                              |
| --------------------- | ------------------------- | -------------- | ---------------------------------- |
| `address`             | ✅ Same format            | ✅ Same format | EVM-compatible address             |
| `publicKey`           | ✅ 66-char hex            | ❌ Removed     | Not provided by dacc-js            |
| `encryptedPrivateKey` | ✅ Object with ciphertext | ❌ Removed     | DACC handles encryption internally |
| `daccPublickey`       | ❌ Not present            | ✅ New field   | DACC-specific public key           |
| `version`             | ✅ 3                      | ❌ Removed     | No longer needed                   |

**Migration impact:**

- Existing PocketBase hook (`01-create-wallet.pb.js`) needs updates to:
  - Send `passwordSecretkey` instead of `userId`
  - Save `daccPublickey` field (new)
  - Remove `encryptedPrivateKey` handling
  - Update user collection schema to add `pin` and `daccPublickey` fields

## Dependencies Installed

```json
{
  "dependencies": {
    "dacc-js": "^0.0.5", // NEW - replaces ethers
    "express": "^4.18.2", // KEPT
    "cors": "^2.8.5", // KEPT
    "helmet": "^7.1.0", // NEW - security headers
    "dotenv": "^16.3.1" // KEPT
  },
  "devDependencies": {
    "typescript": "^5.3.3", // NEW
    "bun-types": "latest", // NEW - Bun type definitions
    "@types/express": "^4.17.21", // NEW
    "@types/cors": "^2.8.17", // NEW
    "@types/node": "^20.10.5" // NEW
  }
}
```

## How to Test the New Endpoint Manually

### 1. Start the wallet API server

```bash
cd wallet-api
bun run dev
```

Expected output:

```
🚀 Wallet API Server running on port 3001
📊 Health check: http://localhost:3001/health
🔧 Environment: development
```

### 2. Test health endpoint

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2026-04-03T00:41:00.000Z",
  "service": "wallet-api",
  "version": "2.0.0"
}
```

### 3. Test wallet creation

```bash
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "passwordSecretkey": "auto-generated-20-char-random-password"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "daccPublickey": "0x..."
  }
}
```

### 4. Test validation (password too short)

```bash
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "passwordSecretkey": "short"
  }'
```

Expected response:

```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 12 characters long",
    "code": "PASSWORD_TOO_SHORT"
  }
}
```

## Commits

- `cc4e47d`: feat(04-01): set up TypeScript + Bun project structure
- `e37f62f`: feat(04-01): create TypeScript wallet routes with dacc-js

## Verification Checklist

- [x] TypeScript compiles without errors (`bun run tsc --noEmit`)
- [x] Dependencies installed (dacc-js, express, cors, helmet, typescript, bun-types)
- [x] POST /api/wallet/create endpoint exists and accepts passwordSecretkey
- [x] GET /health endpoint exists and returns service status
- [x] Response format: `{ success: true, data: { address, daccPublickey } }`
- [x] Backward compatible path: /api/wallet/create (NOT /api/v1/wallet/create)
- [x] Type-safe environment variables via src/env.ts
- [x] ES modules configured (type: "module" in package.json)
- [x] Bun runtime configured (--watch for dev, build target bun)

## Known Stubs

None - all functionality implemented.

## Next Steps (Phase 04-02)

1. Update user collection schema to add `pin` and `daccPublickey` fields
2. Update `01-create-wallet.pb.js` hook to:
   - Generate 20-char random passwordSecretkey
   - Call wallet API with `{ passwordSecretkey }`
   - Save `wallet`, `pin`, `daccPublickey` to user record
3. Test end-to-end: LINE signup → wallet creation → verify fields saved
4. Deploy wallet-api to production

---

**Phase:** 04-line-wallet-integration  
**Plan:** 01  
**Status:** ✅ Complete  
**Date:** 2026-04-03

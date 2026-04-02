# Codebase Concerns

**Analysis Date:** 2026-04-02

## Security Concerns

### CRITICAL: Hardcoded Secrets in Committed Files

**Issue:** Sensitive credentials are committed to git in `.env` files despite being in `.gitignore`

**Files:**
- `eggo-pb/.env` - Contains LINE OAuth secrets, wallet encryption keys, admin credentials
- `wallet-srv/.env` - Contains server configuration
- `contracts/.env.local` - Contains private keys for deployment

**Impact:** 
- LINE_CHANNEL_SECRET exposed: `4ede94afa7d59b71ffda15a136ffddea`
- Wallet master key exposed: `development_key_change_in_production_32_chars_min`
- Admin password exposed: `admin123456`
- Deployment private key exposed in contracts/.env.local

**Fix approach:**
1. Immediately rotate all exposed secrets (LINE OAuth, wallet keys, admin passwords)
2. Add `.env` files to `.gitignore` at root level (currently only ignores `**/.env` which may not catch all cases)
3. Remove secrets from git history using `git filter-branch` or BFG Repo-Cleaner
4. Use environment variable injection in Docker Compose instead of `.env` files

### CRITICAL: Insecure Random Number Generation for Secrets

**Issue:** Using `Math.random()` for generating passwords and cryptographic secrets

**Files:**
- `apps/backend/pb_hooks/01-create-wallet.pb.js:16` - Password generation
- `apps/backend/pb_hooks/02-legacy-api-compat.pb.js:29` - Password generation
- `apps/backend/pb_hooks/07-register-user.pb.js:170` - Password generation
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js:161` - Rarity seed
- `apps/backend/pb_hooks/15-mint-food-nft.pb.js:175` - Random rewards
- `apps/backend/pb_hooks/18-breed-animals.pb.js:233` - Rarity seed

**Impact:** `Math.random()` is not cryptographically secure. Generated passwords can potentially be predicted, compromising user wallet security.

**Fix approach:**
```javascript
// Replace Math.random() with crypto.getRandomValues()
const crypto = require('crypto');
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
let password = "";
const randomBytes = crypto.randomBytes(20);
for (let i = 0; i < 20; i++) {
  password += charset.charAt(randomBytes[i] % charset.length);
}
```

### HIGH: Weak Encryption for Private Keys

**Issue:** Wallet API uses XOR encryption instead of proper AES encryption

**Files:**
- `wallet-api/server.js:87-100` - `encryptPrivateKey()` function

**Code:**
```javascript
// Simple XOR encryption for demo
// In production, use proper AES encryption
const keyHash = ethers.id(key);
const keyHex = keyHash.slice(2, 66); // 32 bytes
// ... XOR loop
```

**Impact:** XOR encryption is trivially breakable. If attacker gains access to encrypted private keys, they can decrypt them without the master key.

**Fix approach:** Use `ethers.Wallet.encrypt()` with proper passphrase (Web3 Secret Storage v3 format) or Node.js `crypto.createCipheriv()` with AES-256-GCM.

### HIGH: Password Returned in API Response

**Issue:** Auth endpoint returns plaintext password in response

**Files:**
- `apps/backend/pb_hooks/05-auth-token.pb.js:103`

**Code:**
```javascript
return c.json(200, {
    success: true,
    user: { ... },
    password: password  // SECURITY RISK
});
```

**Impact:** Passwords transmitted in API responses can be intercepted via MITM attacks, logged by proxies, or exposed in browser dev tools.

**Fix approach:** Never return passwords in API responses. Use PocketBase's built-in authentication flow with tokens only.

### HIGH: Missing Input Validation Before Blockchain Operations

**Issue:** Wallet API endpoints accept unvalidated input for blockchain transactions

**Files:**
- `wallet-api/server.js:185-290` - Multiple endpoints with `// TODO: Implement actual contract interaction`

**Impact:** Unvalidated inputs can lead to:
- Invalid contract calls
- Reentrancy vulnerabilities if connected to real contracts
- Loss of funds from malformed transactions

**Fix approach:** Implement Zod schemas for all request validation:
```typescript
const mintEggSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  daccPublicKey: z.string(),
  pin: z.string().min(12).max(120),
  referralChain: z.array(z.string()).optional(),
  eggNftAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
```

### MEDIUM: CORS Allow All Origins

**Issue:** Wallet API allows all CORS origins

**Files:**
- `wallet-srv/.env` - `CORS_ORIGIN=*`
- `docker-compose.yml:36` - No CORS restriction

**Impact:** Any website can make requests to the wallet API, enabling CSRF attacks.

**Fix approach:** Set specific allowed origins:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
}));
```

### MEDIUM: Debug Endpoints in Production

**Issue:** Debug hooks may expose sensitive information

**Files:**
- `apps/backend/pb_hooks/04-debug-request.pb.js`
- `apps/backend/pb_hooks/99-debug.pb.js`

**Fix approach:** Remove or disable debug endpoints in production via environment flag:
```javascript
if (process.env.NODE_ENV === 'production') {
  return; // Don't register debug endpoints
}
```

### MEDIUM: Hardcoded Recipient Wallet Address

**Issue:** Frontend contains hardcoded wallet address

**Files:**
- `apps/web/components/wallet-modal.tsx:12`

**Code:**
```typescript
const RECIPIENT_WALLET = '0xdEf0d71cD65aCFfD54fdf03B0128E14f8d97a60e'
```

**Impact:** Hardcoded addresses can be a target for social engineering or indicate backdoor.

**Fix approach:** Move to environment variable: `NEXT_PUBLIC_RECIPIENT_WALLET`

## Technical Debt

### HIGH: Build Artifacts Committed to Git

**Issue:** `.next/` build directory is committed despite being in `.gitignore`

**Files:**
- `apps/web/.next/` - 200+ lines of build artifacts present
- `.gitignore` includes `**/.next/` but directory still exists in repo

**Impact:** 
- Bloated repository size
- Merge conflicts from build artifacts
- Confusion about what's source vs generated

**Fix approach:**
1. Remove from git: `git rm -r --cached apps/web/.next`
2. Add to root `.gitignore`: `apps/web/.next/`
3. Commit and push

### HIGH: PocketBase Binary Should Not Be Committed

**Issue:** PocketBase binary may be committed (32MB)

**Files:** Check `apps/backend/pb_data/` or root for `pocketbase` binary

**Impact:** Large binary files bloat git history.

**Fix approach:** Download script in setup (already exists in `setup.sh`), ensure binary is in `.gitignore`.

### MEDIUM: Incomplete Blockchain Integration

**Issue:** Wallet API has mock transaction responses instead of real blockchain calls

**Files:**
- `wallet-api/server.js:185` - `// TODO: Implement actual contract interaction with ethers`
- `wallet-api/server.js:219` - Same
- `wallet-api/server.js:254` - Same
- `wallet-api/server.js:290` - Same

**Endpoints affected:**
- `POST /api/wallet/mint-egg`
- `POST /api/wallet/claim-commission`
- `POST /api/wallet/mint-food`
- `POST /api/wallet/feed-egg`

**Impact:** System cannot actually interact with blockchain. All NFT operations return fake transaction hashes.

**Fix approach:** Implement actual ethers.js contract interactions with proper signer management.

### MEDIUM: No Rate Limiting on API Endpoints

**Issue:** No rate limiting on authentication or wallet endpoints

**Files:**
- `wallet-api/server.js` - Express app with no rate limiting
- `apps/backend/pb_hooks/*.pb.js` - PocketBase hooks with no rate limiting

**Impact:** Vulnerable to brute force attacks, DDoS, and resource exhaustion.

**Fix approach:** Add `express-rate-limit` to wallet API and PocketBase middleware for hooks.

### MEDIUM: Missing Health Checks in Production

**Issue:** Health checks only configured for wallet-srv in Docker Compose

**Files:**
- `docker-compose.yml:42-47` - Health check for wallet-srv only

**Impact:** No automated health monitoring for PocketBase or nginx.

**Fix approach:** Add health checks for all services.

## Performance Bottlenecks

### MEDIUM: Excessive Console Logging

**Issue:** 110+ console.log statements in PocketBase hooks

**Files:**
- `apps/backend/pb_hooks/*.pb.js` - 110 console.log/error calls

**Impact:** 
- Log flooding in production
- Performance overhead from string interpolation
- Potential exposure of sensitive data in logs

**Fix approach:** Implement structured logging with log levels:
```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const log = (level, ...args) => {
  if (['error', 'warn', 'info', 'debug'].indexOf(level) <= 
      ['error', 'warn', 'info', 'debug'].indexOf(LOG_LEVEL)) {
    console[level](...args);
  }
};
```

### MEDIUM: No Database Indexing Strategy Documented

**Issue:** No documentation on database indexes for PocketBase collections

**Files:**
- `apps/backend/pb_migrations/` - Migrations exist but no index optimization

**Impact:** Queries on `email`, `wallet`, `referral_chain` may be slow as user base grows.

**Fix approach:** Add indexes for frequently queried fields in migrations.

### LOW: Large Hook Files

**Issue:** Some hook files exceed 300 lines

**Files:**
- `apps/backend/pb_hooks/18-breed-animals.pb.js` - 349 lines
- `apps/backend/pb_hooks/19-hatch-egg.pb.js` - 299 lines
- `apps/backend/pb_hooks/17-upgrade-egg-rarity.pb.js` - 272 lines

**Impact:** Hard to maintain, test, and review.

**Fix approach:** Extract helper functions into shared modules.

## Scalability Issues

### HIGH: Single PocketBase Instance Architecture

**Issue:** Monolithic PocketBase instance handles all backend logic

**Files:**
- `docker-compose.yml` - Single pocketbase service

**Impact:**
- No horizontal scaling for PocketBase (single-state design)
- All hooks run synchronously
- Database becomes bottleneck

**Fix approach:** Consider migrating to stateless API architecture with separate database for write scaling.

### MEDIUM: No Caching Layer

**Issue:** No Redis or caching for frequently accessed data

**Files:** No cache configuration in codebase

**Impact:** Repeated database queries for:
- User wallet lookups
- NFT metadata
- Commission calculations

**Fix approach:** Add Redis caching for read-heavy operations.

### MEDIUM: Synchronous External API Calls

**Issue:** Wallet-srv HTTP calls are synchronous and blocking

**Files:**
- `apps/backend/pb_hooks/01-create-wallet.pb.js:33` - `$http.send()`

**Impact:** External service latency directly impacts user experience.

**Fix approach:** Implement async job queue (Bull/BullMQ) for non-critical operations.

## Maintenance Risks

### HIGH: Sequential Hook Numbering Creates Merge Conflicts

**Issue:** Hook files use sequential numbering (`01-`, `02-`, `03-`...)

**Files:**
- `apps/backend/pb_hooks/01-create-wallet.pb.js`
- `apps/backend/pb_hooks/02-legacy-api-compat.pb.js`
- ... through `19-hatch-egg.pb.js`

**Impact:** Multiple developers adding hooks will cause constant merge conflicts when renumbering.

**Fix approach:** Use timestamp-based or feature-based naming:
- `20240402-create-wallet.pb.js`
- `user-wallet-creation.pb.js`

### MEDIUM: TypeScript Build Errors Ignored

**Issue:** Next.js config ignores TypeScript errors

**Files:**
- `apps/web/next.config.mjs:4` - `ignoreBuildErrors: true`

**Impact:** Type errors can be deployed to production, leading to runtime failures.

**Fix approach:** Remove `ignoreBuildErrors` and fix type errors.

### MEDIUM: No API Versioning

**Issue:** API endpoints have no versioning

**Files:**
- `wallet-api/server.js` - `/api/wallet/create`
- `apps/backend/pb_hooks/` - `/api/auth/line-user`

**Impact:** Breaking changes require coordinated deployment of frontend and backend.

**Fix approach:** Version APIs: `/api/v1/wallet/create`

## Missing Documentation

### HIGH: No API Documentation

**Issue:** No OpenAPI/Swagger spec or API documentation

**Files:** No `docs/api/` or `openapi.yaml`

**Impact:** Developers must read source code to understand API contracts.

**Fix approach:** Add OpenAPI spec for wallet-api and PocketBase endpoints.

### MEDIUM: No Runbook for Production Deployment

**Issue:** `LOCAL_DEV_SETUP.md` exists but no production deployment guide

**Files:**
- `LOCAL_DEV_SETUP.md` - Development only
- `docs/DEPLOYMENT.md` - Only for contracts

**Impact:** Ad-hoc deployment process prone to errors.

**Fix approach:** Create comprehensive production deployment guide including:
- Environment variable checklist
- Secret rotation procedures
- Monitoring setup
- Rollback procedures

### MEDIUM: No Architecture Decision Records (ADRs)

**Issue:** No documentation of key architectural decisions

**Impact:** Future developers won't understand why certain patterns were chosen.

**Fix approach:** Create `docs/adr/` directory with ADRs for:
- PocketBase selection
- LINE OAuth integration
- Wallet encryption approach
- EIP-7702 implementation

## Dependency Risks

### MEDIUM: Express.js 4.x Security

**Issue:** Wallet API uses Express 4.18.2 which has known vulnerabilities

**Files:**
- `wallet-api/package.json` - `"express": "^4.18.2"`

**Impact:** Vulnerable to CVE-2024-29041 and other Express vulnerabilities.

**Fix approach:** Update to Express 5.x or apply security patches.

### MEDIUM: Single Points of Failure

**Issue:** Dependencies on external services without fallbacks

**Files:**
- LINE OAuth - No fallback authentication
- PocketBase - No read replica
- Blockchain RPC - No fallback providers

**Fix approach:** Implement circuit breakers and fallback providers.

## Test Coverage Gaps

### HIGH: No Integration Tests for Backend Hooks

**Issue:** Only 3 test files in web app, no backend hook tests

**Files:**
- `apps/web/app/auth/` - 3 test files
- `apps/backend/pb_hooks/` - 0 test files

**Impact:** Backend logic changes can break authentication, wallet creation, and NFT operations undetected.

**Fix approach:** Add Jest/Bun test suite for critical hooks:
- `01-create-wallet.pb.js`
- `05-auth-token.pb.js`
- `07-register-user.pb.js`

### HIGH: No Tests for Wallet Encryption

**Issue:** Encryption logic in wallet-api is untested

**Files:**
- `wallet-api/server.js` - `encryptPrivateKey()` untested

**Impact:** Encryption bugs could lead to permanent loss of user funds.

**Fix approach:** Add unit tests for encryption/decryption round-trips.

### MEDIUM: No E2E Tests

**Issue:** No end-to-end tests for critical user flows

**Impact:** User journey breaks (signup → wallet creation → NFT mint) can go undetected.

**Fix approach:** Add Playwright/Cypress E2E tests for:
- LINE OAuth flow
- Wallet creation
- NFT minting flow

---

*Concerns audit: 2026-04-02*

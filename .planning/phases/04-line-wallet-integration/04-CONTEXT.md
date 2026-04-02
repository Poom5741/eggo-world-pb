# Phase 4: LINE Wallet Integration - Context

**Gathered:** 2026-04-03  
**Status:** Ready for planning — integration decisions captured

<domain>
## Phase Boundary

Integrate DACC wallet creation from pkbase-wallet reference into existing LINE OAuth flow, replacing or augmenting current ethers-based wallet API.

**Scope anchor:** Wallet service migration (ethers → dacc-js), PocketBase hook updates, LINE OAuth flow enhancement. Testing & Launch (original Phase 4 in roadmap) is deferred to Phase 5.

**Note on phase numbering:** ROADMAP.md Phase 4 is "Testing & Launch", but this phase captures the LINE Wallet Integration work that was requested by the user and is needed before testing/launch.

</domain>

<decisions>
## Implementation Decisions

### Wallet Technology Choice

- **D-01:** Use **dacc-js v0.0.5** instead of ethers v6 for wallet creation
  - Rationale: Reference implementation uses DACC, provides decentralized storage features
  - Impact: Wallet format changes from EVM-compatible to DACC-specific format
  - Fields: `address`, `daccPublickey` (instead of `publicKey`, `encryptedPrivateKey`)

### Password Management

- **D-02:** Keep **auto-generated passwords** (20-char random) instead of user-provided
  - Better UX — users don't need to remember/manage passwords
  - Generated in PocketBase hook, sent to wallet API
  - Stored as `pin` field in user record

### API Structure

- **D-03:** Migrate wallet API to **TypeScript + Express + Bun runtime** (match reference)
  - Current: JavaScript with ethers v6
  - Target: TypeScript with dacc-js v0.0.5
  - Endpoint: Keep `/api/wallet/create` (not `/api/v1/wallet/create`) for backward compatibility

### Wallet Fields

- **D-04:** User record fields to save:
  - `wallet` (text) — wallet address ✅ Already exists
  - `pin` (text) — passwordSecretkey (auto-generated 20-char) ❓ Need to verify exists
  - `daccPublickey` (text) — DACC public key ❓ Need to verify exists

### LINE OAuth Flow

- **D-05:** Keep existing LINE OAuth initiation (built-in PocketBase OIDC provider)
  - Current flow works — no changes needed to `/auth/line` or `/auth/callback`
  - Enhancement: Consider custom redirect.html from reference for better UX (deferred)

### Hook Structure

- **D-06:** Update `01-create-wallet.pb.js` to:
  - Generate 20-char random passwordSecretkey before calling wallet API
  - Call wallet API with `{ passwordSecretkey, publicEncryption: false }`
  - Save response: `wallet`, `pin`, `daccPublickey` to user record
  - Keep existing hook structure and authentication pattern

### Backward Compatibility

- **D-07:** Support both wallet types during migration:
  - New users: DACC wallets via dacc-js
  - Existing users: Keep ethers wallets, add migration path later
  - Wallet API version field to distinguish wallet types

### Migration Approach

- **D-08:** Phased migration:
  - Phase 4A: TypeScript migration (no logic changes)
  - Phase 4B: Add DACC support alongside ethers
  - Phase 4C: LINE OAuth redirect enhancement (optional)
  - Phase 4D: Deprecate ethers wallets (future phase)

### OpenCode's Discretion

- Exact TypeScript project structure (use reference `wallet-srv/src/` as template)
- Error handling improvements from reference (enhanced byte array conversion)
- Password validation rules (12-120 chars from reference, but auto-gen is 20)
- Testing strategy (unit tests for wallet creation, integration tests with PocketBase)

### Folded Todos

- None — todos will be created during plan phase after context is captured

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wallet Integration

- `resources/pkbase-wallet/wallet-srv/src/index.ts` — Reference wallet service implementation with dacc-js, TypeScript, Express, Bun
- `resources/pkbase-wallet/wallet-srv/package.json` — Dependencies (dacc-js v0.0.5, express, cors, helmet)
- `resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js` — Reference PocketBase hook for wallet creation
- `wallet-api/server.js` — Current wallet API implementation (ethers v6, to be migrated)
- `apps/backend/pb_hooks/01-create-wallet.pb.js` — Current PocketBase wallet creation hook

### LINE OAuth

- `apps/backend/pb_hooks/05-auth-token.pb.js` — Current LINE OAuth token exchange hook
- `apps/web/app/auth/` — Current frontend auth pages (login, signup, callback, line)
- `apps/web/middleware.ts` — Edge auth middleware with LINE OAuth redirect

### Backend Architecture

- `apps/backend/AGENTS.md` — PocketBase conventions, hook patterns, response format
- `wallet-api/AGENTS.md` — Wallet API conventions, encryption patterns, endpoint structure
- `docs/00-architecture.md` — System architecture, component relationships
- `docs/02-decisions.md` — ADR-001 (PocketBase), ADR-004 (BSC network)

### User Schema

- `apps/backend/collections/users.json` — User collection schema (verify pin, daccPublickey fields exist)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **wallet-api/server.js**: Current ethers v6 wallet generation — migrate to dacc-js
  - Endpoint: `POST /api/wallet/create`
  - Response: `{ address, publicKey, encryptedPrivateKey, version }`
  - Encryption: XOR with `MASTER_KEY + userId`

- **apps/backend/pb_hooks/01-create-wallet.pb.js**: Auto-wallet creation on user signup
  - Calls `http://wallet-api:3001/api/wallet/create`
  - Saves `wallet`, `encryptedPrivateKey` to user record
  - Structure: Keep, update API call and saved fields

- **resources/pkbase-wallet/wallet-srv/**: Reference implementation to copy
  - TypeScript + Express + Bun
  - dacc-js v0.0.5 for wallet creation
  - Endpoints: `/api/v1/wallet/create`, `/api/v1/wallet/create-info`
  - Enhanced error handling with byte array conversion

- **resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js**: Reference hook
  - Generates 20-char random passwordSecretkey
  - Calls wallet API with password
  - Saves `wallet`, `pin`, `daccPublickey`

### Established Patterns

- **Hook naming**: `NN-feature.pb.js` where NN = execution order (01-16)
- **Hook response**: `e.json(200, { success: true, data: {...} })`
- **Authentication**: `$apis.requireAuth(e)` in all hooks
- **Wallet encryption**: `MASTER_KEY + userId` as key (XOR currently, upgrade to AES)
- **Blockchain API retry**: 3 attempts with exponential backoff

### Integration Points

- **PocketBase → Wallet API**: Hook calls wallet API on user creation
- **Wallet API → dacc-js**: Wallet generation using DACC library
- **Frontend → PocketBase**: LINE OAuth via built-in OIDC provider
- **User record**: Save wallet data (address, pin, daccPublickey)

### What Needs Migration

**Current wallet-api (to migrate):**

```javascript
// wallet-api/server.js
const { ethers } = require("ethers")
const wallet = ethers.Wallet.createRandom()
// Returns: address, publicKey, encryptedPrivateKey
```

**Target wallet-api (from reference):**

```typescript
// wallet-srv/src/index.ts
import { DaccWallet } from "dacc-js"
const wallet = DaccWallet.create(passwordSecretkey)
// Returns: address, daccPublickey
```

### User Fields Status

Verify these fields exist in `apps/backend/collections/users.json`:

- `wallet` ✅ Already exists
- `pin` ❓ Need to verify (may need to add)
- `daccPublickey` ❓ Need to verify (may need to add)

</code_context>

<specifics>
## Specific Ideas

### Wallet Creation Flow

```
User signs up via LINE OAuth
       ↓
PocketBase creates user record
       ↓
01-create-wallet.pb.js hook triggers
       ↓
Hook generates 20-char random passwordSecretkey
       ↓
Hook calls wallet-api:3001/api/wallet/create
       ↓
Wallet API calls dacc-js.createWallet(passwordSecretkey)
       ↓
Wallet API returns: { address, daccPublickey }
       ↓
Hook saves to user record: wallet, pin, daccPublickey
```

### Migration Checklist

1. **Verify user collection fields** — add `pin`, `daccPublickey` if missing
2. **Copy wallet-srv structure** — TypeScript + Express + Bun
3. **Install dacc-js v0.0.5** — `bun add dacc-js`
4. **Update hook** — generate password, call new API, save new fields
5. **Test locally** — LINE signup → wallet creation → verify fields
6. **Deploy wallet-api** — Docker build and run
7. **Test production** — verify LINE OAuth creates DACC wallets

### Technical Decisions Made

- **Keep auto-generated passwords** — better UX than user-provided
- **Keep current endpoint** — `/api/wallet/create` (backward compatible)
- **Support both wallet types** — ethers (existing) + dacc (new)
- **Phased migration** — TypeScript first, then dacc integration

</specifics>

<deferred>
## Deferred Ideas

**Out of scope for Phase 4 (MVP wallet integration):**

- Custom LINE OAuth redirect.html — current flow works, enhancement for later
- EIP-7702 authorization — separate phase, not critical for MVP
- Wallet recovery endpoint — nice-to-have, not MVP critical
- Password validation UI — auto-generated, no user input needed
- AES encryption upgrade — Phase 5 security hardening
- Wallet migration tool for existing users — Phase 5 data migration

### Reviewed Todos (not folded)

- None — this is a new phase, todos will be created during planning

### Scope Clarification

**This phase (04):** LINE Wallet Integration (dacc-js migration)
**Original Phase 04:** Testing & Launch — moved to Phase 05

Testing & Launch includes:

- End-to-end integration testing
- Smart contract deployment to BSC testnet
- Production deployment
- Bug fixes and polish

These will be covered in Phase 05.

</deferred>

---

_Phase: 04-line-wallet-integration_  
_Context gathered: 2026-04-03_  
_Next: Phase 5 - Testing & Launch_

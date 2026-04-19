# Phase 12: Wallet-API Contract Integration - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning
**Chain:** 0xl3 (Chain ID: 7117) — https://0xl3.com/

<domain>
## Phase Boundary

**This phase delivers:** Backend infrastructure for real blockchain contract interactions in wallet-api service.

**Scope:**

- Replace 4 mock endpoints with real ethers.js/dacc-js contract calls
- Implement private key decryption using reference pattern
- Add gas sponsorship via USDT (meta-transaction pattern)
- Deploy contracts to 0xl3 testnet

**Out of scope:**

- Frontend changes (Phase 14-15)
- Track deposit hook (Phase 13)
- Play/Feed UI features (Phase 15-16)

</domain>

<decisions>
## Implementation Decisions

### Private Key Decryption

- **D-01:** Use reference pattern from `/resources/pkbase-wallet` — dacc-js library with `passwordSecretkey`
- **D-02:** Store `passwordSecretkey` in user's `pin` field (12-120 chars, generated randomly on signup)
- **D-03:** Decrypt via dacc-js internally (not custom AES-256-GCM) — matches reference API structure
- **D-04:** Request format: `{ daccPublickey, passwordSecretkey, ... }` (not `{ address, pin, ... }`)

### Gas Strategy

- **D-05:** Implement gas sponsorship via USDT (meta-transaction pattern from reference)
- **D-06:** User pays gas in USDT, platform sponsors native token (BNB/ETH) for transaction
- **D-07:** Reference: `wallet-srv/README-payment-flow.md` — `payment/create` + `pay/send` endpoints
- **D-08:** Platform absorbs gas cost as operational expense (USDT-only UX)

### Error Handling & Retries

- **D-09:** Auto-retry transient network errors only (not contract reverts)
- **D-10:** Retry policy: max 3 attempts with exponential backoff (1s, 2s, 4s)
- **D-11:** Increment nonce for each retry attempt
- **D-12:** Return error immediately for: insufficient balance, contract revert, invalid signature
- **D-13:** Log all retry attempts for monitoring

### Deployment Target

- **D-14:** Deploy to 0xl3 testnet first (Chain ID: 7117, https://rpc.0xl3.com)
- **D-15:** Generate `/contract-addresses.json` with deployed contract addresses
- **D-16:** Use environment variable `CHAIN_ID=7117` and `RPC_URL=https://rpc.0xl3.com`
- **D-17:** Test all 4 endpoints thoroughly before mainnet deployment (Phase TBD)

### OpenCode's Discretion

The following decisions are left to OpenCode (researcher/planner can decide):

- ABI format: hardcoded minimal ABI vs separate JSON files (recommendation: hardcoded, simpler deployment)
- Gas estimation buffer percentage (recommendation: 20% based on industry standard)
- Exact backoff timing for retries (recommendation: 1s, 2s, 4s exponential)
- Contract deployment tooling (recommendation: Foundry forge script, already in stack)

### Folded Todos

None — no pending todos were folded into this phase's scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Implementation (MANDATORY)

- `/resources/pkbase-wallet/wallet-srv/API_LIST.md` — Complete API spec, all endpoints, request/response formats
- `/resources/pkbase-wallet/wallet-srv/README-payment-flow.md` — Gas sponsorship pattern, meta-transaction flow
- `/resources/pkbase-wallet/wallet-srv/README.md` — Wallet API architecture, dacc-js integration
- `/resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js` — Hook pattern for calling wallet-api
- `/resources/pkbase-wallet/contracts/DEPLOY.md` — Contract deployment steps (Foundry)
- `/resources/pkbase-wallet/contracts/README.md` — Contract structure, ABIs

### Project Requirements

- `/Users/poom-work/tokenine/eggo-pocketbase/.planning/REQUIREMENTS.md` — SEC-01 to SEC-04 (Phase 12 requirements)
- `/Users/poom-work/tokenine/eggo-pocketbase/.planning/milestones/v2.0/ROADMAP.md` — Phase 1-2 (deployment + wallet-api)

### Codebase Context

- `/wallet-api/server.js` — Current mock endpoints (lines 388, 422, 457, 493 need replacement)
- `/wallet-api/AGENTS.md` — Anti-patterns, conventions, encryption patterns

### 0xl3 Network (Chain ID: 7117)

- RPC: `https://rpc.0xl3.com`
- Testnet: Free gas for testing
- No external docs — use reference implementation patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **decryptPrivateKey()** — Already supports v4 AES-GCM, will be replaced by dacc-js pattern
- **encryptPrivateKey()** — AES-256-GCM implementation (may keep for backward compatibility)
- **dacc-js library** — Already available in reference (check if installed in wallet-api)
- **ethers v6** — Installed, will use for contract interactions

### Established Patterns

- **Response format:** `{ success: true/false, data: {...}, error: {...} }` — all endpoints follow this
- **Environment variables:** `WALLET_MASTER_KEY`, `PORT`, `NODE_ENV` — keep pattern
- **Error handling:** try/catch with structured error responses
- **Logging:** Console.log with context (user address, action type)

### Integration Points

- **PocketBase hook:** `apps/backend/pb_hooks/01-create-wallet.pb.js` — calls wallet-api for wallet creation
- **Frontend:** Will call backend hooks (`/api/v2/*`), not wallet-api directly
- **Contract deployment:** Foundry in `/contracts/` — needs deployment to 0xl3 testnet

### Anti-Patterns to Avoid

- ❌ Hardcoded wallet API URLs — use environment variables
- ❌ XOR encryption in production — use dacc-js or AES-GCM
- ❌ Skipping authentication checks — all endpoints require auth
- ❌ Logging sensitive data (private keys, passwords)

</code_context>

<specifics>
## Specific Ideas

**Gas Sponsorship Flow (from reference):**

1. User approves USDT transfer via `payment/create` (off-chain signature)
2. Platform sponsor sends native token for gas via `pay/send`
3. Transaction executes, USDT deducted from user, gas covered by platform

**Decryption Flow:**

```javascript
// Request to wallet-api endpoint
{
  "daccPublickey": "daccPublickey_0x123_XxX...",
  "passwordSecretkey": "userPassword123!",
  "contractAddress": "0x...",
  "functionName": "mintEgg",
  "args": [1]
}
// dacc-js decrypts internally using passwordSecretkey
```

**Retry Logic Structure:**

```javascript
async function executeWithRetry(tx, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tx()
    } catch (error) {
      if (isRevertError(error)) throw error // Don't retry reverts
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000) // Exponential backoff
      nonce++ // Increment nonce for retry
    }
  }
}
```

**0xl3 Testnet Priority:**

- Deploy contracts to 0xl3 testnet (7117) first
- Test all endpoints with free gas
- Verify end-to-end flow before mainnet deployment
- Document contract addresses in `/contract-addresses.json`

</specifics>

<deferred>
## Deferred Ideas

**Scope Creep Redirected:**

- Frontend balance display refresh (belongs in Phase 16, not backend infrastructure)
- Transaction history UI (belongs in Phase 14-15)
- Wallet connect button styling (UI polish, Phase 14)

### Reviewed Todos (not folded)

None — no todos were reviewed but deferred in this session.

</deferred>

---

_Phase: 12-wallet-api-contract-integration_
_Context gathered: 2026-04-18_
_Decisions: 17 implementation choices captured_
_Reference: /resources/pkbase-wallet (ALL designs follow this)_

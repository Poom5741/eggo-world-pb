# Phase 42: Auth Mock + Blockchain Helpers - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth bypass and blockchain verification utilities for reliable E2E tests without external dependencies.

**Delivers:**

1. Frontend E2E login button for test authentication
2. Predefined test users (test_buyer, test_seller, test_referrer, test_admin)
3. Transaction polling helper with ethers.waitForTransaction()
4. Event parsing helper using ethers.parseLog()
5. On-chain verification helpers (ownerOf, balanceOf)

**Not delivering:**

- Wallet automation/Synpress (Phase 43)
- CI workflow (Phase 44)
- Real LINE OAuth smoke test (AUTH-03 - optional)
- VRF mock coordinator (deferred)

</domain>

<decisions>
## Implementation Decisions

### Auth Bypass Strategy

- **D-01:** Frontend-based E2E login button on auth pages (not backend API injection)
- **D-02:** Query param trigger: `?e2e_test_user=test_buyer`
- **D-03:** Environment check: only show button when `localhost` or `e2e=true` param
- **D-04:** Button fetches test user credentials from PocketBase and authenticates

### Test Users

- **D-05:** 4 predefined test users for different E2E scenarios:
  - `test_buyer` — Purchases NFTs from marketplace
  - `test_seller` — Lists NFTs for sale
  - `test_referrer` — Referral chain testing (G1 position)
  - `test_admin` — Admin operations testing
- **D-06:** Test users created in production PocketBase with USDT balance
- **D-07:** Test user cleanup not required (persistent test accounts)

### Transaction Polling (BLOCK-01)

- **D-08:** Use ethers.js `provider.waitForTransaction(hash, confirmations)`
- **D-09:** Default confirmation count: 12 blocks (BSC standard)
- **D-10:** Timeout: 120 seconds max for polling

### Event Parsing (BLOCK-02)

- **D-11:** Use ethers.js `contract.interface.parseLog(log)`
- **D-12:** ABIs already defined in wallet-api/server.js:
  - Transfer (ERC721)
  - NFTSold (Marketplace)
  - AnimalBred (AnimalNFT)
  - TierBadgeMinted (TierBadge)
- **D-13:** Helper returns parsed event with typed data

### On-chain Verification (BLOCK-03)

- **D-14:** Use ethers.js contract calls:
  - `contract.ownerOf(tokenId)` → owner address
  - `contract.balanceOf(address)` → NFT count
- **D-15:** Verify against PocketBase record for cross-check

### Claude's Discretion

- Confirmation count configuration per test
- Polling timeout per transaction type
- Event helper return type structure

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth & Frontend

- `apps/web/app/auth/login/page.tsx` — Login page for E2E button placement
- `apps/web/lib/pocketbase/client.ts` — PocketBase auth token handling
- `apps/web/lib/auth/line-oauth.ts` — LINE OAuth flow reference

### Blockchain

- `wallet-api/server.js` — Ethers.js setup, ABIs, event interfaces
- `contracts/foundry.toml` — BSC testnet RPC endpoint
- `tests/fixtures/e2e-setup.ts` — E2E test scaffold (Phase 41)

### Project Context

- `.planning/REQUIREMENTS.md` — AUTH-01/02/03, BLOCK-01/02/03 requirements
- `.planning/ROADMAP.md` — Phase 42 success criteria

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `wallet-api/server.js` — ethers.js v6 setup, ABIs for events
- `tests/fixtures/e2e-setup.ts` — E2E test context scaffold
- `apps/web/lib/pocketbase/client.ts` — Auth token handling patterns

### Established Patterns

- ethers.js JsonRpcProvider for Anvil connection
- PocketBase authStore for token management
- Query params for feature toggling (existing patterns)

### Integration Points

- Frontend auth pages → E2E login button
- Test helpers → Anvil RPC via ethers provider
- Event parsing → wallet-api ABIs

</code_context>

<specifics>
## Specific Ideas

- E2E login button styled as "Test Mode" badge, hidden by default
- Query param examples:
  - `/auth/login?e2e_test_user=test_buyer`
  - `/auth/login?e2e_test_user=test_seller&e2e=true`
- Polling helper: `await waitForTx(hash, { confirmations: 12, timeout: 120000 })`
- Event helper: `const event = parseEvent(receipt, 'Transfer')`

</specifics>

<deferred>
## Deferred Ideas

- VRF mock coordinator for hatch randomness (not in scope)
- Real LINE OAuth smoke test (AUTH-03 - optional, low priority)
- Test user dynamic creation via admin API (using predefined users instead)
- Gas sponsorship balance verification (Phase 43)

</deferred>

---

_Phase: 42-auth-mock-blockchain-helpers_
_Context gathered: 2026-04-27_

# Phase 54: Egg Mint Backend Hardening - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the egg mint flow production-ready with reliable error handling. The backend PocketBase hook and wallet-api must handle error cases gracefully — insufficient balance, gas failures, network errors — without silent failures or wasted gas.

</domain>

<decisions>
## Implementation Decisions

### Error handling approach

- **D-01:** Balance check in PocketBase hook first — check user's USDT balance (≥ 25 USDT required) BEFORE calling blockchain. Return descriptive error if insufficient. Prevents wasted gas on blockchain reverts.

- **D-02:** Pre-estimate gas before sending transaction — use ethers.js `estimateGas()` before `mintEgg()` call. If gas estimation fails, return descriptive error without sending tx.

- **D-03:** Retry with exponential backoff for network/RPC errors — retry failed RPC calls up to 3 times with exponential backoff (1s, 2s, 4s). Network hiccups won't fail the mint.

### Claude's Discretion

- Exact retry backoff values (current: 1s, 2s, 4s) — adjust if needed during implementation
- Error response format and field names (current: `{ success, error: { message, code } }`)
- Whether to use existing `13-mint-egg-nft.pb.js` hook or create new production version

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mint flow documentation

- `docs/modules/egg-nft.md` — Egg NFT mint endpoint specification, flow, error codes
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Existing mint hook (to audit/enhance)
- `wallet-api/server.js` — Wallet API mint endpoint with real ethers.js contract calls

### Existing patterns

- `apps/web/app/mint/page.tsx` — Existing mint page frontend (for integration reference)
- `apps/web/hooks/use-egg-nft.ts` — Existing mint hook for frontend

### Error handling patterns

- `wallet-api/server.js` — `withRetry()` pattern with exponential backoff (existing)
- `apps/backend/pb_hooks/` — PocketBase error response format: `e.json(400, { success: false, error: { message, code } })`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `wallet-api/server.js`: Existing `withRetry()` function with exponential backoff — reuse for RPC calls
- `apps/web/app/mint/page.tsx`: Existing mint page with polling for confirmation status
- PocketBase hook error format already established in existing hooks

### Established Patterns

- PocketBase hook response: `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: { message, code } })` for errors
- Authentication in hooks: Use `e.requestInfo().auth?.id` to get user ID
- Database queries: Use `$app.findFirstRecordByData()` for field lookups

### Integration Points

- Mint hook calls wallet-api at `WALLET_SRV_URL` environment variable
- Mint hook creates `egg_nfts` records in PocketBase
- Mint hook deducts from `user_wallets.usdt_balance`
- Mint hook creates `commission_records` for referral chain

</code_context>

<specifics>
## Specific Ideas

- User emphasized: "error handling approach" — production reliability is the priority
- No specific reference UI or patterns — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 54 scope

</deferred>

---

_Phase: 54-egg-mint-backend-hardening_
_Context gathered: 2026-05-08_

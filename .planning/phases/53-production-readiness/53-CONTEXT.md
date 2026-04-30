# Phase 53 Context: Production Readiness

## Scope

Implement reliable blockchain synchronization and achieve >95% test pass rate. Final phase of v0.5.0 milestone.

## Requirements

### PROD-01: Blockchain event listeners

**Status:** ⚡ Already implemented in Phase 52 WIP
**Files:**

- `apps/backend/pb_hooks/22-listen-nft-events.pb.js` — NFT Transfer event listener (GET /api/v2/nfts/listen)
- `apps/backend/pb_hooks/21-sync-events.pb.js` — General blockchain sync (POST /api/v2/sync-blockchain)
- `scripts/sync-blockchain-to-pocketbase.js` — External sync script
  **Remaining:** Verify hooks work correctly in production PocketBase v0.23.4

### PROD-02: Real-time state updates

**Status:** ⚡ Already implemented in Phase 52 WIP
**Files:**

- `apps/web/lib/fetch-retry.ts` — Retry utility with circuit breaker
- `apps/web/hooks/use-egg-poll.ts` — Uses retry utility for egg data polling
- `apps/web/hooks/use-wallet-poll.ts` — Exponential backoff on wallet API failures
  **Remaining:** Verify polling intervals are appropriate for production

### PROD-03: Error recovery mechanisms

**Status:** ⚡ Already implemented in Phase 52 WIP
**Files:**

- `apps/web/lib/fetch-retry.ts` — Circuit breaker pattern (3 failures threshold, 60s timeout)
- `apps/web/hooks/use-wallet-poll.ts` — Exponential backoff (30s → 60s → 120s → 5min max)
  **Remaining:** Add retry logic to PocketBase hooks for RPC calls

### PROD-04: >95% test pass rate

**Status:** ❌ Verified — 93% (below 95% threshold)
**Blockers:**

- 12 tests fail due to PocketBase AUTH_REQUIRED (mock gap)
- `use-marketplace-sync.test.ts` hangs (async loop)
- 9 tests fail due to text split across DOM elements
  **Remaining:** Fix test mocks, update UI text matchers, fix hanging test

## Key Decisions

1. Blockchain event listeners use endpoints called by external cron jobs (setInterval not available in PB JSVM)
2. Circuit breaker pattern for API resilience — prevents cascade failures
3. Exponential backoff for polling — reduces load during outages
4. Test pass rate measured across contract tests + E2E tests

## Dependencies

- Phase 52 (E2E test fixes) ✅ committed
- Contract deployment (external, not in scope)
- Production PocketBase deployment (external)

# Phase 52 Context: E2E Test Fixes

## Scope

Fix failing E2E journey tests and create production test users. 4 requirements from roadmap.

## Requirements

### E2E-01: Fix purchase flow timeout

**Status:** ✅ Fixed — timeout increased from 30s to 60s
**File:** `tests/e2e/playwright-buy-egg-journey.test.ts:66`

### E2E-02: Fix blockchain-to-PocketBase data sync

**Status:** ⚡ WIP — sync script improved, new hooks created
**Files:**

- `scripts/sync-blockchain-to-pocketbase.js` — better error handling, numeric token IDs
- `apps/backend/pb_hooks/21-sync-events.pb.js` — rewritten with POST endpoint
- `apps/backend/pb_hooks/22-listen-nft-events.pb.js` — NEW NFT event listener with background polling

### E2E-03: Fix PocketBase endpoint accessibility

**Status:** ⚡ WIP — docker-compose.e2e.yml fixed
**File:** `docker-compose.e2e.yml` — correct hostnames, extra_hosts, isolated e2e hooks/migrations

### E2E-04: Create production test users

**Status:** ❌ Not started

## Decisions

1. **E2E-01**: Timeout increase sufficient — no other changes needed
2. **E2E-02**: Adopt existing WIP changes as starting point
3. **E2E-03**: docker-compose.e2e.yml fixes look correct, verify
4. **E2E-04**: Create via script `scripts/create-e2e-test-users.sh`

## Dependencies

- Phase 51 complete ✅

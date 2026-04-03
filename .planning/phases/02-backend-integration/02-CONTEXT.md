# Phase 2: Backend Integration - Context

**Gathered:** 2026-04-03 (Updated)  
**Status:** Ready for implementation — collection updates, wallet API integration, event sync hook

<domain>
## Phase Boundary

PocketBase collections, hooks, wallet API, and blockchain event synchronization for NFT marketplace backend.

**Scope anchor:** Backend infrastructure for user management, wallet creation, NFT metadata storage, commission tracking, and blockchain event synchronization to PocketBase for fast frontend queries.

</domain>

<decisions>
## Implementation Decisions

### Backend Status (Existing)

- **D-01:** Phase 2 core implementation complete — 21 PocketBase hooks written
- **D-02:** 9 PocketBase collections exist: users, nfts, transactions, referrals, user_wallets, egg_nfts, food_nfts, animal_nfts, commission_records
- **D-03:** Wallet API running on TypeScript + Bun + dacc-js v0.0.5
- **D-04:** Wallet addresses stored in PocketBase, private keys encrypted with master key + userId

### Event Sync Architecture (NEW)

- **D-05:** **PocketBase Hook-Based approach** — Event sync implemented within PocketBase hooks, not separate indexer service (MVP-first decision)
- **D-06:** **5 events to sync for MVP** (priority order):
  1. `EggMinted` — Update egg_nfts collection, set owner
  2. `FoodMinted` — Update food_nfts collection, set owner
  3. `AnimalMinted` — Update animal_nfts collection with rarity, species, generation
  4. `EggHatched` — Mark egg as hatched, link to animal_nfts
  5. `CommissionDistributed` — Update commission_records, increment user balances
- **D-07:** **Hybrid sync timing** — Block polling every 30 seconds (10 blocks on BSC) as MVP, WebSocket ready architecture for Phase 4 enhancement
- **D-08:** **Block number tracking for rollback** — Store `lastProcessedBlock` in `sync_state` collection after each successful event batch
- **D-09:** **Retry with exponential backoff** — 3 retries (1s, 2s, 4s delays) before stopping sync for manual intervention
- **D-10:** **Support both BSC testnet and mainnet** — Switch via configuration in 00-config.pb.js

### Collection Schema Updates (NEW - 2026-04-03)

- **D-21:** **Update existing collections** — Add missing fields to egg_nfts, food_nfts, animal_nfts, commission_records for event sync support
- **D-22:** **sync_state collection** — Single record tracking sync progress (see D-11)
- **D-23:** **Fields to verify/add:**
  - `egg_nfts`: Ensure `owner`, `food_count`, `is_hatched`, `animal_id` fields exist
  - `food_nfts`: Ensure `owner`, `food_type`, `is_consumed` fields exist
  - `animal_nfts`: Ensure `species`, `rarity`, `generation`, `parent_egg_id` fields exist
  - `commission_records`: Ensure `referral_chain[4]`, `amounts[4]`, `sale_id` fields exist

### Wallet API Integration (NEW - 2026-04-03)

- **D-24:** **Real blockchain integration now** — Implement actual contract calls in wallet API using ethers v6 (not wait for Phase 4 dacc-js migration)
- **D-25:** **Endpoints to implement:**
  - `POST /api/wallet/mint-egg` — Call EggNFT.mintEggNFT() with USDT approval
  - `POST /api/wallet/mint-food` — Call FoodNFT.mintFoodNFT() with USDT approval
  - `POST /api/wallet/feed-egg` — Call EggNFT.feedEgg() with food NFT approval
  - `POST /api/wallet/claim-commission` — Call CommissionDistribution.claimCommission()
- **D-26:** **Contract ABIs** — Import contract ABIs from Phase 1 deployment artifacts
- **D-27:** **USDT approval flow** — Handle ERC20.approve() before each mint/purchase operation

### Monitoring & Testing (NEW - 2026-04-03)

- **D-28:** **Health check endpoint** — Add `GET /health` to wallet API reporting sync status, last processed block, uptime
- **D-29:** **Manual verification for MVP** — Use PocketBase Admin UI + Docker logs for initial testing
- **D-30:** **Sync status tracking** — sync_state.status field visible in health endpoint

### WebSocket Deferred (NEW - 2026-04-03)

- **D-31:** **Polling-only for MVP** — WebSocket real-time sync is Phase 5+ enhancement
- **D-32:** **Architecture ready for upgrade** — Event handlers designed to work with both polling and WebSocket sources

### Sync State Management (NEW)

- **D-11:** **`sync_state` collection** — Single record tracking sync progress
  - Fields: `lastProcessedBlock` (number), `lastSyncTimestamp` (datetime), `status` (select: 'syncing' | 'error' | 'idle'), `last_error` (text), `failed_block` (number)
  - Updated atomically after each successful block processing
- **D-12:** **On startup behavior** — Read `lastProcessedBlock` from `sync_state`, resume sync from that block (auto-recovery from crashes)
- **D-13:** **On critical error** — Set `status = 'error'`, log full context, stop sync loop, await manual intervention

### Event Processing Flow (NEW)

- **D-14:** **Block polling interval** — Every 30 seconds (~10 blocks on BSC with 3s block time)
- **D-15:** **Event filtering** — Only process events from deployed contract addresses (EggNFT, FoodNFT, AnimalNFT, Commission, Marketplace)
- **D-16:** **Atomic block processing** — All events in a block processed successfully OR none (block number not saved on partial failure)
- **D-17:** **PocketBase Admin API** — Sync hook uses PocketBase ORM directly (`pb.collection()`) within hook context

### Error Categories (NEW)

- **D-18:** **Retryable errors** — Network timeout, RPC rate limit, temporary DB lock (trigger retry)
- **D-19:** **Non-retryable errors** — Invalid event data, contract mismatch, schema error (log and skip event)
- **D-20:** **Critical errors** — PocketBase connection lost, encryption failure (stop sync, set error status)

### OpenCode's Discretion

- Exact implementation of block polling loop structure
- Specific collection field additions (based on schema review)
- Wallet API contract interaction patterns (ethers v6 usage)
- Health check endpoint response format and additional metrics
- Error message formatting and logging details
- Whether to add Discord/Slack webhook alerts for critical errors (Phase 5+)
- WebSocket implementation details when upgraded in Phase 5+

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Architecture

- `docs/NFT_Marketplace_Functional_Spec.md` — Event definitions (§2, §6, §7), commission distribution engine (§6), wallet functions (§9), data models (§13)
- `docs/00-architecture.md` — System architecture, component relationships (§3-5: Backend, Wallet API, Smart Contracts)
- `docs/02-decisions.md` — ADR-001 (PocketBase), ADR-002 (4-level MLM), ADR-004 (BSC network)

### PocketBase Implementation

- `apps/backend/pb_hooks/` — All 21 existing hook implementations
- `apps/backend/pb_hooks/00-config.pb.js` — Centralized configuration (blockchain, wallet, game settings)
- `apps/backend/pb_hooks/01-create-wallet.pb.js` — Wallet creation on user signup
- `apps/backend/pb_hooks/06-referral-chain.pb.js` — Build 4-level referral chain
- `apps/backend/pb_hooks/07-register-user.pb.js` — User registration with referrer
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Egg NFT minting flow
- `apps/backend/pb_hooks/14-claim-commission.pb.js` — Commission claiming logic
- `apps/backend/pb_hooks/15-mint-food-nft.pb.js` — Food NFT minting flow
- `apps/backend/pb_hooks/16-feed-egg.pb.js` — Egg feeding flow

### Collections Schema

- `apps/backend/collections/users.json` — User schema with referral fields
- `apps/backend/collections/egg_nfts.json` — Egg NFT metadata (verify: owner, food_count, is_hatched, animal_id)
- `apps/backend/collections/food_nfts.json` — Food NFT metadata (verify: owner, food_type, is_consumed)
- `apps/backend/collections/animal_nfts.json` — Animal NFT metadata (verify: species, rarity, generation, parent_egg_id)
- `apps/backend/collections/commission_records.json` — Commission tracking (verify: referral_chain[4], amounts[4], sale_id)
- `apps/backend/collections/user_wallets.json` — Wallet addresses and balances
- `apps/backend/collections/referrals.json` — Referral relationships
- `apps/backend/collections/transactions.json` — Transaction history
- `apps/backend/collections/nfts.json` — General NFT metadata
- `apps/backend/collections/sync_state.json` — Sync state tracking (to be created)

### Wallet API

- `wallet-api/server.js` — Express.js server with wallet endpoints (to be updated with real blockchain calls)
- `wallet-api/src/` — TypeScript source code (dacc-js integration) — Phase 4 migration
- `wallet-api/AGENTS.md` — Wallet API conventions and patterns
- `contracts/src/EggNFT.sol` — Contract ABI for mint-egg endpoint
- `contracts/src/FoodNFT.sol` — Contract ABI for mint-food endpoint
- `contracts/src/AnimalNFT.sol` — Contract ABI for hatch-egg endpoint
- `contracts/src/CommissionDistribution.sol` — Contract ABI for claim-commission endpoint
- `.planning/phases/01-smart-contracts-foundation/01-01-SUMMARY.md` — Deployed contract addresses

### Integration Patterns

- `.planning/phases/01-smart-contracts-foundation/01-CONTEXT.md` — Phase 1 context, contract addresses, event definitions
- `.planning/codebase/ARCHITECTURE.md` — System architecture patterns
- `.planning/codebase/CONVENTIONS.md` — Coding standards (Thai comments, error handling)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **21 PocketBase hooks**: Complete implementation for user management, wallet operations, NFT minting, commission tracking
- **Wallet API server.js**: Express.js service with mock endpoints — update with real blockchain calls
- **9 PocketBase collections**: Pre-configured schemas (some need field additions for event sync)
- **00-config.pb.js**: Centralized configuration (blockchain RPC URLs, contract addresses, encryption settings)
- **Ethers v6 in wallet-api**: Can reuse provider setup for event sync and wallet API endpoints
- **Phase 1 contract artifacts**: ABI files and deployed addresses for contract interactions

### Collection Updates Needed

Based on event sync requirements (D-23), verify/add these fields:

**egg_nfts:**
- `owner` (relation → users) — for EggMinted event
- `food_count` (number, 0-10) — track feeding progress
- `is_hatched` (bool) — mark when egg is hatched
- `animal_id` (text, optional) — link to animal_nfts after hatch

**food_nfts:**
- `owner` (relation → users) — for FoodMinted event
- `food_type` (select: Grain/Fish/Insects/Herbs) — from FoodMinted event
- `is_consumed` (bool) — track if food was used

**animal_nfts:**
- `species` (text) — from AnimalMinted event
- `rarity` (select: Common/Rare/Epic/Legendary) — from AnimalMinted event
- `generation` (number) — from AnimalMinted event
- `parent_egg_id` (text) — link back to hatched egg

**commission_records:**
- `referral_chain` (json: [addr1, addr2, addr3, addr4]) — from CommissionDistributed
- `amounts` (json: [amount1, amount2, amount3, amount4]) — per-level commission
- `sale_id` (text) — reference to original sale

### Established Patterns

- **Hook naming convention**: `NN-feature.pb.js` where NN = execution order (01-21)
- **Hook response pattern**: `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: {...} })` for errors
- **Wallet encryption**: `MASTER_KEY + userId` as encryption key, XOR ciphertext storage (to upgrade to AES-256-GCM)
- **Referral chain building**: Recursive lookup through G1→G2→G3→G4 on user registration
- **Commission tracking**: Track in PocketBase DB, claim via on-chain transaction
- **Error handling**: Try-catch with structured error responses, Thai comments
- **Blockchain API calls**: Use ethers v6 with provider, handle USDT approval before operations

### Integration Points

- **PocketBase ↔ Smart Contracts**: Hooks call wallet API which signs blockchain transactions
- **Wallet API → Blockchain**: Ethers v6 for contract interactions (mint, feed, claim)
- **Event Sync → PocketBase**: Hook-based sync updates collections on blockchain events
- **Frontend ↔ PocketBase**: REST API for all user operations, real-time subscriptions
- **Health Check → Sync State**: Monitor sync progress via health endpoint

### Sync Architecture Summary

**Implementation location:** `apps/backend/pb_hooks/21-sync-events.pb.js`

**Sync flow:**
```
PocketBase starts
     │
     ▼
Read sync_state.lastProcessedBlock
     │
     ▼
setInterval every 30s (D-14, D-31)
     │
     ▼
Get current block from BSC RPC
     │
     ▼
For each block from lastProcessedBlock+1 to current:
  ├─ Fetch block with events
  ├─ Filter events (EggMinted, FoodMinted, AnimalMinted, EggHatched, CommissionDistributed)
  ├─ For each event: syncWithRetry(handler, event, maxRetries=3)
  │   ├─ Attempt 1: process event
  │   ├─ On error: wait 1s, retry
  │   ├─ Attempt 2: process event
  │   ├─ On error: wait 2s, retry
  │   ├─ Attempt 3: process event
  │   └─ On error: throw, stop sync, set error status
  ├─ On success: update sync_state.lastProcessedBlock = blockNumber
  └─ Continue to next block
```

**State management:**

- Collection: `sync_state` (create if not exists)
- Single record with id='config'
- Atomic updates: block number only saved after successful event processing
- On restart: resume from lastProcessedBlock (auto-recovery)
- Health check endpoint: Exposes sync status and lastProcessedBlock (D-28)

**WebSocket note:** Architecture supports future WebSocket upgrade (Phase 5+), but MVP uses polling-only (D-31, D-32).

</code_context>

<specifics>
## Specific Ideas

### Block Number Rollback Strategy

User explicitly requested: "collect block number so we can rollback every time if system down"

**Implementation:**

```javascript
// After processing ALL events in a block successfully:
await pb.collection("sync_state").update("config", {
  lastProcessedBlock: blockNumber,
  lastSyncTimestamp: new Date().toISOString(),
  status: "syncing",
})

// On startup or after crash:
const state = await pb.collection("sync_state").getFirstListItem('id="config"')
const startBlock = state.lastProcessedBlock + 1
console.log(`Resuming sync from block ${startBlock}`)
```

**Rollback scenario:**

1. System crashes at block 12345678 (mid-processing)
2. `lastProcessedBlock` still at 12345677 (not yet updated)
3. On restart: reads 12345677, resumes from 12345678
4. Events from 12345678 re-processed (idempotent handlers prevent duplicates)

### Event Handler Idempotency

Handlers MUST be idempotent (safe to call multiple times with same event):

```javascript
async function syncEggMinted(eggId, buyer, blockNumber) {
  const egg = await pb.collection("egg_nfts").getOne(eggId)
  if (egg && egg.owner === buyer) {
    // Already processed — skip (idempotent)
    return
  }
  // Process event...
}
```

### WebSocket Readiness (Phase 4 Enhancement)

Architecture supports future WebSocket upgrade:

```javascript
// Current: Block polling (MVP)
setInterval(pollBlocks, 30000)

// Phase 4: Add WebSocket listener
const provider = new ethers.WebSocketProvider(RPC_WSS_URL)
contract.on("EggMinted", handleEvent)

// Heartbeat: detect silent WebSocket drops
setInterval(checkWebSocketHealth, 60000)

// Fallback: if WebSocket silent > 60s, switch to polling
```

### Deployment Command

```bash
# PocketBase already running at pb.eggoworld.io
# After adding 21-sync-events.pb.js:

cd apps/backend
docker-compose restart pocketbase

# Verify sync running:
docker logs pocketbase | grep "sync"
```

</specifics>

<deferred>
## Deferred Ideas

**Out of scope for Phase 2 (backend event sync):**

- WebSocket real-time sync — Phase 5+ enhancement (polling-first approach, D-31)
- Historical event backfill from block 0 — Phase 5 deployment
- Dead-letter queue for failed events — overkill for MVP, use retry-with-backoff instead
- Advanced analytics and reporting — Phase 6 admin dashboard
- Multi-chain event sync — Phase 7 multi-chain support
- Discord/Slack webhook alerts for critical errors — Phase 5+ monitoring
- AES-256-GCM encryption upgrade — Phase 4 security hardening

### Wallet API Mock Endpoints (To Be Replaced)

Current mock implementations in `wallet-api/server.js` will be replaced with real blockchain calls:
- `POST /api/wallet/mint-egg` — Mock → Real EggNFT.mintEggNFT() call
- `POST /api/wallet/mint-food` — Mock → Real FoodNFT.mintFoodNFT() call
- `POST /api/wallet/feed-egg` — Mock → Real EggNFT.feedEgg() call
- `POST /api/wallet/claim-commission` — Mock → Real CommissionDistribution.claimCommission()

### Marketplace Events Deferred

- `NFTListed`, `NFTSold` — Marketplace events deferred until Phase 3 frontend marketplace UI ready
- Can add these events to sync hook when marketplace pages implemented

### Separate Indexer Service Deferred

- Current decision: PocketBase hook-based sync (MVP-first)
- Can migrate to separate indexer service in Phase 6/7 if scaling requires it
- Architecture designed to support future migration (state stored in PocketBase collections)

</deferred>

---

_Phase: 02-backend-integration_  
_Context gathered: 2026-04-03 (Updated with implementation decisions)_  
_Next: Phase 2 Implementation — Create sync_state collection, update existing collections, implement 21-sync-events.pb.js hook, update wallet-api/server.js with real blockchain calls_

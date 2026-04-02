# Phase 2: Backend Integration - Context

**Gathered:** 2026-04-02  
**Status:** Implementation complete — event sync and deployment pending

<domain>
## Phase Boundary

PocketBase collections, hooks, and wallet API for NFT marketplace backend. Sync blockchain events to database for fast frontend queries.

**Scope anchor:** Backend infrastructure for user management, wallet creation, NFT metadata storage, commission tracking, and blockchain event synchronization.

</domain>

<decisions>
## Implementation Decisions

### Backend Status

- **D-01:** Phase 2 marked as "implementation complete" — all core backend components written
- **D-02:** 9 PocketBase collections exist: users, nfts, transactions, referrals, user_wallets, egg_nfts, food_nfts, animal_nfts, commission_records
- **D-03:** 21 PocketBase hooks implemented including wallet creation, referral chain, NFT minting, commission tracking
- **D-04:** Wallet API running on Express.js with ethers v6 — endpoints for create, balance, transfer

### Event Sync Decisions

- **D-05:** Sync blockchain events to PocketBase for fast frontend queries (not direct blockchain queries)
- **D-06:** Hybrid sync approach — WebSocket for real-time events, block polling as fallback
- **D-07:** Store processed data only in main collections (balances, ownership, earnings) — lean and fast
- **D-08:** Support both BSC testnet and mainnet — switch via configuration
- **D-09:** Priority events to sync: EggMinted, FoodMinted, AnimalMinted, EggHatched, CommissionDistributed

### Architecture Decisions (Already Made)

- **D-10:** PocketBase hooks for user-facing operations (create wallet, register user, mint NFT)
- **D-11:** Wallet API separate from PocketBase — dedicated service for blockchain operations
- **D-12:** XOR encryption in wallet API (demo) — upgrade to AES-256-GCM before production
- **D-13:** Wallet addresses stored in PocketBase, private keys encrypted with master key + userId
- **D-14:** Referral chain stored as JSON array [G1, G2, G3, G4] on user record
- **D-15:** Commission balances tracked in PocketBase, claimed via blockchain transaction

### OpenCode's Discretion

- Event listener architecture choice (PocketBase hooks vs separate indexer service)
- Exact polling interval for block polling (recommended: every 10 blocks ~30s on BSC)
- Error handling and retry logic for failed sync attempts
- Wallet API deployment configuration (Docker vs direct deployment)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Architecture

- `docs/00-architecture.md` — System architecture, component relationships, data flows (§3-5: Backend, Wallet API, Smart Contracts)
- `docs/02-decisions.md` — ADR-001 (PocketBase), ADR-002 (4-level MLM), ADR-004 (BSC network)
- `docs/NFT_Marketplace_Functional_Spec.md` — Commission distribution engine (§6), Wallet functions (§9), Data models (§13)

### PocketBase Implementation

- `apps/backend/pb_hooks/` — All 21 hook implementations
- `apps/backend/pb_hooks/01-create-wallet.pb.js` — Wallet creation on user signup
- `apps/backend/pb_hooks/06-referral-chain.pb.js` — Build 4-level referral chain
- `apps/backend/pb_hooks/07-register-user.pb.js` — User registration with referrer
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Egg NFT minting flow
- `apps/backend/pb_hooks/14-claim-commission.pb.js` — Commission claiming logic
- `apps/backend/pb_hooks/15-mint-food-nft.pb.js` — Food NFT minting flow
- `apps/backend/pb_hooks/16-feed-egg.pb.js` — Egg feeding flow

### Collections Schema

- `apps/backend/collections/users.json` — User schema with referral fields
- `apps/backend/collections/egg_nfts.json` — Egg NFT metadata
- `apps/backend/collections/food_nfts.json` — Food NFT metadata
- `apps/backend/collections/animal_nfts.json` — Animal NFT metadata
- `apps/backend/collections/commission_records.json` — Commission tracking
- `apps/backend/collections/user_wallets.json` — Wallet addresses and balances
- `apps/backend/collections/referrals.json` — Referral relationships
- `apps/backend/collections/transactions.json` — Transaction history
- `apps/backend/collections/nfts.json` — General NFT metadata

### Wallet API

- `wallet-api/server.js` — Express.js server with wallet endpoints
- `wallet-api/package.json` — Dependencies (ethers v6, express, cors)
- `wallet-api/AGENTS.md` — Wallet API conventions and patterns

### Integration Patterns

- `.planning/phases/01-smart-contracts-foundation/01-CONTEXT.md` — Phase 1 context, contract addresses, event definitions

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **21 PocketBase hooks**: Complete implementation for user management, wallet operations, NFT minting, commission tracking
- **Wallet API server.js**: Production-ready Express.js service with wallet creation, balance queries, transfers
- **9 PocketBase collections**: Pre-configured schemas for all data entities
- **Encryption utilities**: XOR encryption (to be upgraded to AES) for private key storage

### Established Patterns

- **Hook naming convention**: `NN-feature.pb.js` where NN = execution order (01-16)
- **Hook response pattern**: `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: {...} })` for errors
- **Wallet encryption**: `MASTER_KEY + userId` as encryption key, XOR ciphertext storage
- **Referral chain building**: Recursive lookup through G1→G2→G3→G4 on user registration
- **Commission tracking**: Track in PocketBase DB, claim via on-chain transaction
- **Error handling**: Try-catch with structured error responses

### Integration Points

- **PocketBase ↔ Smart Contracts**: Hooks call wallet API which signs blockchain transactions
- **Wallet API ↔ Blockchain**: Ethers v6 for wallet generation, balance queries, transaction signing
- **Frontend ↔ PocketBase**: REST API for all user operations, real-time subscriptions
- **Frontend ↔ Wallet API**: Direct calls for wallet creation, balance checks
- **Event Sync → PocketBase**: Future event listeners will update collections on blockchain events

### Backend Capabilities Summary

**User Management:**

- ✅ LINE OAuth authentication (hooks 04-05)
- ✅ Auto-wallet creation on signup (hook 01)
- ✅ Referral chain building (hooks 06-07)
- ✅ User registration with upline tracking

**Wallet Operations:**

- ✅ Wallet generation (ethers v6, encrypted storage)
- ✅ Balance queries (USDT, native token)
- ✅ P2P transfers
- ✅ Withdrawal requests (hook 09)

**NFT Operations:**

- ✅ Mint Egg NFT (hook 13) — 25 USDT, includes 2 Food NFTs
- ✅ Mint Food NFT (hook 15) — 0.50 USDT each
- ✅ Feed Egg (hook 16) — burn Food NFTs, increment egg food_count
- ⏳ Hatch Egg — event sync needed to detect hatching
- ⏳ Marketplace listing — requires event sync

**Commission Tracking:**

- ✅ Commission calculation (hook 14)
- ✅ Commission claiming
- ⏳ Commission distribution logging — event sync needed

**What's Missing:**

- ⏳ Blockchain event listeners (EggMinted, AnimalMinted, CommissionDistributed, etc.)
- ⏳ Event-to-database sync logic
- ⏳ Wallet API deployment configuration
- ⏳ AES encryption upgrade for production

</code_context>

<specifics>
## Specific Ideas

### Event Sync Purpose (for downstream agents)

Blockchain event sync is needed because:

1. **Frontend performance**: Querying PocketBase is faster than direct blockchain queries
2. **Data aggregation**: Combine on-chain events with user profiles, referrals, off-chain metadata
3. **Real-time updates**: PocketBase subscriptions push updates to frontend instantly
4. **Historical queries**: Easy to query "all my eggs", "total commissions earned", etc.

### Events to Sync (priority order)

1. **EggMinted** — Update egg_nfts collection, set owner
2. **FoodMinted** — Update food_nfts collection, set owner
3. **AnimalMinted** — Update animal_nfts collection with rarity, species, generation
4. **EggHatched** — Mark egg as hatched, link to animal_nfts
5. **CommissionDistributed** — Update commission_records, increment user balances
6. **NFTListed** (marketplace) — Update nfts.is_listed, listed_price
7. **NFTSold** (marketplace) — Transfer ownership, update balances

### Sync Architecture Options

**Option A: PocketBase Hooks (simpler)**

```javascript
// Example hook pattern
pb_hooks/17-sync-events.pb.js
- Listen to contract events via ethers WebSocket
- On event: update PocketBase collections
- Run as background task within PocketBase process
```

**Option B: Separate Indexer Service (scalable)**

```javascript
// Dedicated Node.js service
indexer/
- Connect to BSC RPC (WebSocket)
- Subscribe to contract events
- Call PocketBase Admin API to update records
- Can scale independently, backfill historical data
```

**Recommended**: Start with Option A for MVP, migrate to Option B for production

### Deployment Command (reference)

```bash
# Wallet API
cd wallet-api
docker build -t eggo-wallet-api .
docker run -p 3001:3001 --env-file .env eggo-wallet-api

# PocketBase (already deployed at pb.eggoworld.io)
cd apps/backend
docker-compose up -d
```

</specifics>

<deferred>
## Deferred Ideas

**Out of scope for Phase 2 (backend implementation complete):**

- Historical event backfill (sync from block 0) — Phase 4 deployment
- Advanced analytics and reporting — Phase 6 admin dashboard
- Multi-chain event sync — Phase 7 multi-chain support
- Real-time WebSocket dashboard — Phase 3 frontend
- Admin moderation tools — Phase 6 admin dashboard

### Event Sync Deferred (MVP approach)

- Full indexer service — can use simpler hook-based sync for MVP
- Complex event aggregation — store raw events first, aggregate later
- Advanced filtering and search — basic queries sufficient for MVP

</deferred>

---

_Phase: 02-backend-integration_  
_Context gathered: 2026-04-02_  
_Next: Phase 3 - Frontend Marketplace (UI for all core actions)_

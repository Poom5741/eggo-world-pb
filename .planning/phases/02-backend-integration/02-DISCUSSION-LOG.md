# Phase 2: Backend Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02  
**Phase:** 02-backend-integration  
**Areas discussed:** Phase completion status, event sync requirements

---

## Phase 2 Assessment

### Implementation Status Review

| Component              | Status      | Count       | Notes                                                                                                    |
| ---------------------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| PocketBase Collections | ✅ Complete | 9           | users, nfts, transactions, referrals, user_wallets, egg_nfts, food_nfts, animal_nfts, commission_records |
| PocketBase Hooks       | ✅ Complete | 21          | 01-16 including wallet, referral, NFT minting, commission                                                |
| Wallet API             | ✅ Complete | 3 endpoints | /api/wallet/create, /api/wallet/balance, /api/wallet/transfer                                            |
| Event Sync             | ⏳ Pending  | N/A         | Needs implementation for blockchain → DB synchronization                                                 |

**Total:** Backend infrastructure 90% complete, event sync and deployment remaining

---

## User Decisions

### Decision 1: Event Sync Purpose

**Question:** Why do we need blockchain event sync?

**Explanation provided:**
When smart contracts execute (mint Egg, hatch animal, distribute commission), they emit EVENTS on-chain. These are like logs that say:

- "Egg #123 was minted to user 0xABC"
- "Egg #456 hatched into Legendary Dragon"
- "User 0xDEF earned 5 USDT commission"

**Why sync to PocketBase:**

1. Frontend needs to show: "Your eggs", "Your animals", "Your earnings" — querying blockchain directly is slow
2. PocketBase is fast for queries, has auth built-in, real-time subscriptions
3. We can combine on-chain data with user profiles, referrals, etc.

**Without sync:** Frontend must query blockchain directly for every NFT, balance, etc. (slow, complex)  
**With sync:** Frontend queries PocketBase (fast, simple), PocketBase stays updated from blockchain

**User's choice:** Continue with decisions

---

### Decision 2: Event Sync Strategy

**Question:** Hybrid sync approach — WebSocket for real-time events, block polling as fallback?

**User's choice:** ✓ Hybrid (recommended)

**Rationale:** Best of both worlds — real-time updates when connection is stable, polling ensures no missed events if WebSocket disconnects.

---

### Decision 3: Data Storage

**Question:** What event data should we persist?

**Options presented:**

1. Full event logs — Store raw event logs + processed data (full audit trail, more storage)
2. Processed data only — Store only processed data (balances, ownership) (lean, faster queries)
3. Hybrid — Processed data in main collections, raw logs in separate collection

**User's choice:** ✓ Processed data only

**Rationale:** MVP approach — store only what's needed for frontend queries. Can add full event logging later if needed for audits.

---

### Decision 4: Network Target

**Question:** Which network(s) should we sync?

**Options presented:**

1. Testnet only — Faster iteration, no real money at risk
2. Both (recommended) — Testnet + mainnet ready, deploy once, switch via config
3. Mainnet only — Skip testnet, go straight to production

**User's choice:** ✓ Both (recommended)

**Rationale:** Develop and test on testnet, production-ready config for mainnet deployment. No rework needed.

---

## Implementation Decisions Summary

### Backend Architecture

- ✅ 9 PocketBase collections configured
- ✅ 21 hooks implemented (wallet creation, referral chain, NFT minting, commission tracking)
- ✅ Wallet API with ethers v6 (create, balance, transfer endpoints)
- ⏳ Event sync pending (blockchain → PocketBase)

### Event Sync Decisions

- **Architecture:** Hybrid (WebSocket + polling fallback)
- **Data storage:** Processed data only (balances, ownership, earnings)
- **Network target:** Both testnet and mainnet
- **Priority events:** EggMinted, FoodMinted, AnimalMinted, EggHatched, CommissionDistributed

### OpenCode's Discretion

- Exact implementation approach (PocketBase hooks vs separate indexer service)
- Polling interval (recommended: every 10 blocks ~30s on BSC)
- Error handling and retry logic
- Wallet API deployment configuration

---

## Technical Notes

### Event Sync Implementation Options

**Option A: PocketBase Hooks (simpler for MVP)**

- Background task within PocketBase process
- Ethers WebSocket subscription
- Direct collection updates
- Pros: Simpler deployment, one service
- Cons: Tied to PocketBase lifecycle, harder to scale

**Option B: Separate Indexer Service (scalable)**

- Dedicated Node.js service
- WebSocket + polling hybrid
- PocketBase Admin API calls
- Pros: Independent scaling, backfill support
- Cons: More complex deployment

**Recommended for MVP:** Option A (PocketBase hooks)  
**Recommended for production:** Option B (separate indexer)

---

## Deferred Ideas

**Out of scope for Phase 2:**

- Historical event backfill (sync from block 0) — Phase 4
- Advanced analytics and reporting — Phase 6
- Multi-chain event sync — Phase 7
- Real-time WebSocket dashboard — Phase 3
- Admin moderation tools — Phase 6

---

_Discussion completed: 2026-04-02_  
_Decision: Phase 2 marked as implementation complete with event sync pending_  
_Next: Phase 3 - Frontend Marketplace_

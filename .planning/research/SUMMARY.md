# Research Summary — v0.0.7 Security & Quality

**Synthesized:** 2026-04-18  
**Milestone:** Security & Quality (replace mock endpoints, USDT tracking, mobile polish)

---

## Executive Summary

v0.0.7 is a **security-critical milestone** that replaces 4 mock blockchain endpoints in `wallet-api/server.js` with real ethers.js contract calls, implements USDT deposit tracking via event polling, and polishes mobile responsive design (320px-1440px). Research confidence is **HIGH** for contract integration patterns (extensive ethers.js docs + existing wallet infrastructure) and **MEDIUM** for deposit tracking (standard pattern but BSC reorg behavior needs validation).

**Recommended approach:** Implement wallet-api contract layer first (Phase 14) — this blocks all other features. Use polling with `eth_getLogs` (not WebSocket) for deposit tracking to match PocketBase architecture. Mobile gestures should use `@use-gesture/react` (lightweight, unified touch/mouse API). **Critical risks:** private key handling security, transaction finality assumptions, and duplicate deposit tracking — all have well-documented prevention patterns.

**Timeline estimate:** 3-5 days total (wallet-api: 1-2 days, track-deposit: 1 day, mobile polish: 1-2 days).

---

## Stack Additions

| Library/Tool               | Version       | Purpose                                                    | Notes                                                         |
| -------------------------- | ------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `@use-gesture/react`       | `^10.3.1`     | Touch gesture handling (swipe-to-refresh, egg card swipes) | 6KB bundle, React hooks pattern, works for both touch + mouse |
| Contract ABIs              | Manual JSON   | ERC-1155 NFT interface definitions                         | Hardcode minimal ABI in `server.js` to avoid file I/O         |
| `/contract-addresses.json` | Manual        | Deployed contract addresses by network                     | Network-specific addresses (testnet/mainnet)                  |
| `ethers.JsonRpcProvider`   | v6 (existing) | BSC RPC connection for contract calls                      | Already installed in `wallet-api/package.json`                |
| `ethers.Wallet`            | v6 (existing) | Transaction signing with decrypted private keys            | Reuse existing `decryptPrivateKey()` function (AES-256-GCM)   |

**Already Have (Reuse):**

- ✅ `ethers v6` — wallet-api dependency
- ✅ `decryptPrivateKey()` — lines 31-59 in `server.js`
- ✅ `MASTER_KEY` pattern — environment variable encryption
- ✅ Tailwind CSS 4 — responsive breakpoints
- ✅ TanStack Query — existing 30s polling pattern

**Avoid:**

- ❌ `web3.js` — ethers v6 already installed, smaller bundle
- ❌ WebSocket subscriptions — PocketBase incompatible, filterId state issues
- ❌ `react-swipeable` — @use-gesture/react does same + more

---

## Feature Table Stakes

### Must-Have (P0 — Blocks Launch)

1. **Real Contract Interactions** (wallet-api replacement)
   - Replace 4 mock endpoints: `mint-egg`, `claim-commission`, `mint-food`, `feed-egg`
   - Gas estimation + 20% buffer to prevent out-of-gas failures
   - Transaction pending/confirmed states with block explorer links
   - Error handling that doesn't expose internal errors

2. **USDT Deposit Tracking** (track-deposit hook)
   - Event polling via `eth_getLogs` (every 30-60s)
   - 12-15 block confirmations before marking as "confirmed"
   - Duplicate prevention via unique `tx_hash` constraint
   - Idempotency: track `last_polled_block` to prevent re-polling

3. **Mobile Responsive Breakpoints**
   - Bottom tab bar for mobile (<640px)
   - Touch targets minimum 44×44px (WCAG 2.2)
   - Safe area insets for iPhone notch (`env(safe-area-inset-bottom)`)
   - Test matrix: 320px, 375px, 768px, 1024px, 1440px

### Nice-to-Have (P2 — Differentiators)

1. **Feed Feature Completion**
   - Wire existing UI button (`apps/web/app/eggs/page.tsx:89`) to real contract call
   - Show feeding progress (X/10 food consumed)
   - Hatch animation when `food_count >= 10`

2. **Play Feature (Simple)**
   - Daily check-in for Food NFT reward (off-chain, database only)
   - Skip complex mini-games for v0.0.7

3. **Pull-to-Refresh on Egg List**
   - Reuse existing 30s polling pattern
   - Visual feedback on refresh (loading indicator)

### Anti-Features (Explicit NO)

- ❌ Auto-retry failed transactions — let user manually retry
- ❌ Hiding gas fees from users — show estimated cost in USDT
- ❌ Gesture-only navigation — always provide button alternative
- ❌ Hardcoded gas limits — use `estimateGas()` + 20% buffer
- ❌ Complex play mini-games — focus on core loop (Feed → Hatch → Sell)

---

## Watch Out For

### P0 - Security Critical (Blocks Launch)

| Pitfall                              | Consequence                                | Prevention                                                                         | Phase |
| ------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------- | ----- |
| **Private key logging**              | Complete wallet compromise                 | Never log `privateKey`, `signer`, `wallet` objects — log only `address`, `tx.hash` | 14    |
| **Transaction finality assumptions** | Users see funds that disappear after reorg | Wait 12+ confirmations on BSC before updating UI/balance                           | 14    |
| **Duplicate deposit tracking**       | Users get free USDT (economy inflation)    | Unique constraint on `tx_hash`, idempotency check before creating record           | 15    |
| **Chain reorganization**             | Tracked deposits that never occurred       | Store `block_hash` for each event, verify parent hash continuity                   | 15    |

### P1 - Quality Issues (Technical Debt)

| Pitfall                                | Consequence                              | Prevention                                                                                 | Phase |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | ----- |
| **Missing events due to RPC failures** | Lost user funds (not tracked)            | Retry with exponential backoff (1s, 2s, 4s), adaptive chunking for large ranges            | 15    |
| **Untested mobile breakpoints**        | Broken layouts on edge-case devices      | Test matrix: 320px, 375px, 768px, 1024px, 1440px (not just common sizes)                   | 16    |
| **Image scaling failures**             | Horizontal scroll, broken layouts        | `max-width: 100%`, Next.js Image component with `sizes` prop                               | 16    |
| **iOS input zoom**                     | Screen zooms unexpectedly on input focus | Font-size minimum 16px on all inputs (use `transform: scale()` if visually smaller needed) | 16    |

### P2 - Feature Exploits (Nice-to-Have)

| Pitfall                           | Consequence                                  | Prevention                                                                                          | Phase |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----- |
| **Feed economy exploits**         | Free hatches (economy inflation)             | Database transaction for atomic check-and-update, verify ownership of ALL food items                | 17    |
| **Race condition on consumption** | Same food NFT consumed multiple times        | Unique constraint on `(food_id, consumed)` where `consumed=true`, optimistic locking                | 17    |
| **Missing feed validation**       | Invalid blockchain transactions (wasted gas) | Verify egg not hatched, user owns egg, user owns all food, food not consumed, won't exceed 10 limit | 17    |

---

## Architecture Reminders

### Integration Pattern: Frontend → PocketBase → Wallet-API → Blockchain → Database

```
┌─────────────────────┐
│  User taps "Feed"   │
│  button in UI       │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  Frontend           │
│  (apps/web/app/    │
│   eggs/page.tsx)   │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  POST /api/v2/      │
│  feed-egg           │
│  (PocketBase hook)  │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  16-feed-egg.pb.js  │
│  - Verify ownership │
│  - Validate inputs  │
│  - Call wallet-api  │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  Wallet API         │
│  (POST /api/wallet/ │
│   feed-egg)         │
│  - Decrypt key      │
│  - Create signer    │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  Smart Contract     │
│  (FoodNFT + EggNFT) │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│  Hook updates DB    │
│  - egg_nfts.food_count++ │
│  - food_nfts.consumed=true │
└─────────────────────┘
```

### Build Order (Critical Dependencies)

```
Phase 14: Wallet-API Contract Layer (FOUNDATION — blocks all others)
    ↓
Phase 15: Track-Deposit Infrastructure (parallel with 16)
    ↓
Phase 16: Feed Feature (depends on 14)
    ↓
Phase 17: Play Feature (need design decision)

Phase 18: Mobile Polish (parallel with any phase)
```

### Environment Variables to Add

```bash
# wallet-api/.env
BSC_RPC_URL="https://bsc-testnet-rpc.publicnode.com"  # Testnet
BSC_MAINNET_RPC_URL="https://bsc-dataseed.binance.org"  # Mainnet

# Contract addresses (testnet)
EGG_NFT_ADDRESS="0x..."
FOOD_NFT_ADDRESS="0x..."
ANIMAL_NFT_ADDRESS="0x..."
COMMISSION_DISTRIBUTION_ADDRESS="0x..."
MARKETPLACE_ADDRESS="0x..."

# Security (NEVER commit)
WALLET_MASTER_KEY="<64-char-hex-from-openssl-rand-hex-32>"
```

### Security Patterns (Non-Negotiable)

1. **Never expose private keys** — key exists only in memory during contract call
2. **Use authenticated endpoints only** — `$apis.requireAuth(e)` in all hooks
3. **Validate ownership before contract calls** — verify user owns egg/food before calling wallet-api
4. **Idempotent operations** — check existence before creating deposit records

---

## Open Questions

| Question                                                                     | Impact                                                       | Decision Needed By |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------ |
| **Play feature mechanics** — What is "play"?                                 | Determines if on-chain contract or off-chain database update | Phase 17 planning  |
| **Contract deployment status** — Are contracts deployed? What are addresses? | Blocks wallet-api implementation (need actual addresses)     | Phase 14 planning  |
| **RPC endpoint selection** — Which BSC RPC provider? Rate limits?            | Affects polling frequency, error handling strategy           | Phase 14 planning  |
| **Deposit polling interval** — 30s vs 60s vs adaptive?                       | Trade-off between freshness vs RPC cost                      | Phase 15 planning  |
| **USDT contract address** — Testnet vs mainnet address?                      | Different addresses per network                              | Phase 15 planning  |

---

## Roadmap Recommendations

### Suggested Phase Structure

Based on research synthesis, recommend **5 phases** for v0.0.7:

#### Phase 14: Wallet-API Contract Integration (P0 — Foundation)

**Rationale:** Blocks all other features. Mock endpoints are security liability.

**Delivers:**

- Real ethers.js contract calls for mint-egg, claim-commission, mint-food, feed-egg
- Private key decryption flow (AES-256-GCM)
- Gas estimation + error handling
- Block explorer links in UI

**Features from FEATURES.md:** Real contract interactions, gas estimation, pending/confirmed states

**Pitfalls to avoid:** Private key logging (log only address/hash), insufficient confirmations (wait 12+ blocks), hardcoded gas limits (use estimateGas + 20%)

**Research needed:** ❌ No — standard ethers.js patterns, well-documented

---

#### Phase 15: USDT Deposit Tracking (P0 — Security)

**Rationale:** Critical for production economy. Prevents lost deposits, duplicate tracking.

**Delivers:**

- `eth_getLogs` polling service (every 30s)
- 12-block confirmation wait
- Unique constraint on `tx_hash`
- `last_polled_block` tracking for idempotency

**Features from FEATURES.md:** Event polling, duplicate detection, user notifications

**Pitfalls to avoid:** Duplicate tracking (unique DB constraint), chain reorgs (store block_hash), missing events (retry with backoff)

**Research needed:** ⚠️ Maybe — BSC reorg frequency needs validation during planning

---

#### Phase 16: Mobile Responsive Polish (P1 — Quality)

**Rationale:** Production users on mobile devices. Can run parallel with Phase 14.

**Delivers:**

- Bottom tab bar for mobile (<640px)
- Touch targets 44×44px minimum
- Safe area insets for iPhone
- Test matrix: 320px-1440px

**Features from FEATURES.md:** Responsive breakpoints, touch targets, safe area insets

**Pitfalls to avoid:** Untested breakpoints (test 320px, 375px, 768px, 1024px, 1440px), image scaling failures (max-width: 100%), iOS input zoom (16px minimum font)

**Research needed:** ❌ No — standard responsive patterns, well-documented

---

#### Phase 17: Feed Feature (P1 — Core Loop)

**Rationale:** Depends on Phase 14 (wallet-api contract calls). Core gameplay mechanic.

**Delivers:**

- Wire Feed button to contract call
- Food NFT picker UI
- Progress display (X/10 food consumed)
- Hatch notification when complete

**Features from FEATURES.md:** Feed mechanic, progress toward evolution, rarity bonus

**Pitfalls to avoid:** Race conditions (DB transaction for atomic update), missing validation (verify egg not hatched, user owns all food), economy exploits (optimistic locking)

**Research needed:** ❌ No — standard database ACID patterns

---

#### Phase 18: Play Feature (P2 — Nice-to-Have)

**Rationale:** Deferred pending game design decision. Can skip for MVP if needed.

**Delivers:** (TBD based on design decision)

- Option A: Daily check-in (off-chain, database only)
- Option B: Simple mini-game (tap/click rewards)
- Option C: Social interaction (show egg to friends)

**Features from FEATURES.md:** Daily check-in, social interaction

**Pitfalls to avoid:** Complex mini-games (defer to v2), on-chain state (prefer off-chain database)

**Research needed:** ⚠️ Yes — game mechanics undefined, needs design spec

---

### Research Flags

| Phase    | Needs `/gsd-research-phase`? | Reason                                               |
| -------- | ---------------------------- | ---------------------------------------------------- |
| Phase 14 | ❌ No                        | Standard ethers.js patterns, extensive docs          |
| Phase 15 | ⚠️ Maybe                     | BSC reorg behavior needs validation, RPC rate limits |
| Phase 16 | ❌ No                        | Standard responsive patterns, well-documented        |
| Phase 17 | ❌ No                        | Standard database ACID, existing hook code           |
| Phase 18 | ✅ Yes                       | Game mechanics undefined, needs design research      |

---

## Confidence Assessment

| Area             | Confidence | Notes                                                                                                                           |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Stack**        | HIGH       | ethers.js v6 docs (Context7), existing wallet infrastructure, standard patterns                                                 |
| **Features**     | MEDIUM     | Contract interactions (HIGH), deposit tracking (HIGH), Feed/Play mechanics (MEDIUM — inferred from similar games)               |
| **Architecture** | HIGH       | Existing code analyzed, integration patterns clear, hook code reviewed                                                          |
| **Pitfalls**     | MEDIUM     | Security patterns (HIGH from OWASP), BSC reorg behavior (MEDIUM — needs production validation), mobile testing (HIGH from WCAG) |

### Gaps to Address

1. **Contract addresses** — Need deployed contract addresses before Phase 14 can implement
2. **RPC provider selection** — Need to confirm BSC RPC URL, rate limits, archive node requirements
3. **Play feature design** — Need game mechanics decision before Phase 18 implementation
4. **USDT testnet address** — Different address for testnet vs mainnet, need to verify

---

## Sources

### STACK.md

- Context7: ethers.js v6 docs (websites/ethers_v6)
- theRpc.io: eth_getLogs best practices
- ethers.js GitHub #696, #4784: eth_getLogs pitfalls
- tailwindcss.com/docs: Breakpoint strategy
- GitHub pmndrs/use-gesture: @use-gesture/react patterns
- TanStack Query docs: Polling with refetchInterval

### FEATURES.md

- ethers.js v6 docs: TransactionResponse, waitForTransaction, estimateGas
- vfat-tools GitHub: Real-world transaction patterns (100+ DeFi implementations)
- Bit query docs: ERC-20 Transfer event polling
- Tatum docs: Deposit tracking webhook patterns
- PayzCore docs: USDT confirmation thresholds by network
- NNGroup, UXPin, Medium: Mobile navigation patterns 2025-2026
- Material Design: Touch target guidelines (48px minimum)
- Axie Infinity, CryptoKitties: NFT game feed mechanics

### ARCHITECTURE.md

- wallet-api/server.js: Current implementation analysis
- apps/backend/pb_hooks/: Hook patterns (13-mint-egg, 16-feed-egg, 13-track-deposit)
- apps/web/app/eggs/page.tsx: Frontend egg management UI
- Project documentation (AGENTS.md, README.md)

### PITFALLS.md

- Context7: Ethers v6 Wallet API, TransactionResponse docs
- OWASP Smart Contract Security guidelines
- QuickNode reorg handling docs
- EventDock idempotency patterns
- Bitium: "Best On-chain Data Indexing Solutions for dApps in 2026"
- ChainStack: "Ethereum redundant event listener"
- WCAG 2.2 guidelines: Target Size (Enhanced)
- Apple Human Interface Guidelines
- Zealynx: "Asset Duplication Attack"
- Mav Levin: "Check-then-Act" vulnerability

---

**Last Updated:** 2026-04-18  
**Next Action:** Roadmap planning based on this synthesis (gsd-roadmapper)

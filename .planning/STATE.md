---
gsd_state_version: 1.0
milestone: v0.2.0
milestone_name: Functional Spec 100% Completion
status: active
last_updated: "2026-04-25T15:22:00.000Z"
progress:
  total_phases: 9
  completed_phases: 9
  total_plans: 12
  completed_plans: 12
  deferred_plans: 0
  spec_gaps: 0
---

# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace  
**Milestone:** v0.2.0 Functional Spec 100% Completion — ACTIVE  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, breed new generations, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Achieve 100% functional spec implementation by closing 12 identified gaps.

---

## Current Position

**v0.2.0 Milestone:** ✅ COMPLETE — 9/9 phases executed

```
Milestone v0.2.0: [██████████] 100% — 9/9 phases complete
          Phase 32 → Marketplace Stats API (MSTAT-01, STATS-01, STATS-02) ✅ COMPLETE
          Phase 33 → Recruitment Bonus USDT Rewards (RECRUIT-01) ✅ COMPLETE
          Phase 34 → VRF Integration for Randomness (VRF-01) ✅ COMPLETE
          Phase 35 → Admin Game Config Functions (ADMIN-01-04) ✅ COMPLETE
          Phase 36 → NFT Burn & KYC Toggle (BURN-01, KYC-01) ✅ COMPLETE
          Phase 37 → Smart Contract Updates (VRF, Burn, AdminConfig) ✅ COMPLETE
          Phase 38 → Wallet API Endpoints (7 new endpoints) ✅ COMPLETE
          Phase 39 → Collection Schema Updates (10 new fields) ✅ COMPLETE
          Phase 40 → Frontend Components (4 UI components) ✅ COMPLETE
```

**Goal:** 100% functional spec completion (47/47 functions)
**Current:** 100% implemented (47/47 functions) ✅
**Gaps:** 0 — ALL CLOSED

---

## Spec Gap Analysis Summary

| Gap ID     | Priority | Description                                                     | Phase |
| ---------- | -------- | --------------------------------------------------------------- | ----- |
| MSTAT-01   | P1       | getMarketStats() API - floor price, 24h volume, active listings | 32    |
| STATS-01   | P2       | getPlatformStats API - revenue/volume/users                     | 32    |
| STATS-02   | P1       | getUserReferralStats() API - referral tree                      | 32    |
| RECRUIT-01 | P1       | Recruitment bonus USDT rewards + multipliers (×2/×4/×6/×10)     | 33    |
| VRF-01     | P1       | VRF for randomness (pseudo-random → verifiable)                 | 34    |
| ADMIN-01   | P2       | setPlatformFee(percent) - dynamic fee config                    | 35    |
| ADMIN-02   | P2       | setBreedCooldown(seconds) - dynamic cooldown                    | 35    |
| ADMIN-03   | P2       | updateRarityWeights(weights[]) - drop rate tuning               | 35    |
| ADMIN-04   | P2       | addNewSpecies - expand species catalog                          | 35    |
| BURN-01    | P2       | burnNFT(nft_id) - general NFT burning                           | 36    |
| KYC-01     | P2       | setKYCRequired(bool) - KYC toggle                               | 36    |
| SPEND-01   | P3       | spendUSDT explicit function                                     | 36    |

---

## Deferred Items (Acknowledged at Milestone Close)

Items acknowledged and deferred at v0.1.0 milestone close on 2026-04-25:

| Category     | Phase | Item                         | Status   | Source |
| ------------ | ----- | ---------------------------- | -------- | ------ |
| UAT          | 10    | Polling badge UAT scenarios  | deferred | v0.0.7 |
| UAT          | 17    | UAT & verification gaps      | deferred | v0.0.7 |
| UAT          | 20    | UAT execution scenarios      | deferred | v0.0.8 |
| UAT          | 21    | Breeding system UAT          | deferred | v0.0.8 |
| UAT          | 22    | Tier rewards UAT             | deferred | v0.0.8 |
| UAT          | 23    | Secondary market UAT         | deferred | v0.0.8 |
| UAT          | 26    | Phase 23 UAT gaps (resolved) | deferred | v0.0.9 |
| UAT          | 27    | Rarity upgrade UAT           | deferred | v0.0.9 |
| UAT          | 28    | Wallet withdrawal UAT        | deferred | v0.0.9 |
| UAT          | 29    | Admin controls UAT           | deferred | v0.0.9 |
| UAT          | 30    | Cloudflare deployment UAT    | deferred | v0.0.9 |
| Verification | 03    | VERIFICATION gaps_found      | deferred | v0.0.5 |
| Verification | 12    | VERIFICATION gaps_found      | deferred | v0.0.7 |
| Verification | 19    | VERIFICATION human_needed    | deferred | v0.0.7 |
| Verification | 20    | VERIFICATION human_needed    | deferred | v0.0.8 |
| Context      | 08    | Open questions (resolved)    | deferred | v0.0.6 |

**Note:** Phase 31 fixed the 3 critical UAT bugs from v0.0.9 deferred items (polling badge, breeding dialog, marketplace routing).

**Completed Phase 12 Goals:**

- ✅ Replaced 4 mock blockchain endpoints with real ethers.js contract calls
- ✅ Implemented PocketBase admin auth for encrypted private key access
- ✅ Added gas sponsorship tracking (logging only for MVP)
- ✅ Auto-retry transient errors (3x, exponential backoff)
- ✅ Deployed to 0xl3 testnet (Chain ID: 7117)
- ✅ claim-commission handles zero balance gracefully (no tx sent)
- ✅ feed-egg validates ownership and hatching status
- ✅ feed-egg validates foodCount < 10 (Plan 12-04 gap closure - SEC-04 complete)
- ✅ All endpoints return real transaction hashes
- ✅ 12-block confirmation wait on all transactions

---

## Performance Metrics

| Metric                     | Value           | Target |
| -------------------------- | --------------- | ------ |
| **Phases Complete**        | 9/9             | 9/9    |
| **Requirements Satisfied** | 24/24           | 24/24  |
| **Test Coverage**          | 80%+            | 80%+   |
| **Test Failures**          | 0               | 0      |
| **Build Time**             | 2.5s (Bun)      | < 5s   |
| **LOC**                    | ~65K TypeScript | -      |

---

| Phase 38-wallet-api-endpoints P01-02 | 0 | 2 plans | 1 file |
| Phase 12-wallet-api-contract-integration P02 | 120 | 1 tasks | 2 files |

## Quick Tasks Completed

| Task                | Date       | Description                                                 | Status      |
| ------------------- | ---------- | ----------------------------------------------------------- | ----------- |
| accessibility-fixes | 2026-04-19 | Fix critical WCAG 2.2 AA compliance issues in Phase 14      | ✅ Complete |
| fast-commit         | 2026-04-24 | Atomic commit: error handling improvements across API calls | ✅ Complete |

## Accumulated Context

### v0.0.6 Archived (2026-04-19)

**Milestone:** Frontend Migration & Integration
**Duration:** 13 days (2026-04-05 → 2026-04-18)
**Final Audit:** 2026-04-19 (v0.0.6-FINAL-AUDIT.md)
**Phases:** 5 phases (8, 9, 10, 11, 13)
**Requirements:** 19/19 scoped satisfied ✓

**Accomplishments:**

- Claymorphism UI migration with Material Symbols icons
- Real-time wallet with exponential backoff polling (30s→5min)
- Buddy Chain referral visualization (G1 20%, G2-G4 10%)
- Egg management with feed/hatch flows and 12-second animation
- NFT marketplace with complete buy/sell flows
- Smart contract integration (Phase 12 in v0.0.7)
- Mobile responsive polish with WCAG 2.2 AA compliance
- Feed feature with manual food selection grid
- Documentation sync with accurate traceability

**Key Learnings:**

1. **Don't use user's password for wallet encryption** — PocketBase hashes passwords; generate random password, store in `pin` field
2. **`e.next()` is MANDATORY** — Without it, PocketBase never commits records
3. **Use `onRecordBeforeCreate`** — Set fields BEFORE commit, not after
4. **Use environment variables** — Don't hardcode API URLs (`WALLET_SRV_URL`)
5. **Always check reference implementations FIRST** — `/resources/` has working examples
6. **Production infrastructure ≠ local** — Test end-to-end on production, not just localhost

**Critical Files:**

- Hook fix: `apps/backend/pb_hooks/01-create-wallet.pb.js`
- Reference: `resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js`
- Wallet API: `wallet-api/server.js`

---

### v0.0.7 In Progress (Started 2026-04-18)

**Milestone:** Security & Quality
**Status:** 7/7 phases complete (100%), Phase 19 added
**Remaining:** Phase 19 (Real NFT Mint Flow & Marketplace Integration)

**FIXED:**

- ✅ Mock blockchain calls — Phase 12 completed, all endpoints return real transaction hashes
- ✅ Mobile responsive gaps — Phase 14 completed, WCAG 2.2 AA compliant
- ✅ Feed feature — Phase 15 completed with manual selection grid
- ✅ USDT deposit tracking — Phase 13 completed with 12-block confirmation
- ✅ Test infrastructure — Phase 16 completed, 49 new tests, 80%+ coverage
- ✅ Play feature — Phase 16 completed with daily check-in and streak rewards
- ✅ Phase 08 marked complete — All 3 plans executed with summaries
- ✅ Phase 17 completed — All UAT & verification gaps closed (Buy Now flow, dashboard polling, foodCount validation)
- ✅ Phase 18 completed — LINE OAuth wallet auto-creation fixed

**REMAINING:**

- Phase 20: NFT Flow Polish & UAT Execution (gaps from Phase 12 + 19 + deferred UAT)

---

### Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-24:

| Category | Phase | Item                                                 | Status   | Severity |
| -------- | ----- | ---------------------------------------------------- | -------- | -------- |
| UAT      | 10    | Polling "Updating..." badge not displayed            | deferred | major    |
| UAT      | 10    | Feed/Hatch flow tests (blocked by data state)        | deferred | blocked  |
| UAT      | 21    | Breeding dialog Parent 2 selection bug               | deferred | blocker  |
| UAT      | 23    | Marketplace detail page "Product not found"          | deferred | blocker  |
| UAT      | 27    | Rarity upgrade tests (blocked by no eggs >= 10 food) | deferred | blocked  |
| UAT      | 28    | Admin CoinStor dashboard (blocked by non-admin user) | deferred | blocked  |
| Plan     | 25    | Shadow/border migration (~55 files)                  | deferred | P2       |

**Root Causes Identified:**

1. **Phase 10 Polling Badge**: API polling works (egg_nfts collection polled) but no visual "Updating..." badge rendered. Missing UI component for isPolling state.

2. **Phase 21 Breeding Dialog**: All animals have animal_id=0 in database, causing filter logic to exclude ALL animals when Parent 1 selected. Data integrity issue.

3. **Phase 23 Detail Page**: Static route /marketplace/detail?id=X shows "Product not found" - may be missing data or incorrect query.

**Resolution Path:** Create Phase 31 for UAT Gap Closure to fix these issues post-archival.

---

## Blockers

**No blockers currently active.** ✅

Previous blocker (pre-commit lint errors) was resolved — lint now shows 0 errors, 208 warnings.

---

## Roadmap Evolution

- Phase 26 added: Phase 23 UAT Gap Closure (fix rarity filter, listing UX, duplicates, route 404)
- Phase 37 added: Smart Contract Updates (VRF, Burn, AdminConfig)
- Phase 38 added: Wallet API Endpoints (7 new endpoints)
- Phase 39 added: Collection Schema Updates (10 new fields)
- Phase 40 added: Frontend Components (4 UI components)

---

### Technical Debt

**Security (P0 — Blocks Launch):**

- ✅ wallet-api/server.js — All 4 mock endpoints replaced with real contract calls (Phase 12)
- ✅ USDT deposit tracking — Phase 13 completed with 12-block confirmation

**Quality (P1):**

- ✅ Test infrastructure — All vi.mock failures fixed (Phase 16)
- ✅ Test coverage — 80%+ achieved (Phase 16)
- ✅ Play feature — Daily check-in with streak rewards implemented (Phase 16)

**Mobile (P2):**

- ✅ Bottom tab bar implemented (Phase 14)
- ✅ Touch targets meet 44x44px minimum (Phase 14)
- ✅ Breakpoints tested: 320px, 375px, 768px, 1024px, 1440px (Phase 14)

---

### Decisions Log

| Decision                                    | Phase | Rationale                                                                   | Status    |
| ------------------------------------------- | ----- | --------------------------------------------------------------------------- | --------- |
| Use ethers.js v6 (not web3.js)              | 12    | Already installed, smaller bundle, better docs                              | ✅ Active |
| Polling (not WebSocket) for deposits        | 13    | Matches PocketBase architecture, simpler state management                   | ✅ Active |
| @use-gesture/react for touch                | 14    | 6KB bundle, unified touch/mouse API, React hooks pattern                    | ✅ Active |
| Hardcode minimal ABI in server.js           | 12    | Avoid file I/O, keep deployment simple                                      | ✅ Active |
| 12-block confirmation wait                  | 12    | Standard for BSC, balance security vs UX                                    | ✅ Active |
| Daily check-in (off-chain)                  | 16    | Skip complex mini-games for MVP, database only                              | ✅ Active |
| Check balance before claiming commission    | 12    | Save gas, better UX (no tx when zero balance)                               | ✅ Active |
| Ownership verification for feed-egg         | 12    | Prevent unauthorized feeding (security)                                     | ✅ Active |
| 20% gas buffer on transactions              | 12    | Prevent out-of-gas failures (especially feedEgg variable)                   | ✅ Active |
| foodCount validation before gas estimation  | 12-04 | Save users from paying gas for hatched eggs                                 | ✅ Active |
| 400 status for EGG_HATCHED error            | 12-04 | Client error semantics, clearer debugging                                   | ✅ Active |
| Non-blocking PB callback on mint            | 19-01 | PB record creation failure logs error but doesn't fail mint                 | ✅ Active |
| Mint uses user wallet for gas (MVP)         | 19-04 | Full gas sponsorship requires meta-transactions (out of scope)              | ✅ Active |
| Rename currentFoodCount to preFeedFoodCount | 20-01 | Avoid JS const redeclaration in same try block scope                        | ✅ Active |
| eval(hookSource) for pb_hook unit tests     | 20-01 | ES module caching prevents re-evaluation; eval ensures fresh mocked globals | ✅ Active |
| Relayer wallet for recruitment bonus        | 38    | Subsidize gas for food mint + USDT transfer, better UX                      | ✅ Active |
| User wallet for VRF operations              | 38    | VRF requires egg owner as msg.sender; user pays gas for own randomness      | ✅ Active |
| ADMIN_PRIVATE_KEY for all admin setters     | 38    | Follows Phase 29 pattern; onlyOwner on contract for defense in depth        | ✅ Active |
| Separate getEggNFTConfigContract() helper   | 38    | Extended ABI without modifying existing getEggNFTContract() for Phase 29    | ✅ Active |
| Parallel Promise.all for game-config views  | 38    | 8 RPC reads in one round trip for performance                               | ✅ Active |

---

## Session Continuity

**Last Session:** 2026-04-25T06:21:00.000Z

**Session Notes:**

- Phase 38 COMPLETED — 10 wallet-api endpoints in server.js: claim-recruitment-bonus, hatch-egg-vrf, check-vrf-fulfillment, 4 admin config setters (set-platform-fee, set-breed-cooldown, update-rarity-weights, add-species), set-kyc-required, burn-nft, game-config
- 1 file modified: wallet-api/server.js (840 lines added, 2780 total)
- All endpoints: standard {success, data/error} format, 12-block confirmations, gas estimation with 20% buffer
- Relayer wallet for claim-recruitment-bonus, admin key for admin endpoints, user wallet for VRF operations

- v0.0.6 milestone archived with final audit (19/19 requirements complete)
- v0.0.7 MILESTONE: 8/8 phases complete (100%), Phase 20 added for gap closure
- Phase 17 COMPLETED — All UAT & verification gaps closed
- Phase 18 COMPLETED — LINE OAuth wallet auto-creation fixed
- Phase 19 COMPLETED — Real NFT mint flow & marketplace integration
- Phase 20 ✅ COMPLETED — All automated deliverables verified, UAT execution deferred by user request
  - 20-01: Code fixes (empty state CTA → /marketplace, FEED ME wired, hook foodCount fast-fail)
  - 20-02: UAT checklist (20-UAT.md) with 16 scenarios ready for manual execution
  - 20-03: Gas sponsorship runbook (docs/GAS_SPONSORSHIP.md, 519 lines, 11 sections)
  - 12 unit tests pass (6 page + 6 hook)
  - Code review: 1 critical (pre-existing filter injection), 4 warnings, 3 info items noted
- UAT gaps (Phase 10/17) documented and deferred to Phase 20
- Debug session (LINE OAuth daccPublickey) resolved
- Phase 08 open questions (Material Symbols) closed
- **Phase 21 CONTEXT GATHERED** — Breeding system context captured
  - 12 implementation decisions locked (D-01 through D-12)
  - 4 gray areas discussed: breeding UI, cooldown UX, egg handling, navigation
  - Dialog-based breeding flow with two animal slots (reuse FeedDialog pattern)
  - Visual countdown timer + multi-layer validation (UI → hook → contract)
  - Breeding eggs mixed in /eggs page with special badge
  - Access via animal card action menu (no dedicated route)

**Next Session Actions:**

1. Plan Phase 27 (Egg Rarity Upgrade) using `/gsd-plan-phase 27`
2. Note: Phase 27 requires contract modification (increase max food limit, remove upgrade fee)

---

## Phase 25 Progress (In-Progress)

**Status:** Partially complete — accessibility fixes done, documentation created, pre-commit blocker pending

### Completed Tasks

| Task           | Description                              | Status                                                     |
| -------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Plan 25-01-01  | Icon mapper creation (species-icons.tsx) | ✅ Done (previous run)                                     |
| Plan 25-01-02  | Emoji → icon migration (16 files)        | ✅ Done (previous run, 10 commits)                         |
| Plan 25-01-03  | Hardcoded color migration                | ✅ Done (LINE button colors, previous run)                 |
| Plan 25-01-04a | Form label associations                  | ✅ Done (join/page.tsx — 2 inputs fixed)                   |
| Plan 25-01-04b | Keyboard accessible interactive elements | ✅ Done (app/page.tsx — 3 div→button conversions)          |
| Plan 25-01-04c | Skip navigation link                     | ✅ Done (layout.tsx)                                       |
| Plan 25-01-04d | Dead link remediation                    | ✅ Done (9 links fixed, coming-soon page created)          |
| Plan 25-01-04e | Missing focus states                     | ✅ Done (social icons with focus ring)                     |
| Plan 25-02-01  | Container width standards doc            | ✅ Done (LAYOUT-STANDARDS.md)                              |
| Plan 25-02-02  | Typography utility classes               | ✅ Done (globals.css — font-heading, text-heading-xl/etc.) |
| Plan 25-02-03  | Button component documentation           | ✅ Done (BUTTON-VARIANTS.md — no code changes needed)      |
| Plan 25-02-04  | Card component documentation             | ✅ Done (CARD-VARIANTS.md — no code changes needed)        |

### Pending Tasks

| Task          | Description                          | Notes                              |
| ------------- | ------------------------------------ | ---------------------------------- |
| Plan 25-03-01 | Shadow/border radius migration       | ~55 files, requires manual review  |
| Plan 25-03-02 | LayoutStandard component + migration | Lower priority (P2)                |
| Plan 25-03-03 | Interaction polish batch fixes       | Partially done via utility classes |

### Blockers

See "Blockers" section above — 6 pre-existing ESLint errors blocking all commits.

**Staged files ready for commit:** 10 files (4 accessibility + 4 docs + globals.css + coming-soon)

**Context Handoff:**

- v0.0.6 ARCHIVED — All scoped requirements satisfied, final audit complete
- v0.0.7 IN PROGRESS — 8/8 phases complete (100%), Phase 20 added, ready for archive
- Phase 17 COMPLETED — All UAT & verification gaps documented and deferred
- Phase 18 COMPLETED — LINE OAuth wallet auto-creation fixed
- Phase 19 COMPLETED — Real NFT mint flow & marketplace integration
  - Mint endpoint with PocketBase callback (19-01)
  - Gas sponsorship system with relayer wallet (19-04)
  - Mint Egg page (/mint) with navigation (19-02)
  - On-chain marketplace buy flow integration (19-03)
  - E2E test suite + verification checklist (19-05)
- Phase 20 CONTEXT GATHERED — Gap closure & UAT execution context captured
  - 14 implementation decisions locked (D-01 through D-14)
  - 4 gray areas discussed: UAT strategy, bug fixes, foodCount validation, gas docs
  - Phase 12 gap: feed-egg foodCount validation (dual-layer: hook + wallet-api)
  - Phase 19 gap: gas sponsorship documentation (operator runbook at docs/GAS_SPONSORSHIP.md)
  - Phase 10/17: deferred UAT scenarios (16 total: 10 + 6) → tracked in 20-UAT.md
  - Bug fixes: empty state CTA → /marketplace, FeaturedEggHero FEED ME wired to FeedDialog
- **Phase 21 COMPLETED** — Breeding system implementation (6/6 plans complete)
- **Phase 22 COMPLETED** — Tier rewards & badges implemented (3/3 plans complete)
  - Wave 1 (22-01): TierBadge.sol ERC-5192 contract, tier_claims & tier_badges collections
  - Wave 2 (22-02): check-tier-reward hook, wallet-api tier-claim endpoint, UI components
  - Wave 3 (22-03): Dashboard tier section, /dashboard/tiers page, barrel exports
  - 23 implementation decisions locked (D-01 through D-23)
  - 6 gray areas discussed: contract design, backend hook, thresholds, rewards, profile integration, frontend patterns
  - ERC-5192 soulbound badge contract design
  - Multi-layer validation for tier claims (hook → wallet-api → contract)
  - Tier thresholds: Seedling (10), Grower (100), Farmer (1,000) items
  - USDT rewards: $5, $50, $500 respectively from CoinStor reserve
- **Phase 24 PLANNED** — Polish & Launch Prep (3/3 plans)
  - 24-01: Error Boundaries (6 routes) + Monitoring Dashboard (transaction_logs collection, /admin/monitoring page)
  - 24-02: Performance (@next/bundle-analyzer, dynamic imports) + Onboarding Tutorial (4-step overlay)
  - 24-03: Recruitment Bonus (Food NFTs at 10/100/1,000/10,000) + Launch Checklist (24-LAUNCH-CHECKLIST.md)
- All P0 security issues FIXED (Phases 12, 13)
- All P1 quality issues FIXED (Phases 14, 15, 16)
- Mobile responsive complete with WCAG 2.2 AA compliance
- Feed feature complete with manual selection and ready-to-hatch indicators
- Play feature complete with daily check-in, streak rewards, and balance modal
- Test infrastructure fixed, 80%+ coverage achieved
- Buy Now flow implemented and verified (Phase 17)
- Debug session resolved: LINE OAuth daccPublickey format fix (Phase 18)
- Open questions closed: Phase 08 Material Symbols integration (answered during implementation)

---

## Environment

**Production:**

- PocketBase: `https://pb.eggoworld.io`
- Frontend: Cloudflare Pages (static export)
- Network: BSC mainnet (Chain ID: 56)

**Development:**

- PocketBase: `http://localhost:8090` (Docker)
- Frontend: `http://localhost:3000` (Bun)
- Wallet API: `http://localhost:3001` (Bun)
- Network: 0xl3 testnet (Chain ID: 7117, https://rpc.0xl3.com) ← Phase 12 deployment target
- Network: BSC testnet (Chain ID: 97) ← Legacy, use 0xl3 for Phase 12

**SSH Access:**

- Host: `root@204.168.144.14`
- Production path: `/root/eggo-world-pb`

---

## Antipatterns (NEVER DO)

- ❌ Use user's password for wallet encryption (it's hashed)
- ❌ Skip reading reference implementations (`/resources/`)
- ❌ Commit `.env` files with real secrets
- ❌ Hardcode wallet API URLs — use `$os.getenv("WALLET_SRV_URL")`
- ❌ Use `onRecordCreate` without `e.next()` — record won't commit
- ❌ Commit `.next/` build artifacts or PocketBase binary
- ❌ Access `window`, `localStorage` in initial render (hydration mismatch)
- ❌ Access `pb.authStore.record` during SSR (use `useIsHydrated()` hook)

---

_Last updated: 2026-04-23 — Phase 26 added for Phase 23 UAT gap closure (4 issues: rarity filter syntax, listing confirmation UX, duplicate listing validation, animal detail route fix)_

```

```

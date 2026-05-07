# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace  
**Milestone:** v0.0.7 Security & Quality  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Phase 14 — Mobile Responsive Polish (independent, can run parallel)

**Constraints:**

- 2-week timeline (urgent)
- Solo developer
- Static export for Cloudflare Pages
- LINE OAuth only (no email/password)

---

## Current Position

**Next Phase:** 14 — Mobile Responsive Polish  
**Status:** Plans created, ready for execution

```
Progress: [████----] 2/5 phases complete
          Phase 12 ✅ | Phase 13 ✅ | Phase 14 → Next
```

**Completed Phases:**

### Phase 12: Wallet-API Contract Integration ✅

**Goal:** Replace 4 mock blockchain endpoints with real ethers.js contract calls  
**Status:** ✅ SHIPPED TO PRODUCTION (PR #2)  
**Plans:** 3/3 executed

- ✅ 12-01: Contract deployment infrastructure (Deploy.s.sol, contract-addresses.json)
- ✅ 12-02: Replace mint-egg and mint-food mocks with real contract calls
- ✅ 12-03: Replace claim-commission and feed-egg mocks, add gas sponsorship

### Phase 13: USDT Deposit Tracking ✅

**Goal:** Automated USDT deposit tracking with 12-block confirmation wait  
**Status:** ✅ All tests passing (44/44), all SEC requirements satisfied  
**Plans:** 3/3 executed

- ✅ 13-01: Config & Schema Update (contract addresses + deposits collection fields)
- ✅ 13-02: Hook Rewrite (background polling, confirmation tracking, reorg detection)
- ✅ 13-03: Test Suite Update (44 tests, 8 suites, bun:test)

**Next Action:** Execute Phase 14 (Mobile Responsive Polish) or Phase 15 (Feed Feature)

---

## Performance Metrics

| Metric                     | Value           | Target |
| -------------------------- | --------------- | ------ |
| **Phases Complete**        | 2/5             | 5/5    |
| **Requirements Satisfied** | 8/16            | 16/16  |
| **Test Coverage**          | 70%             | 80%+   |
| **Test Failures**          | 9 vi.mock       | 0      |
| **Build Time**             | 2.5s (Bun)      | < 5s   |
| **LOC**                    | ~60K TypeScript | -      |

---

## Accumulated Context

### v0.0.6 Completed (2026-04-18)

**Milestone:** Frontend Migration & Integration  
**Duration:** 13 days (2026-04-05 → 2026-04-18)  
**Phases:** 5 phases (14 plans, 25 tasks)  
**Requirements:** 25/25 satisfied ✓

**Accomplishments:**

- Claymorphism UI migration with Material Symbols icons
- Real-time wallet with exponential backoff polling (30s→5min)
- Buddy Chain referral visualization (G1 20%, G2-G4 10%)
- Egg management with feed/hatch flows and 12-second animation
- NFT marketplace with complete buy/sell flows
- 268/277 tests passing (9 pre-existing vi.mock failures)

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

### Known Issues (v0.0.7 Scope)

1. **Test setup** — 9 vi.mock failures (pre-existing, QUAL-01) — Phase 16 scope
2. **Feed/Play buttons** — TODO in UI, need real implementation (FEAT-01 to FEAT-07) — Phase 15/16 scope
3. **Mobile responsive** — Bottom tab bar, touch targets, breakpoints — Phase 14 scope

---

### Technical Debt

**Security (P0):**

- ✅ RESOLVED — Phase 12 replaced all 4 mock endpoints with real ethers.js contract calls
- ✅ RESOLVED — Phase 12 shipped to production

**Quality (P1):**

- 9 test files with vi.mock setup failures — Phase 16 scope
- Test coverage at 70%, target 80%+ — Phase 16 scope
- ✅ RESOLVED — Phase 13 deposit hook (13-track-deposit.pb.js) fully implemented with 44 passing tests

**Mobile (P2):**

- Bottom tab bar needed for mobile (< 640px) — Phase 14 scope
- Touch targets need 44×44px minimum (WCAG 2.2) — Phase 14 scope
- Breakpoints need testing: 320px, 375px, 768px, 1024px, 1440px — Phase 14 scope

---

### Decisions Log

| Decision                             | Phase | Rationale                                                 | Status    |
| ------------------------------------ | ----- | --------------------------------------------------------- | --------- |
| Use ethers.js v6 (not web3.js)       | 12    | Already installed, smaller bundle, better docs            | ✅ Active |
| Polling (not WebSocket) for deposits | 13    | Matches PocketBase architecture, simpler state management | ✅ Active |
| @use-gesture/react for touch         | 14    | 6KB bundle, unified touch/mouse API, React hooks pattern  | ✅ Active |
| Hardcode minimal ABI in server.js    | 12    | Avoid file I/O, keep deployment simple                    | ✅ Active |
| 12-block confirmation wait           | 13    | Standard for BSC, balance security vs UX                  | ✅ Active |
| Daily check-in (off-chain)           | 16    | Skip complex mini-games for MVP, database only            | ✅ Active |

---

## Session Continuity

**Last Session:** 2026-05-07 — Phase 13 documentation completed

**Session Notes:**

- Phase 12: ✅ Completed and shipped to production (PR #2)
- Phase 13: ✅ Fully implemented with 44 passing tests
  - 13-01: Contract addresses updated in 00-config.pb.js
  - 13-02: Background polling hook (13-track-deposit.pb.js, 386 lines)
  - 13-03: Test suite (44 tests, 8 suites, all passing)
- Summary/verification documents created for all 3 plans

**Files to Preserve:**

- `.planning/ROADMAP.md` — Phase structure with success criteria
- `.planning/STATE.md` — This file (project memory)
- `.planning/phases/13-usdt-deposit-tracking/` — All plan, summary, verification docs
- `.planning/phases/12-wallet-api-contract-integration/` — Phase 12 artifacts

**Next Session Actions:**

1. Execute Phase 14 (Mobile Responsive Polish) — plans exist, can run parallel
2. Or execute Phase 15 (Feed Feature) — depends on Phase 12 (done ✅)
3. Or execute Phase 16 (Play Feature + Test Infrastructure)

**Context Handoff:**

- Phases 12 (Wallet-API) and 13 (USDT Deposit) complete ✅
- Phase 14 (Mobile Responsive) — independent, plans created
- Phase 15 (Feed Feature) — depends on Phase 12 (resolved), plans created
- Phase 16 (Play Feature + Test Infrastructure) — plans created
- 8/16 requirements satisfied (all SEC requirements = SEC-01 to SEC-08)

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
- Network: 0xl3 testnet (Chain ID: 7117, https://rpc.0xl3.com) ← Phase 12 deployed

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

_Last updated: 2026-05-07 — Updated by gsd-manager_

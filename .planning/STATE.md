---
gsd_state_version: 1.0
milestone: v0.0.7
milestone_name: milestone
status: unknown
last_updated: "2026-04-19T03:54:36.000Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
---

# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace  
**Milestone:** v0.0.7 Security & Quality  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Phase 14 — Mobile Responsive Polish (Complete ✅)

**Constraints:**

- 2-week timeline (urgent)
- Solo developer
- Static export for Cloudflare Pages
- LINE OAuth only (no email/password)

---

## Current Position

**Phase 14: COMPLETE ✅**  
**Next Phase:** 15 (Feed Feature) — Ready to start

```
Progress: [█████-----] 4/5 phases complete
          Phase 14 → ✅ COMPLETE (1 plan, mobile responsive polish)
          Phase 15 → Next
```

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
| **Phases Complete**        | 0/5             | 5/5    |
| **Requirements Satisfied** | 0/16            | 16/16  |
| **Test Coverage**          | 70%             | 80%+   |
| **Test Failures**          | 9 vi.mock       | 0      |
| **Build Time**             | 2.5s (Bun)      | < 5s   |
| **LOC**                    | ~60K TypeScript | -      |

---
| Phase 12-wallet-api-contract-integration P02 | 120 | 1 tasks | 2 files |

## Quick Tasks Completed

| Task | Date | Description | Status |
|------|------|-------------|--------|
| accessibility-fixes | 2026-04-19 | Fix critical WCAG 2.2 AA compliance issues in Phase 14 | ✅ Complete |

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

**FIXED:**

- ✅ Mock blockchain calls — Phase 12 completed, all endpoints now return real transaction hashes

**REMAINING:**

1. **Test setup** — 9 vi.mock failures (pre-existing, QUAL-01)
2. **Feed/Play buttons** — TODO in UI, need real implementation (FEAT-01 to FEAT-07)
3. **Track deposit hook** — Not implemented, tests in RED PHASE (SEC-05 to SEC-08)

---

### Technical Debt

**Security (P0 — Blocks Launch):**

- ✅ wallet-api/server.js — All 4 mock endpoints replaced with real contract calls (Phase 12)

**Quality (P1):**

- 9 test files with vi.mock setup failures
- Test coverage at 70%, target 80%+
- Track-deposit hook (13-track-deposit.pb.js) not implemented

**Mobile (P2):**

- Bottom tab bar needed for mobile (< 640px)
- Touch targets need 44×44px minimum (WCAG 2.2)
- Breakpoints need testing: 320px, 375px, 768px, 1024px, 1440px

---

### Decisions Log

| Decision                             | Phase | Rationale                                                 | Status    |
| ------------------------------------ | ----- | --------------------------------------------------------- | --------- |
| Use ethers.js v6 (not web3.js)       | 12    | Already installed, smaller bundle, better docs            | ✅ Active |
| Polling (not WebSocket) for deposits | 13    | Matches PocketBase architecture, simpler state management | ✅ Active |
| @use-gesture/react for touch         | 14    | 6KB bundle, unified touch/mouse API, React hooks pattern  | ✅ Active |
| Hardcode minimal ABI in server.js    | 12    | Avoid file I/O, keep deployment simple                    | ✅ Active |
| 12-block confirmation wait           | 12    | Standard for BSC, balance security vs UX                  | ✅ Active |
| Daily check-in (off-chain)           | 16    | Skip complex mini-games for MVP, database only            | ✅ Active |
| Check balance before claiming commission | 12 | Save gas, better UX (no tx when zero balance) | ✅ Active |
| Ownership verification for feed-egg | 12 | Prevent unauthorized feeding (security) | ✅ Active |
| 20% gas buffer on transactions | 12 | Prevent out-of-gas failures (especially feedEgg variable) | ✅ Active |
| foodCount validation before gas estimation | 12-04 | Save users from paying gas for hatched eggs | ✅ Active |
| 400 status for EGG_HATCHED error | 12-04 | Client error semantics, clearer debugging | ✅ Active |

---

## Session Continuity

**Last Session:** 2026-04-19T03:54:36.000Z

**Session Notes:**

- Phase 12 Plan 12-04 (gap closure) completed
- Added foodCount validation to feed-egg endpoint to prevent feeding hatched eggs
- Validation: check foodCount < 10 BEFORE gas estimation (saves gas)
- Error handling: 400 EGG_HATCHED with user-friendly message
- Monitoring: added logging for blocked and successful feed attempts
- SEC-04 requirement now fully satisfied (was partial, now complete)
- Updated STATE.md with new decisions and session timestamp

**Files Modified:**
- `wallet-api/server.js` - feed-egg endpoint validation (+23 lines)
- `.planning/STATE.md` - Updated position, decisions, session timestamp
- `.planning/phases/12-wallet-api-contract-integration/12-04-SUMMARY.md` - Created

**Next Session Actions:**

1. Start Phase 13 — USDT Deposit Tracking (polling service with 12-block confirmation)
2. Implement track-deposit hook (13-track-deposit.pb.js)
3. Fix 9 vi.mock test failures (QUAL-01)

**Context Handoff:**

- Phase 12 COMPLETE — All mock endpoints replaced with real contract calls
- Phase 13 can now start (depends on Phase 12 contract infrastructure)
- Phase 14 can run in parallel (mobile polish is independent)
- Phase 15 blocked on Phase 12 ✅ + UI implementation needed
- Phase 16 blocked on Phase 12 ✅ + test infrastructure improvements
- P0 security issues FIXED — All 4 mock endpoints now return real transactions
- Reference implementation at `/resources/pkbase-wallet` was followed

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

_Last updated: 2026-04-18 — Roadmap created by gsd-roadmapper_

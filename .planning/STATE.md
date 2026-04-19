---
gsd_state_version: 1.0
milestone: v0.0.7
milestone_name: Security & Quality
status: in_progress
last_updated: "2026-04-19T19:00:00.000Z"
progress:
  total_phases: 5
  completed_phases: 3
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

**Current Focus:** Phase 15 — Feed Feature (Plan 01 Complete ✅)

**Constraints:**

- 2-week timeline (urgent)
- Solo developer
- Static export for Cloudflare Pages
- LINE OAuth only (no email/password)

---

## Current Position

**v0.0.7 Progress:** 3/5 phases complete (60%)  
**Next Phase:** 13 (USDT Deposit Tracking) or 16 (Play Feature + Tests)

```
Progress: [██████----] 3/5 phases complete
          Phase 12 → ✅ COMPLETE (wallet-api contract integration)
          Phase 13 → ⏸️ PENDING (USDT deposit tracking)
          Phase 14 → ✅ COMPLETE (mobile responsive polish)
          Phase 15 → ✅ COMPLETE (feed feature)
          Phase 16 → ⏸️ PENDING (play feature + test infrastructure)
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
| **Phases Complete**        | 3/5             | 5/5    |
| **Requirements Satisfied** | 8/16            | 16/16  |
| **Test Coverage**          | 70%             | 80%+   |
| **Test Failures**          | 9 vi.mock       | 0      |
| **Build Time**             | 2.5s (Bun)      | < 5s   |
| **LOC**                    | ~60K TypeScript | -      |

---

| Phase 12-wallet-api-contract-integration P02 | 120 | 1 tasks | 2 files |

## Quick Tasks Completed

| Task                | Date       | Description                                            | Status      |
| ------------------- | ---------- | ------------------------------------------------------ | ----------- |
| accessibility-fixes | 2026-04-19 | Fix critical WCAG 2.2 AA compliance issues in Phase 14 | ✅ Complete |

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
**Status:** 3/5 phases complete (60%)  
**Remaining:** Phase 13 (USDT Deposit), Phase 16 (Play + Tests)

**FIXED:**

- ✅ Mock blockchain calls — Phase 12 completed, all endpoints return real transaction hashes
- ✅ Mobile responsive gaps — Phase 14 completed, WCAG 2.2 AA compliant
- ✅ Feed feature — Phase 15 completed with manual selection grid

**REMAINING:**

1. **USDT deposit tracking** — Event polling service with 12-block confirmation (SEC-05 to SEC-08)
2. **Test setup** — 9 vi.mock failures (pre-existing, QUAL-01)
3. **Play feature** — Daily check-in reward system (FEAT-05 to FEAT-09)
4. **Test coverage** — Increase from 70% to 80%+ (QUAL-02)

---

### Technical Debt

**Security (P0 — Blocks Launch):**

- ✅ wallet-api/server.js — All 4 mock endpoints replaced with real contract calls (Phase 12)
- ⏸️ USDT deposit tracking — Not implemented (Phase 13)

**Quality (P1):**

- 9 test files with vi.mock setup failures
- Test coverage at 70%, target 80%+
- Play feature with daily check-in not implemented (Phase 16)

**Mobile (P2):**

- ✅ Bottom tab bar implemented (Phase 14)
- ✅ Touch targets meet 44x44px minimum (Phase 14)
- ✅ Breakpoints tested: 320px, 375px, 768px, 1024px, 1440px (Phase 14)

---

### Decisions Log

| Decision                                   | Phase | Rationale                                                 | Status    |
| ------------------------------------------ | ----- | --------------------------------------------------------- | --------- |
| Use ethers.js v6 (not web3.js)             | 12    | Already installed, smaller bundle, better docs            | ✅ Active |
| Polling (not WebSocket) for deposits       | 13    | Matches PocketBase architecture, simpler state management | ✅ Active |
| @use-gesture/react for touch               | 14    | 6KB bundle, unified touch/mouse API, React hooks pattern  | ✅ Active |
| Hardcode minimal ABI in server.js          | 12    | Avoid file I/O, keep deployment simple                    | ✅ Active |
| 12-block confirmation wait                 | 12    | Standard for BSC, balance security vs UX                  | ✅ Active |
| Daily check-in (off-chain)                 | 16    | Skip complex mini-games for MVP, database only            | ✅ Active |
| Check balance before claiming commission   | 12    | Save gas, better UX (no tx when zero balance)             | ✅ Active |
| Ownership verification for feed-egg        | 12    | Prevent unauthorized feeding (security)                   | ✅ Active |
| 20% gas buffer on transactions             | 12    | Prevent out-of-gas failures (especially feedEgg variable) | ✅ Active |
| foodCount validation before gas estimation | 12-04 | Save users from paying gas for hatched eggs               | ✅ Active |
| 400 status for EGG_HATCHED error           | 12-04 | Client error semantics, clearer debugging                 | ✅ Active |

---

## Session Continuity

**Last Session:** 2026-04-19T19:30:00.000Z

**Session Notes:**

- v0.0.6 milestone archived with final audit (19/19 requirements complete)
- v0.0.7 progress: 3/5 phases complete (60%)
- Phase 13 Nyquist validation created (manual-only justification)
- Phase 14 mobile responsive polish complete
- Phase 15 feed feature complete
- Phase 16 context gathered - ready for planning (Play feature, test infrastructure, wallet balance modal)

**Next Session Actions:**

1. Plan Phase 16 using /gsd-plan-phase 16
2. Execute Phase 16 plans (Play feature, test fixes, balance modal)
3. Complete Phase 13 (USDT Deposit Tracking) — SEC-05 to SEC-08
4. Run full test suite and verify 80%+ coverage

**Context Handoff:**

- v0.0.6 ARCHIVED — All scoped requirements satisfied, final audit complete
- v0.0.7 IN PROGRESS — 3/5 phases complete (12, 14, 15)
- Phase 16 CONTEXT.md created with 20 decisions across 4 areas:
  - Play Feature UX: Button on egg card, modal dialog, streak counter with fire emoji
  - Test Infrastructure: Fix failures first, integration tests, colocated files
  - Wallet Balance Modal: Tap balance to open, full breakdown + 10 transactions
  - Daily Check-in Backend: user_stats collection, PocketBase hook, mint Food NFT, 7d/30d bonuses
- Remaining work: Phase 13 (USDT deposit), Phase 16 execution
- All P0 security issues FIXED (Phase 12)
- Mobile responsive complete with WCAG 2.2 AA compliance
- Feed feature complete with manual selection and ready-to-hatch indicators

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

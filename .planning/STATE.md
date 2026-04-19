# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace  
**Milestone:** v0.0.7 Security & Quality  
**Network:** BNB SmartChain (BSC)  
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Phase 12 — Wallet-API Contract Integration (P0 security-critical foundation)

**Constraints:**

- 2-week timeline (urgent)
- Solo developer
- Static export for Cloudflare Pages
- LINE OAuth only (no email/password)

---

## Current Position

**Phase:** 12 — Wallet-API Contract Integration  
**Plan:** Context captured, ready for planning  
**Status:** Context gathered (2026-04-18)

```
Progress: [----------] 0/5 phases complete
          Phase 12 → Next
```

**Active Phase Goals:**

- Replace 4 mock blockchain endpoints with real ethers.js/dacc-js contract calls
- Implement private key decryption via dacc-js (passwordSecretkey pattern)
- Add gas sponsorship via USDT (meta-transaction flow)
- Auto-retry transient errors (3x, nonce bump, exponential backoff)
- Deploy to 0xl3 testnet (Chain ID: 7117, https://0xl3.com/)

**Key Decisions:**

- Private key: dacc-js with passwordSecretkey (reference pattern)
- Gas strategy: platform sponsors via USDT payment flow
- Deployment: 0xl3 testnet first (free gas for testing)
- ALL designs follow `/resources/pkbase-wallet` reference

**Next Action:** Run `/gsd-plan-phase 12` to decompose phase into executable plans

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

1. **Mock blockchain calls** — 4 wallet-api endpoints return fake transaction hashes (SEC-01 to SEC-04)
2. **Test setup** — 9 vi.mock failures (pre-existing, QUAL-01)
3. **Feed/Play buttons** — TODO in UI, need real implementation (FEAT-01 to FEAT-07)
4. **Track deposit hook** — Not implemented, tests in RED PHASE (SEC-05 to SEC-08)

---

### Technical Debt

**Security (P0 — Blocks Launch):**

- wallet-api/server.js lines 388, 422, 457, 493 return mock data
- Must replace with real ethers.js contract calls before production

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
| 12-block confirmation wait           | 13    | Standard for BSC, balance security vs UX                  | ✅ Active |
| Daily check-in (off-chain)           | 16    | Skip complex mini-games for MVP, database only            | ✅ Active |

---

## Session Continuity

**Last Session:** 2026-04-18 — Phase 12 context gathered

**Session Notes:**

- Phase 12 CONTEXT.md created with 17 implementation decisions
- Key decisions: dacc-js decryption, USDT gas sponsorship, 0xl3 testnet (7117), auto-retry errors
- ALL designs follow `/resources/pkbase-wallet` reference implementation
- Context committed: `.planning/phases/12-wallet-api-contract-integration/12-CONTEXT.md`

**Files to Preserve:**

- `.planning/ROADMAP.md` — Phase structure with success criteria
- `.planning/STATE.md` — This file (project memory)
- `.planning/REQUIREMENTS.md` — 16 requirements with traceability
- `.planning/phases/12-*/12-CONTEXT.md` — Phase 12 implementation decisions
- `.planning/research/SUMMARY.md` — Research synthesis

**Next Session Actions:**

1. Run `/gsd-plan-phase 12` — Decompose Wallet-API integration into executable plans
2. Verify 0xl3 testnet RPC access (https://rpc.0xl3.com, Chain ID: 7117)
3. Check contract deployment prerequisites (Foundry, deployer wallet)

**Context Handoff:**

- Roadmap has 5 phases (12-16) with 100% requirement coverage
- Phase 12 blocks Phases 15 and 16 (contract infrastructure)
- Phase 14 can run in parallel (mobile polish is independent)
- P0 security issues (SEC-01 to SEC-08) must be fixed before launch
- Reference implementation at `/resources/pkbase-wallet` is canonical source

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

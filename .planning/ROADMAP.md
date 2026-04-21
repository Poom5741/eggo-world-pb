# Roadmap — v0.0.7 Security & Quality

**Milestone:** Security & Quality  
**Created:** 2026-04-18  
**Status:** Executing (5/5 phases complete, 1 new phase added)  
**Phases:** 6 (12-17)  
**Granularity:** Standard (from config: 2-week timeline, solo developer)  
**Coverage:** 16/16 requirements mapped ✓

---

## Phases

- [x] **Phase 12: Wallet-API Contract Integration** — Replace 4 mock blockchain endpoints with real ethers.js contract calls ✅ COMPLETE
- [x] **Phase 13: USDT Deposit Tracking** — Implement event polling service with 12-block confirmation wait ✅ COMPLETE 2026-04-19
- [x] **Phase 14: Mobile Responsive Polish** — Bottom tab bar, touch targets, responsive breakpoints (320px-1440px) ✅ COMPLETE 2026-04-19
- [x] **Phase 15: Feed Feature** — Wire Feed button, food picker UI, progress tracking, hatch animation ✅ COMPLETE 2026-04-19
- [x] **Phase 16: Play Feature + Test Infrastructure** — Daily check-in reward system, fix vi.mock failures, increase test coverage ✅ COMPLETE 2026-04-19
- [ ] **Phase 17: UAT & Verification Gap Closure** — Complete Phase 10 UAT (10 scenarios), fix Phase 03 verification gaps (Buy Now stub, dashboard polling), fix Phase 12 verification gap (foodCount validation)

---

## Phase Details

### Phase 12: Wallet-API Contract Integration

**Goal:** Users can execute real blockchain transactions for minting and claiming (no mock data)  
**Depends on:** Nothing (foundation phase)  
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04  
**Success Criteria** (what must be TRUE):

1. ✅ User can mint Egg NFT and receive real transaction hash with 12+ block confirmations
2. ✅ User can claim referral commission and see real blockchain transaction in wallet
3. ✅ User can mint Food NFT with real USDT deduction from wallet
4. ✅ User can feed Egg NFT with real blockchain transaction updating food_count
   **Plans**: 4 plans COMPLETE (11 tasks total)
   **UI hint**: no
   **Status**: ✅ COMPLETE 2026-04-18

   Plans:
   - [x] 12-01-PLAN.md — Deploy contracts to 0xl3 testnet, create address registry ✅
   - [x] 12-02-PLAN.md — Replace mint-egg and mint-food mocks with real contract calls ✅
   - [x] 12-03-PLAN.md — Replace claim-commission and feed-egg mocks, add gas sponsorship ✅
   - [x] 12-04-PLAN.md — Add missing foodCount validation to feed-egg endpoint (gap closure) ✅

**Completion Evidence:**

- Commit: `ab853309` — Wave 2 implementation complete
- Contracts deployed on 0xl3 testnet (Chain ID: 7117):
  - EggNFT: `0xb2FE193523A1E6A240141331A80755f5642e7A44`
  - FoodNFT: `0xec21A3c068e84ceeD04975627418E867Ec342A02`
  - Commission: `0xa0C50587306F0CCac627D2eaEcb9e5909DB58F3f`
  - USDT: `0x93886105218Ca14b370ACA538b13895295916028`
- All 4 endpoints return real transaction hashes
- 12-block confirmation wait, 20% gas buffer, 3-attempt retry
- Gas sponsorship logging in place (full implementation future phase)

---

### Phase 13: USDT Deposit Tracking

**Goal:** Users see USDT deposits automatically tracked and confirmed after 12 blocks  
**Depends on:** Phase 12 (contract infrastructure)  
**Requirements:** SEC-05, SEC-06, SEC-07, SEC-08  
**Success Criteria** (what must be TRUE):

1. System polls USDT Transfer events every 30 seconds and detects deposits within 60 seconds
2. Deposit shows "pending" state until 12 block confirmations, then transitions to "confirmed"
3. Duplicate deposit attempts (same tx_hash) are rejected with existing record returned
4. User receives in-app notification when deposit is confirmed with updated balance
   **Plans**: 1 plan

Plans:

- [x] 13-01-PLAN.md — Fix deposit tracking: block tracking, 12-block confirmation, duplicate detection, UI notifications ✅

**Completion Evidence:**

- Commit: See git history (Phase 13 implemented in previous session)
- Backend hook: `apps/backend/pb_hooks/13-track-deposit.pb.js` (271 lines)
- Test suite: 29 tests pass, 0 failures
- Frontend: `apps/web/app/dashboard/deposit/page.tsx` with auto-polling
- UAT: 12/12 tests passed (13-UAT.md)
- All SEC requirements satisfied (SEC-05, SEC-06, SEC-07, SEC-08)

---

### Phase 14: Mobile Responsive Polish

**Goal:** Users on mobile devices (< 640px) have optimized navigation and touch interactions  
**Depends on:** Nothing (can run parallel)  
**Requirements:** QUAL-03, QUAL-04, QUAL-05, QUAL-06  
**Success Criteria** (what must be TRUE):

1. Mobile users see bottom tab bar with 4-5 navigation items (replaces hamburger menu)
2. All buttons, links, and inputs meet 44×44px minimum touch target (WCAG 2.2 compliant)
3. Layout renders correctly at all 5 breakpoints (320px, 375px, 768px, 1024px, 1440px) without horizontal scroll
4. iOS devices don't zoom when focusing input fields (16px minimum font-size)
   **Plans**: 1 plan
   **UI hint**: yes

Plans:

- [x] 14-01-PLAN.md — Reduce BottomNavMobile to 4 items, fix touch targets, iOS zoom prevention, responsive breakpoints ✅

**Completion Evidence:**

- Commit: `52d85bd` — Plan 14-01 complete (4 commits total)
- BottomNavMobile displays exactly 4 items on mobile (< 1024px)
- Active tab detection implemented with usePathname() hook
- All touch targets meet WCAG 2.2 44×44px minimum (buttons, links, inputs)
- iOS zoom prevention: 16px minimum font-size on all input fields
- Responsive breakpoints enforced at 320px, 375px, 768px, 1024px, 1440px
- No horizontal scroll at any breakpoint (overflow-x: hidden)
- Build succeeds: `bun run build` exits with code 0

---

### Phase 15: Feed Feature

**Goal:** Users can feed Eggs with Food NFTs and watch progress toward hatching  
**Depends on:** Phase 12 (wallet-api contract calls)  
**Requirements:** FEAT-01, FEAT-02, FEAT-03, FEAT-04  
**Success Criteria** (what must be TRUE):

1. User can tap Feed button on eggs page and see food NFT picker modal open
2. User can select up to 10 food NFTs with counter showing "X/10 food selected"
3. Egg card displays progress bar showing food_count / 10 and visual indicator when ready to hatch
4. Consumed food NFTs are marked as "used" in database and hidden from future picker
   **Plans**: 1 plan
   **UI hint**: yes

Plans:

- [x] 15-01-PLAN.md — Rewrite FeedDialog with manual selection grid, add ready-to-hatch indicator to EggCard ✅

**Completion Evidence:**

- Commit: `0c3baef` — Plan 15-01 complete
- FeedDialog rewritten with manual 2-column food selection grid (1-10 items)
- useFoodNft hook replaces useEggFeed (supports variable selection count)
- EggCard displays ready-to-hatch indicator (pulse glow + sparkle icon at 10/10)
- Fixed pre-existing bugs: missing Progress import, token_id type mismatch
- Build succeeds: `bun run build` exits with code 0
- All acceptance criteria pass

---

### Phase 16: Play Feature + Test Infrastructure

**Goal:** Users can claim daily check-in rewards and test suite has no setup failures with 80%+ coverage  
**Depends on:** Phase 12 (contract infrastructure for test coverage)  
**Requirements:** QUAL-01, QUAL-02, FEAT-05, FEAT-06, FEAT-07, FEAT-08, FEAT-09  
**Success Criteria** (what must be TRUE):

1. Test suite runs without vi.mock setup errors (all 9 failures fixed)
2. Test coverage increases from 70% to 80%+ with tests for new features
3. User can tap Play button and see daily check-in interface with countdown timer
4. User can claim daily reward (1 Food NFT) and see streak counter increment
5. USDT balance auto-refreshes every 30 seconds with exponential backoff
6. User can tap balance to see detailed breakdown with transaction history
   **Plans**: 5 plans
   **UI hint**: yes

Plans:

- [x] 16-01-PLAN.md — Fix 9 vi.mock test failures (QUAL-01) ✅
- [x] 16-02-PLAN.md — Play button on egg cards, check-in modal, streak counter (FEAT-05, FEAT-06, FEAT-07) ✅
- [x] 16-03-PLAN.md — PocketBase hook for daily check-in with cooldown and NFT minting (FEAT-06, FEAT-07) ✅
- [x] 16-04-PLAN.md — Balance detail modal with transaction history (FEAT-08, FEAT-09) ✅
- [x] 16-05-PLAN.md — Test coverage increase to 80%+ for Phase 16 features (QUAL-02) ✅

**Completion Evidence:**

- 5 plans executed across 3 waves
- 49 new tests created, all passing
- UAT: 22/22 tests passed (16-UAT.md)
- All requirements satisfied (QUAL-01, QUAL-02, FEAT-05 to FEAT-09)

---

### Phase 17: UAT & Verification Gap Closure

**Goal:** Close all outstanding UAT and verification gaps from prior phases  
**Depends on:** Phase 10 (egg management), Phase 03 (frontend marketplace), Phase 12 (wallet-api)  
**Requirements:** QUAL-01, QUAL-02, SEC-04, UI-05  
**Success Criteria** (what must be TRUE):

1. Phase 10 UAT: All 10 test scenarios executed and documented (egg display, feed flow, hatch flow, polling, error handling)
2. Phase 03 Gap 1: Buy Now button on product detail page executes actual NFT purchase with USDT approval flow
3. Phase 03 Gap 2: Dashboard eggs and commissions pages have auto-polling with "Updating..." indicators
4. Phase 12 Gap: feed-egg endpoint validates foodCount < 10 before sending transaction (prevents feeding hatched eggs)
   **Plans**: 3 plans
   **UI hint**: yes
   **Status**: 📋 PLANNED

Plans:

- [ ] 17-01-PLAN.md — Execute Phase 10 UAT (10 test scenarios) + re-verify Phase 12 foodCount validation
- [ ] 17-02-PLAN.md — Complete Buy Now flow with USDT internal ledger transfer (Phase 03 Gap 1)
- [ ] 17-03-PLAN.md — Verify/add dashboard auto-polling with "Updating..." indicators (Phase 03 Gap 2)

---

## Progress Table

| Phase                                  | Plans Complete | Status      | Completed  |
| -------------------------------------- | -------------- | ----------- | ---------- |
| 12. Wallet-API Contract Integration    | 4/4            | ✅ Complete | 2026-04-18 |
| 13. USDT Deposit Tracking              | 1/1            | ✅ Complete | 2026-04-19 |
| 14. Mobile Responsive Polish           | 1/1            | ✅ Complete | 2026-04-19 |
| 15. Feed Feature                       | 1/1            | ✅ Complete | 2026-04-19 |
| 16. Play Feature + Test Infrastructure | 5/5            | ✅ Complete | 2026-04-19 |
| 17. UAT & Verification Gap Closure     | 0/3            | 📋 Planned  | -          |

---

## Requirement Coverage

**Total:** 16/16 v1 requirements mapped ✓

| Phase | Requirements                                                  | Count |
| ----- | ------------------------------------------------------------- | ----- |
| 12    | SEC-01, SEC-02, SEC-03, SEC-04                                | 4     |
| 13    | SEC-05, SEC-06, SEC-07, SEC-08                                | 4     |
| 14    | QUAL-03, QUAL-04, QUAL-05, QUAL-06                            | 4     |
| 15    | FEAT-01, FEAT-02, FEAT-03, FEAT-04                            | 4     |
| 16    | QUAL-01, QUAL-02, FEAT-05, FEAT-06, FEAT-07, FEAT-08, FEAT-09 | 7     |

**Verification:**

- No orphaned requirements ✓
- No duplicate mappings ✓
- All P0 (SEC) requirements in Phases 12-13 ✓
- All P1 (QUAL, FEAT) requirements in Phases 14-16 ✓

---

## Dependencies

```
Phase 12 (Wallet-API Contract) → Foundation for Phases 15, 16
       ↓
Phase 13 (USDT Deposit) → Standalone, parallel with 14
       ↓
Phase 15 (Feed Feature) → Depends on Phase 12
       ↓
Phase 16 (Play + Tests) → Depends on Phase 12

Phase 14 (Mobile Polish) → Independent, can run parallel
```

---

## Notes

**Phase numbering:** Continuing from v0.0.6 (ended at Phase 11)

**UI Phases detected:** 14, 15, 16 (will suggest `/gsd-ui-phase` during planning)

**Research flags:**

- Phase 12: ❌ No research needed (standard ethers.js patterns)
- Phase 13: ⚠️ Maybe (BSC reorg behavior validation during planning)
- Phase 14: ❌ No research needed (standard responsive patterns)
- Phase 15: ❌ No research needed (standard database ACID)
- Phase 16: ❌ No research needed (existing test infrastructure)

**Critical path:** Phase 12 → Phase 15 → Phase 16

---

_Last updated: 2026-04-21 — Phase 17 plans created_

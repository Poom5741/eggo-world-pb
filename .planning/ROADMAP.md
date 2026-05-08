# Roadmap — v0.5.0 Security Hardening & Production Readiness

**Milestone:** Security Hardening & Production Readiness  
**Created:** 2026-04-29  
**Status:** In progress (3/5 phases complete, 1 partial, 1 outstanding)  
**Phases:** 5 (49-53)  
**Coverage:** 29 requirements mapped

---

## Phases

- [x] **Phase 49: Critical Security Fixes** — Fix 6 critical vulnerabilities (XOR operator, TierBadge token IDs, currency mismatch, treasury lock, burnNFT, approval theft)
- [~] **Phase 50: High-Severity Security Fixes** — 6/7 plans complete; 1 deferred (50-02 VRF Randomness for Breeding & Food)
- [ ] **Phase 51: Medium-Severity Security Fixes** — ✅ 7/7 medium issues resolved (SEC-14 through SEC-21)
- [ ] **Phase 52: E2E Test Fixes** — Fix failing journey tests (E2E-01 to E2E-04)
- [ ] **Phase 53: Production Readiness** — Blockchain sync, retry utilities, >95% test pass rate

---

## Phase Details

### Phase 49: Critical Security Fixes ✅

**Goal:** Eliminate 6 critical vulnerabilities found in security audit  
**Status:** ✅ Complete — 6 plans executed, all verified  
**Requirements:** SEC-01 through SEC-06  
**Success Criteria:**

1. ✅ Replace `^` with `**` in MINT_PRICE and BREEDING_FEE constants
2. ✅ Implement monotonically increasing token IDs for TierBadge
3. ✅ Change ETH payouts to USDT payouts for commission claims
4. ✅ Add treasury address and route 46% of mint proceeds
5. ✅ Remove owner burnNFT function
6. ✅ Remove buyer parameter from mintFood, use msg.sender
   **Plans**: 4 plans (49-01 through 49-04)

---

### Phase 50: High-Severity Security Fixes ⚠️

**Goal:** Address 7 high-severity security issues  
**Status:** 6/7 plans complete — 1 deferred (50-02 VRF Randomness)  
**Requirements:** SEC-07 through SEC-13  
**Success Criteria:**

1. ✅ Self-referral guards added to mintEgg, mintEggWithChain, breedAnimals, mintFood
2. ⏸️ VRF randomness for breeding and food types (deferred — complex refactor)
3. ✅ setMintPrice made mutable with bounds (1-1000 USDT)
4. ✅ Food count check before hatching breeding eggs
5. ✅ Duplicate VRF request prevention
6. ✅ NFT transfer restricted during VRF pending
7. ✅ Remove owner from distributeCommission auth
   **Plans**: 7 plans (50-01 through 50-07)
   **Deferred**: 50-02 (VRF) — pseudorandom keccak256 is weak but not exploitable for immediate fund loss

---

### Phase 51: Medium-Severity Security Fixes ✅

**Goal:** Resolve 8 medium-severity issues from security audit  
**Status:** ✅ Complete — 7/7 fixes applied (M-02 pre-fixed in Phase 50)  
**Requirements:** SEC-14 through SEC-21  
**Success Criteria:**

1. ✅ Replace ownerOf with \_ownerOf for existence checks
2. ✅ Reset referral chain on transfer (already done in Phase 50)
3. ✅ Add food cap check in recordFoodConsumption
4. ✅ Add whenNotPaused to state-mutating functions
5. ✅ Use SafeERC20.safeTransferFrom in TierBadge
6. ✅ Replace buggy Base64 with OpenZeppelin Base64
7. ✅ Drop pseudorandom rarity_seed from VRF hatch
8. ✅ Remove stale owner field from FoodProperties
   **Plans**: 1 plan (51-01) covering all 8 fixes

---

### Phase 52: E2E Test Fixes

**Goal:** Fix failing E2E journey tests and create production test users  
**Status:** WIP — partial completion  
**Requirements:** E2E-01 through E2E-04  
**Success Criteria:**

1. ✅ E2E-01: Purchase flow timeout increased (30s → 60s)
2. ⚡ E2E-02: Blockchain-to-PocketBase data sync (WIP — new hooks, improved script)
3. ⚡ E2E-03: PocketBase endpoint accessibility (docker-compose.e2e.yml fixed)
4. ❌ E2E-04: Production test users (not started)
   **Plans**: 2 plans (52-01, 52-02)

---

### Phase 53: Production Readiness

**Goal:** Implement reliable blockchain sync and achieve >95% test pass rate  
**Status:** ❌ Blocked — test pass rate 93% (below 95% threshold)  
**Requirements:** PROD-01 through PROD-04  
**Success Criteria:**

1. ✅ PROD-01: Blockchain event listeners implemented (22-listen-nft-events.pb.js)
2. ✅ PROD-02: Real-time state updates with retry utility and circuit breaker
3. ✅ PROD-03: Error recovery (fetch-retry.ts, exponential backoff)
4. ❌ PROD-04: >95% test pass rate — currently 93% (21 failures, 1 hanging test)
   **Plans**: 2 plans (53-01, 53-02)
   **Blockers:**
   - 12 PocketBase AUTH_REQUIRED failures (mock gap)
   - use-marketplace-sync.test.ts hangs (async loop)
   - 9 UI test text matching failures (React text splitting)

---

## Progress Table

| Phase                              | Plans Complete | Status                  | Completed  |
| ---------------------------------- | -------------- | ----------------------- | ---------- |
| 49. Critical Security Fixes        | 4/4            | ✅ Complete             | 2026-04-30 |
| 50. High-Severity Security Fixes   | 6/7            | ⚠️ Partial (1 deferred) | 2026-04-30 |
| 51. Medium-Severity Security Fixes | 1/1            | ✅ Complete             | 2026-05-08 |
| 52. E2E Test Fixes                 | 0/2            | ⚡ In Progress          | -          |
| 53. Production Readiness           | 0/2            | ❌ Blocked              | -          |

---

## Requirement Coverage (v0.5.0)

**Total:** 29 requirements mapped

| Phase | Requirements                                                   | Count |
| ----- | -------------------------------------------------------------- | ----- |
| 49    | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06                 | 6     |
| 50    | SEC-07, SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13         | 7     |
| 51    | SEC-14, SEC-15, SEC-16, SEC-17, SEC-18, SEC-19, SEC-20, SEC-21 | 8     |
| 52    | E2E-01, E2E-02, E2E-03, E2E-04                                 | 4     |
| 53    | PROD-01, PROD-02, PROD-03, PROD-04                             | 4     |

---

## Dependencies

```
Phase 49 (Critical Security) → Foundation for Phase 50
       ↓
Phase 50 (High-Severity) → Foundation for Phase 51
       ↓
Phase 51 (Medium-Severity) → Independent of 52
       ↓
Phase 52 (E2E Test Fixes) → Independent, can run parallel
       ↓
Phase 53 (Production Readiness) → Depends on Phases 49-52
```

---

## Notes

**Phase numbering:** Continuing from v0.4.0 (ended at Phase 48)

**Deferred items from v0.5.0:**

- VRF Randomness for breeding & food (50-02) — complex refactor needing FoodNFT constructor signature change
- Remaining v0.0.7 gaps (FEAT-01 FeaturedEggHero FEED ME button, SEC-06 12-block confirmation) — carried from earlier milestones

**Solo developer, urgent timeline constraints still apply.**

---

_Last updated: 2026-05-08 — Updated by gsd-execute-phase_

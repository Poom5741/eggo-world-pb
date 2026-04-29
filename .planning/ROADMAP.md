# Roadmap: Egg × Food × Animal NFT Marketplace

## Milestones

- ✅ **v0.4.0 Functional Journey Tests** - Phases 45-48 (shipped 2026-04-29)
- 🚧 **v0.5.0 Security Hardening & Production Readiness** - Phases 49-53 (in progress)
- 📋 **v0.6.0 Spec Completion** - Phases 54+ (planned)

## Phases

<details>
<summary>✅ v0.4.0 Functional Journey Tests (Phases 45-48) - SHIPPED 2026-04-29</summary>

### Phase 45: Buy Egg Journey Test

**Goal**: Validate end-to-end egg purchase flow with real blockchain interactions
**Plans**: 1 plan

Plans:

- [x] 45-01: Implement buy egg journey test with triple verification

### Phase 46: Feed + Hatch Journey Test

**Goal**: Validate end-to-end feed and hatch flow with batch operations
**Plans**: 1 plan

Plans:

- [x] 46-01: Implement feed + hatch journey test with batch food selection

### Phase 47: Marketplace Journey Test

**Goal**: Validate end-to-end marketplace resale flow with ownership transfer
**Plans**: 1 plan

Plans:

- [x] 47-01: Implement marketplace journey test with bilateral verification

### Phase 48: Referral Commission Journey Test

**Goal**: Validate referral commission distribution and tracking
**Plans**: 1 plan

Plans:

- [x] 48-01: Implement referral commission journey test with double verification

</details>

### 🚧 v0.5.0 Security Hardening & Production Readiness (In Progress)

**Milestone Goal:** Address critical security vulnerabilities from audit, fix E2E test failures, and implement production-ready blockchain synchronization

#### Phase 49: Critical Security Fixes

**Goal**: Eliminate 6 critical vulnerabilities that could lead to fund loss or contract exploitation
**Depends on**: Nothing (security priority)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):

1. Mint prices and breeding fees use correct exponentiation (not XOR)
2. TierBadge token IDs are monotonically increasing (no reuse of 1,2,3)
3. Commission distributions pay out in USDT (not ETH)
4. Treasury address receives 46% of mint proceeds with withdrawal path
5. Owner cannot burn arbitrary user NFTs (function restricted or removed)
6. mintFood uses msg.sender instead of buyer parameter (no approval theft)
   **Plans**: 4 plans

Plans:

- [ ] 49-01-PLAN.md — Fix XOR operator misuse in mint prices (SEC-01)
- [ ] 49-02-PLAN.md — Fix TierBadge token ID reuse with monotonic counter (SEC-02)
- [ ] 49-03-PLAN.md — Fix currency mismatch and add treasury routing (SEC-03, SEC-04)
- [ ] 49-04-PLAN.md — Remove burnNFT and fix mintFood approval theft (SEC-05, SEC-06)

#### Phase 50: High-Severity Security Fixes

**Goal**: Address 7 high-severity issues that enable abuse or broken functionality
**Depends on**: Phase 49
**Requirements**: SEC-07, SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13
**Success Criteria** (what must be TRUE):

1. Users cannot refer themselves to earn commissions
2. Breeding and food type assignment use VRF for randomness
3. setMintPrice function is either functional or removed
4. Breeding eggs require proper food consumption before hatching
5. Duplicate VRF requests prevented (hatchEgg cannot be called twice)
6. NFT transfers during VRF pending don't allow double claiming
7. distributeCommission restricted to authorized callers (not owner)
   **Plans**: TBD

Plans:

- [ ] 50-01: Add self-referral guards (SEC-07)
- [ ] 50-02: Improve randomness with VRF for breeding and food (SEC-08)
- [ ] 50-03: Fix setMintPrice no-op function (SEC-09)
- [ ] 50-04: Add food count check for breeding eggs (SEC-10)
- [ ] 50-05: Prevent duplicate VRF requests (SEC-11)
- [ ] 50-06: Handle NFT transfer during VRF pending (SEC-12)
- [ ] 50-07: Restrict distributeCommission to authorized callers (SEC-13)

#### Phase 51: Medium-Severity Security Fixes

**Goal**: Resolve 8 medium-severity issues affecting state management and access control
**Depends on**: Phase 50
**Requirements**: SEC-14, SEC-15, SEC-16, SEC-17, SEC-18, SEC-19, SEC-20, SEC-21
**Success Criteria** (what must be TRUE):

1. ownerOf checks use \_ownerOf for OpenZeppelin v5 compatibility
2. Referral chain resets when egg is transferred
3. Maximum food consumption limit is enforced
4. State-mutating functions have whenNotPaused modifier
5. TierBadge transferFrom uses SafeERC20.safeTransferFrom
6. Base64 encoding uses OpenZeppelin encoder
7. VRF alone determines hatching entropy (no pseudorandom seed)
8. FoodNFT owner field removed or synced with \_update
   **Plans**: TBD

Plans:

- [ ] 51-01: Fix ownerOf checks for OZ v5 (SEC-14)
- [ ] 51-02: Reset referral chain on transfer (SEC-15)
- [ ] 51-03: Add food cap check (SEC-16)
- [ ] 51-04: Add whenNotPaused to functions (SEC-17)
- [ ] 51-05: Fix TierBadge transferFrom (SEC-18)
- [ ] 51-06: Fix Base64 encoder (SEC-19)
- [ ] 51-07: Remove pseudorandom seed (SEC-20)
- [ ] 51-08: Fix FoodNFT owner stale (SEC-21)

#### Phase 52: E2E Test Fixes

**Goal**: Fix failing E2E journey tests and create production test users
**Depends on**: Phase 51 (security fixes may affect test behavior)
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04
**Success Criteria** (what must be TRUE):

1. Purchase flow journey test completes within timeout
2. Blockchain-to-PocketBase data sync works reliably
3. PocketBase endpoint accessible in E2E environment
4. Production test users created (test_buyer, test_seller, test_referrer, test_admin)
   **Plans**: TBD

Plans:

- [ ] 52-01: Fix purchase flow timeout issues (E2E-01)
- [ ] 52-02: Fix data synchronization problems (E2E-02)
- [ ] 52-03: Fix network connectivity issues (E2E-03)
- [ ] 52-04: Create production test users (E2E-04)

#### Phase 53: Production Readiness

**Goal**: Implement reliable blockchain synchronization and achieve >95% test pass rate
**Depends on**: Phase 52
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):

1. Blockchain event listeners automatically create PocketBase records
2. Real-time state updates via WebSocket or polling
3. Error recovery with retry logic and fallbacks
4. > 95% test pass rate achieved across all tests
   > **Plans**: TBD

Plans:

- [ ] 53-01: Implement blockchain event listeners (PROD-01)
- [ ] 53-02: Add real-time state updates (PROD-02)
- [ ] 53-03: Improve error recovery mechanisms (PROD-03)
- [ ] 53-04: Achieve >95% test pass rate (PROD-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 49 → 50 → 51 → 52 → 53

| Phase                              | Milestone | Plans Complete | Status      | Completed |
| ---------------------------------- | --------- | -------------- | ----------- | --------- |
| 49. Critical Security Fixes        | v0.5.0    | 0/4            | Not started | -         |
| 50. High-Severity Security Fixes   | v0.5.0    | 0/7            | Not started | -         |
| 51. Medium-Severity Security Fixes | v0.5.0    | 0/8            | Not started | -         |
| 52. E2E Test Fixes                 | v0.5.0    | 0/4            | Not started | -         |
| 53. Production Readiness           | v0.5.0    | 0/4            | Not started | -         |

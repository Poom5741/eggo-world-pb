# Roadmap: Egg × Food × Animal NFT Marketplace

## Milestones

- ✅ **v0.4.0 Functional Journey Tests** - Phases 45-48 (shipped 2026-04-29)
- ✅ **v0.5.0 Security Hardening & Production Readiness** - Phases 49-53 (shipped 2026-04-30)
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

<details>
<summary>✅ v0.5.0 Security Hardening & Production Readiness (Phases 49-53) - SHIPPED 2026-04-30</summary>

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
   **Plans**: 7 plans (6 completed, 1 deferred)

Plans:

- [x] 50-01: Add self-referral guards (SEC-07)
- [ ] 50-02: Improve randomness with VRF for breeding and food (SEC-08) — DEFERRED
- [x] 50-03: Fix setMintPrice no-op function (SEC-09)
- [x] 50-04: Add food count check for breeding eggs (SEC-10)
- [x] 50-05: Prevent duplicate VRF requests (SEC-11)
- [x] 50-06: Handle NFT transfer during VRF pending (SEC-12)
- [x] 50-07: Restrict distributeCommission to authorized callers (SEC-13)

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 49 → 50 → 51 → 52 → 53

| Phase                              | Milestone | Plans Complete | Status      | Completed  |
| ---------------------------------- | --------- | -------------- | ----------- | ---------- |
| 49. Critical Security Fixes        | v0.5.0    | 4/4            | ✅ Complete | 2026-04-29 |
| 50. High-Severity Security Fixes   | v0.5.0    | 6/7            | ✅ Complete | 2026-04-29 |
| 51. Medium-Severity Security Fixes | v0.5.0    | 1/1            | ✅ Complete | 2026-04-30 |
| 52. E2E Test Fixes                 | v0.5.0    | 2/2            | ✅ Complete | 2026-04-30 |
| 53. Production Readiness           | v0.5.0    | 2/2            | ✅ Complete | 2026-04-30 |

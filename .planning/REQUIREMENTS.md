---
milestone: v0.5.0
milestone_name: Security Hardening & Production Readiness
created: 2026-04-29
status: active
total_requirements: 25
---

# Milestone v0.5.0 Requirements

Based on security audit (2026-04-29) and E2E testing results. Focus on critical vulnerabilities and production readiness.

---

## Critical Security Fixes (SEC)

- [ ] **SEC-01**: Fix XOR operator misuse in mint prices (C-01)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Replace `^` with `**` in MINT_PRICE and BREEDING_FEE constants

- [ ] **SEC-02**: Fix TierBadge token ID reuse (C-02)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Implement monotonically increasing token IDs instead of reusing 1,2,3

- [ ] **SEC-03**: Fix currency mismatch in CommissionDistribution (C-03)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Change ETH payouts to USDT payouts for commission claims

- [ ] **SEC-04**: Fix treasury lock and add withdrawal path (C-04)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Add treasury address and route 46% of mint proceeds properly

- [ ] **SEC-05**: Remove or restrict owner burnNFT function (C-05)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Prevent owner from burning arbitrary user NFTs

- [ ] **SEC-06**: Fix mintFood approval theft vulnerability (C-06)
  - Phase: 49
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Remove buyer parameter, use msg.sender instead

## High-Severity Security Fixes (SEC)

- [ ] **SEC-07**: Add self-referral guards (H-01)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Prevent users from referring themselves

- [ ] **SEC-08**: Improve randomness with VRF (H-02)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Extend VRF pattern to breeding and food type assignment

- [ ] **SEC-09**: Fix setMintPrice no-op function (H-03)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Make mint price mutable or remove setter

- [ ] **SEC-10**: Add food count check for breeding eggs (H-04)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Require proper food consumption before hatching breeding eggs

- [ ] **SEC-11**: Prevent duplicate VRF requests (H-05)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Guard against calling hatchEgg twice for same token

- [ ] **SEC-12**: Handle NFT transfer during VRF pending (H-06)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Prevent second owner from claiming hatched animal

- [ ] **SEC-13**: Restrict distributeCommission to owner (H-07)
  - Phase: 50
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Remove owner from authorized callers

## Medium-Severity Security Fixes (SEC)

- [ ] **SEC-14**: Fix ownerOf checks for OZ v5 (M-01)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Use \_ownerOf instead of ownerOf for existence checks

- [ ] **SEC-15**: Reset referral chain on transfer (M-02)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Clear referral chain when egg is transferred

- [ ] **SEC-16**: Add food cap check (M-03)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Enforce maximum food consumption limit

- [ ] **SEC-17**: Add whenNotPaused to functions (M-04)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Add pausable modifier to state-mutating functions

- [ ] **SEC-18**: Fix TierBadge transferFrom (M-05)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Use SafeERC20.safeTransferFrom

- [ ] **SEC-19**: Fix Base64 encoder (M-06)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Use OpenZeppelin Base64 encoder

- [ ] **SEC-20**: Remove pseudorandom seed (M-07)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Let VRF alone determine hatching entropy

- [ ] **SEC-21**: Fix FoodNFT owner stale (M-08)
  - Phase: 51
  - Spec: SMART_CONTRACT_AUDIT_2026-04-29.md
  - Details: Remove redundant owner field or sync with \_update

## E2E Test Fixes (E2E)

- [ ] **E2E-01**: Fix purchase flow timeout issues
  - Phase: 52
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Resolve 30-second timeout in buy journey test

- [ ] **E2E-02**: Fix data synchronization problems
  - Phase: 52
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Fix blockchain-to-PocketBase sync issues

- [ ] **E2E-03**: Fix network connectivity issues
  - Phase: 52
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Resolve PocketBase endpoint accessibility

- [ ] **E2E-04**: Create production test users
  - Phase: 52
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Add test users to production PocketBase

## Production Readiness (PROD)

- [ ] **PROD-01**: Implement blockchain event listeners
  - Phase: 53
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Add automatic PocketBase record creation

- [ ] **PROD-02**: Add real-time state updates
  - Phase: 53
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Implement WebSocket or polling for sync

- [ ] **PROD-03**: Improve error recovery mechanisms
  - Phase: 53
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Add retry logic and fallback mechanisms

- [ ] **PROD-04**: Achieve >95% test pass rate
  - Phase: 53
  - Spec: E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md
  - Details: Fix all failing tests and improve coverage

---

## Traceability

| REQ-ID  | Phase | Spec                                            | Status  |
| ------- | ----- | ----------------------------------------------- | ------- |
| SEC-01  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-02  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-03  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-04  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-05  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-06  | 49    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-07  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-08  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-09  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-10  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-11  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-12  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-13  | 50    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-14  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-15  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-16  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-17  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-18  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-19  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-20  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| SEC-21  | 51    | SMART_CONTRACT_AUDIT_2026-04-29.md              | planned |
| E2E-01  | 52    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| E2E-02  | 52    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| E2E-03  | 52    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| E2E-04  | 52    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| PROD-01 | 53    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| PROD-02 | 53    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| PROD-03 | 53    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |
| PROD-04 | 53    | E2E-TESTING-RESULTS-AND-PRODUCTION-READINESS.md | planned |

---

## Summary

| Category                 | Count  | Priority |
| ------------------------ | ------ | -------- |
| Critical Security        | 6      | P0       |
| High-Severity Security   | 7      | P1       |
| Medium-Severity Security | 8      | P2       |
| E2E Test Fixes           | 4      | P0       |
| Production Readiness     | 4      | P1       |
| **Total**                | **29** | —        |

---

_Last updated: 2026-04-29 — v0.5.0 milestone started_

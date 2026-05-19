# Milestones

## v0.9.0 Google OAuth Migration

- **Status:** 🚧 IN PROGRESS
- **Date:** 2026-05-19
- **Branch:** `dev`
- **Phases:** 1 (Phase 63)
- **Goal:** Replace LINE OAuth with Google OAuth via PocketBase built-in Google OAuth2 provider
- **Scope:** Frontend auth pages (`line-oauth.ts` → `google-oauth.ts`), backend env vars (`LINE_CHANNEL_*` → `GOOGLE_CLIENT_ID/SECRET`), delete LINE-specific files, PocketBase admin provider config

## v0.7.0 Polished Deposit & Withdraw Flow

- **Status:** ✅ SHIPPED
- **Date:** 2026-05-10
- **Phases:** 57
- **Plans:** 1
- \*\*Accomplishments:
  - Wallet balance page polished with skeleton card (5 pulsing placeholder blocks) for initial loading state
  - Smooth 500ms fade-in animation with `requestAnimationFrame` trigger prevents flicker
  - Inline error state with destructive Alert, correct copy, and Retry button inside balance card
  - Number formatting unified to `toLocaleString` with 2 decimal places (commas for values >= 1000)
  - "Updating..." badge refined to only show during background polls (not initial load)
  - 35 tests added (53 expect calls) for wallet page and useWalletPoll hook
- **Known deferred items at close:** 19 (see STATE.md Deferred Items)
- **Key metrics:** 1/1 plans complete, 1/1 requirements satisfied, 35/35 tests passing

## v0.5.0 Security Hardening & Production Readiness

- **Status:** ✅ SHIPPED
- **Date:** 2026-04-30
- **Phases:** 49-53
- **Plans:** 16
- **Accomplishments:**
  - Fixed 6 critical security vulnerabilities (XOR operator, TierBadge token IDs, treasury routing, burnNFT, mintFood approval theft)
  - Fixed 7+ high-severity security issues (self-referral guards, VRF guards, setMintPrice, food count checks, duplicate VRF prevention)
  - Fixed 7 medium-severity security issues (ownerOf compatibility, referral chain reset, food cap, whenNotPaused, SafeERC20, Base64, rarity_seed)
  - Implemented NFT event listener hook for blockchain sync (deployed on production)
  - Implemented retry utility with circuit breaker pattern for API resilience
  - Created 5 E2E test users on production PocketBase
  - Fixed 21 failing frontend tests → 350/350 = 100% pass rate
  - Deployed blockchain sync hooks to production PocketBase
- **Key metrics:** 350/350 tests passing, 100% plans complete, all verification criteria met

## v0.4.0 Functional Journey Tests

- **Status:** ✅ SHIPPED
- **Date:** 2026-04-29
- **Phases:** 45-48
- **Plans:** 4
- **Accomplishments:**
  - Triple verification pattern for NFT ownership (UI + on-chain + PocketBase)
  - Complete E2E journey tests for core user flows (buy, feed/hatch, marketplace, referral)
  - Reusable test helpers and utilities for journey testing
  - Multi-user journey testing with bilateral ownership verification
  - Commission verification infrastructure for referral system
  - Robust test infrastructure with skip-on-env pattern for graceful degradation
- **Known deferred items at close:** 14 (see STATE.md Deferred Items)

## v0.3.0 E2E Flow Testing

- **Status:** ✅ SHIPPED
- **Date:** 2026-04-28
- **Phases:** 41-44
- **Plans:** 6

## v0.2.0 Functional Spec 100%

- **Status:** ✅ SHIPPED
- **Date:** 2026-04-26
- **Phases:** 32-40
- **Plans:** 11

---

_Last updated: 2026-04-30_

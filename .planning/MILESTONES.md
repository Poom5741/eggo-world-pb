# Project Milestones

## v0.3.0 — E2E Flow Testing Infrastructure

**Status:** ✅ ARCHIVED  
**Shipped:** 2026-04-28  
**Phases:** 4 (41-44) | **Plans:** 6

### What Was Built

- Playwright framework with Bun test runner and static export config
- E2E auth bypass via query param trigger (?e2e_test_user=test_buyer)
- Blockchain helpers: waitForTx, getOwnerOf, getBalanceOf, parseEvent
- Synpress MetaMask automation with Anvil test accounts
- GitHub Actions workflow for automated E2E tests on PRs

### Test Infrastructure Coverage

**UAT Verified:** 16/16 tests passed with live services
**E2E Test Suite:** 35 passed, 1 skipped in 15.1s

### Known Gaps (Deferred)

- Test users not created in production PocketBase (pending todo)
- Functional journey tests not yet written (buy egg → feed → hatch)
- 9 UAT gaps + 4 verification gaps from prior milestones (v0.0.7-v0.2.0)

---

## v0.2.0 — Functional Spec 100% Completion

**Status:** ✅ ARCHIVED  
**Shipped:** 2026-04-26  
**Phases:** 9 (32-40) | **Plans:** 15

### What Was Built

- Marketplace stats API (floor price, 24h volume, active listings)
- Recruitment bonus USDT rewards with tier multipliers (×2/×4/×6/×10)
- Chainlink VRF v2.5 integration for verifiable randomness
- Admin game config (platform fee, breed cooldown, rarity weights, species)
- NFT burning + KYC toggle + explicit spend function
- 10 new PocketBase collection fields
- 3 frontend components (RecruitmentBonusCard, KYCStatusBadge, BurnNFTDialog)

### Spec Coverage

**Before:** 85% (40/47 functions)
**After:** 100% (47/47 functions) ✅

### Known Deferred Items at Close

- 9 UAT gaps from prior milestones (v0.0.7-v0.0.9)
- 4 verification gaps (Phase 03, 12, 19, 20)

---

## v0.1.0 — UAT Gap Closure

**Shipped:** 2026-04-25  
**Phases:** 1 (31) | **Plans:** 3

### What Was Built

- Fixed polling badge visibility (minimum 2-second display duration)
- Fixed breeding dialog Parent 2 selection bug (defensive ID filtering)
- Fixed marketplace detail page routing (ID validation + server-side redirect)

### Key Decisions

1. **Minimum display duration pattern** — useState + useRef + useEffect for polling badge
2. **Defensive ID filtering** — Use PocketBase record.id when blockchain token_id unreliable
3. **Server-side redirect** — Next.js redirect() for invalid route params

### Human UAT Pending

3 manual tests in 31-HUMAN-UAT.md

---

## v0.0.9 — Feature Completion & Cloudflare Pages

**Shipped:** 2026-04-24  
**Phases:** 6 (25-30) | **Plans:** 17

### What Was Built

- Rarity upgrade system: MAX_UPGRADE_FOOD=490, RarityUpgradeDialog
- Wallet withdrawal: withdrawUSDT endpoint, withdrawal modal, fee display
- Admin controls: Platform pause/unpause, fee configuration
- Cloudflare Pages deployment: Static export, CI/CD workflow

### UAT Gaps (Deferred to Phase 31)

| Phase | Issue                                       | Severity |
| ----- | ------------------------------------------- | -------- |
| 10    | Polling badge "Updating..." not displayed   | major    |
| 21    | Breeding dialog Parent 2 selection bug      | blocker  |
| 23    | Marketplace detail page "Product not found" | blocker  |

---

## v0.0.8 — NFT Ecosystem Complete

**Shipped:** 2026-04-22  
**Phases:** 5 (20-24) | **Plans:** 16

### What Was Built

- Breeding system: Animal selection dialog, cooldown validation
- Tier rewards & badges: TierBadge.sol (ERC-5192), dashboard integration
- Secondary market & royalties: resale_listings, royalty distribution
- Admin dashboard: Error boundaries, monitoring
- Onboarding tutorial: Walkthrough overlay

---

## v0.0.7 — Security & Quality

**Shipped:** 2026-04-22  
**Phases:** 8 (12-19) | **Plans:** 20

### What Was Built

- Real smart contract integration (4 endpoints, 0xl3 testnet)
- Complete NFT mint flow (contract → PocketBase → marketplace)
- LINE OAuth wallet auto-creation fix
- 80%+ test coverage (49 new tests)
- Feed & play features with daily check-in
- Gas sponsorship system with relayer wallet
- Mobile responsive + WCAG 2.2 AA compliance

### Key Decisions

1. **0xl3 testnet** — Chain ID 7117 over legacy BSC testnet (97)
2. **ethers.js v6** — Better docs than web3.js
3. **12-block confirmation** — Standard for BSC security
4. **onRecordBeforeCreate** — Fixes OAuth wallet creation

---

_Last updated: 2026-04-28 — v0.3.0 milestone archived_

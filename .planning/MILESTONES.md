# Project Milestones

## v0.0.7 — Security & Quality

**Shipped:** 2026-04-22  
**Phases:** 8 (12-19) | **Plans:** 20 | **Commits:** 119

### What Was Built

- Replaced 4 mock blockchain endpoints with real ethers.js contract calls (mint-egg, mint-food, claim-commission, feed-egg)
- Deployed full contract infrastructure to 0xl3 testnet (Chain ID: 7117): MockUSDT, CommissionDistribution, AnimalNFT, EggNFT, FoodNFT
- Implemented complete NFT mint flow: smart contract → PocketBase → marketplace → Buy Now
- Fixed LINE OAuth wallet auto-creation bug (onRecordCreate → onRecordBeforeCreate)
- Achieved 80%+ test coverage with 49 new tests
- Implemented feed & play features with daily check-in and streak rewards
- Gas sponsorship system with platform relayer wallet
- Mobile responsive polish with WCAG 2.2 AA compliance

### Key Decisions

1. **0xl3 testnet priority** — Chain ID 7117 over legacy BSC testnet (97)
2. **ethers.js v6** — Already installed, better docs than web3.js
3. **12-block confirmation** — Standard for BSC security
4. **onRecordBeforeCreate** — Fixes OAuth wallet creation without auth token
5. **Non-blocking PB callback on mint** — PB failure logs error but doesn't fail mint
6. **Daily check-in (off-chain)** — Database only for MVP, skip complex mini-games

### Known Gaps (Deferred to Phase 20)

- Feed-egg foodCount validation (prevent feeding beyond max)
- Gas sponsorship documentation + 5 human verification tests
- 10 UAT scenarios requiring manual execution (feed/hatch/polling/empty state)
- Empty state UI for /eggs page

### Tech Debt

- Mint uses user wallet for gas (MVP), buy uses relayer (inconsistent)
- POST /create-listing endpoint with relayer not implemented
- "Updating..." polling badge visual not verified

---

## v0.0.8 — NFT Ecosystem Complete

**Shipped:** 2026-04-22  
**Phases:** 5 (20-24) | **Plans:** 16 | **Commits:** 67

### What Was Built

- Breeding system: Animal selection dialog, cooldown validation, breeding eggs display
- Tier rewards & badges: TierBadge.sol (ERC-5192), tier_claims collection, dashboard integration
- Secondary market & royalties: resale_listings, royalty distribution, marketplace Animals tab
- Admin dashboard: Error boundaries, monitoring, platform status
- Onboarding tutorial: Walkthrough overlay, step-by-step guidance

### Key Decisions

1. **Breeding cooldown**: 24-hour off-chain validation + on-chain check
2. **Royalty split**: Platform 2.5% + creator 5% (configurable)
3. **Admin auth**: PocketBase role-based access

---

## v0.0.9 — Feature Completion & Cloudflare Pages

**Shipped:** 2026-04-24  
**Phases:** 6 (25-30) | **Plans:** 17 | **Commits:** 54

### What Was Built

- Rarity upgrade system: MAX_UPGRADE_FOOD=490, RarityUpgradeDialog, upgrade-egg-rarity hook
- Wallet withdrawal: withdrawUSDT endpoint, withdrawal modal, fee display, transaction history
- Admin controls: Platform pause/unpause, fee configuration, emergency controls
- Cloudflare Pages deployment: Static export, CI/CD workflow

### UAT Gaps (Deferred to Phase 31)

| Phase | Issue                                       | Severity |
| ----- | ------------------------------------------- | -------- |
| 10    | Polling badge "Updating..." not displayed   | major    |
| 21    | Breeding dialog Parent 2 selection bug      | blocker  |
| 23    | Marketplace detail page "Product not found" | blocker  |

---

## v0.1.0 — UAT Gap Closure

**Shipped:** 2026-04-25  
**Phases:** 1 (31) | **Plans:** 3 | **Commits:** 3

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

### Known Deferred Items (from archived milestones)

- 11 UAT gaps from v0.0.7-v0.0.9 (documented in STATE.md)
- 4 verification gaps (Phase 03, 12, 19, 20)

---

\_Last updated: 2026-04-25

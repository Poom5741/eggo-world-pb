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

_Last updated: 2026-04-22_

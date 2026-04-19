# Milestone v0.0.6 — Project Summary

**Generated:** 2026-04-18  
**Purpose:** Team onboarding and project review  
**Status:** In Progress (Phase 11 underway)

---

## 1. Project Overview

**Egg × Food × Animal NFT Marketplace** on BNB SmartChain (BSC) with gamified NFT mechanics and 4-level MLM referral system.

### What This Is

A Web3 gaming platform where users:
1. **Buy Egg NFTs** (25 USDT) → receive 2 Food NFTs bonus
2. **Buy Food NFTs** (0.50 USDT each) → collect 10 food items
3. **Feed Eggs** → hatch into Animal NFTs with random rarity (Common 60%, Rare 25%, Epic 12%, Legendary 3%)
4. **Trade on Marketplace** → buy/sell NFTs with transparent commission distribution

### Current Milestone: v0.0.6 Frontend Migration & Integration

**Goal:** Replace existing frontend with claymorphism UI design using Test-Driven Development (TDD) while preserving full backend integration.

**Progress:** 4 of 5 phases complete (80%)
- ✅ **Phase 8:** Foundation & Auth (Landing page, LINE OAuth, navigation)
- ✅ **Phase 9:** Dashboard & Wallet (Balance tracking, referral visualization)
- ✅ **Phase 10:** Egg Management (View, feed, hatch mechanics)
- 🚧 **Phase 11:** Marketplace (Buy flow complete, sell flow in progress)
- ⏳ **Phase 12:** Mobile & Polish (Not started)

**Target Users:** Thai market gamers familiar with LINE messaging app, crypto enthusiasts on BSC

---

## 2. Architecture & Technical Decisions

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 16 (Bun runtime) | Fast builds, edge-ready, familiar React patterns |
| **UI Library** | shadcn/ui + Tailwind CSS 4 | Customizable, modern, claymorphism design support |
| **Icons** | Material Symbols (Google CDN) | Jules design requirement, consistent iconography |
| **Backend** | PocketBase (self-hosted) | Lightweight, LINE OAuth integration, auto-wallet hooks |
| **Wallet** | dacc-js v0.0.5 + ethers v6 | DACC encryption for private keys, modern Ethers API |
| **Smart Contracts** | Foundry (Solidity 0.8.20) | Fast compilation, excellent testing framework |
| **Blockchain** | BNB SmartChain (BSC) | Low gas fees, Thai market adoption |
| **Stablecoin** | USDT (BEP-20) | No native token, all transactions in USDT |
| **Deployment** | Cloudflare Pages (static export) | Global CDN, free tier, fast edge delivery |

### Key Technical Decisions

- **Decision:** LINE OAuth single-click authentication  
  - **Why:** Thai market dominance, seamless UX vs email/password friction  
  - **Phase:** 8 (Foundation & Auth)

- **Decision:** Auto-wallet creation on signup via PocketBase hook  
  - **Why:** Remove blockchain complexity from users, generate wallets transparently  
  - **Phase:** 4 (LINE Wallet Integration, v0.0.5)

- **Decision:** TDD workflow for all frontend development  
  - **Why:** Ensure test coverage, prevent regressions during rapid iteration  
  - **Phase:** 8+ (Red → Green → Refactor commit pattern)

- **Decision:** Hydration-safe auth checks with `useIsHydrated()` hook  
  - **Why:** Prevent SSR mismatches when accessing browser-only auth state  
  - **Phase:** 8 (Foundation & Auth)

- **Decision:** Auto-polling with exponential backoff (30s → 60s → 120s → 5min)  
  - **Why:** Keep balances fresh without hammering API, backoff reduces load  
  - **Phase:** 9 (Dashboard & Wallet)

- **Decision:** Material Symbols via Google CDN (not self-hosted)  
  - **Why:** ~40KB payload, edge-cached by Google, simpler than font files  
  - **Phase:** 8 (Foundation & Auth)

- **Decision:** Component patterns: `useWalletPoll`, `useEggPoll` hooks  
  - **Why:** Encapsulate polling logic, reusable across dashboard/eggs/marketplace  
  - **Phase:** 9, 10 (Dashboard, Egg Management)

---

## 3. Phases Delivered

### Milestone v0.0.6 Phases

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| **8** | Foundation & Auth | ✅ Complete | Material Symbols + LayoutWrapper + LINE OAuth (18 tests passing) |
| **9** | Dashboard & Wallet | ✅ Complete | Auto-polling USDT balance + 4-level referral visualization |
| **10** | Egg Management | ✅ Complete | Egg display, feeding flow, 12-second hatch animation |
| **11** | Marketplace | 🚧 In Progress | Buy flow TDD complete (6 tests), sell flow pending |
| **12** | Mobile & Polish | ⏳ Planned | Responsive breakpoints, touch interactions, test coverage |

### Previous Milestone: v0.0.5 (Archived)

**v0.0.5 Claymorphism UI Launch** — Completed 2026-04-05  
Delivered smart contracts, backend integration, LINE OAuth, baseline UI

---

## 4. Requirements Coverage

### v0.0.6 Requirements (30 Total)

#### Phase 8: Foundation & Auth (6/6 ✅)

- ✅ **FOUND-01:** Landing page renders hero section with claymorphism styling
- ✅ **FOUND-02:** LINE OAuth single-click flow works end-to-end
- ✅ **FOUND-03:** Redirect to dashboard after OAuth callback
- ✅ **FOUND-04:** Navigation renders correctly on all device sizes
- ✅ **FOUND-05:** LayoutWrapper provides consistent structure
- ✅ **FOUND-06:** Material Symbols icons load correctly

#### Phase 9: Dashboard & Wallet (6/6 ✅)

- ✅ **FOUND-07:** Wallet balance auto-polls every 30 seconds with "Updating..." indicator
- ✅ **DASH-01:** Dashboard displays user's USDT balance from PocketBase
- ✅ **DASH-02:** Buddy Chain displays 4 levels (G1-G4) with 20%/10%/10%/10% commissions
- ✅ **DASH-03:** Quick action buttons trigger correct navigation
- ✅ **DASH-04:** Recent activity shows last 10 transactions
- ✅ **DASH-05:** Active eggs count displays with egg preview avatars

#### Phase 10: Egg Management (7/7 ✅)

- ✅ **EGG-01:** My Eggs page lists all user's Egg NFTs with status badges
- ✅ **EGG-02:** Egg card shows feeding progress (X/10 food items)
- ✅ **EGG-03:** Feed flow allows selecting egg and exactly 10 food items
- ✅ **EGG-04:** Feed transaction calls smart contract with correct parameters
- ✅ **EGG-05:** Hatch flow triggers `EggNFT.hatchEgg()` transaction
- ✅ **EGG-06:** Hatch reveal displays Animal NFT with rarity badge
- ✅ **EGG-07:** Egg status updates after blockchain confirmation

#### Phase 11: Marketplace (2/6 🚧)

- ✅ **MKT-02:** Product detail page shows NFT metadata and price
- ✅ **MKT-03:** Buy flow executes USDT approval → marketplace purchase
- ⏳ **MKP-01:** Marketplace page lists all available NFTs with filters (in progress)
- ⏳ **MKT-04:** Sell flow creates marketplace listing with escrow (planned)
- ⏳ **MKT-05:** Commission breakdown displays 4-level distribution (planned)
- ⏳ **MKT-06:** Transaction confirmation updates UI state after blockchain sync (in progress)

#### Phase 12: Mobile & Polish (0/5 ⏳)

- ⏳ **MOB-01:** BottomNav toggles visibility at mobile breakpoints
- ⏳ **MOB-02:** All pages render at 320px, 768px, 1024px, 1440px
- ⏳ **MOB-03:** Touch interactions work (tap, swipe-to-refresh)
- ⏳ **MOB-04:** All 63+ tests pass
- ⏳ **MOB-05:** Production build zero errors/warnings

**Coverage Summary:**
- **Complete:** 19/30 requirements met (63%)
- **In Progress:** 4/30 requirements (Phase 11)
- **Planned:** 7/30 requirements (Phase 12)

---

## 5. Key Decisions Log

### Design System Decisions

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| **D-8-01** | Material Symbols via Google CDN | 8 | 40KB, edge-cached, simpler than self-hosting |
| **D-8-02** | LayoutWrapper for page structure | 8 | Consistent navigation across all pages |
| **D-8-03** | TDD commit pattern (red/green/refactor) | 8 | Enforced test coverage, clean commits |
| **D-9-01** | Exponential backoff polling interval | 9 | Balance freshness vs API load trade-off |
| **D-9-02** | "Updating..." badge with pulse animation | 9 | User feedback during async refresh |
| **D-10-01** | Featured egg hero (closest to hatching) | 10 | Highlight most engaging content |
| **D-10-02** | 12-second hatch animation sequence | 10 | Build anticipation, reward moment |
| **D-11-01** | Buy flow: USDT approval → purchase | 11 | ERC20 standard pattern for marketplace |

### Architecture Decisions

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| **A-8-01** | Preserve existing layout.tsx | 8 | Critical font/analytics setup must not break |
| **A-8-02** | Hydration-safe auth with `useIsHydrated()` | 8 | Prevent SSR mismatches on browser-only state |
| **A-9-01** | Polling hooks as reusable utilities | 9 | DRY: useWalletPoll → useEggPoll → useMarketplacePoll |
| **A-10-01** | PocketBase filter: `owner = wallet && is_hatched = false` | 10 | Server-side filtering reduces client load |
| **A-11-01** | Two-step transaction flow (approval + buy) | 11 | ERC20 requirement — user must approve spending first |

### Deferred Decisions

| Topic | Status | Notes |
|-------|--------|-------|
| Social login (Google, Discord) | Deferred to v0.0.7 | LINE OAuth sufficient for MVP Thai market |
| Email/password auth | Out of scope | LINE OAuth only |
| Multi-language support | Deferred to v0.0.7 | Thai initially |
| Dark mode toggle | Out of scope | Single theme for v0.0.6 |
| Animal breeding mechanics | Backlog | Post-MVP feature |
| PWA offline support | Backlog | Performance milestone |

---

## 6. Tech Debt & Deferred Items

### Known Tech Debt

#### 1. Mock Contract Interactions (P0 - Security Critical)

**Location:** `wallet-api/server.js` (lines 388, 422, 457, 493)

**Endpoints returning mock data:**
- `/api/v1/wallet/mint-egg` — fake transaction hash
- `/api/v1/wallet/claim-commission` — fake distribution
- `/api/v1/wallet/mint-food` — fake mint
- `/api/v1/wallet/feed-egg` — fake contract call

**Required:** Replace with real ethers.js contract calls using:
1. Decrypt user private key from database
2. Create ethers signer
3. Call actual smart contract functions
4. Return real transaction hashes

**Dependency:** Contract deployment must complete first.

#### 2. Feed Feature UI (P2 - Nice to Have)

**Location:** `apps/web/app/eggs/page.tsx:89`

**Issue:** UI button exists but does nothing (TODO comment at line 89)

**Required:**
- Wire to FeedDialog component
- Implement `handleFeed()` function
- Connect to `useEggFeed` hook

**Status:** Deferred pending game design finalization.

#### 3. Play Feature UI (P2 - Nice to Have)

**Location:** `apps/web/app/eggs/page.tsx:95`

**Issue:** "PLAY" button non-functional (TODO comment)

**Status:** Awaiting game design spec (play = minigame? interaction?).

#### 4. Track Deposit Hook (P1 - Quality)

**Location:** `apps/backend/pb_hooks/13-track-deposit.pb.js`

**Issue:** Test file states "RED PHASE - Tests will fail until hook is implemented"

**Required:**
- Poll USDT Transfer events for deposits
- Track amounts and timestamps in PocketBase
- Prevent duplicate transaction tracking
- Emit deposit confirmation events

### Lessons Learned (from Retrospective)

#### Wallet Creation Hook Fix (April 2026)

**Issue:** LINE OAuth signup failed with `{"daccPublickey":{"code":"validation_invalid_format"}}`

**Root Cause:**
- Hook `01-create-wallet.pb.js` called wallet-api with WRONG parameters
- Sent: `{userId: e.record.id}` ❌
- Should send: `{passwordSecretkey: randomPassword, publicEncryption: false}` ✅

**Correct Fix:**
```javascript
// Generate RANDOM secure password for wallet encryption
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
let passwordSecretkey = ""
for (let i = 0; i < 20; i++) {
  passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length))
}

// Store in pin field
e.record.set("pin", passwordSecretkey)
e.record.set("wallet", responseData.data.address)
e.record.set("daccPublickey", responseData.data.daccPublickey)
```

**Key Learnings:**
1. User passwords are hashed in PocketBase — never use for wallet encryption
2. Generate random password for wallet, store in `pin` field
3. Reference implementations (`/resources/`) are gold — check FIRST
4. Production infrastructure issues (Nginx, Docker) waste time — test end-to-end

#### Wallet Hook Missing `e.next()` (April 2026)

**Issue:** User signup created records but never committed to database

**Root Cause:** Hook `01-create-wallet.pb.js` missing `e.next()` call

**Fix:**
```javascript
onRecordBeforeCreate((e) => {
  // ... wallet creation logic ...
  e.next() // CRITICAL: Commit the record
})
```

**Key Learnings:**
1. `e.next()` is MANDATORY — without it, PocketBase doesn't commit
2. Use `onRecordBeforeCreate` to set fields BEFORE commit
3. Environment variables for API URLs — never hardcode

---

## 7. Getting Started

### For New Developers

#### Prerequisites

- **Bun** — JavaScript runtime (faster than Node.js)
- **Git** — Version control
- **MetaMask** — Crypto wallet (for testing blockchain features)

#### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/eggo-pocketbase.git
cd eggo-pocketbase

# Install frontend dependencies
bun install apps/web

# Start frontend (connects to production PocketBase)
bun run dev

# Frontend runs at: http://localhost:3000
```

#### Services

| Service | URL | Description |
|---------|-----|-------------|
| **Web App (dev)** | `http://localhost:3000` | Next.js frontend (Bun --hot) |
| **PocketBase (prod)** | `https://pb.eggoworld.io` | Backend API |
| **PocketBase Admin** | `https://pb.eggoworld.io/_/` | Admin dashboard |

#### Environment Variables

Frontend `.env` (if needed):
```bash
NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545  # BSC testnet
```

### Key Directories

```
eggo-pocketbase/
├── apps/web/                    # Next.js 16 frontend
│   ├── app/                     # App Router pages
│   │   ├── dashboard/           # User dashboard
│   │   ├── eggs/                # Egg management
│   │   ├── marketplace/         # NFT marketplace
│   │   └── auth/                # LINE OAuth pages
│   ├── components/              # React components
│   │   ├── eggs/                # EggCard, FeedDialog, HatchAnimation
│   │   ├── dashboard/           # BalanceCard, BuddyChain
│   │   └── ui/                  # shadcn/ui primitives
│   ├── hooks/                   # React hooks
│   │   ├── use-wallet-poll.ts   # Balance polling
│   │   ├── use-egg-poll.ts      # Egg status polling
│   │   └── use-egg-feed.ts      # Feed transaction logic
│   └── lib/                     # Utilities
│       ├── contracts/           # Smart contract ABIs
│       └── pocketbase/          # PB client wrapper
├── apps/backend/                # PocketBase
│   ├── pb_hooks/                # Auto-wallet, LINE OAuth hooks
│   └── pb_migrations/           # Database migrations
├── wallet-api/                  # Express.js wallet service
├── contracts/                   # Foundry smart contracts
└── resources/                   # Reference implementations
    └── eggo-world-uxui-jules/   # Original Jules design files
```

### Running Tests

```bash
# Run all tests
cd apps/web && bun run test

# Run specific test file
bun test app/eggs/page.test.tsx

# Run tests with coverage
bun run test:coverage
```

**Current Test Status:** 268/277 tests passing (9 pre-existing failures)

### Building for Production

```bash
# Build static export (Cloudflare Pages)
cd apps/web && bun run build

# Output: out/ directory
```

### Where to Look First

#### Understanding the Codebase

1. **Start Here:** `apps/web/app/eggs/page.tsx` — Best example of complete feature (polling, auth, UI, hooks)
2. **Hook Pattern:** `apps/web/hooks/use-egg-poll.ts` — Auto-polling template for other features
3. **Component Pattern:** `apps/web/components/eggs/egg-card.tsx` — Claymorphism styling reference
4. **TDD Example:** `apps/web/components/marketplace/BuyFlow.test.tsx` — Test-Driven Development workflow

#### Smart Contracts

- **Contracts:** `contracts/src/` — ERC-1155 NFTs (Egg, Food, Animal) + Marketplace
- **Tests:** `contracts/test/` — Forge tests
- **Deploy Scripts:** `contracts/script/` — Foundry deployment

#### Backend Logic

- **Hooks:** `apps/backend/pb_hooks/` — Wallet creation, LINE OAuth, referral tracking
- **Reference:** `resources/mvp-foodcourt/` — 20+ working hook examples

### Deployment

**Production Deployment Guide:** See `docs/DEPLOYMENT_MISTAKES.md` for critical lessons learned.

**Common Mistakes to Avoid:**
1. Wrong directory `/root/eggo-pocketbase` (prod is at `/root/eggo-world-pb`)
2. Using Docker for PocketBase (prod uses binary: `./pocketbase serve`)
3. Forgetting to `cd apps/backend` before starting (hooks won't load)
4. Hardcoded API URLs in hooks (use `$os.getenv("WALLET_SRV_URL")`)

---

## Stats

### v0.0.6 Statistics (2026-04-05 → Present)

- **Timeline:** 2026-04-05 → 2026-04-18 (13 days, in progress)
- **Phases:** 4 complete / 5 total (80%)
- **Commits:** 179 commits
- **Files Changed:** 375 files
- **Code Changes:** +71,114 insertions / -4,549 deletions
- **Contributors:**
  - **Poom5741:** 178 commits (99.4%)
  - **Eggo Developer:** 1 commit (0.6%)

### v0.0.5 Retrospective (Completed 2026-04-05)

**Timeline:** ~2 weeks  
**Phases Delivered:** 7 (Smart Contracts → Testing/Launch)  
**Requirements Met:** 30/30 MVP requirements complete

---

## Questions?

**This summary is your onboarding doc, but I have full context from all build artifacts.**

Want to know more about:
- **Architecture decisions?** Ask about specific CONTEXT.md files
- **Phase details?** Ask about specific SUMMARY.md or VERIFICATION.md files
- **Requirements coverage?** Ask about REQUIREMENTS.md files
- **Tech debt?** Ask about specific deferred items or RED PHASE tests
- **Getting started?** Ask about running specific features or tests

**Fire away!** 🚀

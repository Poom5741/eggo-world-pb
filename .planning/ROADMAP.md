# NFT Marketplace Roadmap

## Timeline: 2 Weeks (Urgent)

### Phase 1: Smart Contracts Foundation

**Duration:** Days 1-5  
**Goal:** Deploy working smart contracts on BSC testnet  
**Plans:** 1 plan  
**Status:** ✅ VERIFIED COMPLETE — 147/147 tests pass, 5 contracts deployed to 0XL3 testnet

#### Plans

- [x] 01-01-PLAN.md — Deploy contracts to BSC testnet with configuration and verification ✅ COMPLETE

#### Original Tasks

1. **USDT Integration** (Day 1)
   - Deploy or integrate USDT (BEP-20) on BSC testnet
   - Create approval wrapper contract for marketplace
   - Write tests for USDT transfers

2. **NFT Contracts** (Days 2-3)
   - EggNFT.sol: Mint for 25 USDT, auto-mint 2 Food NFTs
   - FoodNFT.sol: Mint for 0.50 USDT, 4 food types
   - AnimalNFT.sol: Hatch from eggs, rarity system
   - Write Forge tests for each contract

3. **Commission Engine** (Day 4)
   - Commission.sol: 4-level MLM (20%/10%/10%/10%)
   - CoinStor 4% fee collection
   - Referral chain registration
   - Test commission distribution math

4. **Marketplace Contract** (Day 5)
   - Marketplace.sol: Escrow, listing, purchase flow
   - Integration with commission engine
   - Deploy all contracts to BSC testnet
   - Verify on BscScan

#### Deliverables

- ✅ 5 smart contracts deployed to BSC testnet
- ✅ Forge tests passing (90%+ coverage)
- ✅ Contract addresses documented
- ✅ Verified on BscScan

#### Success Criteria

- Can mint Egg NFT with USDT
- Can mint Food NFT with USDT
- Commission distributes correctly (20/10/10/10/4%)
- Marketplace escrow works end-to-end

---

### Phase 2: Backend Integration

**Duration:** Days 6-8  
**Goal:** PocketBase collections, hooks, wallet API, blockchain event sync  
**Plans:** 1 plan  
**Status:** ✅ VERIFIED COMPLETE — 30 hooks, 10 collections, wallet API working, event sync configured

#### Plans

- [x] 02-01-PLAN.md — Event sync hook with block polling, 5-event sync, crash recovery ✅ COMPLETE

#### Tasks

1. **PocketBase Collections** (Day 6)
   - Create `users` collection with referral fields
   - Create `nfts` collection for metadata
   - Create `transactions` collection for logging
   - Set up indexes and relations

2. **PocketBase Hooks** (Day 7)
   - 02-register-referral.pb.js: Build referral chain
   - 03-sync-nft-metadata.pb.js: Listen to contract events
   - 04-track-commissions.pb.js: Log distributions
   - Test hooks with real transactions

3. **Wallet API** (Day 8)
   - GET /api/wallet/:address/balance: USDT balance
   - POST /api/wallet/:address/approve: Approve marketplace
   - POST /api/transaction/sign: Sign and broadcast
   - Deploy wallet API to production

#### Deliverables

- ✅ 3 PocketBase collections created
- ✅ 3 new hooks implemented and tested
- ✅ Wallet API endpoints working
- ✅ Event sync from blockchain to DB

#### Success Criteria

- User registration builds referral_chain[4]
- NFT minting syncs to PocketBase
- USDT balance queries work
- Commissions logged in DB

---

### Phase 3: Frontend Marketplace

**Duration:** Days 9-12  
**Goal:** User-facing UI for all core actions  
**Plans:** 5 plans  
**Status:** ✅ VERIFIED COMPLETE — 17 routes render, 9 bugs fixed (BUG-007–BUG-012), build passes

#### Plans

- [x] 03-01-PLAN.md — Hatch Egg flow with simple reveal UI ✅ COMPLETE
- [x] 03-02-PLAN.md — My Wallet page with auto-polling balance ✅ COMPLETE
- [x] 03-03-PLAN.md — Product Detail + Referral Dashboard ✅ COMPLETE
- [x] 03-04-PLAN.md — Auto-polling integration + polish pages ✅ COMPLETE
- [x] 03-05-PLAN.md — Gap closure: Buy Now + verify polling indicators ✅ COMPLETE

#### Original Tasks

1. **Auth & Onboarding** (Day 9)
   - ✅ LINE OAuth integration (already exists)
   - ✅ Wallet connection UI
   - ✅ Referral code input on signup
   - ✅ User dashboard skeleton

2. **Marketplace UI** (Day 10)
   - ✅ Browse listings page with filters
   - [x] Product detail page (Plan 03)
   - ✅ Buy now flow with USDT
   - ✅ My NFTs inventory page

3. **Game Actions** (Day 11)
   - ✅ Buy Egg page (25 USDT, shows 2 bonus food)
   - [x] Buy Food page (0.50 USDT each) (Plan 04)
   - ✅ Feed Egg interface (select egg + 10 food)
   - [x] Hatch Egg simple reveal (Plan 01)

4. **Wallet & Referral** (Day 12)
   - [x] My Wallet page (USDT balance, earnings) (Plan 02)
   - [x] Referral dashboard (link, downline, earnings) (Plan 03)
   - [x] Withdraw USDT flow (Plan 02)
   - [x] List NFT for sale interface (Plan 04)

#### Deliverables

- ✅ 8+ pages/components implemented
- ✅ All core user actions working
- ✅ Responsive design (mobile-first)
- ✅ Error handling and loading states

#### Success Criteria

- User can complete full loop: Buy Egg → Buy Food → Feed → Hatch → List → Sell
- USDT transactions work end-to-end
- Referral earnings display correctly
- UI is responsive and polished

---

### Phase 4: LINE Wallet Integration

**Duration:** Days 9-10  
**Goal:** Migrate wallet API from ethers v6 to dacc-js v0.0.5, integrate with LINE OAuth flow  
**Plans:** 4 plans (2 original + 2 gap closure)  
**Status:** ✅ VERIFIED COMPLETE — TypeScript + dacc-js migration confirmed, wallet-api working

#### Plans

- [x] 04-01-PLAN.md — Migrate wallet-api to TypeScript + dacc-js v0.0.5 ✅ COMPLETE
- [x] 04-02-PLAN.md — Update PocketBase hook + verify integration ✅ COMPLETE
- [x] 04-03-PLAN.md — Gap closure: Fix legacy hook conflicts blocking PocketBase deployment ✅ COMPLETE
- [x] 04-04-PLAN.md — Gap closure: Complete integration testing ✅ COMPLETE

#### Tasks

1. **Wallet API Migration** (Day 9)
   - Migrate from JavaScript + ethers v6 to TypeScript + dacc-js v0.0.5
   - Use Bun runtime with Express
   - Endpoint: POST /api/wallet/create with passwordSecretkey
   - Response: { address, daccPublickey }

2. **PocketBase Hook Update** (Day 10)
   - Update 01-create-wallet.pb.js to call new wallet API
   - Generate 20-char random passwordSecretkey
   - Save wallet, pin, daccPublickey to user record
   - Verify integration with LINE OAuth signup

#### Deliverables

- ✅ Wallet API running on TypeScript + Bun + dacc-js
- ✅ PocketBase hook creates DACC wallets on signup
- ✅ User records populated with wallet, pin, daccPublickey
- ✅ LINE OAuth flow unchanged and working

#### Success Criteria

- New user signup via LINE OAuth → auto-creates DACC wallet
- User record has wallet (address), pin (20-char password), daccPublickey
- Wallet API health check returns OK
- No errors in PocketBase or wallet-api logs

---

### Phase 5: Testing & Launch

**Duration:** Days 13-14  
**Goal:** Production deployment, bug fixes, and UI polish  
**Plans:** 4 plans  
**Status:** ✅ COMPLETE - All plans executed, production-ready

#### Plans

- [x] 05-01-PLAN.md — Security fixes: crypto.randomBytes(), remove password from API, Zod validation ✅ COMPLETE
- [x] 05-02-PLAN.md — Integration testing: dashboard tests, BuyEggFlow tests, commission distribution tests ✅ COMPLETE
- [x] 05-03-PLAN.md — Production deployment: Docker health checks, BSC mainnet deployment, deployment checklist ✅ COMPLETE
- [x] 05-04-PLAN.md — UI polish & bug fixes: visual consistency, English error messages, bug tracking ✅ COMPLETE

#### Original Tasks

1. **Integration Testing** (Day 13)
   - End-to-end user flow tests
   - Commission distribution verification
   - Gas optimization pass
   - Security audit (self-audit checklist)

2. **Production Deployment** (Day 14)
   - Deploy contracts to BSC mainnet (or keep on testnet for beta)
   - Deploy frontend to Cloudflare Pages
   - Deploy PocketBase to production
   - Update DNS and SSL

3. **Bug Fixes & Polish**
   - Fix critical bugs from testing
   - UI polish and loading states
   - Error messages and edge cases
   - Documentation for users

#### Deliverables

- ✅ Production deployment complete
- ✅ All critical bugs fixed
- ✅ User documentation
- ✅ Monitoring and alerting setup

#### Success Criteria

- No critical or high-severity bugs
- Page load < 3s
- All transactions confirm < 30s
- User can complete full game loop without errors

---

### Phase 6: Auth Flow Revamp

**Duration:** 1-2 days  
**Goal:** Eliminate double-click auth UX issue and fix blank page after LINE OAuth redirect. Users click once to start OAuth from login/signup pages directly. Post-auth redirect properly navigates to intended destination.  
**Plans:** 3 plans
**Status:** ✅ VERIFIED COMPLETE — 9/9 must-haves pass, 61 tests pass, build clean

#### Plans

- [ ] 06-01-PLAN.md — Shared LINE OAuth helper + middleware redirectTo (Wave 1)
- [ ] 06-02-PLAN.md — Revamp auth pages: login, sign-up, /auth/line callback handler (Wave 2)
- [ ] 06-03-PLAN.md — Root page hydration fix + full build verification (Wave 3)

#### Problems to Solve

1. **Double-click issue** — `/auth/login` and `/auth/sign-up` link to `/auth/line` as an intermediate page, which then shows another LINE button. User must click twice.
2. **Blank page after redirect** — After LINE OAuth completes and `/auth/line` calls `authWithPassword` + sets cookie, `router.replace('/')` lands on the root page which shows blank "LOADING..." during React hydration.
3. **No `redirectTo` tracking** — After auth always goes to `/` regardless of where user was trying to go.

#### Tasks

1. **Shared LINE OAuth helper** (`apps/web/lib/auth/line-oauth.ts`)
   - `initiateLineLogin({ referrer?, redirectTo? })` builds LINE auth URL and navigates immediately
   - Stores `redirectTo` and `referrer` in `sessionStorage` before redirecting

2. **Update `/auth/login/page.tsx`**
   - Replace `<a href="/auth/line">` with button calling `initiateLineLogin()` directly
   - Read `redirectTo` from query params, save to `sessionStorage`
   - Use UI/UX Pro Max design system for polish

3. **Update `/auth/sign-up/page.tsx`**
   - Replace navigate-to-/auth/line flow with direct `initiateLineLogin()` call
   - Carry `referrer` and `redirectTo` through OAuth state
   - Use UI/UX Pro Max design system for polish

4. **Revamp `/auth/line/page.tsx`** — pure callback handler
   - No LINE login button visible (move to login/signup pages)
   - On mount: detect `?email=&password=` params → `authWithPassword` → redirect to `sessionStorage.redirectTo || '/'`
   - If no callback params: redirect to `/auth/login`
   - Only renders a loading/processing state

5. **Update `middleware.ts`**
   - Append `?redirectTo=<encoded path>` when redirecting unauthenticated users to `/auth/login`

6. **Fix root page hydration flash**
   - Reduce blank "LOADING..." state duration on `/` after auth redirect

#### Deliverables

- Shared LINE OAuth initiation helper extracted
- Login page directly triggers LINE OAuth on single click
- Sign-up page directly triggers LINE OAuth on single click
- `/auth/line` is a pure silent callback handler
- Post-auth navigation uses `redirectTo` when available
- No more blank page flash after OAuth

#### Success Criteria

- User clicks "LOGIN WITH LINE" on `/auth/login` → directly goes to LINE OAuth (no intermediate page)
- After OAuth completes, user lands on intended page (or `/` if no `redirectTo`)
- No visible blank/white screen flash on post-auth navigation
- `/auth/line` navigated to directly (without callback params) redirects to `/auth/login`

---

### Phase 7: Claymorphism Redesign

**Duration:** 1 week  
**Goal:** Redesign entire UI with hybrid "Clay Frames, Pixel Content" aesthetic - modern claymorphism containers showcasing retro pixel art NFTs  
**Plans:** 7 plans  
**Status:** 🔄 IN PROGRESS - Plans created, ready for execution

#### Plans

- [ ] 07-02-PLAN.md — Foundation: globals.css claymorphism tokens (Wave 1)
- [ ] 07-03-PLAN.md — UI Primitives Part 1: Button, Card, Badge, Input, Label, Spinner (Wave 2)
- [ ] 07-04-PLAN.md — UI Primitives Part 2: Dialog, Alert, Progress, Table, Navigation, Dropdown (Wave 3)
- [ ] 07-05-PLAN.md — NFT Cards: EggCard, FoodCard, ReferralChainDisplay hybrid redesign (Wave 3)
- [ ] 07-06-PLAN.md — Pages Wave 1: Landing, Dashboard, Auth, Eggs, Referrals, Wallet (Wave 4)
- [ ] 07-07-PLAN.md — Pages Wave 2: Mint, Feed, Hatch, Marketplace, Commissions + modals (Wave 5)
- [ ] 07-08-PLAN.md — Polish: Design system docs, accessibility audit, performance, cross-browser testing (Wave 6)

#### Design Philosophy

**Hybrid Approach:** Modern UI frames (claymorphism) showcasing retro game content (pixel art)

**Convert to Claymorphism:**
- ✅ Card containers (EggCard, FoodCard wrappers)
- ✅ Buttons (all CTA buttons - Hatch, Feed, Mint, Buy)
- ✅ Input fields and forms
- ✅ Modals and dialogs (ListForSaleModal, WalletModal)
- ✅ Navigation elements (Header, sidebar)
- ✅ Dashboard widgets (stats cards, balance display)
- ✅ Badge and status indicators
- ✅ Alert/toast notifications

**Preserve Pixel Art:**
- ✅ NFT sprites (eggs, food, animals) - these are the CONTENT
- ✅ Press Start 2P font for headings and labels
- ✅ Lucide icons (already vector, fits both styles)
- ✅ 8-bit decorative elements (stars, particles)
- ✅ Retro animations (twinkle, float, glitch - work with clay)

#### Tasks

1. **Design Tokens** (Day 1)
   - Add claymorphism shadow system (sm, md, lg, xl, 2xl)
   - Add border radius scale (16px to 40px)
   - Add color extensions for highlights/shadows
   - Update Tailwind config in globals.css

2. **UI Primitives** (Days 2-3)
   - Update button.tsx with clay variants
   - Update card.tsx with clay variants
   - Update badge, input, dialog, alert components
   - Maintain backward compatibility

3. **NFT Cards** (Day 4)
   - EggCard: Clay container (32px radius) + pixel egg sprite
   - FoodCard: Clay frame (24px radius) + pixel food sprite
   - ReferralChainDisplay: Clay depth hierarchy (G1-G4)

4. **Pages Wave 1** (Days 5-6)
   - Landing page: Hero, pricing, features with clay depth
   - Dashboard: Stat widgets, NFT grid
   - Auth pages: Login, signup, callback, error forms
   - Eggs, Referrals, Wallet pages

5. **Pages Wave 2** (Days 7-8)
   - Mint pages: Step flow with clay indicators
   - Feed/Hatch pages: Progress and celebration cards
   - Marketplace: Listing and detail pages
   - Commissions page: Breakdown widgets

6. **Polish & Documentation** (Days 9-10)
   - Update DESIGN_SYSTEM.md with claymorphism section
   - Accessibility audit (WCAG AA compliance)
   - Performance optimization (shadow rendering)
   - Cross-browser testing

#### Deliverables

- ✅ Complete claymorphism design token system
- ✅ 15+ UI components updated with clay variants
- ✅ 17 pages redesigned with hybrid aesthetic
- ✅ Design system documentation updated
- ✅ Accessibility audit report (WCAG AA)
- ✅ Browser compatibility report

#### Success Criteria

- All UI containers display with claymorphism (shadows, radius 16-40px)
- All NFT sprites remain pixelated (sharp edges, pixelated rendering)
- Typography maintains Press Start 2P for headings
- Hybrid aesthetic clear: "modern museum displaying vintage art"
- All components pass WCAG AA contrast requirements
- 60 FPS performance on modern browsers
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge 120+)

---

## Post-MVP Roadmap (Week 3+)

### Phase 5: Breeding & Tiers

- Animal breeding mechanics
- Tier reward badges (soulbound NFTs)
- Rarity upgrade paths (extra food)
- Enhanced rarity system

### Phase 6: Admin & Analytics

- Admin dashboard
- Platform statistics
- User management
- Content moderation

### Phase 7: Advanced Features

- Secondary market royalties (10% to referral chain)
- KYC verification
- Multi-chain support (Polygon, Ethereum)
- Mobile app

---

## Critical Path

```
Day 1-5:  Smart Contracts ← BLOCKER for everything else
Day 6-8:  Backend Integration
Day 9-12: Frontend UI
Day 13-14: Testing & Launch
```

**Risk:** Smart contract delays cascade to all subsequent phases

**Mitigation:**
- Daily progress checks
- Use AI for code generation
- Defer non-critical features
- Test contracts in parallel with development

---

## Resource Allocation

**Solo Developer Time:**

- Smart Contracts: 40% (5 days)
- Backend: 20% (3 days)
- Frontend: 30% (4 days)
- Testing: 10% (2 days)

**AI Assistance:**

- Contract generation and testing
- Boilerplate code
- Documentation
- Debugging

---

## Milestones

| Milestone          | Target Date | Status                     |
| ------------------ | ----------- | -------------------------- |
| Contracts Deployed | Day 5       | ✅ Complete                |
| Backend Complete   | Day 8       | ✅ Complete                |
| UI Complete        | Day 12      | ✅ Complete                |
| **MVP Launch**     | **Day 14**  | **✅ v0.1.0-mvp-complete** |

---

## Next Steps

1. **Start Phase 1:** `/gsd-plan-phase 1`
2. Review and approve Phase 1 tasks
3. Begin smart contract development

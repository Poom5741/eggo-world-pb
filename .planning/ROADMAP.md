# NFT Marketplace Roadmap

## Timeline: 2 Weeks (Urgent)

### Phase 1: Smart Contracts Foundation

**Duration:** Days 1-5  
**Goal:** Deploy working smart contracts on BSC testnet  
**Plans:** 1 plan  
**Status:** Ready to deploy

#### Plans

- [ ] 01-01-PLAN.md — Deploy contracts to BSC testnet with configuration and verification

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
**Status:** Ready to execute

#### Plans

- [ ] 02-01-PLAN.md — Event sync hook with block polling, 5-event sync, crash recovery

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
**Status:** Planned

#### Plans

- [x] 03-01-PLAN.md — Hatch Egg flow with simple reveal UI ✅ COMPLETE
- [x] 03-02-PLAN.md — My Wallet page with auto-polling balance ✅ COMPLETE
- [x] 03-03-PLAN.md — Product Detail + Referral Dashboard ✅ COMPLETE
- [x] 03-04-PLAN.md — Auto-polling integration + polish pages
- [ ] 03-05-PLAN.md — Gap closure: Buy Now + verify polling indicators

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
**Status:** ✅ COMPLETE

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
**Goal:** Production deployment, bug fixes

#### Tasks

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

| Milestone          | Target Date | Status     |
| ------------------ | ----------- | ---------- |
| Contracts Deployed | Day 5       | ⏳ Pending |
| Backend Complete   | Day 8       | ⏳ Pending |
| UI Complete        | Day 12      | ⏳ Pending |
| Production Launch  | Day 14      | ⏳ Pending |

---

## Next Steps

1. **Start Phase 1:** `/gsd-plan-phase 1`
2. Review and approve Phase 1 tasks
3. Begin smart contract development

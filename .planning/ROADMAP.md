### Phase 18: Fix LINE OAuth Wallet Auto-Creation ✅ COMPLETE

**Goal:** LINE OAuth users get wallets auto-created during signup, enabling Buy Now flow  
**Depends on:** Nothing (bug fix)  
**Requirements:** UI-05 (Buy Now flow), SEC-01 (wallet creation)  
**Success Criteria** (what must be TRUE):

1. ✅ LINE OAuth signup triggers wallet creation hook automatically
2. ✅ New users have `wallet` field populated with valid Ethereum address (0x...)
3. ✅ New users have `daccPublickey` field populated
4. ✅ `user_wallets` record created with initial USDT balance (0)
5. ✅ Buy Now flow works for LINE OAuth users without "User has no wallet" error

**Plans**: 2 plans COMPLETE

Plans:

- [x] 18-01-PLAN.md — Fix wallet hook (onRecordCreate → onRecordBeforeCreate), add debug endpoint ✅
- [x] 18-02-PLAN.md — Update OAuth callback with wallet verification, create test script ✅

**Root Cause Identified:**

The `01-create-wallet.pb.js` hook uses `onRecordCreate` with `$apis.requireAuth()` which requires an authenticated user. However, LINE OAuth creates users via `pb.collection('users').create()` WITHOUT an auth token (new user doesn't have one yet). The auth check fails silently, so wallet creation never executes.

**Fix Applied:**

Changed hook to `onRecordBeforeCreate` which fires before commit and doesn't require authentication. Removed `$apis.requireAuth()` call and `e.next()` (not needed in onRecordBeforeCreate). Added wallet verification to line-callback.html to catch any future hook failures.

**Completion Evidence:**

- PocketBase 0.23.4 API compatibility fixes applied (`getNumber()` → `get()`)
- Buy Now endpoint deployed and tested: `POST /api/v2/marketplace/buy`
- Wallet auto-creation working for new LINE OAuth users

---

### Phase 19: Real NFT Mint Flow & Marketplace Integration

**Goal:** Users can mint real Egg NFTs from smart contract, auto-register in PocketBase, list on marketplace, and complete Buy Now flow  
**Depends on:** Phase 12 (contract infrastructure), Phase 18 (wallet auto-creation)  
**Requirements:** UI-05 (Buy Now flow), SEC-01 (NFT minting)  
**Success Criteria** (what must be TRUE):

1. User can mint Egg NFT via smart contract and receive real transaction hash
2. Minted NFT is automatically registered in PocketBase `egg_nfts` collection
3. NFT owner can list item on marketplace with USDT price
4. Buyer can purchase listed NFT via Buy Now flow with USDT transfer
5. Ownership transfers correctly on-chain and in PocketBase database

**Plans**: 5 plans created

Plans:

- [ ] 19-01-PLAN.md — Wallet-api mint endpoint with PocketBase callback (wave 1)
- [ ] 19-02-PLAN.md — Frontend Mint Egg page with navigation (wave 2)
- [ ] 19-03-PLAN.md — On-chain marketplace buy flow integration (wave 2)
- [ ] 19-04-PLAN.md — Gas sponsorship system with relayer wallet (wave 1)
- [ ] 19-05-PLAN.md — E2E testing & verification checklist (wave 3)

**Wave Structure:**

- Wave 1: Plans 01, 04 (independent, can run in parallel)
- Wave 2: Plans 02, 03 (depend on wave 1 completion)
- Wave 3: Plan 05 (depends on all previous plans)

**Key Components:**

- Smart contract mint endpoint (ethers.js → EggNFT contract)
- PocketBase record creation after mint confirmation
- Marketplace listing creation UI and API
- Buy Now flow integration with real NFTs
- Ownership synchronization (on-chain + database)
- Gas sponsorship via platform relayer wallet

---

_Last updated: 2026-04-21 — Phase 18 COMPLETE, Phase 19 planning complete (5 plans)_

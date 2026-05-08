# Milestone v0.6.0 — Production Launch

**Document Type:** Product Specification + Implementation Plan
**Created:** 2026-05-01
**Updated:** 2026-05-01 (execution in progress)
**Status:** Active — Phases 1-4 in progress
**Priority:** P0 — Blocks Production Launch

---

## Executive Summary

**Current State:** ~88% Production-Ready (Phases 1-3 substantially complete)
**Goal:** 100% Production-Ready — Deploy to Mainnet
**Blockers:** Deployment prep not started

The previous milestone (v0.5.0) fixed 6 critical + 7 high + 7 medium security issues from the April 29 audit. This milestone verifies those fixes, addresses remaining gaps, and crosses the production readiness threshold.

---

## Phase Overview

| Phase | Title                                            | Effort   | Priority | Status                                      |
| ----- | ------------------------------------------------ | -------- | -------- | ------------------------------------------- |
| 1     | Verify Critical Smart Contract Fixes (C-02–C-06) | 3-4 days | P0       | ✅ COMPLETE (all already fixed)             |
| 2     | Fix High-Severity Contract Issues (H-02 + L-02)  | 2-3 days | P0       | ✅ COMPLETE (VRF breeding, keyHash check)   |
| 3     | Plug Production Security Leaks                   | 1 day    | P0       | ✅ COMPLETE (creds fixed, .env clean)       |
| 4     | Add Legal & Compliance Pages                     | 2-3 days | P0       | ✅ COMPLETE (privacy, terms, disclaimer)    |
| 5     | Complete Remaining Spec Gaps                     | 3-4 days | P1       | ✅ COMPLETE (footer links, HatchReveal msg) |
| 6     | Production Deployment & Verification             | 2-3 days | P0       | 🔴 NOT STARTED                              |

**Total Remaining Effort:** 2-3 days (Phase 6 only)

---

# Phase 1: Verify Critical Smart Contract Fixes (C-02–C-06)

## Problem

The April 29 audit identified 6 critical vulnerabilities (C-01 through C-06). C-01 (XOR bug) and C-06 (mintFood approval theft) appear fixed. **C-02 through C-05 must be verified and fixed before mainnet deployment.**

## Success Criteria

- [ ] C-02: TierBadge supports multiple users per tier (unique token IDs per mint)
- [ ] C-03: CommissionDistribution pays USDT (not ETH) for commissions and CoinStor withdrawals
- [ ] C-04: 46% treasury allocation is accessible (not permanently locked)
- [ ] C-05: `burnNFT` either removed or gated behind `ownerOf(tokenId) == msg.sender`
- [ ] All fixes have regression tests confirming the exploit no longer works
- [ ] `forge test` passes with 0 failures

## Implementation

### Task 1.1 — Verify & Fix C-02: TierBadge Token ID Reuse

**File:** `contracts/src/TierBadge.sol`

**Problem:** `_safeMint(user, tokenId)` where `tokenId ∈ {1,2,3}` — ERC-721 requires globally unique token IDs. Second user to claim any tier reverts.

**Fix (verify or apply):**

```solidity
mapping(uint256 => uint256) public tokenTier; // tokenId => tierId
uint256 id = _nextTokenId++;
_safeMint(user, id);
tokenTier[id] = tierId;
```

**Acceptance Test:**

```solidity
tierBadge.mintTierBadge(alice, 1, 10);   // ✅ token #1 → alice
tierBadge.mintTierBadge(bob,   1, 10);   // ✅ token #2 → bob (was: ❌ revert)
assertEq(tierBadge.ownerOf(1), alice);
assertEq(tierBadge.ownerOf(2), bob);
```

### Task 1.2 — Verify & Fix C-03: CommissionDistribution ETH/USDT Mismatch

**File:** `contracts/src/CommissionDistribution.sol`

**Problem:**

```solidity
(bool success, ) = payable(msg.sender).call{value: balance}("");   // pays ETH
// but balance is credited from USDT mint proceeds
```

**Fix (verify or apply):**

```solidity
function claimCommission() external nonReentrant {
    uint256 balance = commissionBalances[msg.sender];
    require(balance > 0, "No commission");
    commissionBalances[msg.sender] = 0;
    usdtToken.safeTransfer(msg.sender, balance);  // ✅ pays USDT
    emit CommissionClaimed(msg.sender, balance);
}
// Also fix withdrawCoinStor, add receive() { revert(); }
```

**Acceptance Test:**

```solidity
// Distribute commission from USDT mint
uint256 aliceBalanceBefore = usdtToken.balanceOf(alice);
commissionDist.distributeCommission([alice, bob, charlie, dave], 25e18);
commissionDist.claimCommission({from: alice});
uint256 aliceBalanceAfter = usdtToken.balanceOf(alice);
assertEq(aliceBalanceAfter - aliceBalanceBefore, 5e18);  // 20% of 25
```

### Task 1.3 — Verify & Fix C-04: 46% Treasury Lock

**File:** `contracts/src/CommissionDistribution.sol`

**Problem:** `TREASURY_PERCENT = 46` is declared but never credited. USDT is transferred in full, only 54% distributed, 46% unreachable.

**Fix (verify or apply):**

```solidity
address public immutable treasury;
// In distributeCommission:
uint256 treasuryAmount = (amount * TREASURY_PERCENT) / TOTAL_PERCENT;
commissionBalances[treasury] += treasuryAmount;
// Constructor assertion:
require(G1+G2+G3+G4+COINSTOR+TREASURY == 100, "Percent must sum to 100");
```

**Acceptance Test:**

```solidity
uint256 treasuryBalanceBefore = commissionDist.commissionBalances(treasury);
commissionDist.distributeCommission([alice, bob, charlie, dave], 25e18);
uint256 treasuryBalanceAfter = commissionDist.commissionBalances(treasury);
assertEq(treasuryBalanceAfter - treasuryBalanceBefore, 11.5e18);  // 46% of 25
```

### Task 1.4 — Verify & Fix C-05: `burnNFT` Owner Rug-Pull

**File:** `contracts/src/EggNFT.sol`, `contracts/src/AnimalNFT.sol`

**Problem:** `burnNFT(nft_id)` allows `onlyOwner` to burn ANY user's NFT. Pure rug-pull vector.

**Fix (verify or apply):**

```solidity
// Option A: Remove burnNFT entirely
// Option B: Require ownerOf(tokenId) == msg.sender
function burnNFT(uint256 tokenId, NFTType nftType) external {
    if (nftType == NFTType.Egg) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
    }
    // ...
}
// Option C: Gate behind multi-sig + timelock
```

**Acceptance Test:**

```solidity
// Non-owner cannot burn
vm.prank(eve);
vm.expectRevert("Not token owner");
eggNFT.burnNFT(aliceEggId, NFTType.Egg);

// Owner of token can burn their own
vm.prank(alice);
eggNFT.burnNFT(aliceEggId, NFTType.Egg);  // ✅ success
```

### Task 1.5 — Add Foundry Regression Tests

**File:** `contracts/test/ProductionReadiness.t.sol` (new)

- Test C-02: Multiple users can claim same tier
- Test C-03: Commission pays USDT, not ETH
- Test C-04: Treasury receives its 46% share
- Test C-05: Only token owner can burn their NFT
- Assert total percent = 100

**Verification:**

```bash
forge test --match-contract ProductionReadiness -vvv
# Expected: 5/5 tests passing
```

---

# Phase 2: Fix High-Severity Contract Issues (H-04–H-07)

## Problem

7 high-severity findings were reported in the audit. H-01 (self-referral) is fixed. H-02 (randomness) and H-03 (setMintPrice) need verification. H-04 through H-07 need fixes.

## Success Criteria

- [ ] H-02: Breeding uses VRF (not block hash) for randomness
- [ ] H-03: `setMintPrice` actually updates the price (not a no-op)
- [ ] H-04: `hatchBreedingEgg` requires `foodCount >= MAX_FOOD_COUNT`
- [ ] H-05: Duplicate VRF requests blocked
- [ ] H-06: VRF-pending eggs cannot be transferred (or state is properly cleared)
- [ ] H-07: `distributeCommission` only callable by NFT contracts, not owner
- [ ] All fixed issues have regression tests

## Implementation

### Task 2.1 — Fix H-02: Breeding Randomness (VRF Migration)

**Files:** `contracts/src/EggNFT.sol`, `contracts/src/AnimalNFT.sol`

**Problem:** `breedAnimals()` uses `keccak256(block.timestamp, block.prevrandao)` which MEV/validators can manipulate.

**Implementation:**

1. Extend the VRF two-phase pattern (request → fulfill) to breeding
2. When `breedAnimals()` is called, request VRF for offspring rarity
3. Store pending breed state in mapping
4. On VRF fulfillment, mint offspring with VRF-derived rarity
5. Add `claimBreed(requestId)` for second-phase claiming

**Files to Modify:**

- `contracts/src/EggNFT.sol` — Add `requestBreed()`, `claimBreed()`, VRF fulfillment for breeding
- `apps/backend/pb_hooks/18-breed-animals.pb.js` — Update to call new VRF breeding endpoint
- `wallet-api/server.js` — Update breed endpoint

**Acceptance Test:**

```solidity
uint256 requestId = eggNFT.requestBreed(animal1, animal2, address(this));
// ... VRF fulfills ...
uint256 offspringId = eggNFT.claimBreed(requestId);
assertTrue(offspringId > 0);
```

### Task 2.2 — Fix H-03: `setMintPrice` No-Op

**File:** `contracts/src/EggNFT.sol`

**Fix:**

```solidity
// Change from constant to mutable
uint256 public mintPrice = 25 * 10**18;
// Remove the constant keyword

// Fix the setter:
function setMintPrice(uint256 newPrice) external onlyOwner {
    require(newPrice >= 1 * 10**18, "Price too low");  // min 1 USDT
    require(newPrice <= 1000 * 10**18, "Price too high"); // max 1000 USDT
    mintPrice = newPrice;
    emit MintPriceUpdated(newPrice);
}
```

**Acceptance Test:**

```solidity
eggNFT.setMintPrice(50e18);
assertEq(eggNFT.mintPrice(), 50e18);
```

### Task 2.3 — Fix H-04: `hatchBreedingEgg` Missing Food Count Check

**File:** `contracts/src/EggNFT.sol`

**Fix:**

```solidity
function hatchBreedingEgg(uint256 tokenId) external {
    EggProperties storage props = _eggProperties[tokenId];
    require(props.is_breeding_egg, "Not a breeding egg");
    require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");  // ✅ ADD THIS
    require(props.is_hatched == false, "Already hatched");
    // ... rest of logic
}
```

### Task 2.4 — Fix H-05: Duplicate VRF Requests

**File:** `contracts/src/EggNFT.sol`

**Fix:**

```solidity
// In the hatch/breed VRF request function:
require(tokenToRequestId[tokenId] == 0, "Hatch already requested");
// Or clear it on fulfill:
tokenToRequestId[tokenId] = 0;  // in fulfillHatch
```

### Task 2.5 — Fix H-06: Egg Transferable During VRF Pending

**File:** `contracts/src/EggNFT.sol` — `_update()` override

**Fix:**

```solidity
function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
    EggProperties storage props = _eggProperties[tokenId];
    if (!props.is_hatched && tokenToRequestId[tokenId] != 0) {
        // Option A: Revert transfer
        // revert("VRF pending, cannot transfer");

        // Option B: Clear pending VRF state
        delete tokenToRequestId[tokenId];
        delete pendingHatches[tokenToRequestId[tokenId]];
    }
    return super._update(to, tokenId, auth);
}
```

### Task 2.6 — Fix H-07: Owner Can Credit Arbitrary Commission Balances

**File:** `contracts/src/CommissionDistribution.sol`

**Fix:**

```solidity
function distributeCommission(address[4] calldata referralChain, uint256 amount) external {
    require(msg.sender == eggNFTContract || msg.sender == foodNFTContract, "Not authorized");
    // ... no owner override
}

// Remove owner from the authorized callers in constructor:
// (eggNFTContract and foodNFTContract are set via setter with onlyOwner)
```

---

# Phase 3: Plug Production Security Leaks

## Problem

Several operational security issues were discovered during audit:

1. Admin credentials hardcoded in `docs/FINAL_STATUS.md`
2. LINE_CHANNEL_SECRET potentially exposed
3. Wallet encryption key management unclear

## Success Criteria

- [ ] No hardcoded credentials in any documentation
- [ ] All `.env` files properly gitignored
- [ ] Admin credentials rotated
- [ ] Wallet master key management documented securely

## Implementation

### Task 3.1 — Remove Hardcoded Credentials from Docs

**File:** `docs/FINAL_STATUS.md`

**Actions:**

1. Remove the admin email/password block from the doc
2. Replace with: `"Configure in PocketBase Admin UI (see ops team for credentials)"`
3. Check all other docs for hardcoded credentials (grep for `admin@`, `password`, `secret`)

**Verification:**

```bash
grep -rn "admin@\|---pass\|admin123\|secret" docs/ --include="*.md"
# Should show 0 results after cleanup
```

### Task 3.2 — Rotate Admin Credentials

**Actions:**

1. Log into production PocketBase Admin UI
2. Change admin email/password
3. Update ops team's password manager
4. Verify new credentials work

### Task 3.3 — .env Hygiene Audit

**Actions:**

1. Check `.env` files are in `.gitignore`:

```bash
grep ".env" .gitignore
```

2. Check git history for committed secrets:

```bash
git log --all --diff-filter=A -- '*.env'
```

3. If secrets were committed:
   - Use `git filter-branch` or BFG to remove from history
   - Rotate all leaked secrets

### Task 3.4 — Wallet Master Key Security

**Actions:**

1. Verify `WALLET_MASTER_KEY` is:
   - NOT in any codebase files
   - Only in production `.env`
   - Stored in password manager as backup
   - At least 32 characters (AES-256 requirement)
2. Verify AES-256-GCM is used (not XOR fallback)

**Files to Check:**

- `wallet-api/server.js` — Line 15: `const MASTER_KEY = process.env.WALLET_MASTER_KEY;`

---

# Phase 4: Legal & Compliance Pages

## Problem

All legal pages redirect to `/coming-soon`:

- Privacy Policy
- Terms of Service
- Hatching Guide
- Tokenomics

For a platform handling real USDT value, this is a regulatory risk.

## Success Criteria

- [ ] Privacy Policy page published (placeholder with lawyer template)
- [ ] Terms of Service page published (placeholder with lawyer template)
- [ ] Links in landing page footer resolve to real pages (not `/coming-soon`)
- [ ] Legal disclaimer about NFT/gambling/game mechanics displayed

## Implementation

### Task 4.1 — Create Legal Pages Structure

**Files to Create:**

- `apps/web/app/legal/privacy/page.tsx`
- `apps/web/app/legal/terms/page.tsx`
- `apps/web/app/legal/disclaimer/page.tsx`

**Template (each page):**

```tsx
"use client"
import LayoutWithoutNav from "@/components/LayoutWithoutNav"

export default function PrivacyPolicy() {
  return (
    <LayoutWithoutNav>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert">
          <p>Last updated: [Date]</p>

          <h2>1. Information We Collect</h2>
          <p>...</p>

          <h2>2. How We Use Your Information</h2>
          <p>...</p>

          {/* Full legal template with K&L Gates / global standard clauses */}
        </div>
      </div>
    </LayoutWithoutNav>
  )
}
```

### Task 4.2 — Update Footer Links

**File:** `apps/web/app/page.tsx`

Replace:

```tsx
<Link href="/coming-soon" aria-disabled="true">
  Privacy Policy
</Link>
```

With:

```tsx
<Link href="/legal/privacy">Privacy Policy</Link>
```

### Task 4.3 — Add Hatching Guide & Tokenomics Pages

**Files to Create:**

- `apps/web/app/guide/hatching/page.tsx` — Visual guide: Buy Egg → Feed → Hatch → Trade
- `apps/web/app/tokenomics/page.tsx` — Commission structure, fee breakdown, reward tiers

These can use content from `docs/NFT_Marketplace_Functional_Spec.md` (Section 14: Commission Flow Summary).

---

# Phase 5: Complete Remaining Spec Gaps

## Problem

The spec-vs-codebase comparison identified several gaps:

1. No `updateListingPrice` endpoint (sellers must cancel + relist)
2. No `distributeResaleCommission` on-chain (secondary market royalties)
3. No marketplace smart contract (listings are off-chain only)
4. Play feature shows "coming soon" message
5. Landing page is basic (not "Jules design")
6. Breeding "coming soon" message in HatchReveal component

## Success Criteria

- [ ] Sellers can update listing price without canceling
- [ ] Resale royalties distributed to original referral chain (10%)
- [ ] Play feature works or message removed
- [ ] Landing page messaging is clear and production-quality

## Implementation

### Task 5.1 — Add `updateListingPrice` Endpoint

**Backend** (`apps/backend/pb_hooks/24-update-listing-price.pb.js`):

```javascript
routerAdd("PUT", "/api/v2/marketplace/update-price", (e) => {
    const auth = e.requestInfo().auth;
    if (!auth?.id) return e.json(401, ...);

    const body = e.parseBody();
    const listing = $app.findRecordById("marketplace_listings", body.listing_id);

    if (!listing) return e.json(404, ...);
    if (listing.get("seller_id") !== auth.id) return e.json(403, ...);

    listing.set("price", body.new_price);
    $app.save(listing);

    e.json(200, { success: true, data: { new_price: body.new_price } });
});
```

**Frontend** — Add "Update Price" button to listing cards (existing `UpdatePriceDialog.tsx` may already exist).

### Task 5.2 — Add Resale Commission Distribution

**Smart Contract** (`contracts/src/CommissionDistribution.sol`):

- Add `distributeResaleCommission(address[4] calldata originalChain, uint256 saleAmount)`
- 10% of resale → split across G1(20%), G2(10%), G3(10%), G4(10%), CoinStor(4%)
- Remainder (46%) → platform treasury

**Wallet API** (`wallet-api/server.js`):

- Add `/api/wallet/distribute-resale-commission` endpoint
- Read original referral chain from PocketBase
- Call smart contract function

### Task 5.3 — Fix Play Feature & UX Messages

**Files:**

- `apps/web/app/eggs/page.tsx` — Remove "coming soon" for play feature or wire up
- `apps/web/components/HatchReveal.tsx` — Update "Use it for breeding (coming soon)" to actual breeding link
- `apps/web/app/page.tsx` — Review all `/coming-soon` links, either implement or remove

### Task 5.4 — Polish Landing Page

**Files:** `apps/web/app/page.tsx`

**Actions:**

- Ensure hero section clearly communicates the core game loop
- Add "How It Works" steps (Buy Egg → Feed → Hatch → Trade)
- Add call-to-action buttons (Join Now, Browse Marketplace)
- Remove dead links (Artifacts, Sell Items, Documentation if not ready)
- Add production footer with live links (not `/coming-soon`)

---

# Phase 6: Production Deployment & Verification

## Problem

The system needs to be deployed and verified on mainnet with all critical issues resolved.

## Success Criteria

- [ ] Smart contracts deployed to BSC Mainnet
- [ ] Contract addresses updated in all configs
- [ ] Production PocketBase running latest hooks
- [ ] End-to-end user journey works (signup → buy egg → feed → hatch → sell)
- [ ] Commission distribution verified on testnet
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented

## Implementation

### Task 6.1 — Pre-Deployment Checklist

- [ ] All Phase 1-5 tasks complete
- [ ] `forge test` passes 100% (including new regression tests)
- [ ] `bun test` passes 100% (350/350)
- [ ] `bun run build` succeeds (no TypeScript/build errors)
- [ ] Smart contract audit re-verified (internal or professional)
- [ ] Contract addresses chosen (deployer wallet funded with BNB for gas)
- [ ] Production `.env` files configured

### Task 6.2 — Deploy Smart Contracts to Mainnet

```bash
# 1. Set up deployer wallet
export DEPLOYER_PRIVATE_KEY=...  # NEVER hardcode
export BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/

# 2. Deploy
cd contracts
forge script script/Deploy.s.sol \
    --rpc-url $BSC_MAINNET_RPC \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BSCSCAN_API_KEY

# 3. Update contract-addresses.json
# 4. Verify contracts on BSCScan
```

### Task 6.3 — Update Production Configs

**Files to Update:**

- `apps/backend/.env` — New contract addresses
- `wallet-api/.env` — Update RPC_URL, CONTRACT_ADDRESSES
- `contracts/contract-addresses.json` — New addresses
- `nginx/` — Verify rate limiting and CORS

### Task 6.4 — Deploy Backend & Wallet API

```bash
# Per production deploy workflow
scp -i ~/.ssh/poom-server pb_hooks/*.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
ssh -i ~/.ssh/poom-server root@204.168.144.14 "
  cd /root/eggo-world-pb && \
  docker compose build pocketbase && \
  docker compose up -d pocketbase
"
```

### Task 6.5 — E2E Smoke Tests

Run these flows manually on production:

1. **User Registration** → LINE OAuth signup → Wallet auto-created
2. **Buy Egg** → Mint Egg NFT ✓ → 2 Food NFTs received
3. **Feed Egg** → 10 Food NFTs → food_count = 10
4. **Hatch Egg** → VRF → Animal NFT minted with rarity
5. **Marketplace** → List Animal → Buy Animal → Ownership transferred
6. **Commission** → Verify G1-G4 balances updated
7. **Withdraw** → USDT withdrawal to external wallet

### Task 6.6 — Monitoring & Alerting

**Configure:**

- PocketBase admin logging: enable request logging
- Wallet API: Express middleware logging
- Health check endpoints: `/api/health`, `/health`
- Error alerting: set up webhook on 5xx errors
- Volume monitoring: daily NFT sales, commission payouts

### Task 6.7 — Rollback Plan

**If deployment fails:**

1. Keep previous contract addresses in config
2. Point frontend back to old contracts
3. Redeploy previous Docker images:
   ```bash
   docker compose down
   docker compose up -d pocketbase  # previous image
   ```
4. Restore database from backup

---

## Appendix A: File Reference Table

| Phase   | Task                | Files to Create/Modify                                                                |
| ------- | ------------------- | ------------------------------------------------------------------------------------- |
| 1.1     | C-02 Fix            | `contracts/src/TierBadge.sol`                                                         |
| 1.2     | C-03 Fix            | `contracts/src/CommissionDistribution.sol`                                            |
| 1.3     | C-04 Fix            | `contracts/src/CommissionDistribution.sol`                                            |
| 1.4     | C-05 Fix            | `contracts/src/EggNFT.sol`, `contracts/src/AnimalNFT.sol`                             |
| 1.5     | Regression Tests    | `contracts/test/ProductionReadiness.t.sol` (NEW)                                      |
| 2.1     | H-02 VRF Breeding   | `contracts/src/EggNFT.sol`, `pb_hooks/18-breed-animals.pb.js`, `wallet-api/server.js` |
| 2.2     | H-03 setMintPrice   | `contracts/src/EggNFT.sol`                                                            |
| 2.3     | H-04 food count     | `contracts/src/EggNFT.sol`                                                            |
| 2.4     | H-05 duplicate VRF  | `contracts/src/EggNFT.sol`                                                            |
| 2.5     | H-06 transfer guard | `contracts/src/EggNFT.sol`                                                            |
| 2.6     | H-07 owner auth     | `contracts/src/CommissionDistribution.sol`                                            |
| 3.1     | Credentials leak    | `docs/FINAL_STATUS.md` + run grep check                                               |
| 3.2     | Rotate credentials  | PocketBase Admin UI                                                                   |
| 3.3     | .env audit          | `.gitignore`, `git filter-branch` if needed                                           |
| 3.4     | Key management      | `wallet-api/server.js` (verify), docs                                                 |
| 4.1     | Legal pages         | `apps/web/app/legal/privacy/page.tsx` (NEW)                                           |
|         |                     | `apps/web/app/legal/terms/page.tsx` (NEW)                                             |
|         |                     | `apps/web/app/legal/disclaimer/page.tsx` (NEW)                                        |
| 4.2     | Update footer       | `apps/web/app/page.tsx`                                                               |
| 4.3     | Guide pages         | `apps/web/app/guide/hatching/page.tsx` (NEW)                                          |
|         |                     | `apps/web/app/tokenomics/page.tsx` (NEW)                                              |
| 5.1     | updateListingPrice  | `pb_hooks/24-update-listing-price.pb.js` (NEW)                                        |
| 5.2     | Resale commission   | `CommissionDistribution.sol`, `wallet-api/server.js`                                  |
| 5.3     | UX fixes            | `eggs/page.tsx`, `HatchReveal.tsx`, `page.tsx`                                        |
| 5.4     | Landing page        | `apps/web/app/page.tsx`                                                               |
| 6.1-6.7 | Deployment          | All config files, Dockerfiles, deploy scripts                                         |

## Appendix B: Dependencies Map

```
Phase 1 ──┐
           ├── Phase 2 ──┐
Phase 3 ──┤              │
           │              ├── Phase 5 ──┐
Phase 4 ──┘              │              │
                         │              ├── Phase 6 (Deployment)
Phase 5.1 ───────────────┘              │
Phase 5.2 ──────────────────────────────┘
```

- Phase 3 (Security) can run in parallel with Phases 1-2
- Phase 4 (Legal) can run in parallel with Phases 1-3
- Phase 5 depends on Phase 1-2 (contract fixes)
- Phase 6 depends on ALL previous phases

## Appendix C: Risk Assessment

| Risk                                     | Likelihood                | Impact   | Mitigation                            |
| ---------------------------------------- | ------------------------- | -------- | ------------------------------------- |
| Unfixed critical contract bug            | Low (verified in Phase 1) | Critical | Add regression tests, 2nd reviewer    |
| Mainnet deployment error                 | Medium                    | High     | Deploy to testnet first, use multisig |
| LINE OAuth production failure            | Low                       | High     | Test on production staging env        |
| Frontend build breaks with static export | Low                       | Medium   | `bun run build` check in CI           |
| Wallet API downtime                      | Low                       | Medium   | Health check alerts, auto-restart     |
| Smart contract exploits post-launch      | Medium                    | Critical | Professional audit before Phase 6     |

---

**Next Action:** Review and approve phases. Begin Phase 1: Verify Critical Smart Contract Fixes.

**Estimated Timeline:** 13-18 days to production-ready.

---

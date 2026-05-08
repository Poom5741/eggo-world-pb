# Phase 19: Real NFT Mint Flow & Marketplace Integration - Context

**Gathered:** 2026-04-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end NFT minting from smart contract → PocketBase registration → Marketplace listing → Buy Now flow with on-chain transactions and gas sponsorship.

**In scope:**

- wallet-api endpoint for minting Egg NFTs via smart contract
- PocketBase record creation after mint confirmation
- Dedicated "Mint Egg" page in frontend UI
- Full on-chain marketplace integration (listings + purchases)
- Gas sponsorship for user wallet interactions
- Ownership synchronization (on-chain + database)

**Out of scope:**

- Food NFT minting flow (separate phase)
- Animal NFT breeding mechanics
- Multi-chain support (BSC only for now)
- NFT metadata/URI management (handled by contracts)
  </domain>

<decisions>
## Implementation Decisions

### Mint Flow Architecture

- **D-01:** Mint endpoint lives in wallet-api (Express.js), NOT PocketBase hook
  - Add `POST /mint-egg` endpoint to wallet-api/server.js
  - Uses existing Phase 12 infrastructure: ethers.js contract calls, gas estimation (20% buffer), 3x retry with exponential backoff, 12-block confirmation wait
  - Calls `EggNFT.mintEgg(referrerAddress)` with user's decrypted private key from PocketBase admin auth
  - After successful mint + confirmation, calls PocketBase admin API to create egg_nfts record

### Marketplace Integration Level

- **D-02:** Full on-chain marketplace with gas sponsorship
  - Integrate marketplace contract for ALL listings and purchases (not database-only)
  - Platform sponsors gas fees for user wallet interactions (relayer pattern or direct payment)
  - On-chain data is primary source of truth; PocketBase is cache/index for fast queries
  - Replace current database-only buy flow (20-buy-nft.pb.js) with on-chain contract calls

### Mint → Database Synchronization

- **D-03:** wallet-api callback creates PocketBase record
  - After wallet-api receives 12-block confirmation, it calls PocketBase admin API
  - Creates egg_nfts record with: token_id, tx_hash, owner, food_count=2, is_hatched=false, referral_chain
  - Atomic flow from user perspective (single API call triggers both mint + registration)
  - No separate event listener service needed (simpler architecture)

### User Experience Flow

- **D-04:** Dedicated "Mint Egg" page
  - Clear entry point in main navigation (tab or menu item)
  - Page shows: mint price (25 USDT), current balance, mint button, transaction progress
  - After successful mint, redirect to user's eggs page with new egg highlighted
  - Matches Web3 UX patterns (clear CTAs, transaction status, confirmation feedback)

### Gas Sponsorship

- **D-05:** Platform sponsors gas for user interactions
  - Users don't need BNB in their wallets for mint/listing/buy operations
  - wallet-api or dedicated relayer pays gas on behalf of users
  - Track sponsored gas costs for accounting (logging only for MVP)
  - Applies to: mint egg, create listing, buy NFT (all marketplace operations)

### Error Handling

- **D-06:** Transaction failure handling
  - If mint fails (insufficient USDT, contract error), return clear error message to user
  - No PocketBase record created if on-chain transaction fails
  - Frontend shows error state with retry option
  - Wallet API logs all failures with error codes for debugging

### Claude's Discretion

- Gas sponsorship implementation approach (relayer vs direct payment) - planner to decide based on security and cost analysis
- Exact UI/UX design for Mint Egg page - use existing claymorphism design system
- PocketBase admin auth pattern for wallet-api → PocketBase calls - reuse Phase 12 pattern
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Smart Contracts

- `contracts/src/EggNFT.sol` — EggNFT contract with mintEgg(), feedEgg(), hatchEgg() functions
- `contracts/src/FoodNFT.sol` — FoodNFT contract with mintFood(), feedEgg() functions
- `contracts/src/AnimalNFT.sol` — AnimalNFT contract with mintAnimal() function
- `contracts/src/CommissionDistribution.sol` — Commission distribution engine for MLM referrals

### Existing Integration Code

- `wallet-api/server.js` — Wallet API server with Phase 12 contract endpoints (mint-egg will be added here)
- `apps/web/lib/contracts/marketplace.ts` — Frontend marketplace contract wrapper (buyNFT, createListing functions)
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Existing PocketBase hook for egg registration (may need updates)
- `apps/backend/pb_hooks/20-buy-nft.pb.js` — Current database-only buy flow (will be replaced/supplemented)

### Frontend Components

- `apps/web/components/marketplace/CreateListingDialog.tsx` — Existing listing creation UI (two-step approve + list)
- `apps/web/components/ListForSaleModal.tsx` — Alternative listing modal (simpler, database-only)
- `apps/web/app/marketplace/[id]/page.tsx` — Marketplace detail page with buy flow

### Documentation

- `docs/NFT_Marketplace_Functional_Spec.md` — Functional spec for marketplace features
- `.planning/REQUIREMENTS.md` — v0.0.7 requirements (SEC-01 to SEC-04 cover mint/food/feed)
- `.planning/ROADMAP.md` — Phase 19 goal and success criteria

### Contract Addresses

- `contracts/contract-addresses.json` — Deployed contract addresses per network
- `contracts/deployment-addresses.json` — Alternative deployment address registry
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **wallet-api contract integration (Phase 12)** — ethers.js setup, gas estimation, retry logic, 12-block confirmation pattern. Reuse for mint endpoint.
- **PocketBase admin auth** — wallet-api uses admin token to access encrypted private keys. Same pattern for creating egg_nfts records.
- **CreateListingDialog.tsx** — Two-step approve + list flow. Can be adapted for on-chain marketplace integration.
- **marketplace.ts** — Frontend contract wrapper with buyNFT(), createListing(), approveNFTForMarketplace(). Ready to use.
- **EggNFT.sol mintEgg()** — Takes referrer address, charges 25 USDT, mints ERC721 token, initializes with food_count=2.

### Established Patterns

- **Gas estimation with 20% buffer** — All Phase 12 endpoints use `estimateGas() * 1.2` before sending transaction
- **12-block confirmation wait** — Standard for BSC, implemented in wallet-api with polling
- **3x retry with exponential backoff** — Transient error handling pattern
- **PocketBase hook response format** — `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: { message, code } })` for errors
- **Claymorphism design system** — All new UI should use existing clay variants, Material Symbols icons

### Integration Points

- **wallet-api → PocketBase** — Admin API calls for creating records after on-chain operations
- **Frontend → wallet-api** — User triggers mint via frontend, wallet-api handles blockchain interaction
- **Frontend → Marketplace contract** — Direct contract calls for listings/purchases (with gas sponsorship)
- **PocketBase egg_nfts collection** — Database cache of on-chain NFT data for fast queries

### Constraints

- **Static export** — Next.js app is statically exported (Cloudflare Pages), no SSR/edge functions
- **No MetaMask** — Users don't have browser wallets; all signing happens server-side via wallet-api
- **USDT only** — No native BNB for gas; platform must sponsor all gas fees
- **LINE OAuth** — Authentication via LINE, no email/password
  </code_context>

<specifics>
## Specific Ideas

- User should see transaction hash and BSCScan link after successful mint
- Mint page should show referrer field (optional, for MLM commission)
- Gas sponsorship tracking should log: user, operation, gas cost in BNB, USD equivalent
- Consider adding "Mint History" section showing user's past mints with status
- Marketplace listing flow should show commission breakdown (50% seller, 4% platform, 40% commissions) before confirming
  </specifics>

<deferred>
## Deferred Ideas

- Food NFT minting flow — separate phase
- Animal NFT breeding mechanics — separate phase
- Multi-chain support (Polygon, Ethereum) — future milestone
- NFT metadata/URI customization — handled by contracts for now
- Batch minting (multiple eggs at once) — nice to have
- NFT preview before mint (show what you'll get) — future enhancement
  </deferred>

---

_Phase: 19-real-nft-mint-flow-marketplace-integration_  
_Context gathered: 2026-04-21_

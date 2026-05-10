# Phase 59: Marketplace E2E Verification - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the full mint → list → buy → commission distribution marketplace flow end-to-end on 0xl3 testnet with freshly deployed contracts from Phase 58. This is the final functional verification before mainnet deployment.

**Requirements:** VERIFY-01

**Success Criteria:**

1. User can mint an egg NFT on testnet and see it in their wallet
2. User can list the egg for sale on the marketplace with a USDT price
3. A different user can purchase the listed egg — ownership transfers on-chain
4. Seller receives USDT payout with correct commissions deducted (G1 20%, G2-G4 10%, CoinStor 4%)
5. UI reflects all state changes: listing appears, then disappears after purchase, ownership shown correctly

**Not in scope:**

- BSC mainnet deployment (Phase 61)
- Production config migration (Phase 62)
- Withdraw flow validation (Phase 60)
- New UI/feature development
- Contract upgrades or new deployments

</domain>

<decisions>
## Implementation Decisions

### Test Wallets & Users

- **D-01:** Use existing E2E test users (`test_seller`, `test_buyer`) in local PocketBase dev instance — their wallets already exist in `user_wallets` collection
- **D-02:** Set up a referral chain between test users so commission distribution can be verified (requires at least 2-level referral relationship)
- **D-03:** Execute full-stack UI verification — the flow runs through the frontend (localhost:3000), PocketBase hooks, wallet-api, and reaches the real 0xl3 testnet contracts
- **D-04:** Fund test wallets with MockUSDT via manual `cast send` commands from the deployer wallet before starting verification

### Environment Configuration

- **D-05:** Use local full stack for verification:
  - PocketBase: `localhost:8090` (local dev Docker)
  - Wallet-API: `localhost:3001` (local dev)
  - Frontend: `localhost:3000` (bun dev)
  - Network: 0xl3 testnet (Chain ID: 7117)
- **D-06:** `MOCK_BLOCKCHAIN=false` — all transactions execute on the real 0xl3 testnet with real gas costs

### Claude's Discretion

- Commission verification approach (on-chain balance checks via cast, PocketBase commission_records, or seller balance calculation)
- Error scenario coverage (insufficient balance, cancelled listing, re-listing)
- Exact wallet funding amounts for MockUSDT
- Test orchestration approach (sequential script, manual steps, or mixed)
- Edge case testing depth

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Deployed Contracts (Phase 58)

- `contracts/contract-addresses.json` — All 6 contract addresses on 0xl3 testnet (Chain ID: 7117)
- `contracts/deployment-addresses.json` — Human-readable deployment record

### Wallet-API Configuration

- `wallet-api/.env` — Contains contract addresses, RPC URLs (updated Phase 58), relayer private key

### Smart Contracts

- `contracts/src/CommissionDistribution.sol` — Commission split logic, fee splits (G1 20%, G2-G4 10%, CoinStor 4%)
- `contracts/src/EggNFT.sol` — Egg minting with mintEgg(), mintPrice()
- `contracts/src/FoodNFT.sol` — Food NFT (ERC1155)
- `contracts/src/AnimalNFT.sol` — Animal NFT ownership
- `contracts/src/Marketplace.sol` — Secondary sales marketplace escrow

### Existing E2E Test Infrastructure

- `tests/e2e/playwright-marketplace-multi-user.test.ts` — Phase 47 marketplace multi-user journey test (serial test with seller/buyer flows)
- `tests/e2e/nft-mint-marketplace-flow.test.js` — Phase 19 E2E test (mint → PB registration → marketplace listing → buy)
- `tests/fixtures/journey-helpers.ts` — verifyEggOwnership, verifyOwnershipTransfer, verifyCommissionBalance helpers
- `tests/fixtures/blockchain-helpers.ts` — Ethers.js provider, transaction polling, on-chain verification
- `tests/fixtures/e2e-setup.ts` — getE2EContext(), predefined test users
- `playwright.config.ts` — Playwright configuration

### Frontend (UI Verification)

- `apps/web/app/mint/page.tsx` — Mint egg page (uses 0xl3 BSCSCAN_BASE_URL)
- `apps/web/app/marketplace/page.tsx` — Marketplace listing page with tabs (Eggs/Animals)
- `apps/web/app/marketplace/detail/MarketplaceDetailWrapper.tsx` — Detail page wrapper
- `apps/web/app/marketplace/detail/ResaleDetailClient.tsx` — Resale detail client
- `apps/web/hooks/use-marketplace-sync.ts` — Marketplace auto-polling hook

### PocketBase Hooks

- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — POST /api/v2/mint-egg (mint flow)
- `apps/backend/pb_hooks/20-buy-nft.pb.js` — POST /api/v2/marketplace/buy (buy flow)
- `apps/backend/pb_hooks/24-list-egg.pb.js` — Egg listing on marketplace
- `apps/backend/pb_hooks/22-cancel-listing.pb.js` — Cancel marketplace listing
- `apps/backend/pb_hooks/26-list-food.pb.js` — Food NFT listing

### Prior Phase Context

- `.planning/phases/58-testnet-contract-deployment/58-CONTEXT.md` — Phase 58 decisions, deployment script, contract addresses
- `.planning/phases/19-real-nft-mint-flow-marketplace-integration/19-CONTEXT.md` — D-01 through D-06: mint architecture, marketplace integration, gas sponsorship patterns
- `.planning/phases/11-marketplace/11-CONTEXT.md` — D-01 through D-14: design system, transaction flow, component patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **useMarketplaceSync hook** — Auto-polling with exponential backoff, already integrated in marketplace page
- **ListingCard component** — Existing marketplace listing card with rarity badges, price display
- **MarketplaceFilters** — Filter component with type/rarity/sort support
- **MarketplaceDetailClient** — Detail page with buy flow and commission breakdown
- **Blockchain helpers** — getOwnerOf, createEthersProvider, transaction polling utilities
- **Journey helpers** — verifyEggOwnership, verifyOwnershipTransfer, verifyCommissionBalance (triple verification pattern)

### Established Patterns

- **Two-step buy flow**: USDT approval → marketplace purchase (ERC20 approval pattern)
- **Gas sponsorship**: Platform pays gas via relayer wallet (RELAYER_PRIVATE_KEY)
- **Triple verification**: UI visible + on-chain owner matches + PocketBase record exists
- **MOCK_BLOCKCHAIN flag**: When true, skips real blockchain calls; must be false for this phase
- **12-block confirmation wait**: Standard for on-chain transaction finality

### Integration Points

- Frontend → PocketBase hooks → wallet-api → 0xl3 testnet contracts
- PocketBase env vars must have contract addresses set (EGG_NFT_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ADDRESS, etc.)
- Wallet-api env vars already updated in Phase 58
- Local dev .env files need MOCK_BLOCKCHAIN=false

### Key Environment Variables

- `MOCK_BLOCKCHAIN` (PocketBase hook env) — Must be `false` for real testnet
- `WALLET_API_URL` / `WALLET_SRV_URL` (PocketBase hook env) — Points to wallet-api:3001
- `MARKETPLACE_CONTRACT_ADDRESS`, `EGG_NFT_CONTRACT_ADDRESS`, etc. (wallet-api .env) — Already updated
- Relayer wallet funded with gas on 0xl3 (same as deployer wallet)

</code_context>

<specifics>

## Specific Ideas

- Run the test flow as a sequential script: mint → verify → list → verify → buy → verify commissions
- Use cast to mint MockUSDT to test wallets before starting
- Verify commissions by reading CommissionDistribution contract balance changes via cast
- Test with existing test_seller and test_buyer PocketBase accounts
- The deployer wallet (`0x77DD22ebE2986e8C0d1cDb4c853D43d9576F2bB5`) has the private key and can mint MockUSDT and pay gas

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 59 scope.

</deferred>

---

_Phase: 59-marketplace-e2e-verification_
_Context gathered: 2026-05-10_

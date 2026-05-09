# Phase 58: Testnet Contract Deployment - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy all 6 smart contracts to 0xl3 testnet (Chain ID: 7117) using Foundry forge scripts. This is a fresh deployment — the existing `deployment-addresses.json` contains stale addresses from 2026-04-03 that should be replaced.

**Requirements:** DEPLOY-01

**Contracts to deploy:**

- MockUSDT (BEP-20 mock for testnet)
- CommissionDistribution (commission split + treasury)
- EggNFT (egg minting + VRF hatching)
- FoodNFT (food purchase + feeding)
- AnimalNFT (animal ownership)
- Marketplace (secondary sales escrow)

**Not in scope:**

- E2E flow verification (Phase 59, 60)
- BSC mainnet deployment (Phase 61)
- Production config migration (Phase 62)
- VRF subscription setup on real Chainlink VRF (not available on 0xl3)

</domain>

<decisions>
## Implementation Decisions

### Mock USDT Strategy

- **D-01:** Deploy fresh MockUSDT via `DEPLOY_MOCK_USDT=true` — self-contained, deployer gets initial supply, no external dependency on previous testnet USDT contract

### Deployment Script

- **D-02:** Use `contracts/script/Deploy.s.sol` — already supports 0xl3 testnet via the `else` branch (deploys `VRFCoordinatorV2_5Mock` since 0xl3 has no real VRF coordinator)
- **D-03:** RPC URL: `https://rpc.0xl3.com` (confirmed stable, per prior experience memory)
- **D-04:** Environment variables required: `DEPLOYER_PRIVATE_KEY`, `COINSTOR_RESERVE_ADDRESS`, `DEPLOY_MOCK_USDT=true`, `TREASURY_ADDRESS`

### Contract Verification

- **D-05:** 0xl3 explorer at `https://exp.0xl3.com` — verify contracts manually via `forge verify-contract` after deployment if explorer supports it, or via explorer UI

### Deployment Addresses Recording

- **D-06:** Parse JSON output between `DEPLOYMENT_ADDRESSES_START` / `DEPLOYMENT_ADDRESSES_END` markers from forge script stdout and write to `contracts/deployment-addresses.json`
- **D-07:** Also update `wallet-api/.env` contract addresses if applicable

### Claude's Discretion

- Gas settings (default Foundry values should suffice for 0xl3)
- Exact command format for forge verify-contract on 0xl3 explorer
- Post-deployment sanity check approach (reading back deployed contract state)
- CommissionDistribution initialization parameters (G1/G2-G4/CoinStor fee splits)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Deployment Script

- `contracts/script/Deploy.s.sol` — Unified deployment script for all NFT contracts
- `contracts/deployment-addresses.json` — Current (stale) deployment addresses to be replaced

### Environment Configuration

- `.env.example` — Reference for required environment variables
- `wallet-api/.env` — Wallet API env file (may need contract address updates after deploy)

### Prior Context

- `.planning/phases/12-wallet-api-contract-integration/12-CONTEXT.md` — D-14 through D-17 document 0xl3 deployment pattern
- `.planning/phases/37-smart-contract-updates/37-CONTEXT.md` — D-19 through D-23 cover deployment strategy and VRF considerations

### Smart Contracts

- `contracts/src/CommissionDistribution.sol` — Commission split logic, constructor takes coinStorReserve, USDT, treasury
- `contracts/src/EggNFT.sol` — Egg minting and VRF hatching, requires VRF coordinator address
- `contracts/src/FoodNFT.sol` — Food NFT with commission integration
- `contracts/src/AnimalNFT.sol` — Animal NFT ownership
- `contracts/src/Marketplace.sol` — Secondary sales marketplace with escrow
- `contracts/test/MockUSDT.sol` — Simple ERC20 mock for testnet

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Deployment Assets

- `contracts/script/Deploy.s.sol` — Already handles all 6 contracts, outputs JSON-formatted addresses
- `contracts/foundry.toml` — Foundry config, verify if chain/explorer config for 0xl3 is needed

### Established Deployment Pattern

- Previously deployed to 0xl3 testnet on 2026-04-03 (stale `deployment-addresses.json` exists)
- RPC `https://rpc.0xl3.com` is known working (from prior experience memory)
- Makefile has `contracts-deploy-testnet` target but it points to `bsc_testnet` RPC — may need updating to support 0xl3

### Integration Points

- After deployment: `wallet-api/.env` needs new contract addresses
- After deployment: `contracts/deployment-addresses.json` needs updating
- After deployment: PocketBase hooks may need updated addresses if they reference contracts directly

</code_context>

<specifics>

## Specific Ideas

- Use the JSON output between `DEPLOYMENT_ADDRESSES_START`/`END` markers in the script — parse this to auto-generate `deployment-addresses.json`
- Script deploys Mock VRF for 0xl3 since it falls into the `else` branch (not chain 97 or 56). VRF-dependent flows (egg hatching) will use local mock on testnet, which is sufficient for flow verification

</specifics>

<deferred>
None — discussion stayed within phase scope.
</deferred>

---

_Phase: 58-testnet-contract-deployment_
_Context gathered: 2026-05-10_

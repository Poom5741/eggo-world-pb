# Phase 61: Mainnet Contract Deployment - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy all 6 smart contracts to BSC mainnet (Chain ID: 56) using the existing unified Deploy.s.sol script, then auto-verify on BscScan. This is DEPLOY-02 — a deployment phase, not a development phase.

**Depends on:** Phase 60 (Withdraw Flow Validation) — confirms testnet flows work before mainnet deployment.

</domain>

<decisions>
## Implementation Decisions

### Pre-Deployment Safety

- **D-01:** Quick contract review required before deployment — run Foundry analysis tools (slither/aderyn if available) and manual review of changed contracts since last audit. Review summary must be included in deployment plan.
- **D-02:** Deployer wallet: `0x77DD22ebE2986e8C0d1cDb4c853D43d9576F2bB5` (same as Phase 58 testnet deployer). Must be funded with 5+ BNB on BSC mainnet for gas.
- **D-03:** Phase 59 (Marketplace E2E) and Phase 60 (Withdraw Validation) must both be complete before proceeding.

### Deployment Config

- **D-04:** Use Deploy.s.sol unified script with environment variables:
  - `DEPLOY_MOCK_USDT=false`
  - `USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955` (real BSC USDT)
  - `COINSTOR_RESERVE_ADDRESS` — TBD (need CoinStor reserve address)
  - `DEPLOYER_PRIVATE_KEY` — from wallet-api or env
  - `DEPLOY_MOCK_VRF=false` (use real BSC VRF Coordinator: 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9)

### Contract Ownership

- **D-05:** Deployer EOA owns all contracts directly. No multisig for initial deployment. Ownership transfer to multisig deferred to Phase 62.

### Verification

- **D-06:** Auto-verify via `forge verify-contract` on BscScan using BscScan API key. All 6 contracts verified in deployment order.

### Contracts to Deploy (6 total)

1. CommissionDistribution (with fee split config)
2. MockUSDT — SKIP (use real USDT)
3. EggNFT
4. FoodNFT
5. AnimalNFT
6. Marketplace

### the agent's Discretion

- Gas price strategy (BSC standard 5 gwei default, can wait for low gas)
- BscScan API key sourcing (from env or wallet-api/.env)
- CoinStor reserve address resolution
- Foundry analysis tool selection and report format

</decisions>

<specifics>
## Specific Ideas

- Deploy.s.sol already supports all networks — no script changes needed for mainnet
- VRF Coordinator address pre-configured for BSC mainnet in the script
- Phase 58 deployer key already available in wallet-api/.env

</specifics>

<canonical_refs>

## Canonical References

### Deployment Scripts

- `contracts/script/Deploy.s.sol` — Unified deployment script supporting BSC mainnet (Chain ID: 56). Uses env vars for all config.
- `contracts/script/DeployTestContracts.s.sol` — Testnet deployment reference (used in Phase 58)

### Contract Sources

- `contracts/src/CommissionDistribution.sol` — Commission splits: G1 20%, G2-G4 10% each, CoinStor 4%, Treasury 46%
- `contracts/src/EggNFT.sol` — ERC-721 with minting, feeding, hatching, rarity
- `contracts/src/FoodNFT.sol` — ERC-1155 consumable food items
- `contracts/src/AnimalNFT.sol` — ERC-721 animals with species/rarity
- `contracts/src/Marketplace.sol` — Escrow marketplace with commission distribution

### Phase Requirements

- `.planning/ROADMAP.md` § Phase 61 — 5 success criteria for mainnet deployment

### Prior Phase Results

- `.planning/phases/58-testnet-contract-deployment/58-01-SUMMARY.md` — Phase 58 deployment addresses and procedure
- `.planning/phases/59-marketplace-e2e-verification/59-01-SUMMARY.md` — E2E verification results

### BSC Mainnet Reference

- USDT: `0x55d398326f99059fF775485246999027B3197955`
- VRF Coordinator: `0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9`
- Chain ID: 56
- Explorer: https://bscscan.com

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Deploy.s.sol**: Already handles all 6 contracts, BSC mainnet VRF, real USDT, env var configuration
- **Phase 58 deployment record**: `contracts/deployment-addresses.json` — testnet addresses for cross-reference
- **wallet-api/.env**: Contains deployer private key and other env vars

### Established Patterns

- **forge script pattern**: `forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $KEY --broadcast -vv`
- **forge verify pattern**: `forge verify-contract <address> <Contract> --verifier-url ... --etherscan-api-key ...`
- **env var config**: DEPLOY_MOCK_USDT, USDT_ADDRESS, DEPLOYER_PRIVATE_KEY, COINSTOR_RESERVE_ADDRESS

### Integration Points

- **wallet-api** reads contract addresses from `contract-addresses.json` — must update after deployment
- **PocketBase hooks** reference contract addresses — must update in Phase 62
- **Frontend** reads from config — must update in Phase 62

</code_context>

<deferred>
## Deferred Ideas

- Multisig ownership transfer — Phase 62 (Production Config Migration)
- Timelock controller — future milestone

</deferred>

---

_Phase: 61-mainnet-contract-deployment_
_Context gathered: 2026-05-11_

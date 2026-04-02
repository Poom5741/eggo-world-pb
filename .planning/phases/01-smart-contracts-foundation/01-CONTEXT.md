# Phase 1: Smart Contracts Foundation - Context

**Gathered:** 2026-04-02  
**Status:** Implementation complete — ready for deployment

<domain>
## Phase Boundary

Deploy working smart contracts on BSC testnet for NFT minting (Egg, Food, Animal), 4-level MLM commission distribution, and marketplace escrow.

**Scope anchor:** All core smart contracts are implemented and tested. Phase 1 is considered **implemented** pending deployment to BSC testnet.

</domain>

<decisions>
## Implementation Decisions

### Contract Status

- **D-01:** Phase 1 marked as "implementation complete" — all smart contracts written and tested
- **D-02:** 48 Forge tests passing including integration tests with Anvil
- **D-03:** Deployment script exists (`DeployEggNFT.s.sol`) — ready to run with environment configuration

### Architecture Decisions (Already Made)

- **D-04:** ERC-721 for EggNFT and AnimalNFT, ERC-1155 for FoodNFT
- **D-05:** CommissionDistribution contract handles 4-level MLM (20%/10%/10%/10%) + 4% CoinStor
- **D-06:** USDT (BEP-20) integration — contract supports both mock USDT (testing) and real USDT (production)
- **D-07:** Rarity system: Common 60%, Rare 25%, Epic 12%, Legendary 3%
- **D-08:** Breeding mechanics with 48-hour cooldown, generation tracking, rarity inheritance
- **D-09:** Egg rarity upgrade path — feed up to 10 extra food items (2% rarity bonus per food)
- **D-10:** Food type distribution affects animal species determination

### OpenCode's Discretion

- Deployment timing (testnet vs mainnet)
- Gas optimization passes (contracts functional but can be optimized)
- Additional test coverage beyond current 48 tests
- BscScan verification script automation

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Smart Contract Architecture

- `docs/NFT_Marketplace_Functional_Spec.md` — Complete functional requirements for all contracts, commission flows, NFT properties
- `docs/00-architecture.md` — System architecture, component relationships, data flows
- `docs/02-decisions.md` — ADR-004 (BSC network), ADR-005 (Foundry framework)

### Contract Implementations

- `contracts/src/EggNFT.sol` — Egg minting, feeding, hatching, breeding, rarity upgrade (519 lines)
- `contracts/src/FoodNFT.sol` — Food minting, feeding, burning (215 lines)
- `contracts/src/AnimalNFT.sol` — Animal minting, rarity system, generation tracking (212 lines)
- `contracts/src/CommissionDistribution.sol` — 4-level MLM commission engine (102 lines)

### Test Coverage

- `contracts/test/EggNFT.t.sol` — 14 tests for EggNFT
- `contracts/test/FoodNFT.t.sol` — 10 tests for FoodNFT
- `contracts/test/AnimalNFT.t.sol` — 20 tests for AnimalNFT
- `contracts/test/EggFeedingAnvilIntegration.t.sol` — 10 integration tests
- `contracts/test/AnimalBreeding.t.sol` — 18 breeding tests
- `contracts/test/EggUpgrading.t.sol` — 10 rarity upgrade tests
- `contracts/test/AnvilIntegration.t.sol` — 4 end-to-end tests

### Deployment

- `contracts/script/DeployEggNFT.s.sol` — Deployment script for all contracts
- `contracts/foundry.toml` — Foundry configuration with BSC testnet/mainnet RPC endpoints

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **DeployEggNFT.s.sol**: Complete deployment script — deploys all 4 contracts, wires them together, outputs addresses
- **MockUSDT.sol**: Test USDT token for local/Anvil testing
- **CommissionDistribution.sol**: Standalone commission engine — can be used by any contract
- **Test utilities**: Anvil integration tests provide deployment verification patterns

### Established Patterns

- **Contract interconnection pattern**: Each contract references others via address setters (`setEggNFTContract`, etc.)
- **USDT integration pattern**: `IERC20.safeTransferFrom()` for all payments
- **Commission distribution pattern**: All mint functions call `CommissionDistribution.distributeCommission()`
- **Event emission pattern**: Comprehensive events for all state changes (frontend indexing)
- **Access control pattern**: OpenZeppelin `Ownable` for admin functions, `ReentrancyGuard` for state-changing functions

### Integration Points

- **Frontend → Contracts**: Ethers v6 will interact with deployed contract addresses
- **Backend → Contracts**: PocketBase hooks will listen to contract events (EggMinted, EggHatched, etc.)
- **Wallet API → Contracts**: Wallet API signs transactions that call contract functions
- **USDT contract**: Requires approval mechanism before contracts can transfer USDT

### Test Coverage Summary

```
Total: 48 tests passing
- Unit tests: 30 (contract logic, access control, events)
- Integration tests: 18 (Anvil-based end-to-end flows)
- Fuzz tests: 256 runs on Counter test (template for additional fuzzing)
```

### Deployment Readiness

**Ready:**

- ✅ All contracts compile (Solidity 0.8.24)
- ✅ All tests passing (forge test)
- ✅ Deployment script complete
- ✅ Foundry config has BSC endpoints

**Needs configuration:**

- ⏳ `PRIVATE_KEY` environment variable (deployer wallet)
- ⏳ `COINSTOR_RESERVE_ADDRESS` environment variable (4% fee recipient)
- ⏳ `USDT_ADDRESS` for production (or `DEPLOY_MOCK_USDT=true` for testing)
- ⏳ `BSCSCAN_API_KEY` for contract verification

</code_context>

<specifics>
## Specific Ideas

- **Deployment strategy**: User indicated contracts are "already implemented" — focus on deployment execution, not development
- **Testnet first**: Deploy to BSC testnet (`https://data-seed-prebsc-1-s1.binance.org:8545`) before mainnet
- **Verification**: Contracts should be verified on BscScan for transparency
- **Address documentation**: Deployed contract addresses must be documented for frontend/backend integration

### Deployment Command (reference)

```bash
cd contracts
PRIVATE_KEY=0x... COINSTOR_RESERVE_ADDRESS=0x... USDT_ADDRESS=0x... \
  forge script script/DeployEggNFT.s.sol:DeployEggNFT \
  --rpc-url bsc_testnet \
  --broadcast \
  --verify
```

</specifics>

<deferred>
## Deferred Ideas

**Out of scope for Phase 1 (implementation complete):**

- Contract optimization (gas reduction) — Phase 5 optimization
- Additional test coverage — Phase 4 testing
- Mainnet deployment — Phase 4 deployment
- Contract upgrades/proxy pattern — Post-MVP
- Multi-chain deployment — Phase 7
- Secondary market royalties (10% to referral chain) — REQUIREMENTS.md marks as post-MVP

### Reviewed Todos (not folded)

- None — Phase 1 scope fully covered by existing implementation

</deferred>

---

_Phase: 01-smart-contracts-foundation_  
_Context gathered: 2026-04-02_  
_Next: Phase 2 - Backend Integration (PocketBase collections, hooks, wallet API)_

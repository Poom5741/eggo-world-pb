# Phase 37: Smart Contract Updates - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements the smart contract changes required by Phases 34-36:

1. **EggNFT.sol Updates:**
   - Add VRFConsumerBaseV2Plus inheritance for Chainlink VRF v2.5
   - Implement `burnNFT(uint256 nftId, NFTType nftType)` function
   - Support two-phase hatching pattern (request VRF → fulfill callback → claim hatch)

2. **Admin Config Functions (embedded in EggNFT.sol):**
   - `setPlatformFee(uint256 feePercent)` — Dynamic platform fee
   - `setBreedCooldown(uint256 cooldownSeconds)` — Dynamic breeding cooldown
   - `updateRarityWeights(RarityWeights calldata weights)` — Adjustable rarity
   - `addNewSpecies(uint256 speciesId, string name, uint256 weight)` — Expand catalog
   - `setKYCRequired(bool required)` — KYC toggle

3. **Chainlink VRF Setup:**
   - Create VRF subscription on BSC
   - Fund subscription with LINK tokens (or native BNB payment via v2.5)
   - Configure subscriptionId and keyHash in contract

4. **Deployment:**
   - Deploy to BSC Testnet (chainId 97) first
   - Then deploy to BSC Mainnet (chainId 56)

</domain>

<decisions>
## Implementation Decisions

### VRF Version & Integration
- **D-01:** Use Chainlink VRF v2.5 (VRFConsumerBaseV2Plus) — native BNB payment, no LINK bridge needed
- **D-02:** VRF v2 is deprecated — do not use for new development
- **D-03:** Use `VRFCoordinatorV2_5Mock` for local Foundry testing
- **D-04:** BSC VRF coordinator addresses: Mainnet `0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9`, Testnet `0xDA3b641D438362C440Ac5458c57e00a712b66700`

### VRF Callback Pattern (Two-Phase Hatching)
- **D-05:** Two-phase pattern: `hatchEgg()` requests VRF, `fulfillRandomWords()` stores randomness only, `claimHatch(tokenId)` mints AnimalNFT
- **D-06:** `fulfillRandomWords` must NOT revert — follows Chainlink security guidance
- **D-07:** Use `pendingHatches` mapping to store pending VRF requests between request and claim
- **D-08:** User pays gas for mint tx in `claimHatch` — better UX control and predictable callback gas

### Burn Function Design
- **D-09:** `burnNFT` stays in EggNFT.sol using OpenZeppelin `_burn()` for true destruction (supply decreases)
- **D-10:** Only owner or admin can burn
- **D-11:** Hatched eggs cannot be burned (they've produced animals)
- **D-12:** Animals in breeding cooldown cannot be burned
- **D-13:** Existing `is_hatched` + `animal_token_id` fields already provide provenance trail

### Admin Config Architecture
- **D-14:** Admin config functions embedded in EggNFT.sol (no separate AdminConfig contract)
- **D-15:** All admin setters use `onlyOwner` modifier — consistent with existing pattern
- **D-16:** 5 new setter functions: `setPlatformFee`, `setBreedCooldown`, `updateRarityWeights`, `addNewSpecies`, `setKYCRequired`
- **D-17:** Events emitted for all configuration changes
- **D-18:** Can refactor to OpenZeppelin AccessControl later if multi-role governance needed

### Deployment Strategy
- **D-19:** Deploy to BSC Testnet (chainId 97) first, then BSC Mainnet (chainId 56)
- **D-20:** NOT 0xL3 testnet — no VRF coordinator available
- **D-21:** Use Foundry scripts for deployment
- **D-22:** Update contract addresses in wallet-api `.env` after deployment
- **D-23:** VRF subscription setup via vrf.chain.link after testnet deployment

### Validation Rules
- **D-24:** Platform fee: 0-2000 basis points (0-20%)
- **D-25:** Breed cooldown: 3600-604800 seconds (1 hour - 7 days)
- **D-26:** Rarity weights: must sum to 10000 (100%)
- **D-27:** Species: unique ID, non-empty name, positive weight

### the agent's Discretion
- Exact gas optimization for VRF callback gas limit
- Foundry test coverage depth
- Deployment script structure (single vs multi-step)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Smart Contracts
- `contracts/src/EggNFT.sol` — Main contract to update (VRF inheritance, burn function, admin setters)
- `contracts/src/AnimalNFT.sol` — Referenced by hatch/claim logic
- `contracts/src/FoodNFT.sol` — Referenced by burn pattern (authorizedFoodNFTContracts)
- `contracts/src/CommissionDistribution.sol` — Commission distribution during mint/breed

### VRF Integration
- `@chainlink/contracts` v1.3.0+ — Required dependency for VRFConsumerBaseV2Plus
- Chainlink VRF v2.5 docs — https://docs.chain.link/vrf/v2-5/overview

### Prior Phase Context
- `.planning/phases/34-vrf-integration/34-CONTEXT.md` — VRF backend hook decisions
- `.planning/phases/35-admin-game-config/35-CONTEXT.md` — Admin config endpoint decisions
- `.planning/phases/36-nft-burn-kyc/36-CONTEXT.md` — Burn/KYC/spendUSDT decisions

### Project Conventions
- `AGENTS.md` — PocketBase hook patterns, deployment guide, anti-patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EggNFT.sol` — Existing contract with ERC721, Ownable, Pausable, ReentrancyGuard inheritance
- `EggProperties` struct — Already tracks `is_hatched`, `animal_token_id`, `rarity_seed`
- `_calculateRarity()` — Existing rarity calculation (needs VRF seed instead of block.prevrandao)
- `_determineSpecies()` — Species determination logic (reuse with VRF seed)
- OpenZeppelin contracts already installed (`@openzeppelin/contracts`)

### Established Patterns
- Foundry test framework in `contracts/test/`
- Custom errors and events pattern
- `onlyOwner` access control for admin functions
- `nonReentrant` for state-changing functions
- `whenNotPaused` for pauseable functions
- 12-block confirmation wait in wallet-api

### Integration Points
- EggNFT needs VRFConsumerBaseV2Plus import from `@chainlink/contracts`
- `hatchEgg()` currently uses `block.prevrandao` — must be replaced with VRF seed
- `fulfillRandomWords()` callback needs to store randomness in `pendingHatches` mapping
- `claimHatch()` new function to perform actual AnimalNFT minting
- `burnNFT()` needs NFTType enum (Egg/Food/Animal) for multi-type burning
- Admin config state variables need to be added to EggNFT storage
- Contract addresses need updating in `wallet-api/.env` after deployment

</code_context>

<specifics>
## Specific Ideas

- Deploy to BSC testnet (Chain ID: 97) first
- Use Foundry scripts for deployment
- Update contract addresses in wallet-api/.env
- VRF configuration (subscriptionId, keyHash) should be admin-updatable
- Frontend should show "Hatching..." state with 1-3 minute estimate (from Phase 34 context)
- Auto-stop polling after 5 minutes timeout (from Phase 34 context)

</specifics>

<deferred>
## Deferred Ideas

- Multi-sig ownership for admin functions
- Timelock for config changes
- VRF cost optimization (batch requests)
- Separate AdminConfig contract (deferred — current approach is simpler for v0.2.0)
- BSC native VRF as alternative to Chainlink

</deferred>

---

*Phase: 37-smart-contract-updates*
*Context gathered: 2026-04-25*

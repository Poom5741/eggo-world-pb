# Egg Hatching Mechanism Implementation Plan

**Generated:** 2026-03-30
**Status:** Pending Review

## Overview
Implement complete egg hatching mechanism that generates Animal NFTs based on rarity seed and food type history, with proper rarity distribution and species determination.

## Phase 1: Create Animal NFT Contract
**File:** `contracts/src/AnimalNFT.sol`

### Tasks:
1. **Create ERC721 Animal NFT contract** with:
   - Metadata: "Animal NFT", "ANIMAL"
   - Struct `AnimalProperties`: animal_id, owner, species, rarity, generation, parent_egg_id, food_type_distribution
   - Mapping for animal properties and food type distribution tracking
   - Auto-incrementing token ID counter

2. **Define rarity enum**:
   ```solidity
   enum Rarity { Common, Rare, Epic, Legendary }
   ```

3. **Define species enum** (example structure):
   ```solidity
   enum Species { 
     // Common species
     Chicken, Duck, Quail,
     // Rare species  
     Peacock, Swan, Turkey,
     // Epic species
     Phoenix, GoldenChicken, SilverDuck,
     // Legendary species
     Dragon, Unicorn, Gryphon
   }
   ```

4. **Implement mintAnimal function** (only callable by EggNFT contract):
   - Parameters: recipient, parent_egg_id, rarity, species, food_distribution
   - Mint NFT to recipient
   - Store animal properties
   - Emit `AnimalMinted(animal_id, recipient, rarity, species, generation)`

5. **Add authorization**: Only EggNFT contract can mint animals

6. **Add view functions**:
   - `getAnimalProperties(tokenId)` - returns all animal properties
   - `getRarity(tokenId)` - returns rarity
   - `getSpecies(tokenId)` - returns species
   - `getGeneration(tokenId)` - returns generation

## Phase 2: Update EggNFT Contract
**File:** `contracts/src/EggNFT.sol`

### Tasks:
1. **Add AnimalNFT reference**:
   ```solidity
   address public immutable animalNFT;
   mapping(uint256 => uint256) private _eggToAnimalTokenId;
   ```

2. **Update constructor** to accept AnimalNFT address (or set later via setter)

3. **Update EggProperties struct**:
   - Keep existing fields
   - Add `uint256 animal_token_id` (0 if not hatched)

4. **Update `hatchEgg` function** to:
   - Verify: `ownerOf(tokenId) == msg.sender`
   - Verify: `!props.is_hatched`
   - Verify: `props.food_count >= MAX_FOOD_COUNT` (10)
   - Generate final rarity seed using block.prevrandao + existing seed
   - Calculate rarity from distribution: Common (60%), Rare (25%), Epic (12%), Legendary (3%)
   - Determine species based on: rarity_seed + food_type_history distribution
   - Call AnimalNFT.mintAnimal() with calculated parameters
   - Set `props.is_hatched = true`
   - Store animal token ID
   - Emit enhanced event: `EggHatched(egg_id, animal_token_id, rarity, species)`

5. **Add rarity calculation function**:
   ```solidity
   function _calculateRarity(uint256 raritySeed) internal pure returns (Rarity) {
       uint256 roll = raritySeed % 100;
       if (roll < 60) return Rarity.Common;      // 0-59
       else if (roll < 85) return Rarity.Rare;   // 60-84
       else if (roll < 97) return Rarity.Epic;   // 85-96
       else return Rarity.Legendary;             // 97-99
   }
   ```

6. **Add species determination function**:
   ```solidity
   function _determineSpecies(
       uint256 raritySeed,
       FoodType[] memory foodHistory,
       Rarity rarity
   ) internal pure returns (Species)
   ```
   - Use combination of rarity_seed hash + food type distribution
   - Map to species pool based on rarity tier
   - Example logic:
     - Common: dominant food type determines species (Grain→Chicken, Fish→Duck, etc.)
     - Rare: weighted combination of food types
     - Epic: seed-based selection from epic pool
     - Legendary: seed-based selection from legendary pool

7. **Add view function**:
   - `getAnimalId(uint256 egg_token_id)` - returns associated animal token ID (0 if not hatched)

8. **Update event**:
   ```solidity
   event EggHatched(
       uint256 indexed egg_id,
       uint256 indexed animal_id,
       Rarity rarity,
       Species species
   );
   ```

## Phase 3: Update Deployment Scripts
**File:** `contracts/script/DeployEggNFT.s.sol`

### Tasks:
1. Add AnimalNFT deployment
2. Deploy order: CommissionDistribution → AnimalNFT → EggNFT → FoodNFT
3. Set up cross-contract authorizations:
   - EggNFT.setAnimalNFTContract(address)
   - AnimalNFT.setEggNFTContract(address)
   - EggNFT.setFoodNFTContract(address)
   - FoodNFT.setEggNFTContract(address)

## Phase 4: Comprehensive Unit Tests
**File:** `contracts/test/AnimalNFT.t.sol` (new)
**File:** `contracts/test/EggHatching.t.sol` (new)

### AnimalNFT Tests:
1. **Deployment tests**: Verify name, symbol, owner
2. **Minting tests**:
   - Only EggNFT can mint
   - Minting records properties correctly
   - Event emission
3. **View function tests**: All getters work correctly
4. **Reentrancy tests**: Cannot mint from unauthorized address

### Egg Hatching Tests:
1. **Basic hatching tests**:
   - Happy path: hatch after 10 food items
   - Animal NFT minted to egg owner
   - Event emitted with correct data
   - Egg marked as hatched
   
2. **Rarity distribution tests** (statistical):
   - Test large sample (1000+ eggs) to verify distribution
   - Common: ~60%
   - Rare: ~25%
   - Epic: ~12%
   - Legendary: ~3%
   
3. **Species determination tests**:
   - Species varies based on food type history
   - Different food combinations → different species
   - Same rarity can have different species
   
4. **Verification tests**:
   - Revert if food_count < 10
   - Revert if already hatched
   - Revert if not owner
   
5. **Edge cases**:
   - Exactly 10 food items
   - More than 10 food items
   - Different food type distributions
   - Egg ownership transfer before hatching
   
6. **Integration tests**:
   - Full flow: mint egg → feed 10 times → hatch → verify animal NFT
   - Food type history affects species
   - Animal NFT has correct metadata

## Phase 5: Update Existing Tests
**File:** `contracts/test/EggNFT.t.sol`
**File:** `contracts/test/EggFeeding.t.sol`

### Tasks:
1. Update existing hatch tests to verify Animal NFT creation
2. Add AnimalNFT contract to test setup
3. Verify animal properties after hatching
4. Test food type history impact on species

## Phase 6: Documentation
**File:** `contracts/README.md`

### Tasks:
1. Document Animal NFT contract
2. Document hatching mechanism
3. Document rarity distribution
4. Document species determination logic
5. Add usage examples

## Technical Considerations

### Randomness Strategy
Since we're using block.prevrandao (available post-Merge), the approach will be:
1. **Initial seed**: Generated at egg mint (already implemented)
2. **Final seed**: Combine initial seed + block.prevrandao at hatch time
3. **Formula**: `keccak256(abi.encodePacked(initialSeed, block.prevrandao, block.timestamp))`

**Note:** For production with real value, consider Chainlink VRF. Current approach is suitable for MVP/testnet.

### Species Determination Algorithm
```solidity
// Pseudo-code
uint256 speciesSeed = uint256(keccak256(abi.encodePacked(
    raritySeed,
    foodTypeHash,  // hash of food type distribution
    block.timestamp
)));

// Count food types
uint256 grainCount, fishCount, insectsCount, herbCount;
for (FoodType ft : foodHistory) {
    if (ft == FoodType.Grain) grainCount++;
    else if (ft == FoodType.Fish) fishCount++;
    // ...
}

// For Common/Rare: dominant food type influences species
// For Epic/Legendary: seed-based selection from respective pools
```

### Gas Optimization
- Store food type distribution as packed struct
- Use pure/view functions where possible
- Batch operations in hatching logic
- Consider array size limits for food history

## Testing Strategy

### Test Coverage Requirements:
- ✅ All rarity tiers (Common, Rare, Epic, Legendary)
- ✅ Species variations per rarity tier
- ✅ Food type influence on species
- ✅ Boundary conditions (exactly 10 food, 9 food, 11 food)
- ✅ Revert conditions (not owner, already hatched, insufficient food)
- ✅ Event emissions
- ✅ Integration with FoodNFT and EggNFT
- ✅ Ownership transfer scenarios

### Statistical Validation:
Run test with 1000+ iterations to verify rarity distribution matches:
- Common: 60% ± 3%
- Rare: 25% ± 3%
- Epic: 12% ± 2%
- Legendary: 3% ± 1%

## Acceptance Criteria Checklist

- [ ] `hatchEgg(egg_id)` function implemented
- [ ] Verification: `egg.food_count >= 10`
- [ ] Verification: `egg.is_hatched == false`
- [ ] Rarity seed generated using block hash (prevrandao)
- [ ] Rarity determined from distribution table (60/25/12/3)
- [ ] Species determined based on food types consumed
- [ ] Animal NFT minted to egg owner with: parent_egg_id, generation=0, rarity, species
- [ ] `egg.is_hatched` set to true
- [ ] Event emitted: `EggHatched(egg_id, animal_id, rarity, species)`
- [ ] Unit tests: All rarity tiers covered
- [ ] Unit tests: Species variations covered
- [ ] Integration tests: Full hatching flow
- [ ] Deployment script updated
- [ ] Documentation updated

## Dependencies & Order

1. ✅ AnimalNFT.sol (no dependencies)
2. ✅ Update EggNFT.sol (depends on AnimalNFT)
3. ✅ Update DeployEggNFT.s.sol (depends on both)
4. ✅ Test AnimalNFT.t.sol
5. ✅ Test EggHatching.t.sol
6. ✅ Update existing tests

## Estimated Complexity
- **AnimalNFT.sol**: Medium (standard ERC721 with custom metadata)
- **EggNFT.sol updates**: Medium-High (hatching logic, species determination)
- **Tests**: High (comprehensive coverage, statistical validation)
- **Total estimated time**: 4-6 hours implementation + 2-3 hours testing

## Future Enhancements (Out of Scope)
- Chainlink VRF integration for production randomness
- Breeding mechanism (Animal + Animal → new Egg)
- Dynamic metadata based on species/rarity
- NFT burning/staking mechanics
- On-chain metadata rendering

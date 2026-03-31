# Animal NFT Generation with Rarity Tiers and Breeding Mechanics

## Implementation Plan

### Overview
This plan implements Animal NFT generation with rarity tiers (Common, Rare, Epic, Legendary), generation tracking (Gen 0 from eggs, Gen 1+ from breeding), and a rarity upgrade mechanic using extra food items.

---

## Phase 1: Data Model & Contract Structure

### 1.1 Update AnimalNFT.sol Struct
**File**: `contracts/src/AnimalNFT.sol`

**Changes**:
- Add `parent1_animal_id` and `parent2_animal_id` to `AnimalProperties` struct for breeding lineage
- Add `rarity_upgrade_count` to track number of rarity upgrade attempts
- Keep existing fields: `animal_id`, `owner`, `species`, `rarity`, `generation`, `parent_egg_id`, `food_type_distribution`

```solidity
struct AnimalProperties {
    uint256 animal_id;
    address owner;
    Species species;
    Rarity rarity;
    uint256 generation;
    uint256 parent_egg_id;      // Gen 0: egg that hatched, Gen 1+: breeding egg
    uint256 parent1_animal_id;  // For breeding (0 for Gen 0)
    uint256 parent2_animal_id;  // For breeding (0 for Gen 0)
    uint256[4] food_type_distribution;
    uint256 rarity_upgrade_count; // Number of extra food items used for rarity upgrade
}
```

### 1.2 Update EggNFT.sol for Breeding
**File**: `contracts/src/EggNFT.sol`

**Changes**:
- Add `breedingFee` for breeding operations
- Add `isBreedingEgg` flag to distinguish Gen 0 vs Gen 1+ eggs
- Add `parent1AnimalId` and `parent2AnimalId` to track breeding parents

```solidity
struct EggProperties {
    // ... existing fields
    bool isBreedingEgg;        // true if from breeding, false if Gen 0
    uint256 parent1_animal_id; // First parent
    uint256 parent2_animal_id; // Second parent
}
```

---

## Phase 2: Rarity Distribution Implementation

### 2.1 Current Rarity Distribution (Already Implemented)
**Location**: `EggNFT.sol:_calculateRarity()`

Current distribution:
- Common: 60% (roll < 60)
- Rare: 25% (60 ≤ roll < 85)
- Epic: 12% (85 ≤ roll < 97)
- Legendary: 3% (roll ≥ 97)

**Verification**: Already tested in `EggHatching.t.sol:test_HatchEgg_RarityDistribution_100Eggs()`

### 2.2 Rarity Upgrade Mechanic
**File**: `contracts/src/EggNFT.sol`

**New Function**: `upgradeEggRarity(uint256 eggTokenId, uint256 extraFoodCount)`

**Mechanic**:
- Users can feed extra food items beyond the required 10
- Each extra food item increases `rarity_seed` bonus
- Bonus formula: `finalSeed = baseSeed + (extraFoodCount * rarityBonus)`
- `rarityBonus = 2` (each extra food gives +2% to rarity roll)
- Maximum extra food: 10 items (max +20% bonus)

**Implementation**:
```solidity
function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external {
    require(ownerOf(eggTokenId) == msg.sender, "Not owner");
    require(foodIds.length > 0, "No food items");
    
    EggProperties storage props = _eggProperties[eggTokenId];
    require(!props.is_hatched, "Egg already hatched");
    require(props.food_count >= MAX_FOOD_COUNT, "Must feed 10 first");
    require(props.food_count + foodIds.length <= 20, "Max 20 food items");
    
    // Record food consumption
    for (uint256 i = 0; i < foodIds.length; i++) {
        // ... update food history
        props.food_count++;
    }
    
    // Calculate new rarity probability
    uint256 extraFoodCount = props.food_count - MAX_FOOD_COUNT;
    uint256 rarityBonus = extraFoodCount * 2; // 2% per extra food
    
    emit EggUpgraded(eggTokenId, props.food_count, rarityBonus);
}
```

**Event**:
```solidity
event EggUpgraded(
    uint256 indexed egg_id,
    uint256 new_food_count,
    uint256 new_rarity_probability
);
```

### 2.3 Updated Rarity Calculation with Upgrade
**File**: `EggNFT.sol:_calculateRarity()`

```solidity
function _calculateRarity(uint256 raritySeed, uint256 upgradeCount) internal pure returns (Rarity) {
    uint256 roll = raritySeed % 100;
    
    // Apply rarity upgrade bonus
    if (upgradeCount > 0) {
        uint256 bonus = upgradeCount * 2; // 2% per upgrade
        roll = (roll + bonus) % 100; // Wrap around at 100
    }
    
    if (roll < 60) return Rarity.Common;
    else if (roll < 85) return Rarity.Rare;
    else if (roll < 97) return Rarity.Epic;
    else return Rarity.Legendary;
}
```

---

## Phase 3: Generation Tracking

### 3.1 Generation 0 (From Egg)
**Current Implementation**: Already implemented in `EggNFT.sol:hatchEgg()`

```solidity
uint256 animalTokenId = AnimalNFT(animalNFTContract).mintAnimal(
    msg.sender,
    props.egg_id,
    rarity,
    species,
    0,  // generation = 0 for eggs
    foodDistribution
);
```

### 3.2 Generation 1+ (From Breeding)
**New Function**: `EggNFT.breedAnimals()`

**Breeding Mechanics**:
- Two parent animals required (must be different genders or species-compatible)
- Breeding fee: 5 USDT (configurable)
- Creates a new breeding egg
- Child generation = max(parent1.generation, parent2.generation) + 1
- Child inherits traits from parents (species weighted by rarity)

**Implementation**:
```solidity
function breedAnimals(
    uint256 parent1TokenId,
    uint256 parent2TokenId,
    address referrer
) external nonReentrant returns (uint256 breedingEggId) {
    require(parent1TokenId != parent2TokenId, "Cannot breed same animal");
    require(animalNFT.ownerOf(parent1TokenId) == msg.sender, "Not parent1 owner");
    require(animalNFT.ownerOf(parent2TokenId) == msg.sender, "Not parent2 owner");
    
    // Get parent properties
    (,,,Rarity rarity1, uint256 gen1,) = animalNFT.getAnimalProperties(parent1TokenId);
    (,,,Rarity rarity2, uint256 gen2,) = animalNFT.getAnimalProperties(parent2TokenId);
    
    // Calculate child generation
    uint256 childGeneration = (gen1 > gen2 ? gen1 : gen2) + 1;
    
    // Calculate breeding fee
    usdtToken.safeTransferFrom(msg.sender, commissionDistribution, BREEDING_FEE);
    
    // Distribute commission
    address[4] memory referralChain;
    referralChain[0] = referrer;
    CommissionDistribution(commissionDistribution).distributeCommission(referralChain, BREEDING_FEE);
    
    // Create breeding egg
    _nextTokenId++;
    _nextEggId++;
    uint256 tokenId = _nextTokenId - 1;
    uint256 eggId = _nextEggId - 1;
    
    _safeMint(msg.sender, tokenId);
    
    uint256 raritySeed = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        tokenId,
        parent1TokenId,
        parent2TokenId
    )));
    
    _eggProperties[tokenId] = EggProperties({
        egg_id: eggId,
        owner: msg.sender,
        food_count: INITIAL_FOOD_COUNT, // Starts with 2 food
        is_hatched: false,
        rarity_seed: raritySeed,
        referral_chain: referralChain,
        animal_token_id: 0,
        isBreedingEgg: true,
        parent1_animal_id: parent1TokenId,
        parent2_animal_id: parent2TokenId
    });
    
    emit BreedingEggCreated(eggId, parent1TokenId, parent2TokenId, childGeneration);
    
    return eggId;
}
```

**Event**:
```solidity
event BreedingEggCreated(
    uint256 indexed egg_id,
    uint256 indexed parent1_animal_id,
    uint256 indexed parent2_animal_id,
    uint256 generation
);
```

### 3.3 Species Inheritance for Breeding
**New Function**: `_determineBreedingSpecies()`

```solidity
function _determineBreedingSpecies(
    uint256 raritySeed,
    Species parent1Species,
    Species parent2Species,
    Rarity parent1Rarity,
    Rarity parent2Rarity
) internal pure returns (Species) {
    // Weight species selection by parent rarity
    uint256 weight1 = uint256(parent1Rarity) + 1;
    uint256 weight2 = uint256(parent2Rarity) + 1;
    
    uint256 totalWeight = weight1 + weight2;
    uint256 choice = raritySeed % totalWeight;
    
    if (choice < weight1) {
        return parent1Species;
    } else {
        return parent2Species;
    }
}
```

---

## Phase 4: Species Determination from Food Type History

### 4.1 Current Implementation (Gen 0)
**Location**: `EggNFT.sol:_determineSpecies()`

Already implemented - species determined by:
1. Food type distribution (Grain, Fish, Insects, Herb)
2. Rarity tier
3. Random seed

### 4.2 Species Determination for Breeding (Gen 1+)
**Enhancement**: Combine food history with parent species

```solidity
function _determineSpecies(
    uint256 raritySeed,
    FoodType[] memory foodHistory,
    Rarity rarity,
    Species parent1Species,
    Species parent2Species,
    bool isBreeding
) internal pure returns (Species) {
    if (isBreeding && parent1Species != Species.Undefined) {
        return _determineBreedingSpecies(
            raritySeed,
            parent1Species,
            parent2Species,
            rarity,
            rarity
        );
    }
    
    // Existing food-based determination
    // ...
}
```

---

## Phase 5: Testing Requirements

### 5.1 Rarity Distribution Tests
**File**: `contracts/test/AnimalNFT.t.sol` (add new tests)

```solidity
function test_RarityDistribution_Accuracy_1000Eggs() public {
    uint256 commonCount = 0;
    uint256 rareCount = 0;
    uint256 epicCount = 0;
    uint256 legendaryCount = 0;
    
    uint256 numEggs = 1000;
    
    for (uint256 i = 0; i < numEggs; i++) {
        // Mint and hatch egg
        // Count rarities
    }
    
    // Verify distribution within tolerance
    assertGt(commonCount, 580); // 58-62%
    assertLt(commonCount, 620);
    
    assertGt(rareCount, 230); // 23-27%
    assertLt(rareCount, 270);
    
    assertGt(epicCount, 100); // 10-14%
    assertLt(epicCount, 140);
    
    assertGt(legendaryCount, 20); // 2-4%
    assertLt(legendaryCount, 40);
}
```

### 5.2 Upgrade Mechanic Tests
**File**: `contracts/test/EggUpgrading.t.sol` (new test file)

```solidity
function test_UpgradeEggRarity_IncreasesProbability() public {
    // Mint egg, feed 10 food
    // Upgrade with 5 extra food
    // Verify rarity probability increased by 10%
}

function test_UpgradeEggRarity_MaxUpgrades() public {
    // Upgrade to maximum (20 total food)
    // Verify max bonus of +20%
}

function test_UpgradeEggRarity_EventEmitted() public {
    // Upgrade egg
    // Verify EggUpgraded event with correct parameters
}

function test_UpgradeEggRarity_RevertWhen_AlreadyHatched() public {
    // Hatch egg, then try to upgrade
    // Should revert
}

function test_UpgradeEggRarity_StatisticalBenefit() public {
    // Hatch 100 eggs with no upgrades
    // Hatch 100 eggs with max upgrades
    // Compare rarity distributions
}
```

### 5.3 Breeding Tests
**File**: `contracts/test/AnimalBreeding.t.sol` (new test file)

```solidity
function test_BreedAnimals_CreatesBreedingEgg() public {
    // Mint two animals
    // Breed them
    // Verify breeding egg created
}

function test_BreedAnimals_GenerationTracking() public {
    // Breed Gen 0 animals → Gen 1 egg
    // Hatch and breed Gen 1 → Gen 2 egg
    // Verify generation increments correctly
}

function test_BreedAnimals_ParentLineage() public {
    // Breed animals
    // Verify parent IDs stored in egg
}

function test_BreedAnimals_SpeciesInheritance() public {
    // Breed Chicken + Duck
    // Verify child is one of parent species
}

function test_BreedAnimals_RevertWhen_SameOwner() public {
    // Try to breed animals from different owners
    // Should revert
}
```

### 5.4 Generation Tracking Tests
```solidity
function test_GenerationTracking_Gen0() public {
    // Hatch egg
    // Verify generation = 0
}

function test_GenerationTracking_Gen1() public {
    // Breed two Gen 0 animals
    // Hatch breeding egg
    // Verify generation = 1
}

function test_GenerationTracking_Gen2() public {
    // Breed two Gen 1 animals
    // Hatch breeding egg
    // Verify generation = 2
}
```

---

## Phase 6: Integration with Frontend

### 6.1 Update PocketBase Collections
**File**: `apps/backend/collections/` (update schema)

**Animal NFT Collection**:
```json
{
  "name": "animal_nfts",
  "fields": [
    { "name": "animal_id", "type": "number" },
    { "name": "token_id", "type": "number" },
    { "name": "owner", "type": "text" },
    { "name": "species", "type": "select" },
    { "name": "rarity", "type": "select" },
    { "name": "generation", "type": "number" },
    { "name": "parent_egg_id", "type": "number" },
    { "name": "parent1_animal_id", "type": "number" },
    { "name": "parent2_animal_id", "type": "number" },
    { "name": "food_type_distribution", "type": "json" },
    { "name": "rarity_upgrade_count", "type": "number" }
  ]
}
```

**Egg NFT Collection** (update):
```json
{
  "name": "egg_nfts",
  "fields": [
    // ... existing fields
    { "name": "is_breeding_egg", "type": "bool" },
    { "name": "parent1_animal_id", "type": "number" },
    { "name": "parent2_animal_id", "type": "number" },
    { "name": "rarity_upgrade_count", "type": "number" }
  ]
}
```

### 6.2 Update Backend Hooks
**File**: `apps/backend/pb_hooks/`

**New Hook**: `05-animal-breeding.pb.js`
- Handle breeding egg creation
- Validate parent animal ownership
- Calculate breeding fees
- Emit breeding events

---

## Implementation Checklist

### Smart Contracts
- [ ] Update `AnimalProperties` struct with breeding fields
- [ ] Add `EggUpgraded` event to `EggNFT.sol`
- [ ] Implement `upgradeEggRarity()` function
- [ ] Update `_calculateRarity()` to accept upgrade count
- [ ] Add `BreedingEggCreated` event
- [ ] Implement `breedAnimals()` function
- [ ] Implement `_determineBreedingSpecies()` function
- [ ] Add `isBreedingEgg` flag to `EggProperties`
- [ ] Set breeding fee constant

### Tests
- [ ] Rarity distribution accuracy test (1000 eggs)
- [ ] Upgrade mechanic tests
- [ ] Breeding tests
- [ ] Generation tracking tests
- [ ] Species inheritance tests
- [ ] Edge case tests (max upgrades, same species breeding, etc.)

### Backend
- [ ] Update Animal NFT collection schema
- [ ] Update Egg NFT collection schema
- [ ] Create breeding hook
- [ ] Create rarity upgrade hook

### Documentation
- [ ] Update `docs/01-domain-model.md` with breeding mechanics
- [ ] Document rarity upgrade formula
- [ ] Document breeding economics
- [ ] Add API documentation for breeding endpoints

---

## Technical Specifications

### Rarity Distribution (Exact Percentages)
| Rarity | Base Chance | With Max Upgrade (+20%) |
|--------|-------------|------------------------|
| Common | 60% | 40% |
| Rare | 25% | 25% |
| Epic | 12% | 23% |
| Legendary | 3% | 12% |

### Breeding Economics
- **Breeding Fee**: 5 USDT
- **Commission Split**: G1 (25%), G2 (15%), G3 (10%), G4 (5%), Platform (45%)
- **Starting Food**: 2 (same as regular eggs)
- **Max Food**: 20 (10 required + 10 upgrades)

### Generation Limits
- **Max Generation**: Unlimited (but may cap at Gen 10 for game balance)
- **Generation Display**: "Gen X" where X = generation number

### Rarity Upgrade Formula
```
final_rarity_roll = (base_roll + (upgrade_count * 2)) % 100
```
- Each upgrade = +2% to rarity roll
- Max upgrades = 10 (+20% total)
- Roll wraps at 100 (prevents guaranteed Legendary)

---

## Success Criteria

1. **Rarity Distribution**: Matches target percentages within ±2% tolerance over 1000 samples
2. **Generation Tracking**: Accurately tracks Gen 0 through Gen 10+
3. **Upgrade Mechanic**: Each upgrade provides measurable rarity improvement
4. **Breeding**: Successfully creates breeding eggs with correct parentage
5. **Species Inheritance**: Children inherit species from parents with weighted probability
6. **Events**: All required events emitted with correct parameters
7. **Tests**: All unit tests pass with >95% code coverage

---

## Dependencies & Risks

### Dependencies
- OpenZeppelin Contracts v5.0+
- Existing EggNFT, AnimalNFT, FoodNFT contracts
- CommissionDistribution contract
- USDT token contract

### Risks
1. **Randomness**: On-chain randomness limitations (using block.prevrandao)
2. **Gas Costs**: Breeding operations may be gas-intensive
3. **Balance**: Rarity upgrades may need tuning based on economic modeling
4. **Inbreeding**: May need to prevent breeding same animal or close relatives

### Mitigations
1. Consider Chainlink VRF for production randomness
2. Optimize storage patterns to reduce gas
3. Implement configurable rarity bonus (owner-settable)
4. Add breeding restrictions (cooldown periods, lineage checks)

---

## Future Enhancements (Out of Scope)

- Gender system for animals
- Cooldown periods between breeding
- Genetic traits beyond species
- Animal mating/pairing marketplace
- Adoption/breeding fee marketplace
- Achievement system for rare breeding combinations

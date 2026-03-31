# Animal Breeding Mechanics Implementation Plan

**Generated:** 2026-03-31
**Status:** Pending Review

## Overview
Implement breeding mechanics for Gen 1+ Animal NFTs with USDT breeding fee, 48-hour cooldown, and weighted rarity variance.

## Current State Analysis
- **EggNFT.sol**: Contains `breedAnimals()` function (line 261-304)
- **AnimalNFT.sol**: Stores animal properties including generation, rarity, parents
- **Breeding fee**: Currently 5 USDT (`BREEDING_FEE` constant in EggNFT)
- **Generation logic**: Already implemented as `max(gen1, gen2) + 1`
- **Missing**: Cooldown mechanism, rarity variance, `AnimalsBreed` event

## Implementation Phases

### Phase 1: AnimalNFT Enhancements
**File**: `contracts/src/AnimalNFT.sol`

1. **Add breeding cooldown tracking**
   - Add `mapping(uint256 => uint256) private _lastBredTimestamp;`
   - Add `BREED_COOLDOWN = 48 hours` constant
   - Add `getLastBredTime(uint256 tokenId)` view function
   - Add `getCanBreedAt(uint256 tokenId)` view function
   - Update `_update()` to preserve cooldown data on transfer

2. **Add AnimalsBreed event**
   ```solidity
   event AnimalsBreed(
       uint256 indexed animal_id_1,
       uint256 indexed animal_id_2,
       uint256 indexed offspring_id,
       uint256 offspring_generation
   );
   ```

### Phase 2: EggNFT Breeding Logic Updates
**File**: `contracts/src/EggNFT.sol`

1. **Update `breedAnimals()` function** (line 261-304)
   - Add cooldown verification before breeding
   - Call AnimalNFT to update last bred timestamps
   - Emit `AnimalsBreed` event after successful breeding

2. **Implement rarity variance logic**
   - Add `_calculateOffspringRarity()` internal function
   - Weighted probability:
     - 70% chance = max(parent1.rarity, parent2.rarity)
     - 20% chance = max + 1 tier (capped at Legendary)
     - 10% chance = max - 1 tier (minimum Common)
   - Use rarity_seed + parent token IDs for deterministic randomness

### Phase 3: Unit Tests
**File**: `contracts/test/AnimalBreeding.t.sol`

1. **Test breeding cooldown**
   - `test_BreedAnimals_RevertWhen_OnCooldown()`: Verify cannot breed within 48h
   - `test_BreedAnimals_CooldownExpires()`: Verify breeding works after 48h
   - `test_BreedAnimals_OneAnimalOnCooldown()`: Verify fails if either parent on cooldown

2. **Test fee deduction**
   - `test_BreedAnimals_USDTFeeTransferred()`: Verify 5 USDT transferred to commission
   - `test_BreedAnimals_RevertWhen_InsufficientBalance()`: Verify fails without USDT
   - `test_BreedAnimals_RevertWhen_NotApproved()`: Verify fails without USDT approval

3. **Test rarity calculation**
   - `test_CalculateOffspringRarity_CommonParents()`: Both Common → mostly Common, some Rare
   - `test_CalculateOffspringRarity_LegendaryParents()`: Both Legendary → all Legendary (capped)
   - `test_CalculateOffspringRarity_MixedParents()`: Common + Epic → distribution test
   - `test_CalculateOffspringRarity_Deterministic()`: Same inputs = same output

4. **Test generation tracking**
   - `test_BreedAnimals_GenerationIncrement()`: Gen 0 + Gen 0 → Gen 1
   - `test_BreedAnimals_GenerationMax()`: Gen 2 + Gen 5 → Gen 6
   - Already covered in existing tests

## File Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `contracts/src/AnimalNFT.sol` | Add cooldown mapping, constants, getters, event | ~40 |
| `contracts/src/EggNFT.sol` | Update `breedAnimals()`, add rarity variance function | ~50 |
| `contracts/test/AnimalBreeding.t.sol` | Add 8+ new test cases | ~200 |

## Technical Details

### Cooldown Implementation
```solidity
// AnimalNFT.sol
uint256 public constant BREED_COOLDOWN = 48 hours;
mapping(uint256 => uint256) private _lastBredTimestamp;

function recordBreeding(uint256 tokenId) external onlyEggNFTContract {
    _lastBredTimestamp[tokenId] = block.timestamp;
}

function canBreed(uint256 tokenId) external view returns (bool) {
    return block.timestamp >= _lastBredTimestamp[tokenId] + BREED_COOLDOWN;
}
```

### Rarity Variance Implementation
```solidity
// EggNFT.sol
function _calculateOffspringRarity(
    Rarity parent1Rarity,
    Rarity parent2Rarity,
    uint256 seed
) internal pure returns (Rarity) {
    Rarity maxRarity = parent1Rarity > parent2Rarity ? parent1Rarity : parent2Rarity;
    
    uint256 varianceRoll = seed % 100;
    
    if (varianceRoll < 70) {
        return maxRarity; // 70% = max rarity
    } else if (varianceRoll < 90) {
        // 20% = +1 tier (capped at Legendary)
        return maxRarity == Rarity.Legendary ? Rarity.Legendary : Rarity(uint256(maxRarity) + 1);
    } else {
        // 10% = -1 tier (minimum Common)
        return maxRarity == Rarity.Common ? Rarity.Common : Rarity(uint256(maxRarity) - 1);
    }
}
```

## Testing Strategy

### Test Coverage
- ✅ Breeding ownership verification (already exists)
- ✅ Same animal prevention (already exists)
- ✅ Generation calculation (already exists)
- ✅ Fee transfer (already exists)
- ⬜ Cooldown enforcement (new)
- ⬜ Rarity variance distribution (new)
- ⬜ AnimalsBreed event emission (new)

### Test Commands
```bash
cd contracts
forge test --match-contract AnimalBreedingTest -vvv
forge coverage --match-contract AnimalBreedingTest
```

## Acceptance Criteria Checklist

- [x] `breedAnimals(animal_id_1, animal_id_2)` function implemented (exists)
- [x] Verification: caller owns both animals (exists)
- [x] Verification: neither animal is currently breeding (N/A - using cooldown instead)
- [x] Breeding fee deducted in USDT (exists)
- [ ] Both animals locked for BREED_COOLDOWN period (48h)
- [ ] Offspring rarity = max(parent1, parent2) with weighted variance
- [x] Offspring generation = max(gen1, gen2) + 1 (exists)
- [x] New Animal NFT minted to caller (exists via EggNFT)
- [ ] Event emitted: `AnimalsBreed(animal_id_1, animal_id_2, offspring_id)`
- [ ] Unit tests: Breeding cooldown, fee deduction, rarity calculation

## Dependencies & Risks

**Dependencies**: None (uses existing USDT, EggNFT, AnimalNFT)

**Risks**:
1. **Randomness**: Using block.timestamp + prevrandao for RNG (acceptable for this use case)
2. **Gas costs**: Additional storage writes for cooldown tracking (~20k gas per breeding)
3. **Edge case**: Breeding Legendary animals cannot go higher (handled by cap)

## Future Enhancements (Out of Scope)
- Breeding queue system
- Cooldown reduction mechanisms
- Advanced genetics (trait inheritance)
- Breeding count limits per animal

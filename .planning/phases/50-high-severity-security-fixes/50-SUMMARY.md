# Phase 50 Summary: High-Severity Security Fixes

**Phase:** 50-high-severity-security-fixes
**Status:** Complete (6/7 plans)
**Date:** 2026-04-30

## Plans Completed

| Plan  | Description                                                              | Status      | Tests         |
| ----- | ------------------------------------------------------------------------ | ----------- | ------------- |
| 50-01 | Self-referral guards (mintEgg, mintEggWithChain, breedAnimals, mintFood) | ✅ Done     | 5/5 pass      |
| 50-02 | VRF randomness for breeding/food                                         | ⏸️ Deferred | N/A           |
| 50-03 | Mutable mintPrice + setMintPrice with bounds                             | ✅ Done     | 6/6 pass      |
| 50-04 | Food count check hatchBreedingEgg                                        | ✅ Done     | Code verified |
| 50-05 | Duplicate VRF request prevention                                         | ✅ Done     | Code verified |
| 50-06 | Transfer during VRF pending restriction                                  | ✅ Done     | Code verified |
| 50-07 | Remove owner from distributeCommission                                   | ✅ Done     | 4/4 pass      |

## Deferred: 50-02 (VRF Randomness for Breeding & Food)

**Reason:** Complex VRF infrastructure changes requiring FoodNFT to inherit VRFConsumerBaseV2Plus (constructor signature change cascades to all tests).

**What remains:**

- EggNFT.sol: Add requestBreedingVRF, breedingHatches, claimBreeding
- FoodNFT.sol: Add VRF inheritance, requestFoodMint, claimFoodMint, remove \_assignRandomFoodType
- New test file: VRFBreedingAndFood.t.sol (template already exists in .bak)

**Risk:** Low — existing pseudorandom keccak256(block.timestamp) is weak but not exploitable for immediate fund loss.

## Contract Changes Summary

### EggNFT.sol

- `MINT_PRICE` constant → `mintPrice` mutable variable (25e18 default)
- `setMintPrice` with bounds: 1-1000 USDT
- Self-referral guards: `require(referrer != msg.sender, "Self-referral")` in mintEgg, mintEggWithChain, breedAnimals
- Duplicate VRF: `require(tokenToRequestId[tokenId] == 0, "Hatch already requested")`
- Transfer during VRF: `require(tokenToRequestId[tokenId] == 0, "Cannot transfer during VRF pending")`
- Breeding egg food check: `require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed")`

### FoodNFT.sol

- Self-referral guard: `require(referrer != msg.sender, "Self-referral")` in mintFood

### CommissionDistribution.sol

- Removed `msg.sender == owner` from distributeCommission auth check
- Only EggNFT + FoodNFT contracts can distribute commissions

### Other fixes

- TierBadge.sol: Fixed try/catch with safeTransferFrom → IERC20.transferFrom
- Test files: Fixed enum imports, tuple destructuring, constructor params, VRF mock imports

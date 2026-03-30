# Egg Feeding System Implementation Plan

**Created:** 2026-03-30  
**Status:** Pending Review  
**Priority:** High  
**Phase:** Phase 4 - Egg Feeding System

---

## Executive Summary

Implement the egg feeding system that allows users to consume Food NFTs to progress toward hatching. The system enables batch feeding of Food NFTs to Egg NFTs, tracks food type history for species determination, and automatically enables hatching when 10 food items are consumed.

**Current State:** FoodNFT.sol and EggNFT.sol already have basic feeding functionality implemented with `feedEgg()` function. This plan enhances it to meet all acceptance criteria with proper verification, batch operations, and comprehensive testing.

---

## Requirements Validation

### ✅ Already Implemented
- Food NFTs are ERC-1155 tokens
- `feedEgg(egg_token_id, food_ids[], eggNftContract)` exists in FoodNFT.sol
- Food NFTs are burned upon feeding
- `egg.food_count` is incremented
- `hatchEgg()` requires `food_count >= 10`
- Event `EggFed(egg_id, food_ids[], feeder)` is emitted
- Food type history is tracked in EggNFT

### ⚠️ Needs Enhancement
- **Missing verification:** Caller must own BOTH egg AND all food_ids (currently only checks food ownership)
- **Missing egg ownership check:** Should verify caller owns egg_id
- **Missing already-hatched check:** Should verify egg.is_hatched == false before feeding
- **Insufficient tests:** Need comprehensive unit tests for edge cases

---

## Work Breakdown Structure

### Phase 1: Smart Contract Enhancements

#### 1.1 Enhance FoodNFT.sol feedEgg Function
**File:** `contracts/src/FoodNFT.sol:105-141`

**Current Issues:**
- Only verifies food ownership, not egg ownership
- Does not check if egg is already hatched before feeding

**Required Changes:**

```solidity
function feedEgg(
    uint256 egg_token_id,
    uint256[] calldata food_ids,
    address eggNftContract
) external nonReentrant {
    require(food_ids.length > 0, "No food items provided");
    
    EggNFT eggNFT = EggNFT(eggNftContract);
    
    // NEW: Verify caller owns the egg
    require(eggNFT.ownerOf(egg_token_id) == msg.sender, "Not egg owner");
    
    (,,,bool is_hatched,,) = eggNFT.getEggProperties(egg_token_id);
    
    // NEW: Verify egg is not already hatched
    require(!is_hatched, "Egg already hatched");
    
    FoodType[] memory foodTypes = new FoodType[](food_ids.length);
    
    for (uint256 i = 0; i < food_ids.length; i++) {
        uint256 foodId = food_ids[i];
        FoodProperties storage props = _foodProperties[foodId];
        
        // Existing: Verify caller owns the food
        require(props.owner == msg.sender, "Not food owner");
        require(!props.is_consumed, "Food already consumed");
        
        props.is_consumed = true;
        props.consumed_by_egg_id = egg_token_id;
        
        foodTypes[i] = props.food_type;
        
        _burn(msg.sender, foodId, 1);
    }
    
    eggNFT.recordFoodConsumption(egg_token_id, food_ids, foodTypes);
    
    emit EggFed(egg_token_id, food_ids, msg.sender);
}
```

**Validation Rules:**
1. ✅ food_ids.length > 0
2. ✅ msg.sender owns egg_token_id (NEW)
3. ✅ egg.is_hatched == false (NEW)
4. ✅ msg.sender owns all food_ids (existing)
5. ✅ All food items are not consumed (existing)

---

#### 1.2 Enhance EggNFT.sol recordFoodConsumption
**File:** `contracts/src/EggNFT.sol:137-148`

**Current State:** Already has `onlyAuthorizedFoodNFTContract` modifier - this is correct.

**No changes needed** - the function is only callable by authorized FoodNFT contracts, which prevents unauthorized manipulation.

**Add explicit hatched check for safety:**

```solidity
function recordFoodConsumption(
    uint256 egg_token_id,
    uint256[] calldata food_ids,
    FoodType[] calldata food_types
) external onlyAuthorizedFoodNFTContract {
    require(food_ids.length == food_types.length, "Arrays length mismatch");
    
    EggProperties storage props = _eggProperties[egg_token_id];
    
    // Add explicit check
    require(!props.is_hatched, "Egg already hatched");
    
    for (uint256 i = 0; i < food_ids.length; i++) {
        _foodTypeHistory[egg_token_id][props.food_count] = food_types[i];
        props.food_count++;
    }
}
```

---

#### 1.3 Add Event Enhancement (Optional)
**File:** `contracts/src/FoodNFT.sol:40`

**Current:**
```solidity
event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
```

**Enhanced (add new_food_count):**
```solidity
event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder, uint256 new_food_count);
```

**Tradeoff:** 
- ✅ Pro: Provides immediate feedback on food count
- ❌ Con: Requires EggNFT to return new count, adding complexity

**Recommendation:** Keep current event - new_food_count can be queried from EggNFT if needed off-chain.

---

### Phase 2: Comprehensive Unit Tests

#### 2.1 Create FeedEgg Test Suite
**File:** `contracts/test/EggFeeding.t.sol` (NEW)

**Test Categories:**

**A. Single Feed Tests**
```solidity
function test_FeedSingleFoodItem() public
function test_FeedSingleFood_VerifyOwnership() public
function test_FeedSingleFood_IncrementFoodCount() public
function test_FeedSingleFood_BurnFoodNFT() public
function test_FeedSingleFood_EmitEvent() public
```

**B. Batch Feed Tests**
```solidity
function test_FeedMultipleFoodItems() public
function test_FeedBatch_10FoodItems() public
function test_FeedBatch_50FoodItems() public
function test_FeedBatch_VerifyAllBurned() public
function test_FeedBatch_FoodCountIncrement() public
```

**C. Edge Cases - Rejection Tests**
```solidity
function test_Revert_FeedEmptyFoodArray() public
function test_Revert_FeedWhenNotEggOwner() public
function test_Revert_FeedWhenNotFoodOwner() public
function test_Revert_FeedAlreadyConsumedFood() public
function test_Revert_FeedAlreadyHatchedEgg() public
function test_Revert_FeedZeroFoodItems() public
```

**D. Food Count & Hatching Integration**
```solidity
function test_FoodCountReaches10_CanHatch() public
function test_FoodCountLessThan10_CannotHatch() public
function test_FeedAfterHatch_Revert() public
function test_FeedExactly10FoodItems() public
function test_FeedMoreThan10FoodItems() public
```

**E. Food Type History Tracking**
```solidity
function test_FoodTypeHistory_Tracked() public
function test_FoodTypeHistory_CorrectOrder() public
function test_FoodTypeHistory_AfterBatchFeed() public
function test_GetFoodTypeDistribution() public
```

**F. Ownership Transfer Scenarios**
```solidity
function test_FeedAfterEggTransfer_NewOwnerCanFeed() public
function test_FeedAfterFoodTransfer_NewOwnerCannotFeedOldFood() public
```

---

#### 2.2 Example Test Implementations

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract EggFeedingTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public buyer;
    address public otherBuyer;
    address public referrerG1;
    
    uint256 public constant EGG_MINT_PRICE = 25 * 10^18;
    uint256 public constant FOOD_MINT_PRICE = 0.50 * 10^18;
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
    
    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        otherBuyer = address(0x2);
        referrerG1 = address(0x3);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(address(0x4));
        eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
        foodNFT = new FoodNFT(
            address(commissionDistribution),
            address(mockUSDT),
            address(eggNFT)
        );
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        eggNFT.setFoodNFTContract(address(foodNFT));
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(otherBuyer, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
    }
    
    // ========== SINGLE FEED TESTS ==========
    
    function test_FeedSingleFoodItem() public {
        // Setup: Mint egg and food
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 1, referrerG1);
        
        // Feed egg
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        // Verify food count incremented
        (,,uint256 food_count,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 3, "Food count should be 3 (2 initial + 1)");
    }
    
    function test_Revert_FeedWhenNotEggOwner() public {
        // Setup: buyer mints egg, otherBuyer mints food
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(otherBuyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(otherBuyer, 1, referrerG1);
        
        // Attempt to feed (otherBuyer doesn't own egg)
        vm.expectRevert("Not egg owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_Revert_FeedWhenNotFoodOwner() public {
        // Setup: buyer mints egg and food, transfers food to otherBuyer
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 1, referrerG1);
        
        // Transfer food to otherBuyer
        foodNFT.safeTransferFrom(buyer, otherBuyer, food_ids[0], 1, "");
        
        // Attempt to feed (buyer no longer owns food)
        vm.expectRevert("Not food owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    // ========== BATCH FEED TESTS ==========
    
    function test_FeedMultipleFoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 7, "Food count should be 7 (2 initial + 5)");
    }
    
    function test_FeedBatch_10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 12, "Food count should be 12 (2 initial + 10)");
        
        // Verify can now hatch
        eggNFT.hatchEgg(egg_token_id);
        (,,,bool is_hatched,,) = eggNFT.getEggProperties(egg_token_id);
        assertTrue(is_hatched, "Egg should be hatched");
    }
    
    // ========== EDGE CASES ==========
    
    function test_Revert_FeedEmptyFoodArray() public {
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        uint256[] memory food_ids = new uint256[](0);
        
        vm.prank(buyer);
        vm.expectRevert("No food items provided");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    }
    
    function test_Revert_FeedAlreadyHatchedEgg() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        
        // Feed and hatch
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        eggNFT.hatchEgg(egg_token_id);
        
        // Try to feed more
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory more_food = foodNFT.mintFood(buyer, 5, referrerG1);
        
        vm.expectRevert("Egg already hatched");
        foodNFT.feedEgg(egg_token_id, more_food, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_Revert_FeedAlreadyConsumedFood() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 2);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 2, referrerG1);
        
        // Feed once
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        // Try to feed same food again
        vm.expectRevert("Food already consumed");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    // ========== FOOD TYPE HISTORY ==========
    
    function test_FoodTypeHistory_Tracked() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 3, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        FoodType[] memory history = eggNFT.getFoodTypeHistory(egg_token_id);
        assertEq(history.length, 5, "Should track 5 food types (2 initial + 3)");
    }
    
    // ========== EVENT EMISSION ==========
    
    function test_EggFed_EventEmitted() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        
        vm.expectEmit(true, false, true, true);
        emit EggFed(egg_token_id, food_ids, buyer);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
}
```

---

### Phase 3: Integration Tests

#### 3.1 Full Flow Test
**File:** `contracts/test/EggFeedingIntegration.t.sol` (NEW)

**Test Complete User Journey:**

```solidity
function test_FullEggFeedingFlow() public {
    // 1. User mints egg
    vm.prank(buyer);
    mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
    uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
    
    // 2. User mints food in batches
    vm.startPrank(buyer);
    mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
    uint256[] memory batch1 = foodNFT.mintFood(buyer, 3, referrerG1);
    
    mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
    uint256[] memory batch2 = foodNFT.mintFood(buyer, 3, referrerG1);
    
    mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 4);
    uint256[] memory batch3 = foodNFT.mintFood(buyer, 4, referrerG1);
    
    // 3. Feed in multiple transactions
    foodNFT.feedEgg(egg_token_id, batch1, address(eggNFT)); // 2+3=5
    foodNFT.feedEgg(egg_token_id, batch2, address(eggNFT)); // 5+3=8
    foodNFT.feedEgg(egg_token_id, batch3, address(eggNFT)); // 8+4=12
    
    vm.stopPrank();
    
    // 4. Verify food count
    (,,uint256 food_count,,,) = eggNFT.getEggProperties(egg_token_id);
    assertEq(food_count, 12, "Should have 12 food items");
    
    // 5. Hatch egg
    vm.prank(buyer);
    eggNFT.hatchEgg(egg_token_id);
    
    (,,,bool is_hatched,,) = eggNFT.getEggProperties(egg_token_id);
    assertTrue(is_hatched, "Egg should be hatched");
    
    // 6. Verify all food burned
    for (uint256 i = 0; i < batch1.length; i++) {
        (,,,bool consumed,) = foodNFT.getFoodProperties(batch1[i]);
        assertTrue(consumed);
    }
    // ... verify batch2 and batch3
}
```

---

### Phase 4: Test Execution & Validation

#### 4.1 Run Test Suite
```bash
cd contracts

# Run all tests
forge test

# Run only egg feeding tests
forge test --match-contract EggFeedingTest

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-test test_FeedSingleFoodItem

# Check coverage
forge coverage --match-contract EggFeedingTest
```

**Acceptance Criteria:**
- ✅ All tests pass (25/25)
- ✅ Code coverage >95%
- ✅ Gas costs within acceptable range

---

### Phase 5: Documentation Updates

#### 5.1 Update Module Documentation
**File:** `docs/modules/egg-nft.md`

**Add Section:**
```markdown
## Egg Feeding System

### Overview
Users can feed Food NFTs to their Egg NFTs to progress toward hatching. Each food item increments the food_count, and when food_count reaches 10, the egg can be hatched.

### Feeding Rules
1. Caller must own the egg NFT
2. Caller must own all food NFTs being fed
3. Egg must not be hatched
4. Food NFTs must not be previously consumed
5. Food NFTs are burned upon feeding
6. Food type history is recorded for species determination
```

---

#### 5.2 Create Feeding Guide
**File:** `docs/guides/EGG_FEEDING_GUIDE.md` (NEW)

**Contents:**
- How to feed eggs (user perspective)
- Smart contract interaction examples
- Gas cost estimates
- Common errors and troubleshooting

---

## Acceptance Criteria Checklist

| Criterion | Status | Validation Method |
|-----------|--------|-------------------|
| feedEgg(egg_id, food_ids[]) function implemented | ✅ Already exists | Code review |
| Verification: caller owns egg_id | ⚠️ Needs fix | Test: `test_Revert_FeedWhenNotEggOwner` |
| Verification: caller owns all food_ids | ✅ Already exists | Test: `test_Revert_FeedWhenNotFoodOwner` |
| Verification: egg.is_hatched == false | ⚠️ Needs fix | Test: `test_Revert_FeedAlreadyHatchedEgg` |
| Each Food NFT in food_ids[] is burned | ✅ Already exists | Test: Verify `is_consumed` flag |
| egg.food_count incremented correctly | ✅ Already exists | Test: Count verification |
| When food_count >= 10, hatchEgg() can be called | ✅ Already exists | Test: `test_FoodCountReaches10_CanHatch` |
| Event emitted: EggFed(egg_id, food_ids[], feeder) | ✅ Already exists | Test: Event emission check |
| Food type history tracked for species determination | ✅ Already exists | Test: `test_FoodTypeHistory_Tracked` |
| Unit tests: Single feed | ⚠️ Needs implementation | 5 tests planned |
| Unit tests: Batch feed | ⚠️ Needs implementation | 5 tests planned |
| Unit tests: Edge cases | ⚠️ Needs implementation | 8 tests planned |

---

## Implementation Steps

### Step 1: Enhance Smart Contracts (1-2 hours)
1. Update `FoodNFT.sol:feedEgg()` to verify egg ownership
2. Update `FoodNFT.sol:feedEgg()` to check egg hatched status
3. Update `EggNFT.sol:recordFoodConsumption()` with explicit hatched check
4. Run existing tests to ensure no regressions

### Step 2: Write Unit Tests (3-4 hours)
1. Create `contracts/test/EggFeeding.t.sol`
2. Implement all 25 test cases
3. Run tests and fix any failures
4. Verify gas costs

### Step 3: Integration Testing (1-2 hours)
1. Create `contracts/test/EggFeedingIntegration.t.sol`
2. Test full user journey
3. Test edge cases (ownership transfer, etc.)

### Step 4: Documentation (1 hour)
1. Update `docs/modules/egg-nft.md`
2. Create `docs/guides/EGG_FEEDING_GUIDE.md`

### Step 5: Final Validation (30 min)
1. Run full test suite: `forge test`
2. Check coverage: `forge coverage`
3. Gas report: `forge test --gas-report`

**Total Estimated Time:** 6-9 hours

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Smart contract bug in verification | High | Low | Comprehensive tests, code review |
| Gas cost too high for batch feeding | Medium | Low | Test with 10, 50, 100 food items |
| Food type history incorrect | Medium | Low | Multiple history tracking tests |
| Existing tests break | Low | Low | Run all tests after changes |

---

## Security Considerations

### Access Control
- ✅ Only egg owner can feed (NEW)
- ✅ Only food owner can feed (existing)
- ✅ Only authorized FoodNFT contract can call recordFoodConsumption (existing)

### State Validation
- ✅ Egg must not be hatched (NEW)
- ✅ Food must not be consumed (existing)
- ✅ Arrays length must match (existing)

### Reentrancy Protection
- ✅ `nonReentrant` modifier on feedEgg (existing)

### Event Emissions
- ✅ EggFed event emitted (existing)

---

## Future Enhancements

1. **Bulk Feed Optimization** - Single transaction to feed all selected food
2. **Food Type Bonuses** - Certain food combinations affect rarity
3. **Feeding History UI** - Show food types fed to each egg
4. **Species Determination Logic** - Implement animal species based on food history
5. **Feeding Notifications** - Off-chain events for UI updates

---

## References

- [FoodNFT Implementation Plan](./food-nft-implementation-plan.md)
- [Egg NFT Module Docs](./modules/egg-nft.md)
- [FoodNFT.sol](../../contracts/src/FoodNFT.sol)
- [EggNFT.sol](../../contracts/src/EggNFT.sol)
- [Existing FoodNFT Tests](../../contracts/test/FoodNFT.t.sol)

---

**Last Updated:** 2026-03-30  
**Author:** AI Planning Assistant  
**Review Required By:** Poom

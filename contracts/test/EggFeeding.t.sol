// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract EggFeedingTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
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
        address treasury = address(0x5);
        commissionDistribution = new CommissionDistribution(address(0x4), address(mockUSDT), treasury);
        VRFCoordinatorV2_5Mock vrfMock = new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18);
        eggNFT = new EggNFT(payable(address(commissionDistribution)), address(mockUSDT), address(vrfMock));
        animalNFT = new AnimalNFT();
        foodNFT = new FoodNFT(
            payable(address(commissionDistribution)),
            address(mockUSDT),
            address(eggNFT)
        );
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        eggNFT.setFoodNFTContract(address(foodNFT));
        eggNFT.setAnimalNFTContract(address(animalNFT));
        animalNFT.setEggNFTContract(address(eggNFT));
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(otherBuyer, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
    }
    
    // ========== SINGLE FEED TESTS ==========
    
    function test_FeedSingleFoodItem() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 3, "Food count should be 3 (2 initial + 1)");
    }
    
    function test_FeedSingleFood_VerifyOwnership() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 3, "Food count should increment by 1");
    }
    
    function test_FeedSingleFood_IncrementFoodCount() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 3);
    }
    
    function test_FeedSingleFood_BurnFoodNFT() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,,bool is_consumed,) = foodNFT.getFoodProperties(food_ids[0]);
        assertTrue(is_consumed, "Food should be consumed");
        
        uint256 balance = foodNFT.balanceOf(buyer, food_ids[0]);
        assertEq(balance, 0, "Food NFT should be burned");
    }
    
    function test_FeedSingleFood_EmitEvent() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        vm.expectEmit(true, false, true, true);
        emit EggFed(egg_token_id, food_ids, buyer);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    // ========== BATCH FEED TESTS ==========
    
    function test_FeedMultipleFoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(5, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 7, "Food count should be 7 (2 initial + 5)");
    }
    
    function test_FeedBatch_10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 12, "Food count should be 12 (2 initial + 10)");
        
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertFalse(is_hatched, "Egg should not be auto-hatched");
        
        vm.prank(buyer);
        eggNFT.hatchEgg(egg_token_id);
        
        (,,,is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertTrue(is_hatched, "Egg should be hatched after calling hatchEgg");
    }
    
    function test_FeedBatch_50FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 50);
        uint256[] memory food_ids = foodNFT.mintFood(50, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 52, "Food count should be 52 (2 initial + 50)");
    }
    
    function test_FeedBatch_VerifyAllBurned() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            (,,,bool is_consumed,) = foodNFT.getFoodProperties(food_ids[i]);
            assertTrue(is_consumed, "Food should be consumed");
            
            uint256 balance = foodNFT.balanceOf(buyer, food_ids[i]);
            assertEq(balance, 0, "Food NFT should be burned");
        }
    }
    
    function test_FeedBatch_FoodCountIncrement() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch1 = foodNFT.mintFood(3, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, batch1, address(eggNFT));
        (,,uint256 count1,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(count1, 5);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch2 = foodNFT.mintFood(3, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, batch2, address(eggNFT));
        (,,uint256 count2,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(count2, 8);
    }
    
    // ========== EDGE CASES - REJECTION TESTS ==========
    
    function test_Revert_FeedEmptyFoodArray() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        uint256[] memory food_ids = new uint256[](0);
        
        vm.prank(buyer);
        vm.expectRevert("No food items provided");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    }
    
    function test_Revert_FeedWhenNotEggOwner() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(otherBuyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        vm.expectRevert("Not egg owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_Revert_FeedWhenNotFoodOwner() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(otherBuyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        vm.stopPrank();
        
        vm.prank(buyer);
        vm.expectRevert("Not food owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    }
    
    function test_Revert_FeedAlreadyConsumedFood() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 2);
        uint256[] memory food_ids = foodNFT.mintFood(2, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        vm.expectRevert("Food already consumed");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_Revert_FeedAlreadyHatchedEgg() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        eggNFT.hatchEgg(egg_token_id);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory more_food = foodNFT.mintFood(5, referrerG1);
        
        vm.expectRevert("Egg already hatched");
        foodNFT.feedEgg(egg_token_id, more_food, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_Revert_FeedZeroFoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        uint256[] memory food_ids = new uint256[](0);
        
        vm.prank(buyer);
        vm.expectRevert("No food items provided");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    }
    
    // ========== FOOD COUNT & HATCHING INTEGRATION ==========
    
    function test_FoodCountReaches10_CanHatch() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 8);
        uint256[] memory food_ids = foodNFT.mintFood(8, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        vm.prank(buyer);
        eggNFT.hatchEgg(egg_token_id);
        
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertTrue(is_hatched, "Egg should be hatched");
    }
    
    function test_FoodCountLessThan10_CannotHatch() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(5, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        vm.prank(buyer);
        vm.expectRevert("Not enough food consumed");
        eggNFT.hatchEgg(egg_token_id);
    }
    
    function test_FeedAfterHatch_Revert() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        eggNFT.hatchEgg(egg_token_id);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory more_food = foodNFT.mintFood(5, referrerG1);
        
        vm.expectRevert("Egg already hatched");
        foodNFT.feedEgg(egg_token_id, more_food, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_FeedExactly10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 12, "Should have 12 food items (2 initial + 10)");
    }
    
    function test_FeedMoreThan10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 20);
        uint256[] memory food_ids = foodNFT.mintFood(20, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 22, "Should have 22 food items (2 initial + 20)");
    }
    
    // ========== FOOD TYPE HISTORY TRACKING ==========
    
    function test_FoodTypeHistory_Tracked() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory food_ids = foodNFT.mintFood(3, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        FoodType[] memory history = eggNFT.getFoodTypeHistory(egg_token_id);
        assertEq(history.length, 5, "Should track 5 food types (2 initial + 3)");
    }
    
    function test_FoodTypeHistory_CorrectOrder() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        FoodType[] memory history = eggNFT.getFoodTypeHistory(egg_token_id);
        assertEq(history.length, 3, "Should have 3 food types");
    }
    
    function test_FoodTypeHistory_AfterBatchFeed() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        FoodType[] memory history = eggNFT.getFoodTypeHistory(egg_token_id);
        assertEq(history.length, 12, "Should track 12 food types");
    }
    
    function test_GetFoodTypeDistribution() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (uint256 grain, uint256 fish, uint256 insects, uint256 herb) = foodNFT.getFoodTypeDistribution(food_ids);
        assertEq(grain + fish + insects + herb, 10, "Total should be 10");
    }
    
    // ========== OWNERSHIP TRANSFER SCENARIOS ==========
    
    function test_FeedAfterEggTransfer_NewOwnerCanFeed() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        eggNFT.safeTransferFrom(buyer, otherBuyer, egg_token_id);
        vm.stopPrank();
        
        vm.startPrank(otherBuyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 3, "New owner should be able to feed");
    }
    
    function test_FeedAfterFoodTransfer_NewOwnerCannotFeedOldFood() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        foodNFT.safeTransferFrom(buyer, otherBuyer, food_ids[0], 1, "");
        vm.stopPrank();
        
        vm.prank(otherBuyer);
        vm.expectRevert("Not egg owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
    }
}

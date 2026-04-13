// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract EggFeedingAnvilIntegrationTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public deployer;
    address public alice;
    address public bob;
    address public referrerG1;
    address public coinStorReserve;
    
    uint256 public constant FOOD_MINT_PRICE = 0.50 * 10^18;
    uint256 public constant EGG_MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
    
    function setUp() public {
        deployer = address(this);
        alice = address(0x01);
        bob = address(0x02);
        referrerG1 = address(0x03);
        coinStorReserve = address(0x04);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve, address(mockUSDT));
        eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
        animalNFT = new AnimalNFT();
        foodNFT = new FoodNFT(
            address(commissionDistribution),
            address(mockUSDT),
            address(eggNFT)
        );
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        eggNFT.setFoodNFTContract(address(foodNFT));
        eggNFT.setAnimalNFTContract(address(animalNFT));
        animalNFT.setEggNFTContract(address(eggNFT));
        
        mockUSDT.mint(alice, INITIAL_BALANCE);
        mockUSDT.mint(bob, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
    }
    
    function test_AnvilEnvironment() public {
        console.log("+========================================================+");
        console.log("|     Egg Feeding System - Anvil Integration Test       |");
        console.log("+========================================================+");
        console.log("");
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        assertEq(block.chainid, 31337, "Should be on Anvil");
        console.log("[OK] Anvil environment configured correctly");
    }
    
    function test_DeployContractsOnAnvil() public {
        console.log("\n+========================================================+");
        console.log("|              Contract Deployment                      |");
        console.log("+========================================================+");
        
        console.log("FoodNFT Address:", address(foodNFT));
        console.log("EggNFT Address:", address(eggNFT));
        console.log("CommissionDistribution Address:", address(commissionDistribution));
        console.log("MockUSDT Address:", address(mockUSDT));
        
        assertEq(address(foodNFT.usdtToken()), address(mockUSDT));
        assertEq(foodNFT.MINT_PRICE(), FOOD_MINT_PRICE);
        assertEq(eggNFT.MINT_PRICE(), EGG_MINT_PRICE);
        
        console.log("[OK] All contracts deployed successfully");
    }
    
    function test_FeedEgg_VerifyEggOwnership() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Egg Ownership Verification                  |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        console.log("    Egg NFT Token ID:", egg_token_id);
        
        console.log("\n[2] Bob mints a Food NFT...");
        vm.startPrank(bob);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(bob, 1, referrerG1);
        vm.stopPrank();
        console.log("    Food NFT ID:", food_ids[0]);
        
        console.log("\n[3] Bob tries to feed Alice's egg (should fail)...");
        vm.prank(bob);
        vm.expectRevert("Not egg owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        console.log("    [OK] Correctly rejected: Bob is not the egg owner");
    }
    
    function test_FeedEgg_VerifyFoodOwnership() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Food Ownership Verification                 |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("\n[2] Alice mints a Food NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(alice, 1, referrerG1);
        vm.stopPrank();
        
        console.log("\n[3] Alice transfers Food NFT to Bob...");
        vm.prank(alice);
        foodNFT.safeTransferFrom(alice, bob, food_ids[0], 1, "");
        console.log("    Food NFT transferred to Bob");
        
        console.log("\n[4] Alice tries to feed with Bob's food (should fail)...");
        vm.prank(alice);
        vm.expectRevert("Not food owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        console.log("    [OK] Correctly rejected: Alice no longer owns the food");
    }
    
    function test_FeedEgg_AlreadyHatched() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Cannot Feed Already Hatched Egg             |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("\n[2] Alice mints 10 Food NFTs...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(alice, 10, referrerG1);
        vm.stopPrank();
        
        console.log("\n[3] Alice feeds the egg...");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        (,,uint256 food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Food count after feeding:", food_count);
        
        console.log("\n[4] Alice hatches the egg...");
        vm.prank(alice);
        eggNFT.hatchEgg(egg_token_id);
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Egg hatched:", is_hatched ? "YES" : "NO");
        
        console.log("\n[5] Alice mints 5 more Food NFTs...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory more_food = foodNFT.mintFood(alice, 5, referrerG1);
        vm.stopPrank();
        
        console.log("\n[6] Alice tries to feed hatched egg (should fail)...");
        vm.prank(alice);
        vm.expectRevert("Egg already hatched");
        foodNFT.feedEgg(egg_token_id, more_food, address(eggNFT));
        
        console.log("    [OK] Correctly rejected: Egg is already hatched");
    }
    
    function test_FeedEgg_BatchFeeding() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Batch Feeding                               |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("\n[2] Alice mints 3 Food NFTs (Batch 1)...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch1 = foodNFT.mintFood(alice, 3, referrerG1);
        vm.stopPrank();
        
        console.log("\n[3] Alice feeds batch 1...");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch1, address(eggNFT));
        (,,uint256 count1,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Food count after batch 1:", count1);
        
        console.log("\n[4] Alice mints 3 Food NFTs (Batch 2)...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch2 = foodNFT.mintFood(alice, 3, referrerG1);
        vm.stopPrank();
        
        console.log("\n[5] Alice feeds batch 2...");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch2, address(eggNFT));
        (,,uint256 count2,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Food count after batch 2:", count2);
        
        console.log("\n[6] Alice mints 4 Food NFTs (Batch 3)...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 4);
        uint256[] memory batch3 = foodNFT.mintFood(alice, 4, referrerG1);
        vm.stopPrank();
        
        console.log("\n[7] Alice feeds batch 3...");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch3, address(eggNFT));
        (,,uint256 count3,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Food count after batch 3:", count3);
        
        assertEq(count3, 12, "Should have 12 food items (2 initial + 10)");
        console.log("    [OK] Batch feeding works correctly");
        
        console.log("\n[8] Alice hatches the egg...");
        vm.prank(alice);
        eggNFT.hatchEgg(egg_token_id);
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("    Egg hatched:", is_hatched ? "YES" : "NO");
        assertEq(is_hatched, true);
        console.log("    [OK] Egg hatched successfully after batch feeding");
    }
    
    function test_FeedEgg_FoodTypeHistory() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Food Type History Tracking                  |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("\n[2] Alice mints 8 Food NFTs...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 8);
        uint256[] memory food_ids = foodNFT.mintFood(alice, 8, referrerG1);
        vm.stopPrank();
        
        console.log("\n[3] Alice feeds the egg...");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        console.log("\n[4] Checking food type history...");
        FoodType[] memory history = eggNFT.getFoodTypeHistory(egg_token_id);
        console.log("    Total food items tracked:", history.length);
        
        uint256 grainCount;
        uint256 fishCount;
        uint256 insectsCount;
        uint256 herbCount;
        
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i] == FoodType.Grain) grainCount++;
            else if (history[i] == FoodType.Fish) fishCount++;
            else if (history[i] == FoodType.Insects) insectsCount++;
            else if (history[i] == FoodType.Herb) herbCount++;
        }
        
        console.log("    Grain:", grainCount);
        console.log("    Fish:", fishCount);
        console.log("    Insects:", insectsCount);
        console.log("    Herb:", herbCount);
        
        assertEq(history.length, 10, "Should track 10 food types (2 initial + 8)");
        console.log("    [OK] Food type history tracked correctly");
    }
    
    function test_FeedEgg_EventEmission() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Event Emission                              |");
        console.log("+========================================================+");
        
        console.log("\n[1] Alice mints an Egg NFT...");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("\n[2] Alice mints 5 Food NFTs...");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(alice, 5, referrerG1);
        vm.stopPrank();
        
        console.log("\n[3] Alice feeds the egg (checking event)...");
        vm.prank(alice);
        vm.expectEmit(true, false, true, true);
        emit EggFed(egg_token_id, food_ids, alice);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        console.log("    [OK] EggFed event emitted correctly");
    }
    
    function test_FeedEgg_GasEstimates() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Gas Estimates                               |");
        console.log("+========================================================+");
        
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(alice, 10, referrerG1);
        vm.stopPrank();
        
        uint256 gasBefore = gasleft();
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        console.log("Gas used for feeding 10 Food NFTs:", gasUsed);
        console.log("Average gas per food item:", gasUsed / 10);
        console.log("    [OK] Gas estimates recorded");
    }
    
    function test_FeedEgg_CompleteFlow() public {
        console.log("\n+========================================================+");
        console.log("|     Test: Complete Egg Feeding Flow                   |");
        console.log("+========================================================+");
        
        console.log("\n=======================================================");
        console.log("PHASE 1: Mint Egg NFT");
        console.log("=======================================================");
        vm.startPrank(alice);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        console.log("[OK] Egg NFT minted (Token ID: %s)", egg_token_id);
        
        console.log("\n=======================================================");
        console.log("PHASE 2: Mint Food NFTs in Batches");
        console.log("=======================================================");
        vm.startPrank(alice);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch1 = foodNFT.mintFood(alice, 3, referrerG1);
        console.log("[OK] Batch 1: 3 Food NFTs minted");
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory batch2 = foodNFT.mintFood(alice, 3, referrerG1);
        console.log("[OK] Batch 2: 3 Food NFTs minted");
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 4);
        uint256[] memory batch3 = foodNFT.mintFood(alice, 4, referrerG1);
        console.log("[OK] Batch 3: 4 Food NFTs minted");
        vm.stopPrank();
        
        console.log("\n=======================================================");
        console.log("PHASE 3: Feed Egg in Multiple Transactions");
        console.log("=======================================================");
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch1, address(eggNFT));
        (,,uint256 c1,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("[OK] Batch 1 fed (Food count: %s)", c1);
        
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch2, address(eggNFT));
        (,,uint256 c2,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("[OK] Batch 2 fed (Food count: %s)", c2);
        
        vm.prank(alice);
        foodNFT.feedEgg(egg_token_id, batch3, address(eggNFT));
        (,,uint256 c3,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("[OK] Batch 3 fed (Food count: %s)", c3);
        
        console.log("\n=======================================================");
        console.log("PHASE 4: Verify Food Count");
        console.log("=======================================================");
        (,,uint256 final_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("Final food count: %s (Expected: 12)", final_count);
        assertEq(final_count, 12, "Should have 12 food items");
        console.log("[OK] Food count verified");
        
        console.log("\n=======================================================");
        console.log("PHASE 5: Hatch Egg");
        console.log("=======================================================");
        vm.prank(alice);
        eggNFT.hatchEgg(egg_token_id);
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("Egg hatched: %s", is_hatched ? "YES" : "NO");
        assertEq(is_hatched, true, "Egg should be hatched");
        console.log("[OK] Egg hatched successfully");
        
        console.log("\n=======================================================");
        console.log("PHASE 6: Verify All Food Burned");
        console.log("=======================================================");
        uint256 totalFood = batch1.length + batch2.length + batch3.length;
        for (uint256 i = 0; i < batch1.length; i++) {
            (,,,bool consumed,) = foodNFT.getFoodProperties(batch1[i]);
            require(consumed, "Food should be consumed");
        }
        for (uint256 i = 0; i < batch2.length; i++) {
            (,,,bool consumed,) = foodNFT.getFoodProperties(batch2[i]);
            require(consumed, "Food should be consumed");
        }
        for (uint256 i = 0; i < batch3.length; i++) {
            (,,,bool consumed,) = foodNFT.getFoodProperties(batch3[i]);
            require(consumed, "Food should be consumed");
        }
        console.log("Total food items burned: %s", totalFood);
        console.log("[OK] All food NFTs burned");
        
        console.log("\n+========================================================+");
        console.log("|          COMPLETE FLOW TEST PASSED OK                  |");
        console.log("+========================================================+");
    }
}

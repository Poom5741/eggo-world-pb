// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract FoodNFTAnvilIntegrationTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public deployer;
    address public buyer;
    address public referrerG1;
    address public referrerG2;
    address public coinStorReserve;
    
    uint256 public constant FOOD_MINT_PRICE = 0.50 * 10^18;
    uint256 public constant EGG_MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    event FoodMinted(uint256[] food_ids, address indexed buyer, uint256 quantity);
    event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
    
    function setUp() public {
        deployer = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        referrerG2 = address(0x3);
        coinStorReserve = address(0x4);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve);
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
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
        mockUSDT.mint(referrerG2, INITIAL_BALANCE);
        
        vm.deal(address(commissionDistribution), INITIAL_BALANCE);
    }
    
    function test_AnvilChainId() public {
        console.log("=== Testing on Anvil ===");
        console.log("Chain ID:", block.chainid);
        assertEq(block.chainid, 31337, "Should be on Anvil");
    }
    
    function test_DeployFoodNFTOnAnvil() public {
        console.log("=== Deploying FoodNFT on Anvil ===");
        console.log("FoodNFT Address:", address(foodNFT));
        console.log("EggNFT Address:", address(eggNFT));
        console.log("CommissionDistribution Address:", address(commissionDistribution));
        console.log("MockUSDT Address:", address(mockUSDT));
        
        assertEq(address(foodNFT.usdtToken()), address(mockUSDT));
        assertEq(foodNFT.MINT_PRICE(), FOOD_MINT_PRICE);
        console.log("[OK] Deployment successful");
    }
    
    function test_CompleteFoodFlowOnAnvil() public {
        console.log("\n=== Testing Complete Food NFT Flow on Anvil ===");
        
        // Step 1: Mint Egg NFT
        console.log("\n--- Step 1: Minting Egg NFT ---");
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        console.log("Egg NFT minted with token ID:", egg_token_id);
        
        (,address own,uint256 initial_food_count,bool isHatched,uint256 raritySeed,address[4] memory refChain,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("Initial food count:", initial_food_count);
        assertEq(initial_food_count, 2, "Egg should start with 2 food");
        
        // Step 2: Mint 10 Food NFTs
        console.log("\n--- Step 2: Minting 10 Food NFTs ---");
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        vm.stopPrank();
        
        console.log("Food NFTs minted:", food_ids.length);
        console.log("Total cost: 5.00 USDT");
        
        assertEq(food_ids.length, 10, "Should mint 10 Food NFTs");
        
        // Step 3: Feed egg with food NFTs
        console.log("\n--- Step 3: Feeding Egg with Food NFTs ---");
        vm.startPrank(buyer);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        console.log("Egg fed with", food_ids.length, "food items");
        
        (,address own2,uint256 new_food_count,bool isHatched2,uint256 raritySeed2,address[4] memory refChain2,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        console.log("New food count:", new_food_count);
        assertEq(new_food_count, 12, "Egg should have 12 food (2 initial + 10 fed)");
        
        // Step 4: Verify food NFTs are burned
        console.log("\n--- Step 4: Verifying Food NFTs Burned ---");
        uint256 burnedCount = 0;
        for (uint256 i = 0; i < food_ids.length; i++) {
            (,,,bool is_consumed,) = foodNFT.getFoodProperties(food_ids[i]);
            if (is_consumed) {
                burnedCount++;
            }
        }
        console.log("Burned food NFTs:", burnedCount);
        assertEq(burnedCount, 10, "All food NFTs should be burned");
        
        // Step 5: Hatch the egg
        console.log("\n--- Step 5: Hatching Egg ---");
        vm.prank(buyer);
        eggNFT.hatchEgg(egg_token_id);
        
        bool is_hatched = eggNFT.isEggHatched(egg_token_id);
        console.log("Egg hatched:", is_hatched);
        assertTrue(is_hatched, "Egg should be hatched");
        
        console.log("\n=== Complete Flow Test PASSED ===");
    }
    
    function test_BatchMint100FoodNFTsOnAnvil() public {
        console.log("\n=== Testing Batch Mint 100 Food NFTs on Anvil ===");
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 100);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 100, referrerG1);
        vm.stopPrank();
        
        console.log("Batch minted", food_ids.length, "Food NFTs");
        assertEq(food_ids.length, 100, "Should mint 100 Food NFTs");
        
        // Verify ownership
        uint256 ownedCount = 0;
        for (uint256 i = 0; i < food_ids.length; i++) {
            (, address owner,,,) = foodNFT.getFoodProperties(food_ids[i]);
            if (owner == buyer) {
                ownedCount++;
            }
        }
        console.log("Owned by buyer:", ownedCount);
        assertEq(ownedCount, 100, "Buyer should own all 100 Food NFTs");
        
        console.log("[OK] Batch mint test PASSED");
    }
    
    function test_FoodTypeDistributionOnAnvil() public {
        console.log("\n=== Testing Food Type Distribution on Anvil ===");
        
        uint256 grainCount = 0;
        uint256 fishCount = 0;
        uint256 insectsCount = 0;
        uint256 herbCount = 0;
        uint256 totalMints = 100;
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * totalMints);
        
        for (uint256 i = 0; i < totalMints; i++) {
            uint256[] memory food_ids = foodNFT.mintFood(buyer, 1, referrerG1);
            (,, FoodType foodType,,) = foodNFT.getFoodProperties(food_ids[0]);
            
            if (foodType == FoodType.Grain) grainCount++;
            else if (foodType == FoodType.Fish) fishCount++;
            else if (foodType == FoodType.Insects) insectsCount++;
            else if (foodType == FoodType.Herb) herbCount++;
        }
        vm.stopPrank();
        
        console.log("Grain:", grainCount, "(Expected ~40)");
        console.log("Fish:", fishCount, "(Expected ~30)");
        console.log("Insects:", insectsCount, "(Expected ~20)");
        console.log("Herb:", herbCount, "(Expected ~10)");
        
        // Verify distribution is within reasonable range
        assertTrue(grainCount > 25 && grainCount < 55, "Grain should be ~40%");
        assertTrue(fishCount > 15 && fishCount < 45, "Fish should be ~30%");
        assertTrue(insectsCount > 10 && insectsCount < 30, "Insects should be ~20%");
        assertTrue(herbCount > 5 && herbCount < 20, "Herb should be ~10%");
        
        console.log("[OK] Food type distribution test PASSED");
    }
    
    function test_CommissionDistributionOnAnvil() public {
        console.log("\n=== Testing Commission Distribution on Anvil ===");
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        foodNFT.mintFood(buyer, 1, referrerG1);
        vm.stopPrank();
        
        uint256 g1Expected = (FOOD_MINT_PRICE * 20) / 100;
        uint256 g1Balance = commissionDistribution.getCommissionBalance(referrerG1);
        
        console.log("G1 Commission Balance:", g1Balance);
        console.log("Expected:", g1Expected);
        
        assertEq(g1Balance, g1Expected, "G1 should get 20% commission");
        
        console.log("[OK] Commission distribution test PASSED");
    }
    
    function test_CannotHatchWithoutEnoughFoodOnAnvil() public {
        console.log("\n=== Testing Hatch Requirement on Anvil ===");
        
        // Mint egg
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // Try to hatch without enough food (should fail)
        vm.expectRevert("Not enough food consumed");
        eggNFT.hatchEgg(egg_token_id);
        vm.stopPrank();
        
        console.log("[OK] Cannot hatch without 10 food items (as expected)");
        
        // Feed only 5 food
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        // Try to hatch with only 7 food (2 initial + 5)
        vm.expectRevert("Not enough food consumed");
        eggNFT.hatchEgg(egg_token_id);
        vm.stopPrank();
        
        console.log("[OK] Cannot hatch with only 7 food items (as expected)");
    }
    
    function test_GasEstimatesOnAnvil() public {
        console.log("\n=== Gas Estimates on Anvil ===");
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        
        uint256 gasBefore = gasleft();
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        uint256 gasAfter = gasleft();
        
        console.log("Gas used for minting 10 Food NFTs:", gasBefore - gasAfter);
        
        vm.stopPrank();
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        gasBefore = gasleft();
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        gasAfter = gasleft();
        
        console.log("Gas used for feeding 10 Food NFTs:", gasBefore - gasAfter);
        vm.stopPrank();
    }
}

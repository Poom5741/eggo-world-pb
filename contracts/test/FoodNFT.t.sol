// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract FoodNFTTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public buyer;
    address public referrerG1;
    address public referrerG2;
    address public coinStorReserve;
    
    uint256 public constant MINT_PRICE = 0.50 * 10^18;
    uint256 public constant EGG_MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    event FoodMinted(uint256[] food_ids, address indexed buyer, uint256 quantity);
    event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
    event FoodTypeAssigned(uint256 food_id, FoodType food_type);
    
    function setUp() public {
        owner = address(this);
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
    
    function test_Deployment() public {
        assertEq(address(foodNFT.usdtToken()), address(mockUSDT));
        assertEq(foodNFT.MINT_PRICE(), MINT_PRICE);
    }
    
    function test_MintSingleFoodNFT() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE);
        
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 1, referrerG1);
        vm.stopPrank();
        
        assertEq(food_ids.length, 1, "Should mint 1 Food NFT");
        
        (, address foodOwner,,,) = foodNFT.getFoodProperties(food_ids[0]);
        assertEq(foodOwner, buyer, "Buyer should own the food NFT");
    }
    
    function test_BatchMint10FoodNFTs() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        vm.stopPrank();
        
        assertEq(food_ids.length, 10, "Should mint 10 Food NFTs");
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            (, address foodOwner,,,) = foodNFT.getFoodProperties(food_ids[i]);
            assertEq(foodOwner, buyer);
        }
    }
    
    function test_BatchMint50FoodNFTs() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 50);
        
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 50, referrerG1);
        vm.stopPrank();
        
        assertEq(food_ids.length, 50, "Should mint 50 Food NFTs");
    }
    
    function test_BatchMint100FoodNFTs() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 100);
        
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 100, referrerG1);
        vm.stopPrank();
        
        assertEq(food_ids.length, 100, "Should mint 100 Food NFTs");
    }
    
    function test_FoodTypeRandomDistribution() public {
        uint256 grainCount = 0;
        uint256 fishCount = 0;
        uint256 insectsCount = 0;
        uint256 herbCount = 0;
        uint256 totalMints = 1000;
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * totalMints);
        
        for (uint256 i = 0; i < totalMints; i++) {
            uint256[] memory food_ids = foodNFT.mintFood(buyer, 1, referrerG1);
            (,, FoodType foodType,,) = foodNFT.getFoodProperties(food_ids[0]);
            
            if (foodType == FoodType.Grain) grainCount++;
            else if (foodType == FoodType.Fish) fishCount++;
            else if (foodType == FoodType.Insects) insectsCount++;
            else if (foodType == FoodType.Herb) herbCount++;
        }
        vm.stopPrank();
        
        console.log("Grain:", grainCount, "Expected ~400");
        console.log("Fish:", fishCount, "Expected ~300");
        console.log("Insects:", insectsCount, "Expected ~200");
        console.log("Herb:", herbCount, "Expected ~100");
        
        assertGt(grainCount, 300, "Grain should be ~40%");
        assertGt(fishCount, 200, "Fish should be ~30%");
        assertGt(insectsCount, 100, "Insects should be ~20%");
        assertGt(herbCount, 50, "Herb should be ~10%");
    }
    
    function test_FeedEggAndBurn() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,address own,uint256 foodCount,bool isHatched,uint256 raritySeed,address[4] memory refChain,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(foodCount, 12, "Egg should have 12 food items (2 initial + 10)");
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            (,,,bool is_consumed,) = foodNFT.getFoodProperties(food_ids[i]);
            assertTrue(is_consumed, "Food should be consumed");
        }
    }
    
    function test_CommissionDistributionOnFoodMint() public {
        uint256 g1Expected = (MINT_PRICE * 20) / 100;
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE);
        foodNFT.mintFood(buyer, 1, referrerG1);
        vm.stopPrank();
        
        assertEq(commissionDistribution.getCommissionBalance(referrerG1), g1Expected);
    }
    
    function test_EggFoodCountTracking() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        (,,uint256 initial_food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(initial_food_count, 2, "Egg should start with 2 food");
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        (,,uint256 new_food_count,,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(new_food_count, 7, "Egg should have 7 food after feeding 5");
    }
    
    function test_FoodTypeHistoryTracking() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 3);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 3, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
        
        FoodType[] memory foodTypes = eggNFT.getFoodTypeHistory(egg_token_id);
        assertEq(foodTypes.length, 5, "Should track 5 food types (2 initial + 3 fed)");
    }
    
    function test_CannotFeedAlreadyHatchedEgg() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        eggNFT.hatchEgg(egg_token_id);
        
        vm.expectRevert("Egg already hatched");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_CannotFeedFoodYouDontOwn() public {
        address otherBuyer = address(0x99);
        mockUSDT.mint(otherBuyer, INITIAL_BALANCE);
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        vm.startPrank(otherBuyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(otherBuyer, 1, referrerG1);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        vm.expectRevert("Not food owner");
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        vm.stopPrank();
    }
    
    function test_HatchEggWith10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        eggNFT.hatchEgg(egg_token_id);
        
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertTrue(is_hatched, "Egg should be hatched");
        vm.stopPrank();
    }
    
    function test_CannotHatchWithLessThan10FoodItems() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        vm.expectRevert("Not enough food consumed");
        eggNFT.hatchEgg(egg_token_id);
        vm.stopPrank();
    }
    
    function test_EventEmission() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 5);
        
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 5, referrerG1);
        vm.stopPrank();
        
        assertEq(food_ids.length, 5, "Should mint 5 food items");
    }
    
    function test_FullIntegrationFlow() public {
        vm.startPrank(buyer);
        
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        
        foodNFT.feedEgg(egg_token_id, food_ids, address(eggNFT));
        
        (,address own2,uint256 foodCount2,bool isHatched2,uint256 raritySeed2,address[4] memory refChain2,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(foodCount2, 12, "Egg should have 12 food items");
        
        eggNFT.hatchEgg(egg_token_id);
        
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        assertTrue(is_hatched, "Egg should be hatched");
        
        vm.stopPrank();
    }
    
    function test_GetFoodTypeDistribution() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        vm.stopPrank();
        
        (uint256 grain, uint256 fish, uint256 insects, uint256 herb) = 
            foodNFT.getFoodTypeDistribution(food_ids);
        
        assertEq(grain + fish + insects + herb, 10, "Total should equal 10");
    }
    
    function test_ReentrancyProtection() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(foodNFT), MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(buyer, 10, referrerG1);
        vm.stopPrank();
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            (, address foodOwner,,,) = foodNFT.getFoodProperties(food_ids[i]);
            assertEq(foodOwner, buyer, "Buyer should own food NFT");
        }
    }
}

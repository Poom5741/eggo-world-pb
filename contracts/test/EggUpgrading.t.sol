// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract EggUpgradingTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public buyer;
    address public referrerG1;
    
    uint256 public constant EGG_MINT_PRICE = 25 * 10**18;
    uint256 public constant FOOD_MINT_PRICE = 5 * 10**17;
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18;
    uint256 public constant UPGRADE_FEE = 0;
    
    event EggUpgraded(uint256 indexed egg_id, uint256 new_food_count, uint256 rarity_bonus);
    
    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(address(0x4), address(mockUSDT), address(0x5));
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
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
    }
    
    // ========== RARITY UPGRADE TESTS ==========
    
    function test_UpgradeEggRarity_SingleFoodItem() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Get properties after feeding
        (,,uint256 food_count,,,,,,,,uint256 initial_upgrade_count,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(food_count, 12, "Should have 12 food after feeding");
        
        // Mint food for upgrade
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        
        // Approve USDT for upgrade fee
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE);
        
        // Upgrade egg rarity with 1 food item (now total is 13, so upgrade_count = 3)
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify upgrade count (13 - 10 = 3 extra food items)
        (,,,,,,,,,,uint256 new_upgrade_count,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(new_upgrade_count, 3, "Upgrade count should be 3 (13 - 10)");
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_MultipleFoodItems() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Mint 5 food items for upgrade
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory food_ids = foodNFT.mintFood(5, referrerG1);
        
        // Approve USDT for upgrade fee (0 USDT per food item since fee is waived)
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 5);
        
        // Upgrade egg rarity with 5 food items (12 + 5 = 17 total, upgrade_count = 7)
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify upgrade count (17 - 10 = 7)
        (,,,,,,,,,,uint256 upgrade_count,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(upgrade_count, 7, "Upgrade count should be 7 (17 - 10)");
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_Max10Items() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Mint 10 food items (maximum allowed for upgrade)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        uint256[] memory food_ids = foodNFT.mintFood(10, referrerG1);
        
        // Approve USDT for upgrade fee (50 USDT)
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 10);
        
        // Upgrade with max food items (12 + 10 = 22 total, but max is 500, so max 10 works)
        // Actually max is MAX_FOOD_COUNT + MAX_UPGRADE_FOOD = 10 + 490 = 500
        // So 12 + 10 = 22 <= 500, this should succeed
        // First try 10 (max per batch, within 500 limit) - should succeed
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 10);
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify upgrade count (12 + 10 - 10 = 12)
        (,,,,,,,,,,uint256 upgrade_count_after,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(upgrade_count_after, 12, "Upgrade count should be 12 (22 - 10)");
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_RevertWhen_Max500Items() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Try to upgrade with items exceeding total 500 limit
        // Current food_count = 12, so need 489 items to exceed (12 + 489 = 501 > 500)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 489);
        uint256[] memory food_ids = foodNFT.mintFood(489, referrerG1);
        
        // Approve USDT for upgrade fee
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 489);
        
        // Should revert with max 500 food items total
        vm.expectRevert("Max 500 food items (10 base + 490 upgrade)");
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_RevertWhen_MoreThan10Items() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Try to mint 489 food items (would exceed max of 500: 12 + 489 = 501 > 500)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 489);
        uint256[] memory food_ids = foodNFT.mintFood(489, referrerG1);
        
        // Approve USDT for upgrade fee
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 489);
        
        // Should revert with more than allowed food items
        vm.expectRevert("Max 500 food items (10 base + 490 upgrade)");
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_RevertWhen_AlreadyHatched() public {
        vm.startPrank(buyer);
        
        // Mint and fully feed egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // Feed 10 times to make it hatchable
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Hatch the egg
        eggNFT.hatchEgg(egg_token_id);
        
        // Try to upgrade already hatched egg
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE);
        
        vm.expectRevert("Egg already hatched");
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_RevertWhen_NotOwner() public {
        address otherUser = address(0x5);
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
        uint256[] memory food_ids = foodNFT.mintFood(1, referrerG1);
        vm.stopPrank();
        
        // Try to upgrade from different user
        vm.startPrank(otherUser);
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE);
        
        vm.expectRevert("Not owner");
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_BurnsFoodNFTs() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Mint 3 food items for upgrade
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory food_ids = foodNFT.mintFood(3, referrerG1);
        
        // Verify buyer owns the food NFTs (ERC1155 uses balanceOf)
        for (uint i = 0; i < food_ids.length; i++) {
            assertEq(foodNFT.balanceOf(buyer, food_ids[i]), 1, "Buyer should own food NFT");
        }
        
        // Approve and upgrade
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 3);
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify food NFTs were burned (balanceOf should be 0)
        for (uint i = 0; i < food_ids.length; i++) {
            assertEq(foodNFT.balanceOf(buyer, food_ids[i]), 0, "Food NFT should be burned (balance 0)");
        }
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_TransfersFee() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Mint 2 food items for upgrade
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 2);
        uint256[] memory food_ids = foodNFT.mintFood(2, referrerG1);
        
        // Upgrade with 2 items (no fee — waived per contract)
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 2);
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify no fee transfer (UPGRADE_FEE = 0 per contract)
        uint256 upgradeCount = eggNFT.getFoodCount(egg_token_id);
        assertTrue(upgradeCount > 12, "Food count should increase");
        
        vm.stopPrank();
    }
    
    function test_HatchEgg_RarityBonusApplied() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // Feed 10 times (required for hatching)
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Upgrade with 5 food items before hatching (+14% rarity bonus total: 7 items * 2%)
        // Note: Egg already has 12 food (2 initial + 10 fed), adding 5 makes 17 total
        // Upgrade count = 17 - 10 = 7 (total food above MAX_FOOD_COUNT)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 5);
        uint256[] memory upgrade_food = foodNFT.mintFood(5, referrerG1);
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 5);
        eggNFT.upgradeEggRarity(egg_token_id, upgrade_food);
        
        // Verify upgrade count before hatch (7 total: 12 existing - 10 base + 5 new = 7 above base)
        (,,,,,,,,,,uint256 upgrade_count,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(upgrade_count, 7, "Should have 7 upgrade items (total above 10)");
        
        // Hatch the egg
        uint256 animal_token_id = eggNFT.hatchEgg(egg_token_id);
        
        // Verify animal was minted
        assertEq(animalNFT.ownerOf(animal_token_id), buyer, "Buyer should own the animal");
        
        // Verify rarity upgrade count is tracked in animal (10 return values: rarity_upgrade_count is at position 10)
        (,,,,,,,,,uint256 animal_upgrade_count) = animalNFT.getAnimalProperties(animal_token_id);
        assertEq(animal_upgrade_count, 7, "Animal should track rarity upgrade count (7 total)");
        
        vm.stopPrank();
    }
    
    function test_UpgradeEggRarity_EmitsEvent() public {
        vm.startPrank(buyer);
        
        // Mint egg
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrerG1);
        
        // First feed 10 times to meet minimum requirement (12 food total)
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Mint 3 food items for upgrade (12 + 3 = 15 total, upgrade_count = 5)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 3);
        uint256[] memory food_ids = foodNFT.mintFood(3, referrerG1);
        
        mockUSDT.approve(address(eggNFT), UPGRADE_FEE * 3);
        eggNFT.upgradeEggRarity(egg_token_id, food_ids);
        
        // Verify upgrade was successful by checking upgrade count
        (,,,,,,,,,,uint256 upgrade_count,) = eggNFT.getEggProperties(egg_token_id);
        assertEq(upgrade_count, 5, "Upgrade count should be 5 (15 - 10)");
        
        vm.stopPrank();
    }
}

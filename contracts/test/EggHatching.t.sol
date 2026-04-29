// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AnimalNFT, Rarity, Species} from "../src/AnimalNFT.sol";
import {EggNFT, FoodType} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract EggHatchingTest is Test {
    AnimalNFT public animalNFT;
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public usdtToken;
    VRFCoordinatorV2_5Mock public vrfCoordinatorMock;
    
    address public owner = address(1);
    address public coinStorReserve = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public referrer = address(5);
    
    uint256 constant MINT_PRICE = 25 * 10^18;
    uint256 constant MAX_FOOD_COUNT = 10;
    uint256 constant INITIAL_FOOD_COUNT = 2;
    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash = bytes32(uint256(0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26));
    
    event EggHatched(
        uint256 indexed egg_id,
        uint256 indexed animal_id,
        Rarity rarity,
        Species species
    );
    
    function setUp() public {
        vm.startPrank(owner);
        
        usdtToken = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve, address(usdtToken), address(0x5));
        
        // Deploy mock VRF coordinator
        vrfCoordinatorMock = new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18);
        
        eggNFT = new EggNFT(payable(address(commissionDistribution)), address(usdtToken), address(vrfCoordinatorMock));
        animalNFT = new AnimalNFT();
        foodNFT = new FoodNFT(payable(address(commissionDistribution)), address(usdtToken), address(eggNFT));
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        eggNFT.setFoodNFTContract(address(foodNFT));
        eggNFT.setAnimalNFTContract(address(animalNFT));
        animalNFT.setEggNFTContract(address(eggNFT));
        
        // Setup VRF subscription
        vrfSubscriptionId = vrfCoordinatorMock.createSubscription();
        vrfCoordinatorMock.addConsumer(vrfSubscriptionId, address(eggNFT));
        vrfCoordinatorMock.fundSubscription(vrfSubscriptionId, 100 ether);
        eggNFT.setVRFConfig(vrfSubscriptionId, vrfKeyHash);
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        vm.stopPrank();
    }
    
    function _mintAndApproveUSDT(address user, uint256 amount) internal {
        vm.startPrank(user);
        usdtToken.mint(user, amount);
        usdtToken.approve(address(eggNFT), amount);
        usdtToken.approve(address(foodNFT), amount);
        vm.stopPrank();
    }
    
    function _mintEgg(address user, address ref) internal returns (uint256) {
        vm.startPrank(user);
        uint256 tokenId = eggNFT.mintEgg(ref);
        vm.stopPrank();
        return tokenId;
    }
    
    function _feedEgg(uint256 eggTokenId, uint256 quantity) internal {
        vm.startPrank(user1);
        uint256 foodCost = quantity * 50 * 10^16;
        usdtToken.mint(user1, foodCost);
        usdtToken.approve(address(foodNFT), foodCost);
        uint256[] memory foodIds = foodNFT.mintFood(quantity, referrer);
        foodNFT.feedEgg(eggTokenId, foodIds, address(eggNFT));
        vm.stopPrank();
    }
    
    // ==================== BASIC HATCHING TESTS (VRF TWO-PHASE) ====================
    
    function test_HatchEgg_VRFRequest_ReturnsRequestId() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        (,,,bool isHatched,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertFalse(isHatched);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
        
        assertGt(requestId, 0, "Should return valid request ID");
        
        // Verify egg is NOT yet hatched
        (,,,isHatched,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertFalse(isHatched, "Egg should not be hatched until claimHatch");
    }
    
    function test_ClaimHatch_Success_AfterVRFFulfillment() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
        
        // Simulate VRF fulfillment
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        
        // Now claim the hatch
        vm.startPrank(user1);
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        assertGt(animalTokenId, 0, "Should return valid animal token ID");
        assertEq(animalNFT.ownerOf(animalTokenId), user1);
        assertEq(eggNFT.getAnimalId(eggTokenId), animalTokenId);
    }
    
    function test_HatchEgg_AnimalNFTHasCorrectProperties() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
        
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        
        vm.startPrank(user1);
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        (
            uint256 animalId,
            address animalOwner,
            Species animalSpecies,
            Rarity animalRarity,
            uint256 animalGeneration,
            uint256[] memory animalFoodDistribution,
            uint256 parentEggId,
            uint256 parent1Id,
            uint256 parent2Id,
            uint256 upgradeCount
        ) = animalNFT.getAnimalProperties(animalTokenId);
        
        assertEq(animalId, 1);
        assertEq(animalOwner, user1);
        assertEq(animalGeneration, 0);
        
        assertTrue(uint256(animalRarity) >= 0 && uint256(animalRarity) <= 3);
        assertTrue(uint256(animalSpecies) >= 0 && uint256(animalSpecies) <= 11);
    }
    
    function test_HatchEgg_EggMarkedAsHatched() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
        
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        
        vm.startPrank(user1);
        eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        (,,,bool isHatched,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertTrue(isHatched);
        
        assertTrue(eggNFT.isEggHatched(eggTokenId));
    }
    
    // ==================== VERIFICATION TESTS ====================
    
    function test_HatchEgg_RevertWhen_InsufficientFood() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (5 * 0.50 * 10^18));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 5);
        
        (,,uint256 foodCount,,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertEq(foodCount, 7);
        
        vm.startPrank(user1);
        vm.expectRevert("Not enough food consumed");
        eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
    }
    
    function test_ClaimHatch_RevertWhen_VRFNotFulfilled() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        eggNFT.hatchEgg(eggTokenId);
        
        // Try to claim before VRF fulfillment
        vm.expectRevert("VRF randomness not yet fulfilled");
        eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
    }
    
    function test_ClaimHatch_RevertWhen_AlreadyHatched() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        eggNFT.claimHatch(eggTokenId);
        
        vm.expectRevert("Egg already hatched");
        eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
    }
    
    function test_HatchEgg_RevertWhen_NotOwner() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user2);
        vm.expectRevert("Not token owner");
        eggNFT.hatchEgg(eggTokenId);
        vm.stopPrank();
    }
    
    // ==================== FOOD TYPE INFLUENCE TESTS ====================
    
    function test_HatchEgg_SpeciesVariesWithFoodTypes() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (16 * 50 * 10^16));
        
        uint256 eggTokenId1 = _mintEgg(user1, referrer);
        uint256 eggTokenId2 = _mintEgg(user1, referrer);
        
        _feedEgg(eggTokenId1, 8);
        _feedEgg(eggTokenId2, 8);
        
        vm.startPrank(user1);
        uint256 requestId1 = eggNFT.hatchEgg(eggTokenId1);
        uint256 requestId2 = eggNFT.hatchEgg(eggTokenId2);
        vrfCoordinatorMock.fulfillRandomWords(requestId1, address(eggNFT));
        vrfCoordinatorMock.fulfillRandomWords(requestId2, address(eggNFT));
        uint256 animalTokenId1 = eggNFT.claimHatch(eggTokenId1);
        uint256 animalTokenId2 = eggNFT.claimHatch(eggTokenId2);
        vm.stopPrank();
        
        Species species1 = animalNFT.getSpecies(animalTokenId1);
        Species species2 = animalNFT.getSpecies(animalTokenId2);
        
        console2.log("Animal 1 species:", uint256(species1));
        console2.log("Animal 2 species:", uint256(species2));
    }
    
    // ==================== EDGE CASES ====================
    
    function test_HatchEgg_Exactly10FoodItems() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        (,,uint256 foodCount,,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertEq(foodCount, MAX_FOOD_COUNT);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        assertGt(animalTokenId, 0);
    }
    
    function test_HatchEgg_MoreThan10FoodItems() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (12 * 0.50 * 10^18));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 12);
        
        (,,uint256 foodCount,,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertEq(foodCount, 14);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        assertGt(animalTokenId, 0);
    }
    
    function test_HatchEgg_OwnershipTransferBeforeHatching() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        _feedEgg(eggTokenId, 8);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        eggNFT.safeTransferFrom(user1, user2, eggTokenId);
        vm.stopPrank();
        
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        
        vm.startPrank(user2);
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        assertEq(animalNFT.ownerOf(animalTokenId), user2);
    }
    
    // ==================== INTEGRATION TESTS ====================
    
    function test_HatchEgg_FullFlow_MintFeedHatch() public {
        _mintAndApproveUSDT(user1, MINT_PRICE + (8 * 50 * 10^16));
        
        uint256 eggTokenId = _mintEgg(user1, referrer);
        
        (,,uint256 initialFoodCount,,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertEq(initialFoodCount, INITIAL_FOOD_COUNT);
        
        _feedEgg(eggTokenId, 8);
        
        (,,uint256 finalFoodCount,,,,,,,,,) = eggNFT.getEggProperties(eggTokenId);
        assertEq(finalFoodCount, MAX_FOOD_COUNT);
        
        vm.startPrank(user1);
        uint256 requestId = eggNFT.hatchEgg(eggTokenId);
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
        uint256 animalTokenId = eggNFT.claimHatch(eggTokenId);
        vm.stopPrank();
        
        assertEq(animalNFT.ownerOf(animalTokenId), user1);
        assertTrue(eggNFT.isEggHatched(eggTokenId));
        
        (,,,,uint256 generation,,,,,) = animalNFT.getAnimalProperties(animalTokenId);
        assertEq(generation, 0);
    }
    
    // ==================== STATISTICAL RARITY DISTRIBUTION TEST ====================
    
    function test_HatchEgg_RarityDistribution_100Eggs() public {
        uint256 commonCount = 0;
        uint256 rareCount = 0;
        uint256 epicCount = 0;
        uint256 legendaryCount = 0;
        
        uint256 numEggs = 100;
        uint256 totalCost = MINT_PRICE * numEggs + (8 * 50 * 10^16) * numEggs;
        _mintAndApproveUSDT(user1, totalCost);
        
        uint256[] memory eggTokenIds = new uint256[](numEggs);
        
        for (uint256 i = 0; i < numEggs; i++) {
            eggTokenIds[i] = _mintEgg(user1, referrer);
            _feedEgg(eggTokenIds[i], 8);
        }
        
        vm.startPrank(user1);
        for (uint256 i = 0; i < numEggs; i++) {
            uint256 requestId = eggNFT.hatchEgg(eggTokenIds[i]);
            vrfCoordinatorMock.fulfillRandomWords(requestId, address(eggNFT));
            uint256 animalTokenId = eggNFT.claimHatch(eggTokenIds[i]);
            Rarity rarity = animalNFT.getRarity(animalTokenId);
            
            if (rarity == Rarity.Common) commonCount++;
            else if (rarity == Rarity.Rare) rareCount++;
            else if (rarity == Rarity.Epic) epicCount++;
            else if (rarity == Rarity.Legendary) legendaryCount++;
        }
        vm.stopPrank();
        
        console2.log("Rarity Distribution (100 eggs):");
        console2.log("Rarity Distribution - Common:", commonCount);
        console2.log("Rarity Distribution - Rare:", rareCount);
        console2.log("Rarity Distribution - Epic:", epicCount);
        console2.log("Rarity Distribution - Legendary:", legendaryCount);
        
        uint256 commonPercent = (commonCount * 100) / numEggs;
        uint256 rarePercent = (rareCount * 100) / numEggs;
        uint256 epicPercent = (epicCount * 100) / numEggs;
        uint256 legendaryPercent = (legendaryCount * 100) / numEggs;
        
        assertGt(commonPercent, 55);
        assertLt(commonPercent, 70);
        
        assertGt(rarePercent, 15);
        assertLt(rarePercent, 35);
        
        assertGt(epicPercent, 5);
        assertLt(epicPercent, 20);
        
        assertGt(legendaryPercent, 0);
        assertLt(legendaryPercent, 10);
    }
    
    // ==================== HELPER FUNCTION TESTS ====================
    
    function test_CalculateRarity_Boundaries() public view {
        uint256[] memory seeds = new uint256[](4);
        seeds[0] = 0;
        seeds[1] = 60;
        seeds[2] = 85;
        seeds[3] = 97;
        
        for (uint256 i = 0; i < seeds.length; i++) {
            console2.log("Seed:", seeds[i]);
        }
    }
}

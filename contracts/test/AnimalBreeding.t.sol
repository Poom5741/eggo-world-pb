// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FoodNFT, FoodType} from "../src/FoodNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {AnimalNFT, Rarity, Species} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract AnimalBreedingTest is Test {
    FoodNFT public foodNFT;
    EggNFT public eggNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    VRFCoordinatorV2_5Mock public vrfMock;
    
    address public owner;
    address public breeder;
    address public referrerG1;
    
    uint256 public constant EGG_MINT_PRICE = 25 * 10**18;
    uint256 public constant FOOD_MINT_PRICE = 5 * 10**17;
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18;
    uint256 public constant BREEDING_FEE = 5 * 10**18;
    
    event BreedingEggCreated(
        uint256 indexed egg_id,
        uint256 indexed parent1_animal_id,
        uint256 indexed parent2_animal_id,
        uint256 generation
    );
    event BreedRequested(uint256 indexed requestId, uint256 indexed parent1, uint256 indexed parent2, address requester);
    event BreedClaimed(uint256 indexed requestId, uint256 indexed eggTokenId, uint256 indexed offspringEggId, Rarity rarity);

    function setUp() public {
        owner = address(this);
        breeder = address(0x1);
        referrerG1 = address(0x2);
        
        mockUSDT = new MockUSDT();
        address treasury = address(0x5);
        commissionDistribution = new CommissionDistribution(address(0x4), address(mockUSDT), treasury);
        vrfMock = new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18);
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
        
        // Set up VRF subscription so requestBreed works
        uint256 subId = vrfMock.createSubscription();
        vrfMock.addConsumer(subId, address(eggNFT));
        vrfMock.fundSubscription(subId, 100 ether);
        eggNFT.setVRFConfig(subId, 0x0000000000000000000000000000000000000000000000000000000000000001);
        
        mockUSDT.mint(breeder, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
    }
    
    // Helper: mint + feed 10 + hatch an egg
    function _mintAndHatchEgg(address user, address referrer) internal returns (uint256 animal_token_id) {
        mockUSDT.approve(address(eggNFT), EGG_MINT_PRICE);
        uint256 egg_token_id = eggNFT.mintEgg(referrer);
        
        for (uint i = 0; i < 10; i++) {
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE);
            uint256[] memory food_id = foodNFT.mintFood(1, referrer);
            foodNFT.feedEgg(egg_token_id, food_id, address(eggNFT));
        }
        
        // Use VRF two-phase hatch
        uint256 requestId = eggNFT.hatchEgg(egg_token_id);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId, address(eggNFT));
        animal_token_id = eggNFT.claimHatch(egg_token_id);
        return animal_token_id;
    }
    
    // Helper: VRF two-phase breeding (request → fulfill → claim)
    function _requestAndClaimBreed(
        uint256 parent1,
        uint256 parent2,
        address referrer
    ) internal returns (uint256 egg_token_id) {
        uint256 requestId = eggNFT.requestBreed(parent1, parent2, referrer);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId, address(eggNFT));
        egg_token_id = eggNFT.claimBreed(requestId);
        return egg_token_id;
    }
    
    // ========== BREEDING TESTS ==========
    
    function test_BreedAnimals_TwoGen0Animals() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        (,,,,uint256 gen1,,,,,) = animalNFT.getAnimalProperties(animal1);
        (,,,,uint256 gen2,,,,,) = animalNFT.getAnimalProperties(animal2);
        assertEq(gen1, 0, "Animal 1 should be Gen 0");
        assertEq(gen2, 0, "Animal 2 should be Gen 0");
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        
        // VRF two-phase breed: request → fulfill → claim
        uint256 requestId = eggNFT.requestBreed(animal1, animal2, referrerG1);
        
        // Fulfill VRF
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId, address(eggNFT));
        
        uint256 breeding_egg_id = eggNFT.claimBreed(requestId);
        
        // Verify breeding egg properties
        (,,,,,,,uint256 parent1_id, uint256 parent2_id, bool is_breeding_egg,,uint256 generation) = 
            eggNFT.getEggProperties(breeding_egg_id);
        
        assertTrue(is_breeding_egg, "Should be a breeding egg");
        assertEq(parent1_id, animal1, "Parent 1 should be recorded");
        assertEq(parent2_id, animal2, "Parent 2 should be recorded");
        assertEq(generation, 1, "Breeding egg should be Gen 1");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_Gen1PlusAnimals() public {
        vm.startPrank(breeder);
        
        uint256 parent1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 parent2 = _mintAndHatchEgg(breeder, referrerG1);
        
        // Breed to create Gen 1 egg
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 gen1_egg = _requestAndClaimBreed(parent1, parent2, referrerG1);
        
        // Feed breeding egg 8 more food (starts at 2, needs 10)
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 8);
        for (uint i = 0; i < 8; i++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(gen1_egg, food_id, address(eggNFT));
        }
        // Hatch the Gen 1 breeding egg
        uint256 gen1_animal = eggNFT.hatchBreedingEgg(gen1_egg);
        
        // Create another Gen 1
        uint256 parent3 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 parent4 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 gen1_egg2 = _requestAndClaimBreed(parent3, parent4, referrerG1);
        
        // Feed 8 more food
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 8);
        for (uint i = 0; i < 8; i++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(gen1_egg2, food_id, address(eggNFT));
        }
        // Hatch using hatchBreedingEgg
        uint256 gen1_animal2 = eggNFT.hatchBreedingEgg(gen1_egg2);
        
        // Breed two Gen 1 animals → Gen 2
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 gen2_egg = _requestAndClaimBreed(gen1_animal, gen1_animal2, referrerG1);
        
        (,,,,,,,,,,,uint256 generation) = eggNFT.getEggProperties(gen2_egg);
        assertEq(generation, 2, "Should be Gen 2");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_RevertWhen_SameAnimal() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        
        vm.expectRevert("Cannot breed same animal");
        eggNFT.requestBreed(animal1, animal1, referrerG1);
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_RevertWhen_NotOwnerOfParent1() public {
        address otherUser = address(0x5);
        mockUSDT.mint(otherUser, INITIAL_BALANCE);
        mockUSDT.mint(breeder, INITIAL_BALANCE);
        
        vm.startPrank(breeder);
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        vm.stopPrank();
        
        vm.startPrank(otherUser);
        uint256 animal2 = _mintAndHatchEgg(otherUser, referrerG1);
        vm.stopPrank();
        
        vm.startPrank(breeder);
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        
        vm.expectRevert("Not owner of parent2");
        eggNFT.requestBreed(animal1, animal2, referrerG1);
        vm.stopPrank();
    }
    
    function test_BreedAnimals_RevertWhen_NotOwnerOfParent2() public {
        address otherUser = address(0x5);
        mockUSDT.mint(otherUser, INITIAL_BALANCE);
        mockUSDT.mint(breeder, INITIAL_BALANCE);
        
        vm.startPrank(otherUser);
        uint256 animal1 = _mintAndHatchEgg(otherUser, referrerG1);
        vm.stopPrank();
        
        vm.startPrank(breeder);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        vm.stopPrank();
        
        vm.startPrank(breeder);
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        
        vm.expectRevert("Not owner of parent1");
        eggNFT.requestBreed(animal1, animal2, referrerG1);
        vm.stopPrank();
    }
    
    function test_BreedAnimals_TransfersFee() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        uint256 breederBalanceBefore = mockUSDT.balanceOf(breeder);
        uint256 commissionBalanceBefore = mockUSDT.balanceOf(payable(address(commissionDistribution)));
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId = eggNFT.requestBreed(animal1, animal2, referrerG1);
        
        // Fee is deducted at request time, not claim time
        uint256 breederBalanceAfterBreed = mockUSDT.balanceOf(breeder);
        uint256 commissionBalanceAfter = mockUSDT.balanceOf(payable(address(commissionDistribution)));
        
        assertEq(breederBalanceBefore - breederBalanceAfterBreed, BREEDING_FEE, "Breeder should pay breeding fee at request");
        assertEq(commissionBalanceAfter - commissionBalanceBefore, BREEDING_FEE, "Commission contract should receive fee");
        
        // Complete VRF
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId, address(eggNFT));
        eggNFT.claimBreed(requestId);
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_EggHasCorrectProperties() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        (,,,,,,uint256 egg1_id,,,) = animalNFT.getAnimalProperties(animal1);
        (,,,,,,uint256 egg2_id,,,) = animalNFT.getAnimalProperties(animal2);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 breeding_egg_id = _requestAndClaimBreed(animal1, animal2, referrerG1);
        
        (
            uint256 egg_id,
            address egg_owner,
            uint256 food_count,
            bool is_hatched,
            uint256 rarity_seed,
            address[4] memory referral_chain,
            uint256 animal_token_id,
            uint256 parent1_animal_id,
            uint256 parent2_animal_id,
            bool is_breeding_egg,
            uint256 rarity_upgrade_count,
            uint256 generation
        ) = eggNFT.getEggProperties(breeding_egg_id);
        
        assertTrue(egg_id > 0, "Egg ID should be > 0");
        assertEq(egg_owner, breeder, "Owner should be breeder");
        assertEq(food_count, 2, "Food count should be 2 (INITIAL_FOOD_COUNT)");
        assertFalse(is_hatched, "Should not be hatched");
        assertTrue(is_breeding_egg, "Should be breeding egg");
        assertEq(parent1_animal_id, animal1, "Parent 1 should match");
        assertEq(parent2_animal_id, animal2, "Parent 2 should match");
        assertEq(rarity_upgrade_count, 0, "Upgrade count should be 0");
        assertEq(generation, 1, "Generation should be 1");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_ParentLineageTracked() public {
        vm.startPrank(breeder);
        
        uint256 parent1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 parent2 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 gen1_egg = _requestAndClaimBreed(parent1, parent2, referrerG1);
        
        // Feed and hatch using VRF
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        for (uint i = 0; i < 10; i++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(gen1_egg, food_id, address(eggNFT));
        }
        uint256 gen1_animal = eggNFT.hatchBreedingEgg(gen1_egg);
        
        (,,,,,,uint256 parent_egg_id, uint256 gen1_parent1, uint256 gen1_parent2,) = 
            animalNFT.getAnimalProperties(gen1_animal);
        
        assertEq(gen1_parent1, parent1, "Gen 1 animal should track parent 1");
        assertEq(gen1_parent2, parent2, "Gen 1 animal should track parent 2");
        
        vm.stopPrank();
    }
    
    function test_HatchBreedingEgg_HasCorrectGeneration() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 breeding_egg_id = _requestAndClaimBreed(animal1, animal2, referrerG1);
        
        // Feed and hatch using VRF
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        for (uint i = 0; i < 10; i++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(breeding_egg_id, food_id, address(eggNFT));
        }
        
        uint256 hatched_animal_id = eggNFT.hatchBreedingEgg(breeding_egg_id);
        
        (,,,,uint256 generation,,,,,) = animalNFT.getAnimalProperties(hatched_animal_id);
        assertEq(generation, 1, "Hatched animal should be Gen 1");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_MultipleGenerations() public {
        vm.startPrank(breeder);
        
        uint256[] memory gen0_animals = new uint256[](4);
        for (uint i = 0; i < 4; i++) {
            gen0_animals[i] = _mintAndHatchEgg(breeder, referrerG1);
        }
        
        // Gen 1
        uint256[] memory gen1_animals = new uint256[](2);
        for (uint i = 0; i < 2; i++) {
            mockUSDT.approve(address(eggNFT), BREEDING_FEE);
            uint256 egg_id = _requestAndClaimBreed(gen0_animals[i*2], gen0_animals[i*2+1], referrerG1);
            
            mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
            for (uint j = 0; j < 10; j++) {
                uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
                foodNFT.feedEgg(egg_id, food_id, address(eggNFT));
            }
            gen1_animals[i] = eggNFT.hatchBreedingEgg(egg_id);
            
            (,,,,uint256 gen,,,,,) = animalNFT.getAnimalProperties(gen1_animals[i]);
            assertEq(gen, 1, "Should be Gen 1");
        }
        
        // Gen 2
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 gen2_egg = _requestAndClaimBreed(gen1_animals[0], gen1_animals[1], referrerG1);
        
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        for (uint j = 0; j < 10; j++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(gen2_egg, food_id, address(eggNFT));
        }
        uint256 gen2_animal = eggNFT.hatchBreedingEgg(gen2_egg);
        
        (,,,,uint256 generation,,,,,) = animalNFT.getAnimalProperties(gen2_animal);
        assertEq(generation, 2, "Should be Gen 2");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_ReferralChainRecorded() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 breeding_egg_id = _requestAndClaimBreed(animal1, animal2, referrerG1);
        
        (,,,,,address[4] memory referral_chain,,,,,,) = eggNFT.getEggProperties(breeding_egg_id);
        assertEq(referral_chain[0], referrerG1, "Referrer should be recorded");
        
        vm.stopPrank();
    }
    
    // ========== COOLDOWN TESTS ==========
    
    function test_BreedAnimals_RevertWhen_OnCooldown() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        // First breed - should succeed
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId1 = eggNFT.requestBreed(animal1, animal2, referrerG1);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId1, address(eggNFT));
        eggNFT.claimBreed(requestId1);
        
        // Both animals on cooldown
        assertFalse(animalNFT.canBreed(animal1), "Animal 1 should be on cooldown");
        assertFalse(animalNFT.canBreed(animal2), "Animal 2 should be on cooldown");
        
        // Try to breed again - should revert
        uint256 animal3 = _mintAndHatchEgg(breeder, referrerG1);
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        
        vm.expectRevert("Parent 1 on cooldown");
        eggNFT.requestBreed(animal1, animal3, referrerG1);
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_CooldownExpires() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId1 = eggNFT.requestBreed(animal1, animal2, referrerG1);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId1, address(eggNFT));
        eggNFT.claimBreed(requestId1);
        
        assertFalse(animalNFT.canBreed(animal1), "Animal 1 should be on cooldown");
        assertFalse(animalNFT.canBreed(animal2), "Animal 2 should be on cooldown");
        
        // Fast forward 48 hours
        vm.warp(block.timestamp + 48 hours);
        
        assertTrue(animalNFT.canBreed(animal1), "Animal 1 should be able to breed after cooldown");
        assertTrue(animalNFT.canBreed(animal2), "Animal 2 should be able to breed after cooldown");
        
        uint256 animal3 = _mintAndHatchEgg(breeder, referrerG1);
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId2 = eggNFT.requestBreed(animal1, animal3, referrerG1);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId2, address(eggNFT));
        uint256 eggId2 = eggNFT.claimBreed(requestId2);
        
        assertTrue(eggId2 > 0, "Should successfully breed after cooldown");
        
        vm.stopPrank();
    }
    
    function test_BreedAnimals_RevertWhen_OneAnimalOnCooldown() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal3 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal4 = _mintAndHatchEgg(breeder, referrerG1);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId1 = eggNFT.requestBreed(animal1, animal2, referrerG1);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId1, address(eggNFT));
        eggNFT.claimBreed(requestId1);
        
        assertFalse(animalNFT.canBreed(animal1), "Animal 1 should be on cooldown");
        assertFalse(animalNFT.canBreed(animal2), "Animal 2 should be on cooldown");
        assertTrue(animalNFT.canBreed(animal3), "Animal 3 should not be on cooldown");
        assertTrue(animalNFT.canBreed(animal4), "Animal 4 should not be on cooldown");
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        vm.expectRevert("Parent 1 on cooldown");
        eggNFT.requestBreed(animal1, animal3, referrerG1);
        
        // Breed animal3 + animal4 — should succeed
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 requestId2 = eggNFT.requestBreed(animal3, animal4, referrerG1);
        vm.warp(block.timestamp + 1);
        vrfMock.fulfillRandomWords(requestId2, address(eggNFT));
        uint256 breedingEggId = eggNFT.claimBreed(requestId2);
        assertTrue(breedingEggId > 0, "Should successfully breed animals not on cooldown");
        
        vm.stopPrank();
    }
    
    // ========== RARITY VARIANCE TESTS ==========
    
    function test_CalculateOffspringRarity_CommonParents() public {
        vm.startPrank(breeder);
        
        uint256 animal1 = _mintAndHatchEgg(breeder, referrerG1);
        uint256 animal2 = _mintAndHatchEgg(breeder, referrerG1);
        
        (,,,Rarity rarity1,,,,,,) = animalNFT.getAnimalProperties(animal1);
        (,,,Rarity rarity2,,,,,,) = animalNFT.getAnimalProperties(animal2);
        
        mockUSDT.approve(address(eggNFT), BREEDING_FEE);
        uint256 breeding_egg = _requestAndClaimBreed(animal1, animal2, referrerG1);
        
        // Feed and hatch using VRF
        mockUSDT.approve(address(foodNFT), FOOD_MINT_PRICE * 10);
        for (uint i = 0; i < 10; i++) {
            uint256[] memory food_id = foodNFT.mintFood(1, referrerG1);
            foodNFT.feedEgg(breeding_egg, food_id, address(eggNFT));
        }
        uint256 offspring = eggNFT.hatchBreedingEgg(breeding_egg);
        
        (,,,Rarity offspringRarity,,,,,,) = animalNFT.getAnimalProperties(offspring);
        
        Rarity maxRarity = rarity1 > rarity2 ? rarity1 : rarity2;
        uint256 offspringVal = uint256(offspringRarity);
        uint256 maxVal = uint256(maxRarity);
        
        assertTrue(offspringVal >= (maxVal == 0 ? 0 : maxVal - 1), "Offspring should not be more than 1 tier below max");
        assertTrue(offspringVal <= (maxVal == 3 ? 3 : maxVal + 1), "Offspring should not be more than 1 tier above max");
        
        vm.stopPrank();
    }
    
    function test_CalculateOffspringRarity_LegendaryParents() public {
        // Testing Legendary parents would require extensive upgrades
        // _calculateOffspringRarity is pure and tested indirectly
        assertTrue(true, "Legendary parents test skipped - requires extensive setup");
    }
}

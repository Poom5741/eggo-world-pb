// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AnimalNFT, Rarity, Species} from "../src/AnimalNFT.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract AnimalNFTTest is Test {
    AnimalNFT public animalNFT;
    EggNFT public eggNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public usdtToken;
    
    address public owner = address(1);
    address public eggNFTAddress = address(2);
    address public user = address(3);
    address public unauthorized = address(4);
    address public coinStorReserve = address(10);
    
    event AnimalMinted(
        uint256 indexed animal_id,
        address indexed recipient,
        Rarity rarity,
        Species species,
        uint256 generation
    );
    
    function setUp() public {
        vm.startPrank(owner);
        
        usdtToken = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve, address(usdtToken));
        eggNFT = new EggNFT(address(commissionDistribution), address(usdtToken));
        animalNFT = new AnimalNFT();
        
        vm.stopPrank();
    }
    
    // ==================== DEPLOYMENT TESTS ====================
    
    function test_Deployment_NameAndSymbol() public {
        assertEq(animalNFT.name(), "Animal NFT");
        assertEq(animalNFT.symbol(), "ANIMAL");
    }
    
    function test_Deployment_Owner() public {
        assertEq(animalNFT.owner(), owner);
    }
    
    // ==================== MINTING TESTS ====================
    
    function test_MintAnimal_Success() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256 parentEggId = 1;
        Rarity rarity = Rarity.Common;
        Species species = Species.Chicken;
        uint256 generation = 0;
        
        uint256[4] memory foodDistribution;
        foodDistribution[0] = 5;
        foodDistribution[1] = 3;
        foodDistribution[2] = 2;
        foodDistribution[3] = 0;
        
        vm.startPrank(address(eggNFT));
        vm.expectEmit(true, true, false, true);
        emit AnimalMinted(1, user, rarity, species, generation);
        
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            parentEggId,
            rarity,
            species,
            generation,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
        
        assertEq(tokenId, 1);
        assertEq(animalNFT.ownerOf(tokenId), user);
        assertEq(animalNFT.totalSupply(), 1);
    }
    
    function test_MintAnimal_RecordsProperties() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        foodDistribution[0] = 6;
        foodDistribution[1] = 2;
        foodDistribution[2] = 2;
        foodDistribution[3] = 0;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Rare,
            Species.Duck,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
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
        ) = animalNFT.getAnimalProperties(tokenId);
        
        assertEq(animalId, 1);
        assertEq(animalOwner, user);
        assertEq(uint256(animalSpecies), uint256(Species.Duck));
        assertEq(uint256(animalRarity), uint256(Rarity.Rare));
        assertEq(animalGeneration, 0);
        assertEq(animalFoodDistribution[0], 6);
        assertEq(animalFoodDistribution[1], 2);
        assertEq(animalFoodDistribution[2], 2);
        assertEq(animalFoodDistribution[3], 0);
    }
    
    function test_MintAnimal_RevertWhen_NotEggNFTContract() public {
        vm.startPrank(unauthorized);
        
        uint256[4] memory foodDistribution;
        
        vm.expectRevert("Only EggNFT contract can mint");
        animalNFT.mintAnimal(
            user,
            1,
            Rarity.Common,
            Species.Chicken,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        
        vm.stopPrank();
    }
    
    function test_MintAnimal_RevertWhen_ZeroRecipient() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        vm.expectRevert("Recipient cannot be zero address");
        animalNFT.mintAnimal(
            address(0),
            1,
            Rarity.Common,
            Species.Chicken,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
    }
    
    function test_MintAnimal_MultipleMints() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId1 = animalNFT.mintAnimal(user, 1, Rarity.Common, Species.Chicken, 0, foodDistribution, 0, 0, 0);
        uint256 tokenId2 = animalNFT.mintAnimal(user, 2, Rarity.Rare, Species.Duck, 0, foodDistribution, 0, 0, 0);
        uint256 tokenId3 = animalNFT.mintAnimal(user, 3, Rarity.Epic, Species.Phoenix, 0, foodDistribution, 0, 0, 0);
        vm.stopPrank();
        
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(tokenId3, 3);
        assertEq(animalNFT.totalSupply(), 3);
    }
    
    // ==================== VIEW FUNCTION TESTS ====================
    
    function test_GetAnimalProperties() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        foodDistribution[0] = 4;
        foodDistribution[1] = 3;
        foodDistribution[2] = 2;
        foodDistribution[3] = 1;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Epic,
            Species.GoldenChicken,
            1,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
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
        ) = animalNFT.getAnimalProperties(tokenId);
        
        assertEq(animalId, 1);
        assertEq(animalOwner, user);
        assertEq(uint256(animalSpecies), uint256(Species.GoldenChicken));
        assertEq(uint256(animalRarity), uint256(Rarity.Epic));
        assertEq(animalGeneration, 1);
        assertEq(animalFoodDistribution[0], 4);
        assertEq(animalFoodDistribution[1], 3);
        assertEq(animalFoodDistribution[2], 2);
        assertEq(animalFoodDistribution[3], 1);
    }
    
    function test_GetRarity() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Legendary,
            Species.Dragon,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
        
        assertEq(uint256(animalNFT.getRarity(tokenId)), uint256(Rarity.Legendary));
    }
    
    function test_GetSpecies() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Common,
            Species.Quail,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
        
        assertEq(uint256(animalNFT.getSpecies(tokenId)), uint256(Species.Quail));
    }
    
    function test_GetGeneration() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Common,
            Species.Chicken,
            2,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
        
        assertEq(animalNFT.getGeneration(tokenId), 2);
    }
    
    function test_GetAnimalId() public {
        vm.startPrank(owner);
        animalNFT.setEggNFTContract(address(eggNFT));
        vm.stopPrank();
        
        uint256[4] memory foodDistribution;
        
        vm.startPrank(address(eggNFT));
        uint256 tokenId = animalNFT.mintAnimal(
            user,
            1,
            Rarity.Common,
            Species.Chicken,
            0,
            foodDistribution,
            0,  // parent1_animal_id
            0,  // parent2_animal_id
            0   // rarity_upgrade_count
        );
        vm.stopPrank();
        
        assertEq(animalNFT.getAnimalId(1), tokenId);
    }
    
    // ==================== AUTHORIZATION TESTS ====================
    
    function test_SetEggNFTContract_Success() public {
        vm.startPrank(owner);
        
        animalNFT.setEggNFTContract(address(eggNFT));
        
        vm.stopPrank();
    }
    
    function test_SetEggNFTContract_RevertWhen_NotOwner() public {
        vm.startPrank(unauthorized);
        
        vm.expectRevert();
        animalNFT.setEggNFTContract(address(eggNFT));
        
        vm.stopPrank();
    }
    
    function test_SetEggNFTContract_RevertWhen_ZeroAddress() public {
        vm.startPrank(owner);
        
        vm.expectRevert("EggNFT address cannot be zero");
        animalNFT.setEggNFTContract(address(0));
        
        vm.stopPrank();
    }
    
    // ==================== RARITY ENUM TESTS ====================
    
    function test_Rarity_Values() public {
        assertEq(uint256(Rarity.Common), 0);
        assertEq(uint256(Rarity.Rare), 1);
        assertEq(uint256(Rarity.Epic), 2);
        assertEq(uint256(Rarity.Legendary), 3);
    }
    
    // ==================== SPECIES ENUM TESTS ====================
    
    function test_Species_Common_Values() public {
        assertEq(uint256(Species.Chicken), 0);
        assertEq(uint256(Species.Duck), 1);
        assertEq(uint256(Species.Quail), 2);
    }
    
    function test_Species_Rare_Values() public {
        assertEq(uint256(Species.Peacock), 3);
        assertEq(uint256(Species.Swan), 4);
        assertEq(uint256(Species.Turkey), 5);
    }
    
    function test_Species_Epic_Values() public {
        assertEq(uint256(Species.Phoenix), 6);
        assertEq(uint256(Species.GoldenChicken), 7);
        assertEq(uint256(Species.SilverDuck), 8);
    }
    
    function test_Species_Legendary_Values() public {
        assertEq(uint256(Species.Dragon), 9);
        assertEq(uint256(Species.Unicorn), 10);
        assertEq(uint256(Species.Gryphon), 11);
    }
}

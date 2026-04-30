// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT, Rarity, Species} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract ReferralChainResetTest is Test {
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    VRFCoordinatorV2_5Mock public vrfCoordinatorMock;

    address public owner;
    address public buyer;
    address public referrer;
    address public newOwner;
    address public coinStorReserve;

    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint256 public constant MINT_PRICE = 25 * 10**18;

    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        referrer = address(0x2);
        newOwner = address(0x3);
        coinStorReserve = address(0x6);

        vrfKeyHash = bytes32(uint256(0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26));

        mockUSDT = new MockUSDT();
        address treasury = address(0x7);
        commissionDistribution = new CommissionDistribution(coinStorReserve, address(mockUSDT), treasury);

        vrfCoordinatorMock = new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18);

        eggNFT = new EggNFT(payable(address(commissionDistribution)), address(mockUSDT), address(vrfCoordinatorMock));
        animalNFT = new AnimalNFT();

        // Set up contracts
        eggNFT.setAnimalNFTContract(address(animalNFT));
        commissionDistribution.setEggNFTContract(address(eggNFT));

        // Set up VRF
        vrfSubscriptionId = vrfCoordinatorMock.createSubscription();
        vrfCoordinatorMock.addConsumer(vrfSubscriptionId, address(eggNFT));
        vrfCoordinatorMock.fundSubscription(vrfSubscriptionId, 100 ether);
        eggNFT.setVRFConfig(vrfSubscriptionId, vrfKeyHash);

        // Mint USDT for testing
        uint256 initialBalance = 1000 * 10**18;
        mockUSDT.mint(buyer, initialBalance);
        mockUSDT.mint(owner, initialBalance);
        mockUSDT.mint(newOwner, initialBalance);
    }

    function test_RegularEggDoesNotResetReferralChainOnTransfer() public {
        // Mint a regular egg with referral chain
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        address[4] memory referralChain;
        referralChain[0] = referrer;
        uint256 tokenId = eggNFT.mintEggWithChain(referralChain);
        vm.stopPrank();

        // Confirm the referral chain is set
        address[4] memory storedChain = eggNFT.getReferralChain(tokenId);
        assertEq(storedChain[0], referrer);
        assertEq(storedChain[1], address(0));
        assertEq(storedChain[2], address(0));
        assertEq(storedChain[3], address(0));

        // Transfer the egg via safeTransferFrom (should use _update)
        vm.prank(buyer);
        eggNFT.transferFrom(buyer, newOwner, tokenId);

        // Check that referral chain was NOT reset for regular egg
        address[4] memory chainAfterTransfer = eggNFT.getReferralChain(tokenId);
        assertEq(chainAfterTransfer[0], referrer);  // Still has original referrer
    }

    function test_BreedingEggResetsReferralChainOnTransfer() public {
        // Create parents
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE * 2);
        uint256 parent1TokenId = eggNFT.mintEgg(referrer);
        uint256 parent2TokenId = eggNFT.mintEgg(referrer);
        vm.stopPrank();

        // Hatch parents to get animals
        vm.startPrank(owner);
        eggNFT.pause();  // Disable VRF for simplicity and set up animal NFT
        animalNFT.transferOwnership(buyer);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        // Mint some animals to be parents
        uint256 animal1Id = animalNFT.mintAnimal(buyer, 1, Rarity.Common, Species.Chicken, 0, [uint256(1),1,1,1], 0, 0, 0);
        uint256 animal2Id = animalNFT.mintAnimal(buyer, 2, Rarity.Rare, Species.Duck, 1, [uint256(1),1,1,1], 0, 0, 0);
        eggNFT.unpause();
        vm.stopPrank();

        // Create a breeding egg - this will have a referral chain and is_breeding_egg = true
        vm.prank(buyer);
        uint256 breedingEggTokenId = eggNFT.breedAnimals(animal1Id, animal2Id, referrer);
        
        // Confirm this is a breeding egg and has the referral chain
        (,,,,,,,,, bool isBreedingEgg,,) = eggNFT.getEggProperties(breedingEggTokenId);
        assertTrue(isBreedingEgg);
        
        address[4] memory storedChain = eggNFT.getReferralChain(breedingEggTokenId);
        assertEq(storedChain[0], referrer);
        assertEq(storedChain[1], address(0));
        assertEq(storedChain[2], address(0));
        assertEq(storedChain[3], address(0));

        // Transfer the breeding egg via safeTransferFrom (should use _update)
        vm.startPrank(buyer);
        eggNFT.transferFrom(buyer, newOwner, breedingEggTokenId);

        // Check that the referral chain WAS reset for breeding egg
        address[4] memory chainAfterTransfer = eggNFT.getReferralChain(breedingEggTokenId);
        assertEq(chainAfterTransfer[0], address(0));
        assertEq(chainAfterTransfer[1], address(0));
        assertEq(chainAfterTransfer[2], address(0));
        assertEq(chainAfterTransfer[3], address(0));  // Referral chain cleared
    }

    function test_BreedingEggTransfersCorrectly() public {
        // Create and verify transfer of breeding egg maintains all other properties
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE * 2);
        uint256 parent1TokenId = eggNFT.mintEgg(referrer);
        uint256 parent2TokenId = eggNFT.mintEgg(referrer);
        vm.stopPrank();

        // Since we're simulating without needing hatching, let's work directly with
        // what we have and focus on the breeding eggs
        vm.startPrank(owner);
        eggNFT.pause();  // Pause to bypass VRF requirement
        animalNFT.transferOwnership(buyer);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        // Mint animals to represent our existing animals
        uint256 animal1Id = animalNFT.mintAnimal(buyer, 1, Rarity.Common, Species.Chicken, 0, [uint256(1),1,1,1], 0, 0, 0);
        uint256 animal2Id = animalNFT.mintAnimal(buyer, 2, Rarity.Rare, Species.Duck, 1, [uint256(1),1,1,1], 0, 0, 0);
        eggNFT.unpause();  // Resume
        vm.stopPrank();

        // Create a breeding egg 
        vm.startPrank(buyer);
        uint256 breedingEggTokenId = eggNFT.breedAnimals(animal1Id, animal2Id, referrer);
        vm.stopPrank();

        // Verify initial state before transfer
        (,,,,,,, uint256 parent1Id, uint256 parent2Id, bool isBreedingEgg,,) = eggNFT.getEggProperties(breedingEggTokenId);
        assertTrue(isBreedingEgg);
        assertEq(parent1Id, animal1Id);
        assertEq(parent2Id, animal2Id);
        
        // Verify owner of the egg
        assertEq(eggNFT.ownerOf(breedingEggTokenId), buyer);

        // Transfer the breeding egg
        vm.startPrank(buyer);
        eggNFT.transferFrom(buyer, newOwner, breedingEggTokenId);
        vm.stopPrank();

        // Verify transferred ownership
        assertEq(eggNFT.ownerOf(breedingEggTokenId), newOwner);

        // Verify other properties maintained
        (,,,,,,, uint256 parent1IdAfter, uint256 parent2IdAfter, bool isBreedingEggAfter,,) = eggNFT.getEggProperties(breedingEggTokenId);
        assertTrue(isBreedingEggAfter);
        assertEq(parent1IdAfter, animal1Id);
        assertEq(parent2IdAfter, animal2Id);
        
        // Verify referral chain was reset (the security fix)
        address[4] memory chain = eggNFT.getReferralChain(breedingEggTokenId);
        assertEq(chain[0], address(0));
        assertEq(chain[1], address(0));
        assertEq(chain[2], address(0));
        assertEq(chain[3], address(0));
    }
}
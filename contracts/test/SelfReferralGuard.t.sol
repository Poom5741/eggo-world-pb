// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract SelfReferralGuardTest is Test {
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public usdt;

    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);
    address user3 = address(0x4);
    address treasury = address(0x5);

    function setUp() public {
        vm.prank(owner);
        usdt = new MockUSDT();

        vm.prank(owner);
        commissionDistribution = new CommissionDistribution(
            address(0x6), // coinStorReserve
            address(usdt),
            treasury // treasury address
        );

        vm.prank(owner);
        eggNFT = new EggNFT(
            payable(address(commissionDistribution)),
            address(usdt),
            address(0x7) // vrfCoordinator
        );

        vm.prank(owner);
        foodNFT = new FoodNFT(
            payable(address(commissionDistribution)),
            address(usdt),
            address(eggNFT)
        );

        // Set foodNFT contract in eggNFT
        vm.prank(owner);
        eggNFT.setFoodNFTContract(address(foodNFT));

        // Approve the usdt spending
        vm.startPrank(user1);
        usdt.mint(user1, 1000 * 10**18);
        usdt.approve(address(commissionDistribution), 1000 * 10**18);
        vm.stopPrank();

        vm.startPrank(user2);
        usdt.mint(user2, 1000 * 10**18);
        usdt.approve(address(commissionDistribution), 1000 * 10**18);
        vm.stopPrank();

        vm.startPrank(user3);
        usdt.mint(user3, 1000 * 10**18);
        usdt.approve(address(commissionDistribution), 1000 * 10**18);
        vm.stopPrank();
    }

    // TEST 1: mintEgg with self referral should revert
    function testMintEggSelfReferralReverts() public {
        vm.prank(user1);
        vm.expectRevert(bytes("Self-referral"));
        eggNFT.mintEgg(user1); // user1 refers himself
    }

    // TEST 2: mintFood with self referral should revert
    function testMintFoodSelfReferralReverts() public {
        vm.prank(user1);
        vm.expectRevert(bytes("Self-referral"));
        foodNFT.mintFood(1, user1); // user1 refers himself
    }

    // TEST 3: breedAnimals with self referral should revert
    function testBreedAnimalsSelfReferralReverts() public {
        // Use mockAnimalNFT that returns valid owner info
        MockAnimalNFT mockAnimal = new MockAnimalNFT();
        
        vm.prank(owner);
        eggNFT.setAnimalNFTContract(address(mockAnimal));
        
        vm.startPrank(user1);
        usdt.mint(user1, 200 * 10**18);
        usdt.approve(address(eggNFT), 200 * 10**18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        vm.expectRevert(bytes("Self-referral"));
        eggNFT.breedAnimals(1, 2, user1); // user1 refers itself
    }

    // TEST 4: mintEggWithChain with self referral in beginning of chain should revert
    function testMintEggWithChainSelfReferralInChain() public {
        address[4] memory referralChain;
        referralChain[0] = user1;  // First referral is user1 (same as msg.sender)
        referralChain[1] = user2;

        vm.prank(user1);
        vm.expectRevert(bytes("Self-referral"));
        eggNFT.mintEggWithChain(referralChain); // user1 refers himself in the chain
    }

    // TEST 5: mintEggWithChain with user somewhere in the middle of the chain should revert
    function testMintEggWithChainDeepSelfReferral() public {
        address[4] memory referralChain;
        referralChain[0] = user2; 
        referralChain[1] = user3; 
        referralChain[2] = user1;  // user1 (msg.sender) at position that should be disallowed
        referralChain[3] = address(0);

        vm.prank(user1);
        vm.expectRevert(bytes("Self-referral"));
        eggNFT.mintEggWithChain(referralChain); // user1 appears in the middle of the chain 
    }
}

contract MockAnimalNFT {
    function ownerOf(uint256) external pure returns (address) {
        return address(0x123);
    }
    function canBreed(uint256) external pure returns (bool) {
        return true;
    }
    function getAnimalProperties(uint256) external pure returns (
        uint256 egg_id, address user, uint256 gen, 
        uint8 rarity, uint256 species, uint256 food_count,
        uint256 age, uint256 last_breed_time,
        bool alive, uint256 level, uint256 xp,
        uint256 max_xp
    ) {
        return (0, address(0x123), 1, 0, 0, 0, 0, 0, true, 1, 0, 100);
    }
}
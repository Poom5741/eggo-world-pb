// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EggNFT} from "../../src/EggNFT.sol";
import {FoodNFT} from "../../src/FoodNFT.sol";
import {CommissionDistribution} from "../../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract SecurityFixesTest is Test {
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public usdt;

    address owner = address(0x1);
    address user = address(0x2);
    address treasury = address(0x3);

    function setUp() public {
        vm.prank(owner);
        usdt = new MockUSDT();

        vm.prank(owner);
        commissionDistribution = new CommissionDistribution(
            address(0x4), // coinStorReserve
            address(usdt),
            treasury // treasury address
        );

        vm.prank(owner);
        eggNFT = new EggNFT(
            payable(address(commissionDistribution)),
            address(usdt),
            address(0x5) // vrfCoordinator
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
    }

    // ==================== SEC-01: XOR Operator Fix ====================

    function testEggNFTMintPrice() public view {
        // Expected: 25e18 (25 USDT)
        // Buggy value: 25 * 10^18 = 25 * 24 = 600 wei
        uint256 expectedMintPrice = 25 * 10**18;
        assertEq(eggNFT.MINT_PRICE(), expectedMintPrice, "EggNFT MINT_PRICE should be 25e18");
    }

    function testEggNFTBreedingFee() public view {
        // Expected: 5e18 (5 USDT)
        // Buggy value: 5 * 10^18 = 5 * 24 = 120 wei
        uint256 expectedBreedingFee = 5 * 10**18;
        assertEq(eggNFT.BREEDING_FEE(), expectedBreedingFee, "EggNFT BREEDING_FEE should be 5e18");
    }

    function testFoodNFTMintPrice() public view {
        // Expected: 5e17 (0.50 USDT)
        // Buggy value: 0.50 * 10^18 ≈ 12 wei
        uint256 expectedMintPrice = 5 * 10**17;
        assertEq(foodNFT.MINT_PRICE(), expectedMintPrice, "FoodNFT MINT_PRICE should be 5e17");
    }

    function testNoXORInPriceConstants() public {
        // Verify that the source files don't contain the buggy XOR pattern
        // This is a compile-time check - if the contract compiles with correct values,
        // the XOR operator is not being used in price calculations
        
        // Read the actual constant values and verify they match expected
        // If XOR was used, these would be tiny values (600, 120, 12)
        // With correct exponentiation, they should be large values
        
        uint256 eggMintPrice = eggNFT.MINT_PRICE();
        uint256 eggBreedingFee = eggNFT.BREEDING_FEE();
        uint256 foodMintPrice = foodNFT.MINT_PRICE();
        
        // Assert values are in the expected range (not buggy XOR results)
        assertTrue(eggMintPrice > 1e18, "EggMintPrice should be > 1e18, not 600");
        assertTrue(eggBreedingFee > 1e18, "EggBreedingFee should be > 1e18, not 120");
        assertTrue(foodMintPrice > 1e16, "FoodMintPrice should be > 1e16, not 12");
        
        // Exact value checks
        assertEq(eggMintPrice, 25000000000000000000, "Exact: 25e18");
        assertEq(eggBreedingFee, 5000000000000000000, "Exact: 5e18");
        assertEq(foodMintPrice, 500000000000000000, "Exact: 5e17");
    }
}

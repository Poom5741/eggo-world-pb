// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract MintPriceMutabilityTest is Test {
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public usdt;

    address owner = address(0x1);
    address user = address(0x2);
    address user2 = address(0x3);
    address treasury = address(0x4);

    function setUp() public {
        vm.prank(owner);
        usdt = new MockUSDT();

        vm.prank(owner);
        commissionDistribution = new CommissionDistribution(
            address(0x5), // coinStorReserve
            address(usdt),
            treasury // treasury address
        );

        vm.prank(owner);
        eggNFT = new EggNFT(
            payable(address(commissionDistribution)),
            address(usdt),
            address(0x6) // vrfCoordinator
        );

        vm.prank(owner);
        foodNFT = new FoodNFT(
            payable(address(commissionDistribution)),
            address(usdt),
            address(eggNFT)
        );
        
        // Register contracts with CommissionDistribution
        vm.prank(owner);
        commissionDistribution.setEggNFTContract(address(eggNFT));
        vm.prank(owner);
        commissionDistribution.setFoodNFTContract(address(foodNFT));

        // Set foodNFT contract in eggNFT
        vm.prank(owner);
        eggNFT.setFoodNFTContract(address(foodNFT));
        
        // Mint USDT to user for testing
        vm.prank(owner);
        usdt.mint(user, 10000 * 1e18); // 10000 USDT
    }

    function testDefaultMintPrice() public view {
        // Verify that the default mint price is 25e18 (25 USDT)
        uint256 expectedMintPrice = 25 * 10**18;
        assertEq(eggNFT.mintPrice(), expectedMintPrice, "Default mint price should be 25e18");
    }

    function testSetMintPriceUpdatesValue() public {
        // Call setMintPrice(50e18); verify mintPrice() returns 50e18
        vm.prank(owner);
        eggNFT.setMintPrice(50e18);
        
        uint256 currentPrice = eggNFT.mintPrice();
        uint256 expectedPrice = 50 * 10**18;
        assertEq(currentPrice, expectedPrice, "Price should be updated to 50e18");
    }

    function testSetMintPriceBelowMinimumReverts() public {
        // Call setMintPrice(0.5e18); expect revert with "Price bounds"
        vm.prank(owner);
        vm.expectRevert("Price bounds: 1-1000 USDT");
        eggNFT.setMintPrice(0.5e18);
    }

    function testSetMintPriceAboveMaximumReverts() public {
        // Call setMintPrice(1500e18); expect revert with "Price bounds"
        vm.prank(owner);
        vm.expectRevert("Price bounds: 1-1000 USDT");
        eggNFT.setMintPrice(1500e18);
    }

    function testSetMintPriceOnlyOwner() public {
        // Call setMintPrice from non-owner; expect revert with Ownable error
        vm.prank(user); // Non-owner
        vm.expectRevert(bytes("Only callable by owner"));
        eggNFT.setMintPrice(30e18);
    }

    function testMintUsesUpdatedPrice() public {
        // setMintPrice(30e18), then mintEgg, verify USDT deducted is 30e18
        vm.startPrank(owner);
        eggNFT.setMintPrice(30e18);
        vm.stopPrank();
        
        uint256 initialBalance = usdt.balanceOf(user);
        
        vm.startPrank(user);
        usdt.approve(address(eggNFT), 1000 * 1e18);
        eggNFT.mintEgg(address(0)); // Mint with no referrer
        vm.stopPrank();
        
        uint256 finalBalance = usdt.balanceOf(user);
        uint256 expectedDeduction = 30e18;
        
        assertEq(initialBalance - finalBalance, expectedDeduction, "USDT deducted should match updated price");
    }
}
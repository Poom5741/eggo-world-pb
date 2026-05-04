// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TierBadge} from "../src/TierBadge.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract TierBadgeSafeERC20Test is Test {
    TierBadge public tierBadge;
    MockUSDT public mockUSDT;

    address public owner;
    address public user;
    address public coinStorReserve;

    function setUp() public {
        owner = address(this);
        user = address(0x1);
        coinStorReserve = address(0x2);
        
        mockUSDT = new MockUSDT();
        tierBadge = new TierBadge(address(mockUSDT), coinStorReserve);
        
        // Mint enough tokens to the coinStorReserve for the transfers
        // 800 USDT = 500 for farmer tier + some buffer
        uint256 totalTokens = (500 * 10**18) + (50 * 10**18) + (5 * 10**18) + (100 * 10**18); // farmer + grower + seedling + buffer
        mockUSDT.mint(coinStorReserve, totalTokens);
    }
    
    function test_SafeTransferFromSuccess() public {
        // Approve the tierBadge contract to spend USDT from the coinStorReserve
        vm.prank(coinStorReserve);
        mockUSDT.approve(address(tierBadge), 1000 * 10**18);

        uint256 userBalanceBefore = mockUSDT.balanceOf(user);
        uint256 reserveBalanceBefore = mockUSDT.balanceOf(coinStorReserve);

        // Mint the seedling tier (5 USDT reward)
        vm.prank(owner);
        uint256 tokenId = tierBadge.mintTierBadge(user, 1, 12); // Pass the threshold

        // Check that the badge was minted and user received the reward
        assertEq(tierBadge.ownerOf(tokenId), user);
        
        // Check that the reward was sent (5 USDT = 5 * 10**18)
        uint256 userBalanceAfter = mockUSDT.balanceOf(user);
        uint256 rewardAmount = 5 * 10**18; // Seedling reward
        assertEq(userBalanceAfter - userBalanceBefore, rewardAmount);
        
        uint256 reserveBalanceAfter = mockUSDT.balanceOf(coinStorReserve);
        assertEq(reserveBalanceBefore - reserveBalanceAfter, rewardAmount);
    }

    function test_SafeTransferFromWithoutApprovedFailsGracefully() public {
        // Make sure coinStorReserve doesn't approve the contract for transfers
        assertEq(mockUSDT.allowance(coinStorReserve, address(tierBadge)), 0);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ERC20InsufficientAllowance(address,uint256,uint256)")),
                address(tierBadge), 0, 5 * 10**18
            )
        );
        vm.prank(owner);
        tierBadge.mintTierBadge(user, 1, 12);
    }
    
    function test_TokenURIDoesntRevert() public {
        vm.prank(coinStorReserve);
        mockUSDT.approve(address(tierBadge), 1000 * 10**18);

        // Mint the seedling tier (5 USDT reward)
        vm.prank(owner);
        uint256 tokenId = tierBadge.mintTierBadge(user, 1, 12); // Pass the threshold

        // Verify that tokenURI doesn't break after the change
        string memory tokenUri = tierBadge.tokenURI(tokenId);
        assertTrue(bytes(tokenUri).length > 0);
    }
    
    function test_GracefulFailureHandling() public {
        // Make sure the reserve doesn't have sufficient balance would cause safeTransferFrom to revert
        // To simulate a "failed transfer", mint a different USDT mock that doesn't send tokens but doesn't revert either
        // However, in reality, if approve isn't called OR coinStorReserve doesn't have enough balance,
        // SafeTransferFrom will revert with "insufficient allowance" or "insufficient balance"
        
        MockUSDT lowBalanceUSDT = new MockUSDT();
        lowBalanceUSDT.mint(coinStorReserve, 1 * 10**18); // Only has 1 USDT, not enough for any tier
        
        TierBadge lowBalanceTierBadge = new TierBadge(address(lowBalanceUSDT), coinStorReserve);
        
        // Ensure coinStorReserve has approved the contract with less allowance than required
        vm.startPrank(coinStorReserve);
        lowBalanceUSDT.approve(address(lowBalanceTierBadge), 1 * 10**18); // Only approve 1 USDT
        vm.stopPrank();
        
        // This should revert because the contract doesn't have enough allowance from reserve to transfer
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ERC20InsufficientAllowance(address,uint256,uint256)")),
                address(lowBalanceTierBadge), 1 * 10**18, 5 * 10**18
            )
        );
        vm.prank(owner);
        lowBalanceTierBadge.mintTierBadge(user, 1, 12); // Seedling rewards 5 * 10**18 USDT but reserve has only 1 * 10**18 approved
    }   
}
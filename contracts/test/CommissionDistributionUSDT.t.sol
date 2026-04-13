// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract CommissionDistributionUSDTTest is Test {
    CommissionDistribution public commissionDist;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public referrerG1;
    address public referrerG2;
    address public coinStor;
    
    uint256 public constant TEST_AMOUNT = 100 * 10^18; // 100 USDT
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    // TDG Test Specification:
    // 1. USDT balance tracking works correctly
    // 2. claimCommissionUSDT() transfers USDT to referrer
    // 3. claimCommissionUSDT() resets balance to zero
    // 4. claimCommissionUSDT() fails with insufficient balance
    // 5. claimCommissionUSDT() emits CommissionClaimedUSDT event
    
    function setUp() public {
        owner = address(this);
        referrerG1 = address(0x1);
        referrerG2 = address(0x2);
        coinStor = address(0x3);
        
        mockUSDT = new MockUSDT();
        commissionDist = new CommissionDistribution(coinStor, address(mockUSDT));
        
        // Fund contract with USDT for payouts
        mockUSDT.mint(address(commissionDist), INITIAL_BALANCE);
    }
    
    function test_GetCommissionBalance_USDT() public {
        // Setup: Distribute some USDT commission
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        
        // Calculate expected amounts
        uint256 g1Expected = (TEST_AMOUNT * 20) / 100; // 20%
        uint256 g2Expected = (TEST_AMOUNT * 10) / 100; // 10%
        
        // Verify USDT balances (not ETH)
        assertEq(commissionDist.commissionBalances(referrerG1), g1Expected, "G1 balance wrong");
        assertEq(commissionDist.commissionBalances(referrerG2), g2Expected, "G2 balance wrong");
        
        console.log("G1 USDT balance:", g1Expected);
        console.log("G2 USDT balance:", g2Expected);
    }
    
    function test_ClaimCommissionUSDT_HappyPath() public {
        // Setup: Give referrerG1 some commission
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        
        uint256 expectedBalance = (TEST_AMOUNT * 20) / 100; // 20 USDT
        
        // Verify balance before claim
        assertEq(commissionDist.commissionBalances(referrerG1), expectedBalance);
        assertEq(mockUSDT.balanceOf(referrerG1), 0);
        
        // TDG RED TEST: claimCommissionUSDT() should exist and transfer USDT
        // This test will FAIL initially (RED phase)
        vm.prank(referrerG1);
        commissionDist.claimCommissionUSDT();
        
        // Verify balance after claim
        assertEq(commissionDist.commissionBalances(referrerG1), 0, "Balance not reset");
        assertEq(mockUSDT.balanceOf(referrerG1), expectedBalance, "USDT not transferred");
        
        console.log("USDT claimed successfully:", expectedBalance);
    }
    
    function test_ClaimCommissionUSDT_ResetsBalance() public {
        // Setup: Multiple distributions
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        
        // First distribution
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        // Second distribution
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        
        uint256 totalBalance = (TEST_AMOUNT * 20) / 100 * 2; // 40 USDT
        
        // Claim all
        vm.prank(referrerG1);
        commissionDist.claimCommissionUSDT();
        
        // Balance MUST be zero after claim
        assertEq(commissionDist.commissionBalances(referrerG1), 0, "Balance not zero");
        
        // New distribution should start fresh
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        assertEq(commissionDist.commissionBalances(referrerG1), (TEST_AMOUNT * 20) / 100, "Fresh balance wrong");
    }
    
    function test_ClaimCommissionUSDT_InsufficientBalance() public {
        // Referrer has no commission
        vm.prank(referrerG1);
        
        // TDG RED TEST: Should revert with "No commission to claim"
        // This test will FAIL initially (function doesn't exist yet)
        vm.expectRevert("No commission to claim");
        commissionDist.claimCommissionUSDT();
    }
    
    function test_ClaimCommissionUSDT_EmitsEvent() public {
        // Setup
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        
        uint256 expectedBalance = (TEST_AMOUNT * 20) / 100;
        
        // TDG RED TEST: Check for CommissionClaimedUSDT event
        vm.prank(referrerG1);
        vm.expectEmit(true, false, false, false);
        emit CommissionClaimedUSDT(referrerG1, expectedBalance);
        commissionDist.claimCommissionUSDT();
    }
    
    // Event definition for testing
    event CommissionClaimedUSDT(address indexed referrer, uint256 amount);
}

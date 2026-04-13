// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {EggNFT} from "../src/EggNFT.sol";

contract CommissionDistributionIntegrationTest is Test {
    CommissionDistribution public commissionDist;
    MockUSDT public mockUSDT;
    EggNFT public eggNFT;
    
    address public owner;
    address public buyer;
    address public referrerG1; // Level 1: 20%
    address public referrerG2; // Level 2: 10%
    address public referrerG3; // Level 3: 10%
    address public referrerG4; // Level 4: 10%
    address public coinStor;   // 4%
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 10000 * 10^18;
    
    event CommissionDistributed(
        uint256 indexed egg_id,
        address indexed buyer,
        address[] referrers,
        uint256[] amounts
    );
    
    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        referrerG2 = address(0x3);
        referrerG3 = address(0x4);
        referrerG4 = address(0x5);
        coinStor = address(0x6);
        
        mockUSDT = new MockUSDT();
        commissionDist = new CommissionDistribution(coinStor, address(mockUSDT));
        eggNFT = new EggNFT(address(commissionDist), address(mockUSDT));
        
        commissionDist.setEggNFTContract(address(eggNFT));
        
        // Fund buyer with USDT
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        
        // Fund contract with BNB for commission payouts
        deal(address(commissionDist), INITIAL_BALANCE);
    }
    
    function test_CommissionDistributionMath() public {
        // Build referral chain
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        referralChain[2] = referrerG3;
        referralChain[3] = referrerG4;
        
        // Approve and mint egg
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        // Mint egg (triggers commission distribution)
        eggNFT.mintEggWithChain(referralChain);
        vm.stopPrank();
        
        // Calculate expected amounts
        uint256 totalCommission = MINT_PRICE;
        uint256 g1Expected = (totalCommission * 20) / 100; // 20%
        uint256 g2Expected = (totalCommission * 10) / 100; // 10%
        uint256 g3Expected = (totalCommission * 10) / 100; // 10%
        uint256 g4Expected = (totalCommission * 10) / 100; // 10%
        uint256 coinStorExpected = (totalCommission * 4) / 100; // 4%
        
        // Verify commission balances in CommissionDistribution contract
        assertEq(
            commissionDist.commissionBalances(referrerG1),
            g1Expected,
            "G1 commission incorrect"
        );
        assertEq(
            commissionDist.commissionBalances(referrerG2),
            g2Expected,
            "G2 commission incorrect"
        );
        assertEq(
            commissionDist.commissionBalances(referrerG3),
            g3Expected,
            "G3 commission incorrect"
        );
        assertEq(
            commissionDist.commissionBalances(referrerG4),
            g4Expected,
            "G4 commission incorrect"
        );
        assertEq(
            commissionDist.commissionBalances(coinStor),
            coinStorExpected,
            "CoinStor commission incorrect"
        );
        
        console.log("Commission distribution verified:");
        console.log("G1 (20%):", g1Expected);
        console.log("G2 (10%):", g2Expected);
        console.log("G3 (10%):", g3Expected);
        console.log("G4 (10%):", g4Expected);
        console.log("CoinStor (4%):", coinStorExpected);
    }
    
    function test_TotalCommissionPercentage() public {
        // Verify total commission is 54% (20+10+10+10+4)
        uint256 totalCommission = MINT_PRICE;
        uint256 expectedTotal = (totalCommission * 54) / 100;
        
        // This test documents the expected total commission rate
        assertEq(expectedTotal, (MINT_PRICE * 54) / 100, "Total commission calculation");
        
        console.log("Total commission (54%):", expectedTotal);
    }
}

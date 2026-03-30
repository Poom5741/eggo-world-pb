// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

contract AnvilIntegrationTest is Test {
    EggNFT public eggNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public deployer;
    address public buyer;
    address public referrerG1;
    address public referrerG2;
    address public coinStorReserve;
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 1000 * 10^18;
    
    function setUp() public {
        deployer = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        referrerG2 = address(0x3);
        coinStorReserve = address(0x4);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve);
        eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
        commissionDistribution.setEggNFTContract(address(eggNFT));
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
        mockUSDT.mint(referrerG2, INITIAL_BALANCE);
        
        vm.deal(address(commissionDistribution), INITIAL_BALANCE);
    }
    
    function test_AnvilDeployment() public {
        assertEq(block.chainid, 31337, "Should be on Anvil");
        assertEq(eggNFT.owner(), deployer);
        assertEq(eggNFT.mintPrice(), MINT_PRICE);
    }
    
    function test_CompleteMintFlowOnAnvil() public {
        console.log("=== Testing Complete Mint Flow on Anvil ===");
        
        uint256 buyerBalanceBefore = mockUSDT.balanceOf(buyer);
        console.log("Buyer balance before:", buyerBalanceBefore);
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        
        uint256 tokenId = eggNFT.mintEggWithChain(referralChain);
        vm.stopPrank();
        
        console.log("Minted Egg NFT with token ID:", tokenId);
        
        assertEq(tokenId, 1, "Token ID should be 1");
        assertEq(eggNFT.ownerOf(tokenId), buyer, "Buyer should own the NFT");
        
        (
            uint256 eggId,
            address owner,
            uint256 foodCount,
            bool isHatched,
            uint256 raritySeed,
            address[4] memory chain
        ) = eggNFT.getEggProperties(tokenId);
        
        console.log("Egg ID:", eggId);
        console.log("Food Count:", foodCount);
        console.log("Is Hatched:", isHatched);
        console.log("Rarity Seed:", raritySeed);
        
        assertEq(foodCount, 2, "Should have 2 Food NFTs");
        assertFalse(isHatched, "Should not be hatched");
        assertEq(chain[0], referrerG1, "G1 should be recorded");
        assertEq(chain[1], referrerG2, "G2 should be recorded");
        
        uint256 buyerBalanceAfter = mockUSDT.balanceOf(buyer);
        assertEq(buyerBalanceAfter, buyerBalanceBefore - MINT_PRICE, "Should deduct 25 USDT");
        
        uint256 g1Balance = commissionDistribution.getCommissionBalance(referrerG1);
        uint256 g2Balance = commissionDistribution.getCommissionBalance(referrerG2);
        uint256 coinStorBalance = commissionDistribution.getCommissionBalance(coinStorReserve);
        
        console.log("G1 Commission:", g1Balance);
        console.log("G2 Commission:", g2Balance);
        console.log("CoinStor:", coinStorBalance);
        
        assertEq(g1Balance, (MINT_PRICE * 20) / 100, "G1 should get 20%");
        assertEq(g2Balance, (MINT_PRICE * 10) / 100, "G2 should get 10%");
        assertGe(coinStorBalance, (MINT_PRICE * 4) / 100, "CoinStor should get 4%");
        
        console.log("=== Mint Flow Test PASSED ===");
    }
    
    function test_HatchEggOnAnvil() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        uint256 tokenId = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        (,,,bool isHatched,,) = eggNFT.getEggProperties(tokenId);
        assertFalse(isHatched);
        
        vm.prank(buyer);
        eggNFT.hatchEgg(tokenId);
        
        (,,,isHatched,,) = eggNFT.getEggProperties(tokenId);
        assertTrue(isHatched);
        
        console.log("Egg hatched successfully!");
    }
    
    function test_ClaimCommissionOnAnvil() public {
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        vm.prank(buyer);
        eggNFT.mintEgg(referrerG1);
        
        uint256 g1BalanceBefore = commissionDistribution.getCommissionBalance(referrerG1);
        assertGt(g1BalanceBefore, 0);
        
        uint256 initialBalance = address(referrerG1).balance;
        
        vm.deal(address(commissionDistribution), g1BalanceBefore);
        
        vm.prank(referrerG1);
        commissionDistribution.claimCommission();
        
        uint256 g1BalanceAfter = commissionDistribution.getCommissionBalance(referrerG1);
        assertEq(g1BalanceAfter, 0, "Balance should be 0 after claim");
        
        console.log("Commission claimed successfully!");
    }
    
    function test_MultipleMintsOnAnvil() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE * 3);
        
        uint256 tokenId1 = eggNFT.mintEgg(referrerG1);
        uint256 tokenId2 = eggNFT.mintEgg(referrerG2);
        uint256 tokenId3 = eggNFT.mintEgg(address(0));
        vm.stopPrank();
        
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(tokenId3, 3);
        
        console.log("Multiple mints successful! Total eggs:", eggNFT.totalSupply());
        assertEq(eggNFT.totalSupply(), 3);
    }
}

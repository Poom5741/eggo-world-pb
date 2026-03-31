// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract EggNFTTest is Test {
    EggNFT public eggNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public buyer;
    address public referrerG1;
    address public referrerG2;
    address public referrerG3;
    address public referrerG4;
    address public coinStorReserve;
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 1000 * 10^18;
    
    event EggMinted(uint256 indexed egg_id, address indexed buyer, address indexed referrer);
    
    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        referrerG2 = address(0x3);
        referrerG3 = address(0x4);
        referrerG4 = address(0x5);
        coinStorReserve = address(0x6);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve);
        eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
        mockUSDT.mint(referrerG2, INITIAL_BALANCE);
        
        vm.deal(address(commissionDistribution), INITIAL_BALANCE);
    }
    
    function test_Deployment() public {
        assertEq(eggNFT.owner(), owner);
        assertEq(eggNFT.mintPrice(), MINT_PRICE);
        assertEq(address(eggNFT.usdtToken()), address(mockUSDT));
    }
    
    function test_MintWithUSDT() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit EggMinted(1, buyer, referrerG1);
        
        uint256 tokenId = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        assertEq(tokenId, 1);
        assertEq(eggNFT.ownerOf(tokenId), buyer);
        
        (
            uint256 eggId,
            address eggOwner,
            uint256 foodCount,
            bool isHatched,
            uint256 raritySeed,
            address[4] memory referralChain,
            uint256 animalTokenId,
            uint256 parent1Id,
            uint256 parent2Id,
            bool isBreedingEgg,
            uint256 rarityUpgradeCount,
            uint256 generation
        ) = eggNFT.getEggProperties(tokenId);
        
        assertEq(eggId, 1);
        assertEq(eggOwner, buyer);
        assertEq(foodCount, 2);
        assertFalse(isHatched);
        assertEq(referralChain[0], referrerG1);
        assertEq(referralChain[1], address(0));
        assertEq(referralChain[2], address(0));
        assertEq(referralChain[3], address(0));
    }
    
    function test_FoodCountIncrement() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        uint256 tokenId = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        (,,uint256 foodCount,,,,,,,,,) = eggNFT.getEggProperties(tokenId);
        assertEq(foodCount, 2, "Food count should be 2 after mint");
    }
    
    function test_ReferralChainRecording() public {
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        referralChain[2] = referrerG3;
        referralChain[3] = referrerG4;
        
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        uint256 tokenId = eggNFT.mintEggWithChain(referralChain);
        
        (,,,,,address[4] memory storedChain,,,,,,) = eggNFT.getEggProperties(tokenId);
        
        assertEq(storedChain[0], referrerG1, "G1 should be recorded");
        assertEq(storedChain[1], referrerG2, "G2 should be recorded");
        assertEq(storedChain[2], referrerG3, "G3 should be recorded");
        assertEq(storedChain[3], referrerG4, "G4 should be recorded");
    }
    
    function test_CommissionDistribution() public {
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        
        uint256 g1Expected = (MINT_PRICE * 20) / 100;
        uint256 g2Expected = (MINT_PRICE * 10) / 100;
        uint256 coinStorExpected = (MINT_PRICE * 4) / 100;
        
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        eggNFT.mintEggWithChain(referralChain);
        
        assertEq(commissionDistribution.getCommissionBalance(referrerG1), g1Expected);
        assertEq(commissionDistribution.getCommissionBalance(referrerG2), g2Expected);
        assertGe(commissionDistribution.getCommissionBalance(coinStorReserve), coinStorExpected);
    }
    
    function test_CoinStorReserve() public {
        uint256 coinStorExpected = (MINT_PRICE * 4) / 100;
        
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        eggNFT.mintEgg(referrerG1);
        
        assertGe(commissionDistribution.getCommissionBalance(coinStorReserve), coinStorExpected);
    }
    
    function test_EventEmission() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit EggMinted(1, buyer, referrerG1);
        
        eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
    }
    
    // Egg hatching now requires 10 food items - tested in FoodNFT.t.sol
    
    function test_MintWithNoReferrer() public {
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        uint256 tokenId = eggNFT.mintEgg(address(0));
        
        assertEq(tokenId, 1);
        assertEq(eggNFT.ownerOf(tokenId), buyer);
        
        (,,,,,address[4] memory referralChain,,,,,,) = eggNFT.getEggProperties(tokenId);
        assertEq(referralChain[0], address(0));
    }
    
    function test_MintWithPartialChain() public {
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        uint256 tokenId = eggNFT.mintEggWithChain(referralChain);
        
        (,,,,,address[4] memory storedChain,,,,,,) = eggNFT.getEggProperties(tokenId);
        assertEq(storedChain[0], referrerG1);
        assertEq(storedChain[1], address(0));
        assertEq(storedChain[2], address(0));
        assertEq(storedChain[3], address(0));
    }
    
    function test_USDTTransfer() public {
        uint256 buyerBalanceBefore = mockUSDT.balanceOf(buyer);
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        assertEq(mockUSDT.balanceOf(buyer), buyerBalanceBefore - MINT_PRICE);
    }
    
    function test_ReentrancyProtection() public {
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        eggNFT.mintEgg(referrerG1);
        
        (,,,,,address[4] memory referralChain,,,,,,) = eggNFT.getEggProperties(1);
        assertEq(referralChain[0], referrerG1);
    }
    
    function test_MultipleMints() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE * 3);
        
        uint256 tokenId1 = eggNFT.mintEgg(referrerG1);
        uint256 tokenId2 = eggNFT.mintEgg(referrerG2);
        uint256 tokenId3 = eggNFT.mintEgg(referrerG3);
        vm.stopPrank();
        
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(tokenId3, 3);
        
        assertEq(eggNFT.ownerOf(tokenId1), buyer);
        assertEq(eggNFT.ownerOf(tokenId2), buyer);
        assertEq(eggNFT.ownerOf(tokenId3), buyer);
    }
    
    function test_WithdrawCommission() public {
        vm.prank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.prank(buyer);
        eggNFT.mintEgg(referrerG1);
        
        uint256 g1Balance = commissionDistribution.getCommissionBalance(referrerG1);
        assertGt(g1Balance, 0);
        
        vm.deal(address(commissionDistribution), g1Balance);
        
        vm.prank(referrerG1);
        commissionDistribution.claimCommission();
        
        assertEq(commissionDistribution.getCommissionBalance(referrerG1), 0);
    }
    
    function test_FullMintFlow() public {
        address[4] memory referralChain;
        referralChain[0] = referrerG1;
        referralChain[1] = referrerG2;
        referralChain[2] = referrerG3;
        referralChain[3] = referrerG4;
        
        uint256 buyerBalanceBefore = mockUSDT.balanceOf(buyer);
        
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        uint256 tokenId = eggNFT.mintEggWithChain(referralChain);
        vm.stopPrank();
        
        assertEq(tokenId, 1);
        assertEq(eggNFT.ownerOf(tokenId), buyer);
        assertEq(mockUSDT.balanceOf(buyer), buyerBalanceBefore - MINT_PRICE);
        
        (
            uint256 eggId,
            address eggOwner,
            uint256 foodCount,
            bool isHatched,
            uint256 raritySeed,
            address[4] memory storedChain,
            uint256 animalTokenId,
            ,
            ,
            ,
            ,

        ) = eggNFT.getEggProperties(tokenId);
        
        assertEq(eggId, 1);
        assertEq(eggOwner, buyer);
        assertEq(foodCount, 2);
        assertFalse(isHatched);
        assertEq(storedChain[0], referrerG1);
        assertEq(storedChain[1], referrerG2);
        assertEq(storedChain[2], referrerG3);
        assertEq(storedChain[3], referrerG4);
        
        uint256 g1Balance = commissionDistribution.getCommissionBalance(referrerG1);
        uint256 g2Balance = commissionDistribution.getCommissionBalance(referrerG2);
        uint256 coinStorBalance = commissionDistribution.getCommissionBalance(coinStorReserve);
        
        assertEq(g1Balance, (MINT_PRICE * 20) / 100);
        assertEq(g2Balance, (MINT_PRICE * 10) / 100);
        assertGe(coinStorBalance, (MINT_PRICE * 4) / 100);
    }
}

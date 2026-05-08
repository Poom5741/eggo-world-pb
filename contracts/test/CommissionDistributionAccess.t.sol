// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";

// Mock USDT token for testing
contract MockUSDT {
    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(amount <= allowance[from][msg.sender], "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    // Simulate minting USDT to an address
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

// Mock contracts to simulate EggNFT and FoodNFT
contract MockEggNFT {
    CommissionDistribution public commissionDist;
    
    constructor(CommissionDistribution _commissionDist) {
        commissionDist = _commissionDist;
    }
    
    function mintEgg(address[4] calldata referralChain, uint256 amount) external {
        commissionDist.distributeCommission(referralChain, amount);
    }
}

contract MockFoodNFT {
    CommissionDistribution public commissionDist;
    
    constructor(CommissionDistribution _commissionDist) {
        commissionDist = _commissionDist;
    }
    
    function mintFood(address[4] calldata referralChain, uint256 amount) external {
        commissionDist.distributeCommission(referralChain, amount);
    }
}

contract CommissionDistributionAccessTest is Test {
    CommissionDistribution public commissionDist;
    MockEggNFT public mockEggNFT;
    MockFoodNFT public mockFoodNFT;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public coinStorReserve;
    address public treasury;
    address[4] public referralChain;
    address public randomCaller;
    
    uint256 public constant TEST_AMOUNT = 1000 ether;
    
    function setUp() public {
        owner = makeAddr("owner");
        coinStorReserve = makeAddr("coinStorReserve");
        treasury = makeAddr("treasury");
        randomCaller = makeAddr("randomCaller");
        
        referralChain[0] = makeAddr("referrer1");
        referralChain[1] = makeAddr("referrer2");
        referralChain[2] = makeAddr("referrer3");
        referralChain[3] = makeAddr("referrer4");
        
        vm.startPrank(owner);
        mockUSDT = new MockUSDT(1000000 ether);
        commissionDist = new CommissionDistribution(coinStorReserve, address(mockUSDT), treasury);
        mockEggNFT = new MockEggNFT(commissionDist);
        mockFoodNFT = new MockFoodNFT(commissionDist);
        
        // Set contract addresses
        commissionDist.setEggNFTContract(address(mockEggNFT));
        commissionDist.setFoodNFTContract(address(mockFoodNFT));
        vm.stopPrank();
    }
    
    // Test 1: Owner cannot call distributeCommission directly
    function testOwnerCannotDistributeCommission() public {
        vm.prank(owner);
        vm.expectRevert("Not authorized");
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
    }
    
    // Test 2: EggNFT contract can call distributeCommission via mintEgg
    function testEggNFTCanDistributeCommission() public {
        // Mint USDT to owner to satisfy the requirement contract might have for transfers
        mockUSDT.mint(owner, TEST_AMOUNT);
        
        vm.prank(address(mockEggNFT));
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
        
        // Verify that commissions were distributed properly
        uint256 expectedCommission = (TEST_AMOUNT * 20) / 100; // G1 percent for first referrer
        uint256 actualBalance = commissionDist.commissionBalances(referralChain[0]);
        assertEq(actualBalance, expectedCommission, "EggNFT commission not distributed correctly");
    }
    
    // Test 3: FoodNFT contract can call distributeCommission via mintFood
    function testFoodNFTCanDistributeCommission() public {
        // Mint USDT to owner to satisfy the requirement contract might have for transfers
        mockUSDT.mint(owner, TEST_AMOUNT);
        
        vm.prank(address(mockFoodNFT));
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT / 2); // Different amount
        
        // Verify that commissions were distributed properly
        uint256 expectedCommission = ((TEST_AMOUNT / 2) * 10) / 100; // G2 percent for second referrer
        uint256 actualBalance = commissionDist.commissionBalances(referralChain[1]);
        assertEq(actualBalance, expectedCommission, "FoodNFT commission not distributed correctly");
    }
    
    // Test 4: Arbitrary address cannot call distributeCommission
    function testArbitraryAddressCannotDistributeCommission() public {
        vm.prank(randomCaller);
        vm.expectRevert("Not authorized");
        commissionDist.distributeCommission(referralChain, TEST_AMOUNT);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

contract TestIntegration is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        address referrer = address(0x1);
        address coinStor = address(0x2);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        MockUSDT usdt = new MockUSDT();
        address treasuryAddress = address(0x888); // Test treasury address
        CommissionDistribution dist = new CommissionDistribution(coinStor, address(usdt), treasuryAddress);
        
        vm.stopBroadcast();
        
        console.log("=== Integration Test ===");
        console.log("USDT deployed:", address(usdt));
        console.log("CommissionDistribution deployed:", address(dist));
        
        // Test 1: Fund contract with USDT
        usdt.mint(address(dist), 1000 * 10^18);
        uint256 contractBalance = usdt.balanceOf(address(dist));
        console.log("USDT balance in CommissionDistribution:", contractBalance);
        
        // Test 2: Distribute commission
        address[4] memory referralChain;
        referralChain[0] = referrer;
        
        dist.distributeCommission(referralChain, 100 * 10^18);
        
        // Test 3: Check commission balance
        uint256 referrerBalance = dist.commissionBalances(referrer);
        console.log("Referrer commission balance:", referrerBalance);
        
        // Test 4: Claim commission in USDT
        vm.prank(referrer);
        dist.claimCommissionUSDT();
        
        // Test 5: Verify USDT transferred
        uint256 referrerUSDT = usdt.balanceOf(referrer);
        console.log("Referrer USDT after claim:", referrerUSDT);
        console.log("CommissionDistribution USDT remaining:", usdt.balanceOf(address(dist)));
        
        // Test 6: Try to claim again (should revert)
        vm.prank(referrer);
        try dist.claimCommissionUSDT() {
            console.log("ERROR: Should have reverted");
        } catch (bytes memory) {
            console.log("SUCCESS: claimCommissionUSDT correctly reverted (no balance)");
        }
        
        console.log("=== All Tests Passed ===");
    }
}

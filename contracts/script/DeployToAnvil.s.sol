// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

contract DeployToAnvil is Script {
    function run() external {
        // Use Anvil's default account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address coinStorReserve = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Anvil account 1
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MockUSDT (for testing)
        MockUSDT mockUSDT = new MockUSDT();
        address usdtAddress = address(mockUSDT);
        console.log("MockUSDT deployed at:", usdtAddress);
        
        // Deploy CommissionDistribution with USDT support
        CommissionDistribution commissionDist = new CommissionDistribution(coinStorReserve, usdtAddress);
        console.log("CommissionDistribution deployed at:", address(commissionDist));
        
        // Fund deployment account with MockUSDT for testing
        address deployer = vm.addr(deployerPrivateKey);
        mockUSDT.mint(deployer, 1_000_000 * 10^18);
        console.log("Minted 1M MockUSDT to deployer:", deployer);
        
        vm.stopBroadcast();
        
        // Output deployment info
        console.log("=== Deployment Complete ===");
        console.log("Network: Anvil (localhost:8545)");
        console.log("Chain ID: 31337");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  USDT:", usdtAddress);
        console.log("  CommissionDistribution:", address(commissionDist));
        console.log("");
        console.log("Test Commands:");
        console.log("  cast call", address(commissionDist), "getCompressionBalance(address)(uint256)", deployerPrivateKey);
        console.log("  cast send", address(commissionDist), "distributeCommission(address[4],uint256)");
    }
}

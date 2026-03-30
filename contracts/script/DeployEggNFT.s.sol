// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

contract DeployEggNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address coinStorReserve = vm.envAddress("COINSTOR_RESERVE_ADDRESS");
        bool deployMockUSDT = vm.envBool("DEPLOY_MOCK_USDT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        address usdtAddress;
        
        if (deployMockUSDT) {
            MockUSDT mockUSDT = new MockUSDT();
            usdtAddress = address(mockUSDT);
            console.log("MockUSDT deployed at:", usdtAddress);
        } else {
            usdtAddress = vm.envAddress("USDT_ADDRESS");
            console.log("Using existing USDT at:", usdtAddress);
        }
        
        CommissionDistribution commissionDistribution = new CommissionDistribution(coinStorReserve);
        console.log("CommissionDistribution deployed at:", address(commissionDistribution));
        
        EggNFT eggNFT = new EggNFT(address(commissionDistribution), usdtAddress);
        console.log("EggNFT deployed at:", address(eggNFT));
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        console.log("EggNFT contract set on CommissionDistribution");
        
        vm.stopBroadcast();
        
        console.log("\n========== Deployment Summary ==========");
        console.log("Network:", block.chainid);
        console.log("USDT Token:", usdtAddress);
        console.log("CommissionDistribution:", address(commissionDistribution));
        console.log("EggNFT:", address(eggNFT));
        console.log("CoinStor Reserve:", coinStorReserve);
        console.log("Mint Price: 25 USDT");
        console.log("========================================\n");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
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
        
        AnimalNFT animalNFT = new AnimalNFT();
        console.log("AnimalNFT deployed at:", address(animalNFT));
        
        EggNFT eggNFT = new EggNFT(address(commissionDistribution), usdtAddress);
        console.log("EggNFT deployed at:", address(eggNFT));
        
        FoodNFT foodNFT = new FoodNFT(address(commissionDistribution), usdtAddress, address(eggNFT));
        console.log("FoodNFT deployed at:", address(foodNFT));
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        console.log("EggNFT contract set on CommissionDistribution");
        
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        console.log("FoodNFT contract set on CommissionDistribution");
        
        eggNFT.setFoodNFTContract(address(foodNFT));
        console.log("FoodNFT contract set on EggNFT");
        
        eggNFT.setAnimalNFTContract(address(animalNFT));
        console.log("AnimalNFT contract set on EggNFT");
        
        animalNFT.setEggNFTContract(address(eggNFT));
        console.log("EggNFT contract set on AnimalNFT");
        
        vm.stopBroadcast();
        
        console.log("\n========== Deployment Summary ==========");
        console.log("Network:", block.chainid);
        console.log("USDT Token:", usdtAddress);
        console.log("CommissionDistribution:", address(commissionDistribution));
        console.log("AnimalNFT:", address(animalNFT));
        console.log("EggNFT:", address(eggNFT));
        console.log("FoodNFT:", address(foodNFT));
        console.log("CoinStor Reserve:", coinStorReserve);
        console.log("Egg Mint Price: 25 USDT");
        console.log("Food Mint Price: 0.50 USDT");
        console.log("========================================\n");
    }
}

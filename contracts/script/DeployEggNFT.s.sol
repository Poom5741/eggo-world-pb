// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {MockUSDT} from "../test/MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract DeployEggNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address coinStorReserve = vm.envAddress("COINSTOR_RESERVE_ADDRESS");
        bool deployMockUSDT = vm.envBool("DEPLOY_MOCK_USDT");
        
        address vrfCoordinator;
        if (block.chainid == 97) {
            vrfCoordinator = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
        } else if (block.chainid == 56) {
            vrfCoordinator = 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9;
        } else {
            vrfCoordinator = address(new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18));
        }
        
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
        
        address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
        CommissionDistribution commissionDistribution = new CommissionDistribution(coinStorReserve, usdtAddress, treasuryAddress);
        console.log("CommissionDistribution deployed at:", payable(address(commissionDistribution)));
        
        AnimalNFT animalNFT = new AnimalNFT();
        console.log("AnimalNFT deployed at:", address(animalNFT));
        
        EggNFT eggNFT = new EggNFT(payable(address(commissionDistribution)), usdtAddress, vrfCoordinator);
        console.log("EggNFT deployed at:", address(eggNFT));
        
        FoodNFT foodNFT = new FoodNFT(payable(address(commissionDistribution)), usdtAddress, address(eggNFT));
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
        console.log("CommissionDistribution:", payable(address(commissionDistribution)));
        console.log("AnimalNFT:", address(animalNFT));
        console.log("EggNFT:", address(eggNFT));
        console.log("FoodNFT:", address(foodNFT));
        console.log("CoinStor Reserve:", coinStorReserve);
        console.log("Egg Mint Price: 25 USDT");
        console.log("Food Mint Price: 0.50 USDT");
        console.log("========================================\n");
    }
}

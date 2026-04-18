// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

/**
 * @title Deploy.s.sol
 * @notice Unified deployment script for all NFT contracts to any EVM network
 * @dev Supports 0xl3 testnet (Chain ID: 7117), BSC testnet (97), BSC mainnet (56)
 * 
 * Environment variables required:
 * - DEPLOYER_PRIVATE_KEY: Private key of deployer account
 * - COINSTOR_RESERVE_ADDRESS: Address for commission reserve
 * - DEPLOY_MOCK_USDT: true for testnets, false for mainnet
 * - USDT_ADDRESS: (optional) Existing USDT address if DEPLOY_MOCK_USDT=false
 * 
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast -vv
 */
contract Deploy is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address coinStorReserve = vm.envAddress("COINSTOR_RESERVE_ADDRESS");
        bool deployMockUSDT = vm.envBool("DEPLOY_MOCK_USDT");
        
        console.log("Starting deployment...");
        console.log("Network Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("CoinStor Reserve:", coinStorReserve);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy or use existing USDT
        address usdtAddress;
        if (deployMockUSDT) {
            MockUSDT mockUSDT = new MockUSDT();
            usdtAddress = address(mockUSDT);
            console.log("[OK] MockUSDT deployed at:", usdtAddress);
        } else {
            usdtAddress = vm.envAddress("USDT_ADDRESS");
            console.log("[OK] Using existing USDT at:", usdtAddress);
        }
        
        // Deploy CommissionDistribution
        CommissionDistribution commissionDistribution = new CommissionDistribution(
            coinStorReserve,
            usdtAddress
        );
        console.log("[OK] CommissionDistribution deployed at:", address(commissionDistribution));
        
        // Deploy AnimalNFT
        AnimalNFT animalNFT = new AnimalNFT();
        console.log("[OK] AnimalNFT deployed at:", address(animalNFT));
        
        // Deploy EggNFT
        EggNFT eggNFT = new EggNFT(
            address(commissionDistribution),
            usdtAddress
        );
        console.log("[OK] EggNFT deployed at:", address(eggNFT));
        
        // Deploy FoodNFT
        FoodNFT foodNFT = new FoodNFT(
            address(commissionDistribution),
            usdtAddress,
            address(eggNFT)
        );
        console.log("[OK] FoodNFT deployed at:", address(foodNFT));
        
        // Link contracts
        commissionDistribution.setEggNFTContract(address(eggNFT));
        console.log("[OK] EggNFT contract set on CommissionDistribution");
        
        commissionDistribution.setFoodNFTContract(address(foodNFT));
        console.log("[OK] FoodNFT contract set on CommissionDistribution");
        
        eggNFT.setFoodNFTContract(address(foodNFT));
        console.log("[OK] FoodNFT contract set on EggNFT");
        
        eggNFT.setAnimalNFTContract(address(animalNFT));
        console.log("[OK] AnimalNFT contract set on EggNFT");
        
        animalNFT.setEggNFTContract(address(eggNFT));
        console.log("[OK] EggNFT contract set on AnimalNFT");
        
        vm.stopBroadcast();
        
        // Save deployment addresses to JSON file
        string memory deploymentData = vm.toString(block.chainid);
        vm.writeJson(
            deploymentData,
            "contract-addresses.json"
        );
        
        // Print summary
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
        
        // Output JSON for automated parsing
        console.log("DEPLOYMENT_ADDRESSES_START");
        console.log("{");
        console.log('  "%s": {', vm.toString(block.chainid));
        console.log('    "usdt": "%s",', usdtAddress);
        console.log('    "commission": "%s",', address(commissionDistribution));
        console.log('    "animalNft": "%s",', address(animalNFT));
        console.log('    "eggNft": "%s",', address(eggNFT));
        console.log('    "foodNft": "%s"', address(foodNFT));
        console.log("  }");
        console.log("}");
        console.log("DEPLOYMENT_ADDRESSES_END");
    }
}

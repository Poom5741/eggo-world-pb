// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {MockUSDT} from "../test/MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

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
        
        // VRF Coordinator addresses
        address vrfCoordinator;
        if (block.chainid == 97) {
            // BSC Testnet
            vrfCoordinator = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
        } else if (block.chainid == 56) {
            // BSC Mainnet
            vrfCoordinator = 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9;
        } else {
            // Local/other — deploy mock
            vrfCoordinator = address(new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18));
        }
        
        console.log("Starting deployment...");
        console.log("Network Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("CoinStor Reserve:", coinStorReserve);
        console.log("VRF Coordinator:", vrfCoordinator);
        
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
        address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
        CommissionDistribution commissionDistribution = new CommissionDistribution(
            coinStorReserve,
            usdtAddress,
            treasuryAddress
        );
        console.log("[OK] CommissionDistribution deployed at:", payable(address(commissionDistribution)));
        
        // Deploy AnimalNFT
        AnimalNFT animalNFT = new AnimalNFT();
        console.log("[OK] AnimalNFT deployed at:", address(animalNFT));
        
        // Deploy EggNFT with VRF coordinator
        EggNFT eggNFT = new EggNFT(
            payable(address(commissionDistribution)),
            usdtAddress,
            vrfCoordinator
        );
        console.log("[OK] EggNFT deployed at:", address(eggNFT));
        console.log("[OK] VRF Coordinator:", vrfCoordinator);
        
        // Deploy FoodNFT
        FoodNFT foodNFT = new FoodNFT(
            payable(address(commissionDistribution)),
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
        console.log("CommissionDistribution:", payable(address(commissionDistribution)));
        console.log("AnimalNFT:", address(animalNFT));
        console.log("EggNFT:", address(eggNFT));
        console.log("FoodNFT:", address(foodNFT));
        console.log("CoinStor Reserve:", coinStorReserve);
        console.log("Egg Mint Price: 25 USDT");
        console.log("Food Mint Price: 0.50 USDT");
        console.log("========================================\n");
        
        // Post-deployment VRF instructions
        if (block.chainid == 97 || block.chainid == 56) {
            console.log("=== Post-Deployment VRF Steps ===");
            console.log("1. Create VRF subscription at https://vrf.chain.link");
            console.log("2. Add EggNFT as consumer to subscription");
            console.log("3. Fund subscription with LINK or BNB");
            console.log("4. Call setVRFConfig(subscriptionId, keyHash) on EggNFT");
            if (block.chainid == 97) {
                console.log("   Testnet keyHash: 0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26");
            } else {
                console.log("   Mainnet keyHash: 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
            }
        }
        
        // Output JSON for automated parsing
        console.log("DEPLOYMENT_ADDRESSES_START");
        console.log("{");
        console.log('  "%s": {', vm.toString(block.chainid));
        console.log('    "usdt": "%s",', usdtAddress);
        console.log('    "commission": "%s",', payable(address(commissionDistribution)));
        console.log('    "animalNft": "%s",', address(animalNFT));
        console.log('    "eggNft": "%s",', address(eggNFT));
        console.log('    "foodNft": "%s"', address(foodNFT));
        console.log("  }");
        console.log("}");
        console.log("DEPLOYMENT_ADDRESSES_END");
    }
}

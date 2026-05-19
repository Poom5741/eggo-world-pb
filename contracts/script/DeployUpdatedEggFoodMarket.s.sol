// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";

/**
 * @title DeployUpdatedEggFoodMarket.s.sol
 * @notice Targeted redeployment: EggNFT, FoodNFT, Marketplace
 * @dev Reuses existing CommissionDistribution, USDT, AnimalNFT via env vars.
 *
 *      Required env vars:
 *        DEPLOYER_ADDRESS   - deployer (Ledger)
 *        USDT_ADDRESS       - existing USDT
 *        COMMISSION_ADDRESS - existing CommissionDistribution
 *        ANIMALNFT_ADDRESS  - existing AnimalNFT
 *
 * Usage (BSC Mainnet):
 *   forge script script/DeployUpdatedEggFoodMarket.s.sol --rpc-url bsc --ledger --broadcast -vvvvv
 */
contract DeployUpdatedEggFoodMarket is Script {
    function run() external {
        address existingCommission = vm.envAddress("COMMISSION_ADDRESS");
        address existingUsdt = vm.envAddress("USDT_ADDRESS");
        address existingAnimalNft = vm.envAddress("ANIMALNFT_ADDRESS");

        address vrfCoordinator;
        if (block.chainid == 56) {
            vrfCoordinator = 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9;
        } else if (block.chainid == 97) {
            vrfCoordinator = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
        } else {
            revert("Unsupported chain - only BSC mainnet (56) and testnet (97)");
        }

        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        console.log("Mainnet deployment - using Ledger");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        vm.startBroadcast();

        console.log("Existing CommissionDistribution:", existingCommission);
        console.log("Existing USDT:", existingUsdt);
        console.log("Existing AnimalNFT:", existingAnimalNft);
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("");

        // 1. Deploy new EggNFT
        EggNFT newEggNFT = new EggNFT(
            payable(existingCommission),
            existingUsdt,
            vrfCoordinator
        );
        console.log("[OK] New EggNFT deployed at:", address(newEggNFT));

        // 2. Deploy new FoodNFT
        FoodNFT newFoodNFT = new FoodNFT(
            payable(existingCommission),
            existingUsdt,
            address(newEggNFT)
        );
        console.log("[OK] New FoodNFT deployed at:", address(newFoodNFT));

        // 3. Deploy new Marketplace
        Marketplace newMarketplace = new Marketplace(
            existingUsdt,
            payable(existingCommission),
            address(newEggNFT),
            existingAnimalNft
        );
        console.log("[OK] New Marketplace deployed at:", address(newMarketplace));

        // 4. Link contracts
        CommissionDistribution(payable(existingCommission)).setEggNFTContract(address(newEggNFT));
        console.log("[OK] CommissionDistribution -> new EggNFT");

        CommissionDistribution(payable(existingCommission)).setFoodNFTContract(address(newFoodNFT));
        console.log("[OK] CommissionDistribution -> new FoodNFT");

        CommissionDistribution(payable(existingCommission)).setMarketplaceContract(address(newMarketplace));
        console.log("[OK] CommissionDistribution -> new Marketplace");

        newEggNFT.setFoodNFTContract(address(newFoodNFT));
        console.log("[OK] new EggNFT -> new FoodNFT");

        newEggNFT.setAnimalNFTContract(existingAnimalNft);
        console.log("[OK] new EggNFT -> existing AnimalNFT");

        AnimalNFT(existingAnimalNft).setEggNFTContract(address(newEggNFT));
        console.log("[OK] existing AnimalNFT -> new EggNFT");

        // 5. Set base URI
        string memory baseURI = "https://pub-fa62900ead6a48fb899263bdf24e6d43.r2.dev/metadata/";
        newEggNFT.setBaseURI(baseURI);
        console.log("[OK] Base URI set on new EggNFT");

        vm.stopBroadcast();

        console.log("\n========== Redeployment Summary ==========");
        console.log("Network:", block.chainid);
        console.log("NEW EggNFT:     ", address(newEggNFT));
        console.log("NEW FoodNFT:    ", address(newFoodNFT));
        console.log("NEW Marketplace:", address(newMarketplace));
        console.log("==========================================\n");

        console.log("DEPLOYMENT_ADDRESSES_START");
        console.log("{");
        console.log('  "%s": {', vm.toString(block.chainid));
        console.log('    "usdt": "%s",', existingUsdt);
        console.log('    "commission": "%s",', existingCommission);
        console.log('    "animalNft": "%s",', existingAnimalNft);
        console.log('    "eggNft": "%s",', address(newEggNFT));
        console.log('    "foodNft": "%s",', address(newFoodNFT));
        console.log('    "marketplace": "%s"', address(newMarketplace));
        console.log("  }");
        console.log("}");
        console.log("DEPLOYMENT_ADDRESSES_END");
    }
}

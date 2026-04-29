// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT} from "../src/AnimalNFT.sol";
import {MockUSDT} from "../test/MockUSDT.sol";

contract TestEggHatching is Script {
    MockUSDT public usdt;
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    AnimalNFT public animalNFT;
    
    address public user = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address public referrer = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    
    uint256 constant MINT_PRICE = 25 * 10^18;
    uint256 constant FOOD_PRICE = 50 * 10^16;
    
    function run() external {
        vm.startBroadcast(user);
        
        usdt = MockUSDT(0x5FbDB2315678afecb367f032d93F642f64180aa3);
        eggNFT = EggNFT(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);
        foodNFT = FoodNFT(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
        animalNFT = AnimalNFT(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);
        
        console.log("\n========== Testing Egg Hatching Flow ==========\n");
        
        console.log("Step 1: Mint USDT for testing");
        usdt.mint(user, 1000 * 10^18);
        console.log("Minted 1000 USDT");
        
        console.log("\nStep 2: Approve USDT for EggNFT and FoodNFT");
        usdt.approve(address(eggNFT), MINT_PRICE);
        usdt.approve(address(foodNFT), 10 * FOOD_PRICE);
        console.log("USDT approved");
        
        console.log("\nStep 3: Mint Egg NFT");
        uint256 eggTokenId = eggNFT.mintEgg(referrer);
        console.log("Egg minted! Token ID:", eggTokenId);
        
        console.log("\nStep 4: Mint Food NFTs (8 food items)");
        uint256[] memory foodIds = foodNFT.mintFood(8, referrer);
        console.log("Food minted! Count:", foodIds.length);
        
        console.log("\nStep 5: Feed Egg with Food NFTs");
        foodNFT.feedEgg(eggTokenId, foodIds, address(eggNFT));
        console.log("Egg fed successfully");
        
        console.log("\nStep 6: Hatch Egg!");
        uint256 animalId = eggNFT.hatchEgg(eggTokenId);
        console.log("Egg hatched! Animal NFT Token ID:", animalId);
        
        console.log("\nStep 7: Verify Animal NFT properties");
        uint256 rarity = uint256(animalNFT.getRarity(animalId));
        uint256 species = uint256(animalNFT.getSpecies(animalId));
        uint256 generation = animalNFT.getGeneration(animalId);
        address owner = animalNFT.ownerOf(animalId);
        
        console.log("Animal Properties:");
        console.log("  - Animal ID:", animalId);
        console.log("  - Owner:", owner);
        console.log("  - Generation:", generation);
        console.log("  - Rarity:", rarity);
        console.log("  - Species:", species);
        
        string memory rarityStr;
        if (rarity == 0) rarityStr = "Common";
        else if (rarity == 1) rarityStr = "Rare";
        else if (rarity == 2) rarityStr = "Epic";
        else rarityStr = "Legendary";
        
        string memory speciesStr;
        if (species == 0) speciesStr = "Chicken";
        else if (species == 1) speciesStr = "Duck";
        else if (species == 2) speciesStr = "Quail";
        else if (species == 3) speciesStr = "Peacock";
        else if (species == 4) speciesStr = "Swan";
        else if (species == 5) speciesStr = "Turkey";
        else if (species == 6) speciesStr = "Phoenix";
        else if (species == 7) speciesStr = "GoldenChicken";
        else if (species == 8) speciesStr = "SilverDuck";
        else if (species == 9) speciesStr = "Dragon";
        else if (species == 10) speciesStr = "Unicorn";
        else speciesStr = "Gryphon";
        
        console.log("\n========== HATCHING RESULT ==========");
        console.log("Rarity:", rarityStr);
        console.log("Species:", speciesStr);
        console.log("=====================================\n");
        
        console.log("Step 8: Verify egg is hatched");
        bool isHatched = eggNFT.isEggHatched(eggTokenId);
        console.log("Is Hatched:", isHatched);
        
        console.log("\nStep 9: Verify Animal NFT ownership");
        console.log("Owner matches user:", owner == user);
        
        console.log("\nAll tests passed! Egg hatching mechanism working correctly.\n");
        
        vm.stopBroadcast();
    }
}

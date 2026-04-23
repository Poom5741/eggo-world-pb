// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {CommissionDistribution} from "./CommissionDistribution.sol";
import {FoodNFT, FoodType} from "./FoodNFT.sol";
import {AnimalNFT, Rarity, Species} from "./AnimalNFT.sol";

contract EggNFT is ERC721, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    address public immutable commissionDistribution;
    IERC20 public immutable usdtToken;
    address public animalNFTContract;
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant BREEDING_FEE = 5 * 10^18;
    uint256 public constant UPGRADE_FEE = 0; // No fee — users already paid for food NFTs
    uint256 public constant MAX_FOOD_COUNT = 10;
    uint256 public constant INITIAL_FOOD_COUNT = 2;
    uint256 public constant MAX_UPGRADE_FOOD = 490; // Up to 500 total (10 base + 490 upgrade)
    uint256 public constant RARITY_BONUS_PER_FOOD = 2;
    
    address public foodNFTContract;
    
    uint256 private _nextTokenId;
    uint256 private _nextEggId;
    
    struct EggProperties {
        uint256 egg_id;
        address owner;
        uint256 food_count;
        bool is_hatched;
        uint256 rarity_seed;
        address[4] referral_chain;
        uint256 animal_token_id;
        bool is_breeding_egg;
        uint256 parent1_animal_id;
        uint256 parent2_animal_id;
        uint256 rarity_upgrade_count;
        uint256 generation;
    }
    
    mapping(uint256 => EggProperties) private _eggProperties;
    mapping(uint256 => mapping(uint256 => FoodType)) private _foodTypeHistory;
    mapping(address => bool) public authorizedFoodNFTContracts;
    
    event EggMinted(uint256 indexed egg_id, address indexed buyer, address indexed referrer);
    event EggHatched(uint256 indexed egg_id, uint256 indexed animal_id, Rarity rarity, Species species);
    event EggUpgraded(
        uint256 indexed egg_id,
        uint256 new_food_count,
        uint256 rarity_bonus
    );
    event BreedingEggCreated(
        uint256 indexed egg_id,
        uint256 indexed parent1_animal_id,
        uint256 indexed parent2_animal_id,
        uint256 generation
    );
    event AnimalsBred(
        uint256 indexed animal_id_1,
        uint256 indexed animal_id_2,
        uint256 indexed offspring_id,
        uint256 offspring_generation
    );
    event MintPriceUpdated(uint256 newPrice);
    event AnimalNFTContractSet(address indexed animalNFTContract);
    event PauseStateChanged(bool paused);
    
    constructor(
        address _commissionDistribution,
        address _usdtToken
    ) ERC721("EggNFT", "EGG") Ownable(msg.sender) {
        require(_commissionDistribution != address(0), "CommissionDistribution address cannot be zero");
        require(_usdtToken != address(0), "USDT token address cannot be zero");
        
        commissionDistribution = _commissionDistribution;
        usdtToken = IERC20(_usdtToken);
        _nextTokenId = 1;
        _nextEggId = 1;
    }
    
    function mintEgg(address referrer) external nonReentrant whenNotPaused returns (uint256) {
        address[4] memory referralChain;
        referralChain[0] = referrer;

        return _mintEggWithChain(msg.sender, referralChain);
    }

    function mintEggWithChain(address[4] calldata referralChain) external nonReentrant whenNotPaused returns (uint256) {
        return _mintEggWithChain(msg.sender, referralChain);
    }
    
    function _mintEggWithChain(address buyer, address[4] memory referralChain) private returns (uint256) {
        usdtToken.safeTransferFrom(buyer, commissionDistribution, MINT_PRICE);
        
        CommissionDistribution(commissionDistribution).distributeCommission(referralChain, MINT_PRICE);
        
        _nextTokenId++;
        _nextEggId++;
        
        uint256 tokenId = _nextTokenId - 1;
        uint256 eggId = _nextEggId - 1;
        
        _safeMint(buyer, tokenId);
        
        uint256 raritySeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            buyer,
            tokenId
        )));
        
        _eggProperties[tokenId] = EggProperties({
            egg_id: eggId,
            owner: buyer,
            food_count: INITIAL_FOOD_COUNT,
            is_hatched: false,
            rarity_seed: raritySeed,
            referral_chain: referralChain,
            animal_token_id: 0,
            is_breeding_egg: false,
            parent1_animal_id: 0,
            parent2_animal_id: 0,
            rarity_upgrade_count: 0,
            generation: 0
        });
        
        address primaryReferrer = referralChain[0];
        emit EggMinted(eggId, buyer, primaryReferrer);
        
        return tokenId;
    }
    
    function getEggProperties(uint256 tokenId) external view returns (
        uint256 egg_id,
        address owner,
        uint256 food_count,
        bool is_hatched,
        uint256 rarity_seed,
        address[4] memory referral_chain,
        uint256 animal_token_id,
        uint256 parent1_animal_id,
        uint256 parent2_animal_id,
        bool is_breeding_egg,
        uint256 rarity_upgrade_count,
        uint256 generation
    ) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        EggProperties memory props = _eggProperties[tokenId];
        return (
            props.egg_id,
            props.owner,
            props.food_count,
            props.is_hatched,
            props.rarity_seed,
            props.referral_chain,
            props.animal_token_id,
            props.parent1_animal_id,
            props.parent2_animal_id,
            props.is_breeding_egg,
            props.rarity_upgrade_count,
            props.generation
        );
    }
    
    function hatchEgg(uint256 tokenId) external nonReentrant returns (uint256) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        EggProperties storage props = _eggProperties[tokenId];
        require(!props.is_hatched, "Egg already hatched");
        require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");
        require(animalNFTContract != address(0), "AnimalNFT contract not set");
        
        uint256 finalSeed = uint256(keccak256(abi.encodePacked(
            props.rarity_seed,
            block.prevrandao,
            block.timestamp
        )));
        
        Rarity rarity;
        if (props.is_breeding_egg) {
            rarity = Rarity(props.rarity_seed);
        } else {
            rarity = _calculateRarity(finalSeed, props.rarity_upgrade_count);
        }
        
        FoodType[] memory foodHistory = new FoodType[](props.food_count);
        for (uint256 i = 0; i < props.food_count; i++) {
            foodHistory[i] = _foodTypeHistory[tokenId][i];
        }
        
        Species species = _determineSpecies(finalSeed, foodHistory, rarity);
        
        uint256[4] memory foodDistribution;
        for (uint256 i = 0; i < props.food_count; i++) {
            FoodType ft = foodHistory[i];
            if (ft == FoodType.Grain) foodDistribution[0]++;
            else if (ft == FoodType.Fish) foodDistribution[1]++;
            else if (ft == FoodType.Insects) foodDistribution[2]++;
            else if (ft == FoodType.Herb) foodDistribution[3]++;
        }
        
        uint256 generation = props.is_breeding_egg ? _calculateBreedingGeneration(props.parent1_animal_id, props.parent2_animal_id) : 0;
        
        uint256 animalTokenId = AnimalNFT(animalNFTContract).mintAnimal(
            msg.sender,
            props.egg_id,
            rarity,
            species,
            generation,
            foodDistribution,
            props.parent1_animal_id,
            props.parent2_animal_id,
            props.rarity_upgrade_count
        );
        
        props.is_hatched = true;
        props.animal_token_id = animalTokenId;
        
        if (props.is_breeding_egg) {
            emit AnimalsBred(props.parent1_animal_id, props.parent2_animal_id, animalTokenId, generation);
        }
        
        emit EggHatched(tokenId, animalTokenId, rarity, species);
        
        return animalTokenId;
    }
    
    function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external nonReentrant {
        require(ownerOf(eggTokenId) == msg.sender, "Not owner");
        require(foodIds.length > 0, "No food items");
        
        EggProperties storage props = _eggProperties[eggTokenId];
        require(!props.is_hatched, "Egg already hatched");
        require(props.food_count >= MAX_FOOD_COUNT, "Must feed 10 first");
        require(props.food_count + foodIds.length <= MAX_FOOD_COUNT + MAX_UPGRADE_FOOD, "Max 500 food items (10 base + 490 upgrade)");

        // No upgrade fee — users already paid for food NFTs
        
        // Burn food NFTs and increment food count
        for (uint256 i = 0; i < foodIds.length; i++) {
            // Verify caller owns the food NFT
            require(FoodNFT(foodNFTContract).balanceOf(msg.sender, foodIds[i]) > 0, "Must own food NFT");
            // Burn food using authorized burn
            FoodNFT(foodNFTContract).burnFoodFor(msg.sender, foodIds[i]);
            props.food_count++;
        }
        
        uint256 extraFoodCount = props.food_count - MAX_FOOD_COUNT;
        uint256 rarityBonus = extraFoodCount * RARITY_BONUS_PER_FOOD;
        
        props.rarity_upgrade_count = extraFoodCount;
        
        emit EggUpgraded(props.egg_id, props.food_count, rarityBonus);
    }
    
    function breedAnimals(
        uint256 parent1TokenId,
        uint256 parent2TokenId,
        address referrer
    ) external nonReentrant returns (uint256) {
        require(parent1TokenId != parent2TokenId, "Cannot breed same animal");
        require(AnimalNFT(animalNFTContract).ownerOf(parent1TokenId) == msg.sender, "Not owner of parent1");
        require(AnimalNFT(animalNFTContract).ownerOf(parent2TokenId) == msg.sender, "Not owner of parent2");
        require(AnimalNFT(animalNFTContract).canBreed(parent1TokenId), "Parent 1 on cooldown");
        require(AnimalNFT(animalNFTContract).canBreed(parent2TokenId), "Parent 2 on cooldown");
        
        (,,,Rarity rarity1, uint256 gen1,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent1TokenId);
        (,,,Rarity rarity2, uint256 gen2,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent2TokenId);
        
        uint256 childGeneration = (gen1 > gen2 ? gen1 : gen2) + 1;
        
        usdtToken.safeTransferFrom(msg.sender, commissionDistribution, BREEDING_FEE);
        
        address[4] memory referralChain;
        referralChain[0] = referrer;
        CommissionDistribution(commissionDistribution).distributeCommission(referralChain, BREEDING_FEE);
        
        _nextTokenId++;
        _nextEggId++;
        uint256 tokenId = _nextTokenId - 1;
        uint256 eggId = _nextEggId - 1;
        
        _safeMint(msg.sender, tokenId);
        
        uint256 raritySeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tokenId,
            parent1TokenId,
            parent2TokenId
        )));
        
        Rarity offspringRarity = _calculateOffspringRarity(rarity1, rarity2, raritySeed);
        
        _eggProperties[tokenId] = EggProperties({
            egg_id: eggId,
            owner: msg.sender,
            food_count: INITIAL_FOOD_COUNT,
            is_hatched: false,
            rarity_seed: uint256(offspringRarity),
            referral_chain: referralChain,
            animal_token_id: 0,
            is_breeding_egg: true,
            parent1_animal_id: parent1TokenId,
            parent2_animal_id: parent2TokenId,
            rarity_upgrade_count: 0,
            generation: childGeneration
        });
        
        AnimalNFT(animalNFTContract).recordBreeding(parent1TokenId);
        AnimalNFT(animalNFTContract).recordBreeding(parent2TokenId);
        
        emit BreedingEggCreated(eggId, parent1TokenId, parent2TokenId, childGeneration);
        
        return eggId;
    }
    
    function recordFoodConsumption(
        uint256 egg_token_id,
        uint256[] calldata food_ids,
        FoodType[] calldata food_types
    ) external onlyAuthorizedFoodNFTContract {
        require(food_ids.length == food_types.length, "Arrays length mismatch");
        
        EggProperties storage props = _eggProperties[egg_token_id];
        require(!props.is_hatched, "Egg already hatched");
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            _foodTypeHistory[egg_token_id][props.food_count] = food_types[i];
            props.food_count++;
        }
    }
    
    function getFoodTypeHistory(uint256 egg_token_id)
        external
        view
        returns (FoodType[] memory)
    {
        require(ownerOf(egg_token_id) != address(0), "Token does not exist");
        
        EggProperties memory props = _eggProperties[egg_token_id];
        FoodType[] memory history = new FoodType[](props.food_count);
        
        for (uint256 i = 0; i < props.food_count; i++) {
            history[i] = _foodTypeHistory[egg_token_id][i];
        }
        
        return history;
    }
    
    modifier onlyAuthorizedFoodNFTContract() {
        require(authorizedFoodNFTContracts[msg.sender], "Not authorized");
        _;
    }
    
    function getFoodCount(uint256 tokenId) external view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].food_count;
    }
    
    function isEggHatched(uint256 tokenId) external view returns (bool) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].is_hatched;
    }
    
    function getReferralChain(uint256 tokenId) external view returns (address[4] memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].referral_chain;
    }
    
    function mintPrice() external pure returns (uint256) {
        return MINT_PRICE;
    }
    
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0)) {
            _eggProperties[tokenId].owner = to;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(newPrice);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
        emit PauseStateChanged(true);
    }

    function unpause() external onlyOwner paused {
        _unpause();
        emit PauseStateChanged(false);
    }
    
    function _calculateBreedingGeneration(uint256 parent1Id, uint256 parent2Id) internal view returns (uint256) {
        (,,,,uint256 gen1,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent1Id);
        (,,,,uint256 gen2,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent2Id);
        return (gen1 > gen2 ? gen1 : gen2) + 1;
    }
    
    function _calculateOffspringRarity(
        Rarity parent1Rarity,
        Rarity parent2Rarity,
        uint256 seed
    ) internal pure returns (Rarity) {
        Rarity maxRarity = parent1Rarity > parent2Rarity ? parent1Rarity : parent2Rarity;
        
        uint256 varianceRoll = seed % 100;
        
        if (varianceRoll < 70) {
            return maxRarity;
        } else if (varianceRoll < 90) {
            return maxRarity == Rarity.Legendary ? Rarity.Legendary : Rarity(uint256(maxRarity) + 1);
        } else {
            return maxRarity == Rarity.Common ? Rarity.Common : Rarity(uint256(maxRarity) - 1);
        }
    }
    
    function _calculateRarity(uint256 raritySeed, uint256 upgradeCount) internal pure returns (Rarity) {
        uint256 roll = raritySeed % 100;
        
        if (upgradeCount > 0) {
            uint256 bonus = upgradeCount * RARITY_BONUS_PER_FOOD;
            roll = (roll + bonus) % 100;
        }
        
        // Apply tier guaranteed minimums
        if (upgradeCount >= 500) return Rarity.Legendary;           // 100% Legendary guaranteed
        else if (upgradeCount >= 200) {                              // Cannot roll below Epic
            if (roll < 97) return Rarity.Epic;                       // Force minimum Epic
            return Rarity.Legendary;                                 // Standard Epic→Legendary
        }
        else if (upgradeCount >= 50) {                               // Cannot roll below Rare
            if (roll < 85) return Rarity.Rare;                       // Force minimum Rare
            else if (roll < 97) return Rarity.Epic;                  // Standard Epic
            return Rarity.Legendary;                                 // Standard Legendary
        }
        
        // No guarantee — standard roll below
        if (roll < 60) return Rarity.Common;
        else if (roll < 85) return Rarity.Rare;
        else if (roll < 97) return Rarity.Epic;
        else return Rarity.Legendary;
    }
    
    function _determineSpecies(
        uint256 raritySeed,
        FoodType[] memory foodHistory,
        Rarity rarity
    ) internal pure returns (Species) {
        uint256 grainCount = 0;
        uint256 fishCount = 0;
        uint256 insectsCount = 0;
        uint256 herbCount = 0;
        
        for (uint256 i = 0; i < foodHistory.length; i++) {
            if (foodHistory[i] == FoodType.Grain) grainCount++;
            else if (foodHistory[i] == FoodType.Fish) fishCount++;
            else if (foodHistory[i] == FoodType.Insects) insectsCount++;
            else if (foodHistory[i] == FoodType.Herb) herbCount++;
        }
        
        uint256 speciesSeed = uint256(keccak256(abi.encodePacked(
            raritySeed,
            grainCount,
            fishCount,
            insectsCount,
            herbCount
        )));
        
        if (rarity == Rarity.Common) {
            if (grainCount >= fishCount && grainCount >= insectsCount && grainCount >= herbCount) {
                return speciesSeed % 2 == 0 ? Species.Chicken : Species.Quail;
            } else if (fishCount >= grainCount && fishCount >= insectsCount && fishCount >= herbCount) {
                return Species.Duck;
            } else if (insectsCount >= grainCount && insectsCount >= fishCount && insectsCount >= herbCount) {
                return Species.Quail;
            } else {
                return speciesSeed % 2 == 0 ? Species.Chicken : Species.Quail;
            }
        } else if (rarity == Rarity.Rare) {
            uint256 rarePool = speciesSeed % 3;
            if (rarePool == 0) return Species.Peacock;
            else if (rarePool == 1) return Species.Swan;
            else return Species.Turkey;
        } else if (rarity == Rarity.Epic) {
            uint256 epicPool = speciesSeed % 3;
            if (epicPool == 0) return Species.Phoenix;
            else if (epicPool == 1) return Species.GoldenChicken;
            else return Species.SilverDuck;
        } else {
            uint256 legendaryPool = speciesSeed % 3;
            if (legendaryPool == 0) return Species.Dragon;
            else if (legendaryPool == 1) return Species.Unicorn;
            else return Species.Gryphon;
        }
    }
    
    function getAnimalId(uint256 eggTokenId) external view returns (uint256) {
        require(ownerOf(eggTokenId) != address(0), "Token does not exist");
        return _eggProperties[eggTokenId].animal_token_id;
    }
    
    function setAnimalNFTContract(address _animalNFT) external onlyOwner {
        require(_animalNFT != address(0), "AnimalNFT address cannot be zero");
        animalNFTContract = _animalNFT;
        emit AnimalNFTContractSet(_animalNFT);
    }
    
    function setFoodNFTContract(address _foodNFT) external onlyOwner {
        require(_foodNFT != address(0), "FoodNFT address cannot be zero");
        foodNFTContract = _foodNFT;
        authorizedFoodNFTContracts[_foodNFT] = true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {CommissionDistribution} from "./CommissionDistribution.sol";
import {FoodNFT, FoodType} from "./FoodNFT.sol";
import {AnimalNFT, Rarity, Species} from "./AnimalNFT.sol";

contract EggNFT is ERC721, ReentrancyGuard, Pausable, VRFConsumerBaseV2Plus {
    using SafeERC20 for IERC20;
    
    address payable public immutable commissionDistribution;
    IERC20 public immutable usdtToken;
    address public animalNFTContract;
    
    uint256 public mintPrice = 25 * 10**18;       // Mutable, initialized to 25 USDT
    uint256 public constant BREEDING_FEE = 5 * 10**18;       // Fixed: was 10^18 (XOR), now 10**18 (exponentiation)
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
    mapping(uint256 => uint256) private _eggIdToTokenId; // egg_id → ERC-721 tokenId (for referral chain lookup)
    
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
    
    // VRF v2.5 events
    event VRFRequested(uint256 indexed tokenId, uint256 indexed requestId, address indexed requester);
    event VRFulfilled(uint256 indexed requestId, uint256 randomWord);
    event VRFConfigUpdated(uint256 subscriptionId, bytes32 keyHash);
    event BreedRequested(uint256 indexed requestId, uint256 indexed parent1, uint256 indexed parent2, address requester);
    event BreedClaimed(uint256 indexed requestId, uint256 indexed eggTokenId, uint256 indexed offspringEggId, Rarity rarity);
    
    // VRF v2.5 state
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public s_callbackGasLimit = 500000;
    uint16 public s_requestConfirmations = 3;
    uint32 public s_numWords = 1;
    
    // Pending hatches: requestId → hatch data
    struct PendingHatch {
        address requester;
        uint256 tokenId;
        uint256 raritySeed;
        uint256 foodCount;
        bool isBreedingEgg;
        uint256 parent1AnimalId;
        uint256 parent2AnimalId;
        uint256 rarityUpgradeCount;
        uint256 generation;
    }
    mapping(uint256 => PendingHatch) public pendingHatches;
    mapping(uint256 => uint256) private hatchRandomness; // requestId → random word
    mapping(uint256 => uint256) private tokenToRequestId; // tokenId → requestId
    
    // Pending breeds: requestId → breed data (H-02: VRF for breeding)
    struct PendingBreed {
        address requester;
        address referrer;
        uint256 parent1TokenId;
        uint256 parent2TokenId;
        Rarity parent1Rarity;
        Rarity parent2Rarity;
        uint256 parent1Gen;
        uint256 parent2Gen;
    }
    mapping(uint256 => PendingBreed) public pendingBreeds;
    uint256 private _nextBreedRequestId;
    
    constructor(
        address payable _commissionDistribution,
        address _usdtToken,
        address _vrfCoordinator
    ) ERC721("EggNFT", "EGG") VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_commissionDistribution != address(0), "CommissionDistribution address cannot be zero");
        require(_usdtToken != address(0), "USDT token address cannot be zero");
        
        commissionDistribution = _commissionDistribution;
        usdtToken = IERC20(_usdtToken);
        _nextTokenId = 1;
        _nextEggId = 1;
    }
    
    /// @notice Owner-only: mint an egg for `to` without charging USDT
    /// @param to The recipient address
    /// @return tokenId The minted token ID
    function adminMint(address to) external nonReentrant whenNotPaused onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        
        // Empty referral chain — no commission since no fee was paid
        address[4] memory emptyChain;
        emptyChain[0] = address(0);
        emptyChain[1] = address(0);
        emptyChain[2] = address(0);
        emptyChain[3] = address(0);
        
        _nextTokenId++;
        _nextEggId++;
        
        uint256 tokenId = _nextTokenId - 1;
        uint256 eggId = _nextEggId - 1;
        
        _safeMint(to, tokenId);
        
        uint256 raritySeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            to,
            tokenId
        )));
        
        _eggProperties[tokenId] = EggProperties({
            egg_id: eggId,
            owner: to,
            food_count: INITIAL_FOOD_COUNT,
            is_hatched: false,
            rarity_seed: raritySeed,
            referral_chain: emptyChain,
            animal_token_id: 0,
            is_breeding_egg: false,
            parent1_animal_id: 0,
            parent2_animal_id: 0,
            rarity_upgrade_count: 0,
            generation: 0
        });
        
        _eggIdToTokenId[eggId] = tokenId;
        
        // Auto-mint 2 free Food NFTs to buyer
        if (foodNFTContract != address(0)) {
            FoodNFT(foodNFTContract).mintFreeFood(to, 2);
        }
        
        emit EggMinted(eggId, to, address(0));
        
        return tokenId;
    }

    function mintEgg(address referrer) external nonReentrant whenNotPaused returns (uint256) {
        require(referrer != msg.sender, "Self-referral");
        address[4] memory referralChain;
        referralChain[0] = referrer;

        return _mintEggWithChain(msg.sender, referralChain);
    }

    function mintEggWithChain(address[4] calldata referralChain) external nonReentrant whenNotPaused returns (uint256) {
        for (uint256 i = 0; i < 4; i++) {
            require(referralChain[i] != msg.sender, "Self-referral");
        }
        return _mintEggWithChain(msg.sender, referralChain);
    }
    
    function _mintEggWithChain(address buyer, address[4] memory referralChain) private returns (uint256) {
        usdtToken.safeTransferFrom(buyer, commissionDistribution, mintPrice);
        
        CommissionDistribution(commissionDistribution).distributeCommission(referralChain, mintPrice);
        
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
        
        // Store egg_id → tokenId mapping for referral chain lookup (used by Marketplace resales)
        _eggIdToTokenId[eggId] = tokenId;
        
        // Auto-mint 2 free Food NFTs to buyer (per spec §2.1: "Included Items on Mint: 2× Food NFT")
        if (foodNFTContract != address(0)) {
            FoodNFT(foodNFTContract).mintFreeFood(buyer, 2);
        }
        
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
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
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
    
    // ==================== VRF TWO-PHASE HATCHING ====================
    
    function hatchEgg(uint256 tokenId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        EggProperties storage props = _eggProperties[tokenId];
        require(!props.is_hatched, "Egg already hatched");
        require(!props.is_breeding_egg, "Breeding eggs use direct rarity");
        require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");
        require(animalNFTContract != address(0), "AnimalNFT contract not set");
        require(s_subscriptionId != 0, "VRF subscription not set");
        require(tokenToRequestId[tokenId] == 0, "Hatch already requested");
        
        // Request VRF randomness
        requestId = s_vrfCoordinator.requestRandomWords(VRFV2PlusClient.RandomWordsRequest({
            keyHash: s_keyHash,
            subId: s_subscriptionId,
            requestConfirmations: s_requestConfirmations,
            callbackGasLimit: s_callbackGasLimit,
            numWords: s_numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
            )
        }));
        
        // Store pending hatch data AFTER getting requestId
        pendingHatches[requestId] = PendingHatch({
            requester: msg.sender,
            tokenId: tokenId,
            raritySeed: props.rarity_seed,
            foodCount: props.food_count,
            isBreedingEgg: false,
            parent1AnimalId: 0,
            parent2AnimalId: 0,
            rarityUpgradeCount: props.rarity_upgrade_count,
            generation: props.generation
        });
        
        tokenToRequestId[tokenId] = requestId;
        
        emit VRFRequested(tokenId, requestId, msg.sender);
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        // Store randomness — do NOT revert even if hatch data missing (D-06)
        hatchRandomness[requestId] = randomWords[0];
        emit VRFulfilled(requestId, randomWords[0]);
    }
    
    function claimHatch(uint256 tokenId) external nonReentrant whenNotPaused returns (uint256 animalTokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        EggProperties storage props = _eggProperties[tokenId];
        require(!props.is_hatched, "Egg already hatched");
        
        uint256 requestId = tokenToRequestId[tokenId];
        require(requestId != 0, "No VRF request found for this egg");
        
        uint256 randomWord = hatchRandomness[requestId];
        require(randomWord != 0, "VRF randomness not yet fulfilled");
        
        // Calculate final seed using VRF randomness only (dropped pseudorandom rarity_seed mixing)
        uint256 finalSeed = randomWord;
        
        // Determine rarity and species
        Rarity rarity = _calculateRarity(finalSeed, props.rarity_upgrade_count);
        
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
        
        // Mint AnimalNFT
        animalTokenId = AnimalNFT(animalNFTContract).mintAnimal(
            msg.sender,
            props.egg_id,
            rarity,
            species,
            props.generation,
            foodDistribution,
            props.parent1_animal_id,
            props.parent2_animal_id,
            props.rarity_upgrade_count
        );
        
        // Mark as hatched
        props.is_hatched = true;
        props.animal_token_id = animalTokenId;
        
        // Clean up pending hatch
        delete pendingHatches[requestId];
        delete hatchRandomness[requestId];
        delete tokenToRequestId[tokenId];
        
        emit EggHatched(tokenId, animalTokenId, rarity, species);
        return animalTokenId;
    }
    
    function hatchBreedingEgg(uint256 tokenId) external nonReentrant whenNotPaused returns (uint256) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        EggProperties storage props = _eggProperties[tokenId];
        require(!props.is_hatched, "Egg already hatched");
        require(props.is_breeding_egg, "Not a breeding egg");
        require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");
        require(animalNFTContract != address(0), "AnimalNFT contract not set");
        
        // Breeding eggs use the pre-determined rarity seed
        Rarity rarity = Rarity(props.rarity_seed);
        
        FoodType[] memory foodHistory = new FoodType[](props.food_count);
        for (uint256 i = 0; i < props.food_count; i++) {
            foodHistory[i] = _foodTypeHistory[tokenId][i];
        }
        
        Species species = _determineSpecies(props.rarity_seed, foodHistory, rarity);
        
        uint256[4] memory foodDistribution;
        for (uint256 i = 0; i < props.food_count; i++) {
            FoodType ft = foodHistory[i];
            if (ft == FoodType.Grain) foodDistribution[0]++;
            else if (ft == FoodType.Fish) foodDistribution[1]++;
            else if (ft == FoodType.Insects) foodDistribution[2]++;
            else if (ft == FoodType.Herb) foodDistribution[3]++;
        }
        
        uint256 generation = _calculateBreedingGeneration(props.parent1_animal_id, props.parent2_animal_id);
        
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
        
        emit AnimalsBred(props.parent1_animal_id, props.parent2_animal_id, animalTokenId, generation);
        emit EggHatched(tokenId, animalTokenId, rarity, species);
        
        return animalTokenId;
    }
    
    function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external nonReentrant whenNotPaused {
        require(_ownerOf(eggTokenId) == msg.sender, "Not owner");
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
    
    function requestBreed(
        uint256 parent1TokenId,
        uint256 parent2TokenId,
        address referrer
    ) external nonReentrant whenNotPaused returns (uint256 requestId) {
        require(referrer != msg.sender, "Self-referral");
        require(parent1TokenId != parent2TokenId, "Cannot breed same animal");
        require(AnimalNFT(animalNFTContract).ownerOf(parent1TokenId) == msg.sender, "Not owner of parent1");
        require(AnimalNFT(animalNFTContract).ownerOf(parent2TokenId) == msg.sender, "Not owner of parent2");
        require(AnimalNFT(animalNFTContract).canBreed(parent1TokenId), "Parent 1 on cooldown");
        require(AnimalNFT(animalNFTContract).canBreed(parent2TokenId), "Parent 2 on cooldown");
        require(animalNFTContract != address(0), "AnimalNFT contract not set");
        require(s_subscriptionId != 0, "VRF subscription not set");
        
        (,,,Rarity rarity1, uint256 gen1,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent1TokenId);
        (,,,Rarity rarity2, uint256 gen2,,,,,) = AnimalNFT(animalNFTContract).getAnimalProperties(parent2TokenId);
        
        // Pay breeding fee (USDT) — happens at request time, not at claim
        usdtToken.safeTransferFrom(msg.sender, commissionDistribution, BREEDING_FEE);
        
        address[4] memory referralChain;
        referralChain[0] = referrer;
        CommissionDistribution(commissionDistribution).distributeCommission(referralChain, BREEDING_FEE);
        
        // Request VRF randomness for offspring rarity
        requestId = s_vrfCoordinator.requestRandomWords(VRFV2PlusClient.RandomWordsRequest({
            keyHash: s_keyHash,
            subId: s_subscriptionId,
            requestConfirmations: s_requestConfirmations,
            callbackGasLimit: s_callbackGasLimit,
            numWords: s_numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
            )
        }));
        
        // Store pending breed data
        pendingBreeds[requestId] = PendingBreed({
            requester: msg.sender,
            referrer: referrer,
            parent1TokenId: parent1TokenId,
            parent2TokenId: parent2TokenId,
            parent1Rarity: rarity1,
            parent2Rarity: rarity2,
            parent1Gen: gen1,
            parent2Gen: gen2
        });
        
        emit BreedRequested(requestId, parent1TokenId, parent2TokenId, msg.sender);
        return requestId;
    }
    
    function claimBreed(uint256 requestId) external nonReentrant whenNotPaused returns (uint256 eggTokenId) {
        PendingBreed storage breed = pendingBreeds[requestId];
        require(breed.requester == msg.sender, "Not the requester");
        require(breed.parent1TokenId != 0, "Breed request not found");
        
        uint256 randomWord = hatchRandomness[requestId];
        require(randomWord != 0, "VRF randomness not yet fulfilled");
        
        // Calculate offspring rarity from VRF randomness (H-02 fix)
        Rarity offspringRarity = _calculateOffspringRarity(breed.parent1Rarity, breed.parent2Rarity, randomWord);
        
        uint256 childGeneration = (breed.parent1Gen > breed.parent2Gen ? breed.parent1Gen : breed.parent2Gen) + 1;
        
        // Mint breeding egg
        _nextTokenId++;
        _nextEggId++;
        uint256 tokenId = _nextTokenId - 1;
        uint256 eggId = _nextEggId - 1;
        
        _safeMint(msg.sender, tokenId);
        
        address[4] memory referralChain;
        referralChain[0] = breed.referrer;
        
        _eggProperties[tokenId] = EggProperties({
            egg_id: eggId,
            owner: msg.sender,
            food_count: INITIAL_FOOD_COUNT,
            is_hatched: false,
            rarity_seed: uint256(offspringRarity),
            referral_chain: referralChain,
            animal_token_id: 0,
            is_breeding_egg: true,
            parent1_animal_id: breed.parent1TokenId,
            parent2_animal_id: breed.parent2TokenId,
            rarity_upgrade_count: 0,
            generation: childGeneration
        });
        
        // Store egg_id → tokenId mapping for referral chain lookup
        _eggIdToTokenId[eggId] = tokenId;
        
        // Record breeding timestamps
        AnimalNFT(animalNFTContract).recordBreeding(breed.parent1TokenId);
        AnimalNFT(animalNFTContract).recordBreeding(breed.parent2TokenId);
        
        // Clean up pending breed
        delete pendingBreeds[requestId];
        delete hatchRandomness[requestId];
        
        emit BreedClaimed(requestId, tokenId, eggId, offspringRarity);
        emit BreedingEggCreated(eggId, breed.parent1TokenId, breed.parent2TokenId, childGeneration);
        
        return tokenId;
    }
    
    function recordFoodConsumption(
        uint256 egg_token_id,
        uint256[] calldata food_ids,
        FoodType[] calldata food_types
    ) external onlyAuthorizedFoodNFTContract whenNotPaused {
        require(food_ids.length == food_types.length, "Arrays length mismatch");
        
        EggProperties storage props = _eggProperties[egg_token_id];
        require(!props.is_hatched, "Egg already hatched");
        require(props.food_count + food_ids.length <= MAX_FOOD_COUNT + MAX_UPGRADE_FOOD, "Food cap exceeded");
        
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
        require(_ownerOf(egg_token_id) != address(0), "Token does not exist");
        
        EggProperties memory props = _eggProperties[egg_token_id];
        FoodType[] memory history = new FoodType[](props.food_count);
        
        for (uint256 i = 0; i < props.food_count; i++) {
            history[i] = _foodTypeHistory[egg_token_id][i];
        }
        
        return history;
    }
    
    // ==================== AUTHORIZED FOOD NFT ====================
    
    modifier onlyAuthorizedFoodNFTContract() {
        require(authorizedFoodNFTContracts[msg.sender], "Not authorized");
        _;
    }
    
    function getFoodCount(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].food_count;
    }
    
    function isEggHatched(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].is_hatched;
    }
    
    function getReferralChain(uint256 tokenId) external view returns (address[4] memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _eggProperties[tokenId].referral_chain;
    }
    
    /**
     * @notice Get referral chain by internal egg ID (used by Marketplace for resale commissions)
     * @param eggId The internal egg_id (sequential number, not ERC-721 tokenId)
     * @return The 4-level referral chain associated with this egg
     */
    function getReferralChainByEggId(uint256 eggId) external view returns (address[4] memory) {
        uint256 tokenId = _eggIdToTokenId[eggId];
        require(tokenId != 0, "Egg not found");
        return _eggProperties[tokenId].referral_chain;
    }
    
    /**
     * @notice Get ERC-721 tokenId from internal egg_id (used by Marketplace for animal resale tracing)
     * @param eggId The internal egg_id
     * @return The ERC-721 tokenId
     */
    function getTokenIdByEggId(uint256 eggId) external view returns (uint256) {
        uint256 tokenId = _eggIdToTokenId[eggId];
        require(tokenId != 0, "Egg not found");
        return tokenId;
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
            require(tokenToRequestId[tokenId] == 0, "Cannot transfer during VRF pending");
            _eggProperties[tokenId].owner = to;
            
            // Reset referral chain upon transfer, but ONLY for breeding eggs
            EggProperties storage props = _eggProperties[tokenId];
            if (props.is_breeding_egg) {
                // Clear the referral chain to prevent referral bonuses from being misused
                for (uint256 i = 0; i < 4; i++) {
                    props.referral_chain[i] = address(0);
                }
            }
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        require(newPrice >= 1e18 && newPrice <= 1000e18, "Price bounds: 1-1000 USDT");
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
        emit PauseStateChanged(true);
    }

    function unpause() external onlyOwner whenPaused {
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
        require(_ownerOf(eggTokenId) != address(0), "Token does not exist");
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
    
    function setVRFConfig(uint256 subscriptionId, bytes32 keyHash) external onlyOwner {
        require(subscriptionId != 0, "Invalid subscription ID");
        require(keyHash != bytes32(0), "Invalid key hash");
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
        emit VRFConfigUpdated(subscriptionId, keyHash);
    }
    
    // ========== Base URI (Metadata) ==========
    
    /// @notice Base URI for computing tokenURI
    string private _baseTokenURI;
    
    /// @notice Returns the base URI for token metadata
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /// @notice Sets the base URI for all tokens
    /// @param baseURI The new base URI (should end with /)
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
}

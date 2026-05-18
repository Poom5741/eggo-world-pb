// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

enum Rarity {
    Common,
    Rare,
    Epic,
    Legendary
}

enum Species {
    Chicken,
    Duck,
    Quail,
    Peacock,
    Swan,
    Turkey,
    Phoenix,
    GoldenChicken,
    SilverDuck,
    Dragon,
    Unicorn,
    Gryphon
}

contract AnimalNFT is ERC721, Ownable {
    address public eggNFTContract;
    uint256 public constant BREED_COOLDOWN = 48 hours;
    
    uint256 private _nextTokenId;
    uint256 private _nextAnimalId;
    
    mapping(uint256 => AnimalProperties) private _animalProperties;
    mapping(uint256 => uint256) private _eggIdToAnimalTokenId;
    mapping(uint256 => uint256) private _lastBredTimestamp;
    
    event AnimalMinted(
        uint256 indexed animal_id,
        address indexed recipient,
        Rarity rarity,
        Species species,
        uint256 generation
    );
    event EggNFTContractSet(address indexed eggNFTContract);
    struct AnimalProperties {
        uint256 animal_id;
        address owner;
        Species species;
        Rarity rarity;
        uint256 generation;
        uint256 parent_egg_id;
        uint256[4] food_type_distribution;
        uint256 parent1_animal_id;
        uint256 parent2_animal_id;
        uint256 rarity_upgrade_count;
    }
    
    event AnimalsBred(
        uint256 indexed animal_id_1,
        uint256 indexed animal_id_2,
        uint256 indexed offspring_id,
        uint256 offspring_generation
    );
    
    constructor() ERC721("Animal NFT", "ANIMAL") Ownable(msg.sender) {
        _nextTokenId = 1;
        _nextAnimalId = 1;
    }
    
    function mintAnimal(
        address recipient,
        uint256 parent_egg_id,
        Rarity rarity,
        Species species,
        uint256 generation,
        uint256[4] calldata food_type_distribution,
        uint256 parent1_animal_id,
        uint256 parent2_animal_id,
        uint256 rarity_upgrade_count
    ) external returns (uint256) {
        require(msg.sender == eggNFTContract, "Only EggNFT contract can mint");
        require(recipient != address(0), "Recipient cannot be zero address");
        
        _nextTokenId++;
        _nextAnimalId++;
        
        uint256 tokenId = _nextTokenId - 1;
        uint256 animalId = _nextAnimalId - 1;
        
        _safeMint(recipient, tokenId);
        
        _animalProperties[tokenId] = AnimalProperties({
            animal_id: animalId,
            owner: recipient,
            species: species,
            rarity: rarity,
            generation: generation,
            parent_egg_id: parent_egg_id,
            food_type_distribution: food_type_distribution,
            parent1_animal_id: parent1_animal_id,
            parent2_animal_id: parent2_animal_id,
            rarity_upgrade_count: rarity_upgrade_count
        });
        
        _eggIdToAnimalTokenId[parent_egg_id] = tokenId;
        
        emit AnimalMinted(animalId, recipient, rarity, species, generation);
        
        return tokenId;
    }
    
    function getAnimalProperties(uint256 tokenId)
        external
        view
        returns (
            uint256 animal_id,
            address owner,
            Species species,
            Rarity rarity,
            uint256 generation,
            uint256[] memory food_type_distribution,
            uint256 parent_egg_id,
            uint256 parent1_animal_id,
            uint256 parent2_animal_id,
            uint256 rarity_upgrade_count
        )
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        AnimalProperties memory props = _animalProperties[tokenId];
        
        uint256[] memory foodDist = new uint256[](4);
        foodDist[0] = props.food_type_distribution[0];
        foodDist[1] = props.food_type_distribution[1];
        foodDist[2] = props.food_type_distribution[2];
        foodDist[3] = props.food_type_distribution[3];
        
        return (
            props.animal_id,
            props.owner,
            props.species,
            props.rarity,
            props.generation,
            foodDist,
            props.parent_egg_id,
            props.parent1_animal_id,
            props.parent2_animal_id,
            props.rarity_upgrade_count
        );
    }
    
    function getRarity(uint256 tokenId) external view returns (Rarity) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _animalProperties[tokenId].rarity;
    }
    
    function getSpecies(uint256 tokenId) external view returns (Species) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _animalProperties[tokenId].species;
    }
    
    function getGeneration(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _animalProperties[tokenId].generation;
    }
    
    function getAnimalId(uint256 eggId) external view returns (uint256) {
        return _eggIdToAnimalTokenId[eggId];
    }
    
    function getLastBredTime(uint256 tokenId) external view returns (uint256) {
        return _lastBredTimestamp[tokenId];
    }
    
    function canBreed(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        uint256 lastBred = _lastBredTimestamp[tokenId];
        return lastBred == 0 || block.timestamp >= lastBred + BREED_COOLDOWN;
    }
    
    function recordBreeding(uint256 tokenId) external {
        require(msg.sender == eggNFTContract, "Only EggNFT contract can record");
        _lastBredTimestamp[tokenId] = block.timestamp;
    }
    
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function setEggNFTContract(address _eggNFTContract) external onlyOwner {
        require(_eggNFTContract != address(0), "EggNFT address cannot be zero");
        eggNFTContract = _eggNFTContract;
        emit EggNFTContractSet(_eggNFTContract);
    }
    
    function burnAnimal(uint256 tokenId) external {
        require(msg.sender == eggNFTContract, "Only EggNFT contract can burn");
        _burn(tokenId);
    }
    
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0)) {
            _animalProperties[tokenId].owner = to;
        }
        
        return super._update(to, tokenId, auth);
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

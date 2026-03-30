// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CommissionDistribution} from "./CommissionDistribution.sol";

contract EggNFT is ERC721, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    address public immutable commissionDistribution;
    IERC20 public immutable usdtToken;
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant MAX_FOOD_COUNT = 10;
    uint256 public constant INITIAL_FOOD_COUNT = 2;
    
    uint256 private _nextTokenId;
    uint256 private _nextEggId;
    
    struct EggProperties {
        uint256 egg_id;
        address owner;
        uint256 food_count;
        bool is_hatched;
        uint256 rarity_seed;
        address[4] referral_chain;
    }
    
    mapping(uint256 => EggProperties) private _eggProperties;
    
    event EggMinted(uint256 indexed egg_id, address indexed buyer, address indexed referrer);
    event EggHatched(uint256 indexed egg_id);
    event MintPriceUpdated(uint256 newPrice);
    
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
    
    function mintEgg(address referrer) external nonReentrant returns (uint256) {
        address[4] memory referralChain;
        referralChain[0] = referrer;
        
        return _mintEggWithChain(msg.sender, referralChain);
    }
    
    function mintEggWithChain(address[4] calldata referralChain) external nonReentrant returns (uint256) {
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
            referral_chain: referralChain
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
        address[4] memory referral_chain
    ) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        EggProperties memory props = _eggProperties[tokenId];
        return (
            props.egg_id,
            props.owner,
            props.food_count,
            props.is_hatched,
            props.rarity_seed,
            props.referral_chain
        );
    }
    
    function hatchEgg(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        EggProperties storage props = _eggProperties[tokenId];
        require(!props.is_hatched, "Egg already hatched");
        
        props.is_hatched = true;
        
        emit EggHatched(tokenId);
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
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0)) {
            _eggProperties[tokenId].owner = to;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        emit MintPriceUpdated(newPrice);
    }
}

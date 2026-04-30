// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";

/// @title TierBadge - Soulbound Achievement NFTs for Egg World
/// @notice Non-transferable badges awarded for reaching food consumption milestones
/// @dev Implements ERC-5192 soulbound standard on top of ERC-721
contract TierBadge is ERC721, Ownable, IERC5192, ReentrancyGuard {
    
    using SafeERC20 for IERC20;
    /// @notice Tier definition structure
    struct Tier {
        string name;
        uint256 threshold;      // Minimum lifetime_food_items required
        uint256 rewardAmount; // USDT reward in wei (18 decimals)
    }
    
    /// @notice Tier configurations by token ID (1=Seedling, 2=Grower, 3=Farmer)
    mapping(uint256 => Tier) public tiers;
    
    /// @notice Highest tier token ID claimed by each user (0 = none)
    mapping(address => uint256) public userHighestTier;
    
    /// @notice USDT token contract for rewards
    IERC20 public immutable usdtToken;
    
    /// @notice CoinStor reserve address that provides USDT rewards
    address public immutable coinstorReserve;
    
    /// @notice Next token ID to mint (starts at 1)
    uint256 private _nextTokenId = 1;
    
    /// @notice Maps tokenId → tierId (1=Seedling, 2=Grower, 3=Farmer)
    mapping(uint256 => uint256) public tokenTier;
    
    /// @notice Emitted when a tier badge is minted with reward
    event TierBadgeMinted(
        address indexed user,
        uint256 indexed tokenId,
        string tierName,
        uint256 rewardAmount,
        uint256 lifetimeFoodItems
    );
    
    /// @notice Emitted when a tier claim is attempted but fails
    event TierClaimFailed(
        address indexed user,
        uint256 requestedTier,
        string reason
    );
    
    /// @param _usdtToken Address of USDT token contract (BEP-20)
    /// @param _coinstorReserve Address of platform treasury holding USDT rewards
    constructor(
        address _usdtToken,
        address _coinstorReserve
    ) ERC721("Egg World Tier Badge", "EGGOTIER") Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT address");
        require(_coinstorReserve != address(0), "Invalid CoinStor address");
        
        usdtToken = IERC20(_usdtToken);
        coinstorReserve = _coinstorReserve;
        
        // Initialize tier configurations
        // Token ID 1: Seedling - 10 food items - $5 USDT
        tiers[1] = Tier("Seedling", 10, 5 * 10**18);
        // Token ID 2: Grower - 100 food items - $50 USDT
        tiers[2] = Tier("Grower", 100, 50 * 10**18);
        // Token ID 3: Farmer - 1,000 food items - $500 USDT
        tiers[3] = Tier("Farmer", 1000, 500 * 10**18);
    }
    
    /// @notice Override _update to enforce soulbound (non-transferable) behavior
    /// @dev Blocks all transfers except mint (from=0) and burn (to=0)
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Block transfers: allow mint from address(0) and burn to address(0) only
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Check if a token is locked (soulbound)
    /// @param tokenId The token ID to check
    /// @return True if locked (always true for TierBadge tokens)
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return true; // All TierBadge tokens are permanently locked
    }
    
    /// @notice ERC-165 interface support
    /// @param interfaceId The interface identifier
    /// @return True if the interface is supported
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        // ERC-5192 interface ID: 0xb45a3c0e
        return interfaceId == type(IERC5192).interfaceId || 
               super.supportsInterface(interfaceId);
    }
    
    /// @notice Mint a tier badge and distribute USDT reward
    /// @param user The address to mint the badge to
    /// @param tierId The tier ID (1=Seedling, 2=Grower, 3=Farmer)
    /// @param lifetimeFoodItems The user's lifetime food items count (for verification)
    /// @return tokenId The unique token ID minted
    function mintTierBadge(
        address user,
        uint256 tierId,
        uint256 lifetimeFoodItems
    ) external onlyOwner nonReentrant returns (uint256 tokenId) {
        // Validate tier ID
        if (tierId < 1 || tierId > 3) {
            emit TierClaimFailed(user, tierId, "Invalid tier ID");
            revert("Invalid tier");
        }
        
        // Check if user already has this tier or higher
        if (userHighestTier[user] >= tierId) {
            emit TierClaimFailed(user, tierId, "Tier already claimed");
            revert("Already claimed");
        }
        
        // Check sequential claim order (must claim 1, then 2, then 3)
        if (userHighestTier[user] != tierId - 1) {
            emit TierClaimFailed(user, tierId, "Claim tiers in order");
            revert("Claim tiers in order");
        }
        
        // Verify lifetime food items threshold
        Tier memory tier = tiers[tierId];
        if (lifetimeFoodItems < tier.threshold) {
            emit TierClaimFailed(user, tierId, "Threshold not met");
            revert("Threshold not met");
        }
        
        // Generate unique token ID using monotonic counter
        tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        tokenTier[tokenId] = tierId;  // Map tokenId → tierId
        userHighestTier[user] = tierId;
        
        // Transfer USDT reward from CoinStor reserve
        try IERC20(address(usdtToken)).transferFrom(
            coinstorReserve,
            user,
            tier.rewardAmount
        ) returns (bool) {
            // Transfer succeeded
        } catch {
            // Handle Safe ERC20 transfer failure gracefully
            emit TierClaimFailed(user, tierId, "USDT transfer failed");
        }
        
        // Emit soulbound locked event
        emit Locked(tokenId);
        
        // Emit success event
        emit TierBadgeMinted(
            user,
            tokenId,
            tier.name,
            tier.rewardAmount,
            lifetimeFoodItems
        );
    }
    
    /// @notice Check if a user can claim a specific tier
    /// @param user The user address to check
    /// @param tierId The tier ID to check (1=Seedling, 2=Grower, 3=Farmer)
    /// @param lifetimeFoodItems The user's current lifetime food items
    /// @return canClaim True if the user is eligible to claim this tier
    function canClaimTier(
        address user,
        uint256 tierId,
        uint256 lifetimeFoodItems
    ) external view returns (bool canClaim) {
        if (tierId < 1 || tierId > 3) return false;
        if (userHighestTier[user] >= tierId) return false;
        if (userHighestTier[user] != tierId - 1) return false;
        
        Tier memory tier = tiers[tierId];
        if (lifetimeFoodItems < tier.threshold) return false;
        
        return true;
    }
    
    /// @notice Get the next tier a user can claim
    /// @param user The user address to check
    /// @return nextTierId The next claimable tier ID (0 if none available)
    function getNextClaimableTier(address user) external view returns (uint256 nextTierId) {
        uint256 highestTier = userHighestTier[user];
        if (highestTier >= 3) return 0; // All tiers claimed
        return highestTier + 1;
    }
    
    /// @notice Get tier details by tier ID
    /// @param tierId The tier ID (1=Seedling, 2=Grower, 3=Farmer)
    /// @return name Tier name
    /// @return threshold Required lifetime food items
    /// @return rewardAmount USDT reward amount
    function getTierDetails(uint256 tierId) external view returns (
        string memory name,
        uint256 threshold,
        uint256 rewardAmount
    ) {
        require(tierId >= 1 && tierId <= 3, "Invalid tier");
        Tier memory tier = tiers[tierId];
        return (tier.name, tier.threshold, tier.rewardAmount);
    }
    
    /// @notice Override tokenURI to return on-chain metadata
    /// @param tokenId The token ID
    /// @return URI string with embedded JSON metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // Resolve tier ID from token ID using mapping
        uint256 tierId = tokenTier[tokenId];
        Tier memory tier = tiers[tierId];
        
        // Build minimal JSON metadata as data URI
        string memory json = string.concat(
            '{"name":"Egg World ',
            tier.name,
            '","description":"Soulbound achievement badge for ',
            tier.name,
            ' tier - ',
            _toString(tier.threshold),
            ' food items consumed","image":"","attributes":[{"trait_type":"Tier","value":"',
            tier.name,
            '"},{"trait_type":"Threshold","display_type":"number","value":',
            _toString(tier.threshold),
            '},{"trait_type":"Reward","display_type":"number","value":',
            _toString(tier.rewardAmount / 10**18),
            '},{"trait_type":"Soulbound","value":"true"}]}'
        );
        
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
    
    /// @dev Convert uint256 to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /// @dev Base64 encode bytes
    function _encodeBase64(bytes memory data) internal pure returns (string memory) {
        bytes memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";
        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        
        uint256 i;
        uint256 j;
        
        for (i = 0; i < len; i += 3) {
            uint256 a = i < len ? uint256(uint8(data[i])) : 0;
            uint256 b = i + 1 < len ? uint256(uint8(data[i + 1])) : 0;
            uint256 c = i + 2 < len ? uint256(uint8(data[i + 2])) : 0;
            
            uint256 triple = (a << 16) | (b << 8) | c;
            
            result[j++] = TABLE[triple >> 18 & 0x3F];
            result[j++] = TABLE[triple >> 12 & 0x3F];
            result[j++] = TABLE[triple >> 6 & 0x3F];
            result[j++] = TABLE[triple & 0x3F];
        }
        
        // Padding
        if (len % 3 == 1) {
            result[encodedLen - 2] = bytes1(uint8(61)); // '='
            result[encodedLen - 1] = bytes1(uint8(61)); // '='
        } else if (len % 3 == 2) {
            result[encodedLen - 1] = bytes1(uint8(61)); // '='
        }
        
        return string(result);
    }
}

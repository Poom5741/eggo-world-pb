// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CommissionDistribution} from "./CommissionDistribution.sol";
import {EggNFT} from "./EggNFT.sol";

enum FoodType {
    Grain,
    Fish,
    Insects,
    Herb
}

contract FoodNFT is ERC1155, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    address payable public immutable commissionDistribution;
    address public immutable eggNFTContract;
    IERC20 public immutable usdtToken;
    
    uint256 public constant MINT_PRICE = 0.50 * 10^18;
    
    uint256 private _nextFoodId;
    
    struct FoodProperties {
        uint256 food_id;
        address owner;
        FoodType food_type;
        bool is_consumed;
        uint256 consumed_by_egg_id;
    }
    
    mapping(uint256 => FoodProperties) private _foodProperties;
    mapping(address => bool) public authorizedContracts;
    
    event FoodMinted(uint256[] food_ids, address indexed buyer, uint256 quantity);
    event EggFed(uint256 indexed egg_id, uint256[] food_ids, address indexed feeder);
    event FoodTypeAssigned(uint256 food_id, FoodType food_type);
    
    constructor(
        address payable _commissionDistribution,
        address _usdtToken,
        address _eggNFTContract
    ) ERC1155("https://eggoworld.io/api/food/{id}.json") Ownable(msg.sender) {
        require(_commissionDistribution != address(0), "CommissionDistribution address cannot be zero");
        require(_usdtToken != address(0), "USDT token address cannot be zero");
        require(_eggNFTContract != address(0), "EggNFT contract address cannot be zero");
        
        commissionDistribution = _commissionDistribution;
        usdtToken = IERC20(_usdtToken);
        eggNFTContract = _eggNFTContract;
        authorizedContracts[_eggNFTContract] = true;
        
        _nextFoodId = 1;
    }
    
    function mintFood(address buyer, uint256 quantity, address referrer) 
        external 
        nonReentrant
        returns (uint256[] memory food_ids)
    {
        require(quantity > 0, "Quantity must be greater than 0");
        
        uint256 totalCost = MINT_PRICE * quantity;
        usdtToken.safeTransferFrom(buyer, commissionDistribution, totalCost);
        
        address[4] memory referralChain;
        referralChain[0] = referrer;
        
        CommissionDistribution(commissionDistribution).distributeCommission(referralChain, totalCost);
        
        food_ids = new uint256[](quantity);
        
        for (uint256 i = 0; i < quantity; i++) {
            _nextFoodId++;
            uint256 foodId = _nextFoodId - 1;
            
            FoodType foodType = _assignRandomFoodType(foodId);
            
            _foodProperties[foodId] = FoodProperties({
                food_id: foodId,
                owner: buyer,
                food_type: foodType,
                is_consumed: false,
                consumed_by_egg_id: 0
            });
            
            _mint(buyer, foodId, 1, "");
            
            emit FoodTypeAssigned(foodId, foodType);
            
            food_ids[i] = foodId;
        }
        
        emit FoodMinted(food_ids, buyer, quantity);
        
        return food_ids;
    }
    
    function feedEgg(
        uint256 egg_token_id,
        uint256[] calldata food_ids,
        address eggNftContract
    ) external nonReentrant {
        require(food_ids.length > 0, "No food items provided");
        
        EggNFT eggNFT = EggNFT(eggNftContract);
        
        require(eggNFT.ownerOf(egg_token_id) == msg.sender, "Not egg owner");
        
        (,,,bool is_hatched,,,,,,,,) = eggNFT.getEggProperties(egg_token_id);
        require(!is_hatched, "Egg already hatched");
        
        FoodType[] memory foodTypes = new FoodType[](food_ids.length);
        
        for (uint256 i = 0; i < food_ids.length; i++) {
            uint256 foodId = food_ids[i];
            FoodProperties storage props = _foodProperties[foodId];
            
            require(!props.is_consumed, "Food already consumed");
            require(balanceOf(msg.sender, foodId) > 0, "Not food owner");
            
            props.is_consumed = true;
            props.consumed_by_egg_id = egg_token_id;
            
            foodTypes[i] = props.food_type;
            
            _burn(msg.sender, foodId, 1);
        }
        
        eggNFT.recordFoodConsumption(egg_token_id, food_ids, foodTypes);
        
        emit EggFed(egg_token_id, food_ids, msg.sender);
    }
    
    function getFoodProperties(uint256 foodId) 
        external 
        view 
        returns (
            uint256,
            address,
            FoodType,
            bool,
            uint256
        )
    {
        FoodProperties memory props = _foodProperties[foodId];
        return (
            props.food_id,
            props.owner,
            props.food_type,
            props.is_consumed,
            props.consumed_by_egg_id
        );
    }
    
    function getFoodTypeDistribution(uint256[] calldata food_ids)
        external
        view
        returns (uint256 grain, uint256 fish, uint256 insects, uint256 herb)
    {
        for (uint256 i = 0; i < food_ids.length; i++) {
            FoodType foodType = _foodProperties[food_ids[i]].food_type;
            
            if (foodType == FoodType.Grain) grain++;
            else if (foodType == FoodType.Fish) fish++;
            else if (foodType == FoodType.Insects) insects++;
            else if (foodType == FoodType.Herb) herb++;
        }
        
        return (grain, fish, insects, herb);
    }
    
    function _assignRandomFoodType(uint256 food_id) internal view returns (FoodType) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            food_id
        ))) % 100;
        
        if (random < 40) return FoodType.Grain;
        else if (random < 70) return FoodType.Fish;
        else if (random < 90) return FoodType.Insects;
        else return FoodType.Herb;
    }
    
    function burnFood(uint256 food_id) external {
        require(balanceOf(msg.sender, food_id) > 0, "Not food owner");
        FoodProperties storage props = _foodProperties[food_id];
        require(!props.is_consumed, "Food already consumed");
        
        props.is_consumed = true;
        _burn(msg.sender, food_id, 1);
    }
    
    function burnFoodFor(address owner, uint256 food_id) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        require(balanceOf(owner, food_id) > 0, "Not food owner");
        FoodProperties storage props = _foodProperties[food_id];
        require(!props.is_consumed, "Food already consumed");
        
        props.is_consumed = true;
        _burn(owner, food_id, 1);
    }
    
    function setEggNFTContract(address _eggNFT) external onlyOwner {
        require(_eggNFT != address(0), "EggNFT address cannot be zero");
        authorizedContracts[_eggNFT] = true;
    }
}

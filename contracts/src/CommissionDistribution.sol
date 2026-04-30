// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CommissionDistribution {
    using SafeERC20 for IERC20;
    
    address public immutable owner;
    address public immutable coinStorReserve;
    IERC20 public immutable usdtToken;
    address public immutable treasury;  // Treasury address for 46% allocation
    address public eggNFTContract;
    address public foodNFTContract;
    
    uint256 public constant G1_PERCENT = 20;
    uint256 public constant G2_PERCENT = 10;
    uint256 public constant G3_PERCENT = 10;
    uint256 public constant G4_PERCENT = 10;
    uint256 public constant COINSTOR_PERCENT = 4;
    uint256 public constant TREASURY_PERCENT = 46;
    uint256 public constant TOTAL_PERCENT = 100;
    
    mapping(address => uint256) public commissionBalances;
    
    event CommissionDistributed(address indexed buyer, address[4] referralChain, uint256 totalAmount);
    event CommissionClaimedUSDT(address indexed referrer, uint256 amount);
    event CoinStorDeposit(address indexed buyer, uint256 amount);
    event TreasuryWithdrawn(address indexed caller, address indexed treasury, uint256 amount);
    event EggNFTContractSet(address indexed eggNFT);
    event FoodNFTContractSet(address indexed foodNFT);
    
    constructor(address _coinStorReserve, address _usdtToken, address _treasury) {
        require(_coinStorReserve != address(0), "CoinStor address cannot be zero");
        require(_usdtToken != address(0), "USDT address cannot be zero");
        require(_treasury != address(0), "Treasury address cannot be zero");
        owner = msg.sender;
        coinStorReserve = _coinStorReserve;
        usdtToken = IERC20(_usdtToken);
        treasury = _treasury;
    }
    
    function setEggNFTContract(address _eggNFT) external {
        require(msg.sender == owner, "Only owner can set");
        require(_eggNFT != address(0), "EggNFT address cannot be zero");
        eggNFTContract = _eggNFT;
        emit EggNFTContractSet(_eggNFT);
    }
    
    function setFoodNFTContract(address _foodNFT) external {
        require(msg.sender == owner, "Only owner can set");
        require(_foodNFT != address(0), "FoodNFT address cannot be zero");
        foodNFTContract = _foodNFT;
        emit FoodNFTContractSet(_foodNFT);
    }
    
    function distributeCommission(address[4] calldata referralChain, uint256 amount) external {
        require(msg.sender == eggNFTContract || msg.sender == foodNFTContract, "Not authorized");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < 4; i++) {
            address referrer = referralChain[i];
            if (referrer != address(0)) {
                uint256 level;
                if (i == 0) level = G1_PERCENT;
                else if (i == 1) level = G2_PERCENT;
                else if (i == 2) level = G3_PERCENT;
                else level = G4_PERCENT;
                
                uint256 commission = (amount * level) / TOTAL_PERCENT;
                if (commission > 0) {
                    commissionBalances[referrer] += commission;
                    totalDistributed += commission;
                }
            }
        }
        
        uint256 coinStorAmount = (amount * COINSTOR_PERCENT) / TOTAL_PERCENT;
        commissionBalances[coinStorReserve] += coinStorAmount;
        
        // Treasury allocation (46%)
        uint256 treasuryAmount = (amount * TREASURY_PERCENT) / TOTAL_PERCENT;
        commissionBalances[treasury] += treasuryAmount;
        
        emit CommissionDistributed(msg.sender, referralChain, amount);
        emit CoinStorDeposit(msg.sender, coinStorAmount);
    }
    
    function claimCommissionUSDT() external {
        uint256 balance = commissionBalances[msg.sender];
        require(balance > 0, "No commission to claim");
        
        commissionBalances[msg.sender] = 0;
        
        usdtToken.safeTransfer(msg.sender, balance);
        
        emit CommissionClaimedUSDT(msg.sender, balance);
    }
    
    function getCommissionBalance(address referrer) external view returns (uint256) {
        return commissionBalances[referrer];
    }
    
    function withdrawTreasury(uint256 amount) external {
        require(msg.sender == owner, "Owner only");
        require(amount > 0, "Amount must be > 0");
        require(commissionBalances[treasury] >= amount, "Insufficient treasury balance");
        
        commissionBalances[treasury] -= amount;
        usdtToken.safeTransfer(treasury, amount);
        
        emit TreasuryWithdrawn(msg.sender, treasury, amount);
    }
    
    receive() external payable {
        revert("Contract does not accept ETH");
    }
}

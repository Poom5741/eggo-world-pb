// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Test USDT token for E2E testing
 * Allows minting for test scenarios
 */
contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Test USDT", "USDT") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

/**
 * Test Egg NFT for E2E testing
 * Allows minting specific token IDs for test scenarios
 */
contract TestEggNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Eggo Egg NFT", "EGG") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) == address(0), "Token already minted");
        _mint(to, tokenId);
    }

    function mintBatch(address to, uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_ownerOf(tokenIds[i]) == address(0), "Token already minted");
            _mint(to, tokenIds[i]);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * Test Animal NFT for E2E testing
 * Allows minting specific token IDs for test scenarios
 */
contract TestAnimalNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Eggo Animal NFT", "ANML") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) == address(0), "Token already minted");
        _mint(to, tokenId);
    }

    function mintBatch(address to, uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_ownerOf(tokenIds[i]) == address(0), "Token already minted");
            _mint(to, tokenIds[i]);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * Test Food NFT for E2E testing
 */
contract TestFoodNFT is ERC721, ERC721URIStorage, Ownable {
    constructor() ERC721("Eggo Food NFT", "FOOD") Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) == address(0), "Token already minted");
        _mint(to, tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * Test Commission Distribution for E2E testing
 * Simplified version for testing commission flows
 */
contract TestCommissionDistribution is Ownable {
    mapping(address => uint256) public commissions;
    
    event CommissionDeposited(address indexed user, uint256 amount);
    event CommissionWithdrawn(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function depositCommission(address user, uint256 amount) external onlyOwner {
        commissions[user] += amount;
        emit CommissionDeposited(user, amount);
    }

    function withdrawCommission(address user) external onlyOwner {
        uint256 amount = commissions[user];
        require(amount > 0, "No commission to withdraw");
        commissions[user] = 0;
        emit CommissionWithdrawn(user, amount);
    }

    function getCommissionBalance(address user) external view returns (uint256) {
        return commissions[user];
    }
}

/**
 * Deployment script for E2E test contracts
 * Usage: forge script script/DeployTestContracts.s.sol --rpc-url http://localhost:8545 --private-key <key> --broadcast
 */
contract DeployTestContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy TestUSDT
        TestUSDT usdt = new TestUSDT();
        console.log("TestUSDT deployed at:", address(usdt));

        // Deploy TestEggNFT
        TestEggNFT eggNFT = new TestEggNFT();
        console.log("TestEggNFT deployed at:", address(eggNFT));

        // Deploy TestAnimalNFT
        TestAnimalNFT animalNFT = new TestAnimalNFT();
        console.log("TestAnimalNFT deployed at:", address(animalNFT));

        // Deploy TestFoodNFT
        TestFoodNFT foodNFT = new TestFoodNFT();
        console.log("TestFoodNFT deployed at:", address(foodNFT));

        // Deploy TestCommissionDistribution
        TestCommissionDistribution commission = new TestCommissionDistribution();
        console.log("TestCommissionDistribution deployed at:", address(commission));

        vm.stopBroadcast();

        console.log("All test contracts deployed successfully!");
    }
}

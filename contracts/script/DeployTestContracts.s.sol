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
 * Test Marketplace for E2E testing
 * Simplifies the on-chain escrow marketplace for test scenarios.
 * Stores listings in a mapping; nftContract+tokenId → (seller, price, active).
 * Supports list, buy, cancel, updatePrice operations for Playwright journeys.
 */
contract TestMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        uint256 listedAt;
        bool   active;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    event NFTListed(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price);
    event NFTSold(address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event ListingCancelled(address indexed nftContract, uint256 indexed tokenId, address seller);

    function listNFTForSale(address nftContract, uint256 tokenId, uint256 price, uint8) external {
        require(price > 0, "Price must be > 0");
        require(!listings[nftContract][tokenId].active, "Already listed");
        listings[nftContract][tokenId] = Listing(msg.sender, price, block.timestamp, true);
        emit NFTListed(nftContract, tokenId, msg.sender, price);
    }

    function buyNFT(address nftContract, uint256 tokenId) external {
        Listing memory l = listings[nftContract][tokenId];
        require(l.active, "Not listed");
        require(l.seller != msg.sender, "Cannot buy own");
        listings[nftContract][tokenId].active = false;
        emit NFTSold(nftContract, tokenId, l.seller, msg.sender, l.price);
    }

    function cancelListing(address nftContract, uint256 tokenId) external {
        Listing memory l = listings[nftContract][tokenId];
        require(l.active, "Not listed");
        require(l.seller == msg.sender, "Not seller");
        listings[nftContract][tokenId].active = false;
        emit ListingCancelled(nftContract, tokenId, msg.sender);
    }

    function getListing(address nftContract, uint256 tokenId)
        external view returns (address seller, uint256 price, uint256 listedAt, uint8 nftType, uint256 originalEggId, bool active)
    {
        Listing memory l = listings[nftContract][tokenId];
        return (l.seller, l.price, l.listedAt, 0, 0, l.active);
    }
}

/**
 * Deployment script for E2E test contracts
 * Usage: forge script script/DeployTestContracts.s.sol --rpc-url http://localhost:8545 --private-key <key> --broadcast
 */
contract DeployTestContracts is Script {
    function run() external {
        vm.startBroadcast();

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

        // Deploy TestMarketplace
        TestMarketplace marketplace = new TestMarketplace();
        console.log("TestMarketplace deployed at:", address(marketplace));

        vm.stopBroadcast();

        console.log("All test contracts deployed successfully!");
    }
}

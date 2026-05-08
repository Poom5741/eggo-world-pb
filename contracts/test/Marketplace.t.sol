// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {FoodNFT} from "../src/FoodNFT.sol";
import {AnimalNFT, Rarity, Species} from "../src/AnimalNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {MockUSDT} from "./MockUSDT.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract MarketplaceTest is Test {
    EggNFT public eggNFT;
    FoodNFT public foodNFT;
    AnimalNFT public animalNFT;
    CommissionDistribution public commDist;
    Marketplace public marketplace;
    MockUSDT public mockUSDT;
    VRFCoordinatorV2_5Mock public vrfCoordinatorMock;

    address public buyer;
    address public seller;
    address public referrerG1;
    address public referrerG2;
    address public referrerG3;
    address public referrerG4;
    address public coinStorReserve;
    address public treasury;

    uint256 public constant MINT_PRICE = 25 * 10**18;
    uint256 public constant INITIAL_BALANCE = 1000 * 10**18;
    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash = bytes32(uint256(0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26));

    event NFTListed(
        bytes32 indexed listingId,
        address indexed nftContract,
        uint256 tokenId,
        address seller,
        uint256 price,
        uint8 nftType
    );
    event NFTSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event ListingCancelled(bytes32 indexed listingId, address indexed seller);

    event ResaleCommissionDistributed(
        address indexed buyerAddr,
        address indexed sellerAddr,
        address[4] referralChain,
        uint256 totalAmount
    );

    function setUp() public {
        buyer = address(0x1);
        seller = address(0x2);
        referrerG1 = address(0x3);
        referrerG2 = address(0x4);
        referrerG3 = address(0x5);
        referrerG4 = address(0x6);
        coinStorReserve = address(0x7);
        treasury = address(0x8);

        mockUSDT = new MockUSDT();
        commDist = new CommissionDistribution(coinStorReserve, address(mockUSDT), treasury);

        // Deploy mock VRF coordinator
        vrfCoordinatorMock = new VRFCoordinatorV2_5Mock(1e18, 1e9, 1e18);

        // Deploy AnimalNFT first (no deps)
        animalNFT = new AnimalNFT();

        // Deploy EggNFT with VRF
        eggNFT = new EggNFT(
            payable(address(commDist)),
            address(mockUSDT),
            address(vrfCoordinatorMock)
        );

        // Deploy FoodNFT
        foodNFT = new FoodNFT(
            payable(address(commDist)),
            address(mockUSDT),
            address(eggNFT)
        );

        // Deploy Marketplace
        marketplace = new Marketplace(
            address(mockUSDT),
            payable(address(commDist)),
            address(eggNFT),
            address(animalNFT)
        );

        // Wire contracts
        commDist.setEggNFTContract(address(eggNFT));
        commDist.setFoodNFTContract(address(foodNFT));
        commDist.setMarketplaceContract(address(marketplace));
        eggNFT.setFoodNFTContract(address(foodNFT));
        eggNFT.setAnimalNFTContract(address(animalNFT));
        animalNFT.setEggNFTContract(address(eggNFT));

        // Setup VRF
        vrfSubscriptionId = vrfCoordinatorMock.createSubscription();
        vrfCoordinatorMock.addConsumer(vrfSubscriptionId, address(eggNFT));
        vrfCoordinatorMock.fundSubscription(vrfSubscriptionId, 100 ether);
        eggNFT.setVRFConfig(vrfSubscriptionId, vrfKeyHash);

        // Mint USDT
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        mockUSDT.mint(seller, INITIAL_BALANCE);
        mockUSDT.mint(referrerG1, INITIAL_BALANCE);
        mockUSDT.mint(referrerG2, INITIAL_BALANCE);
    }

    // ── Helper functions ────────────────────────────────────────

    function _mintEgg(address mintBuyer, address refG1) internal returns (uint256) {
        vm.prank(mintBuyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        vm.prank(mintBuyer);
        uint256 tokenId = eggNFT.mintEgg(refG1);
        vm.prank(mintBuyer);
        foodNFT.setApprovalForAll(address(marketplace), true);
        return tokenId;
    }

    // ── Tests ───────────────────────────────────────────────────

    function testMarketplaceDeployment() public view {
        assertEq(address(marketplace.usdtToken()), address(mockUSDT));
        assertEq(address(marketplace.commissionDistribution()), address(commDist));
        assertEq(marketplace.eggNFTAddress(), address(eggNFT));
        assertEq(marketplace.animalNFTAddress(), address(animalNFT));
        assertEq(marketplace.totalSales(), 0);
    }

    function testListEggForSale() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        uint256 price = 30 * 10**18;

        vm.expectEmit(true, true, false, true);
        bytes32 expectedId = keccak256(abi.encodePacked(address(eggNFT), tokenId));
        emit NFTListed(expectedId, address(eggNFT), tokenId, seller, price, 0);

        marketplace.listNFTForSale(address(eggNFT), tokenId, price, 0);
        vm.stopPrank();

        // Verify egg transferred to marketplace escrow
        assertEq(eggNFT.ownerOf(tokenId), address(marketplace));

        // Verify listing
        (address s, uint256 p, , uint8 t, , bool active) = marketplace.getListing(address(eggNFT), tokenId);
        assertEq(s, seller);
        assertEq(p, price);
        assertEq(t, 0); // NFT_TYPE_EGG
        assertTrue(active);
    }

    function testBuyListedEgg() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);
        uint256 salePrice = 30 * 10**18;

        // Seller lists
        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, salePrice, 0);
        vm.stopPrank();

        uint256 initialBuyerBal = mockUSDT.balanceOf(buyer);

        // Buyer buys
        vm.startPrank(buyer);
        mockUSDT.approve(address(marketplace), salePrice);

        vm.expectEmit(true, true, true, true);
        bytes32 expectedId = keccak256(abi.encodePacked(address(eggNFT), tokenId));
        emit NFTSold(expectedId, buyer, seller, salePrice);

        marketplace.buyNFT(address(eggNFT), tokenId);
        vm.stopPrank();

        // Verify buyer owns NFT
        assertEq(eggNFT.ownerOf(tokenId), buyer);

        // Verify USDT transferred
        assertEq(mockUSDT.balanceOf(buyer), initialBuyerBal - salePrice);

        // Verify seller can claim their 85%
        uint256 sellerClaimable = commDist.getCommissionBalance(seller);
        assertEq(sellerClaimable, (salePrice * 85) / 100);

        // Verify listing is now inactive
        (, , , , , bool active) = marketplace.getListing(address(eggNFT), tokenId);
        assertFalse(active);
    }

    function testResaleCommissionDistribution() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);
        uint256 salePrice = 100 * 10**18;

        // Mint commission: G1=20% of 25 USDT, CoinStor=4%, Treasury=46%
        // Resale commission (from marketplace): G1=2%, CoinStor=4%, Seller=85%, Treasury=remainder

        // List the egg on marketplace
        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, salePrice, 0);
        vm.stopPrank();

        // Buyer purchases
        vm.startPrank(buyer);
        mockUSDT.approve(address(marketplace), salePrice);
        marketplace.buyNFT(address(eggNFT), tokenId);
        vm.stopPrank();

        // Total balances = mint commission + resale commission
        // Mint: G1=20% of 25, CoinStor=4%, Treasury=46% (G2/G3/G4=0 because chain has only G1)
        // Resale: G1=2%, CoinStor=4%, Seller=85%, Treasury=6% (G2/G3/G4=0 because chain has only G1)
        uint256 mintTotal   = MINT_PRICE; // 25 USDT
        uint256 resaleTotal = salePrice;  // 100 USDT
        
        uint256 exG1    = (mintTotal * 20) / 100 + (resaleTotal * 2)  / 100;
        uint256 exCS    = (mintTotal * 4)  / 100 + (resaleTotal * 4)  / 100;
        uint256 exSeller = (resaleTotal * 85) / 100;
        // Treasury: mint portion (46%) + resale remainder
        uint256 exTreasury = (mintTotal * 46) / 100 + resaleTotal
            - (resaleTotal * 2)/100 - (resaleTotal * 4)/100 - (resaleTotal * 85)/100;

        assertEq(commDist.getCommissionBalance(referrerG1), exG1, "G1 mismatch");
        assertEq(commDist.getCommissionBalance(referrerG2), 0, "G2 mismatch");
        assertEq(commDist.getCommissionBalance(referrerG3), 0, "G3 mismatch");
        assertEq(commDist.getCommissionBalance(referrerG4), 0, "G4 mismatch");
        assertEq(commDist.getCommissionBalance(coinStorReserve), exCS, "CoinStor mismatch");
        assertEq(commDist.getCommissionBalance(seller), exSeller, "Seller mismatch");
        assertEq(commDist.getCommissionBalance(treasury), exTreasury, "Treasury mismatch");
    }

    function testCancelListing() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, 30 * 10**18, 0);

        bytes32 expectedId = keccak256(abi.encodePacked(address(eggNFT), tokenId));
        vm.expectEmit(true, true, false, false);
        emit ListingCancelled(expectedId, seller);

        marketplace.cancelListing(address(eggNFT), tokenId);
        vm.stopPrank();

        // Verify NFT returned to seller
        assertEq(eggNFT.ownerOf(tokenId), seller);

        // Verify listing inactive
        (, , , , , bool active) = marketplace.getListing(address(eggNFT), tokenId);
        assertFalse(active);
    }

    function testUpdateListingPrice() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, 30 * 10**18, 0);

        marketplace.updateListingPrice(address(eggNFT), tokenId, 50 * 10**18);

        (, uint256 p, , , , ) = marketplace.getListing(address(eggNFT), tokenId);
        assertEq(p, 50 * 10**18);
        vm.stopPrank();
    }

    function testCannotCancelOtherListing() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, 30 * 10**18, 0);
        vm.stopPrank();

        vm.startPrank(buyer);
        vm.expectRevert("Not seller");
        marketplace.cancelListing(address(eggNFT), tokenId);
        vm.stopPrank();
    }

    function testCannotBuyOwnListing() public {
        uint256 tokenId = _mintEgg(seller, referrerG1);

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, 30 * 10**18, 0);
        mockUSDT.approve(address(marketplace), 30 * 10**18);
        vm.expectRevert("Cannot buy own listing");
        marketplace.buyNFT(address(eggNFT), tokenId);
        vm.stopPrank();
    }

    function testGetMarketplaceListings() public {
        // Mint 3 eggs outside startPrank (each vm.prank inside _mintEgg is independent)
        uint256[3] memory eggTokens;
        for (uint256 i = 0; i < 3; i++) {
            eggTokens[i] = _mintEgg(seller, referrerG1);
        }

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        for (uint256 i = 0; i < 3; i++) {
            marketplace.listNFTForSale(address(eggNFT), eggTokens[i], (25 + i) * 10**18, 0);
        }
        vm.stopPrank();

        // Query listings
        (
            address[] memory contracts,
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices,
            ,
            uint8[] memory nftTypes,
            uint256 total
        ) = marketplace.getMarketplaceListings(0, 10, 255);

        assertEq(total, 3);
        assertEq(contracts.length, 3);
        assertEq(prices[0], 25 * 10**18);
        assertEq(nftTypes[0], 0); // all eggs
    }

    function testGetMarketStats() public {
        // List and sell an egg
        uint256 tokenId = _mintEgg(seller, referrerG1);
        uint256 price = 30 * 10**18;

        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, price, 0);
        vm.stopPrank();

        vm.startPrank(buyer);
        mockUSDT.approve(address(marketplace), price);
        marketplace.buyNFT(address(eggNFT), tokenId);
        vm.stopPrank();

        (uint256 floorPrice, uint256 volume24h, uint256 totalSalesCount, uint256 activeListings) =
            marketplace.getMarketStats();
        assertEq(totalSalesCount, 1);
        assertEq(activeListings, 0);
    }

    function testAutoMintFreeFoodOnEggPurchase() public {
        uint256 tokenId = _mintEgg(buyer, referrerG1);

        // Buyer should have received 2 free food tokens
        // Food tokens are ERC-1155 with sequential IDs starting at 1
        assertEq(foodNFT.balanceOf(buyer, 1), 1); // first free food token
        assertEq(foodNFT.balanceOf(buyer, 2), 1); // second free food token

        // Egg should have food_count = 2
        (uint256 eggId, , uint256 foodCount, , , , , , , , , ) = eggNFT.getEggProperties(tokenId);
        assertEq(foodCount, 2);
    }

    function testGetReferralChainByEggId() public {
        uint256 tokenId = _mintEgg(buyer, referrerG1);

        // Get egg_id from properties
        (uint256 eggId, , , , , , , , , , , ) = eggNFT.getEggProperties(tokenId);

        // Look up referral chain by egg_id
        address[4] memory chain = eggNFT.getReferralChainByEggId(eggId);
        assertEq(chain[0], referrerG1);
        assertEq(chain[1], address(0));
        assertEq(chain[2], address(0));
        assertEq(chain[3], address(0));
    }

    function testSecondarySaleReferralChainTracesBackToEgg() public {
        // Seller mints egg (creates referral chain)
        uint256 tokenId = _mintEgg(seller, referrerG1);

        // Get egg_id
        (uint256 eggId, , , , , , , , , , , ) = eggNFT.getEggProperties(tokenId);

        // Seller lists egg on marketplace
        vm.startPrank(seller);
        eggNFT.setApprovalForAll(address(marketplace), true);
        marketplace.listNFTForSale(address(eggNFT), tokenId, 50 * 10**18, 0);
        vm.stopPrank();

        // Verify originalEggId is stored in listing
        (, , , , uint256 storedEggId, ) = marketplace.getListing(address(eggNFT), tokenId);
        assertEq(storedEggId, eggId);

        // Buyer purchases — resale commission should reference the original referral chain
        vm.startPrank(buyer);
        mockUSDT.approve(address(marketplace), 50 * 10**18);
        marketplace.buyNFT(address(eggNFT), tokenId);
        vm.stopPrank();

        // G1 should receive: 20% of 25 USDT (mint) + 2% of 50 USDT (resale) = 5 + 1 = 6
        uint256 expectedG1 = (MINT_PRICE * 20) / 100 + (50 * 10**18 * 2) / 100;
        assertEq(commDist.getCommissionBalance(referrerG1), expectedG1);
    }
}

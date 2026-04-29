// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TierBadge} from "../../src/TierBadge.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract TierBadgeTokenIdTest is Test {
    TierBadge public tierBadge;
    MockUSDT public usdt;

    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);
    address user3 = address(0x4);
    address coinstorReserve = address(0x5);

    function setUp() public {
        vm.prank(owner);
        usdt = new MockUSDT();

        // Fund coinstor reserve with USDT for rewards
        usdt.mint(coinstorReserve, 1000000 * 10**18);

        vm.prank(owner);
        tierBadge = new TierBadge(address(usdt), coinstorReserve);

        // Approve tierBadge to spend USDT from coinstor reserve
        vm.prank(coinstorReserve);
        usdt.approve(address(tierBadge), type(uint256).max);
    }

    // ==================== Test 1: Monotonic Token IDs ====================

    function testMonotonicTokenIds() public {
        // First mintTierBadge returns tokenId=1, second returns tokenId=2, third returns tokenId=3
        vm.prank(owner);
        uint256 tokenId1 = tierBadge.mintTierBadge(user1, 1, 10);
        assertEq(tokenId1, 1, "First token ID should be 1");

        vm.prank(owner);
        uint256 tokenId2 = tierBadge.mintTierBadge(user2, 1, 10);
        assertEq(tokenId2, 2, "Second token ID should be 2");

        vm.prank(owner);
        uint256 tokenId3 = tierBadge.mintTierBadge(user3, 1, 10);
        assertEq(tokenId3, 3, "Third token ID should be 3");

        // Verify monotonic sequence
        assertTrue(tokenId1 < tokenId2, "Token IDs should be monotonically increasing");
        assertTrue(tokenId2 < tokenId3, "Token IDs should be monotonically increasing");
    }

    // ==================== Test 2: Different Users Get Different Token IDs ====================

    function testDifferentUsersGetDifferentTokenIds() public {
        // Two different users claiming tier 1 get different tokenIds
        vm.prank(owner);
        uint256 tokenId1 = tierBadge.mintTierBadge(user1, 1, 10);

        vm.prank(owner);
        uint256 tokenId2 = tierBadge.mintTierBadge(user2, 1, 10);

        assertNotEq(tokenId1, tokenId2, "Different users should get different token IDs");
        assertEq(tierBadge.ownerOf(tokenId1), user1, "Token 1 should belong to user1");
        assertEq(tierBadge.ownerOf(tokenId2), user2, "Token 2 should belong to user2");
    }

    // ==================== Test 3: tokenURI Resolves Correctly ====================

    function testTokenURIResolvesTierMetadata() public {
        // Mint token ID 4 for user2 (user1 gets 1,2,3 for tiers 1,2,3)
        vm.prank(owner);
        tierBadge.mintTierBadge(user1, 1, 10); // tokenId = 1, tier 1

        vm.prank(owner);
        tierBadge.mintTierBadge(user1, 2, 100); // tokenId = 2, tier 2

        vm.prank(owner);
        tierBadge.mintTierBadge(user1, 3, 1000); // tokenId = 3, tier 3

        // user2 claims tier 1 - should get tokenId = 4
        vm.prank(owner);
        uint256 tokenId4 = tierBadge.mintTierBadge(user2, 1, 10);
        assertEq(tokenId4, 4, "user2 tier 1 should be token ID 4");

        // tokenURI(4) should resolve tier 1 metadata (Seedling)
        string memory uri = tierBadge.tokenURI(tokenId4);
        assertTrue(bytes(uri).length > 0, "tokenURI should not be empty");
        assertTrue(
            keccak256(abi.encodePacked(uri)) != keccak256(abi.encodePacked("")),
            "tokenURI should contain data"
        );

        // Verify it contains "Seedling" (tier 1 name)
        // We can't easily check string content in Solidity, but we can verify the mapping
        uint256 tierId = tierBadge.tokenTier(tokenId4);
        assertEq(tierId, 1, "Token ID 4 should map to tier 1");

        // Get tier details to verify
        (string memory name, uint256 threshold, uint256 rewardAmount) = tierBadge.getTierDetails(tierId);
        assertEq(name, "Seedling", "Tier 1 name should be Seedling");
        assertEq(threshold, 10, "Tier 1 threshold should be 10");
        assertEq(rewardAmount, 5 * 10**18, "Tier 1 reward should be 5 USDT");
    }

    // ==================== Test 4: _nextTokenId Increments ====================

    function testNextTokenIdIncrements() public {
        // _nextTokenId increments from 1 to 2 after first mint
        // We can verify this by checking the second token ID
        vm.prank(owner);
        uint256 tokenId1 = tierBadge.mintTierBadge(user1, 1, 10);
        assertEq(tokenId1, 1, "First mint should return token ID 1");

        vm.prank(owner);
        uint256 tokenId2 = tierBadge.mintTierBadge(user2, 1, 10);
        assertEq(tokenId2, 2, "Second mint should return token ID 2 (counter incremented)");

        // Mint more to verify continued increment
        vm.prank(owner);
        uint256 tokenId3 = tierBadge.mintTierBadge(user3, 1, 10);
        assertEq(tokenId3, 3, "Third mint should return token ID 3");
    }

    // ==================== Test 5: userHighestTier Tracks Tier ID ====================

    function testUserHighestTierTracksTierId() public {
        // userHighestTier still tracks tier ID (not token ID) for sequential claim validation
        vm.prank(owner);
        tierBadge.mintTierBadge(user1, 1, 10); // tier 1

        uint256 highestTier = tierBadge.userHighestTier(user1);
        assertEq(highestTier, 1, "userHighestTier should be 1 (tier ID, not token ID)");

        // User can claim tier 2
        vm.prank(owner);
        tierBadge.mintTierBadge(user1, 2, 100); // tier 2

        highestTier = tierBadge.userHighestTier(user1);
        assertEq(highestTier, 2, "userHighestTier should be 2 after claiming tier 2");

        // Verify token IDs are different
        // user1 has token IDs 1 (tier 1) and 2 (tier 2)
        // The mapping tokenTier should reflect this
        assertEq(tierBadge.tokenTier(1), 1, "Token ID 1 should map to tier 1");
        assertEq(tierBadge.tokenTier(2), 2, "Token ID 2 should map to tier 2");
    }

    // ==================== Additional: Multiple Users Same Tier ====================

    function testMultipleUsersCanClaimSameTier() public {
        // Verify that multiple users can claim the same tier (the original bug)
        uint256[] memory tokenIds = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            address user = address(uint160(0x10 + i));
            vm.prank(owner);
            tokenIds[i] = tierBadge.mintTierBadge(user, 1, 10);
        }

        // All token IDs should be unique
        for (uint256 i = 0; i < 5; i++) {
            for (uint256 j = i + 1; j < 5; j++) {
                assertNotEq(tokenIds[i], tokenIds[j], "All token IDs should be unique");
            }
        }

        // All should map to tier 1
        for (uint256 i = 0; i < 5; i++) {
            assertEq(tierBadge.tokenTier(tokenIds[i]), 1, "All tokens should map to tier 1");
        }
    }
}

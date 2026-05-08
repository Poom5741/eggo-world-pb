// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC5192 Minimal Soulbound NFT Interface
/// @dev Interface for non-transferable NFTs as defined in EIP-5192
/// @notice https://eips.ethereum.org/EIPS/eip-5192
interface IERC5192 {
    /// @notice Emitted when a token is locked and cannot be transferred
    event Locked(uint256 tokenId);

    /// @notice Emitted when a token is unlocked and can be transferred
    /// @dev TierBadge tokens are permanently locked, so this is never emitted
    event Unlocked(uint256 tokenId);

    /// @notice Returns true if the token is locked and cannot be transferred
    /// @param tokenId The identifier for an NFT
    /// @return True if the token is locked, false otherwise
    function locked(uint256 tokenId) external view returns (bool);
}

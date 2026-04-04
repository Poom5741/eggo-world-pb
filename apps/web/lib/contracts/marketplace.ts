import { Contract } from 'ethers'

// Marketplace contract address
export const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000'

// Minimal ABI for marketplace buyNFT function
export const MARKETPLACE_ABI = [
  // Functions
  'function buyNFT(uint256 tokenId) external',
  'function getListedNFT(uint256 tokenId) external view returns (tuple(address seller, uint256 price, bool active))',
  
  // Events
  'event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)',
] as const

// Get Marketplace contract instance
export function getMarketplaceContract(signer: any) {
  return new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer)
}

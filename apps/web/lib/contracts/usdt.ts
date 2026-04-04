import { Contract } from 'ethers'

// USDT contract address on BSC
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955'

// Minimal ABI for USDT approval
export const USDT_ABI = [
  // Functions
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  
  // Events
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

// Get USDT contract instance
export function getUSDTContract(signer: any) {
  return new Contract(USDT_ADDRESS, USDT_ABI, signer)
}

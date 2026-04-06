import { Contract, type Signer } from 'ethers'

// USDT contract address on BSC
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955'

// Minimal ABI for USDT approval (BEP-20 standard)
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
export function getUSDTContract(signer: Signer) {
  return new Contract(USDT_ADDRESS, USDT_ABI, signer)
}

/**
 * ตรวจสอบจำนวน USDT ที่อนุมัติแล้ว (Check existing USDT allowance)
 * @param signer - ผู้เซ็นธุรกรรม
 * @param owner - เจ้าของเงิน (wallet address)
 * @param spender - ผู้ใช้จ่าย (marketplace contract address)
 * @returns จำนวนที่อนุมัติแล้ว (bigint)
 */
export async function checkAllowance(
  signer: Signer,
  owner: string,
  spender: string
): Promise<bigint> {
  const contract = getUSDTContract(signer)
  const allowance = await contract.allowance(owner, spender)
  return allowance as bigint
}

/**
 * อนุมัติ USDT สำหรับการใช้จ่าย (Approve USDT for spending)
 * ใช้สำหรับ one-step approval เท่านั้น (exact amount ไม่ใช่ infinite)
 * @param signer - ผู้เซ็นธุรกรรม
 * @param spender - ผู้ใช้จ่าย (marketplace contract address)
 * @param amount - จำนวนที่ต้องการอนุมัติ (ในหน่วย wei)
 * @returns true เมื่ออนุมัติสำเร็จ
 */
export async function approveUSDT(
  signer: Signer,
  spender: string,
  amount: bigint
): Promise<boolean> {
  try {
    const contract = getUSDTContract(signer)
    
    // Send approval transaction
    const tx = await contract.approve(spender, amount)
    
    // Wait for transaction confirmation
    await tx.wait()
    
    return true
  } catch (error: any) {
    // Handle MetaMask rejection or other errors
    if (error?.code === 'ACTION_REJECTED' || error?.message?.includes('rejected')) {
      throw new Error('User rejected the approval transaction')
    }
    throw new Error(`Failed to approve USDT: ${error.message}`)
  }
}

/**
 * รับทศนิยมของ USDT (Get USDT decimals)
 * @param signer - ผู้เซ็นธุรกรรม
 * @returns จำนวนทศนิยม (ปกติ 18 สำหรับ BEP-20)
 */
export async function getUSDTDecimals(signer: Signer): Promise<number> {
  const contract = getUSDTContract(signer)
  const decimals = await contract.decimals()
  return Number(decimals)
}

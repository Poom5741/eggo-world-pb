import { Contract, type Signer } from 'ethers'

// Marketplace contract address
export const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000'

// Minimal ABI for marketplace buyNFT function
export const MARKETPLACE_ABI = [
  // Functions
  'function buyNFT(uint256 listingId) external',
  'function getListedNFT(uint256 listingId) external view returns (tuple(address seller, uint256 price, bool active))',
  'function getListing(uint256 listingId) external view returns (tuple(address seller, uint256 price, bool active))',
  'function createListing(uint256 nftId, uint256 nftType, uint256 price) external',
  'function approveNFT(address to, uint256 tokenId) external',
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address owner, address operator) external view returns (bool)',
  
  // Events
  'event NFTSold(uint256 indexed listingId, address indexed seller, address indexed buyer, uint256 price)',
  'event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 nftId, uint256 price)',
] as const

// Get Marketplace contract instance
export function getMarketplaceContract(signer: Signer) {
  return new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer)
}

/**
 * ซื้อ NFT จาก Marketplace (Buy NFT from marketplace)
 * 
 * @param signer - ผู้เซ็นธุรกรรม (buyer's signer)
 * @param listingId - ID ของรายการ NFT ที่จะซื้อ
 * @param price - ราคาในหน่วย wei (ต้องตรวจสอบ allowance ก่อน)
 * @returns true เมื่อซื้อสำเร็จ
 * 
 * @throws Error เมื่อธุรกรรมล้มเหลว
 * 
 * @remarks
 * ต้องตรวจสอบ USDT allowance ก่อนเรียกฟังก์ชันนี้
 * Must check USDT allowance before calling this function
 * 
 * @example
 * ```typescript
 * const signer = await getSigner()
 * const listingId = "123"
 * const price = parseUnits("100", 18) // 100 USDT
 * 
 * // Step 1: ตรวจสอบ allowance
 * const allowance = await checkAllowance(signer, userAddress, MARKETPLACE_ADDRESS)
 * if (allowance < price) {
 *   await approveUSDT(signer, MARKETPLACE_ADDRESS, price)
 * }
 * 
 * // Step 2: ซื้อ NFT
 * await buyNFT(signer, listingId, price)
 * ```
 */
export async function buyNFT(
  signer: Signer,
  listingId: string,
  _price: bigint
): Promise<boolean> {
  try {
    const contract = getMarketplaceContract(signer)
    
    // เรียก buyNFT function
    const tx = await contract.buyNFT(listingId)
    
    // รอ transaction confirmation
    const receipt = await tx.wait()
    
    // ตรวจสอบ event NFTSold (ถ้ามี)
    if (receipt?.logs) {
      const soldEvent = receipt.logs.find((log: { fragment?: { name?: string } }) => {
        try {
          return log.fragment?.name === 'NFTSold'
        } catch {
          return false
        }
      })
      
      if (soldEvent) {
        // Event logging for debugging
        void soldEvent
      }
    }
    
    return true
  } catch (error: unknown) {
    // Handle MetaMask rejection or other errors
    if (error instanceof Error) {
      if (error?.message?.includes('rejected')) {
        throw new Error('User rejected the purchase transaction')
      }
      
      // Handle insufficient allowance
      if (error.message.includes('allowance') || error.message.includes('transfer amount exceeds balance')) {
        throw new Error('Insufficient USDT allowance. Please approve more USDT first.')
      }
      
      throw new Error(`Failed to buy NFT: ${error.message}`)
    }
    throw new Error('Failed to buy NFT: Unknown error')
  }
}

/**
 * รับข้อมูลรายการ NFT จาก Marketplace (Get NFT listing info)
 * 
 * @param signer - ผู้เซ็นธุรกรรม
 * @param listingId - ID ของรายการ
 * @returns ข้อมูล seller, price, active status
 */
export async function getListingInfo(
  signer: Signer,
  listingId: string
): Promise<{ seller: string; price: bigint; active: boolean } | null> {
  try {
    const contract = getMarketplaceContract(signer)
    const listing = await contract.getListing(listingId)
    
    return {
      seller: listing[0],
      price: listing[1] as bigint,
      active: listing[2],
    }
  } catch {
    return null
  }
}

/**
 * ตรวจสอบการอนุมัติ NFT สำหรับ Marketplace (Check NFT approval for marketplace)
 * 
 * @param signer - ผู้เซ็นธุรกรรม
 * @param owner - เจ้าของ NFT
 * @param marketplaceAddress - Address ของ marketplace contract
 * @returns true หากอนุมัติแล้ว
 */
export async function isNFTApprovedForMarketplace(
  signer: Signer,
  owner: string,
  marketplaceAddress?: string
): Promise<boolean> {
  try {
    const contract = getMarketplaceContract(signer)
    const address = marketplaceAddress || MARKETPLACE_ADDRESS
    const approved = await contract.isApprovedForAll(owner, address)
    return approved as boolean
  } catch {
    return false
  }
}

/**
 * อนุมัติ NFT สำหรับ Marketplace (Approve NFT for marketplace)
 * ใช้ setApprovalForAll เพื่ออนุญาตให้ marketplace โอน NFT ได้
 * 
 * @param signer - ผู้เซ็นธุรกรรม (เจ้าของ NFT)
 * @param marketplaceAddress - Address ของ marketplace contract (ไม่ระบุจะใช้ค่า default)
 * @returns true เมื่ออนุมัติสำเร็จ
 * 
 * @throws Error เมื่อธุรกรรมล้มเหลว
 * 
 * @example
 * ```typescript
 * const signer = await getSigner()
 * await approveNFTForMarketplace(signer)
 * 
 * // Then create listing
 * await createListing(signer, 'Egg', tokenId, price)
 * ```
 */
export async function approveNFTForMarketplace(
  signer: Signer,
  marketplaceAddress?: string
): Promise<boolean> {
  try {
    const contract = getMarketplaceContract(signer)
    const address = marketplaceAddress || MARKETPLACE_ADDRESS
    
    // เรียก setApprovalForAll function
    const tx = await contract.setApprovalForAll(address, true)
    
    // รอ transaction confirmation
    await tx.wait()
    
    return true
  } catch (error: unknown) {
    // Handle MetaMask rejection or other errors
    if (error instanceof Error) {
      if (error?.message?.includes('rejected')) {
        throw new Error('User rejected the approval transaction')
      }
      
      throw new Error(`Failed to approve NFT: ${error.message}`)
    }
    throw new Error('Failed to approve NFT: Unknown error')
  }
}

/**
 * สร้างรายการขาย NFT ใน Marketplace (Create NFT listing on marketplace)
 * 
 * @param signer - ผู้เซ็นธุรกรรม (ผู้ขาย)
 * @param nftType - ประเภท NFT ('Egg' | 'Food' | 'Animal')
 * @param tokenId - Token ID ของ NFT ที่จะขาย
 * @param price - ราคาในหน่วย wei
 * @returns true เมื่อสร้างรายการสำเร็จ
 * 
 * @throws Error เมื่อธุรกรรมล้มเหลว
 * 
 * @remarks
 * ต้อง approve NFT ก่อนเรียกฟังก์ชันนี้
 * Must approve NFT before calling this function
 * 
 * @example
 * ```typescript
 * const signer = await getSigner()
 * 
 * // Step 1: อนุมัติ NFT
 * await approveNFTForMarketplace(signer)
 * 
 * // Step 2: สร้างรายการขาย
 * const nftType = 'Egg' // หรือ 'Food', 'Animal'
 * const tokenId = "123"
 * const price = parseUnits("100", 18) // 100 USDT
 * 
 * await createListing(signer, nftType, tokenId, price)
 * ```
 */
export async function createListing(
  signer: Signer,
  nftType: 'Egg' | 'Food' | 'Animal',
  tokenId: string,
  price: bigint
): Promise<boolean> {
  try {
    const contract = getMarketplaceContract(signer)
    
    // แปลง nftType เป็นตัวเลขตาม enum ใน contract
    // Egg = 0, Food = 1, Animal = 2
    const nftTypeMap = {
      'Egg': 0,
      'Food': 1,
      'Animal': 2,
    }
    
    const typeNum = nftTypeMap[nftType]
    
    // เรียก createListing function
    const tx = await contract.createListing(tokenId, typeNum, price)
    
    // รอ transaction confirmation
    const receipt = await tx.wait()
    
    // ตรวจสอบ event ListingCreated (ถ้ามี)
    if (receipt?.logs) {
      const createdEvent = receipt.logs.find((log: { fragment?: { name?: string } }) => {
        try {
          return log.fragment?.name === 'ListingCreated'
        } catch {
          return false
        }
      })
      
      if (createdEvent) {
        // Event logging for debugging
        void createdEvent
      }
    }
    
    return true
  } catch (error: unknown) {
    // Handle MetaMask rejection or other errors
    if (error instanceof Error) {
      if (error?.message?.includes('rejected')) {
        throw new Error('User rejected the listing transaction')
      }
      
      throw new Error(`Failed to create listing: ${error.message}`)
    }
    throw new Error('Failed to create listing: Unknown error')
  }
}

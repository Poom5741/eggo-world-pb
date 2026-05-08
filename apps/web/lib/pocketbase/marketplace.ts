/**
 * PocketBase Marketplace API
 * ฟังก์ชันสำหรับดึงข้อมูล marketplace listings จาก PocketBase
 */

import { createClient } from './client'
import { isNotFound, isAutoCancelError } from './error-handling'

/**
 * Listing status values
 * สถานะของ listing
 */
export type ListingStatus = 'active' | 'sold' | 'cancelled'

/**
 * NFT type values
 * ประเภทของ NFT
 */
export type NFTType = 'Egg' | 'Food' | 'Animal'

/**
 * Marketplace listing interface
 * ข้อมูล listing ใน marketplace
 */
export interface MarketplaceListing {
  id: string
  nft_id: string
  nft_type: NFTType
  name: string
  description?: string
  rarity: string
  price: number
  price_symbol?: string
  seller: string
  seller_name?: string
  buyer?: string
  image_url?: string
  status: ListingStatus
  transaction_hash?: string
  created: string
  updated: string
}

/**
 * Options for getting marketplace listings
 * ตัวเลือกสำหรับดึง listings
 */
export interface GetListingsOptions {
  /** Filter by status (default: active) */
  status?: ListingStatus
  /** Filter by NFT type */
  nft_type?: NFTType
  /** Filter by seller address */
  seller?: string
  /** Sort field (default: created) */
  sort?: string
  /** Number of items per page (default: 20) */
  limit?: number
  /** Page number */
  page?: number
  /** Search term for name/description */
  search?: string
}

/**
 * Get all marketplace listings
 * ดึงรายการ marketplace listings ทั้งหมด
 * 
 * @param options - Filter and pagination options
 * @returns Array of marketplace listings
 */
export async function getMarketplaceListings(
  options: GetListingsOptions = {}
): Promise<MarketplaceListing[]> {
  const pb = createClient()
  
  const {
    status = 'active',
    nft_type,
    seller,
    sort = '-created',
    limit = 20,
    page = 1,
    search
  } = options

  try {
    // สร้าง filter string
    const filters: string[] = []
    
    if (status) {
      filters.push(`status = "${status}"`)
    }
    
    if (nft_type) {
      filters.push(`nft_type = "${nft_type}"`)
    }
    
    if (seller) {
      filters.push(`seller = "${seller}"`)
    }
    
    if (search) {
      filters.push(`(name ~ "${search}" || description ~ "${search}")`)
    }

    const filterString = filters.join(' && ')

    const result = await pb.collection('marketplace_listings').getList<MarketplaceListing>(
      page,
      limit,
      {
        filter: filterString,
        sort,
      }
    )

    return result.items
  } catch (error) {
    // Suppress auto-cancel errors (normal during navigation)
    if (isAutoCancelError(error)) {
      return []
    }
    
    console.error('Failed to get marketplace listings:', error)
    throw error
  }
}

/**
 * Get a single marketplace listing by ID
 * ดึง listing เดียวจาก ID
 * 
 * @param id - Listing ID
 * @returns Marketplace listing or null if not found
 */
export async function getListingById(
  id: string
): Promise<MarketplaceListing | null> {
  const pb = createClient()

  try {
    const listing = await pb.collection('marketplace_listings').getOne<MarketplaceListing>(
      id,
      {
        fields: 'id, name, nft_id, nft_type, price, rarity, status, image_url, seller, seller_name, created, updated',
      }
    )

    return listing
  } catch (error) {
    // Return null for not found errors
    if (isNotFound(error)) {
      return null
    }
    
    // Suppress auto-cancel errors
    if (isAutoCancelError(error)) {
      return null
    }
    
    console.error('Failed to get listing by ID:', error)
    throw error
  }
}

/**
 * Get listings for a specific seller
 * ดึง listings ของ seller เฉพาะ
 * 
 * @param sellerAddress - Seller's wallet address
 * @param includeSold - Include sold listings (default: false)
 * @returns Array of marketplace listings
 */
export async function getListingsBySeller(
  sellerAddress: string,
  includeSold: boolean = false
): Promise<MarketplaceListing[]> {
  const pb = createClient()

  try {
    const statusFilter = includeSold 
      ? '(status = "active" || status = "sold" || status = "cancelled")'
      : 'status = "active"'

    const result = await pb.collection('marketplace_listings').getList<MarketplaceListing>(
      1,
      50,
      {
        filter: `seller = "${sellerAddress}" && ${statusFilter}`,
        sort: '-created',
      }
    )

    return result.items
  } catch (error) {
    if (isAutoCancelError(error)) {
      return []
    }
    
    console.error('Failed to get listings by seller:', error)
    throw error
  }
}

/**
 * Get featured/active listings (for homepage)
 * ดึง listings ที่แนะนำสำหรับหน้าแรก
 * 
 * @param limit - Number of items (default: 6)
 * @returns Array of featured marketplace listings
 */
export async function getFeaturedListings(
  limit: number = 6
): Promise<MarketplaceListing[]> {
  const pb = createClient()

  try {
    const result = await pb.collection('marketplace_listings').getList<MarketplaceListing>(
      1,
      limit,
      {
        filter: 'status = "active"',
        sort: '-created',
      }
    )

    return result.items
  } catch (error) {
    if (isAutoCancelError(error)) {
      return []
    }
    
    console.error('Failed to get featured listings:', error)
    throw error
  }
}

/**
 * Cancel a marketplace listing (seller only)
 * ยกเลิก listing ใน marketplace (เฉพาะผู้ขาย)
 * 
 * @param listingId - Listing ID to cancel
 * @returns Success response with cancelled listing info
 * @throws Error if cancellation fails
 */
export async function cancelListing(
  listingId: string
): Promise<{ listing_id: string; status: string; nft_type?: string; nft_id?: string }> {
  const pb = createClient()

  try {
    const response = await pb.send('/api/v2/cancel-listing', {
      method: 'POST',
      body: { listing_id: listingId },
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to cancel listing:', error)
    throw error
  }
}

/**
 * Update listing price
 * อัปเดตราคาของ listing
 * 
 * @param listingId - Listing ID to update
 * @param newPrice - New price in USDT
 */
export async function updateListingPrice(
  listingId: string,
  newPrice: number
): Promise<void> {
  const pb = createClient()

  try {
    await pb.collection('marketplace_listings').update(listingId, {
      price: newPrice,
    })
  } catch (error) {
    if (isAutoCancelError(error)) {
      throw new Error('Request cancelled')
    }
    
    console.error('Failed to update listing price:', error)
    throw error
  }
}
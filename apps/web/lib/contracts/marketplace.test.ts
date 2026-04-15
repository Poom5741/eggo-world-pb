import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { 
  MARKETPLACE_ADDRESS, 
  MARKETPLACE_ABI,
  getMarketplaceContract,
} from './marketplace'

describe('Marketplace Contract Constants', () => {
  describe('MARKETPLACE_ADDRESS', () => {
    it('should export marketplace address from env or default', () => {
      expect(MARKETPLACE_ADDRESS).toBeDefined()
      expect(typeof MARKETPLACE_ADDRESS).toBe('string')
    })
  })

  describe('MARKETPLACE_ABI', () => {
    it('should export ABI as array', () => {
      expect(MARKETPLACE_ABI).toBeDefined()
      expect(Array.isArray(MARKETPLACE_ABI)).toBe(true)
    })

    it('should export ABI with buyNFT function', () => {
      const hasBuyNFT = MARKETPLACE_ABI.some(entry => 
        typeof entry === 'string' && entry.includes('buyNFT')
      )
      expect(hasBuyNFT).toBe(true)
    })

    it('should export ABI with createListing function', () => {
      const hasCreateListing = MARKETPLACE_ABI.some(entry =>
        typeof entry === 'string' && entry.includes('createListing')
      )
      expect(hasCreateListing).toBe(true)
    })

    it('should export ABI with cancelListing function', () => {
      const hasCancelListing = MARKETPLACE_ABI.some(entry =>
        typeof entry === 'string' && entry.includes('cancelListing')
      )
      expect(hasCancelListing).toBe(true)
    })

    it('should export ABI with NFTSold event', () => {
      const hasNFTSoldEvent = MARKETPLACE_ABI.some(entry =>
        typeof entry === 'string' && entry.includes('event NFTSold')
      )
      expect(hasNFTSoldEvent).toBe(true)
    })

    it('should export ABI with ListingCreated event', () => {
      const hasListingCreatedEvent = MARKETPLACE_ABI.some(entry =>
        typeof entry === 'string' && entry.includes('event ListingCreated')
      )
      expect(hasListingCreatedEvent).toBe(true)
    })
  })

  describe('getMarketplaceContract', () => {
    it('should create contract instance with signer', () => {
      const mockSigner = {} as any
      const contract = getMarketplaceContract(mockSigner)
      expect(contract).toBeDefined()
    })
  })
})

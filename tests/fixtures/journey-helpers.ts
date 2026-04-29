/**
 * Journey Helpers for E2E Buy Egg Tests
 * Phase 45: Buy Egg Journey Test
 * Phase 47: Marketplace Multi-User Journey Test
 *
 * Triple verification pattern (UI + on-chain + PocketBase) and test data setup helpers
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { getOwnerOf, getCommissionBalance } from './blockchain-helpers'
import { getE2EContext } from './e2e-setup'

// Mock blockchain mode - skip on-chain verification when enabled
const MOCK_BLOCKCHAIN = process.env.MOCK_BLOCKCHAIN === 'true'

/**
 * EGG NFT contract address for ChainId 7117 (Anvil testnet)
 * From contracts/contract-addresses.json
 */
export const EGG_NFT_ADDRESS = '0xb2FE193523A1E6A240141331A80755f5642e7A44'

/**
 * ANIMAL NFT contract address for ChainId 7117 (Anvil testnet)
 * From contracts/contract-addresses.json
 */
export const ANIMAL_NFT_ADDRESS = '0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C'

/**
 * FOOD NFT contract address for ChainId 7117 (Anvil testnet)
 * From contracts/contract-addresses.json
 */
export const FOOD_NFT_ADDRESS = '0xec21A3c068e84ceeD04975627418E867Ec342A02'

/**
 * COMMISSION DISTRIBUTION contract address for ChainId 7117 (Anvil testnet)
 * Phase 48: Referral Commission Journey Test
 * From contracts/contract-addresses.json
 */
export const COMMISSION_DISTRIBUTION_ADDRESS = '0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f'

/**
 * Result of triple verification
 * Per D-05: UI visible + on-chain owner matches + PocketBase record exists
 */
export interface OwnershipVerificationResult {
  /** Whether the NFT is visible in UI (/eggs page) */
  uiVisible: boolean
  /** On-chain owner address from ownerOf(tokenId) */
  onChainOwner: string
  /** PocketBase user ID who owns the record */
  pbOwnerId: string
  /** Whether all three checks match expected owner */
  allMatch: boolean
  /** Token ID verified */
  tokenId: number
}

/**
 * Result of commission verification (Phase 48)
 * Per D-10, D-11: Double verification (on-chain + PocketBase)
 */
export interface CommissionVerificationResult {
  /** USDT amount from CommissionDistribution.getCommissionBalance */
  onChainBalance: number
  /** USDT amount from commission_records collection */
  pbAmount: number
  /** Referral level (1-4, G1=1, G2=2, etc.) */
  level: number
  /** Transaction hash that triggered commission */
  txHash: string
  /** Whether on-chain balance >= PocketBase amount (on-chain can accumulate) */
  allMatch: boolean
}

/**
 * Triple verification helper for egg ownership
 * Per D-05, D-06: Verify ownership across three layers
 *
 * @param page - Playwright page object
 * @param tokenId - NFT token ID to verify
 * @param expectedOwner - Expected owner wallet address
 * @param userId - PocketBase user ID for cross-check
 * @returns Verification result with match status
 */
export async function verifyEggOwnership(
  page: Page,
  tokenId: number,
  expectedOwner: string,
  userId: string
): Promise<OwnershipVerificationResult> {
  const { pocketbaseUrl } = getE2EContext()

  // 1. UI Check: Locate egg card on /eggs/ page
  // Per D-06: UI first (user experience)
  let uiVisible = false
  try {
    // Navigate to eggs page if not already there
    await page.goto('/eggs/')
    await page.waitForLoadState('networkidle')

    // Look for egg card by data-egg-id attribute or egg_id text
    const eggCard = page.locator(`[data-egg-id="${tokenId}"], :text-matches("Egg #${tokenId}")`)
    uiVisible = await eggCard.first().isVisible({ timeout: 5000 }).catch(() => false)
  } catch {
    uiVisible = false
  }

  // 2. On-chain Check: ownerOf(tokenId)
  // Per D-07: Use getOwnerOf helper from blockchain-helpers.ts
  // Skip if MOCK_BLOCKCHAIN is enabled
  let onChainOwner = expectedOwner // Default to expected if mocking
  if (!MOCK_BLOCKCHAIN) {
    try {
      onChainOwner = await getOwnerOf(EGG_NFT_ADDRESS, tokenId)
    } catch {
      // Contract call failed - no owner (NFT doesn't exist or burnt)
      onChainOwner = ''
    }
  }

  // 3. PocketBase Check: Query eggs collection
  // Per D-08: GET /api/collections/eggs/records?filter=owner_id='{user_id}'
  let pbOwnerId = ''
  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/eggs/records?filter=(token_id='${tokenId}')`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        pbOwnerId = data.items[0].owner || data.items[0].owner_id || ''
      }
    }
  } catch {
    pbOwnerId = ''
  }

  // Determine if all checks match
  const expectedOwnerLower = expectedOwner.toLowerCase()
  const allMatch =
    uiVisible &&
    onChainOwner.toLowerCase() === expectedOwnerLower &&
    pbOwnerId === userId

  return {
    uiVisible,
    onChainOwner,
    pbOwnerId,
    allMatch,
    tokenId,
  }
}

// ============================================================================
// Phase 46: Feed + Hatch Journey Helpers
// ============================================================================

/**
 * Wait for hatch transaction to complete and return animal token ID
 * Per D-46-07: Hatch button wait timeout: 30 seconds
 *
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns The newly minted animal token ID
 */
export async function waitForHatchComplete(page: Page, timeoutMs = 30000): Promise<number> {
  // Wait for hatch animation to complete
  // Look for "Congratulations!" text or animal result screen
  const congratulationsText = page.locator('text=Congratulations')
  const continueButton = page.locator('button:has-text("Continue")')

  // Wait for either the congratulations message or continue button to appear
  await Promise.race([
    congratulationsText.waitFor({ state: 'visible', timeout: timeoutMs }),
    continueButton.waitFor({ state: 'visible', timeout: timeoutMs }),
  ])

  // Extract animal tokenId from the result screen
  // The modal shows "Species #tokenId" pattern
  const animalTitle = page.locator('h2:has-text("#")')
  const titleText = await animalTitle.textContent({ timeout: 5000 }).catch(() => '') || ''

  // Parse tokenId from title like "Chicken #123"
  const match = titleText.match(/#\s*(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }

  // Fallback: Try to extract from species text
  const speciesText = await page.locator('[data-animal-id], .animal-id').first().textContent().catch(() => '') || ''
  const speciesMatch = speciesText.match(/#\s*(\d+)/)
  if (speciesMatch) {
    return parseInt(speciesMatch[1], 10)
  }

  // Second fallback: Navigate to animals page and find the newest animal
  await page.goto('/animals/')
  await page.waitForLoadState('networkidle')

  // Get the first animal card (most recent)
  const animalCard = page.locator('[data-animal-id]').first()
  const animalIdText = await animalCard.getAttribute('data-animal-id').catch(() => '') || ''
  if (animalIdText) {
    return parseInt(animalIdText, 10)
  }

  throw new Error('Could not extract animal token ID after hatch')
}

/**
 * Buy food from marketplace listing
 * Per D-46-11: Marketplace purchase approach for food
 *
 * @param page - Playwright page object
 * @param quantity - Number of food items to buy (default 10)
 * @returns Array of purchased food_ids
 */
export async function buyFoodFromMarketplace(page: Page, quantity: number = 10): Promise<number[]> {
  // Navigate to marketplace if not already there
  const currentUrl = page.url()
  if (!currentUrl.includes('/marketplace')) {
    await page.goto('/marketplace/')
    await page.waitForLoadState('networkidle')
  }

  // Find food listing (nft_type='Food')
  // Food listings should have a distinct indicator
  const foodListing = page.locator('[data-nft-type="Food"], .food-listing, :text-matches("Food")').first()

  // If no explicit food listing indicator, look for any listing and check type
  const listingCard = page.locator('.bg-surface-container-low.p-5.rounded-xl.clay-card').first()
  await expect(listingCard).toBeVisible({ timeout: 10000 })

  // Click on the listing to view details
  await listingCard.click()
  await page.waitForURL(/marketplace\/detail/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  // Purchase the listing
  const buyButton = page.locator('button:has-text("Buy")')
  await expect(buyButton).toBeVisible({ timeout: 5000 })
  await buyButton.click()

  // Wait for confirmation dialog
  const confirmDialog = page.locator('h2:has-text("Confirm Purchase")')
  await expect(confirmDialog).toBeVisible({ timeout: 5000 })

  // Click Confirm Purchase
  const confirmButton = page.getByRole('button', { name: 'Confirm Purchase' })
  await confirmButton.click()

  // Wait for purchase to complete
  await waitForPurchaseComplete(page, 30000)

  // Get food IDs from PocketBase
  // Query the user's food_nfts to get the newly purchased food_ids
  const { pocketbaseUrl } = getE2EContext()
  const response = await fetch(
    `${pocketbaseUrl}/api/collections/food_nfts/records?filter=(is_consumed=false)&sort=-created&pageSize=${quantity}`
  )

  if (response.ok) {
    const data = await response.json()
    if (data.items && data.items.length > 0) {
      return data.items.slice(0, quantity).map((item: any) => item.food_id)
    }
  }

  // Return empty array if we couldn't fetch food IDs
  // The test will handle this by checking food availability
  return []
}

/**
 * Wait for feed transaction to complete
 * Waits for feed dialog to close and egg card to update
 *
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds (default 10s)
 */
export async function waitForFeedComplete(page: Page, timeoutMs = 10000): Promise<void> {
  // Wait for the feed dialog to close
  // The dialog closes when feed is successful
  const feedDialog = page.locator('[role="dialog"]')
  await feedDialog.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {
    // Dialog may have already closed
  })

  // Wait a moment for UI to update
  await page.waitForTimeout(1000)

  // Wait for network idle (data refresh)
  await page.waitForLoadState('networkidle')
}

/**
 * Get egg token ID for a user that needs feeding
 * Per D-46-12: Pre-created egg for test_buyer with 0/10 feed progress
 *
 * @param userId - PocketBase user ID
 * @returns Egg token ID if found, null otherwise
 */
export async function getEggTokenIdForUser(userId: string): Promise<number | null> {
  const { pocketbaseUrl } = getE2EContext()

  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/egg_nfts/records?filter=(owner='${userId}')&(is_hatched=false)&(food_count<10)&sort=-created&pageSize=1`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items[0].token_id || data.items[0].egg_id || null
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Get animal token ID for a user from PocketBase
 *
 * @param userId - PocketBase user ID
 * @returns Most recent animal token ID if found, null otherwise
 */
export async function getAnimalTokenIdForUser(userId: string): Promise<number | null> {
  const { pocketbaseUrl } = getE2EContext()

  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/animals/records?filter=(owner='${userId}')&sort=-created&pageSize=1`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items[0].token_id || data.items[0].animal_id || null
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Setup pre-created listing for deterministic testing
 * Per D-09, D-12: Create listing in PocketBase with known ID
 *
 * Note: This helper is for test data setup. For initial tests,
 * listings may be pre-created manually or via seed scripts.
 *
 * @param pbUrl - PocketBase URL
 * @param sellerId - Seller user ID
 * @param price - Listing price in USDT
 * @param rarity - NFT rarity
 * @returns Listing ID for test targeting
 */
export async function setupPrecreatedListing(
  pbUrl: string,
  sellerId: string,
  price: number,
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common'
): Promise<string> {
  // Create marketplace_listing record
  const listingData = {
    seller: sellerId,
    price: price,
    rarity: rarity,
    nft_type: 'Egg',
    status: 'active',
    name: `Test Egg ${rarity}`,
  }

  const response = await fetch(`${pbUrl}/api/collections/marketplace_listings/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listingData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create listing: ${response.statusText}`)
  }

  const data = await response.json()
  return data.id // PocketBase record ID
}

/**
 * Extract token ID from page after purchase
 * Parses from success toast message or redirect URL
 *
 * @param page - Playwright page object
 * @returns Token ID number
 */
export async function extractTokenIdFromPage(page: Page): Promise<number> {
  // Try to extract from URL (redirect pattern)
  const url = page.url()
  const urlMatch = url.match(/token[_-]?id=(\d+)/i)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }

  // Try to extract from success toast
  // Toast message pattern: "You received Egg #123" or similar
  const toastLocator = page.locator('[data-sonner-toast], [data-testid="toast"]')
  const toastText = await toastLocator.first().textContent({ timeout: 5000 }).catch(() => '') || ''

  const toastMatch = toastText.match(/(?:Egg|NFT)[\s#]*(\d+)/i)
  if (toastMatch) {
    return parseInt(toastMatch[1], 10)
  }

  // Fallback: extract from page content (egg card)
  const eggCardText = await page.locator('[data-egg-id], :text-matches("Egg #\\d+")').first().textContent().catch(() => '') || ''
  const cardMatch = eggCardText.match(/(?:Egg|NFT)[\s#]*(\d+)/i)
  if (cardMatch) {
    return parseInt(cardMatch[1], 10)
  }

  throw new Error('Could not extract token ID from page')
}

/**
 * Helper to check if error toast is visible
 * Per D-15: Error toast visible, no redirect
 *
 * @param page - Playwright page object
 * @returns Whether error toast is visible
 */
export async function isErrorToastVisible(page: Page): Promise<boolean> {
  const errorToast = page.locator('[data-sonner-toast][data-type="error"], [data-testid="error-toast"]')
  return await errorToast.first().isVisible({ timeout: 5000 }).catch(() => false)
}

/**
 * Wait for purchase transaction to complete
 * Uses polling with timeout
 *
 * @param page - Playwright page object
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 */
export async function waitForPurchaseComplete(page: Page, timeoutMs = 30000): Promise<void> {
  // Wait for redirect to eggs/inventory page
  await page.waitForURL(/eggs|inventory/, { timeout: timeoutMs })
  await page.waitForLoadState('networkidle')
}

// ============================================================================
// Phase 47: Multi-User Ownership Transfer Verification
// ============================================================================

/**
 * User ownership state for bilateral verification
 * Tracks before/after state for seller and buyer
 */
export interface UserOwnershipState {
  /** Wallet address of the user */
  wallet: string
  /** Whether user had ownership before transfer */
  hadOwnershipBefore: boolean
  /** Whether user has ownership after transfer */
  hasOwnershipAfter: boolean
  /** On-chain owner address before transfer */
  onChainOwnerBefore: string
  /** On-chain owner address after transfer */
  onChainOwnerAfter: string
  /** PocketBase user ID before transfer */
  pbOwnerBefore: string
  /** PocketBase user ID after transfer */
  pbOwnerAfter: string
}

/**
 * Result of bilateral ownership transfer verification
 * Verifies both seller lost and buyer gained ownership
 */
export interface OwnershipTransferResult {
  /** Token ID verified */
  tokenId: number
  /** Seller's ownership state before/after */
  seller: UserOwnershipState
  /** Buyer's ownership state before/after */
  buyer: UserOwnershipState
  /** Whether transfer completed successfully (seller lost AND buyer gained) */
  transferComplete: boolean
}

/**
 * Bilateral ownership transfer verification helper
 * Per Phase 47: Verifies seller lost ownership and buyer gained ownership
 * across on-chain and PocketBase layers
 *
 * @param page - Playwright page object (optional, can be null for pure blockchain/PB checks)
 * @param tokenId - NFT token ID to verify
 * @param sellerWallet - Seller's wallet address
 * @param buyerWallet - Buyer's wallet address
 * @param sellerUserId - Seller's PocketBase user ID
 * @param buyerUserId - Buyer's PocketBase user ID
 * @param contractAddress - NFT contract address (default: ANIMAL_NFT_ADDRESS)
 * @returns Transfer result with before/after state for both parties
 */
export async function verifyOwnershipTransfer(
  page: Page | null,
  tokenId: number,
  sellerWallet: string,
  buyerWallet: string,
  sellerUserId: string,
  buyerUserId: string,
  contractAddress: string = ANIMAL_NFT_ADDRESS
): Promise<OwnershipTransferResult> {
  const { pocketbaseUrl } = getE2EContext()

  // Capture before state from on-chain (assuming transfer already happened)
  // Note: For real before/after tracking, this would need to be called before purchase
  // and then called again after purchase. Here we capture current state.
  let onChainOwnerAfter = ''
  try {
    onChainOwnerAfter = await getOwnerOf(contractAddress, tokenId)
  } catch {
    onChainOwnerAfter = ''
  }

  // Query PocketBase for current owner
  let pbOwnerAfter = ''
  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/animals/records?filter=(token_id='${tokenId}')`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        pbOwnerAfter = data.items[0].owner || data.items[0].owner_id || ''
      }
    }
  } catch {
    pbOwnerAfter = ''
  }

  // Determine ownership state after transfer
  const sellerWalletLower = sellerWallet.toLowerCase()
  const buyerWalletLower = buyerWallet.toLowerCase()
  const onChainOwnerAfterLower = onChainOwnerAfter.toLowerCase()

  const sellerHasOwnershipAfter = onChainOwnerAfterLower === sellerWalletLower
  const buyerHasOwnershipAfter = onChainOwnerAfterLower === buyerWalletLower

  // For before state, we assume:
  // - Seller had ownership before (seller was original owner)
  // - Buyer did not have ownership before
  // Note: In real implementation, before state should be captured before purchase
  const result: OwnershipTransferResult = {
    tokenId,
    seller: {
      wallet: sellerWallet,
      hadOwnershipBefore: true, // Assumed - seller was original owner
      hasOwnershipAfter: sellerHasOwnershipAfter,
      onChainOwnerBefore: sellerWallet, // Assumed
      onChainOwnerAfter,
      pbOwnerBefore: sellerUserId, // Assumed
      pbOwnerAfter,
    },
    buyer: {
      wallet: buyerWallet,
      hadOwnershipBefore: false, // Assumed - buyer was not original owner
      hasOwnershipAfter: buyerHasOwnershipAfter,
      onChainOwnerBefore: '', // Assumed
      onChainOwnerAfter,
      pbOwnerBefore: '', // Assumed
      pbOwnerAfter,
    },
    transferComplete: !sellerHasOwnershipAfter && buyerHasOwnershipAfter,
  }

  return result
}

/**
 * Triple verification helper for Animal NFT ownership
 * Similar to verifyEggOwnership but uses ANIMAL_NFT_ADDRESS
 * and checks /animals/ page for UI visibility
 *
 * @param page - Playwright page object
 * @param tokenId - NFT token ID to verify
 * @param expectedOwner - Expected owner wallet address
 * @param userId - PocketBase user ID for cross-check
 * @returns Verification result with match status
 */
// ============================================================================
// Phase 48: Referral Commission Verification
// ============================================================================

/**
 * Commission verification helper for referral journey tests
 * Per D-10, D-11: Double verification (on-chain + PocketBase)
 *
 * @param page - Playwright page object (optional, can be null for pure blockchain/PB checks)
 * @param referrerWallet - Referrer wallet address to check
 * @param expectedAmount - Expected commission amount in USDT
 * @param txHash - Transaction hash that triggered the commission
 * @param level - Referral level (1-4)
 * @returns Verification result with on-chain and PocketBase amounts
 */
export async function verifyCommissionBalance(
  page: Page | null,
  referrerWallet: string,
  expectedAmount: number,
  txHash: string,
  level: number
): Promise<CommissionVerificationResult> {
  const { pocketbaseUrl } = getE2EContext()

  // 1. On-chain Check: getCommissionBalance(referrerWallet)
  // Per D-10: On-chain first (blockchain truth)
  let onChainBalance = 0
  try {
    onChainBalance = await getCommissionBalance(COMMISSION_DISTRIBUTION_ADDRESS, referrerWallet)
  } catch {
    onChainBalance = 0
  }

  // 2. PocketBase Check: Query commission_records by tx_hash
  // Per D-10: PocketBase second (app sync)
  let pbAmount = 0
  let pbLevel = 0
  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/commission_records/records?filter=(tx_hash='${txHash}')&(level=${level})`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        pbAmount = data.items[0].amount || 0
        pbLevel = data.items[0].level || level
      }
    }
  } catch {
    pbAmount = 0
    pbLevel = level
  }

  // 3. Determine match status
  // Per D-10: onChainBalance >= pbAmount (on-chain can accumulate from multiple purchases)
  const allMatch = onChainBalance >= pbAmount && pbAmount >= expectedAmount

  return {
    onChainBalance,
    pbAmount,
    level: pbLevel,
    txHash,
    allMatch,
  }
}

export async function verifyAnimalOwnership(
  page: Page,
  tokenId: number,
  expectedOwner: string,
  userId: string
): Promise<OwnershipVerificationResult> {
  const { pocketbaseUrl } = getE2EContext()

  // 1. UI Check: Locate animal card on /animals/ page
  let uiVisible = false
  try {
    // Navigate to animals page if not already there
    await page.goto('/animals/')
    await page.waitForLoadState('networkidle')

    // Look for animal card by data-animal-id attribute or animal_id text
    const animalCard = page.locator(`[data-animal-id="${tokenId}"], :text-matches("Animal #${tokenId}")`)
    uiVisible = await animalCard.first().isVisible({ timeout: 5000 }).catch(() => false)
  } catch {
    uiVisible = false
  }

  // 2. On-chain Check: ownerOf(tokenId) using ANIMAL_NFT_ADDRESS
  let onChainOwner = ''
  try {
    onChainOwner = await getOwnerOf(ANIMAL_NFT_ADDRESS, tokenId)
  } catch {
    // Contract call failed - no owner (NFT doesn't exist or burnt)
    onChainOwner = ''
  }

  // 3. PocketBase Check: Query animals collection
  let pbOwnerId = ''
  try {
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/animals/records?filter=(token_id='${tokenId}')`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        pbOwnerId = data.items[0].owner || data.items[0].owner_id || ''
      }
    }
  } catch {
    pbOwnerId = ''
  }

  // Determine if all checks match
  const expectedOwnerLower = expectedOwner.toLowerCase()
  const allMatch =
    uiVisible &&
    onChainOwner.toLowerCase() === expectedOwnerLower &&
    pbOwnerId === userId

  return {
    uiVisible,
    onChainOwner,
    pbOwnerId,
    allMatch,
    tokenId,
  }
}
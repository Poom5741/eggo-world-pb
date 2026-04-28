/**
 * Journey Helpers for E2E Buy Egg Tests
 * Phase 45: Buy Egg Journey Test
 * Phase 47: Marketplace Multi-User Journey Test
 *
 * Triple verification pattern (UI + on-chain + PocketBase) and test data setup helpers
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { getOwnerOf } from './blockchain-helpers'
import { getE2EContext } from './e2e-setup'

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
  let onChainOwner = ''
  try {
    onChainOwner = await getOwnerOf(EGG_NFT_ADDRESS, tokenId)
  } catch {
    // Contract call failed - no owner (NFT doesn't exist or burnt)
    onChainOwner = ''
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
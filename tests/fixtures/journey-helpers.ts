/**
 * Journey Helpers for E2E Buy Egg Tests
 * Phase 45: Buy Egg Journey Test
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
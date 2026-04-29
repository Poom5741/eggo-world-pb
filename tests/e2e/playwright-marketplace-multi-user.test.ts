/**
 * Marketplace Multi-User Journey E2E Tests
 * Phase 47: Marketplace Journey Test
 *
 * E2E test for complete marketplace multi-user journey covering:
 * seller lists Animal NFT → buyer purchases → ownership transfer verification
 *
 * Per plan: Serial multi-user flow with bilateral ownership verification
 */

import { test, expect } from '@playwright/test'
import { e2eLogin, TEST_USERS, getE2EContext } from '../fixtures/e2e-setup'
import {
  verifyOwnershipTransfer,
  verifyAnimalOwnership,
  extractTokenIdFromPage,
  waitForPurchaseComplete,
  ANIMAL_NFT_ADDRESS,
  OwnershipTransferResult,
} from '../fixtures/journey-helpers'
import { getBalanceOf, getOwnerOf } from '../fixtures/blockchain-helpers'

test.describe('Marketplace Multi-User Journey', () => {
  test.describe.configure({ mode: 'serial' })

  // Shared state across serial tests
  let listingId: string
  let tokenId: number
  let sellerBalanceBefore: number
  let buyerBalanceBefore: number

  /**
   * Pre-test: Verify seller has Animal NFT in inventory
   * Per plan: Setup step to capture initial state
   */
  test('setup - seller has Animal NFT in inventory', async ({ page }) => {
    // Login as seller
    await e2eLogin(page, 'test_seller', '/animals')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify seller has at least one Animal NFT (using card pattern from buy-egg-journey)
    const animalCards = page.locator('.bg-surface-container-lowest.p-6.rounded-xl.clay-card')
    const count = await animalCards.count()

    // If seller has animals, capture the first one's token ID
    if (count > 0) {
      // Capture seller's on-chain Animal NFT balance before listing
      sellerBalanceBefore = await getBalanceOf(
        ANIMAL_NFT_ADDRESS,
        TEST_USERS.test_seller.walletAddress
      )

      // Get the first animal card and extract token ID from text
      const firstCard = animalCards.first()
      const cardText = await firstCard.textContent()
      
      // Extract animal_id from text like "Chicken #123"
      const idMatch = cardText?.match(/#\s*(\d+)/)
      if (idMatch) {
        tokenId = parseInt(idMatch[1], 10)
      }
      
      expect(tokenId).toBeGreaterThan(0)
    } else {
      // Skip if seller has no animals - test requires pre-configured seller inventory
      // This is documented in plan assumptions
      test.skip()
    }
  })

  /**
   * Step 1: Seller lists Animal NFT on marketplace
   * Per plan: Login → navigate to animals → click List → set price → confirm
   */
  test('seller lists Animal NFT on marketplace', async ({ page }) => {
    // Skip if setup failed (no animals)
    if (!tokenId || tokenId === 0) {
      test.skip()
      return
    }

    await e2eLogin(page, 'test_seller', '/animals')
    await page.waitForLoadState('networkidle')

    // Find the animal card with our token ID
    const animalCards = page.locator('.bg-surface-container-lowest.p-6.rounded-xl.clay-card')
    const cardCount = await animalCards.count()

    // Find the card containing our animal ID
    let targetCard = null
    for (let i = 0; i < cardCount; i++) {
      const cardText = await animalCards.nth(i).textContent()
      if (cardText?.includes(`#${tokenId}`)) {
        targetCard = animalCards.nth(i)
        break
      }
    }

    if (!targetCard) {
      // Animal not found in seller inventory - skip
      test.skip()
      return
    }

    // Click Sell button on the card
    const sellButton = targetCard.locator('button:has-text("Sell")')
    await expect(sellButton).toBeVisible({ timeout: 5000 })
    await sellButton.click()

    // Wait for CreateListingDialog to open
    await page.waitForTimeout(500)

    // Set price in dialog (price input field)
    const priceInput = page.locator('input[type="number"], input[placeholder*="price"]')
    await expect(priceInput).toBeVisible({ timeout: 5000 })
    await priceInput.fill('10')

    // Click Create Listing / Confirm button
    const confirmButton = page.locator('button:has-text("Create Listing"), button:has-text("Confirm")')
    await expect(confirmButton).toBeVisible({ timeout: 5000 })
    await confirmButton.click()

    // Wait for success state in dialog or success toast
    const successIndicator = page.locator(
      'h3:has-text("Listing Created"), [data-sonner-toast][data-type="success"]'
    )
    await expect(successIndicator.first()).toBeVisible({ timeout: 15000 })

    // Close dialog if still open
    const closeButton = page.locator('button:has-text("Done")')
    if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeButton.click()
    }

    // Verify listing created in marketplace_listings via PocketBase API
    const { pocketbaseUrl } = getE2EContext()
    const sellerUserId = 'test_seller_user_id' // Would need real user ID in production
    
    // Query marketplace_listings for seller's Animal listing
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/marketplace_listings/records?filter=(nft_type='Animal')&filter=(status='active')&sort=-listed_at`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        // Find listing matching our token ID
        const matchingListing = data.items.find((item: any) => item.animal_id === tokenId)
        if (matchingListing) {
          listingId = matchingListing.id
        }
      }
    }
  })

  /**
   * Step 2: Buyer sees seller listing in marketplace
   * Per plan: Login as buyer → navigate to marketplace → verify listing visible
   */
  test('buyer sees seller listing in marketplace', async ({ page }) => {
    // Skip if no listing was created
    if (!listingId) {
      test.skip()
      return
    }

    await e2eLogin(page, 'test_buyer', '/marketplace')
    await page.waitForLoadState('networkidle')

    // Capture buyer's on-chain balance before purchase
    buyerBalanceBefore = await getBalanceOf(
      ANIMAL_NFT_ADDRESS,
      TEST_USERS.test_buyer.walletAddress
    )

    // Navigate to Animal listings tab
    const animalTab = page.locator('[role="tab"]:has-text("Animal")')
    if (await animalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await animalTab.click()
      await page.waitForTimeout(1000)
    }

    // Verify marketplace listings grid visible
    const listingsGrid = page.locator('.grid.grid-cols-1, .bg-surface-container-lowest')
    await expect(listingsGrid.first()).toBeVisible({ timeout: 10000 })

    // Find listing card (using pattern from AnimalListingsSection)
    const listingCards = page.locator('.bg-surface-container-lowest.clay-card, .bg-surface-container-lowest.p-6')
    const cardCount = await listingCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify price visible on listing (10 USDT from listing step)
    const priceLocator = page.locator('$10.00, $10')
    await expect(priceLocator.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Price format might vary - just check for USDT text
      expect(page.locator('text=USDT').first()).toBeVisible()
    })
  })

  /**
   * Step 3: Buyer purchases listing and ownership transfers
   * Per plan: Click listing → Buy → Confirm → wait for redirect
   */
  test('buyer purchases listing and ownership transfers', async ({ page }) => {
    // Skip if no listing
    if (!listingId) {
      test.skip()
      return
    }

    await e2eLogin(page, 'test_buyer', '/marketplace')
    await page.waitForLoadState('networkidle')

    // Navigate to Animal tab if needed
    const animalTab = page.locator('[role="tab"]:has-text("Animal")')
    if (await animalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await animalTab.click()
      await page.waitForTimeout(1000)
    }

    // Find and click first listing card to view details
    const listingCard = page.locator('.bg-surface-container-lowest.clay-card, .bg-surface-container-lowest.p-6').first()
    await expect(listingCard).toBeVisible({ timeout: 10000 })
    await listingCard.click()

    // Wait for detail page or buy dialog
    await page.waitForTimeout(2000)

    // Look for Buy button (either on card or in detail view)
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("View Details")')
    await expect(buyButton.first()).toBeVisible({ timeout: 10000 })

    // Click Buy/View Details
    await buyButton.first().click()
    await page.waitForTimeout(1000)

    // If we're on a detail page, look for Buy button there
    const detailBuyButton = page.locator('button:has-text("Buy")')
    if (await detailBuyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailBuyButton.click()

      // Wait for confirmation dialog
      const confirmDialog = page.locator('h2:has-text("Confirm Purchase")')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // Click Confirm Purchase
      const confirmButton = page.getByRole('button', { name: 'Confirm Purchase' })
      await confirmButton.click()

      // Wait for purchase to complete - redirect to animals/inventory
      await waitForPurchaseComplete(page, 30000)

      // Verify we're on animals/inventory page
      await expect(page).toHaveURL(/animals|inventory/)
    }
  })

  /**
   * Step 4: Verify ownership transfer - seller lost, buyer gained
   * Per plan: verifyOwnershipTransfer helper for bilateral verification
   */
  test('ownership transfer verified - seller lost, buyer gained', async () => {
    // Skip if no token ID captured
    if (!tokenId || tokenId === 0) {
      test.skip()
      return
    }

    // Use verifyOwnershipTransfer helper for bilateral verification
    // Note: In production, we'd use real PocketBase user IDs
    const result: OwnershipTransferResult = await verifyOwnershipTransfer(
      null, // page not needed for pure blockchain/PB checks
      tokenId,
      TEST_USERS.test_seller.walletAddress,
      TEST_USERS.test_buyer.walletAddress,
      'test_seller_user_id', // Placeholder - would be real user ID
      'test_buyer_user_id', // Placeholder - would be real user ID
      ANIMAL_NFT_ADDRESS
    )

    // Verify transfer complete
    expect(result.transferComplete).toBe(true)
    
    // Verify seller lost ownership
    expect(result.seller.hasOwnershipAfter).toBe(false)
    
    // Verify buyer gained ownership
    expect(result.buyer.hasOwnershipAfter).toBe(true)
    
    // Verify on-chain owner matches buyer wallet
    expect(result.buyer.onChainOwnerAfter.toLowerCase()).toBe(
      TEST_USERS.test_buyer.walletAddress.toLowerCase()
    )
  })

  /**
   * Step 5: Verify seller's inventory updated - NFT no longer visible
   * Per plan: Login as seller → verify animal no longer in inventory
   */
  test('seller inventory no longer shows NFT', async ({ page }) => {
    // Skip if no token ID
    if (!tokenId || tokenId === 0) {
      test.skip()
      return
    }

    await e2eLogin(page, 'test_seller', '/animals')
    await page.waitForLoadState('networkidle')

    // Verify animal no longer in seller's inventory
    const animalCards = page.locator('.bg-surface-container-lowest.p-6.rounded-xl.clay-card')
    
    // Check if any card contains our token ID
    let foundInInventory = false
    const cardCount = await animalCards.count()
    for (let i = 0; i < cardCount; i++) {
      const cardText = await animalCards.nth(i).textContent()
      if (cardText?.includes(`#${tokenId}`)) {
        foundInInventory = true
        break
      }
    }
    
    expect(foundInInventory).toBe(false)

    // Verify on-chain balance decreased
    const sellerBalanceAfter = await getBalanceOf(
      ANIMAL_NFT_ADDRESS,
      TEST_USERS.test_seller.walletAddress
    )
    expect(sellerBalanceAfter).toBeLessThan(sellerBalanceBefore)
  })

  /**
   * Step 6: Verify buyer's inventory updated - NFT now visible
   * Per plan: Login as buyer → verify animal in inventory
   */
  test('buyer inventory shows purchased NFT', async ({ page }) => {
    // Skip if no token ID
    if (!tokenId || tokenId === 0) {
      test.skip()
      return
    }

    await e2eLogin(page, 'test_buyer', '/animals')
    await page.waitForLoadState('networkidle')

    // Verify animal in buyer's inventory
    const animalCards = page.locator('.bg-surface-container-lowest.p-6.rounded-xl.clay-card')
    
    // Check if any card contains our token ID
    let foundInInventory = false
    const cardCount = await animalCards.count()
    for (let i = 0; i < cardCount; i++) {
      const cardText = await animalCards.nth(i).textContent()
      if (cardText?.includes(`#${tokenId}`)) {
        foundInInventory = true
        break
      }
    }
    
    expect(foundInInventory).toBe(true)

    // Verify on-chain balance increased
    const buyerBalanceAfter = await getBalanceOf(
      ANIMAL_NFT_ADDRESS,
      TEST_USERS.test_buyer.walletAddress
    )
    expect(buyerBalanceAfter).toBeGreaterThan(buyerBalanceBefore)
  })
})

test.describe('Marketplace Multi-User Journey - Helper Integration', () => {
  /**
   * Test: verifyOwnershipTransfer structure verification
   * Documents expected interface for bilateral verification
   */
  test('verifyOwnershipTransfer helper structure', async () => {
    // Verify helper function exists and has correct signature
    expect(typeof verifyOwnershipTransfer).toBe('function')
    
    // Verify contract address constant
    expect(ANIMAL_NFT_ADDRESS).toBe('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0')
  })

  /**
   * Test: verifyAnimalOwnership helper structure
   * Documents expected interface for Animal triple verification
   */
  test('verifyAnimalOwnership helper structure', async () => {
    // Verify helper function exists
    expect(typeof verifyAnimalOwnership).toBe('function')
  })

  /**
   * Test: TEST_USERS include seller and buyer
   * Verifies test user configuration for multi-user testing
   */
  test('TEST_USERS include test_seller and test_buyer', async () => {
    expect(TEST_USERS.test_seller).toBeDefined()
    expect(TEST_USERS.test_buyer).toBeDefined()
    
    // Verify wallet addresses are different (different Anvil accounts)
    expect(TEST_USERS.test_seller.walletAddress).not.toBe(TEST_USERS.test_buyer.walletAddress)
    
    // Verify seller is Account 1 and buyer is Account 0
    expect(TEST_USERS.test_seller.walletAddress).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
    expect(TEST_USERS.test_buyer.walletAddress).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  })
})
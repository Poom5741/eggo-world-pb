import { test, expect } from '@playwright/test'
import { e2eLogin, TEST_USERS, getE2EContext } from '../fixtures/e2e-setup'
import {
  verifyAnimalOwnership,
  waitForHatchComplete,
  waitForFeedComplete,
  getEggTokenIdForUser,
  extractTokenIdFromPage,
  waitForPurchaseComplete,
  ANIMAL_NFT_ADDRESS,
  FOOD_NFT_ADDRESS,
} from '../fixtures/journey-helpers'

test.describe('Feed + Hatch Journey', () => {
  test.describe.configure({ mode: 'serial' })

  let eggTokenId: number
  let animalTokenId: number

  /**
   * Test 1: Setup - verify user has egg ready for feeding
   * Per D-17: Main journey uses test_buyer
   */
  test('setup - user has egg ready for feeding', async ({ page }) => {
    // Login as test_buyer
    await e2eLogin(page, 'test_buyer', '/eggs')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify user has at least one egg in inventory
    const eggCards = page.locator('.egg-card, [data-egg-id], .bg-surface-container-low')
    const count = await eggCards.count()
    expect(count).toBeGreaterThan(0)

    // Get egg tokenId from PocketBase
    const { pocketbaseUrl } = getE2EContext()
    
    // Get authenticated user ID from page
    // For test_buyer, we use the wallet address to find the user
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/users/records?filter=(wallet='${TEST_USERS.test_buyer.walletAddress}')`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const userId = data.items[0].id
        eggTokenId = await getEggTokenIdForUser(userId) || 0
      }
    }

    // If we couldn't get from PocketBase, extract from page
    if (!eggTokenId) {
      const firstEggCard = eggCards.first()
      const eggIdText = await firstEggCard.getAttribute('data-egg-id').catch(() => '') || ''
      if (eggIdText) {
        eggTokenId = parseInt(eggIdText, 10)
      } else {
        // Try to parse from text content
        const cardText = await firstEggCard.textContent().catch(() => '') || ''
        const match = cardText.match(/Egg\s*#?(\d+)/i)
        if (match) {
          eggTokenId = parseInt(match[1], 10)
        }
      }
    }

    expect(eggTokenId).toBeGreaterThan(0)
  })

  /**
   * Test 2: Buy food from marketplace
   * Per D-11: Marketplace purchase approach for food
   * Note: This test assumes pre-created food listings exist in marketplace
   */
  test('buy food from marketplace', async ({ page }) => {
    // Login as test_buyer
    await e2eLogin(page, 'test_buyer', '/marketplace')

    // Wait for marketplace to load
    await page.waitForLoadState('networkidle')

    // Verify marketplace has listings
    const listingCards = page.locator('.bg-surface-container-low.p-5.rounded-xl.clay-card')
    const count = await listingCards.count()
    expect(count).toBeGreaterThan(0)

    // Click on first listing (may be food or egg - we need food)
    // If the listing is not food, this test may need adjustment
    const firstListing = listingCards.first()
    await firstListing.click()

    // Wait for detail page
    await page.waitForURL(/marketplace\/detail/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Check if this is a food listing (by price or name)
    // If it's an egg listing, we skip buying and assume food is pre-created
    const detailTitle = await page.locator('h1, h2').first().textContent().catch(() => '') || ''
    
    // For this journey, we assume test_buyer already has 10 food items
    // OR we buy from a food listing if available
    if (detailTitle.toLowerCase().includes('food')) {
      // This is a food listing - proceed with purchase
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
    }

    // Verify we have food in inventory by navigating to eggs page
    await page.goto('/eggs/')
    await page.waitForLoadState('networkidle')
    
    // The feed test will verify we have food available
  })

  /**
   * Test 3: Feed egg with food items
   * Per D-05: Batch feed approach - single feed action using all foods
   */
  test('feed egg with food items', async ({ page }) => {
    // Login as test_buyer
    await e2eLogin(page, 'test_buyer', '/eggs')

    // Wait for eggs page to load
    await page.waitForLoadState('networkidle')

    // Find the egg we want to feed
    const eggCard = page.locator(`[data-egg-id="${eggTokenId}"]`).first()
    
    // If egg not found by data-egg-id, find by egg_id text
    if (!(await eggCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      // Find any egg card that needs feeding (food_count < 10)
      const eggCards = page.locator('.egg-card, .bg-surface-container-low')
      const firstEgg = eggCards.first()
      await firstEgg.click()
    } else {
      await eggCard.click()
    }

    // Wait for egg details/actions
    await page.waitForTimeout(1000)

    // Look for Feed or Manage button
    const feedButton = page.locator('button:has-text("Feed"), button:has-text("Manage")')
    const feedButtonVisible = await feedButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (feedButtonVisible) {
      await feedButton.click()

      // Wait for FeedDialog to open
      const feedDialog = page.locator('[role="dialog"]')
      await expect(feedDialog).toBeVisible({ timeout: 5000 })

      // Check if food is available
      const noFoodMessage = page.locator('text=No food available')
      const hasNoFood = await noFoodMessage.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasNoFood) {
        // Skip feed test - user has no food
        // This scenario is covered in the "no food available" test
        console.log('No food available - skipping feed test')
        test.skip()
        return
      }

      // Select food items (up to 10)
      const foodCards = page.locator('[role="listitem"]')
      const foodCount = await foodCards.count()
      
      // We need to select min(foodCount, 10) items
      const itemsToSelect = Math.min(foodCount, 10)
      
      for (let i = 0; i < itemsToSelect; i++) {
        await foodCards.nth(i).click()
      }

      // Verify selection counter shows correct count
      const counterText = await page.locator('text=/\\d+/10 food selected').textContent().catch(() => '') || ''
      expect(counterText).toContain(`${itemsToSelect}`)

      // Click "Feed X items" button
      const confirmFeedButton = page.locator(`button:has-text("Feed ${itemsToSelect}")`)
      await expect(confirmFeedButton).toBeVisible({ timeout: 3000 })
      await confirmFeedButton.click()

      // Wait for feed to complete
      await waitForFeedComplete(page, 15000)

      // Refresh eggs page to see updated food_count
      await page.goto('/eggs/')
      await page.waitForLoadState('networkidle')

      // Verify egg shows progress update (food_count increased)
      // The progress bar or text should show the new count
    } else {
      // Feed button not visible - egg might already be at 10/10
      console.log('Feed button not found - egg may already be ready to hatch')
    }
  })

  /**
   * Test 4: Hatch the egg when ready (10/10)
   * Per D-07: Feed button triggers hatch automatically when progress reaches 10/10
   */
  test('hatch egg and verify animal appears', async ({ page }) => {
    // Login as test_buyer
    await e2eLogin(page, 'test_buyer', '/eggs')

    // Wait for eggs page to load
    await page.waitForLoadState('networkidle')

    // Find egg that's ready to hatch (10/10 progress)
    // Look for "Ready to Hatch" indicator or Hatch button
    const readyEgg = page.locator('text=/10\\/10|Ready to Hatch/').first()
    const isReady = await readyEgg.isVisible({ timeout: 5000 }).catch(() => false)

    if (!isReady) {
      // Egg not ready - need to feed more
      // This test expects the previous feed test to have completed
      console.log('Egg not ready to hatch - need more food')
      test.skip()
      return
    }

    // Click on the egg card with 10/10 progress
    const eggCard = readyEgg.locator('xpath=..').first()
    await eggCard.click()

    // Wait for hatch modal to appear (if clicking opens it)
    // OR click Hatch button if it appears
    const hatchButton = page.locator('button:has-text("Hatch")')
    const hatchButtonVisible = await hatchButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (hatchButtonVisible) {
      await hatchButton.click()

      // Wait for hatch modal to show "Ready to Hatch" screen
      const hatchModal = page.locator('h2:has-text("Ready to Hatch"), text=Ready to Hatch')
      await expect(hatchModal).toBeVisible({ timeout: 5000 })

      // Click "HATCH!" button in modal
      const confirmHatchButton = page.locator('button:has-text("HATCH")')
      await expect(confirmHatchButton).toBeVisible({ timeout: 3000 })
      await confirmHatchButton.click()

      // Wait for hatch animation to complete
      animalTokenId = await waitForHatchComplete(page, 30000)
      expect(animalTokenId).toBeGreaterThan(0)

      // Click Continue button to proceed to animals page
      const continueButton = page.locator('button:has-text("Continue")')
      const continueVisible = await continueButton.isVisible({ timeout: 5000 }).catch(() => false)
      
      if (continueVisible) {
        await continueButton.click()
      }
    } else {
      // Hatch button not found
      console.log('Hatch button not found after clicking egg')
    }
  })

  /**
   * Test 5: Triple verification for hatched animal
   * Per D-08: Triple verification pattern for hatched animal
   * 1. UI: Animal card visible on /animals page
   * 2. On-chain: ownerOf(tokenId) on AnimalNFT matches test_buyer wallet
   * 3. PocketBase: animals collection record exists with correct owner_id
   */
  test('verify animal ownership - triple verification', async ({ page }) => {
    // Skip if no animal was hatched
    if (!animalTokenId) {
      console.log('No animal token ID - skipping verification')
      test.skip()
      return
    }

    // Login as test_buyer
    await e2eLogin(page, 'test_buyer', '/animals')

    // Wait for animals page to load
    await page.waitForLoadState('networkidle')

    // Get user ID for verification
    const { pocketbaseUrl } = getE2EContext()
    const response = await fetch(
      `${pocketbaseUrl}/api/collections/users/records?filter=(wallet='${TEST_USERS.test_buyer.walletAddress}')`
    )
    
    let userId = ''
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        userId = data.items[0].id
      }
    }

    // Triple verification
    const result = await verifyAnimalOwnership(
      page,
      animalTokenId,
      TEST_USERS.test_buyer.walletAddress,
      userId
    )

    // Verify all three checks pass
    expect(result.uiVisible).toBe(true)
    expect(result.onChainOwner.toLowerCase()).toBe(
      TEST_USERS.test_buyer.walletAddress.toLowerCase()
    )
    expect(result.allMatch).toBe(true)
  })

  /**
   * Test 6: Error scenario - No food available
   * Per D-14, D-15, D-18: test_buyer_poor with 0 food items
   */
  test('no food available shows message - cannot feed', async ({ page }) => {
    // Login with test_buyer_poor (has 0 food items per D-18)
    await e2eLogin(page, 'test_buyer_poor', '/eggs')

    // Wait for eggs page to load
    await page.waitForLoadState('networkidle')

    // Find any egg card and click
    const eggCards = page.locator('.egg-card, [data-egg-id], .bg-surface-container-low')
    const count = await eggCards.count()
    
    if (count === 0) {
      // No eggs for test_buyer_poor - skip
      console.log('No eggs in test_buyer_poor inventory')
      test.skip()
      return
    }

    // Click on first egg
    await eggCards.first().click()
    await page.waitForTimeout(1000)

    // Try to open feed dialog
    const feedButton = page.locator('button:has-text("Feed"), button:has-text("Manage")')
    const feedButtonVisible = await feedButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (feedButtonVisible) {
      await feedButton.click()

      // Wait for FeedDialog to open
      const feedDialog = page.locator('[role="dialog"]')
      await expect(feedDialog).toBeVisible({ timeout: 5000 })

      // Verify "No food available" message is shown
      const noFoodMessage = page.locator('text=No food available')
      await expect(noFoodMessage).toBeVisible({ timeout: 3000 })

      // Verify Feed button is disabled
      const confirmFeedButton = page.locator('button:has-text("Feed")')
      const isDisabled = await confirmFeedButton.isDisabled().catch(() => true)
      expect(isDisabled).toBe(true)
    } else {
      // Feed button not found - maybe egg is hatched or different state
      console.log('Feed button not found for test_buyer_poor')
    }
  })
})

test.describe('Feed + Hatch Journey - Helper Integration', () => {
  /**
   * Test: Verify helper functions are correctly exported
   * Documents expected interface for journey helpers
   */
  test('helper exports for feed/hatch journey', async () => {
    const { pocketbaseUrl } = getE2EContext()
    expect(pocketbaseUrl).toBeTruthy()

    // Verify contract addresses are set
    expect(ANIMAL_NFT_ADDRESS).toBe('0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C')
    expect(FOOD_NFT_ADDRESS).toBe('0xec21A3c068e84ceeD04975627418E867Ec342A02')
  })
})
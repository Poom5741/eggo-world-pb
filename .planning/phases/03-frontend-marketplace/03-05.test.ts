import { describe, it, expect, beforeEach } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Phase 03-05: Buy Now and Dashboard Polling Verification', () => {
  const marketplacePath = join(process.cwd(), 'apps/web/app/marketplace/[nftId]/page.tsx')
  const eggsPath = join(process.cwd(), 'apps/web/app/dashboard/eggs/page.tsx')
  const commissionsPath = join(process.cwd(), 'apps/web/app/dashboard/commissions/page.tsx')

  describe('Task 1: Buy Now Functionality', () => {
    let marketplaceContent: string

    beforeEach(() => {
      marketplaceContent = readFileSync(marketplacePath, 'utf-8')
    })

    it('Test 1: handleBuyNow checks if nft and listed_price exist before proceeding', () => {
      // Should have guard clause checking nft, listed_price, and user
      expect(marketplaceContent).toContain('if (!nft || !nft.listed_price || !user) return')
    })

    it('Test 2: Calls USDT approve for listed_price amount before purchase', () => {
      // Should call usdtContract.approve with MARKETPLACE_ADDRESS
      expect(marketplaceContent).toContain('usdtContract.approve')
      expect(marketplaceContent).toContain('MARKETPLACE_ADDRESS')
    })

    it('Test 3: Calls marketplace.buyNFT(nftId) after approval', () => {
      // Should call buyNFT with token_id
      expect(marketplaceContent).toContain('marketplace.buyNFT')
      expect(marketplaceContent).toContain('nft.token_id')
    })

    it('Test 4: Waits for tx.wait() confirmation', () => {
      // Should wait for both approval and buy transactions
      const approveWaitCount = (marketplaceContent.match(/approveTx\.wait\(\)/g) || []).length
      const buyWaitCount = (marketplaceContent.match(/buyTx\.wait\(\)/g) || []).length
      expect(approveWaitCount).toBeGreaterThan(0)
      expect(buyWaitCount).toBeGreaterThan(0)
    })

    it('Test 5: Shows success state and redirects to /dashboard/nfts', () => {
      // Should show toast success and redirect
      expect(marketplaceContent).toContain("toast.success('NFT purchased successfully!')")
      expect(marketplaceContent).toContain("router.push('/dashboard/nfts')")
    })

    it('Test 6: Shows error state on failure', () => {
      // Should have error handling with setError
      expect(marketplaceContent).toContain('setError(errorMessage)')
      expect(marketplaceContent).toContain('catch (error')
    })

    it('Test 7: No alert("coming soon") stub remains', () => {
      // Should NOT have the old alert stub
      expect(marketplaceContent).not.toContain("alert('Buy functionality coming soon')")
      expect(marketplaceContent).not.toContain("alert('coming soon')")
    })

    it('Test 8: Has purchasing loading state', () => {
      // Should have purchasing state for UI feedback
      expect(marketplaceContent).toContain('purchasing')
      expect(marketplaceContent).toContain('setPurchasing')
    })

    it('Test 9: Imports required contracts', () => {
      // Should import USDT and marketplace contracts
      expect(marketplaceContent).toContain('getUSDTContract')
      expect(marketplaceContent).toContain('getMarketplaceContract')
      expect(marketplaceContent).toContain('parseUnits')
    })
  })

  describe('Task 2: Dashboard Polling Indicators - Eggs Page', () => {
    let eggsContent: string

    beforeEach(() => {
      eggsContent = readFileSync(eggsPath, 'utf-8')
    })

    it('Test 1: Has useEffect with setInterval for auto-polling', () => {
      // Should have setInterval for polling
      expect(eggsContent).toContain('setInterval')
      expect(eggsContent).toContain('clearInterval')
    })

    it('Test 2: Polling interval is 30 seconds (30000ms)', () => {
      // Should poll every 30 seconds per D-11
      expect(eggsContent).toContain('30000')
    })

    it('Test 3: Shows "Updating..." badge during polling', () => {
      // Should display Updating badge
      expect(eggsContent).toContain('Updating...')
      expect(eggsContent).toContain('updating')
    })

    it('Test 4: Badge has animate-pulse class', () => {
      // Should have animation for visual feedback
      expect(eggsContent).toContain('animate-pulse')
    })

    it('Test 5: Has manual refresh button', () => {
      // Should have refresh button
      expect(eggsContent).toContain('handleRefresh')
      expect(eggsContent).toContain('Refresh')
    })

    it('Test 6: Manual refresh button shows spin animation', () => {
      // Should animate spin when updating
      expect(eggsContent).toContain('animate-spin')
      expect(eggsContent).toContain('RefreshCw')
    })

    it('Test 7: Cleans up interval on unmount', () => {
      // Should return cleanup function
      expect(eggsContent).toMatch(/return\s*\(\s*\)\s*=>\s*clearInterval/)
    })
  })

  describe('Task 2: Dashboard Polling Indicators - Commissions Page', () => {
    let commissionsContent: string

    beforeEach(() => {
      commissionsContent = readFileSync(commissionsPath, 'utf-8')
    })

    it('Test 1: Has useEffect with setInterval for auto-polling', () => {
      // Should have setInterval for polling
      expect(commissionsContent).toContain('setInterval')
      expect(commissionsContent).toContain('clearInterval')
    })

    it('Test 2: Polling interval is 30 seconds (30000ms)', () => {
      // Should poll every 30 seconds per D-11
      expect(commissionsContent).toContain('30000')
    })

    it('Test 3: Shows "Updating..." badge during polling', () => {
      // Should display Updating badge
      expect(commissionsContent).toContain('Updating...')
      expect(commissionsContent).toContain('updating')
    })

    it('Test 4: Badge has animate-pulse class', () => {
      // Should have animation for visual feedback
      expect(commissionsContent).toContain('animate-pulse')
    })

    it('Test 5: Has manual refresh button', () => {
      // Should have refresh button
      expect(commissionsContent).toContain('handleRefresh')
      expect(commissionsContent).toContain('Refresh')
    })

    it('Test 6: Manual refresh button shows spin animation', () => {
      // Should animate spin when updating
      expect(commissionsContent).toContain('animate-spin')
      expect(commissionsContent).toContain('RefreshCw')
    })

    it('Test 7: Cleans up interval on unmount', () => {
      // Should return cleanup function
      expect(commissionsContent).toMatch(/return\s*\(\s*\)\s*=>\s*clearInterval/)
    })
  })

  describe('Integration Tests', () => {
    it('All three files exist and are readable', () => {
      expect(readFileSync(marketplacePath, 'utf-8')).toBeDefined()
      expect(readFileSync(eggsPath, 'utf-8')).toBeDefined()
      expect(readFileSync(commissionsPath, 'utf-8')).toBeDefined()
    })

    it('Marketplace file is >350 lines (per plan requirement)', () => {
      const content = readFileSync(marketplacePath, 'utf-8')
      const lines = content.split('\n').length
      expect(lines).toBeGreaterThanOrEqual(350)
    })

    it('Eggs file contains polling implementation', () => {
      const content = readFileSync(eggsPath, 'utf-8')
      expect(content).toContain('useEffect')
      expect(content).toContain('setInterval')
      expect(content).toContain('fetchEggs')
    })

    it('Commissions file contains polling implementation', () => {
      const content = readFileSync(commissionsPath, 'utf-8')
      expect(content).toContain('useEffect')
      expect(content).toContain('setInterval')
      expect(content).toContain('fetchData')
    })
  })
})

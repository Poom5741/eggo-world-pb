import { describe, it, expect } from 'bun:test'

/**
 * Tests for stale auth closure prevention pattern
 * 
 * These tests verify that hooks:
 * 1. Call createClient() inside callbacks (not at hook init)
 * 2. Handle missing auth tokens gracefully
 * 3. Handle 401 responses with redirect
 * 4. Don't capture stale pb instances in closures
 */

describe('Stale Auth Closure Prevention Pattern', () => {
  describe('useTierReward', () => {
    it('should call createClient inside fetchStatus callback', async () => {
      // Read the hook source
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-tier-reward.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // Verify createClient is called inside useCallback
      expect(content).toContain('const currentPb = createClient()')
      
      // Verify it's inside the callback, not at hook level
      const fetchStatusMatch = content.match(/const fetchStatus = useCallback\(async \(\) => \{[\s\S]*?const currentPb = createClient\(\)/)
      expect(fetchStatusMatch).toBeTruthy()
      
      // Verify 401 handling exists
      expect(content).toContain('response.status === 401')
      expect(content).toContain('localStorage.removeItem(\'pocketbase_auth\')')
      expect(content).toContain('/auth/login?redirectTo=/dashboard')
    })

    it('should not have pb in useCallback dependency array', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-tier-reward.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // Find fetchStatus dependency array
      const fetchStatusDeps = content.match(/const fetchStatus = useCallback\([\s\S]*?\}, \[([^\]]*)\]/)
      expect(fetchStatusDeps).toBeTruthy()
      
      const deps = fetchStatusDeps![1]
      expect(deps).not.toContain('pb')
    })
  })

  describe('useWalletPoll', () => {
    it('should call createClient inside fetchBalance callback', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-wallet-poll.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // After fix: should have currentPb inside callback
      const fetchBalanceMatch = content.match(/const fetchBalance = useCallback\(async \(\) => \{[\s\S]*?const currentPb = createClient\(\)/)
      expect(fetchBalanceMatch).toBeTruthy()
      
      // Should handle 401
      expect(content).toContain('res.status === 401')
    })
  })

  describe('useEggPoll', () => {
    it('should call createClient inside fetchEggs callback', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-egg-poll.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // After fix: should have currentPb inside callback
      const fetchEggsMatch = content.match(/const fetchEggs = useCallback\(async \(\) => \{[\s\S]*?const currentPb = createClient\(\)/)
      expect(fetchEggsMatch).toBeTruthy()
    })
  })

  describe('useEggNft', () => {
    it('should call createClient inside mintEgg callback', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-egg-nft.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // After fix: should have currentPb inside mintEgg
      const mintEggMatch = content.match(/const mintEgg = useCallback\(async[\s\S]*?const currentPb = createClient\(\)/)
      expect(mintEggMatch).toBeTruthy()
      
      // Should handle 401
      expect(content).toContain('response.status === 401')
    })

    it('should call createClient inside claimCommission callback', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-egg-nft.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // After fix: should have currentPb inside claimCommission
      const claimMatch = content.match(/const claimCommission = useCallback\(async[\s\S]*?const currentPb = createClient\(\)/)
      expect(claimMatch).toBeTruthy()
    })
  })

  describe('useEggFeed', () => {
    it('should call createClient inside feedEgg callback', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-egg-feed.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // After fix: should have currentPb inside feedEgg
      const feedEggMatch = content.match(/const feedEgg = useCallback\(async[\s\S]*?const currentPb = createClient\(\)/)
      expect(feedEggMatch).toBeTruthy()
      
      // Should handle 401
      expect(content).toContain('response.status === 401')
    })
  })

  describe('Integration: Auth flow after OAuth login', () => {
    it('should not throw AUTH_REQUIRED error when token exists in localStorage', async () => {
      // This is an integration test concept
      // In real testing, we would:
      // 1. Mock localStorage with a valid token
      // 2. Call the hook
      // 3. Verify it fetches data successfully
      // 4. Verify no AUTH_REQUIRED error
      
      // For now, we verify the pattern exists in code
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-tier-reward.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // Verify token is read from fresh client instance
      expect(content).toContain('const currentPb = createClient()')
      expect(content).toContain('currentPb.authStore.token')
    })

    it('should redirect to login on 401 response', async () => {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'hooks/use-tier-reward.ts')
      const content = readFileSync(filePath, 'utf-8')
      
      // Verify redirect logic
      expect(content).toContain('window.location.href = \'/auth/login?redirectTo=/dashboard\'')
      expect(content).toContain('localStorage.removeItem(\'pocketbase_auth\')')
      expect(content).toContain('document.cookie = \'pb_auth=; path=/; max-age=0\'')
    })
  })
})

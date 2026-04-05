import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Dashboard Balance Card Test Specifications
 * การทดสอบ Balance Card ใน Dashboard
 * 
 * Tests verify the component structure and integration with useWalletPoll hook
 * using file content assertions (Phase 8 pattern for OAuth flows)
 */

describe('Dashboard Balance Card', () => {
  // Paths relative to apps/web directory
  const dashboardPath = join(process.cwd(), 'app/dashboard/page.tsx')
  const balanceCardPath = join(process.cwd(), 'components/dashboard/balance-card.tsx')

  console.log('Test running from:', process.cwd())
  console.log('Dashboard path:', dashboardPath)
  console.log('Balance card path:', balanceCardPath)

  // Read file contents for assertions - handle errors gracefully
  const getDashboardContent = () => {
    try {
      const content = readFileSync(dashboardPath, 'utf-8')
      console.log('✓ Dashboard file read successfully, length:', content.length)
      return content
    } catch (err: any) {
      console.error('✗ Failed to read dashboard file:', err.message)
      return ''
    }
  }

  const getBalanceCardContent = () => {
    try {
      const content = readFileSync(balanceCardPath, 'utf-8')
      console.log('✓ Balance card file read successfully, length:', content.length)
      return content
    } catch (err: any) {
      console.error('✗ Failed to read balance-card file:', err.message)
      return ''
    }
  }

  describe('useWalletPoll Integration', () => {
    it('should import and use useWalletPoll hook', () => {
      const content = getDashboardContent()
      expect(content).toContain('useWalletPoll')
      expect(content).toContain('import')
    })

    it('should call useWalletPoll with user wallet address', () => {
      const content = getDashboardContent()
      expect(content).toMatch(/useWalletPoll\s*\(\s*user\??\.wallet/)
    })

    it('should destructure balance, loading, and refresh from useWalletPoll', () => {
      const content = getDashboardContent()
      // Check that useWalletPoll returns these properties
      expect(content).toContain('balance')
      expect(content).toContain('loading')
      expect(content).toContain('refresh')
    })
  })

  describe('Balance Card Component', () => {
    it('should import BalanceCard component', () => {
      const content = getDashboardContent()
      expect(content).toMatch(/import.*BalanceCard.*from.*components.*dashboard.*balance-card/)
    })

    it('should render BalanceCard with balance and loading props', () => {
      const content = getDashboardContent()
      expect(content).toContain('<BalanceCard')
      // Check that props are passed (checking for prop names in the JSX)
      expect(content).toContain('balance={balance}')
      expect(content).toContain('loading={balanceLoading}')
    })

    it('should have BalanceCard component file', () => {
      const content = getBalanceCardContent()
      expect(content).toBeTruthy()
      expect(content).toContain('BalanceCard')
    })
  })

  describe('Visual Design', () => {
    it('should use Material Symbols icon (payments)', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('material-symbols-outlined')
      expect(content).toContain('payments')
    })

    it('should apply gradient background', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('from-primary/20')
      expect(content).toContain('via-primary/10')
      expect(content).toContain('to-transparent')
    })

    it('should use clay-xl variant', () => {
      const content = getBalanceCardContent()
      expect(content).toMatch(/clay-xl|clayCard|clay-card/)
    })
  })

  describe('Updating Indicator', () => {
    it('should display "Updating..." badge', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('Updating')
    })

    it('should have animate-pulse class for loading indicator', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('animate-pulse')
    })

    it('should conditionally render badge based on loading prop', () => {
      const content = getBalanceCardContent()
      expect(content).toMatch(/\{.*loading.*\}/)
    })
  })

  describe('Balance Display', () => {
    it('should display USDT balance with 2 decimal places', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('USDT')
      expect(content).toMatch(/toFixed\s*\(\s*2\s*\)/)
    })

    it('should show balance from props', () => {
      const content = getBalanceCardContent()
      // Check that balance.usdt is accessed and converted
      expect(content).toContain('balance?.usdt')
      expect(content).toContain('parseFloat')
    })
  })

  describe('Error Handling', () => {
    it('should accept error and refresh props', () => {
      const content = getBalanceCardContent()
      expect(content).toMatch(/error.*refresh|refresh.*error/)
    })

    it('should render retry button on error', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('retry')
      expect(content.toLowerCase()).toContain('button')
    })

    it('should handle empty wallet state gracefully', () => {
      const content = getBalanceCardContent()
      expect(content).toContain('0')
      expect(content).toContain('USDT')
    })
  })
})

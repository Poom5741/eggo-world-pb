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

  // Read file contents for assertions - handle errors gracefully
  const getDashboardContent = () => {
    try {
      const content = readFileSync(dashboardPath, 'utf-8')
      return content
    } catch (err: any) {
      return ''
    }
  }

  const getBalanceCardContent = () => {
    try {
      const content = readFileSync(balanceCardPath, 'utf-8')
      return content
    } catch (err: any) {
      return ''
    }
  }

  // BuddyChain path defined in outer describe block
  const buddyChainPath = join(process.cwd(), 'components/dashboard/buddy-chain.tsx')
  const getBuddyChainContent = () => {
    try {
      const content = readFileSync(buddyChainPath, 'utf-8')
      return content
    } catch (err: any) {
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

describe('Buddy Chain Referral Visualization', () => {
  describe('Component Structure', () => {
    it('should have BuddyChain component file', () => {
      const content = getBuddyChainContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should export BuddyChain component', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('BuddyChain')
      expect(content).toMatch(/export.*BuddyChain|function BuddyChain/)
    })

    it('should accept levels array as props', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('levels')
      expect(content).toMatch(/levels.*ReferralLevel|levels.*\[/)
    })

    it('should render 4 level cards', () => {
      const content = getBuddyChainContent()
      // Check for grid layout with 4 columns
      expect(content).toContain('grid-cols-4')
      // Check for 4 level mappings or iterations
      expect(content).toMatch(/level.*map|levels\.map|Lvl.*1.*Lvl.*2.*Lvl.*3.*Lvl.*4/)
    })
  })

  describe('Percentage Fill Visualization', () => {
    it('should display percentage fill bar for each level', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('percentage')
      expect(content).toMatch(/h-\[.*%\]|height.*percentage|bg.*\[/)
    })

    it('should use primary color for Level 1', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('primary')
      expect(content).toMatch(/L1.*primary|level.*1.*primary|bg-primary/)
    })

    it('should use secondary color for Level 2', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('secondary')
      expect(content).toMatch(/L2.*secondary|level.*2.*secondary|bg-secondary/)
    })

    it('should use tertiary color for Level 3', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('tertiary')
      expect(content).toMatch(/L3.*tertiary|level.*3.*tertiary|bg-tertiary/)
    })

    it('should use on-surface-variant color for Level 4', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('on-surface-variant')
      expect(content).toMatch(/L4.*on-surface-variant|level.*4.*on-surface-variant|bg-on-surface-variant/)
    })
  })

  describe('Card Layout', () => {
    it('should use square aspect ratio cards', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('aspect-square')
    })

    it('should use rounded-2xl for cards', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('rounded-2xl')
    })

    it('should use clay-card-inset variant', () => {
      const content = getBuddyChainContent()
      expect(content).toMatch(/clay-card-inset|clayCardInset|clayInset/)
    })

    it('should display percentage overlay', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('%')
      expect(content).toMatch(/pixel-font.*text-2xl|text-2xl.*percentage/)
    })
  })

  describe('Level Labels and Buddy Count', () => {
    it('should display level labels (Lvl 1-4)', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('Lvl')
      expect(content).toMatch(/Lvl.*1|Level.*1|lvl.*1/)
    })

    it('should display buddy count format', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('Buddies')
      expect(content).toMatch(/count.*Buddies|Buddies.*count/)
    })

    it('should show commission percentages (20%, 10%, 10%, 10%)', () => {
      const content = getBuddyChainContent()
      expect(content).toContain('20')
      expect(content).toContain('10')
      expect(content).toMatch(/commissionRate|commission.*rate|20.*10.*10.*10/)
    })
  })

  describe('Data Types and Interfaces', () => {
    it('should define ReferralLevel interface', () => {
      const content = getBuddyChainContent()
      expect(content).toMatch(/interface.*ReferralLevel|type.*ReferralLevel/)
    })

    it('should define BuddyChainProps interface', () => {
      const content = getBuddyChainContent()
      expect(content).toMatch(/interface.*BuddyChainProps|type.*BuddyChainProps/)
    })
  })
})

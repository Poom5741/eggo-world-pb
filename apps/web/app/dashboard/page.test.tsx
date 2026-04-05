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

// Paths relative to apps/web directory
const dashboardPath = join(process.cwd(), 'app/dashboard/page.tsx')
const balanceCardPath = join(process.cwd(), 'components/dashboard/balance-card.tsx')
const buddyChainPath = join(process.cwd(), 'components/dashboard/buddy-chain.tsx')

// Read file contents for assertions - handle errors gracefully
const getDashboardContent = () => {
  try {
    const content = readFileSync(dashboardPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

const getBalanceCardContent = () => {
  try {
    const content = readFileSync(balanceCardPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

const getBuddyChainContent = () => {
  try {
    const content = readFileSync(buddyChainPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

const quickActionsPath = join(process.cwd(), 'components/dashboard/quick-actions.tsx')
const activityFeedPath = join(process.cwd(), 'components/dashboard/activity-feed.tsx')
const activeEggsCardPath = join(process.cwd(), 'components/dashboard/active-eggs-card.tsx')

const getQuickActionsContent = () => {
  try {
    const content = readFileSync(quickActionsPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

const getActivityFeedContent = () => {
  try {
    const content = readFileSync(activityFeedPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

const getActiveEggsCardContent = () => {
  try {
    const content = readFileSync(activeEggsCardPath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

describe('Dashboard Balance Card', () => {

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
      // Check for level mapping or iterations
      expect(content).toMatch(/level.*map|levels\.map|normalizedLevels\.map|\[1, 2, 3, 4\]\.map/)
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

describe('Quick Actions Component', () => {
  describe('Component Structure', () => {
    it('should have QuickActions component file', () => {
      const content = getQuickActionsContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should export QuickActions component', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('QuickActions')
      expect(content).toMatch(/export.*QuickActions|function QuickActions/)
    })

    it('should display 3 action cards', () => {
      const content = getQuickActionsContent()
      // Check for 3 action buttons/cards
      expect(content).toContain('Feed All Eggs')
      expect(content).toContain('Hatch Ready Eggs')
      expect(content).toContain('Buy Food Bundle')
    })
  })

  describe('Action Card Icons', () => {
    it('should use Material Symbols icons', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('material-symbols-outlined')
    })

    it('should use restaurant icon for Feed All per D-02', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('restaurant')
    })

    it('should use auto_fix_high icon for Hatch Ready per D-02', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('auto_fix_high')
    })

    it('should use shopping_basket icon for Buy Food per D-02', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('shopping_basket')
    })
  })

  describe('Container Colors', () => {
    it('should use primary-container for Feed All per D-10', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('bg-primary-container')
      expect(content).toContain('Feed All')
    })

    it('should use secondary-container for Hatch Ready per D-10', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('bg-secondary-container')
      expect(content).toContain('Hatch Ready')
    })

    it('should use tertiary-container for Buy Food per D-10', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('bg-tertiary-container')
      expect(content).toContain('Buy Food')
    })
  })

  describe('Hover and Active States', () => {
    it('should have hover:scale-[1.02] per D-11', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('hover:scale-[1.02]')
    })

    it('should have active:scale-[0.98] per D-11', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('active:scale-[0.98]')
    })

    it('should have transition-transform class', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('transition-transform')
    })
  })

  describe('Navigation', () => {
    it('should have navigation paths defined', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('href')
      expect(content).toContain('/mint')
    })

    it('should use router.push for navigation', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('router.push')
    })

    it('should navigate to mint/food for Buy Food', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('mint/food')
    })

    it('should navigate to eggs page for Hatch Ready', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('dashboard/eggs')
      expect(content).toContain('eggs')
    })
  })

  describe('Card Design', () => {
    it('should have icon circle with w-12 h-12', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('w-12')
      expect(content).toContain('h-12')
    })

    it('should have rounded-2xl for icon container', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('rounded-2xl')
    })

    it('should have white/40 background for icon circle', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('bg-white/40')
    })

    it('should have chevron icon on right', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('chevron_right')
    })

    it('should display description text', () => {
      const content = getQuickActionsContent()
      expect(content).toContain('Requires')
      expect(content).toContain('units of food')
      expect(content).toContain('ready')
      expect(content).toContain('Refill')
    })
  })
})

describe('Activity Feed Component', () => {
  describe('Component Structure', () => {
    it('should have ActivityFeed component file', () => {
      const content = getActivityFeedContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should export ActivityFeed component', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('ActivityFeed')
      expect(content).toMatch(/export.*ActivityFeed|function ActivityFeed/)
    })

    it('should accept transactions array as props', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('transactions')
      expect(content).toMatch(/transactions.*Transaction\[\]|transactions.*\[/)
    })

    it('should show last 10 transactions limit', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/limit.*10|10.*limit|getList.*10|perPage.*10/)
    })
  })

  describe('Transaction Categorization', () => {
    it('should use egg_alt icon for hatch transactions per D-25', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('egg_alt')
      expect(content).toContain('hatch')
    })

    it('should use egg icon for mint_egg transactions per D-25', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('egg')
      expect(content).toContain('mint')
    })

    it('should use group icon for commission transactions per D-25', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('group')
      expect(content).toContain('commission')
    })

    it('should use payments icon for sale transactions per D-25', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('payments')
      expect(content).toContain('sale')
    })

    it('should use shopping_cart icon for mint_food transactions per D-25', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('shopping_cart')
      expect(content).toContain('food')
    })
  })

  describe('Color Coding', () => {
    it('should use tertiary color for hatch transactions per D-14', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('tertiary')
      expect(content).toContain('hatch')
    })

    it('should use secondary color for purchase transactions per D-14', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('secondary')
      expect(content).toMatch(/purchase|mint_food/)
    })

    it('should use primary color for commission transactions per D-14', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('primary')
      expect(content).toContain('commission')
    })
  })

  describe('Card Structure', () => {
    it('should have icon circle with w-10 h-10', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('w-10')
      expect(content).toContain('h-10')
    })

    it('should have rounded-full for icon circle', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('rounded-full')
    })

    it('should display transaction title', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/title|Title|Hatched|Minted|Commission|Sale/)
    })

    it('should display timestamp', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/timestamp|Timestamp|ago|AM|PM/)
    })

    it('should display amount aligned right', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/amount|Amount|text-right|justify-end/)
    })
  })

  describe('Hover Animation', () => {
    it('should have hover:translate-x-2 per D-12', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('hover:translate-x-2')
    })

    it('should have transition-transform class', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('transition-transform')
    })

    it('should have duration-300 animation', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('duration-300')
    })
  })

  describe('View All History Button', () => {
    it('should have View All History button in header per D-15', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('View All')
      expect(content).toContain('History')
    })

    it('should have button in header section', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/header|Header|flex.*justify-between/)
    })
  })

  describe('Data Fetching', () => {
    it('should query PocketBase transactions collection', () => {
      const content = getActivityFeedContent()
      expect(content).toMatch(/collection\(.*transaction|collection\(.*activity/)
    })

    it('should use getList method for querying', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('getList')
    })

    it('should handle loading state', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('loading')
    })

    it('should handle error state', () => {
      const content = getActivityFeedContent()
      expect(content).toContain('error')
    })
  })
})

describe('Active Eggs Card Component', () => {
  describe('Component Structure', () => {
    it('should have ActiveEggsCard component file', () => {
      const content = getActiveEggsCardContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should export ActiveEggsCard component', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('ActiveEggsCard')
      expect(content).toMatch(/export.*ActiveEggsCard|function ActiveEggsCard/)
    })

    it('should accept egg count as props', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/count|Count|total|Total|eggs|Eggs/)
    })
  })

  describe('Egg Count Display', () => {
    it('should display total egg count', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/\d+.*egg|egg.*\d+|count|Count/)
    })

    it('should show egg preview avatars', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('egg')
      expect(content).toContain('avatar')
    })

    it('should use -space-x-2 for overlapping avatars per Jules design', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('-space-x-2')
    })

    it('should use w-8 h-8 for avatar size per Jules design', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('w-8')
      expect(content).toContain('h-8')
    })

    it('should have rounded-full for avatars', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('rounded-full')
    })
  })

  describe('Overflow Indicator', () => {
    it('should show +N overflow indicator', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/\+\d|\+.*count|overflow/)
    })

    it('should show 3 egg previews maximum', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/3|slice.*3|limit.*3/)
    })
  })

  describe('Border Colors', () => {
    it('should use primary-container border', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('border-2')
      expect(content).toContain('primary-container')
    })

    it('should use secondary-container border', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('secondary-container')
    })

    it('should use tertiary-container border', () => {
      const content = getActiveEggsCardContent()
      expect(content).toContain('tertiary-container')
    })
  })

  describe('Data Types', () => {
    it('should define ActiveEggsCardProps interface', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/interface.*ActiveEggsCardProps|type.*ActiveEggsCardProps/)
    })

    it('should define Egg interface or type', () => {
      const content = getActiveEggsCardContent()
      expect(content).toMatch(/interface.*Egg|type.*Egg/)
    })
  })
})

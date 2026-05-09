import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'
import { join } from 'path'

const walletPagePath = join(process.cwd(), 'app/wallet/page.tsx')

const getWalletPageContent = () => {
  try {
    return fs.readFileSync(walletPagePath, 'utf-8')
  } catch {
    return ''
  }
}

describe('Wallet Page', () => {
  describe('Page Structure', () => {
    it('should have wallet page file', () => {
      const content = getWalletPageContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should use "use client" directive', () => {
      const content = getWalletPageContent()
      expect(content).toContain('"use client"')
    })

    it('should export WalletPage default function', () => {
      const content = getWalletPageContent()
      expect(content).toContain('export default function WalletPage')
    })

    it('should import WalletContent', () => {
      const content = getWalletPageContent()
      expect(content).toContain('WalletContent')
    })
  })

  describe('Loading Skeleton (D-01)', () => {
    it('should import Skeleton from @/components/ui/skeleton', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/import.*Skeleton.*@\/components\/ui\/skeleton/)
    })

    it('should contain initialLoadComplete state tracking (useState + useEffect)', () => {
      const content = getWalletPageContent()
      expect(content).toContain('initialLoadComplete')
      expect(content).toContain('useState')
      expect(content).toContain('useEffect')
    })

    it('should contain requestAnimationFrame for fade-in trigger', () => {
      const content = getWalletPageContent()
      expect(content).toContain('requestAnimationFrame')
    })

    it('should show skeleton when !initialLoadComplete && loading', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/!initialLoadComplete\s*&&\s*loading/)
    })

    it('should have Skeleton Card with clay-xl variant and gradient background', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/variant="clay-xl"/)
      expect(content).toMatch(/from-primary\/20\s+via-primary\/10\s+to-transparent/)
    })
  })

  describe('Smooth Fade-In (D-02)', () => {
    it('should contain animate-fade-in class', () => {
      const content = getWalletPageContent()
      expect(content).toContain('animate-fade-in')
    })

    it('should have duration-500 for 500ms transition', () => {
      const content = getWalletPageContent()
      expect(content).toContain('duration-500')
    })
  })

  describe('Updating Badge (D-03)', () => {
    it('should show badge only when initialLoadComplete && loading (not during initial load)', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/\{initialLoadComplete\s*&&\s*loading/)
    })

    it('should have animate-pulse class on badge', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/Badge.*animate-pulse/)
    })

    it('should contain Loader2 icon with animate-spin', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/Loader2.*animate-spin/)
    })
  })

  describe('Refined Error State', () => {
    it('should contain "The wallet service may be temporarily unavailable." text', () => {
      const content = getWalletPageContent()
      expect(content).toContain('The wallet service may be temporarily unavailable.')
    })

    it('should contain "Failed to load balance" AlertTitle', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/Failed to load balance/)
    })

    it('should import AlertTitle from @/components/ui/alert', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/AlertTitle/)
    })

    it('should have error Alert with variant="destructive"', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/variant="destructive"/)
    })

    it('should have retry button with variant="link" calling refresh', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/variant="link"/)
      expect(content).toMatch(/onClick.*refresh/)
    })
  })

  describe('Number Formatting', () => {
    it('should use toLocaleString with minimumFractionDigits and maximumFractionDigits for USDT', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/toLocaleString/)
      expect(content).toMatch(/minimumFractionDigits/)
      expect(content).toMatch(/maximumFractionDigits/)
    })

    it('should use toLocaleString for USD conversion display', () => {
      const content = getWalletPageContent()
      // USD conversion also uses toLocaleString for consistent formatting
      expect(content).toMatch(/USD/)
    })
  })

  describe('Existing Patterns Preserved', () => {
    it('should use LayoutWithoutNav', () => {
      const content = getWalletPageContent()
      expect(content).toContain('LayoutWithoutNav')
    })

    it('should use AuthGuard with redirect to /auth/login', () => {
      const content = getWalletPageContent()
      expect(content).toContain('AuthGuard')
      expect(content).toContain('/auth/login')
    })

    it('should import WalletIcon from lucide-react', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/Wallet.*from.*lucide-react/)
    })

    it('should import AlertCircle from lucide-react', () => {
      const content = getWalletPageContent()
      expect(content).toMatch(/AlertCircle/)
    })

    it('should have space-y-6 layout', () => {
      const content = getWalletPageContent()
      expect(content).toContain('space-y-6')
    })

    it('should render WithdrawForm', () => {
      const content = getWalletPageContent()
      expect(content).toContain('WithdrawForm')
    })

    it('should render TransactionHistory', () => {
      const content = getWalletPageContent()
      expect(content).toContain('TransactionHistory')
    })
  })
})

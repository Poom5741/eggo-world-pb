import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import BottomNavMobile from './BottomNavMobile'

// Mock next/link at module level
const mockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href} data-testid="mock-link">{children}</a>
)

// Mock usePathname
const mockUsePathname = () => '/'

// Override the module resolution for next/link
const originalRequire = require
require = function(path: string) {
  if (path === 'next/link') {
    return { default: mockLink }
  }
  if (path === 'next/navigation') {
    return { usePathname: mockUsePathname }
  }
  return originalRequire.apply(this, arguments as any)
} as any

describe('BottomNavMobile', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('visible on mobile (no standalone hidden class)', () => {
    render(<BottomNavMobile />)
    const nav = document.querySelector('nav')
    expect(nav).toBeInTheDocument()
    // Should have lg:hidden for desktop but not standalone 'hidden' class
    // Check that 'hidden' only appears as part of responsive classes like 'lg:hidden'
    const classList = nav?.className.split(' ') || []
    const hasStandaloneHidden = classList.some(cls => cls === 'hidden' && !cls.includes(':'))
    expect(hasStandaloneHidden).toBe(false)
  })

  it('hidden on desktop (has lg:hidden class)', () => {
    render(<BottomNavMobile />)
    const nav = document.querySelector('nav')
    expect(nav).toBeInTheDocument()
    expect(nav?.className).toContain('lg:hidden')
  })

  it('renders 4-5 navigation items with Material Symbols icons', () => {
    render(<BottomNavMobile />)
    
    // Check for Material Symbols icon spans
    const icons = document.querySelectorAll('.material-symbols-outlined')
    expect(icons.length).toBeGreaterThanOrEqual(4)
    expect(icons.length).toBeLessThanOrEqual(5)
  })

  it('includes: Dashboard, Eggs, Market, Wallet, Profile links', () => {
    render(<BottomNavMobile />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
    expect(screen.getByText('Market')).toBeInTheDocument()
    expect(screen.getByText('Wallet')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('fixed position at bottom (bottom-0, h-20 or h-24)', () => {
    render(<BottomNavMobile />)
    const nav = document.querySelector('nav')
    expect(nav).toBeInTheDocument()
    expect(nav?.className).toContain('bottom-0')
    // Height should be either h-20 or h-24
    expect(nav?.className).toMatch(/h-(20|24)/)
  })

  it('includes safe area padding for iOS (pb-safe or equivalent)', () => {
    render(<BottomNavMobile />)
    const nav = document.querySelector('nav') as HTMLElement
    const innerDiv = nav?.querySelector('div')
    expect(nav).toBeInTheDocument()
    // Check that the inner div has bottom padding for safe area support
    expect(innerDiv?.className).toContain('pb-6')
  })
})

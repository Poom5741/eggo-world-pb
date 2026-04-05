import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import TopNav from './TopNav'

// Mock next/link at module level
const mockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href} data-testid="mock-link">{children}</a>
)

// Override the module resolution for next/link
const originalRequire = require
require = function(path: string) {
  if (path === 'next/link') {
    return { default: mockLink }
  }
  return originalRequire.apply(this, arguments as any)
} as any

describe('TopNav', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders EggoWorld logo as link to /', () => {
    render(<TopNav />)
    const logoLink = screen.getByText('EggoWorld')
    expect(logoLink).toBeInTheDocument()
    expect(logoLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('displays Dashboard navigation link', () => {
    render(<TopNav />)
    const dashboardLink = screen.getByText('Dashboard')
    expect(dashboardLink).toBeInTheDocument()
  })

  it('displays Marketplace navigation link', () => {
    render(<TopNav />)
    const marketplaceLink = screen.getByText('Marketplace')
    expect(marketplaceLink).toBeInTheDocument()
  })

  it('includes Material Symbols icons (account_balance_wallet, notifications)', () => {
    render(<TopNav />)
    const walletIcon = screen.getByText('account_balance_wallet')
    const notificationsIcon = screen.getByText('notifications')
    expect(walletIcon).toBeInTheDocument()
    expect(notificationsIcon).toBeInTheDocument()
  })

  it('has Connect Wallet button with clay-button class', () => {
    render(<TopNav />)
    const connectButton = screen.getByRole('button', { name: /connect wallet/i })
    expect(connectButton).toBeInTheDocument()
    expect(connectButton).toHaveClass('clay-button')
  })
})

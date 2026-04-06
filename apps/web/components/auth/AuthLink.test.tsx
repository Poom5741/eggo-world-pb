import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockIsAuthenticated = vi.fn()
let mockIsHydrated = true

vi.mock('@/lib/pocketbase/client', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}))

vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: () => mockIsHydrated,
}))

import { AuthLink } from './AuthLink'

describe('AuthLink', () => {
  beforeEach(() => {
    mockIsAuthenticated.mockReset()
    mockIsHydrated = true
  })

  it('renders with correct href when authenticated', () => {
    mockIsAuthenticated.mockReturnValue(true)
    render(<AuthLink href="/dashboard">Dashboard</AuthLink>)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link?.getAttribute('href')).toBe('/dashboard')
  })

  it('renders with /join href when not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false)
    render(<AuthLink href="/dashboard">Dashboard</AuthLink>)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link?.getAttribute('href')).toBe('/join')
  })

  it('forwards className prop', () => {
    mockIsAuthenticated.mockReturnValue(true)
    render(<AuthLink href="/dashboard" className="custom-class">Dashboard</AuthLink>)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link).toHaveClass('custom-class')
  })

  it('forwards other props to Link', () => {
    mockIsAuthenticated.mockReturnValue(true)
    render(<AuthLink href="/dashboard" data-custom="value">Dashboard</AuthLink>)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link).toHaveAttribute('data-custom', 'value')
  })

  it('renders children correctly', () => {
    mockIsAuthenticated.mockReturnValue(true)
    render(<AuthLink href="/dashboard">Click Me</AuthLink>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('redirects with query param for non-dashboard paths when not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false)
    render(<AuthLink href="/marketplace">Marketplace</AuthLink>)
    const link = screen.getByText('Marketplace').closest('a')
    expect(link?.getAttribute('href')).toBe('/join?redirectTo=%2Fmarketplace')
  })

  it('renders correctly when not hydrated', () => {
    mockIsAuthenticated.mockReturnValue(false)
    mockIsHydrated = false
    render(<AuthLink href="/dashboard">Dashboard</AuthLink>)
    const link = screen.getByText('Dashboard').closest('a')
    expect(link?.getAttribute('href')).toBe('/join')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
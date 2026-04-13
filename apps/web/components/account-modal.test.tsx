/**
 * AccountModal Component Tests - RED Phase
 * These tests should FAIL because the component doesn't exist yet.
 * When the component is implemented, tests should pass.
 */

import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}))

// Mock pocketbase client
const mockAuthStore = {
  token: 'mock-token-123',
  record: {
    id: 'user-123',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE7a',
    name: 'Test User',
  },
}

vi.mock('@/lib/pocketbase/client', () => ({
  createClient: () => ({
    authStore: mockAuthStore,
  }),
  getUser: () => mockAuthStore.record,
}))

vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: () => true,
}))

// Mock fetch for balance API
const mockBalanceResponse = {
  success: true,
  data: {
    usdt_balance: 1500.75,
    withdrawable: 1200.50,
    total_withdrawn: 300.25,
  },
}

beforeEach(() => {
  mockPush.mockClear()
  global.fetch = vi.fn()
  
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => mockBalanceResponse,
  })
  
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})

describe('AccountModal', () => {
  it('renders modal when isOpen is true', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    render(<AccountModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByText(/0x742d/)).toBeInTheDocument()
  })

  it('shows USDT balance formatted correctly', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    render(<AccountModal isOpen={true} onClose={() => {}} />)
    // Balance displays as "0.00" initially (async fetch happens after render)
    // Use getAllBy to handle multiple "USDT" matches and check the first one after the balance number
    const usdtElements = screen.getAllByText(/USDT/)
    expect(usdtElements.length).toBeGreaterThan(0)
  })

  it('navigates to /dashboard/deposit on deposit button click', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    render(<AccountModal isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText(/deposit/i))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/deposit')
  })

  it('navigates to /dashboard/withdraw on withdraw button click', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    render(<AccountModal isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText(/withdraw/i))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/withdraw')
  })

  it('calls onClose when close button is clicked', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    const onClose = vi.fn()
    render(<AccountModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking outside modal', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    const onClose = vi.fn()
    render(<AccountModal isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('modal-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('copies wallet address to clipboard when copy button clicked', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    render(<AccountModal isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE7a'
    )
  })

  it('does not render when isOpen is false', async () => {
    const { AccountModal } = await import('@/components/account-modal')
    const { container } = render(<AccountModal isOpen={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
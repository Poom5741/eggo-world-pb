import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BalanceModal } from './balance-modal'

// Mock useTransactionHistory hook
vi.mock('@/hooks/use-transaction-history', () => ({
  useTransactionHistory: vi.fn()
}))

import { useTransactionHistory } from '@/hooks/use-transaction-history'

const mockUseTransactionHistory = useTransactionHistory as ReturnType<typeof vi.fn>

describe('BalanceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders balance breakdown when open', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '150.50',
          pending: '25.00',
          nftValue: '75.00'
        }}
      />
    )
    expect(screen.getByText('Wallet Balance')).toBeTruthy()
    expect(screen.getByText('150.50 USDT')).toBeTruthy()
    expect(screen.getByText('25.00 USDT')).toBeTruthy()
    expect(screen.getByText('75.00 USDT')).toBeTruthy()
  })

  it('shows default zero balance when balance prop not provided', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
      />
    )
    expect(screen.getAllByText('0.00 USDT').length).toBeGreaterThanOrEqual(2)
  })

  it('shows loading state for transactions', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [],
      loading: true,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays transaction history', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [
        {
          id: 'tx1',
          type: 'mint',
          amount: '10',
          status: 'confirmed',
          timestamp: '2026-04-19T10:00:00.000Z',
          tx_hash: '0x123',
          description: 'Mint Food NFT'
        }
      ],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('mint')).toBeTruthy()
    expect(screen.getByText('+10 USDT')).toBeTruthy()
    expect(screen.getByText('confirmed')).toBeTruthy()
  })

  it('shows empty state when no transactions', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('No transactions yet')).toBeTruthy()
  })

  it('renders BSCScan link for transactions with tx_hash', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [
        {
          id: 'tx1',
          type: 'deposit',
          amount: '50',
          status: 'confirmed',
          timestamp: '2026-04-19T10:00:00.000Z',
          tx_hash: '0xabc123',
          description: 'USDT Deposit'
        }
      ],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    const bscscanLink = screen.getByText('View on BSCScan')
    expect(bscscanLink).toBeTruthy()
    expect(bscscanLink.getAttribute('href')).toBe('https://bscscan.com/tx/0xabc123')
    expect(bscscanLink.getAttribute('target')).toBe('_blank')
  })

  it('shows negative amount for withdrawal transactions', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [
        {
          id: 'tx1',
          type: 'withdrawal',
          amount: '25',
          status: 'confirmed',
          timestamp: '2026-04-19T10:00:00.000Z',
          tx_hash: '0xdef456',
          description: 'USDT Withdrawal'
        }
      ],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('-25 USDT')).toBeTruthy()
  })

  it('shows different icons for different transaction types', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [
        {
          id: 'tx1',
          type: 'mint',
          amount: '10',
          status: 'confirmed',
          timestamp: '2026-04-19T10:00:00.000Z',
          tx_hash: '0x123',
          description: 'Mint'
        },
        {
          id: 'tx2',
          type: 'check-in',
          amount: '1',
          status: 'confirmed',
          timestamp: '2026-04-19T11:00:00.000Z',
          tx_hash: '0x456',
          description: 'Check-in'
        }
      ],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('add_circle')).toBeTruthy()
    expect(screen.getByText('emoji_events')).toBeTruthy()
  })

  it('shows pending status badge for unconfirmed transactions', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [
        {
          id: 'tx1',
          type: 'deposit',
          amount: '100',
          status: 'pending',
          timestamp: '2026-04-19T10:00:00.000Z',
          tx_hash: null,
          description: 'Pending Deposit'
        }
      ],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '100.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('pending')).toBeTruthy()
  })

  it('shows Recent Transactions header', () => {
    mockUseTransactionHistory.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
      refresh: vi.fn()
    })

    render(
      <BalanceModal
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        balance={{
          usdt: '100.00',
          pending: '0.00',
          nftValue: '0.00'
        }}
      />
    )
    expect(screen.getByText('Recent Transactions')).toBeTruthy()
  })
})

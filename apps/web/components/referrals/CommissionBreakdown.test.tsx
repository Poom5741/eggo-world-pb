import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { CommissionBreakdown } from './CommissionBreakdown'

// Shared mock for getList across all createClient() calls
const mockGetList = vi.fn()

vi.mock('@/lib/pocketbase/client', () => ({
  createClient: vi.fn(() => ({
    collection: vi.fn((_name: string) => ({
      getList: mockGetList,
    })),
  })),
}))

describe('CommissionBreakdown', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton during fetch', () => {
    mockGetList.mockImplementation(
      () => new Promise(() => {})
    )

    render(<CommissionBreakdown userId={mockUserId} />)

    const loadingElements = screen.getAllByRole('generic')
      .filter(el => el.className?.includes('animate-pulse'))
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no referrals', async () => {
    mockGetList.mockResolvedValue({ items: [] })

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText(/NO REFERRALS YET/i)).toBeInTheDocument()
      expect(screen.getByText(/Share your referral link/i)).toBeInTheDocument()
    })
  })

  it('renders 4 cards with correct percentages', async () => {
    const mockCommissions = {
      items: [
        { level: 1, amount: '20', source_user: 'user1' },
        { level: 1, amount: '30', source_user: 'user2' },
        { level: 2, amount: '10', source_user: 'user3' },
        { level: 3, amount: '10', source_user: 'user4' },
        { level: 4, amount: '10', source_user: 'user5' },
      ],
    }

    mockGetList.mockResolvedValue(mockCommissions)

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getAllByText(/G1/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/G2/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/G3/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/G4/i).length).toBeGreaterThanOrEqual(1)

      expect(screen.getAllByText(/20%/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/10%/i).length).toBeGreaterThanOrEqual(3)
    })
  })

  it('displays correct buddy count and earned amount', async () => {
    const mockCommissions = {
      items: [
        { level: 1, amount: '20.50', source_user: 'user1' },
        { level: 1, amount: '30.75', source_user: 'user2' },
        { level: 2, amount: '10.00', source_user: 'user3' },
      ],
    }

    mockGetList.mockResolvedValue(mockCommissions)

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText(/2 Buddies/i)).toBeInTheDocument()
      expect(screen.getByText('51.25 USDT')).toBeInTheDocument()
    })
  })
})

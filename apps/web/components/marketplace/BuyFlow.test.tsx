import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BuyFlow, type BuyFlowProps } from './BuyFlow'

const mockPush = vi.fn()
const mockToast = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: vi.fn(() => true),
}))

vi.mock('@/lib/pocketbase/client', () => ({
  createClient: vi.fn(() => ({
    authStore: { token: 'mock-token', record: { id: 'user123' } },
  })),
  getUser: vi.fn(() => ({
    id: 'user123',
    wallet: '0x1234567890123456789012345678901234567890',
  })),
}))

describe('BuyFlow Component', () => {
  const defaultProps: BuyFlowProps = {
    listingId: '123',
    price: 100,
    priceWei: BigInt('100000000000000000000'),
    nftName: 'Golden Chicken #42',
    nftType: 'egg',
    _nftImage: '/images/nft.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders buy button with correct price', () => {
    render(<BuyFlow {...defaultProps} />)

    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    expect(buyButton).toBeInTheDocument()
  })

  it('shows shopping cart icon on buy button', () => {
    render(<BuyFlow {...defaultProps} />)

    const icon = screen.getByText('shopping_cart')
    expect(icon).toBeInTheDocument()
  })

  it('opens purchase dialog when buy button is clicked', async () => {
    render(<BuyFlow {...defaultProps} />)

    // Wait for hydration to complete
    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
      expect(buyButton).not.toBeDisabled()
    })

    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    fireEvent.click(buyButton)

    await waitFor(() => {
      expect(screen.getAllByText('Confirm Purchase').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows item details in confirmation dialog', async () => {
    render(<BuyFlow {...defaultProps} />)

    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
      fireEvent.click(buyButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Golden Chicken #42')).toBeInTheDocument()
    })
  })

  it('shows price in confirmation dialog', async () => {
    render(<BuyFlow {...defaultProps} />)

    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
      fireEvent.click(buyButton)
    })

    await waitFor(() => {
      expect(screen.getByText('100.00 USDT')).toBeInTheDocument()
    })
  })

  it('shows platform fee info in dialog', async () => {
    render(<BuyFlow {...defaultProps} />)

    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
      fireEvent.click(buyButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Platform Fee \(4%\)/i)).toBeInTheDocument()
    })
  })

  it('shows purchase confirmation button', async () => {
    render(<BuyFlow {...defaultProps} />)

    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
      fireEvent.click(buyButton)
    })

    await waitFor(() => {
      expect(screen.getAllByText('Confirm Purchase').length).toBeGreaterThanOrEqual(1)
    })
  })
})

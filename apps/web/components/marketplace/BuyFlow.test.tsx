import { describe, it, expect, vi } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BuyFlow, type BuyFlowProps } from './BuyFlow'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(() => {}),
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(() => {}),
  }),
}))

vi.mock('@/lib/contracts/eggNft', () => ({
  getSigner: vi.fn(async () => ({
    getAddress: vi.fn(async () => '0x1234567890123456789012345678901234567890'),
  })),
}))

vi.mock('@/lib/contracts/usdt', () => ({
  checkAllowance: vi.fn(async () => 0n),
  approveUSDT: vi.fn(async () => true),
}))

vi.mock('@/lib/contracts/marketplace', () => ({
  buyNFT: vi.fn(async () => true),
  MARKETPLACE_ADDRESS: '0xMARKETPLACE',
}))

describe('BuyFlow Component', () => {
  const defaultProps: BuyFlowProps = {
    listingId: '123',
    price: 100,
    priceWei: BigInt('100000000000000000000'),
    nftName: 'Golden Chicken #42',
    _nftImage: '/images/nft.png',
  }

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

  it('opens approval dialog when buy button is clicked', async () => {
    render(<BuyFlow {...defaultProps} />)
    
    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    fireEvent.click(buyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Approve USDT')).toBeInTheDocument()
    })
  })

  it('shows approval required message in dialog', async () => {
    render(<BuyFlow {...defaultProps} />)
    
    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    fireEvent.click(buyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/อนุญาตให้ marketplace ใช้ USDT ของคุณ/i)).toBeInTheDocument()
    })
  })

  it('displays step indicators in approval process', async () => {
    render(<BuyFlow {...defaultProps} />)
    
    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    fireEvent.click(buyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Step 1\/2: Approving USDT/i)).toBeInTheDocument()
    })
  })

  it('shows MetaMask instruction text', async () => {
    render(<BuyFlow {...defaultProps} />)
    
    const buyButton = screen.getByRole('button', { name: /Buy for 100\.00 USDT/i })
    fireEvent.click(buyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/กรุณายืนยันธุรกรรมใน MetaMask/i)).toBeInTheDocument()
    })
  })
})

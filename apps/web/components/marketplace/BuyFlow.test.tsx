import { describe, it, expect, mock } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BuyFlow, type BuyFlowProps } from './BuyFlow'

mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(() => {}),
  }),
}))

mock.module('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mock(() => {}),
  }),
}))

mock.module('@/lib/contracts/eggNft', () => ({
  getSigner: mock(async () => ({
    getAddress: mock(async () => '0x1234567890123456789012345678901234567890'),
  })),
}))

mock.module('@/lib/contracts/usdt', () => ({
  checkAllowance: mock(async () => 0n),
  approveUSDT: mock(async () => true),
}))

mock.module('@/lib/contracts/marketplace', () => ({
  buyNFT: mock(async () => true),
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
